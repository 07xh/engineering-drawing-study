'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {matchOriginalBRepEdgeByXYZ:match}=
 require('../../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const xyz=(x,y,z)=>({x,y,z});
const shape=()=>({id:'RealSourceBRep3D',data:{
 points:{A:xyz(0,0,0),B:xyz(10,0,0),C:xyz(0,3,0),
  D:xyz(10,3,0),E:xyz(0,0,8)},
 edges:[['A','B'],['C','D'],['A','E']]
}});
test('real original BRep edge XYZ maps uniquely to reviewed M0 source, never flattened HLR paper alias',()=>{
 const result=match(shape(),xyz(0,0,0),xyz(10,0,0));
 assert.equal(result.sourceEdgeId,'RealSourceBRep3D::A|B');
 assert.equal(result.occtEdgeOrientation,'forward');
 assert.deepEqual(result.fromOCCT3D,xyz(0,0,0));
 assert.deepEqual(result.toOCCT3D,xyz(10,0,0));
 assert.equal(result.originalOCCTBRepVertexXYZMatched,true);
 assert.equal(result.generatedHLREdgeTopoDSIdentityMatched,false);
 assert.equal(result.occtCurveTypeIndependentlyVerified,false);
 assert.equal(result.engineeringLineStyle,'undetermined');
 assert.equal(result.v5Authorized,false);
});
test('reverse TopoDS edge orientation remains the same physical original M0 source edge',()=>{
 const result=match(shape(),xyz(10,0,0),xyz(0,0,0));
 assert.equal(result.sourceEdgeId,'RealSourceBRep3D::A|B');
 assert.equal(result.occtEdgeOrientation,'reverse');
 assert.deepEqual(result.originalVertexIds,['A','B']);
});
test('two edges with identical V projection but different 3D depths stay physically separate',()=>{
 const g=shape();
 const front=match(g,xyz(0,0,0),xyz(10,0,0));
 const back=match(g,xyz(0,3,0),xyz(10,3,0));
 assert.notEqual(front.sourceEdgeId,back.sourceEdgeId);
 assert.deepEqual(front.fromOCCT3D,xyz(0,0,0));
 assert.deepEqual(back.fromOCCT3D,xyz(0,3,0));
 assert.equal(front.generatedHLREdgeTopoDSIdentityMatched,false);
 assert.equal(back.generatedHLREdgeTopoDSIdentityMatched,false);
});
test('BRep edge with no exact original physical 3D counterpart cannot invent a source',()=>{
 const g=shape();
 assert.throws(()=>match(g,xyz(0,1,0),xyz(10,1,0)),/missing or ambiguous/);
 assert.throws(()=>match(g,xyz(0,0,0),xyz(8,0,0)),/missing or ambiguous/);
 assert.throws(()=>match(g,xyz(0,0,0),xyz(0,0,0)),/collapsed/);
});
test('nonfinite or ambiguous original source cannot gain unique TopoDS identity',()=>{
 const g=shape();
 assert.throws(()=>match(g,xyz(NaN,0,0),xyz(10,0,0)),/finite/);
 assert.throws(()=>match(g,xyz(0,0,0),xyz(Infinity,0,0)),/finite/);
 const cloned={...g,data:{...g.data,
  edges:[...g.data.edges,['B','A']]}};
 assert.throws(()=>match(cloned,xyz(0,0,0),xyz(10,0,0)),/missing or ambiguous/);
});
