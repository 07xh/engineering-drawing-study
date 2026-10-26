'use strict';
// Independent fail-closed regression for the existing C1 source interval gate.
// Run: node --test workbench/tests/c1-native-source-partition-boundaries-20261027.test.cjs
const test=require('node:test');
const assert=require('node:assert/strict');
const {certifyExactOriginalRaySourceParameterPartition:ray,
 certifyExactNativeGeneratedSourceTiling:tiling}=require('../c1-native-hidden-global-m5-stroke-gate.cjs');
const nextDownOne=1-Number.EPSILON/2;
const key='V@physical-source';
const span=(a,b)=>({originalSourceParameterRange:[a,b]});
test('positive exact partition remains unsigned',()=>{
 const result=ray({sourceViewKey:key,spans:[span(0,.5),span(.5,1)],projectionCollapsedExactly:false});
 assert.equal(result.fullOriginalParameterRayPartitionCoverage,true);
 assert.equal(result.nationalEngineeringLineStyleSigned,false);
 assert.equal(result.signedV5Action,false);
 assert.equal(result.originalFaceRayAndGeneratedHLRTopologyComplete,false);
});
test('one representable binary64 gap must not pass',()=>{
 const result=ray({sourceViewKey:key,spans:[span(0,.5),span(.5+Number.EPSILON,1)],projectionCollapsedExactly:false});
 assert.equal(result.fullOriginalParameterRayPartitionCoverage,false);
 assert.ok(result.originalParameterUncoveredIntervals.length>0);
});
test('overlapping physical intervals must not pass even with full union',()=>{
 const result=ray({sourceViewKey:key,spans:[span(0,.75),span(.5,1)],projectionCollapsedExactly:false});
 assert.equal(result.fullOriginalParameterRayPartitionCoverage,false);
 assert.equal(result.disjointCanonicalM4OriginalRayIntervals,false);
});
test('collapsed paper view does not erase physical source partition',()=>{
 const result=ray({sourceViewKey:'W@physical-source',spans:[span(0,1)],projectionCollapsedExactly:true});
 assert.equal(result.fullOriginalParameterRayPartitionCoverage,true);
 assert.equal(result.physicalLineDrawableInThisFirstAngleView,false);
 assert.equal(result.signedV5Action,false);
});
test('empty evidence is never a vacuous success',()=>{
 assert.equal(ray({sourceViewKey:key,spans:[],projectionCollapsedExactly:false}).fullOriginalParameterRayPartitionCoverage,false);
 assert.equal(tiling({sourceViewKey:key,intervals:[]}).disjointExactCompleteOriginalSourceGeneratedEdgeTiling,false);
});
test('native HLR exact tiling refuses overlap and endpoint gap',()=>{
 const good=tiling({sourceViewKey:key,intervals:[[0,.5],[.5,1]]});
 assert.equal(good.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,true);
 assert.equal(good.signedV5Action,false);
 assert.equal(tiling({sourceViewKey:key,intervals:[[0,.75],[.5,1]]}).disjointExactCompleteOriginalSourceGeneratedEdgeTiling,false);
 const gap=tiling({sourceViewKey:key,intervals:[[0,nextDownOne]]});
 assert.equal(gap.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,false);
 assert.ok(gap.originalSourceParameterGaps.length>0);
});
test('invalid zero-length and nonfinite native intervals fail closed',()=>{
 for(const intervals of [[[0,0]],[[0,NaN]],[[0,Infinity]],[[-.1,1]],[[0,1.1]]])
  assert.throws(()=>tiling({sourceViewKey:key,intervals}),RangeError);
});

test('native source intervals are sorted without mutating caller input',()=>{
 const intervals=[[.5,1],[0,.5]];
 const result=tiling({sourceViewKey:key,intervals});
 assert.deepEqual(intervals,[[.5,1],[0,.5]]);
 assert.deepEqual(result.originalNativeSourceIntervals,[[0,.5],[.5,1]]);
 assert.equal(Object.isFrozen(result),true);
 assert.equal(Object.isFrozen(result.originalNativeSourceIntervals),true);
});
test('one ULP of source overlap cannot be hidden by complete union',()=>{
 const boundary=.5;
 const justBefore=boundary-Number.EPSILON/2;
 const result=tiling({sourceViewKey:key,intervals:[[0,boundary],[justBefore,1]]});
 assert.equal(result.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,false);
 assert.ok(result.positiveSameOriginal3DSourceGeneratedEdgeOverlaps.length>0);
 assert.equal(result.fullGeneratedOCCTToOriginalTopoDSHistoryCertified,false);
});
test('ray partitions reject forged or empty source parameter ranges',()=>{
 for(const ranges of [[[0,0]],[[0,Infinity]],[[-.1,1]],[[0,1.1]],[[.75,.25]]]){
  assert.throws(()=>ray({sourceViewKey:key,spans:ranges.map(([a,b])=>span(a,b)),projectionCollapsedExactly:false}),RangeError);
 }
});
test('full native tiling cannot imply global engineering or V5 authorization',()=>{
 const result=tiling({sourceViewKey:'H@physical-source',intervals:[[0,1]]});
 assert.equal(result.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,true);
 assert.equal(result.fullGeneratedOCCTToOriginalTopoDSHistoryCertified,false);
 assert.equal(result.officialGBLineStyleSigned,false);
 assert.equal(result.signedV5Action,false);
});

test('native tiling does not mutate original source fragment order',()=>{
 const original=[[.5,1],[0,.5]];
 const result=tiling({sourceViewKey:key,intervals:original});
 assert.deepEqual(original,[[.5,1],[0,.5]]);
 assert.deepEqual(result.originalNativeSourceIntervals,[[0,.5],[.5,1]]);
});
test('source view identifier and collapse evidence are mandatory',()=>{
 assert.throws(()=>ray({sourceViewKey:'H',spans:[span(0,1)],projectionCollapsedExactly:false}),TypeError);
 assert.throws(()=>ray({sourceViewKey:key,spans:[span(0,1)]}),TypeError);
 assert.throws(()=>tiling({sourceViewKey:'H',intervals:[[0,1]]}),TypeError);
});
test('native complete union cannot override a duplicated fragment',()=>{
 const result=tiling({sourceViewKey:key,intervals:[[0,1],[0,1]]});
 assert.equal(result.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,false);
 assert.deepEqual(result.positiveSameOriginal3DSourceGeneratedEdgeOverlaps,[[0,1]]);
 assert.equal(result.signedV5Action,false);
});
