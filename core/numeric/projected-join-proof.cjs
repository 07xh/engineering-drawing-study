'use strict';
/**
 * Conservative M0 projected join proof for already audited open-edge intervals.
 * This module cannot certify a whole contour, a complete scene or V5 line style.
 * It only certifies a local join when two source endpoints are the SAME verified
 * 3D vertex, project to the SAME 2D location, and independently proven point-ray
 * visibility agrees with both adjacent open interiors.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const validId=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(x);
const validPoint=(p,axes)=>p&&typeof p==='object'&&!Array.isArray(p)&&axes.every(k=>finite(p[k])&&Math.abs(p[k])<=1e8);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
function proveProjectedJoin({left,right,vertex,view,toleranceMm=1e-7}={}){
 if(!['V','H','W'].includes(view)||!finite(toleranceMm)||toleranceMm<=0||toleranceMm>1e-2)
  throw new TypeError('canonical view and bounded tolerance required');
 for(const edge of [left,right]){
  if(!edge||!validId(edge.edgeId)||!validId(edge.vertexId)||edge.view!==view||
   !validPoint(edge.projectedEndpoint,['u','v'])||
   !['visible','hidden','undetermined'].includes(edge.openVisibility)||
   edge.openIntervalCertified!==true)
   throw new TypeError('verified adjacent open interval required');
 }
 if(!vertex||!validId(vertex.id)||vertex.view!==view||
  !validPoint(vertex.projectedPoint,['u','v'])||
  !['visible','hidden','undetermined'].includes(vertex.visibility)||
  typeof vertex.pointRayCertified!=='boolean')
  throw new TypeError('point-ray witness required');
 const reasons=[];
 if(left.edgeId===right.edgeId)reasons.push('same-edge-not-a-join');
 if(left.vertexId!==right.vertexId||left.vertexId!==vertex.id)
  reasons.push('distinct-source-vertices');
 for(const e of [left,right]){
  if(Math.hypot(e.projectedEndpoint.u-vertex.projectedPoint.u,
   e.projectedEndpoint.v-vertex.projectedPoint.v)>toleranceMm)
   reasons.push('projected-endpoint-mismatch');
 }
 if(!vertex.pointRayCertified||vertex.visibility==='undetermined')
  reasons.push('uncertified-point-ray');
 if(left.openVisibility==='undetermined'||right.openVisibility==='undetermined')
  reasons.push('uncertified-open-interval');
 if(left.openVisibility!==right.openVisibility||
    left.openVisibility!==vertex.visibility)
  reasons.push('visibility-transition-at-join');
 // The caller must still prove the complete scene and official line-style
 // eligibility; local point rays never grant those global certificates.
 return freeze({schema:'draftai-projected-join-proof/1',view,
  sourceVertexId:vertex.id,sourceEdgeIds:[left.edgeId,right.edgeId],
  status:reasons.length?'undetermined':'local-join-certified',
  visibility:reasons.length?'undetermined':vertex.visibility,
  reasons:[...new Set(reasons)],localJoinVerified:reasons.length===0,
  completeSceneVerified:false,fullContourVerified:false,
  officialLineStyleVerified:false,v5VerifiedExportReady:false});
}
module.exports={proveProjectedJoin};
