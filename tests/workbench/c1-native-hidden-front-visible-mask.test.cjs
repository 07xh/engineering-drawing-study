'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {mappedActualVisibleHLRToHiddenOriginalParameter:mapVisible,
 auditC1NativeHiddenFrontVisibleMasks:auditMask}=
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
 assert.ok(r2.hiddenOriginalSourceParameterRange[0]>.5,
  'native projected 3D-to-2D-to-original parameter gap must stay positive');
 assert.deepEqual(cov.positiveLengthUncoveredIntervals,
  [[.5,r2.hiddenOriginalSourceParameterRange[0]]]);
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

function genuineNativeFrontMaskFixture(complete=false){
 const g={...geometry,data:{...geometry.data,edges:[['B','C'],['F','G']]}},
  hiddenId='Mask::B|C',frontId='Mask::F|G',revision=27;
 const hidden={view:'H',occtHLRVisibilityClass:'hidden-sharp',
  actualOCCTHLRFlattenedBRepLineVerified:true,
  actualOCCTHLRCurveEntireFiniteIntervalIsLine:true,
  v5Authorized:false,from:pt(0),to:pt(1),
  sourceCandidate3DLifts:[{sourceEdgeId:hiddenId,
   originalSourceParameterRange:[0,1],originalOCCTSourceLineCurveVerified:true,
   actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
   originalXYZReprojectsToHLR:true,v5Authorized:false}]};
 const visible=(a,b)=>({...native(pt(a),pt(b)),
  sourceCandidate3DLifts:[{sourceEdgeId:frontId,
   originalOCCTSourceLineCurveVerified:true,
   actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
   originalXYZReprojectsToHLR:true,v5Authorized:false}]});
 return {
  geometry:g,revision,
  cad:{sourceGeometryId:'Mask',revision,
   hiddenHLROutputFromActualOCCT:true,engineComputedVisibleGeometry:true,
   v5Authorized:false,views:{V:[],H:complete?[visible(0,.5),visible(.5,1)]:[visible(0,.5)],W:[]},
   hiddenSharpViews:{V:[],H:[hidden],W:[]}},
  refinements:[{view:'H',projectedFrom:pt(0),projectedTo:pt(1),
   nativeHLRToSourceTopoDSIdentityRecovered:false,signedV5Action:false,
   remainingPhysicalSourcePossibilities:[{sourceEdgeId:hiddenId}]}],
  m5:{sourceGeometryId:'Mask',revision,signedV5ActionCount:0,
   rows:[{originalPhysicalSourceEdgeId:frontId,view:'H',
    completeSourceOriginal3DRayClosedIntervalClear:true,
    originalPhysicalCreaseProven:true,signedV5Action:false}]},
  sourceDepth:{sourceGeometryId:'Mask',revision,
   engineeringLineStylesSigned:false,officialV5ActionCount:0,
   witnesses:[{view:'H',firstSourceEdgeId:hiddenId,secondSourceEdgeId:frontId,
    frontSourceEdgeId:frontId,firstParameterRange:[0,1],
    exactM4PositivePaperCollinearOverlap:true,
    continuousAffineOpenDepthOrderProven:true,
    signedV5Action:false,standardEngineeringLineStyle:'undetermined'}]}
 };
}
test('forged external HLR interval oracle cannot mask an uncovered original 3D hidden half-edge',()=>{
 const x=genuineNativeFrontMaskFixture();
 let calls=0;
 const out=auditMask({...x,exactIntervalCoverage:()=>{
  calls++;return {entireOriginalParameterIntervalCovered:true,
   positiveLengthCoveredIntervals:[[0,1]],positiveLengthUncoveredIntervals:[]};
 }});
 const row=out.rows[0];
 assert.equal(calls,0);
 assert.equal(row.entireNativeHiddenPaperStrokeCoveredByPositivelyClearFrontSource,false);
 assert.deepEqual(row.wholeHiddenPaperIntervalMaskCoverage.positiveLengthCoveredIntervals,[[0,.5]]);
 assert.deepEqual(row.wholeHiddenPaperIntervalMaskCoverage.positiveLengthUncoveredIntervals,[[.5,1]]);
 assert.equal(out.counts.hiddenNativeFullPaperMaskByRealVisibleFrontSource,0);
 assert.equal(out.signedV5ActionCount,0);
});
test('two genuine contiguous OCCT front VCompound pieces completely mask a hidden HCompound original open interval, but cannot sign GB/V5',()=>{
 const x=genuineNativeFrontMaskFixture(true),proof=auditMask(x),row=proof.rows[0];
 assert.equal(row.entireNativeHiddenPaperStrokeCoveredByPositivelyClearFrontSource,true);
 assert.deepEqual(row.wholeHiddenPaperIntervalMaskCoverage.positiveLengthCoveredIntervals,[[0,1]]);
 assert.deepEqual(row.wholeHiddenPaperIntervalMaskCoverage.positiveLengthUncoveredIntervals,[]);
 assert.equal(proof.counts.realVisibleFrontM5ClosedRayAndM4DepthWitnessCount,2);
 assert.equal(proof.counts.hiddenNativeFullPaperMaskByRealVisibleFrontSource,1);
 assert.equal(row.officialEngineeringLineStyle,'undetermined');
 assert.equal(row.signedV5Action,false);
});
