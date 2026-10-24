'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {certifyConvexVertexSetExact:run}=
 require('../../core/numeric/exact-convex-vertex-set.cjs');
const {determinant3DExactDyadic:det3}=
 require('../../core/numeric/determinant3d-adaptive.cjs');
const {sign}=require('../../core/numeric/binary64-dyadic.cjs');
const P=(x,y,z)=>({x,y,z});
const F=(x,y,z,offsetMm)=>({normal:P(x,y,z),offsetMm});
const box=(x0=0,x1=10,y0=0,y1=8,z0=0,z1=6)=>({
 id:'box',
 halfspaces:[F(-1,0,0,-x0),F(1,0,0,x1),
  F(0,-1,0,-y0),F(0,1,0,y1),
  F(0,0,-1,-z0),F(0,0,1,z1)],
 vertices:[x0,x1].flatMap(x=>[y0,y1].flatMap(y=>[z0,z1].map(z=>P(x,y,z))))
});
const expectCertified=s=>{
 const r=run({solid:s});
 assert.equal(r.status,'certified-exact-vertex-set');
 assert.equal(r.recessionConeTrivialVerified,true);
 assert.equal(r.fullDimensionalVerified,true);
 assert.equal(r.vertexSetCompleteForSuppliedHalfspacesVerified,true);
 assert.equal(r.derivedVertexCount,s.vertices.length);
 assert.equal(r.sourceGeometryVerified,false);
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.v5VerifiedExportReady,false);
};
test('exact six-face cube, rectangular prism and translated model-mm coordinates',()=>{
 expectCertified(box());
 expectCertified(box(-200,-180,12,19,-5,7));
 expectCertified(box(-1,1,-1,1,-1,1));
});
test('arbitrary tetrahedron and five-face square pyramid share one M0 audit',()=>{
 expectCertified({id:'tetra',halfspaces:[
  F(-1,0,0,0),F(0,-1,0,0),F(0,0,-1,0),F(1,1,1,1)],
  vertices:[P(0,0,0),P(1,0,0),P(0,1,0),P(0,0,1)]});
 expectCertified({id:'pyramid',halfspaces:[
  F(4,0,1,4),F(-4,0,1,4),F(0,4,1,4),F(0,-4,1,4),
  F(0,0,-1,0)],vertices:[
   P(-1,-1,0),P(1,-1,0),P(1,1,0),P(-1,1,0),P(0,0,4)]});
});
test('source missing extreme, forged interior and duplicate are never complete',()=>{
 const a=box();a.vertices.pop();
 const b=box();b.vertices.push(P(2,2,2));
 const c=box();c.vertices[0]={...c.vertices[1]};
 for(const s of [a,b,c]){
  const r=run({solid:s});
  assert.equal(r.status,'undetermined');
  assert.equal(r.vertexSetCompleteForSuppliedHalfspacesVerified,false);
 }
});
test('a missing bounding face cannot be certified by finite corner enumeration',()=>{
 const s=box();s.halfspaces.pop();
 assert.equal(run({solid:s}).recessionConeTrivialVerified,false);
});
test('bounded but geometrically empty does not prove any vertices',()=>{
 const s=box();s.halfspaces[0].offsetMm=-20; // x>=20 while x<=10
 const r=run({solid:s});
 assert.equal(r.status,'undetermined');
 assert.equal(r.fullDimensionalVerified,false);
});
test('lower-dimensional bounded square lacks an independently strict 3D interior',()=>{
 const s=box(-1,1,-1,1,0,0);
 const r=run({solid:s});
 assert.equal(r.status,'undetermined');
 assert.equal(r.fullDimensionalVerified,false);
});
test('nonrepresentable rational vertex does not become fake binary64 equality',()=>{
 const s={id:'fraction',halfspaces:[
  F(-3,0,0,0),F(3,0,0,1),
  F(0,-1,0,0),F(0,1,0,1),
  F(0,0,-1,0),F(0,0,1,1)],
  vertices:[0,1/3].flatMap(x=>[0,1].flatMap(y=>[0,1].map(z=>P(x,y,z))))};
 const r=run({solid:s});
 assert.equal(r.status,'undetermined');
 assert.equal(r.fullDimensionalVerified,true);
 assert.equal(r.vertexSetCompleteForSuppliedHalfspacesVerified,false);
});
test('exact rational determinant gives a finite integer sign without rounding',()=>{
 const r=det3([1,0,0],[0,1,0],[0,0,1]);
 assert.equal(sign(r),1);assert.equal(typeof r.n,'bigint');
 assert.equal(sign(det3([1,0,0],[0,0,1],[0,1,0])),-1);
});
test('invalid/sparse/finite bounds and getters fail closed before source acceptance',()=>{
 const good=box(),wrong=box();
 delete wrong.vertices[2];
 assert.throws(()=>run({solid:wrong}));
 const overflow=box();overflow.halfspaces[0].normal.x=Infinity;
 assert.throws(()=>run({solid:overflow}));
 const missing=box();delete missing.halfspaces[2];
 assert.throws(()=>run({solid:missing}));
 let count=0;const mutated=box();
 Object.defineProperty(mutated.vertices[0],'x',{
  get(){count++;return count===1?0:Infinity;}
 });
 expectCertified(mutated);
 assert.equal(count,1);
 assert.equal(run({solid:good}).sourceRevisionVerified,false);
});
