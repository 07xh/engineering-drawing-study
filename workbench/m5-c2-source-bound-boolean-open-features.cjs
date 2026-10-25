'use strict';
/**
 * C2 M5: consume the EXISTING M0-confirmed orthogonal cuboid Boolean
 * four-quadrant open-feature proofs. Match each current canonical paper
 * source SUBSPAN back to one exact original 3D source edge or real two-face
 * generated union feature, and prove COMPLETE source-axial interval coverage.
 *
 * Original and generated features are different real 3D sources. Never
 * infer their identity from projected 2D coincidences or a midpoint.
 * A local OPEN cross-section is not an endpoint/cap/complete drawing proof.
 */
const {auditOrthogonalUnionSourceEdges}=
 require('./m5-orthogonal-union-source-edges.cjs');
const {proveGeneratedOrthogonalUnionCreases}=
 require('./m5-generated-orthogonal-union-creases.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const AXES=['x','y','z'];
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const c of Object.values(x))freeze(c);Object.freeze(x);
}return x;};
const equal3=(a,b)=>a&&b&&AXES.every(k=>a[k]===b[k]);
const finite3=p=>p&&AXES.every(k=>Number.isFinite(p[k]));
const err=reason=>{throw new TypeError('C2 exact 3D Boolean source lineage: '+reason);};
function matchCompleteOpenAxis({from,to,axis,items,sourceKind}){
 if(!AXES.includes(axis)||!finite3(from)||!finite3(to))return false;
 const transverse=AXES.filter(k=>k!==axis);
 if(!transverse.every(k=>from[k]===to[k]))return false;
 const lo=Math.min(from[axis],to[axis]),hi=Math.max(from[axis],to[axis]);
 if(!(hi>lo))return false;
 const source=items.filter(piece=>{
  if(!finite3(piece.source3DFrom)||!finite3(piece.source3DTo)||
     !transverse.every(k=>from[k]===piece.source3DFrom[k]&&
      to[k]===piece.source3DTo[k]))return false;
  if(piece.sourceAxis!==axis)return false;
  if(sourceKind==='original')
   return piece.positiveUnionExternalCreaseVerified===true&&
    (piece.status==='certified-convex-exterior-open-crease'||
     piece.status==='certified-concave-exterior-open-crease');
  return piece.positiveNewConcaveUnionOpenFeatureVerified===true&&
   piece.status==='certified-new-concave-union-open-crease';
 }).map(piece=>[Math.min(piece.source3DFrom[axis],piece.source3DTo[axis]),
               Math.max(piece.source3DFrom[axis],piece.source3DTo[axis])])
 .sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 let covered=lo;
 for(const [a,b] of source){
  if(a>covered)break; // an uncovered true Boolean event is fatal
  if(b>covered)covered=b;
  if(covered>=hi)return true;
 }
 return false;
}
function auditC2SourceBoundBooleanOpenFeatures({geometry,revision,
 unifiedPaperSourceIdentityEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    !Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  err('bounded reviewed source list and revision required');
 const paper=unifiedPaperSourceIdentityEvidence;
 if(paper?.status!=='source-traced-canonical-projected-open-interval-registry'||
    paper.revision!==revision||
    paper.officialLineStylesVerified!==false||
    paper.signedV5LineActions!==0||paper.v5Ready!==false||
    !paper.allCandidatePiecesRetained||
    JSON.stringify(paper.sourceGeometryIds)!==
     JSON.stringify(geometry.map(g=>g.id)))
  err('current unsigned source-traced first-angle M5 registry required');
 // Reuse validated source Boolean kernels, no new box/CSG algorithm.
 const original=auditOrthogonalUnionSourceEdges({geometry,revision});
 const generated=proveGeneratedOrthogonalUnionCreases({geometry,revision});
 const scoped=original.status==='source-orthogonal-union-open-sector-coverage'&&
  generated.status==='scoped-pairwise-new-perpendicular-face-open-features'&&
  original.globalLineStylesVerified===false&&
  original.v5Ready===false&&generated.officialLineStylesVerified===false&&
  generated.generatedFeatureV5Ready===false;
 const originalById=new Map(original.edges.map(e=>[e.sourceEdgeId,e]));
 const generatedById=new Map(generated.segments.map(e=>[e.id,e]));
 const lines=[];
 for(const group of paper.groups){
  if(!VIEWS.includes(group.view)||group.revision!==revision||
     group.sourceMultiplicity!==group.sourceSubspans.length||
     group.applicableEngineeringLineStyle!=='undetermined'||
     group.formalConstructionIntentDAGAndV5Approved!==false)
   err('current unsigned canonical paper group required');
  const contributions=[];
  for(const source of group.sourceSubspans){
   const kind=source.kind;
   const from=source.from3D,to=source.to3D,
    id=source.originalSourceFeatureId;
   if(!finite3(from)||!finite3(to)||!VIEWS.includes(group.view)||
      !equal3(from,from)||!equal3(to,to)||
      !source.source3DAndFirstAnglePaperCoordinatesVerified||
      !id)
    err('original/new source subspan must preserve true 3D identity');
   const p=project(from)[group.view],q=project(to)[group.view];
   if(p.u!==group.projectedFromModelMm.u||
      p.v!==group.projectedFromModelMm.v||
      q.u!==group.projectedToModelMm.u||
      q.v!==group.projectedToModelMm.v)
    err('source subspan no longer projects to its canonical interval');
   let bool=false,status='not-covered-or-event-split-incomplete',
    sourceProofId=null,axis=null;
   if(scoped&&kind==='original-physical-crease'){
    const row=originalById.get(id);
    if(row&&row.sourceGeometryId===source.sourceGeometryIds[0]&&
       row.sourceEdgeId===id&&
       row.singleSourceDihedralCreaseVerified&&
       row.orthogonalLocalSectorScopeVerified){
     axis=row.axis;
     bool=matchCompleteOpenAxis({from,to,axis,items:row.subintervals,
      sourceKind:'original'});
     sourceProofId=row.sourceEdgeId;
    }
    if(bool)status='certified-entire-original-3d-boolean-exterior-open-feature';
   }else if(scoped&&kind==='generated-two-face-crease'){
    const row=generatedById.get(id);
    if(row&&row.generatedByTwoSourceFacePlanes===true&&
       row.supportingFacePlaneIncidenceIndependentlyVerified===true&&
       row.allSceneOpaqueSolidsIncluded===true&&
       row.sourceFacePlanes.length===2){
     axis=row.sourceAxis;
     bool=matchCompleteOpenAxis({from,to,axis,items:[row],
      sourceKind:'generated'});
     sourceProofId=row.id;
    }
    if(bool)status='certified-entire-generated-3d-boolean-exterior-open-feature';
   }
   contributions.push({sourceSubspanId:source.sourceSubspanId,
    sourceFeatureId:id,sourceKind:kind,view:group.view,
    originalOrNewFeatureProofId:sourceProofId,
    original3DFrom:{...from},original3DTo:{...to},
    sourceAxis:axis,
    entireReal3DSourceOpenIntervalBooleanExteriorVerified:bool,
    scopedStatus:status,
    completeOpaqueFaceAndEndpointLineStyleCertified:false,
    authorizedOfficialLineStyle:'undetermined',
    v5LineActionAuthorized:false});
  }
  const selected=contributions.find(x=>
   x.sourceSubspanId===group.nearestListed3DSourceSubspanId);
  const selectedPositive=Boolean(scoped&&selected&&
   selected.entireReal3DSourceOpenIntervalBooleanExteriorVerified);
  lines.push({paperGroupId:group.id,revision,view:group.view,
   selectedSourceSubspanId:group.nearestListed3DSourceSubspanId,
   contributions,sourceMultiplicity:contributions.length,
   selectedWhole3DBooleanExteriorOpenSourceVerified:selectedPositive,
   wholeReviewed3DSourceContributionsRetained:true,
   completePhysicalEndpointsAndGlobalOcclusionVerified:false,
   officialEngineeringLineStyle:'undetermined',
   canonicalV5ActionSigned:false});
 }
 const selectedCount=lines.filter(x=>
  x.selectedWhole3DBooleanExteriorOpenSourceVerified).length;
 return freeze({schema:'draftai-m5-c2-source-bound-boolean-open-feature/1',
  revision,status:scoped?
   'source-recomputed-original-and-generated-exterior-open-feature-lineage':
   'not-covered-nonorthogonal-boolean-scope',
  sourceGeometryIds:geometry.map(g=>g.id),
  original3DSourceBooleanEvidenceSchema:original.schema,
  newTwoFaceBooleanEvidenceSchema:generated.schema,
  paperIntervalCount:lines.length,lines,
  allPaperSourcesAccountedFor:lines.length===paper.paperIntervalCount,
  selectedWholeOpenBooleanExteriorSourceCount:selectedCount,
  rejectedOrUnprovenSelectedSourceCount:lines.length-selectedCount,
  allPhysicalSourceAndBooleanEndpointJoinsVerified:false,
  fullSceneOpaqueOcclusionAndAllPaperTransitionsVerified:false,
  officialEngineeringLineStylesVerified:false,
  signedV5LineActions:0,v5Ready:false});
}
module.exports={auditC2SourceBoundBooleanOpenFeatures,matchCompleteOpenAxis};
