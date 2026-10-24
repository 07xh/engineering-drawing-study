'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyTrivialRecessionCone:bounded}=
 require('../../core/numeric/trivial-recession-cone.cjs');
const {certifyConvexVertexSetExact:exact}=
 require('../../core/numeric/exact-convex-vertex-set.cjs');
const P=(x,y,z)=>({x,y,z}),F=(x,y,z,offsetMm)=>({normal:P(x,y,z),offsetMm});
function cube(){
 return [F(-1,0,0,0),F(1,0,0,10),F(0,-1,0,0),
  F(0,1,0,8),F(0,0,-1,0),F(0,0,1,6)];
}
function vertices(){
 return [0,10].flatMap(x=>[0,8].flatMap(y=>[0,6].map(z=>P(x,y,z))));
}
test('boundedness source proof captures complete original face list before caller getters alter it',()=>{
 const faces=cube();let reads=0;
 Object.defineProperty(faces[0].normal,'x',{enumerable:true,get(){
  reads++;
  faces[1]=F(1,0,0,-20); // corrupt a later boundary face
  faces.pop(); // remove another later bounding face
  return -1;
 }});
 const result=bounded({halfspaces:faces});
 assert.equal(reads,1);
 assert.equal(result.status,'certified-trivial-recession');
 assert.equal(result.halfspaceCount,6);
 assert.equal(result.recessionConeTrivialVerified,true);
 assert.equal(result.nonemptyFeasibleSetVerified,false);
 assert.equal(result.sourceGeometryVerified,false);
 assert.equal(result.completeSceneVerified,false);
 assert.equal(result.officialLineStyleVerified,false);
 assert.equal(result.v5VerifiedExportReady,false);
});
test('reciprocal face order and coordinate scaling do not change boundedness certificate',()=>{
 const original=cube();
 for(const input of [
  original,
  original.slice().reverse(),
  original.map(x=>({normal:P(2*x.normal.x,2*x.normal.y,2*x.normal.z),offsetMm:2*x.offsetMm}))
 ]){
  const result=bounded({halfspaces:input});
  assert.equal(result.status,'certified-trivial-recession');
  assert.equal(result.nonparallelPairsChecked,12);
  assert.equal(result.uncertainPairCount,0);
 }
});
test('true incomplete source, missing indexed face and bad first read are never certified',()=>{
 const invalid=cube().slice(0,5);
 assert.equal(bounded({halfspaces:invalid}).recessionConeTrivialVerified,false);
 const missing=cube();delete missing[4];
 assert.throws(()=>bounded({halfspaces:missing}),/missing halfspace/);
 const input=cube();let calls=0;
 Object.defineProperty(input[0].normal,'x',{enumerable:true,get(){
  return ++calls===1?Infinity:-1;
 }});
 assert.throws(()=>bounded({halfspaces:input}),/bounded normal/);
 assert.equal(calls,1);
});
test('bounded recession cone never bypasses independent full dimensionality or exact vertex checks',()=>{
 const faces=cube();
 assert.equal(bounded({halfspaces:faces}).recessionConeTrivialVerified,true);
 const good=exact({solid:{id:'Box',halfspaces:faces,vertices:vertices()}});
 assert.equal(good.status,'certified-exact-vertex-set');
 assert.equal(good.sourceGeometryVerified,false);
 const missing=vertices();missing.pop();
 const fabricated=exact({solid:{id:'Box',halfspaces:faces,vertices:missing}});
 assert.equal(fabricated.status,'undetermined');
 assert.equal(fabricated.vertexSetCompleteForSuppliedHalfspacesVerified,false);
 const contradictory=cube();contradictory[0].offsetMm=-20;
 assert.equal(bounded({halfspaces:contradictory}).recessionConeTrivialVerified,true);
 const none=exact({solid:{id:'Impossible',halfspaces:contradictory,vertices:vertices()}});
 assert.equal(none.status,'undetermined');
 assert.equal(none.fullDimensionalVerified,false);
});
