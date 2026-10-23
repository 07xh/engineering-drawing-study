'use strict';
/**
 * 04 M3: analytic full elliptical plane sections of finite upright right cones.
 * model-mm only. No cap clipping, apex contact, visibility or V5 proof.
 * Global radial bounds (not visualization samples) establish completeness.
 */
const M0=require('../../../core/numeric/euclidean-kernel.cjs');
const {project}=require('../../../core/projection/conventions.js');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const xyz=x=>obj(x)&&['x','y','z'].every(k=>finite(x[k])&&Math.abs(x[k])<=1e7)&&
 Object.keys(x).every(k=>['x','y','z'].includes(k));
const copy=p=>({x:p.x,y:p.y,z:p.z});
const vec=p=>M0.vector([p.x,p.y,p.z],3);
const blocked=(status,reason)=>({status,reason,verified:false,modelUnit:'mm',
 geometryKind:null,curve:null,points:[],projections:[],maxResidualMm:null,
 globallyUnique:null,visibilityVerified:false,sectionInteriorVerified:false,
 firstAngleLayoutVerified:false,v5StepsReady:false});
function validate(cone,plane,samples){
 if(!obj(cone)||cone.modelUnit!=='mm'||!xyz(cone.baseCenter)||
  !finite(cone.radiusMm)||cone.radiusMm<1e-6||cone.radiusMm>1e6||
  !finite(cone.heightMm)||cone.heightMm<1e-6||cone.heightMm>1e6)
  throw new TypeError('bounded upright finite cone with model-mm base center, radius and height required');
 if(!obj(plane)||plane.modelUnit!=='mm'||!xyz(plane.point)||!xyz(plane.normal))
  throw new TypeError('bounded finite model-mm plane point and normal required');
 if(!Number.isSafeInteger(samples)||samples<32||samples>256)
  throw new RangeError('visualization samples must be 32..256');
 const apex={x:cone.baseCenter.x,y:cone.baseCenter.y,
  z:cone.baseCenter.z+cone.heightMm};
 if(!xyz(apex))throw new RangeError('cone apex outside model-mm coordinate domain');
 const norm=M0.norm(vec(plane.normal));
 if(norm<=1e-12)throw new RangeError('degenerate plane normal');
 const n=M0.normalize(vec(plane.normal));
 return {apex,n,base:copy(cone.baseCenter),point:copy(plane.point),
  r:cone.radiusMm,h:cone.heightMm};
}
function conePlaneFullEllipse(cone,plane,{samples=64}={}){
 const {apex,n,base,point,r,h}=validate(cone,plane,samples);
 const worldScale=Math.max(1,...vec(apex).map(Math.abs),...vec(point).map(Math.abs));
 const resolution=64*Number.EPSILON*worldScale;
 const eps=Math.max(1e-9*Math.max(r,h),resolution);
 if(r<=32*resolution||h<=32*resolution)
  return blocked('undetermined','feature under-resolved at absolute model coordinates');
 // For angle t and radial rho, x=cx+rho*cos(t), y=cy+rho*sin(t),
 // z=apexZ-h*rho/r. Plane equation becomes
 // d + rho*(nx*cos(t)+ny*sin(t)-nz*h/r)=0.
 // Strict |nz|*h/r > hypot(nx,ny) proves the denominator has ONE sign.
 const lateral=Math.hypot(n[0],n[1]);
 const axial=Math.abs(n[2])*h/r;
 if(!finite(axial)||axial<=lateral+64*Number.EPSILON)
  return blocked('unsupported-conic','only strict full-ellipse domain is verified');
 const d=M0.dot(M0.subtract(vec(apex),vec(point)),n);
 if(Math.abs(d)<=eps)
  return blocked('apex-degenerate','section through or too near cone apex');
 if(d*n[2]<0)
  return blocked('none','plane lies beyond cone apex');
 const rhoMin=Math.abs(d)/(axial+lateral),rhoMax=Math.abs(d)/(axial-lateral);
 if(!finite(rhoMin)||!finite(rhoMax))
  return blocked('undetermined','unrepresentable intersection radius');
 if(rhoMin>=r+eps)
  return blocked('none','plane lies beyond finite cone base');
 if(rhoMin<=eps)
  return blocked('undetermined','cone-plane curve near apex is under-resolved');
 if(rhoMax>=r-eps)
  return blocked('clipped-or-boundary','section meets or nears finite base rim');
 const s=n[2]*h/r;
 const points=[],projections=[];let maxResidualMm=0;
 for(let i=0;i<=samples;i++){
  const t=2*Math.PI*i/samples,cs=Math.cos(t),sn=Math.sin(t);
  const denom=s-n[0]*cs-n[1]*sn,rho=d/denom;
  if(!finite(denom)||!finite(rho)||rho<rhoMin-4*eps||
    rho>rhoMax+4*eps||rho<=0||rho>=r)
   return blocked('undetermined','sample violates analytically proved radial interval');
  const q={x:apex.x+rho*cs,y:apex.y+rho*sn,z:apex.z-(h/r)*rho};
  if(!xyz(q))return blocked('undetermined','sample outside model coordinate domain');
  // Independent surface and plane residuals, not one shared drawing path.
  const planeRes=Math.abs(M0.dot(M0.subtract(vec(q),vec(point)),n));
  const sideRes=Math.abs(Math.hypot(q.x-base.x,q.y-base.y)-r*(apex.z-q.z)/h);
  const capRes=Math.max(0,base.z-q.z,q.z-apex.z);
  const residual=Math.max(planeRes,sideRes,capRes);
  if(!finite(residual)||residual>8*eps)
   return blocked('undetermined','independent surface/plane residual exceeded tolerance');
  maxResidualMm=Math.max(maxResidualMm,residual);
  points.push(q);projections.push(project(q));
 }
 return {status:'ready',verified:true,modelUnit:'mm',
  geometryKind:'finite-upright-cone-lateral-full-ellipse',
  curve:{kind:'analytic-cone-plane-ellipse',
   conicType:lateral<1e-14?'circle':'ellipse',parameterRadians:[0,2*Math.PI],
   closed:true,apex:copy(apex),
   normal:{x:n[0],y:n[1],z:n[2]},
   numeratorMm:d,denominator:{constant:s,cosCoeff:-n[0],sinCoeff:-n[1]},
   radialBoundsMm:{min:rhoMin,max:rhoMax},
   analyticCurveVerified:true,sampledPolylineOnly:true},
  points,projections,maxResidualMm,completeLateralIntersection:true,
  requiresBaseCapAnalysis:false,globallyUnique:null,
  proofScope:'known finite upright circular cone lateral surface / strict full-ellipse only',
  visibilityVerified:false,sectionInteriorVerified:false,
  firstAngleLayoutVerified:false,v5StepsReady:false};
}
module.exports={conePlaneFullEllipse};
