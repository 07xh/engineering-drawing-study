'use strict';
// Keep the final native M4/M5 gate aligned with the shared 512-fragment
// exact physical-source coverage budget, before sorting/allocating arrays.
const test=require('node:test');
const assert=require('node:assert/strict');
const {certifyExactOriginalRaySourceParameterPartition:ray,
 certifyExactNativeGeneratedSourceTiling:tiling}=
 require('../../workbench/c1-native-hidden-global-m5-stroke-gate.cjs');
const key='H@bounded-original-source';
const intervals=n=>Array.from({length:n},(_,i)=>[i/n,(i+1)/n]);
test('native M4 and generated OCCT HLR consumers reject unbounded fragments',()=>{
 const many=intervals(513);
 assert.throws(()=>ray({sourceViewKey:key,
  spans:many.map(originalSourceParameterRange=>({originalSourceParameterRange})),
  projectionCollapsedExactly:false}),TypeError);
 assert.throws(()=>tiling({sourceViewKey:key,intervals:many}),TypeError);
});
test('bounded complete source partition still remains unsigned',()=>{
 const rows=intervals(512);
 const original=ray({sourceViewKey:key,
  spans:rows.map(originalSourceParameterRange=>({originalSourceParameterRange})),
  projectionCollapsedExactly:false});
 const native=tiling({sourceViewKey:key,intervals:rows});
 assert.equal(original.fullOriginalParameterRayPartitionCoverage,true);
 assert.equal(native.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,true);
 assert.equal(original.signedV5Action,false);
 assert.equal(native.signedV5Action,false);
});
