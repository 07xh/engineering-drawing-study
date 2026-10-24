'use strict';
/** Exact quadratic ray/finite-cylinder intersection candidates at a 3D point.
 * Tangencies and coincident generators remain indeterminate for line signing.
 */
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function rayCylinder(point,dir,c,axis){
 const axial=axis==='z'?'z':'y';
 const radial=axis==='z'?['x','y']:['x','z'];
 const center=axis==='z'?{x:c.xCenter,y:c.yCenter}:
  {x:c.xCenter,z:c.zCenter};
 const a=radial.reduce((n,k)=>n+dir[k]**2,0);
 const b=2*radial.reduce((n,k)=>n+(point[k]-center[k])*dir[k],0);
 const d=radial.reduce((n,k)=>n+(point[k]-center[k])**2,0)-c.radius**2;
 const low=c[axial+'Min'],high=c[axial+'Max'];
 const eps=1e-10*Math.max(1,c.radius,Math.abs(low),Math.abs(high));
 const events=[];
 const add=(t,type)=>{
  if(!Number.isFinite(t)||t< -eps)return;
  const v=Math.max(0,t),p=Object.fromEntries(['x','y','z'].map(k=>[k,point[k]+v*dir[k]]));
  if(p[axial]<low-eps||p[axial]>high+eps)return;
  events.push({t:v,type,point:p});
 };
 let generatorCoincidence=false;
 if(a>0){
  const disc=b*b-4*a*d;
  if(disc>eps*eps){const root=Math.sqrt(disc);add((-b-root)/(2*a),'lateral');add((-b+root)/(2*a),'lateral');}
  else if(Math.abs(disc)<=eps*eps)add(-b/(2*a),'tangent');
 }else if(Math.abs(d)<=eps)generatorCoincidence=true;
 if(Math.abs(dir[axial])>eps){
  for(const bound of [low,high]){
   const t=(bound-point[axial])/dir[axial];
   if(t< -eps)continue;
   const q=radial.reduce((n,k)=>n+(point[k]+t*dir[k]-center[k])**2,0);
   if(q<=c.radius**2+eps)add(t,'cap');
  }
 }else if(Math.abs(point[axial]-low)<=eps||Math.abs(point[axial]-high)<=eps)
  generatorCoincidence=true;
 events.sort((x,y)=>x.t-y.t);
 const positive=events.filter(e=>e.t>eps);
 const tangent=events.some(e=>e.type==='tangent');
 const ambiguous=generatorCoincidence||tangent||events.some(e=>e.t<=eps);
 return {events,positiveRayBoundaryIntersections:positive.length,
  generatorCoincidence,tangent,originOnBoundary:events.some(e=>e.t<=eps),
  rayBoundaryStatus:ambiguous?'undetermined-tangent-generator-or-origin':
   positive.length?'forward-boundary-intersection':'no-forward-boundary-intersection',
  lineStyleAuthorized:false};
}
function auditC3TransitionRays({input,point,view}={}){
 if(!input?.zCylinder||!input?.yCylinder||
  !point||!['x','y','z'].every(k=>Number.isFinite(point[k]))||
  !['V','H','W'].includes(view))
  throw new TypeError('C3 requires finite cylinders, finite 3D point and V/H/W');
 const dir=FIRST_ANGLE_OBSERVER_RAYS[view];
 const z=rayCylinder(point,dir,input.zCylinder,'z');
 const y=rayCylinder(point,dir,input.yCylinder,'y');
 return freeze({schema:'draftai-c3-transition-ray-candidates/1',view,point:{...point},
  zCylinder:z,yCylinder:y,
  fullFiniteVolumeVisibilityVerified:false,
  depthTieResolved:false,officialLineStyle:'undetermined',v5Authorized:false});
}
module.exports={auditC3TransitionRays};
