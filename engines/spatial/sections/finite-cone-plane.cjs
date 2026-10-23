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
const xyz=x=>obj(x)&&['x','y','z'].every(k=>Object.hasOwn(x,k)&&finite(x[k])&&Math.abs(x[k])<=1e7)&&
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
   conicType:lateral===0?'circle':'ellipse',parameterRadians:[0,2*Math.PI],
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

/**
 * Independent cap-chord topology for the part of a strict elliptical
 * lateral intersection lying inside a finite cone. Does not infer the
 * filled disk, visibility, auxiliary steps or global model uniqueness.
 */
function conePlaneClippedEllipseBoundary(cone,plane,{samplesPerArc=64}={}){
 const {apex,n,base,point,r,h}=validate(cone,plane,samplesPerArc);
 const coordScale=Math.max(1,...vec(apex).map(Math.abs),...vec(point).map(Math.abs));
 const resolution=64*Number.EPSILON*coordScale;
 const eps=Math.max(1e-9*Math.max(r,h),resolution);
 if(r<=32*resolution||h<=32*resolution)
  return blocked('undetermined','feature under-resolved at model coordinate magnitude');
 const m=Math.hypot(n[0],n[1]),s=n[2]*h/r;
 if(!finite(s)||Math.abs(s)<=m+64*Number.EPSILON)
  return blocked('unsupported-conic','strict elliptic section required');
 const d=M0.dot(M0.subtract(vec(apex),vec(point)),n);
 if(Math.abs(d)<=eps)
  return blocked('apex-degenerate','section contacts or nears cone apex');
 if(d*n[2]<0)return blocked('none','plane lies beyond apex');
 const lower=Math.abs(d)/(Math.abs(s)+m);
 const upper=Math.abs(d)/(Math.abs(s)-m);
 if(!finite(lower)||!finite(upper))
  return blocked('undetermined','unrepresentable radial bounds');
 if(lower>r+eps)return blocked('none','plane misses finite cone');
 if(lower>=r-eps)
  return blocked('boundary-degenerate','plane tangent or nearly tangent to base rim');
 if(upper<r-eps)
  return blocked('not-clipped','entire ellipse lies strictly inside cone: use full ellipse solver');
 if(upper<=r+eps||m<=1e-12)
  return blocked('boundary-degenerate','plane nearly tangent to cap rim or coincident with base');
 // Normalize angular constraint to u*(nx cos + ny sin)/m <= limit.
 // This range is ONE arc on S1, with ends precisely on the base disk rim.
 const u=Math.sign(s),limit=(Math.abs(s)-Math.abs(d)/r)/m;
 if(!finite(limit)||limit<=-1||limit>=1)
  return blocked('boundary-degenerate','cap angular bounds not separated');
 const phi=Math.atan2(u*n[1],u*n[0]),alpha=Math.acos(limit);
 if(!finite(alpha)||alpha<=1e-8||Math.PI-alpha<=1e-8)
  return blocked('boundary-degenerate','cap arc angular width not resolved');
 const thetaStart=phi+alpha,thetaEnd=phi+2*Math.PI-alpha;
 const param=theta=>{
  const cs=Math.cos(theta),sn=Math.sin(theta);
  const denom=s-n[0]*cs-n[1]*sn;
  const rho=d/denom;
  return {rho,point:{x:base.x+rho*cs,y:base.y+rho*sn,
   z:apex.z-(h/r)*rho}};
 };
 const planeResidual=q=>Math.abs(M0.dot(M0.subtract(vec(q),vec(point)),n));
 const surfaceResidual=q=>Math.abs(
  Math.hypot(q.x-base.x,q.y-base.y)-r*(apex.z-q.z)/h);
 const sidePoints=[],projected=[];let maxResidualMm=0;
 for(let i=0;i<=samplesPerArc;i++){
  const theta=thetaStart+(thetaEnd-thetaStart)*i/samplesPerArc;
  const {rho,point:q}=param(theta);
  if(!finite(rho)||!xyz(q)||rho<=0||rho>r+eps||
   q.z<base.z-4*eps||q.z>apex.z+4*eps)
   return blocked('undetermined','finite lateral arc out of source bounds');
  const error=Math.max(planeResidual(q),surfaceResidual(q),
   Math.max(0,base.z-q.z,q.z-apex.z));
  if(!finite(error)||error>8*eps)
   return blocked('undetermined','lateral arc surface or plane residual failed');
  maxResidualMm=Math.max(maxResidualMm,error);
  sidePoints.push(q);projected.push(project(q));
 }
 // Independently intersect the plane with the bottom CAP CIRCLE. This is
 // not a copied lateral endpoint calculation; equality of both is checked.
 const offset=n[0]*(base.x-point.x)+n[1]*(base.y-point.y)+
  n[2]*(base.z-point.z);
 const signedDistance=offset/m;
 const halfSquared=(r-Math.abs(signedDistance))*(r+Math.abs(signedDistance));
 if(!finite(signedDistance)||Math.abs(signedDistance)>=r-eps||
  !finite(halfSquared)||halfSquared<=0)
  return blocked('boundary-degenerate','cap chord is tangent or unresolved');
 const half=Math.sqrt(halfSquared),ux=n[0]/m,uy=n[1]/m;
 const foot={x:base.x-signedDistance*ux,y:base.y-signedDistance*uy,z:base.z};
 const capA={x:foot.x-half*uy,y:foot.y+half*ux,z:base.z};
 const capB={x:foot.x+half*uy,y:foot.y-half*ux,z:base.z};
 const first=sidePoints[0],last=sidePoints.at(-1);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const errorA=Math.max(distance(first,capA),distance(last,capB));
 const errorB=Math.max(distance(first,capB),distance(last,capA));
 const joinMismatchMm=Math.min(errorA,errorB);
 if(!xyz(capA)||!xyz(capB)||!finite(joinMismatchMm)||
  joinMismatchMm>8*eps)
  return blocked('undetermined','cap roots disagree with lateral arc endpoints');
 const midpoint={x:(capA.x+capB.x)/2,y:(capA.y+capB.y)/2,z:base.z};
 const capMargin=r-Math.hypot(midpoint.x-base.x,midpoint.y-base.y);
 const capResidual=Math.max(planeResidual(capA),planeResidual(capB),
  planeResidual(midpoint),surfaceResidual(capA),surfaceResidual(capB),
  Math.abs(capA.z-base.z),Math.abs(capB.z-base.z));
 if(!finite(capResidual)||capResidual>8*eps||capMargin<=eps)
  return blocked('undetermined','cap chord failed independent disk and plane checks');
 maxResidualMm=Math.max(maxResidualMm,capResidual,joinMismatchMm);
 // Return actual connected two-edge graph, not merely visual samples.
 const chordFrom=errorA<=errorB?capB:capA;
 const chordTo=errorA<=errorB?capA:capB;
 return {
  status:'ready',verified:true,modelUnit:'mm',
  geometryKind:'finite-cone-clipped-ellipse-lateral-arc-plus-cap-chord',
  sourceSurfaceVerified:true,sourcePlaneVerified:true,
  boundaryVerified:true,solidSectionPerimeterVerified:true,
  completeSolidIntersectionVerified:false,
  boundaryEdges:[
   {id:'lateral-arc-1',kind:'analytic-lateral-arc',
    fromNode:0,toNode:1,start:first,end:last,
    angularInterval:[thetaStart,thetaEnd],analyticCurveVerified:true,
    sampledPolylineOnly:true,points:sidePoints,projections:projected},
   {id:'cap-chord-1',kind:'cap-chord',
    fromNode:1,toNode:0,start:chordFrom,end:chordTo,
    midpoint,lengthMm:2*half,capInteriorVerified:true,
    projectedEndpoints:{start:project(chordFrom),end:project(chordTo)}}
  ],
  contourLoops:[{id:'contour-1',closed:true,
   traversal:[{edgeId:'lateral-arc-1',fromNode:0,toNode:1},
    {edgeId:'cap-chord-1',fromNode:1,toNode:0}]}],
  curve:{kind:'analytic-clipped-cone-plane-ellipse',
   numeratorMm:d,normal:{x:n[0],y:n[1],z:n[2]},
   denominator:{constant:s,cosCoeff:-n[0],sinCoeff:-n[1]},
   radialBoundsMm:{min:lower,max:upper},
   parameterRadians:[thetaStart,thetaEnd],closed:false,
   analyticCurveVerified:true,sampledPolylineOnly:true},
  capChord:{start:chordFrom,end:chordTo,midpoint,
   lengthMm:2*half,capInteriorVerified:true},
  points:sidePoints,projections:projected,
  maxResidualMm,joinMismatchMm,globallyUnique:null,
  proofScope:'finite upright cone one-dimensional lateral ellipse arc plus planar base disk chord',
  visibilityVerified:false,sectionInteriorVerified:false,
  firstAngleLayoutVerified:false,v5StepsReady:false
 };
}

module.exports={conePlaneFullEllipse,conePlaneClippedEllipseBoundary};
