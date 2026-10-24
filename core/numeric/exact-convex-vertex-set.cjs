'use strict';
/**
 * M0 OFFLINE exact vertex-set audit of a bounded full-dimensional 3D
 * halfspace intersection with representable binary64 corner coordinates.
 *
 * For every nonsingular triple of bounding planes, solve Cramer's rule
 * EXACTLY in rational dyadics; check ALL halfspaces without rounding; retain
 * exactly the feasible vertices and compare to caller's finite binary64
 * vertex set by exact numerator/denominator equalities.
 * Boundedness comes from the independent M0 recession-cone certificate;
 * nonempty 3D interior is established by a strict extreme-vertex witness
 * for EVERY face. Any missing/extra/nonrepresentable source vertex fails
 * closed. This does NOT certify where the source halfspaces came from,
 * original image/camera revision, whole-scene visibility, or V5.
 *
 * BigInt is explicitly limited to this opt-in offline mathematical audit.
 * Numerical M0/M3 live render and drag paths remain Float64.
 */
const {determinant3DExactDyadic:det3}=
 require('./determinant3d-adaptive.cjs');
const {certifyTrivialRecessionCone}=require('./trivial-recession-cone.cjs');
const {dyadic,product,sum,difference,sign}=
 require('./binary64-dyadic.cjs');
const finite=Number.isFinite;
const xyz=Object.freeze(['x','y','z']);
const rec=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function xyzSnapshot(p,label){
 if(!rec(p)||!xyz.every(k=>Object.hasOwn(p,k)))
  throw new TypeError(label+' needs dense x/y/z');
 const q={x:p.x,y:p.y,z:p.z};
 if(!xyz.every(k=>typeof q[k]==='number'&&finite(q[k])&&
  Math.abs(q[k])<=1e8))
  throw new TypeError(label+' needs bounded finite x/y/z');
 return q;
}
function snapshot(solid){
 if(!rec(solid))
  throw new TypeError('finite 4..16 face and 4..128 vertex polyhedron required');
 // Read each caller-controlled top-level field ONCE. A getter that returns
 // different arrays or a different source ID after the first read cannot
 // change which halfspaces or vertices the exact algebra certifies.
 const id=solid.id,halfspaces=solid.halfspaces,vertices=solid.vertices;
 if(typeof id!=='string'||!id.trim()||
   !Array.isArray(halfspaces)||halfspaces.length<4||halfspaces.length>16||
   !Array.isArray(vertices)||vertices.length<4||vertices.length>128)
  throw new TypeError('finite 4..16 face and 4..128 vertex polyhedron required');
 // Snapshot the indexed references before invoking coordinate/offset getters,
 // which can mutate caller-owned arrays during validation. Sparse input is
 // rejected rather than silently dropping a limiting face or extreme corner.
 const faceInputs=Array.from({length:halfspaces.length},(_,i)=>{
  if(!Object.hasOwn(halfspaces,i)||!rec(halfspaces[i]))
   throw new TypeError('missing halfspace '+i);
  return halfspaces[i];
 });
 const vertexInputs=Array.from({length:vertices.length},(_,i)=>{
  if(!Object.hasOwn(vertices,i))
   throw new TypeError('missing source vertex '+i);
  return vertices[i];
 });
 const faces=faceInputs.map((face,i)=>{
  const normal=xyzSnapshot(face.normal,'face normal');
  const offsetMm=face.offsetMm;
  if(typeof offsetMm!=='number'||!finite(offsetMm)||Math.abs(offsetMm)>1e12)
   throw new TypeError('bounded face offset required at '+i);
  return {normal,offsetMm};
 });
 const points=vertexInputs.map(point=>xyzSnapshot(point,'source vertex'));
 return {id,faces,vertices:points};
}
const triple=(a,b,c)=>det3(a,b,c);
const add3=(a,b,c)=>sum(sum(a,b),c);
function rationalCorner(a,b,c){
 const ar=[a.normal.x,a.normal.y,a.normal.z],
  br=[b.normal.x,b.normal.y,b.normal.z],
  cr=[c.normal.x,c.normal.y,c.normal.z],
  den=triple(ar,br,cr);
 if(sign(den)===0)return null;
 const numerator=axis=>triple(
  ar.map((x,i)=>i===axis?a.offsetMm:x),
  br.map((x,i)=>i===axis?b.offsetMm:x),
  cr.map((x,i)=>i===axis?c.offsetMm:x));
 return {den,coords:xyz.map((_,i)=>numerator(i))};
}
function residual(corner,face){
 const n=face.normal,o=face.offsetMm;
 const terms=xyz.map((k,i)=>product(dyadic(n[k]),corner.coords[i]));
 const numerator=difference(add3(...terms),
  product(dyadic(o),corner.den));
 return sign(numerator)*sign(corner.den);
}
function sameCorner(a,b){
 return a.coords.every((x,i)=>
  difference(product(x,b.den),product(b.coords[i],a.den)).n===0n);
}
function exactVertexMatches(corner,point){
 return xyz.every((key,i)=>difference(
  product(dyadic(point[key]),corner.den),corner.coords[i]).n===0n);
}
function certifyConvexVertexSetExact({solid}={}){
 const s=snapshot(solid);
 const out=(status,reason,derivedCount,fullDimensionalVerified=false,
   recessionConeTrivialVerified=false)=>Object.freeze({
  schema:'draftai-m0-exact-convex-vertex-set/1',status,reason,
  solidId:s.id,halfspaceCount:s.faces.length,
  suppliedVertexCount:s.vertices.length,derivedVertexCount:derivedCount,
  exactForRepresentedBinary64Halfspaces:true,
  recessionConeTrivialVerified,fullDimensionalVerified,
  vertexSetCompleteForSuppliedHalfspacesVerified:
   status==='certified-exact-vertex-set',
  // The caller may provide fabricated geometry; this proof is algebraic
  // ONLY for the supplied halfspaces and vertex coordinates.
  sourceGeometryVerified:false,sourceRevisionVerified:false,
  completeSceneVerified:false,officialLineStyleVerified:false,
  v5VerifiedExportReady:false
 });
 const recession=certifyTrivialRecessionCone({halfspaces:s.faces});
 if(!recession.recessionConeTrivialVerified)
  return out('undetermined','recession-cone-not-proven',0);
 const corners=[];const m=s.faces.length;
 for(let i=0;i<m;i++)for(let j=i+1;j<m;j++)
 for(let k=j+1;k<m;k++){
  const candidate=rationalCorner(s.faces[i],s.faces[j],s.faces[k]);
  if(!candidate)continue;
  const all=s.faces.map(f=>residual(candidate,f));
  if(all.some(v=>v>0))continue; // Exact outside; not a vertex.
  if(!corners.some(v=>sameCorner(v,candidate)))
   corners.push(candidate);
  if(corners.length>128)
   return out('undetermined','vertex-audit-budget-exceeded',corners.length);
 }
 if(corners.length<4)
  return out('undetermined','no-three-dimensional-finite-vertex-set',
   corners.length,false,true);
 // A finite bounded polytope is full-dimensional iff it has a strictly
 // feasible point. The mean of all its extreme vertices is strictly inside
 // every inequality exactly when each face has at least one strict vertex.
 const full=s.faces.every(face=>corners.some(c=>residual(c,face)<0));
 if(!full)
  return out('undetermined','full-dimensional-interior-not-proven',
   corners.length,false,true);
 const complete=corners.length===s.vertices.length&&
  s.vertices.every((p,i)=>!s.vertices.slice(0,i).some(
   q=>xyz.every(k=>Object.is(p[k],q[k])||p[k]===q[k])))&&
  corners.every(c=>s.vertices.some(v=>exactVertexMatches(c,v)))&&
  s.vertices.every(p=>corners.some(c=>exactVertexMatches(c,p)));
 if(!complete)
  return out('undetermined','vertex-set-not-exactly-representable-or-mismatched',
   corners.length,true,true);
 return out('certified-exact-vertex-set',
  'all-feasible-extreme-rational-corners-match-distinct-binary64-vertices',
  corners.length,true,true);
}
module.exports={certifyConvexVertexSetExact};
