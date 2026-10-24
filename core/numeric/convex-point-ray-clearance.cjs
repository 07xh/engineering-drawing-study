'use strict';
/**
 * M0 positive observer-ray clearance at an EXACT reviewed 3D point.
 * A point projection/JOIN may be a candidate endpoint, but a source vertex
 * is NOT visible merely because it is nearest among listed vertices.
 *
 * First prove an outward support plane for all t>0. Otherwise eliminate
 * the single positive ray parameter from EXPANDED convex halfspaces and
 * only certify miss when even the enlarged solid cannot be intersected.
 * Degenerate supports, near tangent/mixed source geometry stay unknown.
 *
 * Caller must independently validate closed convex source Geometry and
 * complete reviewed scene membership. This is NOT paper line styling,
 * multi-surface junction topology, ConstructionIntent or V5 authority.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const xyz=p=>p&&typeof p==='object'&&!Array.isArray(p)&&
 Object.keys(p).sort().join(',')==='x,y,z'&&
 ['x','y','z'].every(k=>finite(p[k])&&Math.abs(p[k])<=1e8);
const id=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(x);
const {dotObject3:dot}=
 require('./object-vector3.cjs');
const output=(solidId,status,reason)=>Object.freeze({
 schema:'draftai-convex-vertex-open-ray-clearance/1',
 solidId,status,reason,
 positiveOpenRayClearVerified:status==='certified-clear',
 completeSceneVerified:false,projectedJunctionVisibleVerified:false,
 sourceEndpointJoinVerified:false,officialLineStyleVerified:false,
 constructionIntentVerified:false,v5Ready:false
});
function certifyConvexPointRayClearance({
 point,observerDirection,solid,marginMm=1e-7,
 angleTolerance=1e-12
}={}){
 if(!xyz(point)||!xyz(observerDirection)||
    !solid||typeof solid!=='object'||Array.isArray(solid)||
    Object.keys(solid).sort().join(',')!=='halfspaces,id'||
    !id(solid.id)||!Array.isArray(solid.halfspaces)||
    solid.halfspaces.length<4||solid.halfspaces.length>64)
  throw new TypeError('finite 3D vertex, observer and convex halfspaces required');
 if(!finite(marginMm)||marginMm<=0||marginMm>1e-2||
    !finite(angleTolerance)||angleTolerance<=0||angleTolerance>1e-6)
  throw new RangeError('positive bounded mm/angle tolerance required');
 const norm=Math.hypot(observerDirection.x,observerDirection.y,observerDirection.z);
 if(!finite(norm)||norm<=1e-12)throw new RangeError('nonzero observer required');
 const d={x:observerDirection.x/norm,y:observerDirection.y/norm,
  z:observerDirection.z/norm};
 const faces=[],ids=new Set();
 for(const f of solid.halfspaces){
  if(!f||typeof f!=='object'||Array.isArray(f)||
     Object.keys(f).sort().join(',')!=='id,normal,offsetMm'||
     !id(f.id)||ids.has(f.id)||!xyz(f.normal)||
     !finite(f.offsetMm)||Math.abs(f.offsetMm)>1e9)
   throw new TypeError('distinct finite convex support planes required');
  ids.add(f.id);
  const size=Math.hypot(f.normal.x,f.normal.y,f.normal.z);
  if(!finite(size)||size<=1e-12)
   throw new RangeError('nonzero supporting normal required');
  const n={x:f.normal.x/size,y:f.normal.y/size,z:f.normal.z/size},
   offset=f.offsetMm/size;
  if(!finite(offset))throw new RangeError('normalized support overflow');
  faces.push({n,offset});
 }
 let near=0,far=Infinity,uncertain=false;
 for(const f of faces){
  const exterior=dot(f.n,point)-f.offset,
   slope=dot(f.n,d);
  if(!finite(exterior)||!finite(slope))
   throw new RangeError('nonfinite point ray residual');
  // For every forward t>0, n.(point+t*d)>offset. A source lying
  // EXACTLY on an outward support is therefore a valid OPEN ray miss.
  if(slope>angleTolerance&&exterior>=0)
   return output(solid.id,'certified-clear','outward-support-positive-open-ray');
  if(slope>=0&&exterior>=marginMm)
   return output(solid.id,'certified-clear','exterior-support-positive-open-ray');
  // Expand all support halfspaces by +margin. If this larger solid cannot
  // meet t>=0, the true solid is also missed with conservative allowance.
  const gamma=f.offset+marginMm-dot(f.n,point);
  if(Math.abs(slope)<=angleTolerance){
   if(gamma< -marginMm&&slope===0)
    return output(solid.id,'certified-clear','parallel-exterior-inflated-support');
   if(slope!==0)uncertain=true;
   continue;
  }
  const t=gamma/slope;
  if(!finite(t))throw new RangeError('ray-plane clipping overflow');
  if(slope<0)near=Math.max(near,t);
  else far=Math.min(far,t);
 }
 if(!uncertain&&(far< -marginMm||near>far+marginMm))
  return output(solid.id,'certified-clear','inflated-forward-ray-infeasible');
 return output(solid.id,'undetermined',uncertain?
  'near-parallel-support':'positive-ray-could-intersect-or-graze');
}
module.exports={certifyConvexPointRayClearance};
