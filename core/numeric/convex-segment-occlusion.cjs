'use strict';
/**
 * M0 continuous convex occlusion of a finite MODEL-3D source segment.
 *
 * This is a 2-variable analytic elimination, NOT fixed-point sampling:
 *   x(s,t)=from+s*(to-from)+t*observerUnit, 0<=s<=1, t>=margin.
 * Each verified outward halfspace n.x<=offset contributes
 *   alpha*s+beta*t<=gamma, with gamma shortened by a positive margin.
 * Eliminating t between EVERY lower and upper bound yields one closed
 * convex feasible interval in s. Its OPEN interior is a rigorous
 * sufficient witness of a forward ray passing through the STRICT solid
 * interior. Multiple solids yield separate intervals; merging is left to
 * the downstream scene evidence layer.
 *
 * No 'clear' or official hidden-line result is issued outside these
 * intervals: tangency, unresolved numerical slopes, joins and omitted
 * solids remain unknown. All face geometry must be independently validated
 * by M3/M5 before this numeric primitive is consumed.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
// Only one access per explicit 3D coordinate. Downstream certificates must
// consume the same finite binary64 values that passed the source check.
function snapshotXYZ(p){
 if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).sort().join(',')!=='x,y,z')return null;
 const x=p.x,y=p.y,z=p.z;
 return [x,y,z].every(v=>finite(v)&&Math.abs(v)<=1e8)?{x,y,z}:null;
}
const id=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(x);
const {dotObject3:dot}=
 require('./object-vector3.cjs');
const {subtractObject3:sub}=require('./object-vector3.cjs');
const {certifyDotSign}=require('./euclidean-kernel.cjs');
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);
  Object.freeze(x);
 }return x;
};
const output=(status,sourceId,solidId,range=null,reason=null)=>freeze({
 schema:'draftai-convex-continuous-open-occlusion/1',
 status,sourceId,solidId,openSourceParameterRange:range,
 reason,sourceEndpointsVerified:false,occlusionComplete:false,
 officialLineStyleVerified:false,v5Verified:false
});
function certifyConvexSegmentOcclusion({
 source,solid,observerDirection,marginMm=1e-7,
 angularTolerance=1e-12
}={}){
 if(!source||typeof source!=='object'||Array.isArray(source)||
    Object.keys(source).sort().join(',')!=='from,id,to'||
    !solid||typeof solid!=='object'||Array.isArray(solid)||
    Object.keys(solid).sort().join(',')!=='halfspaces,id')
  throw new TypeError('finite source segment, convex halfspaces and observer required');
 const sourceId=source.id,from=snapshotXYZ(source.from),
  to=snapshotXYZ(source.to),solidId=solid.id,
  halfspaces=solid.halfspaces,observer=snapshotXYZ(observerDirection);
 if(!id(sourceId)||!from||!to||!id(solidId)||
    !Array.isArray(halfspaces)||halfspaces.length<4||halfspaces.length>64||!observer)
  throw new TypeError('finite source segment, convex halfspaces and observer required');
 if(!finite(marginMm)||marginMm<=0||marginMm>1e-2||
    !finite(angularTolerance)||angularTolerance<=0||angularTolerance>1e-6)
  throw new RangeError('bounded strict interior/depth tolerances required');
 const v=sub(to,from),length=Math.hypot(v.x,v.y,v.z);
 const dlength=Math.hypot(observer.x,observer.y,observer.z);
 if(!finite(length)||length<=marginMm||!finite(dlength)||dlength<=1e-12)
  throw new RangeError('nondegenerate model source line and observer ray required');
 const d={x:observer.x/dlength,y:observer.y/dlength,z:observer.z/dlength};
 const faceIds=new Set();
 // Each lower/upper bound is affine in s: t >= a*s+b; t <= a*s+b.
 const lower=[{a:0,b:marginMm}],upper=[],constraints=[];
 for(let i=0;i<halfspaces.length;i++){
  if(!Object.hasOwn(halfspaces,i))
   throw new TypeError('distinct finite outward supporting faces required');
  const face=halfspaces[i];
  if(!face||typeof face!=='object'||Array.isArray(face)||
     Object.keys(face).sort().join(',')!=='id,normal,offsetMm')
   throw new TypeError('distinct finite outward supporting faces required');
  const faceId=face.id,normal=snapshotXYZ(face.normal),offsetMm=face.offsetMm;
  if(!id(faceId)||faceIds.has(faceId)||!normal||
     !finite(offsetMm)||Math.abs(offsetMm)>1e9)
   throw new TypeError('distinct finite outward supporting faces required');
  faceIds.add(faceId);
  const norm=Math.hypot(normal.x,normal.y,normal.z);
  if(!finite(norm)||norm<=1e-12)throw new RangeError('nonzero outward normal required');
  const n={x:normal.x/norm,y:normal.y/norm,z:normal.z/norm};
  const alpha=dot(n,v),beta=dot(n,d);
  const gamma=offsetMm/norm-marginMm-dot(n,from);
  if(![alpha,beta,gamma].every(finite))
   throw new RangeError('nonfinite normalized face residual');
  if(beta===0){
   // Cancellation can round an exactly NONZERO normalized n·d to zero.
   // Such a constraint still depends on observer-ray depth t; dropping
   // beta would be an incorrect elimination and potentially invent
   // positive interior occlusion or reject a real continuous interval.
   const exact=certifyDotSign([n.x,n.y,n.z],[d.x,d.y,d.z]);
   if(exact.sign!==0)
    return output('undetermined',sourceId,solidId,null,
     'rounded-zero-near-parallel-support');
   constraints.push({a:alpha,b:-gamma});
  }else if(Math.abs(beta)<=angularTolerance){
   // Cannot certify that a nearly parallel ray stays on one side for
   // arbitrarily long t, unlike a truly parallel geometric direction.
   return output('undetermined',sourceId,solidId,null,'near-parallel-support');
  }else{
   const bound={a:-alpha/beta,b:gamma/beta};
   if(![bound.a,bound.b].every(finite))
    throw new RangeError('ray/plane affine depth overflow');
   (beta>0?upper:lower).push(bound);
  }
 }
 if(!upper.length)
  return output('undetermined',sourceId,solidId,null,'unbounded-forward-depth');
 for(const low of lower)for(const up of upper)
  constraints.push({a:low.a-up.a,b:low.b-up.b});
 // Affine feasibility in one parameter, with all upper/lower comparisons,
 // not just one point sample. A strict positive margin removes support-ray
 // tangencies from the certified INTERIOR subset.
 let left=0,right=1;
 for(const {a,b} of constraints){
  if(!finite(a)||!finite(b))
   throw new RangeError('nonfinite one-dimensional elimination inequality');
  if(a===0){
   if(b>0)return output('no-strict-hit',sourceId,solidId);
   continue;
  }
  const root=-b/a;
  if(!finite(root))throw new RangeError('parameter clipping overflow');
  if(a>0)right=Math.min(right,root);
  else left=Math.max(left,root);
  if(left>=right)return output('no-strict-hit',sourceId,solidId);
 }
 // The OPEN interval excludes all transition and endpoint joins. The
 // contracted halfspaces certify an actual positive-depth interior ray for
 // every s strictly between these exact affine-elimination bounds.
 if(right-left<=Math.max(1e-12,marginMm/length))
  return output('undetermined',sourceId,solidId,null,
   'numerically-unresolved-short-open-interval');
 if(left<0||right>1||!finite(left)||!finite(right))
  throw new RangeError('clipped segment source parameter outside bounds');
 return output('certified-open-interval',sourceId,solidId,[left,right]);
}
module.exports={certifyConvexSegmentOcclusion};
