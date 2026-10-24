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
 // Positive-volume certificate: intersect the strict radial quadratic
 // inequality with the strict finite axial slab. Convexity gives one
 // connected interior interval, independent of midpoint sampling.
 let radialLow=-Infinity,radialHigh=Infinity;
 let radialDegenerate=false;
 if(a>0){
  const disc=b*b-4*a*d;
  if(disc>eps*eps){
   const root=Math.sqrt(disc);
   radialLow=(-b-root)/(2*a);
   radialHigh=(-b+root)/(2*a);
  }else radialDegenerate=true;
 }else if(d>=-eps)radialDegenerate=true;
 let axialLow=-Infinity,axialHigh=Infinity;
 if(Math.abs(dir[axial])>eps){
  const t0=(low-point[axial])/dir[axial];
  const t1=(high-point[axial])/dir[axial];
  axialLow=Math.min(t0,t1);axialHigh=Math.max(t0,t1);
 }else if(point[axial]<=low+eps||point[axial]>=high-eps)
  radialDegenerate=true;
 const lo=Math.max(0,radialLow,axialLow);
 const hi=Math.min(radialHigh,axialHigh);
 const interiorOpenIntervals=!radialDegenerate&&hi>lo+eps?
  [[lo,hi]]:[];
 // These are exact algebraic roots of the two strict inequalities in
 // floating-point arithmetic, not an interval-arithmetic enclosure.
 // A conservative interior witness is separated from all boundaries.
 const interiorWitnesses=interiorOpenIntervals.map(([left,right])=>{
  const t=(left+right)/2;
  const axialValue=point[axial]+t*dir[axial];
  const radialSquared=radial.reduce((sum,k)=>sum+
   (point[k]+t*dir[k]-center[k])**2,0);
  return {t,strictAxialMargin:Math.min(axialValue-low,high-axialValue),
   strictRadialMargin:c.radius**2-radialSquared};
 });
 const strictInteriorWitnessVerified=interiorWitnesses.length>0&&
  interiorWitnesses.every(w=>w.strictAxialMargin>eps&&
   w.strictRadialMargin>eps);
 const positiveInteriorVerified=strictInteriorWitnessVerified;
 const tangent=events.some(e=>e.type==='tangent');
 const ambiguous=generatorCoincidence||tangent||events.some(e=>e.t<=eps);
 return {events,positiveRayBoundaryIntersections:positive.length,
  interiorOpenIntervals,interiorWitnesses,
  strictInteriorWitnessVerified,positiveInteriorVerified,
  generatorCoincidence,tangent,originOnBoundary:events.some(e=>e.t<=eps),
  rayBoundaryStatus:ambiguous?'undetermined-tangent-generator-or-origin':
   positive.length?'forward-boundary-intersection':'no-forward-boundary-intersection',
  lineStyleAuthorized:false};
}
function unionForwardIntervals(rows){
 const sorted=rows.map(r=>({solid:r.solid,range:[...r.range]}))
  .sort((a,b)=>a.range[0]-b.range[0]||a.range[1]-b.range[1]);
 const merged=[];
 for(const row of sorted){
  const last=merged.at(-1);
  // Open intervals meeting at a single boundary point cannot prove that
  // point is in the opaque interior; keep the components separate.
  if(last&&row.range[0]<last.range[1]){
   last.range[1]=Math.max(last.range[1],row.range[1]);
   if(!last.supportingSolids.includes(row.solid))last.supportingSolids.push(row.solid);
  }else merged.push({range:[...row.range],supportingSolids:[row.solid]});
 }
 return merged;
}
function auditC3TransitionRays({input,point,view}={}){
 if(!input?.zCylinder||!input?.yCylinder||
  !point||!['x','y','z'].every(k=>Number.isFinite(point[k]))||
  !['V','H','W'].includes(view))
  throw new TypeError('C3 requires finite cylinders, finite 3D point and V/H/W');
 const dir=FIRST_ANGLE_OBSERVER_RAYS[view];
 const z=rayCylinder(point,dir,input.zCylinder,'z');
 const y=rayCylinder(point,dir,input.yCylinder,'y');
 const combined=[...z.interiorOpenIntervals.map(range=>({solid:'zCylinder',range})),
  ...y.interiorOpenIntervals.map(range=>({solid:'yCylinder',range}))]
  .sort((a,b)=>a.range[0]-b.range[0]||a.range[1]-b.range[1]);
 const unionInteriorOpenIntervals=unionForwardIntervals(combined);
 // A source point lies on both lateral surfaces. A certified positive
 // interior interval for either solid establishes strict occlusion ahead,
 // but does not establish whole-curve continuity or standard stroke style.
 const positiveInteriorOcclusionVerified=unionInteriorOpenIntervals.length>0&&
  (z.positiveInteriorVerified||y.positiveInteriorVerified);
 const originAmbiguous=z.originOnBoundary||y.originOnBoundary;
 const grazingOrTie=z.tangent||y.tangent||z.generatorCoincidence||
  y.generatorCoincidence||originAmbiguous;
 const endpointVisibilityStatus=positiveInteriorOcclusionVerified?
  'certified-forward-interior-occlusion':
  grazingOrTie?'undetermined-tangent-generator-or-depth-tie':
  'no-positive-interior-found-not-full-feature-clearance';
 return freeze({schema:'draftai-c3-transition-ray-candidates/1',view,point:{...point},
  zCylinder:z,yCylinder:y,combinedForwardInteriorIntervals:combined,
  unionInteriorOpenIntervals,
  nearestStrictOpaqueInterval:unionInteriorOpenIntervals.length?
   {...unionInteriorOpenIntervals[0]}:null,
  nearestOpaqueInteriorStartsAtSource:unionInteriorOpenIntervals.length?
   unionInteriorOpenIntervals[0].range[0]===0:false,
  positiveInteriorOcclusionVerified,
  endpointVisibilityStatus,
  ambiguousBoundaryOrDepthTie:grazingOrTie,
  fullFiniteVolumeVisibilityVerified:false,
  depthTieResolved:false,officialLineStyle:'undetermined',v5Authorized:false});
}
module.exports={auditC3TransitionRays};
