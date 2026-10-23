'use strict';
/**
 * Narrow analytic occlusion proof for an INTERIOR bottom-cap chord viewed
 * from +Z. No claim about V/W rays or boundary endpoint visibility.
 */
const {coneBoundaryVisibilityComposition}=require('./cone-boundary-visibility-composition.cjs');
function coneCapChordTopOcclusion(cone,plane,options={}){
 const base=coneBoundaryVisibilityComposition(cone,plane,options);
 if(base.status!=='verified-boundary-composition')
  return {status:'not-verified',reason:base.reason,views:null};
 if(!base.capChord)return {...base,
  capChordTopInteriorVisibility:'not-applicable',
  capChordTopOcclusionVerified:false};
 const {start,end}=base.capChord;
 const cx=cone.baseCenter.x,cy=cone.baseCenter.y,r=cone.radiusMm;
 const midpoint={x:(start.x+end.x)/2,y:(start.y+end.y)/2};
 const d=Math.hypot(midpoint.x-cx,midpoint.y-cy);
 if(!(d<r-1e-9*Math.max(1,r)))
  return {status:'not-verified',reason:'strict interior chord witness unavailable',views:null};
 // Any interior chord point has radial distance < r, hence cone upper
 // surface z=baseZ+h*(1-rho/r)>baseZ. +Z observer hits this surface
 // before the bottom-cap chord. Endpoints lie on rim: excluded.
 const views={...base.views,H:base.views.H.map(s=>s.kind==='cap-chord'?
  {...s,visibility:'occluded-interior',
   visibilityProof:'analytic-positive-height-upper-envelope',
   endpointsVisibility:'undetermined'}:s)};
 return {...base,views,capChordTopInteriorVisibility:'occluded',
  capChordTopOcclusionVerified:true,capChordVisibilityVerified:false,
  completeSolidVisibilityVerified:false,
  fullContourPresentationVerified:false};
}
module.exports={coneCapChordTopOcclusion};
