'use strict';
/** One-read acceptance of full caller-owned source sets in the existing
 * OFFLINE exact-convex-vertex-set. All geometric arithmetic is unchanged.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyConvexVertexSetExact:certify}=
 require('../../core/numeric/exact-convex-vertex-set.cjs');
const P=(x,y,z)=>({x,y,z}),H=(x,y,z,t)=>({normal:P(x,y,z),offsetMm:t});
function box(){
 return {id:'Box',halfspaces:[
  H(-1,0,0,0),H(1,0,0,10),
  H(0,-1,0,0),H(0,1,0,8),
  H(0,0,-1,0),H(0,0,1,6)],
  vertices:[0,10].flatMap(x=>[0,8].flatMap(y=>[0,6].map(z=>P(x,y,z))))
 };
}
test('real finite closed source succeeds when face/vertex arrays and source ID mutate on their SECOND getter reads',()=>{
 const solid=box(),faces=solid.halfspaces,vertices=solid.vertices;
 let ids=0,fc=0,vc=0;
 Object.defineProperty(solid,'id',{enumerable:true,get(){return ++ids===1?'Box':'Forged';}});
 Object.defineProperty(solid,'halfspaces',{enumerable:true,get(){return ++fc===1?faces:[];}});
 Object.defineProperty(solid,'vertices',{enumerable:true,get(){return ++vc===1?vertices:[P(1,1,1)];}});
 const r=certify({solid});
 assert.equal(r.status,'certified-exact-vertex-set');
 assert.equal(r.solidId,'Box');
 assert.equal(r.derivedVertexCount,8);
 assert.equal(r.sourceGeometryVerified,false);
 assert.equal(r.sourceRevisionVerified,false);
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.officialLineStyleVerified,false);
 assert.equal(r.v5VerifiedExportReady,false);
 assert.equal(ids,1);assert.equal(fc,1);assert.equal(vc,1);
});
test('source face offsets/normals and all extreme corner coordinate getters are read only once',()=>{
 const solid=box(),f=solid.halfspaces[1],point=solid.vertices[0];
 let off=0,n=0,v=0;
 Object.defineProperty(f,'offsetMm',{enumerable:true,
  get(){return ++off===1?10:-10;}});
 Object.defineProperty(f.normal,'x',{enumerable:true,
  get(){return ++n===1?1:Infinity;}});
 Object.defineProperty(point,'x',{enumerable:true,
  get(){return ++v===1?0:Infinity;}});
 const result=certify({solid});
 assert.equal(result.status,'certified-exact-vertex-set');
 assert.equal(off,1);assert.equal(n,1);assert.equal(v,1);
});
test('source arrays captured before nested getter can swap a different face or corner reference',()=>{
 const solid=box(),faces=solid.halfspaces,vertices=solid.vertices;
 let normalGets=0;
 Object.defineProperty(faces[0].normal,'x',{enumerable:true,
  get(){
   normalGets++;
   faces[1]=H(1,0,0,-20);
   vertices[1]=P(500,500,500);
   return -1;
  }});
 const r=certify({solid});
 assert.equal(normalGets,1);
 assert.equal(r.status,'certified-exact-vertex-set');
 assert.equal(r.derivedVertexCount,8);
 assert.equal(r.sourceGeometryVerified,false);
});
test('invalid FIRST top-level input, missing face, empty vertex or forged ID never promotes certification',()=>{
 for(const field of ['id','halfspaces','vertices']){
  const s=box(),value=s[field];let calls=0;
  const first={id:'',halfspaces:[],vertices:[]}[field];
  Object.defineProperty(s,field,{enumerable:true,get(){return ++calls===1?first:value;}});
  assert.throws(()=>certify({solid:s}),TypeError);
  assert.equal(calls,1);
 }
 const h=box();delete h.halfspaces[1];
 assert.throws(()=>certify({solid:h}),/missing halfspace/);
 const v=box();delete v.vertices[2];
 assert.throws(()=>certify({solid:v}),/missing source vertex/);
});
test('inconsistent bounded solid still cannot pass even with a coherent source snapshot',()=>{
 const source=box();source.halfspaces[0].offsetMm=-20;
 const r=certify({solid:source});
 assert.equal(r.status,'undetermined');
 assert.equal(r.vertexSetCompleteForSuppliedHalfspacesVerified,false);
});
