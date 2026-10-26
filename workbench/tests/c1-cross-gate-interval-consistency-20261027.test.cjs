'use strict';
// Independent cross-consumer regression: exact interval coverage is necessary,
// but cannot by itself authorize OCCT native topology, engineering style or V5.
const test=require('node:test');
const assert=require('node:assert/strict');
const {exactCandidateIntervalCoverage:coverage}=require('../c1-original-source-interval-coverage.cjs');
const {certifyExactOriginalRaySourceParameterPartition:ray,
 certifyExactNativeGeneratedSourceTiling:tiling}=require('../c1-native-hidden-global-m5-stroke-gate.cjs');
const sourceViewKey='H@cross-consumer-physical-edge';
const span=([a,b])=>({originalSourceParameterRange:[a,b]});
function compare(intervals){
 const source=coverage([0,1],intervals);
 const original=ray({sourceViewKey,spans:intervals.map(span),projectionCollapsedExactly:false});
 const native=tiling({sourceViewKey,intervals});
 return {source,original,native};
}
test('exact disjoint tiling is consistently covered but remains unsigned',()=>{
 for(const intervals of [[[0,1]],[[0,.5],[.5,1]],[[.5,1],[0,.5]]]){
  const {source,original,native}=compare(intervals);
  assert.equal(source.entireOriginalParameterIntervalCovered,true);
  assert.equal(original.fullOriginalParameterRayPartitionCoverage,true);
  assert.equal(native.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,true);
  assert.equal(original.signedV5Action,false);
  assert.equal(native.signedV5Action,false);
 }
});
test('strict positive gap is rejected by all three independent consumers',()=>{
 const cut=.5-Number.EPSILON/2;
 const {source,original,native}=compare([[0,cut],[.5,1]]);
 assert.equal(source.entireOriginalParameterIntervalCovered,false);
 assert.equal(original.fullOriginalParameterRayPartitionCoverage,false);
 assert.equal(native.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,false);
});
test('overlap can satisfy union but never disjoint physical-source proof',()=>{
 const {source,original,native}=compare([[0,.75],[.5,1]]);
 assert.equal(source.entireOriginalParameterIntervalCovered,true);
 assert.equal(original.disjointCanonicalM4OriginalRayIntervals,false);
 assert.equal(native.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,false);
 assert.equal(native.signedV5Action,false);
});
test('duplicate complete source witnesses never imply generated edge uniqueness',()=>{
 const {source,original,native}=compare([[0,1],[0,1]]);
 assert.equal(source.entireOriginalParameterIntervalCovered,true);
 assert.equal(original.disjointCanonicalM4OriginalRayIntervals,false);
 assert.equal(native.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,false);
});
