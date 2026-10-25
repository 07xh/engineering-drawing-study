'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {exactCandidateIntervalCoverage:cover}=
 require('../../workbench/c1-ocjs-hidden-sharp-m5-corroboration.cjs');
const {certifyHiddenNativeOriginalOpenIntervalDualCoverage:combine}=
 require('../../workbench/c1-native-hidden-dual-proof-open-interval-union.cjs');
const prove=(strict,mask,range=[0,1])=>combine({
 originalSourceParameterRange:range,
 strictInteriorRanges:strict,frontVisibleMaskRanges:mask,
 exactIntervalCoverage:cover
});
test('native hidden HLR complete only when complementary strict 3D inward and actually visible front native OCCT paper ranges cover entire source',()=>{
 const r=prove([[0,.4]],[[.4,1]]);
 assert.equal(r.strictInwardSourceEntireOpenIntervalProven,false);
 assert.equal(r.independentFrontVisibleSourceMaskEntireOpenIntervalProven,false);
 assert.equal(r.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor,true);
 assert.deepEqual(r.outstandingUnprovedOriginalParameterIntervals,[]);
 assert.equal(r.globallyFinalStandardLineStyleCertified,false);
 assert.equal(r.completeOCCTGeneratedBRepEdgeOriginalTopoDSHistory,false);
 assert.equal(r.constructionIntentAuthorized,false);
 assert.equal(r.signedV5Action,false);
});
test('strict original 3D inward M5 alone covers one full original hidden open interval without front source',()=>{
 const r=prove([[0,.3],[.3,1]],[]);
 assert.equal(r.strictInwardSourceEntireOpenIntervalProven,true);
 assert.equal(r.independentFrontVisibleSourceMaskEntireOpenIntervalProven,false);
 assert.equal(r.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor,true);
});
test('genuine OCCT front visible source alone masks entire hidden paper interval without claiming strict interior ray',()=>{
 const r=prove([],[[0,1]]);
 assert.equal(r.strictInwardSourceEntireOpenIntervalProven,false);
 assert.equal(r.independentFrontVisibleSourceMaskEntireOpenIntervalProven,true);
 assert.equal(r.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor,true);
});
test('one-ULP positive source parameter gap between the two independent proofs MUST remain unproven',()=>{
 const r=prove([[0,.5]],[[.5+Number.EPSILON,1]]);
 assert.equal(r.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor,false);
 assert.deepEqual(r.outstandingUnprovedOriginalParameterIntervals,
  [[.5,.5+Number.EPSILON]]);
});
test('unproved original source interval remains unsigned even when both have positive witnesses but leave a gap',()=>{
 const r=prove([[0,.35]],[[.6,1]]);
 assert.deepEqual(r.outstandingUnprovedOriginalParameterIntervals,[[.35,.6]]);
 assert.equal(r.globallyFinalStandardLineStyleCertified,false);
});
test('clipped native HLR interval can be entirely locally proved without falsely requiring entire source edge',()=>{
 const r=prove([[0,.2]],[[.2,.6]],[.1,.5]);
 assert.equal(r.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor,true);
 assert.deepEqual(r.originalSourceParameterRange,[.1,.5]);
 assert.deepEqual(r.onlyLocallyVerifiedHiddenOrFrontMaskIntervals,[[.1,.5]]);
});
test('invalid original parameter intervals or untrusted proof range fail closed',()=>{
 assert.throws(()=>prove([],[],[0,0]),/native HLR bounded/);
 assert.throws(()=>prove([],[],[-.1,1]),/native HLR bounded/);
 assert.throws(()=>prove([[0,1.1]],[]),/verified finite native CAD source interval/);
 assert.throws(()=>prove([],[[.4,.4]]),/verified finite native CAD source interval/);
});
