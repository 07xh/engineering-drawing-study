'use strict';
/**
 * 08 human review of CAD candidates. The source DXF is neither a set of known
 * problem givens nor a CAD answer until an explicit review decision labels
 * every entity. This is an 08 input stage, NOT another solver or 07 timeline.
 * It deliberately NEVER upgrades to solved/first-angle/V5 verified.
 */
const VERSION='draftai-cad-role-review/1.0.0';
const DECISIONS=new Set(['given','reference-answer','exclude']);
const DIM_KINDS=new Set(['radius','diameter','length','angle']);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function validateSource(source){
 if(!plain(source)||source.schema!=='draftai-cad-source-review/1.0.0'||
    source.status!=='requires-human-review'||
    !/^[a-f0-9]{64}$/.test(source.source?.sha256||'')||
    !Array.isArray(source.entities)||source.entities.length>3000||
    source.entities.some(e=>!e||!/^cad-\d{5}$/.test(e.id)||!['candidate-only','unsupported'].includes(e.status))||
    new Set(source.entities.map(e=>e.id)).size!==source.entities.length)
  throw new TypeError('bounded source-backed CAD review manifest required');
 return source;
}
function validateSession(source,session){
 validateSource(source);
 if(!plain(session)||session.schema!==VERSION||session.sourceSha256!==source.source.sha256||
    !Number.isSafeInteger(session.revision)||session.revision<0||
    !plain(session.decisions)||!plain(session.units))
  throw new TypeError('stale, foreign or invalid CAD review session');
 if(Object.keys(session.decisions).some(id=>!source.entities.some(x=>x.id===id)))
  throw new RangeError('unknown CAD review entity reference');
 return session;
}
function newCadRoleReview(source){
 validateSource(source);
 return {schema:VERSION,revision:0,sourceSha256:source.source.sha256,
  units:{reviewed:false,mmPerDxfUnit:null,confirmationSource:null},
  decisions:{}};
}
function confirmCadModelUnits(source,session,{
 expectedRevision,reviewedBy,mmPerDxfUnit,confirmationSource
}={}){
 validateSession(source,session);
 if(expectedRevision!==session.revision||reviewedBy!=='user')
  throw new RangeError('stale or unapproved CAD model unit decision');
 if(!finite(mmPerDxfUnit)||mmPerDxfUnit<=0||mmPerDxfUnit>1e6||
    mmPerDxfUnit<1e-9||!['matched-INSUNITS','manual-calibration'].includes(confirmationSource))
  throw new TypeError('explicit bounded CAD model-mm scale/source required');
 if(confirmationSource==='matched-INSUNITS'&&
    (source.units.insunits!==4||Math.abs(mmPerDxfUnit-1)>1e-12))
  throw new TypeError('DXF INSUNITS alone cannot certify a non-mm conversion');
 return {...session,revision:session.revision+1,
  units:{reviewed:true,mmPerDxfUnit,confirmationSource}};
}
function reviewCadEntity(source,session,{expectedRevision,id,role,reviewedBy,
 dimension=null,reason=''}={}){
 validateSession(source,session);
 if(expectedRevision!==session.revision||reviewedBy!=='user')
  throw new RangeError('stale or unapproved CAD entity review');
 if(!DECISIONS.has(role)||typeof reason!=='string'||reason.length>240)
  throw new TypeError('explicit CAD source/answer/exclude role and bounded reason required');
 const entity=source.entities.find(x=>x.id===id);
 if(!entity)throw new RangeError('CAD entity id not in imported DXF');
 if(entity.status!=='candidate-only'&&role!=='exclude')
  throw new RangeError('unsupported CAD entity cannot be approved as known/answer geometry');
 if(role==='exclude'&&reason.trim().length<6)
  throw new TypeError('excluded CAD object requires reviewer explanation');
 let approvedDimension=null;
 if(entity.dxfType==='DIMENSION'&&role==='given'){
  if(!plain(dimension)||!DIM_KINDS.has(dimension.kind)||
     !finite(dimension.value)||dimension.value<=0||
     dimension.value>1e9||!['mm','deg'].includes(dimension.unit)||
     (dimension.kind==='angle')!==(dimension.unit==='deg')||
     !Array.isArray(dimension.geometryRefs)||dimension.geometryRefs.length<1||
     dimension.geometryRefs.length>8)
   throw new TypeError('dimension requires reviewed value, type, unit and geometry references');
  const ids=new Set(dimension.geometryRefs);
  if(ids.size!==dimension.geometryRefs.length||[...ids].some(ref=>ref===id||
     !source.entities.some(e=>e.id===ref&&e.status==='candidate-only'&&e.geometry)))
   throw new TypeError('invalid or ambiguous CAD dimension reference');
  approvedDimension={kind:dimension.kind,value:dimension.value,unit:dimension.unit,
   geometryRefs:[...ids],reportedCadMeasurement:entity.annotation?.reportedMeasurement??null,
   independentlyValidated:false};
 }else if(dimension!==null)
  throw new TypeError('dimension metadata must be confirmed only on a given DIMENSION');
 return {...session,revision:session.revision+1,
  decisions:{...session.decisions,[id]:{
   role,reviewedBy:'user',sourceEntityId:id,
   reason:reason.trim(),dimension:approvedDimension}}};
}
function auditedCadConditions(source,session){
 validateSession(source,session);
 const entities=source.entities,counts={given:0,'reference-answer':0,exclude:0,unreviewed:0};
 const given=[],dimensionCandidates=[],unresolved=[];
 for(const entity of entities){
  const decision=session.decisions[entity.id];
  if(!decision){counts.unreviewed++;unresolved.push(entity.id);continue;}
  counts[decision.role]=(counts[decision.role]||0)+1;
  if(decision.role!=='given')continue;
  if(entity.geometry)given.push({sourceEntityId:entity.id,layer:entity.layer,
   shape:entity.geometry,coordinateFrame:'unapproved-cad-model',
   sourceHandle:entity.handle});
  if(entity.dxfType==='DIMENSION'){
   const d=decision.dimension;
   if(!d||d.geometryRefs.some(id=>session.decisions[id]?.role!=='given'))
    unresolved.push(entity.id);
   else dimensionCandidates.push({sourceEntityId:entity.id,
    ...d,dimensionConstraintVerified:false});
  }
 }
 const allRoleDecisionsPresent=counts.unreviewed===0;
 const scaleConfirmed=session.units.reviewed===true;
 const inputReviewComplete=allRoleDecisionsPresent&&unresolved.length===0&&scaleConfirmed;
 return {
  status:inputReviewComplete?'reviewed-cad-input-only':'review-incomplete',
  revision:session.revision,sourceSha256:source.source.sha256,
  counts,units:{...session.units},
  geometryCandidates:given,dimensionCandidates,unresolvedEntityIds:unresolved,
  knownAndReferenceLayersReviewed:allRoleDecisionsPresent,
  conditionRolesUserDeclared:allRoleDecisionsPresent,
  independentBlindAnswerIsolationVerified:false,
  dxfOriginalDwgEquivalenceVerified:false,
  firstAngleCoordinateTransformVerified:false,
  '3dSolidReconstructedAndVerified':false,
  dimensionConstraintsMathematicallyVerified:false,
  readyForIndependentSemanticInterpretation:inputReviewComplete,
  readyForM3:false,readyForConstructionIntent:false,readyForV5:false,
  textbookWholeProblemVerified:false
 };
}
module.exports={
 newCadRoleReview,confirmCadModelUnits,reviewCadEntity,auditedCadConditions
};
