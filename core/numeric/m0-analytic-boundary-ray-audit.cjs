'use strict';
/**
 * Independent point-ray classification at analytic M0 segment partition
 * boundaries. Uses real convex ray depth kernel. A transition can be
 * certified only as a point-ray classification, not as a contour join or
 * official V5 stroke.
 */
const {partitionM0Segment}=require('./m0-joint-visibility-partition.cjs');
const {traceConvexRayDepth}=require('./convex-ray-depth.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
function auditM0PartitionBoundaries({source,solids,observerDirection,
 marginMm=1e-7,angularTolerance=1e-12}={}){
 const partition=partitionM0Segment({source,solids,observerDirection,
  marginMm,angularTolerance});
 const from=source.from,to=source.to;
 const boundaryParameters=[0,...partition.transitionParameters,1];
 const boundaries=boundaryParameters.map(s=>{
  if(!finite(s)||s<0||s>1)throw new RangeError('invalid analytic boundary parameter');
  const point={x:from.x+(to.x-from.x)*s,
   y:from.y+(to.y-from.y)*s,z:from.z+(to.z-from.z)*s};
  const depth=traceConvexRayDepth({point,observerDirection,solids,
   toleranceMm:marginMm,angleTolerance:angularTolerance});
  return {parameter:s,point,rayStatus:depth.status,
   nearestSolidId:depth.nearestSolidId,
   depthOrderVerified:depth.depthOrderVerified,
   pointRayCertified:depth.status!=='undetermined',
   // A ray hit is not a continuous join; ray misses do not prove
   // absence of other, unlisted scene geometry.
   endpointJoinVerified:false,officialLineStyleVerified:false};
 });
 const unresolved=boundaries.filter(x=>!x.pointRayCertified);
 return freeze({schema:'draftai-m0-analytic-boundary-ray-audit/1',
  partition,boundaries,
  allSuppliedPointRaysResolved:unresolved.length===0,
  unresolvedBoundaryCount:unresolved.length,
  completeSceneVerified:false,continuousJoinVerified:false,
  officialLineStyleVerified:false,v5VerifiedExportReady:false});
}
module.exports={auditM0PartitionBoundaries};
