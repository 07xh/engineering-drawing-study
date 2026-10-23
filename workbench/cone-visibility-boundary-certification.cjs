'use strict';
/**
 * Analytic certification of open V/W lateral intervals and their boundaries.
 * Ray witnesses are independent diagnostics, not a proof of continuum.
 * A style must not cross a silhouette root; endpoints stay unresolved.
 */
const {continuousConeLateralVisibility}=require('./cone-continuous-lateral-visibility.cjs');
const {coneVWSolidRayCrossValidation}=require('./cone-vw-solid-ray-cross-validation.cjs');
function coneVisibilityBoundaryCertification(cone,plane,options={}){
 const analytic=continuousConeLateralVisibility(cone,plane,options);
 if(analytic.status!=='analytic-lateral-intervals')
  return {status:'not-verified',reason:analytic.reason,intervals:null};
 const witness=coneVWSolidRayCrossValidation(cone,plane,options);
 if(witness.status!=='midpoint-witnesses-consistent')
  return {status:'not-verified',reason:'independent full-solid ray cross-check failed',witnesses:witness.witnesses,intervals:null};
 const intervals={};
 for(const view of ['V','W']){
  const pieces=analytic.views[view];
  if(!pieces.length||pieces.some(p=>!(p.toRadians>p.fromRadians)))
   return {status:'not-verified',reason:'invalid analytic partition',intervals:null};
  for(let i=1;i<pieces.length;i++){
   if(Math.abs(pieces[i-1].toRadians-pieces[i].fromRadians)>1e-8)
    return {status:'not-verified',reason:'analytic partition gap',intervals:null};
  }
  intervals[view]=pieces.map(p=>({
   fromRadians:p.fromRadians,toRadians:p.toRadians,
   visibility:p.visibility,
   lineStyle:p.visibility==='visible'?'solid':'dashed',
   proof:'analytic-silhouette-root-partition-and-independent-first-hit-ray',
   boundaryVisibility:'undetermined',
   certifiedOpenInterval:true
  }));
 }
 return {status:'verified-open-lateral-interval-styles',revision:analytic.revision,
  intervals,sourceConfirmed:true,
  endpointsVerified:false,capChordVisibilityVerified:false,
  fullContourVisibilityVerified:false,
  v5LineStyleConnected:false,publicWorkbenchConnected:false};
}
module.exports={coneVisibilityBoundaryCertification};
