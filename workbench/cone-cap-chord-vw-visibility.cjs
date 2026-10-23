'use strict';
/** Conservative V/W visibility: bottom disk ray overlap prevents a lateral-only proof. */
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
   ...s,visibility:'undetermined',
   visibilityProof:'bottom-disk-ray-overlap-requires-solid-occlusion-proof',
   endpointsVisibility:'undetermined'}:s);
 }
 return {...base,views,
  capChordHorizontalInteriorVisibility:'undetermined',
  capChordVWInteriorVisibilityVerified:false,
  capChordVisibilityVerified:false,
  completeSolidVisibilityVerified:false,
  fullContourPresentationVerified:false};
}
module.exports={coneCapChordVWVisibility};
