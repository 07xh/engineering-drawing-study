'use strict';
/**
 * M0 finite convex halfspace ray sweep for generic 2D/3D view depth evidence.
 *
 * A source point p and observer unit ray d give x(t)=p+t*d, t>0.
 * Every outward halfspace dot(n,x)<=offset contributes one interval bound:
 *   dot(n,d)>0: t <= (offset-dot(n,p))/dot(n,d)
 *   dot(n,d)<0: t >= (offset-dot(n,p))/dot(n,d).
 * Intersection of the intervals yields entry/exit depths; sorting across
 * solids yields the nearest obstruction. Parallel/coplanar/tangent cases
 * remain UNDETERMINED. This kernel never certifies a complete CAD scene,
 * topology, silhouette, endpoint joins, official line styles or V5.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>p&&typeof p==='object'&&!Array.isArray(p)&&
 Object.keys(p).sort().join(',')==='x,y,z'&&
 ['x','y','z'].every(k=>finite(p[k])&&Math.abs(p[k])<=1e8);
const {dotObject3:dot,normObject3:vectorNorm}=
 require('./object-vector3.cjs');
const {certifyDotSign}=require('./euclidean-kernel.cjs');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))freeze(v);
  Object.freeze(o);
 }
 return o;
};
function settings(x){
 if(!x||!point(x.point)||!point(x.observerDirection)||
    !Number.isFinite(x.toleranceMm??1e-7))
  throw new TypeError('finite observer ray and source point required');
 const toleranceMm=x.toleranceMm??1e-7,angleTolerance=x.angleTolerance??1e-12;
 if(toleranceMm<=0||toleranceMm>1e-2||!finite(angleTolerance)||
    angleTolerance<=0||angleTolerance>1e-5)
  throw new RangeError('bounded absolute length and unit-ray tolerances required');
 const norm=vectorNorm(x.observerDirection);
 if(!finite(norm)||norm<=1e-12)throw new RangeError('nonzero observer direction required');
 return {point:x.point,d:{
  x:x.observerDirection.x/norm,y:x.observerDirection.y/norm,
  z:x.observerDirection.z/norm},toleranceMm,angleTolerance};
}
function verifyHalfspaces(faces){
 if(!Array.isArray(faces)||faces.length<4||faces.length>64)
  throw new TypeError('4..64 finite supporting halfspaces required');
 const seen=new Set();
 return faces.map(face=>{
  if(!face||typeof face!=='object'||Array.isArray(face)||
     Object.keys(face).sort().join(',')!=='id,normal,offsetMm'||
     typeof face.id!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(face.id)||
     seen.has(face.id)||!point(face.normal)||!finite(face.offsetMm)||
     Math.abs(face.offsetMm)>1e9)
   throw new TypeError('distinct finite outward halfspaces with IDs required');
  seen.add(face.id);
  const len=vectorNorm(face.normal);
  if(!finite(len)||len<=1e-12)
   throw new RangeError('nonzero outward supporting plane normal required');
  return {id:face.id,n:{x:face.normal.x/len,
   y:face.normal.y/len,z:face.normal.z/len},offset:face.offsetMm/len};
 });
}
function intersectNormalized(r,faces,solidId){
 let entry=-Infinity,exit=Infinity,entryFace=null,exitFace=null,ambiguous=false;
 for(const face of faces){
  const clearance=face.offset-dot(face.n,r.point);
  const slope=dot(face.n,r.d);
  if(!finite(clearance)||!finite(slope))
   throw new RangeError('ray/plane residual overflow');
  if(Math.abs(slope)<=r.angleTolerance){
   // An approximately parallel ray is NOT an exactly parallel ray.
   // A tiny nonzero n·d can eventually enter a supporting halfspace
   // at arbitrarily large positive t. Calling that a proven 'miss'
   // is unsound without independently known finite ray-depth bounds.
   // Use the ONE M0 exact binary64 dot sign evidence to distinguish
   // true parallelism from near-parallelism without guessing EPS.
   const sign=certifyDotSign(
    [face.n.x,face.n.y,face.n.z],[r.d.x,r.d.y,r.d.z]).sign;
   if(sign!==0){
    ambiguous=true;
    continue;
   }
   if(clearance< -r.toleranceMm)
    return freeze({status:'miss',solidId,reason:'ray-outside-exact-parallel-plane',
     entryMm:null,exitMm:null,entryFaceId:null,exitFaceId:null});
   if(Math.abs(clearance)<=r.toleranceMm)ambiguous=true;
   continue;
  }
  const t=clearance/slope;
  if(!finite(t))throw new RangeError('ray/plane depth overflow');
  if(slope<0){
   if(t>entry){entry=t;entryFace=face.id;}
  }else if(t<exit){exit=t;exitFace=face.id;}
 }
 if(entry>exit+r.toleranceMm||exit<=0)
  return freeze({status:'miss',solidId,reason:'empty-positive-ray-intersection',
   entryMm:null,exitMm:null,entryFaceId:null,exitFaceId:null});
 // Finite nearest AND far boundaries are necessary to prove a bounded
 // positive open interval. The source solid's geometry may be incomplete.
 if(!finite(entry)||!finite(exit)||ambiguous||
    Math.abs(entry-exit)<=r.toleranceMm||
    exit<=r.toleranceMm)
  return freeze({status:'undetermined',solidId,
   reason:ambiguous?'coplanar-support-ray':
    !finite(entry)||!finite(exit)?'unbounded-or-unresolved-solid-ray':
    'tangent-or-boundary-depth',
   entryMm:finite(entry)?entry:null,exitMm:finite(exit)?exit:null,
   entryFaceId:entryFace,exitFaceId:exitFace});
 const near=Math.max(0,entry);
 if(exit-near<=r.toleranceMm)
  return freeze({status:'undetermined',solidId,
   reason:'sub-tolerance-forward-intersection',
   entryMm:near,exitMm:exit,entryFaceId:entryFace,exitFaceId:exitFace});
 return freeze({status:'hit',solidId,reason:'positive-open-interior-interval',
  entryMm:near,exitMm:exit,entryFaceId:entryFace,exitFaceId:exitFace});
}
function intersectConvexRayHalfspaces({
 point:source,observerDirection,halfspaces,toleranceMm,angleTolerance
}={}){
 const r=settings({point:source,observerDirection,toleranceMm,angleTolerance});
 return intersectNormalized(r,verifyHalfspaces(halfspaces),null);
}
/**
 * Depth-sorts a supplied SET of independently validated convex solids.
 * Clear means no positive intersections WITHIN THIS SET, never that no
 * missing solid exists. A ray grazing any uncertain object cannot prove
 * the first visible/hidden result.
 */
function traceConvexRayDepth({
 point:source,observerDirection,solids,toleranceMm,angleTolerance
}={}){
 const r=settings({point:source,observerDirection,toleranceMm,angleTolerance});
 if(!Array.isArray(solids)||!solids.length||solids.length>64)
  throw new TypeError('1..64 explicit convex solids required');
 const seen=new Set(),results=[];
 for(const s of solids){
  if(!s||typeof s!=='object'||Array.isArray(s)||
     Object.keys(s).sort().join(',')!=='halfspaces,id'||
     typeof s.id!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(s.id)||
     seen.has(s.id))throw new TypeError('distinct solid identities required');
  seen.add(s.id);
  results.push(intersectNormalized(r,verifyHalfspaces(s.halfspaces),s.id));
 }
 const hits=results.filter(x=>x.status==='hit').sort((a,b)=>
  a.entryMm-b.entryMm||a.solidId.localeCompare(b.solidId));
 const unknown=results.filter(x=>x.status==='undetermined');
 // A coplanar ray (especially along a silhouette) may conceal the exact
 // front boundary; do not promote a supported hit to a globally first hit.
 const nearest=hits[0]??null;
 const unresolvedFront=unknown.some(x=>x.entryMm===null||!nearest||
  x.entryMm<=nearest.entryMm+r.toleranceMm);
 const tie=hits.length>1&&
  Math.abs(hits[1].entryMm-hits[0].entryMm)<=r.toleranceMm;
 return freeze({
  schema:'draftai-convex-ray-depth/1',
  status:unresolvedFront||tie?'undetermined':nearest?'occluded':'clear',
  scope:'only-supplied-convex-halfspaces',
  nearestSolidId:unresolvedFront||tie?null:nearest?.solidId??null,
  nearestDepthMm:unresolvedFront||tie?null:nearest?.entryMm??null,
  depthOrderVerified:!unresolvedFront&&!tie,
  intersections:results,
  orderedHits:hits,
  ambiguousSolidIds:unknown.map(x=>x.solidId),
  completeSceneVerified:false,
  fullContourVerified:false,endpointJoinVerified:false,
  officialLineStyleVerified:false
 });
}
module.exports={intersectConvexRayHalfspaces,traceConvexRayDepth};
