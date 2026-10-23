'use strict';
/**
 * Cross-check interval midpoint visibility against an independently
 * computed full-solid first-hit ray. Not a replacement for continuous
 * interval proof; finite witnesses cannot prove a whole interval.
 */
const {continuousConeLateralVisibility}=require('./cone-continuous-lateral-visibility.cjs');
const {coneHorizontalSolidRay}=require('../engines/spatial/sections/cone-horizontal-solid-ray.cjs');
function coneVWSolidRayCrossValidation(cone,plane,options={}){
 const source=continuousConeLateralVisibility(cone,plane,options);
 if(source.status!=='analytic-lateral-intervals')
  return {status:'not-verified',reason:source.reason,witnesses:[]};
 const a=source.spatialIntent.operation.analytic;
 const witnesses=[];
 for(const view of ['V','W']){
  for(const interval of source.views[view]){
   const t=(interval.fromRadians+interval.toRadians)/2;
   const d=a.denominator.constant+a.denominator.cosCoeff*Math.cos(t)+
    a.denominator.sinCoeff*Math.sin(t);
   const rho=a.numeratorMm/d;
   const point={x:a.apex.x+rho*Math.cos(t),
    y:a.apex.y+rho*Math.sin(t),
    z:a.apex.z-cone.heightMm*rho/cone.radiusMm};
   const result=coneHorizontalSolidRay(cone,point,view);
   const consistent=result.status===interval.visibility;
   witnesses.push({view,parameterRadians:t,
    expected:interval.visibility,observed:result.status,
    consistent,proof:result.proof||null});
  }
 }
 if(witnesses.some(w=>!w.consistent))
  return {status:'not-verified',reason:'full solid ray disagrees with analytic interval',
   witnesses,continuousIntervalProvedBySamples:false};
 return {status:'midpoint-witnesses-consistent',revision:source.revision,
  witnesses,continuousIntervalProvedBySamples:false,
  originalAnalyticIntervalProofRetained:true,
  capChordVisibilityVerified:false,fullContourVisibilityVerified:false,
  publicWorkbenchConnected:false};
}
module.exports={coneVWSolidRayCrossValidation};
