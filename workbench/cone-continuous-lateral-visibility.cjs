'use strict';
/**
 * Exact angular visibility partitions for strict elliptical lateral sections
 * of an upright right cone. Observer rays: V=-Y, W=+X, H=+Z.
 * Side visibility only: cap and full solid occlusion remain uncertified.
 */
const {verifiedConeSpatialIntent}=require('./verified-cone-spatial-intent.cjs');
const TAU=2*Math.PI;
function continuousConeLateralVisibility(cone,plane,options={}){
 const src=verifiedConeSpatialIntent(cone,plane,options);
 if(src.status!=='ready')return {status:'not-verified',reason:src.reason,views:null};
 const interval=src.spatialIntent.operation.analytic.parameterRadians;
 const [start,end]=interval;
 const eps=1e-10;
 const roots=(base,period)=>{const out=[];
  for(let k=Math.ceil((start-base)/period-eps);k<=(end-base)/period+eps;k++){
   const t=base+k*period;
   if(t>start+eps&&t<end-eps)out.push(t);
  }return out;};
 const split=(breaks,classification)=>{
  const points=[start,...breaks.sort((a,b)=>a-b),end];
  return points.slice(1).map((to,i)=>({
   fromRadians:points[i],toRadians:to,
   visibility:classification((points[i]+to)/2)
  }));
 };
 // At a fixed height the cone's front/back side is determined by the
 // azimuth. For V(-Y), front is y<0; for W(+X), front is x>0.
 // A ray from the rear meets the opposite cone generator at the same z.
 // For H(+Z), every lateral point lies on the first encountered upper
 // envelope of this upright cone (the base disk is below it).
 const V=split(roots(0,Math.PI),t=>Math.sin(t)<0?'visible':'occluded');
 const W=split(roots(Math.PI/2,Math.PI),t=>Math.cos(t)>0?'visible':'occluded');
 const H=[{fromRadians:start,toRadians:end,visibility:'visible'}];
 const views={V,H,W};
 const verified=Object.values(views).every(a=>a.length&&a.every(s=>
  s.toRadians>s.fromRadians&&['visible','occluded'].includes(s.visibility)));
 if(!verified)throw new RangeError('invalid analytic visibility partition');
 return {status:'analytic-lateral-intervals',revision:src.revision,
  views,spatialIntent:src.spatialIntent,
  lateralContinuousIntervalsVerified:true,
  silhouetteBoundaryVisibility:'undetermined',
  capOcclusionVerified:false,completeSolidVisibilityVerified:false,
  firstAngleLayoutVerified:false,fullContourVerified:false,
  publicWorkbenchConnected:false};
}
module.exports={continuousConeLateralVisibility};
