'use strict';
/**
 * Strict interior bottom-cap chord ray test for V(-Y) and W(+X).
 * For points on z=baseZ the cone has zero lateral radius, hence an
 * orthographic horizontal ray at that z cannot meet the cone except
 * on the base rim. This proves chord interior is NOT occluded by the
 * finite cone for horizontal observer rays. Endpoints excluded.
 */
const {coneCapChordTopOcclusion}=require('./cone-cap-chord-top-occlusion.cjs');
function coneCapChordVWVisibility(cone,plane,options={}){
 const base=coneCapChordTopOcclusion(cone,plane,options);
 if(base.status!=='verified-boundary-composition')
  return {status:'not-verified',reason:base.reason,views:null};
 if(!base.capChord)return {...base,
  capChordHorizontalInteriorVisibility:'not-applicable',
  capChordVWInteriorVisibilityVerified:false};
 const {start,end}=base.capChord;
 const cx=cone.baseCenter.x,cy=cone.baseCenter.y,r=cone.radiusMm;
 const midpoint={x:(start.x+end.x)/2,y:(start.y+end.y)/2};
 const margin=r-Math.hypot(midpoint.x-cx,midpoint.y-cy);
 const scale=Math.max(1,r,cone.heightMm);
 if(!(margin>1e-9*scale)||Math.abs(start.z-cone.baseCenter.z)>1e-8*scale||
    Math.abs(end.z-cone.baseCenter.z)>1e-8*scale)
  return {status:'not-verified',reason:'strict bottom-cap chord interior not certified',views:null};
 const views={...base.views};
 for(const view of ['V','W']){
  views[view]=base.views[view].map(s=>s.kind==='cap-chord'?{
   ...s,visibility:'visible-interior',
   visibilityProof:'horizontal-ray-at-base-height-has-no-lateral-cone-intersection',
   endpointsVisibility:'undetermined'}:s);
 }
 return {...base,views,
  capChordHorizontalInteriorVisibility:'visible',
  capChordVWInteriorVisibilityVerified:true,
  capChordVisibilityVerified:false,
  completeSolidVisibilityVerified:false,
  fullContourPresentationVerified:false};
}
module.exports={coneCapChordVWVisibility};
