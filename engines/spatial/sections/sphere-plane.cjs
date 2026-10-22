'use strict';
/**
 * 04 / V3.8: actual analytic intersection of one finite-radius SPHERE
 * SURFACE with a plane in model millimetres.
 * Reuses single M0 Euclidean kernel and shared V/H/W projection. This is
 * NOT a solid-volume cut, hidden-line solver, or V5 construction plan.
 */
const M0=require('../../../core/numeric/euclidean-kernel.cjs');
const {project}=require('../../../core/projection/conventions.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const object=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const xyz=a=>({x:a[0],y:a[1],z:a[2]});
function mmPoint(value,label){
 if(!object(value)||!['x','y','z'].every(k=>finite(value[k])&&Math.abs(value[k])<=1e7))
  throw new TypeError(label+' requires bounded finite model-mm XYZ coordinates');
 return M0.vector([value.x,value.y,value.z],3);
}
function validate(sphere,plane){
 if(!object(sphere)||sphere.modelUnit!=='mm'||!finite(sphere.radiusMm)||
    sphere.radiusMm<1e-6||sphere.radiusMm>1e6)
  throw new TypeError('sphere radius requires explicit bounded model mm');
 if(!object(plane)||plane.modelUnit!=='mm')
  throw new TypeError('section plane requires explicit model mm');
 const center=mmPoint(sphere.center,'sphere center');
 const point=mmPoint(plane.point,'plane point');
 const raw=mmPoint(plane.normal,'plane normal');
 const magnitude=M0.norm(raw);
 if(magnitude<=1e-12)throw new RangeError('section plane normal is degenerate');
 const normal=M0.normalize(raw);
 return {center,point,normal,radius:sphere.radiusMm};
}
function response(status,reason){
 return {status,reason,verified:false,modelUnit:'mm',
  geometryKind:null,curve:null,point:null,points:[],projections:[],
  maxResidualMm:null,globallyUnique:null,
  visibilityVerified:false,firstAngleLayoutVerified:false,
  sectionInteriorVerified:false,v5StepsReady:false};
}
const asPoint=a=>xyz(a);
const addScaled=(a,u,f)=>a.map((x,i)=>x+u[i]*f);
function planeSphereSurfaceSection(sphere,plane,{samples=48}={}){
 const {center,point,normal:n,radius:r}=validate(sphere,plane);
 if(!Number.isSafeInteger(samples)||samples<16||samples>128)
  throw new RangeError('circle visualization samples must be 16..128');
 const signed=M0.dot(M0.subtract(center,point),n);
 const distance=Math.abs(signed);
 if(!finite(distance))throw new RangeError('nonfinite signed plane distance');
 const gap=r-distance;
 const eps=1e-8*Math.max(1,r);
 if(gap< -eps)return response('none','plane misses sphere surface by more than tolerance');
 // Numerical near-tangencies are not silently turned into a zero-radius
 // circle or a unique mathematical tangency. Only exact represented equality
 // is accepted here; source image reconstruction remains upstream.
 if(Math.abs(gap)<=eps&&gap!==0)
  return response('undetermined','near-tangent sphere-plane cut needs higher precision');
 const foot=addScaled(center,n,-signed);
 if(foot.some(x=>!finite(x)||Math.abs(x)>2e7))
  return response('undetermined','foot of perpendicular exceeds safe model coordinates');
 const planeResidual=p=>Math.abs(M0.dot(M0.subtract(p,point),n));
 const sphereResidual=p=>Math.abs(M0.norm(M0.subtract(p,center))-r);
 if(gap===0){
  const residual=Math.max(planeResidual(foot),sphereResidual(foot));
  if(!finite(residual)||residual>eps*4)
   return response('undetermined','tangent point failed independent residual');
  return {status:'tangent-point',verified:true,modelUnit:'mm',
   geometryKind:'sphere-surface-plane-tangency',
   point:asPoint(foot),projection:project(asPoint(foot)),
   curve:null,points:[asPoint(foot)],projections:[project(asPoint(foot))],
   maxResidualMm:residual,globallyUnique:null,
   proofScope:'single known sphere surface intersecting one fixed plane at one represented tangent point',
   sourceSphereVerified:true,sourcePlaneVerified:true,
   visibilityVerified:false,firstAngleLayoutVerified:false,
   sectionInteriorVerified:false,v5StepsReady:false};
 }
 const radiusSquared=gap*(r+distance);
 if(!finite(radiusSquared)||radiusSquared<=0)
  return response('undetermined','section circle radius is numerically unstable');
 const circleRadius=Math.sqrt(radiusSquared);
 if(!finite(circleRadius)||circleRadius<=eps)
  return response('undetermined','under-resolved sphere-plane circle');
 const seed=Math.abs(n[0])<=Math.abs(n[1])&&Math.abs(n[0])<=Math.abs(n[2])
  ?[1,0,0]:Math.abs(n[1])<=Math.abs(n[2])?[0,1,0]:[0,0,1];
 const u=M0.normalize(M0.cross3(seed,n));
 const v=M0.normalize(M0.cross3(n,u));
 const orthogonality=Math.max(Math.abs(M0.dot(u,n)),Math.abs(M0.dot(v,n)),
  Math.abs(M0.dot(u,v)),Math.abs(M0.norm(u)-1),Math.abs(M0.norm(v)-1));
 if(!finite(orthogonality)||orthogonality>1e-10)
  return response('undetermined','circle plane basis did not pass orthogonality');
 const coords=[],views=[];let maxResidualMm=0;
 for(let i=0;i<=samples;i++){
  const angle=i*2*Math.PI/samples,c=Math.cos(angle),s=Math.sin(angle);
  const q=foot.map((origin,k)=>origin+circleRadius*(u[k]*c+v[k]*s));
  if(q.some(k=>!finite(k)))return response('undetermined','nonfinite sampled circle point');
  const res=Math.max(planeResidual(q),sphereResidual(q));
  if(!finite(res)||res>eps*4)
   return response('undetermined','sphere/plane sample failed independent residual');
  maxResidualMm=Math.max(res,maxResidualMm);
  const x=asPoint(q);coords.push(x);views.push(project(x));
 }
 return {status:'ready',verified:true,modelUnit:'mm',
  geometryKind:'sphere-surface-plane-circle',
  curve:{kind:'analytic-circle-3d',center:asPoint(foot),
   radiusMm:circleRadius,axisU:asPoint(u),axisV:asPoint(v),
   normal:asPoint(n),parameterRadians:[0,2*Math.PI],
   closed:true,analyticCurveVerified:true,sampledPolylineOnly:true},
  point:null,points:coords,projections:views,
  maxResidualMm,globallyUnique:null,
  proofScope:'known finite-radius sphere surface and fixed plane: analytic circular intersection; sampled lines are visualization only',
  sourceSphereVerified:true,sourcePlaneVerified:true,
  visibilityVerified:false,firstAngleLayoutVerified:false,
  sectionInteriorVerified:false,v5StepsReady:false};
}
module.exports={planeSphereSurfaceSection};
