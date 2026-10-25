'use strict';
/**
 * C1 M0->M5 exact ORIGINAL physical source-edge CLOSURE proof.
 *
 * Do not confuse:
 *   (A) dyadic exact ray-clearance at every point of the full original
 *       CLOSED physical source edge (two REAL original vertex endpoints),
 *   (B) 2D artificial M4 paper event cuts, which are not new 3D vertices,
 *   (C) all-scene frontmost engineering line and its V5 drawing authority.
 *
 * The shared original supporting face has an exact nonzero OUTWARD
 * observer slope for ALL original edge points. Independently require BOTH
 * original vertices' every-face dyadic proof before certifying (A).
 * Reconsume shared M4 paper partitions and existing M0 open-span ray
 * classification to ensure consistent source identity and no missing cut.
 *
 * Never issue a line, create an Intent/DAG action, or relabel a paper-only
 * crossing as a true physical vertex.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {outwardProof,inwardProof}=
 require('../core/numeric/convex-incident-source-open-ray.cjs');
const {auditC1OriginalSourceSubspanJunctions}=
 require('./c1-original-source-subspan-junction-provenance.cjs');
const {auditC1SingleConvexSourceSubspanRays}=
 require('./m5-c1-source-subspan-opaque-rays.cjs');
const {auditC1ExactOriginalVertexObserverRays}=
 require('./c1-m5-exact-original-vertex-rays.cjs');
const {auditReviewedConvexSourceCreases}=
 require('./m5-reviewed-convex-source-creases.cjs');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const value of Object.values(o))freeze(value);
  Object.freeze(o);
 }return o;
};
const srcKey=(id,a,b)=>id+'::'+[a,b].sort().join('|');
const spanKey=(id,v,range)=>id+'@'+v+'@'+range.join(':');
const same3=(a,b)=>!!a&&!!b&&
 a.x===b.x&&a.y===b.y&&a.z===b.z;
const same2=(a,b)=>!!a&&!!b&&a.u===b.u&&a.v===b.v;
function auditC1OriginalClosedEdgeRayContinuity({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current reviewed original convex source revision required');
 const convex=verifiedConvexMeshHalfspaces(geometry);
 const junction=auditC1OriginalSourceSubspanJunctions({geometry,revision});
 const spanRays=auditC1SingleConvexSourceSubspanRays({geometry,revision});
 const vertices=auditC1ExactOriginalVertexObserverRays({geometry,revision});
 const crease=auditReviewedConvexSourceCreases({geometry,revision});
 if(convex.sourceGeometryId!==geometry.id||
    junction.sourceGeometryId!==geometry.id||
    junction.revision!==revision||
    junction.signedV5ActionCount!==0||
    spanRays.sourceGeometryId!==geometry.id||
    spanRays.revision!==revision||
    spanRays.signedV5ActionCount!==0||
    vertices.sourceGeometryId!==geometry.id||
    vertices.revision!==revision||
    vertices.signedV5ActionCount!==0||
    crease.sourceGeometryId!==geometry.id||
    crease.officialLineStylesVerified!==false)
  throw new RangeError('closed edge proof requires current unsigned M0–M5 sources');
 const creases=new Map(crease.edges.map(x=>[x.sourceEdgeId,x]));
 const source=new Map(geometry.data.edges.map(([a,b])=>
  [srcKey(geometry.id,a,b),[a,b]]));
 const raysBySpan=new Map();
 for(const s of spanRays.subspans){
  const key=spanKey(s.sourceEdgeId,s.view,s.originalParameterRange);
  if(raysBySpan.has(key))throw new RangeError('duplicated original source ray cut');
  raysBySpan.set(key,s);
 }
 const vertexByKey=new Map(vertices.rows.map(x=>
  [x.view+'@'+x.originalVertexId,x]));
 if(vertexByKey.size!==vertices.rows.length)
  throw new RangeError('duplicate original 3D vertex observer ray proof');
 const rows=[],counts={
  originalSourceEdgeViews:0,
  exactWholeClosedOriginalPhysicalEdgeRayClear:0,
  exactWholeOpenOriginalPhysicalEdgeStrictlyHidden:0,
  exactHiddenOpenButEndpointNotCertified:0,
  collapsedPaperProjectionHeld:0,
  nonPhysicalSubdivisionHeld:0,
  nonCollapsedProjectionPartitionIncomplete:0,
  physicalCreasesWithUnresolvedEdgeRays:0,
  original3DVertexRayEndpointWitnesses:0,
  nonoriginalPaperCutEndpointsHeld:0,
  same3DOriginalSourceCutJoinsPreserved:0,
  paperOnlyCrossSourceEncountersNeverUpgraded:0,
  signedV5Actions:0
 };
 for(const row of junction.rows){
  const original=source.get(row.sourceEdgeId);
  const physical=creases.get(row.sourceEdgeId);
  if(!original||!physical||!VIEWS.includes(row.view)||
     row.sourceVertexIds[0]!==original[0]||
     row.sourceVertexIds[1]!==original[1]||
     row.signedV5ActionCount!==0)
   throw new RangeError('unmatched original edge/vertex 3D identity');
  const endpointProofs=original.map(id=>{
   const proof=vertexByKey.get(row.view+'@'+id);
   if(!proof||proof.originalVertexId!==id||
      !same3(proof.originalModel3DPoint,geometry.data.points[id])||
      proof.signedV5Action!==false)
    throw new RangeError('missing original 3D vertex support-ray proof');
   return proof;
  });
  counts.original3DVertexRayEndpointWitnesses+=2;
  const outward=outwardProof({
   geometry,sourceVertexIds:original,view:row.view,convexProof:convex});
  const inward=inwardProof({
   geometry,sourceVertexIds:original,view:row.view,convexProof:convex});
  const outwardClear=outward.status==='certified-clear';
  const inwardHidden=inward.status===
   'certified-strictly-hidden-open-original-edge';
  if(outwardClear&&inwardHidden)
   throw new RangeError('contradictory source support rays');
  // Two endpoint ray witnesses independently check every original face.
  const bothOriginalVertexRaysClear=endpointProofs.every(x=>
   x.proof.positiveForwardRayClear===true&&
   x.proof.exactFullOriginalConvexSupportChecked===true);
  if(outwardClear&&!bothOriginalVertexRaysClear)
   throw new RangeError('exact outward edge conflicts with exact source vertex ray');
  // This closed-edge certificate is about SOURCE 3D rays; it does not
  // silently sign paper projection, nor synthetic M4 cut point vertices.
  const closedSourceRayClear=outwardClear&&bothOriginalVertexRaysClear;
  const intervalRows=[],spans=row.spans;
  let partitionComplete=!row.collapsedProjection&&spans.length>0;
  for(let i=0;i<spans.length;i++){
   const cut=spans[i],range=cut.sourceParameterRange;
   const ray=raysBySpan.get(spanKey(row.sourceEdgeId,row.view,range));
   if(!ray||ray.sourceGeometryId!==geometry.id||
      ray.revision!==revision||
      ray.signedV5Action!==false||
      !same3(ray.source3DFrom,cut.from3D)||
      !same3(ray.source3DTo,cut.to3D)||
      !same2(ray.fromModelMm,cut.fromModelMm)||
      !same2(ray.toModelMm,cut.toModelMm))
    throw new RangeError('original M4 cut disagrees with continuous M0 source rays');
   if(closedSourceRayClear&&!ray.exactOriginalFaceWholeOpenRayClear)
    throw new RangeError('whole original exact ray clear but a cut lost M0 witness');
   if(inwardHidden&&!ray.exactOriginalSourceStrictInwardOpenRayHidden)
    throw new RangeError('whole original strict-inward ray but a cut lost M0 witness');
   if(i===0&&range[0]!==0)partitionComplete=false;
   if(i===spans.length-1&&range[1]!==1)partitionComplete=false;
   if(i>0){
    const prior=spans[i-1],end=prior.sourceParameterRange[1];
    if(end!==range[0]||
       cut.sameOriginalSource3DContinuityFromPriorPiece!==true||
       !same3(prior.to3D,cut.from3D)||
       !same2(prior.toModelMm,cut.fromModelMm))
     partitionComplete=false;
    else counts.same3DOriginalSourceCutJoinsPreserved++;
   }
   const endpoints=[cut.fromEndpoint,cut.toEndpoint];
   for(const point of endpoints){
    if(point.authorizedAsV5Junction!==false||
       point.anotherOriginalSource3DPointInferred!==false)
     throw new RangeError('M4 paper cut forged a 3D joint');
    if(point.originalVertexId===null){
     counts.nonoriginalPaperCutEndpointsHeld++;
     if(point.originalEndpoint3DIdentityVerified!==false)
      throw new RangeError('interior paper cut forged physical vertex');
    }else if(!original.includes(point.originalVertexId)||
      !same3(geometry.data.points[point.originalVertexId],
       point.model3DPoint))
     throw new RangeError('original endpoint identity replaced by paper data');
    counts.paperOnlyCrossSourceEncountersNeverUpgraded+=
     point.paperOnlyOtherSourceEdgeIds.length;
   }
   intervalRows.push({
    originalParameterRange:[...range],
    source3DFrom:{...cut.from3D},source3DTo:{...cut.to3D},
    paperFrom:{...cut.fromModelMm},paperTo:{...cut.toModelMm},
    exactWholeOpenRayClear:ray.exactOriginalFaceWholeOpenRayClear,
    exactWholeOpenStrictInwardHidden:
     ray.exactOriginalSourceStrictInwardOpenRayHidden,
    original3DFromVertexId:cut.fromEndpoint.originalVertexId,
    original3DToVertexId:cut.toEndpoint.originalVertexId,
    sameOriginalSourceCut3DJoinFromPrevious:
     cut.sameOriginalSource3DContinuityFromPriorPiece,
    physicalCrossSourceJunctionAtPaperCutsAuthorized:false,
    applicableLineType:'undetermined',signedV5Action:false
   });
  }
  if(row.collapsedProjection)counts.collapsedPaperProjectionHeld++;
  if(!row.collapsedProjection&&!partitionComplete)
   counts.nonCollapsedProjectionPartitionIncomplete++;
  const realCrease=physical.sourceIsPhysicalCreaseWithinSingleSolid===true;
  if(!realCrease)counts.nonPhysicalSubdivisionHeld++;
  else if(closedSourceRayClear&&partitionComplete)
   counts.exactWholeClosedOriginalPhysicalEdgeRayClear++;
  else if(inwardHidden){
   counts.exactWholeOpenOriginalPhysicalEdgeStrictlyHidden++;
   if(!endpointProofs.every(x=>
    x.proof.strictInteriorNearOriginalVertex===true))
    counts.exactHiddenOpenButEndpointNotCertified++;
  }else if(!row.collapsedProjection)
   counts.physicalCreasesWithUnresolvedEdgeRays++;
  counts.originalSourceEdgeViews++;
  rows.push({
   sourceGeometryId:geometry.id,revision,view:row.view,
   originalPhysicalSourceEdgeId:row.sourceEdgeId,
   originalVertexIds:[...original],
   originalPhysicalCreaseProven:realCrease,
   sourceOriginalVertexRayStatus:endpointProofs.map(x=>x.proof.status),
   exactlyBothOriginalVertexForwardRaysClear:bothOriginalVertexRaysClear,
   completeSourceOriginal3DRayClosedIntervalClear:
    closedSourceRayClear,
   originalOpenEdgeStrictInteriorOcclusionProven:inwardHidden,
   nearInsideBothOriginalVertexRaysProven:
    endpointProofs.every(x=>x.proof.strictInteriorNearOriginalVertex),
   projectionCollapsed:row.collapsedProjection,
   originalM4PaperParameterPartitionComplete:partitionComplete,
   allPaperInteriorCutPointsRetainNonvertexIdentity:true,
   originalCutSubspans:intervalRows,
   fullProjectedVisibleSourceLineProven:realCrease&&
    closedSourceRayClear&&partitionComplete,
   // This is not final visible ENGINEERING line: projected source
   // competition, CAD genuine candidate, national line standards,
   // other scene solids and joins remain independent M5 authorities.
   completePaperSceneAndFeatureTopologyProven:false,
   allCoProjectedSourceDepthOrderCertified:false,
   officialEngineeringLineStyle:'undetermined',
   constructionIntentAuthorized:false,signedV5Action:false
  });
 }
 if(rows.length!==source.size*VIEWS.length||
    counts.originalSourceEdgeViews!==junction.counts.sourceEdgeViewCount||
    counts.same3DOriginalSourceCutJoinsPreserved!==
     junction.counts.sharedOriginalSourceNeighborJoins||
    counts.original3DVertexRayEndpointWitnesses!==rows.length*2||
    counts.signedV5Actions!==0)
  throw new RangeError('original edge-vertex ray closure budget mismatch');
 return freeze({
  schema:'draftai-c1-m5-exact-closed-original-edge-ray-and-cut-continuity/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,
  originalVertexRayProofSchema:vertices.schema,
  originalSubspanM0RayProofSchema:spanRays.schema,
  originalM4PhysicalCutProofSchema:junction.schema,
  closedRayMeansOnlyOneReviewedSolid:true,
  doesNotInfer3DVerticesAtPaperOnlyCuts:true,
  allActualOccludingSceneFacesCertified:false,
  allEngineeringLineStylesSigned:false,
  constructionIntentAndSingleV5Authorized:false,
  signedV5ActionCount:0,wholeSolidV5Ready:false
 });
}
module.exports={auditC1OriginalClosedEdgeRayContinuity};
