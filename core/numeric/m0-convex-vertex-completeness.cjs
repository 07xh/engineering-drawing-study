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
 // A nonzero recession direction r must satisfy n.r<=0 for EVERY face.
 // On the compact unit sphere, such a direction has a nonzero component
 // along some coordinate axis. Intersect the recession cone with each
 // coordinate plane r_axis=+/-1. Every feasible slice has a vertex
 // determined by two independent remaining face boundaries, OR can
 // contain the origin in the remaining coordinates. Check both.
 const axes=['x','y','z'];
 const recessionSlice=(axis,sign)=>{
  const others=axes.filter(k=>k!==axis);
  const inequalities=faces.map(f=>({
   a:f.n[others[0]],b:f.n[others[1]],c:-sign*f.n[axis]}));
  const feasible=(u,v)=>inequalities.every(q=>
   q.a*u+q.b*v<=q.c+Math.max(1e-12,angularTolerance*10));
  if(feasible(0,0))return true;
  for(let i=0;i<inequalities.length;i++)
   for(let j=i+1;j<inequalities.length;j++){
    const a=inequalities[i],b=inequalities[j];
    const det=a.a*b.b-b.a*a.b;
    if(Math.abs(det)<=angularTolerance)continue;
    const u=(a.c*b.b-b.c*a.b)/det;
    const v=(a.a*b.c-b.a*a.c)/det;
    if(finite(u)&&finite(v)&&feasible(u,v))return true;
   }
  // A feasible unbounded polygon with no vertices could evade this
  // test; avoid a false boundedness claim unless the full recession
  // cone is already known to be pointed. A full-dimensional bounded
  // candidate with all axis normals signed does not by itself suffice.
  return false;
 };
 for(const axis of axes)for(const sign of [-1,1]){
  if(recessionSlice(axis,sign))
   return result('undetermined','nonzero-recession-direction',derived.length);
 }
 // Conservative positive spanning certificate: origin strictly inside
 // convex hull of the unit outward normals. Search positive 4-face
 // tetrahedral combinations using Cramer's rule. This is sufficient
 // for a trivial recession cone, independent of caller vertex claims.
 const det3=(a,b,c)=>dot(a,cross(b,c));
 let positiveSpan=false;
 outer:for(let i=0;i<faces.length;i++)
 for(let j=i+1;j<faces.length;j++)
 for(let k=j+1;k<faces.length;k++)
 for(let l=k+1;l<faces.length;l++){
  const ns=[faces[i].n,faces[j].n,faces[k].n,faces[l].n];
  const v0=sub(ns[0],ns[3]),v1=sub(ns[1],ns[3]),
   v2=sub(ns[2],ns[3]);
  const det=det3(v0,v1,v2);
  if(Math.abs(det)<=angularTolerance)continue;
  const rhs={x:-ns[3].x,y:-ns[3].y,z:-ns[3].z};
  const w0=det3(rhs,v1,v2)/det;
  const w1=det3(v0,rhs,v2)/det;
  const w2=det3(v0,v1,rhs)/det;
  const w3=1-w0-w1-w2;
  if([w0,w1,w2,w3].every(w=>finite(w)&&w>angularTolerance*10)){
   positiveSpan=true;break outer;
  }
 }
 if(!positiveSpan)
  return result('undetermined','positive-normal-spanning-not-proven',derived.length);
 return result('certified','complete-extreme-vertices-and-bounded-recession-cone',derived.length);
}
module.exports={certifyConvexVertices};
