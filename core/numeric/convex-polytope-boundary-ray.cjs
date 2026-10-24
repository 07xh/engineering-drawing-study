'use strict';
/**
 * Reusable M0 pointwise observer-ray witness for a CLOSED convex polytope
 * represented as the intersection of explicitly supplied linear halfspaces:
 *
 *    dot(unit(outwardNormal_i), x) <= offsetMm_i.
 *
 * The source M3 solver must independently verify its own bounded solid,
 * plane, coordinates and topology. This utility proves only whether a small
 * POSITIVE open ray from ONE boundary point enters strict polytope interior
 * (hidden), exits through a supporting plane (visible), or is tangent/unknown.
 *
 * A complete projection, silhouette, endpoint JOIN, multiple-object
 * occlusion or V5 full stroke is NOT certified by a pointwise ray.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const xyz=p=>p&&typeof p==='object'&&!Array.isArray(p)&&
 Object.keys(p).sort().join(',')==='x,y,z'&&
 ['x','y','z'].every(k=>finite(p[k])&&Math.abs(p[k])<=1e8);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const FACES_MAX=64;
function classifyConvexPolytopeBoundaryRay({
 point,observerDirection,halfspaces,positionToleranceMm=1e-7,
 directionTolerance=1e-10
}={}){
 if(!xyz(point)||!xyz(observerDirection)||!Array.isArray(halfspaces)||
    halfspaces.length<4||halfspaces.length>FACES_MAX)
  throw new TypeError('finite boundary point, observer ray and 4..64 halfspaces required');
 if(!finite(positionToleranceMm)||positionToleranceMm<=0||
    positionToleranceMm>1e-2||
    !finite(directionTolerance)||directionTolerance<=0||directionTolerance>1e-3)
  throw new RangeError('bounded positive geometric and ray tolerances required');
 const dNorm=Math.hypot(observerDirection.x,observerDirection.y,observerDirection.z);
 if(!finite(dNorm)||dNorm<=1e-12)
  throw new RangeError('nonzero finite observer ray required');
 const d={x:observerDirection.x/dNorm,
  y:observerDirection.y/dNorm,z:observerDirection.z/dNorm};
 const seen=new Set(),active=[];
 let worstOutsideMm=0;
 for(const plane of halfspaces){
  if(!plane||typeof plane!=='object'||Array.isArray(plane)||
     Object.keys(plane).sort().join(',')!=='id,normal,offsetMm'||
     typeof plane.id!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(plane.id)||
     seen.has(plane.id)||!xyz(plane.normal)||!finite(plane.offsetMm)||
     Math.abs(plane.offsetMm)>1e9)
   throw new TypeError('bounded, uniquely named outward unit halfspaces required');
  seen.add(plane.id);
  const norm=Math.hypot(plane.normal.x,plane.normal.y,plane.normal.z);
  if(!finite(norm)||norm<=1e-12)
   throw new RangeError('nonzero outward face normal required');
  const unit={x:plane.normal.x/norm,y:plane.normal.y/norm,
   z:plane.normal.z/norm};
  const signedMm=dot(unit,point)-plane.offsetMm/norm;
  if(!finite(signedMm))throw new RangeError('nonfinite polytope residual');
  worstOutsideMm=Math.max(worstOutsideMm,signedMm);
  if(signedMm>positionToleranceMm)
   return Object.freeze({status:'not-on-polytope',visibility:'undetermined',
    reason:'source point lies beyond a polytope support plane',
    activeFaceIds:Object.freeze([]),pointRayCertified:false,
    endpointJoinCertified:false,fullContourCertified:false,
    worstOutsideMm});
  if(Math.abs(signedMm)<=positionToleranceMm)
   active.push({id:plane.id,slope:dot(unit,d)});
 }
 if(!active.length)
  return Object.freeze({status:'not-boundary',visibility:'undetermined',
   reason:'point does not lie on a certified polytope boundary',
   activeFaceIds:Object.freeze([]),pointRayCertified:false,
   endpointJoinCertified:false,fullContourCertified:false,
   worstOutsideMm});
 const outward=active.some(x=>x.slope>directionTolerance);
 const inward=active.every(x=>x.slope< -directionTolerance);
 const visibility=outward?'visible':inward?'hidden':'undetermined';
 return Object.freeze({status:'ready',visibility,
  reason:outward?'ray-immediately-exits-a-supporting-halfspace':
   inward?'ray-strictly-enters-all-active-halfspaces':
   'boundary-tangent-or-underdetermined',
  activeFaceIds:Object.freeze(active.map(x=>x.id)),
  pointRayCertified:visibility!=='undetermined',
  endpointJoinCertified:false,fullContourCertified:false,
  worstOutsideMm});
}
module.exports={classifyConvexPolytopeBoundaryRay};
