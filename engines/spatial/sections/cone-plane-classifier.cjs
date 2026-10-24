'use strict';
/**
 * Finite upright cone / plane classification at the trusted M3 boundary.
 * Separating-plane proof covers the entire convex finite solid (including cap),
 * so empty cuts are not conflated with unsupported conic branches.
 * Positive geometry delegates to the existing analytic 04 specialists.
 */
const {conePlaneFullEllipse,conePlaneClippedEllipseBoundary}=
 require('./finite-cone-plane.cjs');
const finite=Number.isFinite;
const {dotObject3,subtractObject3}=
 require('../../../core/numeric/object-vector3.cjs');
function classifyConePlane(cone,plane,{samples=64}={}){
 // Specialist validates units, finite dimensions, points, normal and samples.
 const full=conePlaneFullEllipse(cone,plane,{samples});
 const b=cone.baseCenter,q=plane.point,n=plane.normal;
 const apex={x:b.x,y:b.y,z:b.z+cone.heightMm};
 const dot=p=>dotObject3(subtractObject3(p,q),n);
 const a=dot(apex),base=dot(b),radial=cone.radiusMm*Math.hypot(n.x,n.y);
 const lower=Math.min(a,base-radial),upper=Math.max(a,base+radial);
 const normalMagnitude=Math.hypot(n.x,n.y,n.z);
 const scale=Math.max(1,cone.radiusMm,cone.heightMm,
  ...Object.values(apex).map(Math.abs),...Object.values(q).map(Math.abs));
 const eps=Math.max(1e-9*Math.max(cone.radiusMm,cone.heightMm),
  128*Number.EPSILON*scale)*normalMagnitude;
 if(![lower,upper,eps].every(finite))
  return {status:'undetermined',reason:'nonfinite cone support interval',verified:false};
 // Extremal affine value on the base disk is at center +/- radius*||n_xy||.
 // The finite cone is the convex hull of that disk and the apex.
 if(lower>eps||upper < -eps)
  return {status:'none',kind:'none',conicType:'none',
   reason:'截平面与有限圆锥无交线',verified:true,
   separationVerified:true,intersectionVerified:false,
   signedPlaneSupport:{min:lower,max:upper,tolerance:eps}};
 if(Math.abs(a)<=eps||lower>=-eps||upper<=eps)
  return {status:'boundary-degenerate',kind:null,verified:false,
   reason:'截平面接触或接近圆锥边界/顶点，需专门退化解法'};
 if(full.status==='ready'&&full.verified===true)
  return {status:'ready',kind:'full-ellipse',conicType:full.curve.conicType,
   reason:null,verified:true,separationVerified:false};
 const clipped=conePlaneClippedEllipseBoundary(cone,plane,{samplesPerArc:samples});
 if(clipped.status==='ready'&&clipped.verified===true)
  return {status:'ready',kind:'clipped-ellipse',conicType:'ellipse',
   reason:null,verified:true,separationVerified:false};
 const axial=Math.abs(n.z)*cone.heightMm/cone.radiusMm;
 const lateral=Math.hypot(n.x,n.y);
 const margin=128*Number.EPSILON*Math.max(1,axial,lateral);
 if(axial<=lateral+margin)
  return {status:'unsupported-conic',kind:null,verified:false,
   conicType:Math.abs(axial-lateral)<=margin?'parabolic-or-generator-parallel':'hyperbolic-type',
   reason:'截平面与有限圆锥相交，但当前解析求解器尚未覆盖该圆锥曲线分支'};
 return {status:clipped.status==='boundary-degenerate'?
  'boundary-degenerate':'undetermined',kind:null,verified:false,
  conicType:'elliptic-boundary',
  reason:clipped.reason||full.reason||'圆锥截切几何尚不能验证'};
}
module.exports={classifyConePlane};
