'use strict';
/**
 * M5: link each FIRST-ANGLE projected M4 newly generated crease candidate
 * back to both exact physical 3D endpoints in the unified original/generated
 * source graph. Same paper coordinates from DIFFERENT 3D points are alias
 * evidence, never proof of a drawable junction.
 *
 * Recompute current source geometry, source graph and first-angle projection.
 * No standard solid/dashed style, final visible-stroke endpoint, Intent or
 * canonical single V5 signed action is minted by this audit.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {auditUnionPhysicalFeatureJunctions}=
 require('./m5-union-physical-feature-junctions.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const child of Object.values(x))freeze(child);Object.freeze(x);
}return x;};
const equal3=(a,b)=>a&&b&&a.x===b.x&&a.y===b.y&&a.z===b.z;
const equal2=(a,b)=>a&&b&&a.u===b.u&&a.v===b.v;
const unverified=(revision)=>freeze({
 schema:'draftai-m5-generated-view-source-endpoints/1',
 revision,status:'not-covered',candidateCount:0,candidates:[],
 physicallyMatched3DEndpointCount:0,distinctDepthAliasEndpointCount:0,
 officialLineStylesVerified:false,
 allGeneratedViewJunctionsVerified:false,
 signedV5LineActions:0});
function auditGeneratedViewEndpointIncidence({
 geometry,revision,projectedStrokePartitions,physicalJunctionEvidence
}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current generated projected 3D source revision required');
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('reviewed multi-object source geometry required');
 const current=auditUnionPhysicalFeatureJunctions({geometry,revision});
 if(current.status!=='source-recomputed-physical-3d-feature-incidence')
  return unverified(revision);
 if(JSON.stringify(current)!==JSON.stringify(physicalJunctionEvidence))
  throw new TypeError('stale or forged 3D union source-junction proof');
 const m4=projectedStrokePartitions;
 if(m4?.schema!=='draftai-scoped-projected-stroke-partition/1'||
    m4.revision!==revision||m4.status!=='preview-partition-evidence-only'||
    m4.v5Ready!==false||m4.officialLineStylesVerified!==false||
    m4.generatedStrokeSignedCount!==0||
    !Array.isArray(m4.generatedSegments)||
    m4.generatedSegments.length!==m4.generatedProjectedCandidateCount)
  throw new TypeError('unsigned current M4 generated source candidates required');
 const segments=new Map(current.segments.filter(s=>
  s.kind==='generated-source-face-crease').map(s=>[s.sourceGeneratedFeatureId,s]));
 const nodes=new Map(current.nodes.map(n=>[
  [n.point3D.x,n.point3D.y,n.point3D.z].join(':'),n]));
 const result=[],ids=new Set();
 for(const c of m4.generatedSegments){
  if(!c||ids.has(c.id)||c.revision!==revision||
     !VIEWS.includes(c.view)||c.originalSourceMeshEdgeId!==null||
     c.localGeneratedUnionConcaveGeometryVerified!==true||
     c.officialEngineeringLineStyle!=='undetermined'||
     c.canonicalIntentAndV5LineStepApproved!==false)
   throw new TypeError('invalid or duplicate new M4 line source');
  ids.add(c.id);
  const s=segments.get(c.sourceGeneratedFeatureId);
  if(!s||!equal3(s.source3DFrom,c.source3DFrom)||
     !equal3(s.source3DTo,c.source3DTo)||
     JSON.stringify(s.sourceGeometryIds)!==JSON.stringify(c.sourceGeometryIds)||
     s.sourceAxis!==c.sourceAxis)
   throw new RangeError('projected M4 source does not match the authentic 3D generated union feature');
  const witnesses=[];
  for(const role of ['from','to']){
   const point=c[role==='from'?'source3DFrom':'source3DTo'],
    proj=project(point)[c.view],
    projected=c[role==='from'?'projectedFromModelMm':'projectedToModelMm'];
   if(!equal2(proj,projected))
    throw new RangeError('original 3D source and first-angle projected candidate diverge');
   const n=nodes.get([point.x,point.y,point.z].join(':'));
   if(!n||!equal3(n.point3D,point)||
      !n.incidences.some(i=>i.segmentId===s.id&&i.endpointRole===role))
    throw new TypeError('a generated stroke endpoint is not a real reviewed 3D feature graph node');
   const alias=current.projectedAliases.filter(a=>
    a.view===c.view&&a.junctionIds.includes(n.id)&&
    a.different3DPhysicalPoints);
   witnesses.push({
    sourceRole:role,physicalSourceNodeId:n.id,
    source3DPoint:{...point},projectedModelMm:{...proj},
    physicalNodeCoincidenceVerified:true,
    originalAndGeneratedIncidences:[...n.incidences.map(i=>i.segmentId)],
    local3DPhysicalJunctionCandidate:
     n.localMultiSourcePhysicalJunctionCandidate,
    otherPhysicalNodeIdsAtSamePaperPoint:alias.map(a=>
     a.junctionIds.find(id=>id!==n.id)),
    projectedDepthAliasUnresolved:alias.length>0,
    completeProjectedContourJunctionVerified:false,
    endpointSourceOfficialLineStyle:'undetermined',
    formalV5EndpointReleased:false
   });
  }
  if(witnesses[0].physicalSourceNodeId===witnesses[1].physicalSourceNodeId)
   throw new RangeError('generated source edge projected from a single physical 3D endpoint');
  result.push({id:'M5NewProjected'+result.length,revision,view:c.view,
   m4CandidateId:c.id,generated3DSourceFeatureId:s.sourceGeneratedFeatureId,
   originalSourceMeshEdgeId:null,
   endpoints:witnesses,
   bothPhysical3DEndpointIdentitiesVerified:true,
   physical3DLocalEndpointGraphIsComplete:false,
   fullProjectedDepthAliasAndOverlapClassificationVerified:false,
   formalM3FinalAnswerLineSemanticsVerified:false,
   engineeringStandardLineStyle:'undetermined',
   officialConstructionIntentDAGV5LineSigned:false});
 }
 // The legitimate open 3D source feature must appear in exactly TWO
 // noncollapsed orthographic views, with the third view collapsed to a point.
 for(const s of segments.values()){
  const views=result.filter(r=>r.generated3DSourceFeatureId===
   s.sourceGeneratedFeatureId).map(x=>x.view);
  if(views.length!==2||new Set(views).size!==2)
   throw new RangeError('incomplete three-view generated edge source projection coverage');
 }
 return freeze({schema:'draftai-m5-generated-view-source-endpoints/1',
  revision,status:'source-bound-generated-3d-to-projected-endpoints',
  candidateCount:result.length,candidates:result,
  source3DGeneratedFeatureCount:segments.size,
  physicallyMatched3DEndpointCount:result.length*2,
  distinctDepthAliasEndpointCount:result.reduce((a,r)=>a+
   r.endpoints.filter(e=>e.projectedDepthAliasUnresolved).length,0),
  originalNew3DNodeJoinCount:result.reduce((a,r)=>a+
   r.endpoints.filter(e=>e.local3DPhysicalJunctionCandidate).length,0),
  allGeneratedViewJunctionsVerified:false,
  completeOcclusionAndDrawingStandardsVerified:false,
  officialLineStylesVerified:false,
  signedV5LineActions:0});
}
module.exports={auditGeneratedViewEndpointIncidence};
