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
// One trusted validation/consumption snapshot of each source coordinate.
function snapshotXYZ(p){
 if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).sort().join(',')!=='x,y,z')return null;
 const x=p.x,y=p.y,z=p.z;
 if(![x,y,z].every(v=>finite(v)&&Math.abs(v)<=1e8))return null;
 return {x,y,z};
}
const id=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(x);
const {dotObject3:dot}=
 require('./object-vector3.cjs');
const {certifyDotSign}=require('./euclidean-kernel.cjs');
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
 const source=snapshotXYZ(point),observer=snapshotXYZ(observerDirection);
 if(!solid||typeof solid!=='object'||Array.isArray(solid)||
    Object.keys(solid).sort().join(',')!=='halfspaces,id')
  throw new TypeError('finite 3D vertex, observer and convex halfspaces required');
 const solidId=solid.id,halfspaces=solid.halfspaces;
 if(!source||!observer||!id(solidId)||!Array.isArray(halfspaces)||
    halfspaces.length<4||halfspaces.length>64)
  throw new TypeError('finite 3D vertex, observer and convex halfspaces required');
 if(!finite(marginMm)||marginMm<=0||marginMm>1e-2||
    !finite(angleTolerance)||angleTolerance<=0||angleTolerance>1e-6)
  throw new RangeError('positive bounded mm/angle tolerance required');
 const norm=Math.hypot(observer.x,observer.y,observer.z);
 if(!finite(norm)||norm<=1e-12)throw new RangeError('nonzero observer required');
 const d={x:observer.x/norm,y:observer.y/norm,z:observer.z/norm};
 const faces=[],ids=new Set();
 for(let i=0;i<halfspaces.length;i++){
  if(!Object.hasOwn(halfspaces,i))
   throw new TypeError('distinct finite convex support planes required');
  const f=halfspaces[i];
  if(!f||typeof f!=='object'||Array.isArray(f)||
     Object.keys(f).sort().join(',')!=='id,normal,offsetMm')
   throw new TypeError('distinct finite convex support planes required');
  const faceId=f.id,normal=snapshotXYZ(f.normal),offsetMm=f.offsetMm;
  if(!id(faceId)||ids.has(faceId)||!normal||
     !finite(offsetMm)||Math.abs(offsetMm)>1e9)
   throw new TypeError('distinct finite convex support planes required');
  ids.add(faceId);
  const size=Math.hypot(normal.x,normal.y,normal.z);
  if(!finite(size)||size<=1e-12)
   throw new RangeError('nonzero supporting normal required');
  const n={x:normal.x/size,y:normal.y/size,z:normal.z/size},
   offset=offsetMm/size;
  if(!finite(offset))throw new RangeError('normalized support overflow');
  faces.push({n,offset});
 }
 let near=0,far=Infinity,uncertain=false;
 for(const f of faces){
  const exterior=dot(f.n,source)-f.offset,
   slope=dot(f.n,d);
  if(!finite(exterior)||!finite(slope))
   throw new RangeError('nonfinite point ray residual');
  // Floats may round a tiny inward observer slope to zero even though
  // exact represented-binary64 n·d < 0. No outward-support or
  // parallel-exterior proof can rely on the rounded sign alone.
  const slopeSign=certifyDotSign(
   [f.n.x,f.n.y,f.n.z],[d.x,d.y,d.z]).sign;
  // For every forward t>0, n.(point+t*d)>offset. A source lying
  // EXACTLY on an outward support is therefore a valid OPEN ray miss.
  if(slope>angleTolerance&&slopeSign>0&&exterior>=0)
   return output(solidId,'certified-clear','outward-support-positive-open-ray');
  if(slope>=0&&slopeSign>=0&&exterior>=marginMm)
   return output(solidId,'certified-clear','exterior-support-positive-open-ray');
  // Expand all support halfspaces by +margin. If this larger solid cannot
  // meet t>=0, the true solid is also missed with conservative allowance.
  const gamma=f.offset+marginMm-dot(f.n,source);
  if(Math.abs(slope)<=angleTolerance){
   if(gamma< -marginMm&&slope===0&&slopeSign===0)
    return output(solidId,'certified-clear','parallel-exterior-inflated-support');
   if(slopeSign!==0)uncertain=true;
   continue;
  }
  const t=gamma/slope;
  if(!finite(t))throw new RangeError('ray-plane clipping overflow');
  if(slope<0)near=Math.max(near,t);
  else far=Math.min(far,t);
 }
 if(!uncertain&&(far< -marginMm||near>far+marginMm))
  return output(solidId,'certified-clear','inflated-forward-ray-infeasible');
 return output(solidId,'undetermined',uncertain?
  'near-parallel-support':'positive-ray-could-intersect-or-graze');
}
module.exports={certifyConvexPointRayClearance};
