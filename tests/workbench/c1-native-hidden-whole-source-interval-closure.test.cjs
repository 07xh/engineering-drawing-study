'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {certifyNativeHiddenOriginalOpenInterval:certify}=
 require('../../workbench/c1-native-hidden-whole-source-interval-closure.cjs');
const cut=(a,b,hidden=false,clear=false)=>({
 originalParameterRange:[a,b],
 exactWholeOpenStrictInwardHidden:hidden,
 exactWholeOpenRayClear:clear,signedV5Action:false
});
const check=(range,cuts)=>certify({
 nativeOriginalParameterRange:range,
 canonicalM5OriginalSourceCuts:cuts
});
test('entire native OCCT hidden source open interval has positive exact original M5 ray proof',()=>{
 const proof=check([0.2,0.8],[
  cut(0,0.4,true),cut(0.4,0.6,true),cut(0.6,1,true)]);
 assert.equal(proof.wholeNativeOriginalOpenIntervalStrictlyHiddenByM5,true);
 assert.equal(proof.nativeOriginalParameterFullyCoveredByM4Cuts,true);
 assert.deepEqual(proof.strictM5HiddenProofGapsAlongNativeHLRInterval,[]);
 assert.equal(proof.generatedHLRTopoDSToOriginalTopoDSCertified,false);
 assert.equal(proof.engineeringHiddenLineStyleSigned,false);
 assert.equal(proof.signedV5Action,false);
});
test('positive-length one-ULP native original source M4 gap is never hidden by tolerance',()=>{
 const half=0.5,next=half+Number.EPSILON;
 const proof=check([0,1],[cut(0,half,true),cut(next,1,true)]);
 assert.deepEqual(proof.uncoveredNativeOriginal3DSourceIntervals,[[half,next]]);
 assert.deepEqual(proof.strictM5HiddenProofGapsAlongNativeHLRInterval,[[half,next]]);
 assert.equal(proof.wholeNativeOriginalOpenIntervalStrictlyHiddenByM5,false);
});
test('M4 complete but one clear or undecided cut means full native HLR hidden proof fails',()=>{
 const p=check([0,1],[
  cut(0,0.3,true),cut(.3,.5),cut(.5,.7,false,true),cut(.7,1,true)]);
 assert.equal(p.nativeOriginalParameterFullyCoveredByM4Cuts,true);
 assert.equal(p.wholeNativeOriginalOpenIntervalStrictlyHiddenByM5,false);
 assert.equal(p.M5ClearRayOverlapsNativeHLRHiddenPaperCandidate,true);
 assert.deepEqual(p.strictM5HiddenProofGapsAlongNativeHLRInterval,[[.3,.7]]);
});
test('native source partial interval only demands strict original inward M5 witness on itself',()=>{
 const proof=check([0.25,0.4],[
  cut(0,0.2,false,true),cut(0.2,0.5,true),cut(0.5,1,false,true)]);
 assert.equal(proof.wholeNativeOriginalOpenIntervalStrictlyHiddenByM5,true);
 assert.equal(proof.M5ClearRayOverlapsNativeHLRHiddenPaperCandidate,false);
});
test('M5 overlapping cuts, contradictory exact inward/clear, forged V5 and invalid params fail closed',()=>{
 assert.throws(()=>check([0,1],[cut(0,.7,true),cut(.5,1,true)]),
  /untrusted, overlapping/);
 assert.throws(()=>check([0,1],[cut(0,1,true,true)]),/contradictory/);
 const forged=cut(0,1,true);forged.signedV5Action=true;
 assert.throws(()=>check([0,1],[forged]),/untrusted/);
 assert.throws(()=>check([-.1,1],[cut(0,1,true)]),/bounded native/);
 assert.throws(()=>check([0,0],[cut(0,1,true)]),/bounded native/);
});
test('no M5 cut cannot accidentally certify an actual native CAD hidden stroke',()=>{
 const p=check([0,1],[]);
 assert.deepEqual(p.uncoveredNativeOriginal3DSourceIntervals,[[0,1]]);
 assert.equal(p.wholeNativeOriginalOpenIntervalStrictlyHiddenByM5,false);
});

// A user-supplied callback used to be trusted as the mathematical coverage
// oracle. It could return fabricated full-coverage booleans even for a
// missing one-ULP interval. The production certifier now always consumes
// the existing canonical source-interval union directly.
test('forged external interval oracle cannot certify a missing physical M5 cut',()=>{
 const half=.5,next=half+Number.EPSILON/2;
 let forgedCalls=0;
 const fake=()=>{
  forgedCalls++;
  return {entireOriginalParameterIntervalCovered:true,
   positiveLengthCoveredIntervals:[[0,1]],
   positiveLengthUncoveredIntervals:[],
   originalSourceSubspanHasGenuinePositiveLengthGap:false};
 };
 const proof=certify({nativeOriginalParameterRange:[0,1],
  canonicalM5OriginalSourceCuts:[cut(0,half,true),cut(next,1,true)],
  exactIntervalCoverage:fake});
 assert.equal(forgedCalls,0);
 assert.equal(proof.wholeNativeOriginalOpenIntervalStrictlyHiddenByM5,false);
 assert.deepEqual(proof.uncoveredNativeOriginal3DSourceIntervals,[[half,next]]);
 assert.deepEqual(proof.strictM5HiddenProofGapsAlongNativeHLRInterval,[[half,next]]);
 assert.equal(proof.engineeringHiddenLineStyleSigned,false);
 assert.equal(proof.signedV5Action,false);
});
