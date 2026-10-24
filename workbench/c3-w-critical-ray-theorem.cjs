'use strict';
/**
 * C3/W: analytic positive-ray proof at selected x positions on CURRENT
 * M3 finite orthogonal-cylinder lateral/lateral branches.
 *
 * W observer travels +x. For either cylinder's lateral source point,
 *   F(x+t)-F(x) = t * (t + 2*(x-xCenter)).
 * x >= xCenter proves strictly EXTERIOR for every t>0 (even at equality).
 * x < xCenter, with the other axial coordinate STRICTLY between finite
 * caps, proves a nonempty positive-t opaque interior interval.
 *
 * Both cylinder sources must be re-derived from the same reviewed M3.
 * No pixel sampling, ray-point sampling or inferred line-style signing.
 * Side/cap or projection coincidence remains outside this proof scope.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC3WCriticalRays({input,revision,criticalPoints}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    !Array.isArray(criticalPoints)||criticalPoints.length>512)
  throw new TypeError('C3 W ray requires current revision and <=512 critical points');
 const dir=FIRST_ANGLE_OBSERVER_RAYS.W;
 if(dir.x!==1||dir.y!==0||dir.z!==0)
  throw new RangeError('first-angle W observer convention changed');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 const empty=()=>freeze({schema:'draftai-c3-w-critical-ray-theorem/1',
  revision,status:'not-covered',sourceM3Status:m3.status,points:[],
  standardLineStylesVerified:false,v5Authorized:false});
 if(m3.status!=='scoped-analytic-ready'||
    m3.analyticallyCompleteWithinScope!==true||
    m3.geometryVerifiedWithinSpecialistScope!==true||
    m3.verifiedCapClipping!==true||
    m3.sourceConfirmed!==true||
    m3.officialLineStylesVerified!==false)
  return empty();
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder;
 const byId=new Map(m3.branches.map(b=>[b.id,b]));
 const scale=Math.max(1,Z.radius**2,Y.radius**2);
 const capTol=1e-9*Math.max(1,Z.radius,Y.radius,
  Math.abs(Z.zMin),Math.abs(Z.zMax),
  Math.abs(Y.yMin),Math.abs(Y.yMax));
 const xTol=1e-10*Math.max(1,Z.radius,Y.radius,
  Math.abs(Z.xCenter),Math.abs(Y.xCenter));
 const points=criticalPoints.map((request,index)=>{
  if(!request||typeof request!=='object'||
     typeof request.branchId!=='string'||!Number.isFinite(request.x))
   throw new TypeError('C3 W critical point must identify a finite source branch x');
  const branch=byId.get(request.branchId),x=request.x;
  if(!branch||x<branch.xRange[0]||x>branch.xRange[1])
   throw new RangeError('C3 W critical ray outside verified M3 branch');
  const dy=(Z.radius-Math.abs(x-Z.xCenter))*
   (Z.radius+Math.abs(x-Z.xCenter));
  const dz=(Y.radius-Math.abs(x-Y.xCenter))*
   (Y.radius+Math.abs(x-Y.xCenter));
  const validRadicals=dy>=0&&dz>=0;
  const point=validRadicals?{x,
   y:Z.yCenter+branch.signY*Math.sqrt(dy),
   z:Y.zCenter+branch.signZ*Math.sqrt(dz)}:null;
  const residual=point?Math.max(
   Math.abs((x-Z.xCenter)**2+(point.y-Z.yCenter)**2-Z.radius**2),
   Math.abs((x-Y.xCenter)**2+(point.z-Y.zCenter)**2-Y.radius**2)
  )/scale:Infinity;
  const capsInclusive=point&&
   point.z>=Z.zMin&&point.z<=Z.zMax&&
   point.y>=Y.yMin&&point.y<=Y.yMax;
  const trusted=!!(point&&Object.values(point).every(Number.isFinite)&&
   capsInclusive&&Number.isFinite(residual)&&residual<=1e-9);
  const sources=[
   {id:'zCylinder',xCenter:Z.xCenter,
    capStrict:!!(trusted&&point.z>Z.zMin+capTol&&
     point.z<Z.zMax-capTol)},
   {id:'yCylinder',xCenter:Y.xCenter,
    capStrict:!!(trusted&&point.y>Y.yMin+capTol&&
     point.y<Y.yMax-capTol)}
  ];
  // A W ray beyond both X centers leaves both infinite radial disks,
  // hence also both finite cylinders, for EVERY strictly positive t.
  const exterior=trusted&&sources.every(s=>x>=s.xCenter);
  // When the point is behind one center, its exact radial difference is
  // negative for 0<t<2*(center-x). A strict axial cap margin then proves
  // actual opaque VOLUME, not merely a surface or endpoint sample.
  const blockers=trusted?sources.filter(s=>s.capStrict&&
   s.xCenter-x>xTol).map(s=>({
    solid:s.id,positiveOpenRayParameterRange:[0,2*(s.xCenter-x)],
    fullFiniteAxialSlabInteriorVerified:true
   })):[];
  const occluded=!exterior&&blockers.length>0;
  const rayStatus=exterior?'certified-no-finite-cylinder-ahead':
   occluded?'certified-finite-cylinder-interior-ahead':'undetermined';
  return {id:'critical'+index,branchId:branch.id,x,point3D:point,
   currentM3SourceBranchVerified:trusted,
   scaledSourceSurfaceResidual:residual,
   finiteAxialCapsInclusiveVerified:!!capsInclusive,
   observerDirection:{...dir},radialIdentity:
    'F(x+t)-F(x)=t*(t+2*(x-xCenter)), t>0',
   radialExteriorForEveryPositiveRayParameterVerified:!!exterior,
   positiveOpaqueInteriorIntervals: blockers,
   rayStatus,
   criticalPointWRayWithinTwoFiniteSolidsVerified:exterior||occluded,
   completeProjectedFeatureTopologyVerified:false,
   standardLineStyle:'undetermined',constructionIntentAuthorized:false,
   v5ActionAuthorized:false};
 });
 return freeze({schema:'draftai-c3-w-critical-ray-theorem/1',
  revision,status:'scoped-analytic-critical-W-point-evidence',
  verifiedSourceM3BranchCount:m3.branchCount,points,
  certifiedClearCriticalCount:points.filter(p=>
   p.rayStatus==='certified-no-finite-cylinder-ahead').length,
  certifiedOpaqueCriticalCount:points.filter(p=>
   p.rayStatus==='certified-finite-cylinder-interior-ahead').length,
  undeterminedCriticalCount:points.filter(p=>p.rayStatus==='undetermined').length,
  full3DFeatureTopologyVerified:false,
  standardLineStylesVerified:false,v5Authorized:false});
}
module.exports={auditC3WCriticalRays};
