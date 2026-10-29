'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1Native3DSourceScopedIntervals:audit}=
 require('../../workbench/c1-native-source-scoped-3d-parameter-coverage.cjs');
test('full native 3D source-scoped interval is complete but still cannot sign V5',()=>{
 const r=audit({originalNativeParameterRange:[-5,15],
  generatedNativeParameterRanges:[[5,15],[-5,5]]});
 assert.deepEqual(r.positiveLengthUncoveredNativeParameterIntervals,[]);
 assert.deepEqual(r.positiveLengthOverlappingNativeParameterIntervals,[]);
 assert.equal(r.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,true);
 assert.equal(r.originalGeneratedTopoDSHistoryCertified,false);
 assert.equal(r.signedV5Action,false);
 assert.ok(Object.isFrozen(r.generatedNativeParameterRanges));
});
test('one binary64 ULP gap survives native parameter partition without epsilon',()=>{
 const r=audit({originalNativeParameterRange:[0,1],
  generatedNativeParameterRanges:[[0,0.5],[0.5+Number.EPSILON,1]]});
 assert.deepEqual(r.positiveLengthUncoveredNativeParameterIntervals,
  [[0.5,0.5+Number.EPSILON]]);
 assert.equal(r.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,false);
});
test('subnormal positive source gap remains nonzero',()=>{
 const r=audit({originalNativeParameterRange:[0,1],
  generatedNativeParameterRanges:[[Number.MIN_VALUE,1]]});
 assert.deepEqual(r.positiveLengthUncoveredNativeParameterIntervals,
  [[0,Number.MIN_VALUE]]);
 assert.equal(r.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,false);
});
test('positive native source overlap rejects exactly-once coverage',()=>{
 const r=audit({originalNativeParameterRange:[0,1],
  generatedNativeParameterRanges:[[0,0.75],[0.5,1],[0.6,0.8]]});
 assert.deepEqual(r.positiveLengthOverlappingNativeParameterIntervals,[[0.5,0.8]]);
 assert.equal(r.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,false);
});
test('touching source fragments are not a positive overlap',()=>{
 const r=audit({originalNativeParameterRange:[1,3],
  generatedNativeParameterRanges:[[1,2],[2,3]]});
 assert.equal(r.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,true);
});
test('forged out-of-range and collapsed native segments fail closed',()=>{
 for(const generatedNativeParameterRanges of [
  [[-Number.MIN_VALUE,1]],[[0,1+Number.EPSILON]],
  [[0,0]],[[0,NaN]],[[0,Infinity]]
 ])assert.throws(()=>audit({originalNativeParameterRange:[0,1],
  generatedNativeParameterRanges}),/native|interval/);
 assert.throws(()=>audit({originalNativeParameterRange:[0,0],
  generatedNativeParameterRanges:[]}),/native/);
});
