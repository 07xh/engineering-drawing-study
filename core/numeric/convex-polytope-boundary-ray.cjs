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
// Source validation and boundary/ray calculations consume the same snapshot.
function snapshotXYZ(p){
 if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).sort().join(',')!=='x,y,z')return null;
 const x=p.x,y=p.y,z=p.z;
 return [x,y,z].every(v=>finite(v)&&Math.abs(v)<=1e8)?{x,y,z}:null;
}
const {dotObject3:dot,normObject3:norm3}=
 require('./object-vector3.cjs');
const {certifyDotSign}=require('./euclidean-kernel.cjs');
const FACES_MAX=64;
function classifyConvexPolytopeBoundaryRay({
 point,observerDirection,halfspaces,positionToleranceMm=1e-7,
 directionTolerance=1e-10
}={}){
 const p=snapshotXYZ(point),observer=snapshotXYZ(observerDirection);
 if(!p||!observer||!Array.isArray(halfspaces)||
    halfspaces.length<4||halfspaces.length>FACES_MAX)
  throw new TypeError('finite boundary point, observer ray and 4..64 halfspaces required');
 if(!finite(positionToleranceMm)||positionToleranceMm<=0||
    positionToleranceMm>1e-2||
    !finite(directionTolerance)||directionTolerance<=0||directionTolerance>1e-3)
  throw new RangeError('bounded positive geometric and ray tolerances required');
 const dNorm=norm3(observer);
 if(!finite(dNorm)||dNorm<=1e-12)
  throw new RangeError('nonzero finite observer ray required');
 const d={x:observer.x/dNorm,y:observer.y/dNorm,z:observer.z/dNorm};
 const seen=new Set(),active=[];
 let worstOutsideMm=0;
 for(let i=0;i<halfspaces.length;i++){
  if(!Object.hasOwn(halfspaces,i))
   throw new TypeError('bounded, uniquely named outward unit halfspaces required');
  const plane=halfspaces[i];
  if(!plane||typeof plane!=='object'||Array.isArray(plane)||
     Object.keys(plane).sort().join(',')!=='id,normal,offsetMm')
   throw new TypeError('bounded, uniquely named outward unit halfspaces required');
  const faceId=plane.id,normal=snapshotXYZ(plane.normal),offsetMm=plane.offsetMm;
  if(typeof faceId!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(faceId)||
     seen.has(faceId)||!normal||!finite(offsetMm)||
     Math.abs(offsetMm)>1e9)
   throw new TypeError('bounded, uniquely named outward unit halfspaces required');
  seen.add(faceId);
  const norm=norm3(normal);
  if(!finite(norm)||norm<=1e-12)
   throw new RangeError('nonzero outward face normal required');
  const unit={x:normal.x/norm,y:normal.y/norm,z:normal.z/norm};
  const signedMm=dot(unit,p)-offsetMm/norm;
  if(!finite(signedMm))throw new RangeError('nonfinite polytope residual');
  worstOutsideMm=Math.max(worstOutsideMm,signedMm);
  if(signedMm>positionToleranceMm)
   return Object.freeze({status:'not-on-polytope',visibility:'undetermined',
    reason:'source point lies beyond a polytope support plane',
    activeFaceIds:Object.freeze([]),pointRayCertified:false,
    endpointJoinCertified:false,fullContourCertified:false,
    worstOutsideMm});
  if(Math.abs(signedMm)<=positionToleranceMm){
   // A rounded signed slope cannot grant positive point-ray visibility
   // when its exact represented-binary64 normal·direction has opposite sign.
   const slope=dot(unit,d),sign=certifyDotSign(
    [unit.x,unit.y,unit.z],[d.x,d.y,d.z]).sign;
   if(!finite(slope))throw new RangeError('nonfinite point-ray slope');
   active.push({id:faceId,slope,sign});
  }
 }
 if(!active.length)
  return Object.freeze({status:'not-boundary',visibility:'undetermined',
   reason:'point does not lie on a certified polytope boundary',
   activeFaceIds:Object.freeze([]),pointRayCertified:false,
   endpointJoinCertified:false,fullContourCertified:false,
   worstOutsideMm});
 const outward=active.some(x=>x.slope>directionTolerance&&x.sign>0);
 const inward=active.every(x=>x.slope< -directionTolerance&&x.sign<0);
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
