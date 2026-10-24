'use strict';
/**
 * Only consume depth order if independently certified vertex completeness
 * succeeds for both solids. The output never upgrades scene or V5 status.
 */
const {certifyConvexVertices}=require('./m0-convex-vertex-completeness.cjs');
const {certifyGlobalDepthOrder}=require('./m0-global-depth-separation.cjs');
const {partitionM0Segment}=require('./m0-joint-visibility-partition.cjs');
function auditM0TrustedDepthPartition({source,solids,observerDirection,
 marginMm=1e-7,angularTolerance=1e-12}={}){
 const partition=partitionM0Segment({source,solids,observerDirection,
  marginMm,angularTolerance});
 const vertices=solids.map(s=>certifyConvexVertices({solid:s,
  toleranceMm:marginMm,angularTolerance}));
 const pairs=[];
 for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++){
  const trusted=vertices[i].vertexHullVerified&&vertices[j].vertexHullVerified;
  const forward=trusted?certifyGlobalDepthOrder({front:solids[i],back:solids[j],
   observerDirection,marginMm}):null;
  const reverse=trusted?certifyGlobalDepthOrder({front:solids[j],back:solids[i],
   observerDirection,marginMm}):null;
  pairs.push({a:solids[i].id,b:solids[j].id,
   status:forward?.strictDepthOrderVerified?'a-front':
    reverse?.strictDepthOrderVerified?'b-front':'undetermined',
   trustedVertices:trusted});
 }
 const runs=partition.runs.map(run=>{
  const relevant=pairs.filter(p=>run.occluderIds.includes(p.a)&&
   run.occluderIds.includes(p.b));
  return {...run,globalPairDepthSeparated:relevant.length>0&&
   relevant.every(p=>p.status!=='undetermined'),
   // Pair separation is not per-ray nearest-hit or complete-scene proof.
   depthOrderVerified:false};
 });
 return Object.freeze({schema:'draftai-m0-trusted-depth-partition/1',
  partition,vertices,pairs,runs,
  completeSceneVerified:false,endpointJoinVerified:false,
  officialLineStyleVerified:false,v5VerifiedExportReady:false});
}
module.exports={auditM0TrustedDepthPartition};
