'use strict';
/**
 * 04/09: finish the mathematical STATUS partition of the verified full-ellipse
 * cone/plane boundary, including support-root tangencies and the closed seam.
 * Reuses existing analytic cone M3 and the established #432 ray oracle.
 *
 * A convex clipped cone intersects any observer ray in at most one interval.
 * For a boundary ray p+t*d, the kept halfspace slope S and lateral quadratic
 * F(p+t*d)=B*t+A*t*t decide whether the ray goes into or out of the body.
 * An outward slope excludes ALL later intersections by convexity.
 * Intervals are analytic source-theta intervals, not sample polylines.
 *
 * Critical points with unresolved contact are UNKNOWN. This never promotes
 * visible/hidden SVG line styles, base-cap contours, other solids or the
 * whole 3D image to "complete visibility verified".
 */
const {verifiedConeSpatialIntent}=
 require('./verified-cone-spatial-intent.cjs');
const {classifyConeSectionVisibility}=
 require('../engines/spatial/sections/cone-cut-ray-visibility.cjs');
const {DIRS,validatedDirections}=
 require('./cone-open-ray-v5-mapping.cjs');
const dot=(p,q)=>p.x*q.x+p.y*q.y+p.z*q.z;
const distance=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z);
const finite=Number.isFinite;
const EPS=1e-10;
function completedConeBoundaryRays(cone,plane,{
 kind='full-ellipse',sourceConfirmed=false,revision=0,samples=64,
 retainedHalfspace,observerDirections
}={}){
 if(!['positive','negative'].includes(retainedHalfspace))
  throw new TypeError('explicit cone halfspace required');
 const directions=validatedDirections(observerDirections||{
  V:{...DIRS.V},H:{...DIRS.H},W:{...DIRS.W}});
 if(kind!=='full-ellipse')
  return {status:'not-supported',revision,
   reason:'clipped ellipse seam and cap-chord endpoints require a separate proof',
   completeAnalyticBoundaryVisibilityVerified:false,
   completeSolidVisibilityVerified:false,views:null};
 const src=verifiedConeSpatialIntent(cone,plane,{
  kind,sourceConfirmed,revision,samples,
  sheetTransform:{origin:{x:0,y:0},scale:1}
 });
 if(src.status!=='ready')
  return {status:'not-verified',revision,reason:src.reason,
   completeAnalyticBoundaryVisibilityVerified:false,
   completeSolidVisibilityVerified:false,views:null};
 const op=src.spatialIntent.operation,analytic=op.analytic;
 const q=op.samplePoints,k=cone.radiusMm/cone.heightMm;
 const scale=Math.max(1,cone.radiusMm,cone.heightMm);
 const tol=1e-7*scale;
 if(analytic.closed!==true||
    distance(q[0],q.at(-1))>tol ||
    Math.abs(analytic.parameterRadians[1]-
     analytic.parameterRadians[0]-2*Math.PI)>1e-7)
  throw new RangeError('closed analytic cone boundary proof required');
 const nn=Math.hypot(...Object.values(plane.normal));
 const n=plane.normal,sign=retainedHalfspace==='positive'?1:-1;
 const [begin,end]=analytic.parameterRadians;
 const output={},boundariesSeen={};
 for(const view of ['V','H','W']){
  const d=directions[view];
  const ray=classifyConeSectionVisibility(cone,plane,{
   kind,sourceConfirmed:true,retainedHalfspace,
   observerDirection:d,samples
  });
  if(ray.status!=='ready'||!ray.sourceBoundaryVerified||
     ray.boundaryEndpointsVerified!==false)
   throw new RangeError('existing cone open-interval ray oracle rejected source');
  const slope=sign*dot(n,d)/nn;
  const A=d.x*d.x+d.y*d.y-k*k*d.z*d.z;
  const support=theta=>Math.cos(theta)*d.x+Math.sin(theta)*d.y+k*d.z;
  const local=theta=>{
   const g=support(theta);
   if(slope < -EPS)return {status:'visible',reason:'leaves-retained-halfspace'};
   if(slope > EPS){
    if(g>EPS)return {status:'visible',reason:'strict-outward-cone-support'};
    if(g< -EPS)return {status:'hidden',reason:'strict-inward-cone-support'};
    // Exact lateral silhouette tangent: B=0, A sign decides if
    // the ray leaves or enters the cone at quadratic order.
    if(Math.abs(g)<=EPS && A>EPS)
     return {status:'visible',reason:'positive-quadratic-tangent-exit'};
    if(Math.abs(g)<=EPS && A< -EPS)
     return {status:'hidden',reason:'negative-quadratic-tangent-entry'};
   }
   return {status:'undetermined',reason:'cut-plane-parallel-or-generator-tangent'};
  };
  const intervals=[],critical=[];
  let previous=begin;
  for(const run of ray.runs){
   if(run.kind!=='lateral-arc'||!Array.isArray(run.angularInterval))
    throw new RangeError('unexpected cone boundary segment');
   const [lo,hi]=run.angularInterval;
   if(![lo,hi].every(finite)||Math.abs(previous-lo)>1e-7||hi<=lo)
    throw new RangeError('gapped analytic source parameter partition');
   previous=hi;
   const midpoint=(lo+hi)/2,evaluated=local(midpoint);
   // Quadratic tangent classification applies only at isolated roots.
   // A midpoint with zero support cannot claim an entire open interval.
   if(Math.abs(support(midpoint))<=EPS&&slope>EPS)
    evaluated.status='undetermined';
   if(evaluated.status!==run.visibility)
    throw new RangeError('independent quadratic ray test disagrees with M3 oracle');
   intervals.push({parameterRadians:[lo,hi],visibility:run.visibility,
    analyticOpenIntervalVerified:run.openIntervalCertified===true,
    reason:run.reason});
  }
  if(Math.abs(previous-end)>1e-7)
   throw new RangeError('incomplete analytic boundary domain');
  const cuts=[begin,...intervals.map(x=>x.parameterRadians[1])];
  // Duplicate 0/2pi seam represents ONE spatial point, not two edges.
  for(const theta of cuts){
   const one=local(theta);
   critical.push({thetaRadians:theta,...one,
    exactTangentOrSeamScope:'analytic-parameter-point'});
  }
  const seamA=critical[0].status,seamB=critical.at(-1).status;
  if(seamA!==seamB)
   throw new RangeError('closed analytic seam changed ray classification');
  const allOpen=intervals.every(x=>x.analyticOpenIntervalVerified&&
   x.visibility!=='undetermined');
  const allPoints=critical.every(x=>x.status!=='undetermined');
  output[view]={observerDirection:d,intervals,critical,
   openIntervalsCertified:allOpen,criticalPointsCertified:allPoints,
   wholeAnalyticSourceBoundaryCertified:allOpen&&allPoints,
   projectedOverlapWithOtherSolidsCertified:false};
  boundariesSeen[view]=cuts.length;
 }
 return {
  status:'analytic-convex-boundary-ray-evidence',
  revision,sourceSpatialIntentId:src.spatialIntent.id,
  retainedHalfspace,geometryKind:kind,
  views:output,boundaryPartitionCount:boundariesSeen,
  exactConicSourceFromM3:true,
  closedSourceSeamVerified:true,
  quadraticTangentContactEvaluated:true,
  completeAnalyticBoundaryVisibilityVerified:
   ['V','H','W'].every(v=>output[v].wholeAnalyticSourceBoundaryCertified),
  completeSolidVisibilityVerified:false,
  capAndOtherObjectOcclusionVerified:false,
  V5EngineeringLineStylesCertified:false,
  firstAnglePaperLinePresentationCertified:false,
  textbookWholeProblemVerified:false
 };
}
module.exports={completedConeBoundaryRays};
