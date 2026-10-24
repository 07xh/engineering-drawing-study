'use strict';
/**
 * M5 pure, proof-scoped FIRST-ANGLE ray audit of explicitly confirmed model
 * Geometry. Source Geometry is supplied by the already reviewed project
 * coordinator, never guessed from photo/OCR or a solution reference.
 * A bounded set of closed convex mesh faces is sampled at mathematical face
 * barycentres for multi-body depth ordering; this is NOT a silhouette,
 * exact continuous face visibility, overlap segmentation or line drawing.
 */
const {FIRST_ANGLE_OBSERVER_RAYS,VIEWS,project}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {traceConvexRayDepth}=
 require('../core/numeric/convex-ray-depth.cjs');
const {inspectProjectedEdgeDepth}=
 require('../core/numeric/projected-edge-depth-events.cjs');
const {certifyConvexSegmentOcclusion}=
 require('../core/numeric/convex-segment-occlusion.cjs');
const {evaluateFullSourceSegmentOcclusion}=
 require('../core/verification/convex-occlusion-coverage.cjs');
const {partitionReviewedSourceEdges}=
 require('./scoped-projected-stroke-partition.cjs');
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);
  Object.freeze(x);
 }
 return x;
};
const unready=(revision,reason)=>freeze({
 schema:'draftai-reviewed-mesh-scene-ray-audit/1',
 revision,status:'not-covered',reason,sourceGeometryIds:[],
 sampleCount:0,samples:[],coverage:'none',
 edgeOverlapAudit:{status:'not-covered',pairCount:0,events:[],
  completeContourVerified:false},
 edgeContinuousOcclusion:{status:'not-covered',pairCount:0,
  certifiedRanges:[],uncertainPairs:[],
  completeContourVerified:false,officialLineStylesVerified:false},
 wholeSourceEdgeOcclusion:{status:'not-covered',checkedCount:0,
  hiddenSourceEdges:[],fullLineStyleSignedOff:false},
 projectedStrokePartitions:{status:'not-covered',segmentCount:0,
  segments:[],officialLineStylesVerified:false,v5Ready:false},
 fullSceneVerified:false,completeContourVerified:false,
 projectionOverlapResolved:false,constructionIntentReady:false,
 v5Ready:false,officialLineStylesVerified:false
});
function evaluateReviewedConvexMeshDepth({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current model geometry revision required');
 if(!Array.isArray(geometry)||!geometry.length)
  return unready(revision,'no reviewed Geometry objects');
 if(geometry.length>24||geometry.some(g=>g?.kind!=='mesh'||
    g?.space!=='model-3d'||g?.unit!=='mm'))
  return unready(revision,'only bounded explicitly confirmed model-3d convex meshes covered');
 const seen=new Set(),solids=[],parts=[];
 try{
  for(const g of geometry){
   if(!g||typeof g.id!=='string'||seen.has(g.id))
    return unready(revision,'duplicated source Geometry object identity');
   seen.add(g.id);
   const p=verifiedConvexMeshHalfspaces(g);
   solids.push({id:g.id,halfspaces:p.halfspaces});
   parts.push({g,proof:p});
  }
 }catch(error){
  return unready(revision,'unsupported open/nonconvex/degenerate source mesh: '+error.message);
 }
 if(parts.reduce((s,p)=>s+p.g.data.faces.length,0)>128)
  return unready(revision,'bounded face-probe budget exceeded');
 const samples=[];
 for(const {g} of parts){
  for(const [i,face] of g.data.faces.entries()){
   const coords=face.map(id=>g.data.points[id]);
   const point={x:coords.reduce((s,p)=>s+p.x,0)/coords.length,
    y:coords.reduce((s,p)=>s+p.y,0)/coords.length,
    z:coords.reduce((s,p)=>s+p.z,0)/coords.length};
   const views={};
   for(const view of VIEWS){
    const audit=traceConvexRayDepth({
     point,observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view],solids
    });
    views[view]={
     occlusion:audit.status,nearestSolidId:audit.nearestSolidId,
     nearestDepthMm:audit.nearestDepthMm,
     ambiguousSolidIds:[...audit.ambiguousSolidIds],
     orderedHits:audit.orderedHits.map(x=>({
      solidId:x.solidId,entryMm:x.entryMm,exitMm:x.exitMm,
      entryFaceId:x.entryFaceId,exitFaceId:x.exitFaceId
     })),
     sourceRayScope:audit.scope,depthOrderVerified:audit.depthOrderVerified,
     completeSceneVerified:false,officialLineStyleVerified:false
    };
   }
   samples.push({
    sourceGeometryId:g.id,sourceFaceId:'face-'+(i+1),
    pointModelMm:point,projectedModelMm:project(point),
    V:views.V,H:views.H,W:views.W,
    sampleOnly:true,openFaceInteriorProof:false,
    contourOrEndpointVisibilityVerified:false
   });
  }
 }
 // Reuse already confirmed source mesh Edges (not sampled render lines).
 // Pairwise model-3d crossing/overlap tests are bounded separately; each
 // event is ONLY a two-edge depth witness, not global scene visibility.
 const allEdges=[];
 for(const {g} of parts)for(const [i,pair] of g.data.edges.entries()){
  allEdges.push({sourceGeometryId:g.id,
   sourceEdgeId:g.id+'::'+[...pair].sort().join('|'),
   edge:{id:'ReviewedEdge_'+(allEdges.length+1),
    from:g.data.points[pair[0]],to:g.data.points[pair[1]]}});
 }
 const edgeAudit=allEdges.length>40?
  {status:'budget-exceeded',pairCount:0,events:[],
   completeContourVerified:false}:
  (()=>{
   const events=[];let pairCount=0;
   for(let i=0;i<allEdges.length;i++)for(let j=i+1;j<allEdges.length;j++){
    const first=allEdges[i],second=allEdges[j];
    for(const view of VIEWS){
     const intersection=inspectProjectedEdgeDepth({
      first:first.edge,second:second.edge,view});
     pairCount++;
     if(!['crossing','collinear-overlap','endpoint-touch-undetermined'].includes(
       intersection.status))continue;
     events.push({
      view,firstSourceGeometryId:first.sourceGeometryId,
      firstSourceEdgeId:first.sourceEdgeId,
      secondSourceGeometryId:second.sourceGeometryId,
      secondSourceEdgeId:second.sourceEdgeId,
      relation:intersection.status,events:intersection.events,
      ranges:intersection.ranges,
      completeOcclusionVerified:false,officialLineStyleVerified:false
     });
    }
   }
   return {status:'pairwise-depth-events-only',pairCount,events,
    completeContourVerified:false};
  })();
 // The M0 elimination proves continuous strict-interior occlusion for the
 // OPEN parts of real source mesh edges. This is NOT a source-face contour,
 // screen-space visibility segmentation or permission to replace V5 strokes.
 // Source edges parallel to the observer project to points and cannot
 // receive a claimed two-dimensional visible/hidden stroke.
 const continuousOcclusion=allEdges.length>40||solids.length>12?
  {status:'budget-exceeded',pairCount:0,certifiedRanges:[],uncertainPairs:[],
   completeContourVerified:false,officialLineStylesVerified:false}:
  (()=>{
   const certifiedRanges=[],uncertainPairs=[];let pairCount=0;
   for(const item of allEdges)for(const view of VIEWS){
    const from=project(item.edge.from)[view],
     to=project(item.edge.to)[view];
    if(Math.hypot(to.u-from.u,to.v-from.v)<=1e-7){
     uncertainPairs.push({view,sourceGeometryId:item.sourceGeometryId,
      sourceEdgeId:item.sourceEdgeId,occluderGeometryId:null,
      reason:'projected-source-edge-collapses-to-point'});
     continue;
    }
    for(const solid of solids){
     pairCount++;
     const witness=certifyConvexSegmentOcclusion({
      source:item.edge,solid,
      observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view]
     });
     if(witness.status==='certified-open-interval'){
      certifiedRanges.push({
       view,sourceGeometryId:item.sourceGeometryId,
       sourceEdgeId:item.sourceEdgeId,occluderGeometryId:solid.id,
       openSourceParameterRange:[...witness.openSourceParameterRange],
       proofScope:'strict-convex-open-interval-with-positive-observer-ray',
       sourceEndpointsVerified:false,fullLineStyleVerified:false,
       completeOcclusionVerified:false
      });
     }else if(witness.status==='undetermined'){
      uncertainPairs.push({
       view,sourceGeometryId:item.sourceGeometryId,
       sourceEdgeId:item.sourceEdgeId,
       occluderGeometryId:solid.id,reason:witness.reason
      });
     }
    }
   }
   return {status:'continuous-open-interval-evidence-only',pairCount,
    certifiedRanges,uncertainPairs,completeContourVerified:false,
    officialLineStylesVerified:false};
  })();
 // A separate, recomputed proof gate may certify that the ENTIRE 3D
 // source segment (including its endpoints) lies behind one or more
 // confirmed opaque geometric solids. A line segment's endpoint JOIN and
 // drawing-standard hidden-line style still need their own formal proof.
 const wholeEdgeOcclusion=allEdges.length>40||solids.length>12?
  {status:'budget-exceeded',checkedCount:0,hiddenSourceEdges:[],
   fullLineStyleSignedOff:false}:(()=>{
   const hiddenSourceEdges=[];let checkedCount=0;
   for(const item of allEdges)for(const view of VIEWS){
    const e=evaluateFullSourceSegmentOcclusion({
     source:item.edge,solids,view});
    checkedCount++;
    if(!e.entireSourceSegmentOccluded)continue;
    hiddenSourceEdges.push({
     view,sourceGeometryId:item.sourceGeometryId,
     sourceEdgeId:item.sourceEdgeId,
     occluderGeometryIds:[...e.occluderIds],
     scope:e.proofScope,geometryOfEntireSourceSegmentOccluded:true,
     endpointJoinVerified:false,officialLineStyleVerified:false,
     v5LineStyleSignedOff:false
    });
   }
   return {status:'scoped-source-segment-occlusion-only',checkedCount,
    hiddenSourceEdges,fullLineStyleSignedOff:false};
  })();
 const sceneEvidence={
  schema:'draftai-reviewed-mesh-scene-ray-audit/1',
  revision,status:'scoped-face-probes-only',reason:null,
  sourceGeometryIds:solids.map(x=>x.id),
  sampleCount:samples.length,samples,edgeOverlapAudit:edgeAudit,
  edgeContinuousOcclusion:continuousOcclusion,
  wholeSourceEdgeOcclusion:wholeEdgeOcclusion,
  coverage:'only-confirmed-closed-convex-mesh-set',
  fullSceneVerified:false,completeContourVerified:false,
  projectionOverlapResolved:false,constructionIntentReady:false,
  v5Ready:false,officialLineStylesVerified:false
 };
 const projectedStrokePartitions=partitionReviewedSourceEdges({
  geometry,sceneDepthEvidence:sceneEvidence,revision});
 return freeze({...sceneEvidence,projectedStrokePartitions});
}
module.exports={evaluateReviewedConvexMeshDepth};
