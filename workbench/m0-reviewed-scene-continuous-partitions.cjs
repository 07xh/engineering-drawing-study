'use strict';
/**
 * Reusable REAL M0 consumer for first-angle C1/C2 confirmed convex scenes.
 * Geometry -> verified closed mesh -> independently audited extreme vertices
 * -> native M0 continuous source-edge intervals and solid-pair depth slabs.
 * No sampled pixels, caller-supplied proof flags, substitute CAD solver,
 * engineering line-style signer, or second V5 timeline.
 */
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexVertices}=
 require('../core/numeric/m0-convex-vertex-completeness.cjs');
const {certifyGlobalDepthOrder}=
 require('../core/numeric/m0-global-depth-separation.cjs');
const {partitionM0Segment}=
 require('../core/numeric/m0-joint-visibility-partition.cjs');
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const held=(revision,reason)=>freeze({
 schema:'draftai-reviewed-real-m0-scene-partitions/1',revision,
 status:'not-covered',reason,sourceGeometryIds:[],
 auditedSolidCount:0,verifiedExtremeVertexSetCount:0,
 originalSourceEdgeViewCount:0,collapsedSourceProjections:0,
 certifiedHiddenOpenRuns:0,certifiedClearOpenRuns:0,
 unresolvedOpenRuns:0,globallyDepthSeparatedSolidPairs:0,
 views:{V:{edges:[],solidPairOrders:[]},H:{edges:[],solidPairOrders:[]},
  W:{edges:[],solidPairOrders:[]}},
 completeSceneVerified:false,sourceEndpointTopologyVerified:false,
 officialLineStylesVerified:false,constructionIntentAuthorized:false,
 v5VerifiedExportReady:false
});
function auditReviewedM0ScenePartitions({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current revision required for M0 scene');
 if(!Array.isArray(geometry)||geometry.length===0)
  return held(revision,'no source geometry');
 if(geometry.length>8||geometry.some(g=>g?.kind!=='mesh'||
    g?.space!=='model-3d'||g?.unit!=='mm'))
  return held(revision,'outside bounded reviewed convex scene');
 const edgeCount=geometry.reduce((n,g)=>n+(g.data?.edges?.length||0),0);
 if(edgeCount>40)
  return held(revision,'source-edge interval evaluation budget exceeded');
 const names=new Set(),bodies=[],segments=[];
 try{
  for(let i=0;i<geometry.length;i++){
   const g=geometry[i];
   if(typeof g.id!=='string'||names.has(g.id))
    return held(revision,'nonunique original geometry identity');
   names.add(g.id);
   const proof=verifiedConvexMeshHalfspaces(g);
   // The numerical kernels receive ONLY the verified original M0 source
   // halfspaces. Internal numeric IDs are disjoint from client geometry IDs.
   const id='M0Solid'+(i+1);
   const vertices=Object.values(g.data.points).map(p=>({x:p.x,y:p.y,z:p.z}));
   const hull=certifyConvexVertices({solid:{
    id,halfspaces:proof.halfspaces,vertices
   }});
   bodies.push({id,originalGeometryId:g.id,
    halfspaces:proof.halfspaces,vertices,hull});
   for(const e of g.data.edges){
    const [a,b]=e,from=g.data.points[a],to=g.data.points[b];
    segments.push({sourceGeometryId:g.id,
     sourceEdgeId:g.id+'::'+[a,b].sort().join('|'),
     sourceVertexIds:[a,b],source:{
      id:'M0Edge'+(segments.length+1),
      from:{x:from.x,y:from.y,z:from.z},
      to:{x:to.x,y:to.y,z:to.z}
     }});
   }
  }
 }catch(e){
  return held(revision,'source convex topology or numeric hull failed: '+e.message);
 }
 const solids=bodies.map(x=>({id:x.id,halfspaces:x.halfspaces}));
 const views={},counts={collapsed:0,hidden:0,clear:0,unknown:0,ordered:0};
 for(const view of VIEWS){
  const observerDirection=FIRST_ANGLE_OBSERVER_RAYS[view];
  const solidPairOrders=[];
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
   const a=bodies[i],b=bodies[j];
   const trusted=a.hull.vertexHullVerified&&b.hull.vertexHullVerified;
   const front=trusted?certifyGlobalDepthOrder({
    front:a,back:b,observerDirection}):null;
   const back=trusted?certifyGlobalDepthOrder({
    front:b,back:a,observerDirection}):null;
   const winner=front?.strictDepthOrderVerified?a.originalGeometryId:
    back?.strictDepthOrderVerified?b.originalGeometryId:null;
   if(winner)counts.ordered++;
   solidPairOrders.push({originalGeometryIds:[a.originalGeometryId,b.originalGeometryId],
    originalExtremeVerticesIndependentlyCertified:trusted,
    frontGeometryIdIfGloballySeparated:winner,
    strictGlobalDepthSeparationVerified:!!winner,
    projectedRayIntersectionVerified:false});
  }
  const edges=[];
  for(const row of segments){
   const a=project(row.source.from)[view],b=project(row.source.to)[view];
   if(Math.hypot(a.u-b.u,a.v-b.v)<=1e-8){
    counts.collapsed++;
    edges.push({sourceGeometryId:row.sourceGeometryId,
     sourceEdgeId:row.sourceEdgeId,sourceVertexIds:row.sourceVertexIds,
     fromProjectedModelMm:a,toProjectedModelMm:b,
     status:'collapsed-projection',runs:[],v5ActionAuthorized:false});
    continue;
   }
   try{
    const witness=partitionM0Segment({
     source:row.source,solids,observerDirection
    });
    const runs=witness.runs.map(run=>({
     originalSourceParameterRange:[run.from,run.to],
     visibilityEvidence:run.status,
     originalOccluderGeometryIds:run.occluderIds.map(id=>
      bodies.find(body=>body.id===id).originalGeometryId),
     independentlyContinuousM0OpenInterval:run.status!=='undetermined',
     depthOrderVerified:false
    }));
    for(const run of runs){
     if(run.visibilityEvidence==='hidden-within-supplied-solids')counts.hidden++;
     else if(run.visibilityEvidence==='clear-within-supplied-solids')counts.clear++;
     else counts.unknown++;
    }
    edges.push({sourceGeometryId:row.sourceGeometryId,
     sourceEdgeId:row.sourceEdgeId,sourceVertexIds:row.sourceVertexIds,
     fromProjectedModelMm:a,toProjectedModelMm:b,
     status:'audited-open-intervals',runs,
     allOpenRunsClassified:witness.allOpenRunsClassified,
     sourceEndpointTopologyVerified:false,officialLineStyle:'undetermined',
     v5ActionAuthorized:false});
   }catch(e){
    counts.unknown++;
    edges.push({sourceGeometryId:row.sourceGeometryId,
     sourceEdgeId:row.sourceEdgeId,sourceVertexIds:row.sourceVertexIds,
     fromProjectedModelMm:a,toProjectedModelMm:b,status:'undetermined',
     reason:'M0 source-edge interval unresolved: '+e.message,
     runs:[],officialLineStyle:'undetermined',v5ActionAuthorized:false});
   }
  }
  views[view]={edges,solidPairOrders};
 }
 return freeze({
  schema:'draftai-reviewed-real-m0-scene-partitions/1',revision,
  status:'actual-reviewed-source-open-interval-evidence',
  sourceGeometryIds:geometry.map(g=>g.id),
  auditedSolidCount:bodies.length,
  verifiedExtremeVertexSetCount:bodies.filter(b=>b.hull.vertexHullVerified).length,
  originalSourceEdgeViewCount:segments.length*VIEWS.length,
  collapsedSourceProjections:counts.collapsed,
  certifiedHiddenOpenRuns:counts.hidden,certifiedClearOpenRuns:counts.clear,
  unresolvedOpenRuns:counts.unknown,
  globallyDepthSeparatedSolidPairs:counts.ordered,views,
  completeSceneVerified:false,sourceEndpointTopologyVerified:false,
  officialLineStylesVerified:false,constructionIntentAuthorized:false,
  v5VerifiedExportReady:false
 });
}
module.exports={auditReviewedM0ScenePartitions};
