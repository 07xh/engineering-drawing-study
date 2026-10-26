'use strict';
// A complete source partition is necessary but insufficient to draw a line:
// collapsed first-angle projections must remain explicitly non-drawable.
const test=require('node:test');
const assert=require('node:assert/strict');
const {certifyExactOriginalRaySourceParameterPartition:partition}=
 require('../c1-native-hidden-global-m5-stroke-gate.cjs');
const key='H@actual-original-3d-edge';
const row=(a,b)=>({originalSourceParameterRange:[a,b]});
test('complete original source ray partition cannot make collapsed projection drawable',()=>{
 const spans=[row(0,.5),row(.5,1)];
 const collapsed=partition({sourceViewKey:key,spans,projectionCollapsedExactly:true});
 const drawable=partition({sourceViewKey:key,spans,projectionCollapsedExactly:false});
 assert.equal(collapsed.fullOriginalParameterRayPartitionCoverage,true);
 assert.equal(collapsed.physicalLineDrawableInThisFirstAngleView,false);
 assert.equal(drawable.physicalLineDrawableInThisFirstAngleView,true);
 for(const result of [collapsed,drawable]){
  assert.equal(result.originalFaceRayAndGeneratedHLRTopologyComplete,false);
  assert.equal(result.nationalEngineeringLineStyleSigned,false);
  assert.equal(result.signedV5Action,false);
 }
});
test('complete interval union with overlapping ray witnesses is not a valid ray partition',()=>{
 const result=partition({sourceViewKey:key,spans:[row(0,.75),row(.5,1)],projectionCollapsedExactly:false});
 assert.equal(result.disjointCanonicalM4OriginalRayIntervals,false);
 assert.equal(result.fullOriginalParameterRayPartitionCoverage,false);
 assert.equal(result.signedV5Action,false);
});
test('source view key and explicit collapsed status are required',()=>{
 for(const args of [
  {sourceViewKey:'H',spans:[row(0,1)],projectionCollapsedExactly:false},
  {sourceViewKey:key,spans:[row(0,1)]},
  {sourceViewKey:key,spans:null,projectionCollapsedExactly:false}
 ]) assert.throws(()=>partition(args),TypeError);
});
