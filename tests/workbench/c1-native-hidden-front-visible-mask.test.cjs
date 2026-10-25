'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {mappedActualVisibleHLRToHiddenOriginalParameter:mapVisible}=
 require('../../workbench/c1-native-hidden-front-visible-mask.cjs');
const {exactCandidateIntervalCoverage:cover}=
 require('../../workbench/c1-ocjs-hidden-sharp-m5-corroboration.cjs');
const geometry={id:'Mask',data:{points:{
 B:{x:0,y:0,z:10},C:{x:10,y:0,z:10},
 F:{x:0,y:0,z:0},G:{x:10,y:0,z:0}
}}};
const pt=t=>project({x:10*t,y:0,z:10}).H;
const native=(from,to)=>({
 view:'H',occtHLRVisibilityClass:'visible-sharp',
 actualOCCTHLRFlattenedBRepLineVerified:true,
 actualOCCTHLRCurveEntireFiniteIntervalIsLine:true,
 v5Authorized:false,from,to
});
const mapped=(from,to)=>mapVisible({
 geometry,view:'H',hiddenOriginalVertexIds:['B','C'],
 nativeVisible:native(from,to)
});
test('independently measured actual visible front OCCT edge maps to same hidden ORIGINAL source parameter whole interval',()=>{
 const r=mapped(pt(0),pt(1));
 assert.equal(r.nativeVisibleOnSameBoundedOriginalPaperLine,true);
 assert.deepEqual(r.hiddenOriginalSourceParameterRange,[0,1]);
 assert.equal(cover([0,1],[r.hiddenOriginalSourceParameterRange]).
  entireOriginalParameterIntervalCovered,true);
});
test('opposite HLR endpoint orientation does not falsely break positive-length continuous front mask',()=>{
 const r=mapped(pt(.75),pt(.25));
 assert.deepEqual(r.hiddenOriginalSourceParameterRange,[.25,.75]);
 assert.equal(cover([.3,.7],[r.hiddenOriginalSourceParameterRange]).
  entireOriginalParameterIntervalCovered,true);
});
test('front visible native sharp edge covering only half native hidden paper line cannot mask entire hidden stroke',()=>{
 const r=mapped(pt(0),pt(.5));
 const cov=cover([0,1],[r.hiddenOriginalSourceParameterRange]);
 assert.equal(cov.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(cov.positiveLengthUncoveredIntervals,[[.5,1]]);
});
test('two proven native visible front segments with binary64 parameter gap do not masquerade as one complete stroke',()=>{
 const r1=mapped(pt(0),pt(.5));
 const r2=mapped(pt(.5+Number.EPSILON),pt(1));
 const cov=cover([0,1],[
  r1.hiddenOriginalSourceParameterRange,
  r2.hiddenOriginalSourceParameterRange]);
 assert.equal(cov.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(cov.positiveLengthUncoveredIntervals,
  [[.5,.5+Number.EPSILON]]);
});
test('paper-offset native front visible stroke is NOT a front mask despite parallel projected source',()=>{
 const off={...pt(0),v:pt(0).v+1};
 const r=mapped(off,{...pt(1),v:pt(1).v+1});
 assert.equal(r.nativeVisibleOnSameBoundedOriginalPaperLine,false);
 assert.equal(r.hiddenOriginalSourceParameterRange,null);
});
test('unverified HLR class, forged line or impossible native visible source fail closed',()=>{
 const h=native(pt(0),pt(1));
 h.actualOCCTHLRFlattenedBRepLineVerified=false;
 assert.throws(()=>mapVisible({geometry,view:'H',
  hiddenOriginalVertexIds:['B','C'],nativeVisible:h}),/true V\/H\/W/);
 assert.throws(()=>mapVisible({geometry,view:'H',
  hiddenOriginalVertexIds:['B','Z'],nativeVisible:native(pt(0),pt(1))}),
 /missing original hidden source/);
 const r=mapped(pt(-.1),pt(.7));
 assert.equal(r.nativeVisibleOnSameBoundedOriginalPaperLine,false);
 assert.equal(r.hiddenOriginalSourceParameterRange,null);
});
