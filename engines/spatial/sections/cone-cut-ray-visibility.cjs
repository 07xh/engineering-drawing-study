'use strict';
/**
 * #372 M3: conservative OPEN-interval observer-ray classification for the
 * analytically verified boundary of ONE finite upright cone intersected by
 * an explicit plane. Does not certify endpoints, silhouettes, entire solid
 * section, real-photo reconstruction, standard V/H/W rays, or V5 line styles.
 *
 * A ray points FROM the section point TOWARD the observer. For a retained
 * convex cone halfspace, an initial ray into REMOVED material is visible.
 * In the kept direction, the local cone outward support normal determines
 * whether a ray leaves the convex body (visible) or enters it (hidden).
 * The exactly tangent case is intentionally unknown.
 */
const {conePlaneFullEllipse,conePlaneClippedEllipseBoundary}=
 require('./finite-cone-plane.cjs');
const {project}=require('../../../core/projection/conventions.js');
const {classifyConvexOpenRaySign}=
 require('../../../core/numeric/convex-open-ray.cjs');
const TAU=2*Math.PI;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>p&&['x','y','z'].every(k=>finite(p[k]));
const copy=p=>({x:p.x,y:p.y,z:p.z});
const {dotObject3:dot,subtractObject3:vector,normObject3:norm}=
 require('../../../core/numeric/object-vector3.cjs');
function unit(p,description){
 if(!point(p)||Math.max(...Object.values(p).map(Math.abs))>1e8)
  throw new TypeError('bounded finite '+description+' required');
 const d=norm(p);
 if(!finite(d)||d<=1e-12)
  throw new RangeError('nonzero '+description+' required');
 return {x:p.x/d,y:p.y/d,z:p.z/d};
}
function blocked(kind,reason,solverStatus='undetermined'){
 return {status:'not-verified',reason,solverStatus,kind,
  runs:[],counts:{visible:0,hidden:0,undetermined:0},
  openIntervalsVerified:false,visibilityVerified:false,
  boundaryEndpointsVerified:false,standardViewMappingVerified:false,
  v5LineStylesReady:false,globallyUnique:null};
}
function classifyConeSectionVisibility(cone,plane,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))
  throw new TypeError('explicit trusted cone ray options required');
 const allowed=['kind','sourceConfirmed','retainedHalfspace',
  'observerDirection','samples'];
 if(Object.keys(options).some(k=>!allowed.includes(k)))
  throw new TypeError('unrecognized ray/geometry proof input');
 const {kind='full-ellipse',sourceConfirmed=false,retainedHalfspace,
  observerDirection,samples=64}=options;
 if(!['full-ellipse','clipped-ellipse'].includes(kind))
  throw new TypeError('unsupported analytic cone section');
 if(!Number.isSafeInteger(samples)||samples<32||samples>256)
  throw new RangeError('32..256 analytic visualization samples required');
 if(sourceConfirmed!==true)
  return blocked(kind,'cone and plane require reviewed model-mm input');
 if(!['positive','negative'].includes(retainedHalfspace))
  throw new TypeError('explicit retained cone halfspace required');
 const ray=unit(observerDirection,'observer direction');
 const n=unit(plane?.normal,'cut plane normal');
 const source=kind==='full-ellipse'?
  conePlaneFullEllipse(cone,plane,{samples}):
  conePlaneClippedEllipseBoundary(cone,plane,{samplesPerArc:samples});
 if(source.status!=='ready'||source.verified!==true||
    source.curve?.analyticCurveVerified!==true||
    source.points?.length!==samples+1||
    source.visibilityVerified!==false||
    source.v5StepsReady!==false||
    (kind==='full-ellipse'&&source.completeLateralIntersection!==true)||
    (kind==='clipped-ellipse'&&
      (source.boundaryVerified!==true||
       source.solidSectionPerimeterVerified!==true||
       source.capChord?.capInteriorVerified!==true)))
  return blocked(kind,source.reason||'analytically proven cone cut not available',
   source.status);
 const b=cone.baseCenter,r=cone.radiusMm,h=cone.heightMm;
 const apex={x:b.x,y:b.y,z:b.z+h};
 const epsilon=Math.max(1e-8*Math.max(1,r,h),
  128*Number.EPSILON*Math.max(1,...Object.values(apex).map(Math.abs),
   ...Object.values(plane.point).map(Math.abs)));
 const analytic=source.curve,[begin,end]=analytic.parameterRadians;
 const D=analytic.denominator,N=analytic.numeratorMm;
 if(!Number.isFinite(begin)||!Number.isFinite(end)||
    end<=begin||end-begin>TAU+1e-9||
    !finite(N)||!['constant','cosCoeff','sinCoeff'].every(k=>finite(D[k])))
  throw new TypeError('analytic cone angular evidence invalid');
 const pointAt=theta=>{
  const ct=Math.cos(theta),st=Math.sin(theta);
  const denom=D.constant+D.cosCoeff*ct+D.sinCoeff*st;
  const rho=N/denom;
  return {x:apex.x+rho*ct,y:apex.y+rho*st,
   z:apex.z-(h/r)*rho};
 };
 const residual=q=>{
  if(!point(q))return Infinity;
  const planeRes=Math.abs(dot(vector(q,plane.point),n));
  const radial=Math.hypot(q.x-b.x,q.y-b.y);
  const coneRes=Math.abs(radial-r*(apex.z-q.z)/h);
  const heightOutside=Math.max(0,b.z-q.z,q.z-apex.z);
  return Math.max(planeRes,coneRes,heightOutside);
 };
 const retainedSign=retainedHalfspace==='positive'?1:-1;
 const halfspaceSlope=retainedSign*dot(n,ray);
 const EPS_DIR=1e-10,EPS_ANGLE=1e-9;
 const kept=halfspaceSlope>EPS_DIR;
 // Outward lateral normal is proportional to
 // (cos(theta),sin(theta),r/h) at ANY positive-radius generator point.
 const outwardSlope=theta=>
  Math.cos(theta)*ray.x+Math.sin(theta)*ray.y+(r/h)*ray.z;
 const roots=[];
 let tangentUnresolved=false;
 if(kept){
  const horizontal=Math.hypot(ray.x,ray.y);
  if(horizontal>EPS_DIR){
   const c=-(r/h)*ray.z/horizontal;
   if(Math.abs(Math.abs(c)-1)<=1e-10)tangentUnresolved=true;
   else if(Math.abs(c)<1){
    const alpha=Math.atan2(ray.y,ray.x),offset=Math.acos(c);
    for(const base of [alpha-offset,alpha+offset]){
     const first=Math.ceil((begin+EPS_ANGLE-base)/TAU);
     const last=Math.floor((end-EPS_ANGLE-base)/TAU);
     for(let k=first;k<=last;k++)roots.push(base+k*TAU);
    }
   }
  }
 }
 roots.sort((a,b)=>a-b);
 const cuts=[begin,...roots.filter((x,i)=>i===0||x-roots[i-1]>EPS_ANGLE),end];
 const counts={visible:0,hidden:0,undetermined:0},runs=[];
 let maxResidualMm=source.maxResidualMm;
 for(let i=0;i<cuts.length-1;i++){
  const lo=cuts[i],hi=cuts[i+1];
  if(hi-lo<=EPS_ANGLE)continue;
  const theta=(lo+hi)/2;
  const q0=pointAt(lo),q1=pointAt(theta),q2=pointAt(hi);
  for(const q of [q0,q1,q2]){
   const e=residual(q);
   if(!finite(e)||e>8*epsilon)
    return blocked(kind,'lateral visibility interval violates cone/plane residual');
   maxResidualMm=Math.max(maxResidualMm,e);
  }
  const rayCase=classifyConvexOpenRaySign(
   halfspaceSlope,tangentUnresolved?0:outwardSlope(theta),EPS_DIR);
  let visibility='undetermined',reason='cut-plane-tangent-or-silhouette';
  if(rayCase==='removed'){
   visibility='visible';reason='ray-enters-explicitly-removed-halfspace';
  }else if(rayCase==='exiting'){
   visibility='visible';reason='ray-leaves-convex-cone-outward';
  }else if(rayCase==='entering'){
   visibility='hidden';reason='ray-enters-retained-cone-interior';
  }
  counts[visibility]++;
  runs.push({id:'cone-lateral-run-'+(i+1),kind:'lateral-arc',
   boundaryId:'lateral-arc-1',angularInterval:[lo,hi],
   from:q0,through:q1,to:q2,
   projection:{from:project(q0),through:project(q1),to:project(q2)},
   visibility,reason,openIntervalCertified:visibility!=='undetermined',
   endpointVisibilityVerified:false,maxResidualMm:Math.max(
    residual(q0),residual(q1),residual(q2))});
 }
 if(kind==='clipped-ellipse'){
  const chord=source.capChord;
  const q0=chord.start,q2=chord.end;
  const mid=chord.midpoint;
  const nrmDist=Math.hypot(q0.x-q2.x,q0.y-q2.y,q0.z-q2.z);
  const diskMargin=r-Math.hypot(mid.x-b.x,mid.y-b.y);
  const chordErr=Math.max(
   Math.abs(dot(vector(q0,plane.point),n)),
   Math.abs(dot(vector(q2,plane.point),n)),
   Math.abs(dot(vector(mid,plane.point),n)),
   Math.abs(q0.z-b.z),Math.abs(q2.z-b.z),Math.abs(mid.z-b.z));
  if(!finite(nrmDist)||nrmDist<=epsilon||diskMargin<=epsilon||
     !finite(chordErr)||chordErr>8*epsilon)
   return blocked(kind,'cap chord open interior failed independent plane/disk proof');
  const rayCase=classifyConvexOpenRaySign(halfspaceSlope,-ray.z,EPS_DIR);
  let visibility='undetermined',reason='cap-observer-tangency';
  if(rayCase==='removed'){
   visibility='visible';reason='ray-enters-removed-halfspace';
  }else if(rayCase==='exiting'){
   visibility='visible';reason='ray-leaves-bottom-cap';
  }else if(rayCase==='entering'){
   visibility='hidden';reason='ray-enters-cone-through-bottom-cap';
  }
  counts[visibility]++;
  runs.push({id:'cone-cap-chord-run',kind:'cap-chord',
   boundaryId:'cap-chord-1',
   from:copy(q0),through:copy(mid),to:copy(q2),
   projection:{from:project(q0),through:project(mid),to:project(q2)},
   visibility,reason,openIntervalCertified:visibility!=='undetermined',
   endpointVisibilityVerified:false,maxResidualMm:chordErr});
  maxResidualMm=Math.max(maxResidualMm,chordErr);
 }
 if(runs.length===0)return blocked(kind,'no proved open cone boundary intervals');
 // Full visibility of joining endpoints, silhouette tangencies, paper views
 // and other solids is NOT implied by open-ray interior certification.
 return {status:'ready',kind,modelUnit:'mm',sourceConfirmed:true,
  retainedHalfspace,observerDirection:ray,
  sourceBoundaryVerified:true,runs,counts,totalRuns:runs.length,
  openIntervalsVerified:counts.undetermined===0,
  visibilityVerified:false,boundaryEndpointsVerified:false,
  standardViewMappingVerified:false,v5LineStylesReady:false,
  maxResidualMm,globallyUnique:null,
  proofScope:'single finite upright convex cone section / exact open boundary intervals; source geometry and kept halfspace only'};
}
module.exports={classifyConeSectionVisibility};