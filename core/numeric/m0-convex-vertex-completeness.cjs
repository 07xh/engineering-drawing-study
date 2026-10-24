'use strict';
/**
 * Validate that an explicitly supplied finite vertex set is exactly the
 * distinct triple-plane intersection set of a bounded full-dimensional
 * convex polyhedron. No caller-provided 'trusted' boolean is accepted.
 * Conservative near-singular and redundant/non-vertex cases are rejected.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const norm=p=>Math.hypot(p.x,p.y,p.z);
function certifyConvexVertices({solid,toleranceMm=1e-7,angularTolerance=1e-12}={}){
 if(!solid||!Array.isArray(solid.halfspaces)||!Array.isArray(solid.vertices)||
  solid.halfspaces.length<4||solid.halfspaces.length>64||
  solid.vertices.length<4||solid.vertices.length>256||
  !finite(toleranceMm)||toleranceMm<=0||toleranceMm>1e-2||
  !finite(angularTolerance)||angularTolerance<=0||angularTolerance>1e-6)
  throw new TypeError('bounded finite convex polyhedron required');
 const faces=solid.halfspaces.map(f=>{
  if(!f||!f.normal||!finite(f.offsetMm)||
   !['x','y','z'].every(k=>finite(f.normal[k])))throw new TypeError('finite halfspace');
  const n=norm(f.normal);
  if(n<=1e-12)throw new TypeError('zero normal');
  return {n:{x:f.normal.x/n,y:f.normal.y/n,z:f.normal.z/n},o:f.offsetMm/n};
 });
 const valid=p=>p&&['x','y','z'].every(k=>finite(p[k])&&Math.abs(p[k])<=1e8);
 if(solid.vertices.some(p=>!valid(p)))throw new TypeError('finite vertices required');
 const result=(status,reason,derivedCount=0)=>Object.freeze({
  schema:'draftai-m0-convex-vertex-completeness/1',solidId:solid.id,
  status,reason,derivedVertexCount:derivedCount,
  vertexHullVerified:status==='certified',
  completeSceneVerified:false,officialLineStyleVerified:false});
 const derived=[];
 for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length;j++)
 for(let k=j+1;k<faces.length;k++){
  const a=faces[i],b=faces[j],c=faces[k];
  const bc=cross(b.n,c.n),ca=cross(c.n,a.n),ab=cross(a.n,b.n);
  const det=dot(a.n,bc);
  if(Math.abs(det)<=angularTolerance)continue;
  const p={x:(a.o*bc.x+b.o*ca.x+c.o*ab.x)/det,
   y:(a.o*bc.y+b.o*ca.y+c.o*ab.y)/det,
   z:(a.o*bc.z+b.o*ca.z+c.o*ab.z)/det};
  if(!valid(p))return result('undetermined','nonfinite-intersection');
  if(faces.some(f=>dot(f.n,p)>f.o+toleranceMm))continue;
  if(!derived.some(q=>norm(sub(p,q))<=toleranceMm))derived.push(p);
 }
 if(derived.length<4)return result('undetermined','insufficient-finite-vertices',derived.length);
 const supplied=solid.vertices;
 if(supplied.some((p,i)=>supplied.slice(0,i).some(q=>norm(sub(p,q))<=toleranceMm)))
  return result('undetermined','duplicate-supplied-vertex',derived.length);
 if(derived.length!==supplied.length||
  derived.some(p=>!supplied.some(q=>norm(sub(p,q))<=toleranceMm))||
  supplied.some(p=>!derived.some(q=>norm(sub(p,q))<=toleranceMm)))
  return result('undetermined','vertex-set-mismatch',derived.length);
 // A finite set of extreme points alone is not sufficient to establish
 // boundedness: reject any nonzero recession ray by checking whether the
 // normals positively span all coordinate directions. This inexpensive
 // necessary condition is intentionally not a full recession-cone proof.
 for(const axis of ['x','y','z']){
  if(!faces.some(f=>f.n[axis]>angularTolerance)||
     !faces.some(f=>f.n[axis]<-angularTolerance))
   return result('undetermined','unbounded-axis-recession-risk',derived.length);
 }
 // A near-degenerate polyhedron or unsupported halfspace arrangement must
 // remain unknown pending a full boundedness / recession-cone certificate.
 return result('undetermined','boundedness-not-independently-proven',derived.length);
}
module.exports={certifyConvexVertices};
