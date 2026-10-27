'use strict';
// Native OCCT fragments cannot establish a one-to-one original TopoDS
// source tiling merely because their union covers the physical edge.
const test=require('node:test');
const assert=require('node:assert/strict');
const {certifyExactNativeGeneratedSourceTiling:tiling}=
 require('../../workbench/c1-native-hidden-global-m5-stroke-gate.cjs');
const key='H@physical-source';
test('duplicate complete native fragments are rejected despite complete union',()=>{
 const r=tiling({sourceViewKey:key,intervals:[[0,1],[0,1]]});
 assert.deepEqual(r.actualNativeOriginalSourceUnion,[[0,1]]);
 assert.deepEqual(r.originalSourceParameterGaps,[]);
 assert.deepEqual(r.positiveSameOriginal3DSourceGeneratedEdgeOverlaps,[[0,1]]);
 assert.equal(r.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,false);
 assert.equal(r.fullGeneratedOCCTToOriginalTopoDSHistoryCertified,false);
 assert.equal(r.signedV5Action,false);
});
test('partial native fragments with positive overlap cannot certify physical edge',()=>{
 const r=tiling({sourceViewKey:key,intervals:[[0,.75],[.5,1]]});
 assert.deepEqual(r.positiveSameOriginal3DSourceGeneratedEdgeOverlaps,[[.5,.75]]);
 assert.equal(r.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,false);
});
test('disjoint native fragment permutation is stable and never signs a V5 stroke',()=>{
 for(const intervals of [[[0,.25],[.25,.75],[.75,1]],[[.75,1],[0,.25],[.25,.75]]]){
  const r=tiling({sourceViewKey:key,intervals});
  assert.equal(r.disjointExactCompleteOriginalSourceGeneratedEdgeTiling,true);
  assert.equal(r.fullGeneratedOCCTToOriginalTopoDSHistoryCertified,false);
  assert.equal(r.officialGBLineStyleSigned,false);
  assert.equal(r.signedV5Action,false);
 }
});
