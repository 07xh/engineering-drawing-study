'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1RealNativeScoped2D3DClassBinding:audit}=
 require('../../workbench/c1-native-scoped-2d-3d-class-binding.cjs');
const view='V',sourceEdgeId='m::A|B';
const sourceProjectedFrom={u:0,v:0},sourceProjectedTo={u:10,v:0};
const stroke=(klass,from=0,to=10)=>({
 view,hlrClass:klass,originalPhysicalSourceEdgeId:sourceEdgeId,
 from:{u:from,v:0},to:{u:to,v:0},
 engineeringLineStyle:'undetermined',signedV5Action:false
});
const native=(klass,from,to)=>({
 view,sourceEdgeId,native3DHLRClass:klass,
 derivedFromOriginalNative3DCurveNotGeneratedHLRPaper:true,
 originalM0UnitParameterRange:[from,to],
 engineeringLineStyle:'undetermined',signedV5Action:false
});
const make=(v,h,segments)=>audit({
 view,sourceEdgeId,sourceProjectedFrom,sourceProjectedTo,
 scoped2DVisible:v,scoped2DHidden:h,
 nativeOriginal3DM4:{
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  view,sourceEdgeId,segments,
  native3DSourceParameterPartitionCompleteExactlyOnce:true,
  M4OriginalUnitIntervalCandidateCoverageComplete:true,
  native3DOriginalParameterPositiveGaps:[],
  native3DOriginalParameterPositiveOverlaps:[],
  M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
  officialV5Authorized:false
 }
});
test('actual original-source-filtered generated 2D line has exact same-class original 3D curve support',()=>{
 const r=make([stroke('visible-sharp')],[],[native('visible-sharp',0,1)]);
 assert.equal(r.sourceScoped2DClassBoundWithoutRounding,true);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,1);
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,true);
 assert.deepEqual(r.rows[0].originalM0ExactRationalPaperInterval,['0','1']);
 assert.equal(r.rows[0].actualGlobalHLRGenerated2DTopoDSHistoryCertified,false);
 assert.equal(r.officialV5Authorized,false);
 assert.ok(Object.isFrozen(r.rows[0]));
});
test('partial original 3D native class coverage cannot sign entire generated 2D HLR segment',()=>{
 const r=make([stroke('visible-sharp')],[],[native('visible-sharp',0,.5)]);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,0);
 assert.equal(r.counts.positiveNative3DClassCoverageGapsFor2DEdges,1);
 assert.deepEqual(r.rows[0].exactNative3DSourceClassPositivePaperCoverageGaps,[['1/2','1']]);
 assert.equal(r.globalGenerated2DEdgeToOriginalTopoDSIdentityCertified,false);
});
test('positive one-ULP original native 3D class gap survives rational 2D join',()=>{
 const next=0.5000000000000001;
 const r=make([stroke('visible-sharp')],[],[
  native('visible-sharp',0,.5),native('visible-sharp',next,1)
 ]);
 assert.equal(r.counts.positiveNative3DClassCoverageGapsFor2DEdges,1);
 assert.equal(r.rows[0].exactNative3DSourceClassPositivePaperCoverageGaps.length,1);
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
});
test('a forged native-complete flag cannot hide an unrepresented original source suffix',()=>{
 // The generated 2D line only occupies [0,1/2], so local same-class
 // coverage alone passes. The original M4 inventory is nevertheless
 // incomplete; its upstream "complete" flags must not be blindly trusted.
 const r=make([stroke('visible-sharp',0,5)],[],[
  native('visible-sharp',0,.5)
 ]);
 assert.equal(r.rows[0].exactSameClassNative3DSourceIntervalCoverage,true);
 assert.equal(r.rows[0].originalNativeParameterPartitionIndependentlyVerified,false);
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,0);
 assert.equal(r.sourceScoped2DClassBoundWithoutRounding,false);
 assert.equal(r.officialV5Authorized,false);
});
test('duplicated or overlapping native M4 source intervals cannot borrow completeness flags',()=>{
 for(const parts of [
  [native('visible-sharp',0,1),native('visible-sharp',0,1)],
  [native('visible-sharp',0,.75),native('hidden-sharp',.5,1)]
 ]){
  const r=make([stroke('visible-sharp',0,.5)],[],parts);
  assert.equal(r.rows[0].exactSameClassNative3DSourceIntervalCoverage,true);
  assert.equal(r.rows[0].originalNativeParameterPartitionIndependentlyVerified,false);
  assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
  assert.equal(r.officialV5Authorized,false);
 }
});
test('opposite true native 3D visibility class never authorizes generated 2D paper alias',()=>{
 const r=make([stroke('visible-sharp')],[],[
  native('visible-sharp',0,.5),native('hidden-sharp',.5,1)
 ]);
 assert.equal(r.counts.exactOppositeClassPositiveOverlapEdges,1);
 assert.equal(r.rows[0].exactOppositeNative3DClassPositiveIntervalConflict,true);
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
});
test('received native generated 2D off original M0 paper line remains held even with all 3D coverage',()=>{
 const w=stroke('visible-sharp');w.to.v=Number.MIN_VALUE;
 const r=make([w],[],[native('visible-sharp',0,1)]);
 assert.equal(r.rows[0].exactOriginalM0PaperAffineCollinearity,false);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,0);
 assert.equal(r.counts.paperDriftOrClassCoverageHeld,1);
});
test('distinct 3D source or invented class / V5 signoff is rejected',()=>{
 for(const modify of [
  x=>{x[0].originalPhysicalSourceEdgeId='m::B|C';},
  x=>{x[0].signedV5Action=true;},
  x=>{x[0].hlrClass='unverified';},
 ]){
  const s=[stroke('visible-sharp')];modify(s);
  assert.throws(()=>make(s,[],[native('visible-sharp',0,1)]),
   /native source-scoped|forged/);
 }
 const fake=native('hidden-sharp',0,1);
 fake.derivedFromOriginalNative3DCurveNotGeneratedHLRPaper=false;
 assert.throws(()=>make([stroke('visible-sharp')],[],[fake]),
  /invalid native 3D M4/);
});
test('hidden generated 2D source-scoped line may be proven class-consistent only as original 3D evidence',()=>{
 const r=make([],[stroke('hidden-sharp')],[native('hidden-sharp',0,1)]);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,1);
 assert.equal(r.rows[0].hlrClass,'hidden-sharp');
 assert.equal(r.rows[0].entireOpaqueSceneVisibilityCertified,false);
 assert.equal(r.rows[0].engineeringLineStyle,'undetermined');
});

test('genuine skew tetra rounded generated 2D endpoint is bounded by one source-scale ULP, not exact source geometry',()=>{
 const original={from:{u:0,v:0},to:{u:3,v:2}};
 const observed=stroke('hidden-sharp');
 observed.from={u:3,v:2};
 observed.to={u:0,v:-4.440892098500626e-16};
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  view,sourceEdgeId,
  segments:[native('hidden-sharp',0,1)],
  native3DSourceParameterPartitionCompleteExactlyOnce:true,
  M4OriginalUnitIntervalCandidateCoverageComplete:true,
  native3DOriginalParameterPositiveGaps:[],
  native3DOriginalParameterPositiveOverlaps:[],
  M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
  officialV5Authorized:false
 };
 const r=audit({view,sourceEdgeId,
  sourceProjectedFrom:original.from,sourceProjectedTo:original.to,
  scoped2DVisible:[],scoped2DHidden:[observed],
  nativeOriginal3DM4:nativeM4});
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,0);
 assert.equal(r.counts.paperDriftOrClassCoverageHeld,1);
 assert.equal(r.counts.roundedPaperRepresentationCompatibleButNotExactCertified,1);
 assert.equal(r.native2DAnd3DSourceClassHasBoundedRoundoffOnlyForHeldRows,true);
 assert.equal(r.rows[0].originalNativeSourceScopedGenerated2DFullEdgeOneULPEnvelope.compatible,true);
 assert.equal(r.rows[0].native3DSameVisibilityClassExactlyCoversWholeOriginalSource,true);
 assert.equal(r.rows[0].generated2DRepresentationWithinOneULPOfFullOriginalM0Source,true);
 assert.equal(r.rows[0].roundedPaperEnvelopeCannotReplaceExactM0SourceParameterCoverage,true);
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
 assert.equal(r.officialV5Authorized,false);
});
test('real skew tetra slightly outside native paper domain remains exact one-ULP gap despite bounded output representation',()=>{
 const observed=stroke('visible-sharp');
 observed.from={u:5,v:23};
 observed.to={u:0,v:-3.552713678800501e-15};
 const r=audit({view,sourceEdgeId,
  sourceProjectedFrom:{u:0,v:0},sourceProjectedTo:{u:5,v:23},
  scoped2DVisible:[observed],scoped2DHidden:[],
  nativeOriginal3DM4:{
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
   view,sourceEdgeId,segments:[native('visible-sharp',0,1)],
   native3DSourceParameterPartitionCompleteExactlyOnce:true,
  M4OriginalUnitIntervalCandidateCoverageComplete:true,
  native3DOriginalParameterPositiveGaps:[],
  native3DOriginalParameterPositiveOverlaps:[],
  M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
   officialV5Authorized:false
  }});
 assert.equal(r.rows[0].exactReceived2DPaperWithinOriginalSourceDomain,false);
 assert.equal(r.rows[0].exactSameClassNative3DSourceIntervalCoverage,false);
 assert.deepEqual(r.rows[0].originalM0ExactRationalPaperInterval,
  ['-1/6473924464345088','1']);
 assert.equal(r.rows[0].generated2DRepresentationWithinOneULPOfFullOriginalM0Source,true);
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
 assert.equal(r.counts.paperDriftOrClassCoverageHeld,1);
});
test('a larger-than-one-ULP or long-distance paper alias never borrows source class',()=>{
 const observed=stroke('hidden-sharp');
 observed.from={u:3,v:2};
 observed.to={u:0,v:-1.7763568394002505e-15};
 const r=audit({view,sourceEdgeId,
  sourceProjectedFrom:{u:0,v:0},sourceProjectedTo:{u:3,v:2},
  scoped2DVisible:[],scoped2DHidden:[observed],
  nativeOriginal3DM4:{
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
   view,sourceEdgeId,segments:[native('hidden-sharp',0,1)],
   native3DSourceParameterPartitionCompleteExactlyOnce:true,
  M4OriginalUnitIntervalCandidateCoverageComplete:true,
  native3DOriginalParameterPositiveGaps:[],
  native3DOriginalParameterPositiveOverlaps:[],
  M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
   officialV5Authorized:false
  }});
 assert.equal(r.rows[0].originalNativeSourceScopedGenerated2DFullEdgeOneULPEnvelope.compatible,false);
 assert.equal(r.rows[0].generated2DRepresentationWithinOneULPOfFullOriginalM0Source,false);
 assert.equal(r.counts.roundedPaperRepresentationCompatibleButNotExactCertified,0);
});
test('source envelope must also have whole original native 3D class coverage, without opposite class or held native bits',()=>{
 const observed=stroke('visible-sharp');
 observed.to.v=Number.MIN_VALUE;
 const args={view,sourceEdgeId,sourceProjectedFrom,sourceProjectedTo,
  scoped2DVisible:[observed],scoped2DHidden:[]};
 const mk=(parts,held=[])=>audit({...args,nativeOriginal3DM4:{
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  view,sourceEdgeId,segments:parts,
  native3DSourceParameterPartitionCompleteExactlyOnce:true,
  M4OriginalUnitIntervalCandidateCoverageComplete:true,
  native3DOriginalParameterPositiveGaps:[],
  native3DOriginalParameterPositiveOverlaps:[],
  M4ProjectedNative3DIntervalsHeldForBinary64Representation:held,
  officialV5Authorized:false
 }});
 const partial=mk([native('visible-sharp',0,.5)]);
 assert.equal(partial.rows[0].generated2DRepresentationWithinOneULPOfFullOriginalM0Source,false);
 const opposite=mk([native('visible-sharp',0,.5),native('hidden-sharp',.5,1)]);
 assert.equal(opposite.rows[0].generated2DRepresentationWithinOneULPOfFullOriginalM0Source,false);
 const held=mk([native('visible-sharp',0,1)],[{
  originalNative3DParameterRange:[.5,.5000000000000001]
 }]);
 assert.equal(held.rows[0].generated2DRepresentationWithinOneULPOfFullOriginalM0Source,false);
});
test('large-absolute-coordinate short edge cannot use 1-ULP of global position to cover arbitrary local offset',()=>{
 const offset=2**50;
 const observed=stroke('visible-sharp');
 observed.from={u:offset,v:0};
 observed.to={u:offset+1,v:1e-5};
 const r=audit({view,sourceEdgeId,
  sourceProjectedFrom:{u:offset,v:0},
  sourceProjectedTo:{u:offset+1,v:0},
  scoped2DVisible:[observed],scoped2DHidden:[],
  nativeOriginal3DM4:{
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
   view,sourceEdgeId,segments:[native('visible-sharp',0,1)],
   native3DSourceParameterPartitionCompleteExactlyOnce:true,
  M4OriginalUnitIntervalCandidateCoverageComplete:true,
  native3DOriginalParameterPositiveGaps:[],
  native3DOriginalParameterPositiveOverlaps:[],
  M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
   officialV5Authorized:false
  }});
 assert.equal(r.rows[0].originalNativeSourceScopedGenerated2DFullEdgeOneULPEnvelope.compatible,false);
 assert.equal(r.counts.roundedPaperRepresentationCompatibleButNotExactCertified,0);
});

test('native positive gap erased by binary64 M4 normalization cannot falsely certify 2D class',()=>{
 const nativeGap=[6.489320296857823,6.489320296857824];
 assert.ok(nativeGap[1]>nativeGap[0]);
 assert.equal(nativeGap[0]/10,nativeGap[1]/10,
  'distinct native curve parameters can map to one rounded M4 fraction');
 const fakeRoundedM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  view,sourceEdgeId,
  // M4 paper intervals deceptively cover [0,1] without a visible gap.
  segments:[native('visible-sharp',0,.5),native('visible-sharp',.5,1)],
  native3DSourceParameterPartitionCompleteExactlyOnce:false,
  M4OriginalUnitIntervalCandidateCoverageComplete:false,
  native3DOriginalParameterPositiveGaps:[nativeGap],
  native3DOriginalParameterPositiveOverlaps:[],
  M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
  officialV5Authorized:false
 };
 const r=audit({view,sourceEdgeId,sourceProjectedFrom,sourceProjectedTo,
  scoped2DVisible:[stroke('visible-sharp')],scoped2DHidden:[],
  nativeOriginal3DM4:fakeRoundedM4});
 assert.equal(r.rows[0].exactSameClassNative3DSourceIntervalCoverage,true,
  'rounded M4 arithmetic alone cannot detect the native gap');
 assert.equal(r.rows[0].originalNativeParameterPartitionIndependentlyVerified,false);
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
 assert.equal(r.rows[0].generated2DRepresentationWithinOneULPOfFullOriginalM0Source,false);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,0);
 assert.equal(r.officialV5Authorized,false);
});


test('BOTH finite source-paper spans overflow: native 2D/3D binding uses exact dominant v, not false u tie',()=>{
 const M=Number.MAX_VALUE;
 const sourceFrom={u:-M/2,v:-M},sourceTo={u:M,v:M};
 assert.equal(Math.abs(sourceTo.u-sourceFrom.u),Infinity);
 assert.equal(Math.abs(sourceTo.v-sourceFrom.v),Infinity);
 const actual={u:M/4,v:0};
 const mk=(a,b,observed)=>audit({
  view,sourceEdgeId,sourceProjectedFrom:a,sourceProjectedTo:b,
  scoped2DVisible:[{
   ...stroke('visible-sharp'),from:observed,to:sourceTo
  }],scoped2DHidden:[],
  nativeOriginal3DM4:{
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
   view,sourceEdgeId,segments:[native('visible-sharp',0,1)],
   native3DSourceParameterPartitionCompleteExactlyOnce:true,
   M4OriginalUnitIntervalCandidateCoverageComplete:true,
   native3DOriginalParameterPositiveGaps:[],
   native3DOriginalParameterPositiveOverlaps:[],
   M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
   officialV5Authorized:false
  }
 });
 const correct=mk(sourceFrom,sourceTo,actual);
 assert.deepEqual(correct.rows[0].originalM0ExactRationalPaperInterval,['1/2','1']);
 assert.equal(correct.rows[0].exactOriginalM0PaperAffineCollinearity,true);
 assert.equal(correct.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,true);
 assert.equal(correct.rows[0].actualGlobalHLRGenerated2DTopoDSHistoryCertified,false);
 assert.equal(correct.officialV5Authorized,false);
 // If the shorter u axis were selected after both Number spans overflow,
 // this off-source 2D segment would appear to cover [0,1] exactly.
 const forged=mk(sourceFrom,sourceTo,{u:sourceFrom.u,v:0});
 assert.deepEqual(forged.rows[0].originalM0ExactRationalPaperInterval,['1/2','1']);
 assert.equal(forged.rows[0].exactOriginalM0PaperAffineCollinearity,false);
 assert.equal(forged.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
 assert.equal(forged.counts.paperDriftOrClassCoverageHeld,1);
 assert.equal(forged.officialV5Authorized,false);
 const reversed=audit({
  view,sourceEdgeId,sourceProjectedFrom:sourceTo,sourceProjectedTo:sourceFrom,
  scoped2DVisible:[{...stroke('visible-sharp'),from:actual,to:sourceTo}],
  scoped2DHidden:[],
  nativeOriginal3DM4:{
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
   view,sourceEdgeId,segments:[native('visible-sharp',0,1)],
   native3DSourceParameterPartitionCompleteExactlyOnce:true,
   M4OriginalUnitIntervalCandidateCoverageComplete:true,
   native3DOriginalParameterPositiveGaps:[],
   native3DOriginalParameterPositiveOverlaps:[],
   M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
   officialV5Authorized:false
  }
 });
 assert.deepEqual(reversed.rows[0].originalM0ExactRationalPaperInterval,['0','1/2']);
 assert.equal(reversed.rows[0].exactOriginalM0PaperAffineCollinearity,true);
 assert.equal(reversed.officialV5Authorized,false);
});

// Cross-edge uniqueness is separate from per-edge native M4 class coverage:
// duplicated generated TopoDS paper strokes must not borrow one physical
// source interval twice just because each one individually matches the source.
test('positive overlapping generated 2D source intervals remain held despite full native 3D class coverage',()=>{
 const r=make([
  stroke('visible-sharp',0,7.5),
  stroke('visible-sharp',5,10)
 ],[],[native('visible-sharp',0,1)]);
 assert.equal(r.counts.positiveGenerated2DSourceParameterOverlapPairs,1);
 assert.equal(r.counts.generated2DEdgesHeldForSourceParameterOverlap,2);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,0);
 assert.equal(r.counts.paperDriftOrClassCoverageHeld,2);
 assert.equal(r.sourceScoped2DGeneratedPaperPositiveOverlapPresent,true);
 assert.equal(r.sourceScoped2DClassBoundWithoutRounding,false);
 for(const row of r.rows){
  assert.equal(row.exactSameClassNative3DSourceIntervalCoverage,true);
  assert.equal(row.positiveGenerated2DSourceParameterOverlapWithAnotherEdge,true);
  assert.equal(row.nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
  assert.equal(row.signedV5Action,false);
 }
 assert.equal(r.officialV5Authorized,false);
});
test('identical reversed generated 2D source interval cannot be counted twice',()=>{
 const first=stroke('visible-sharp',0,10);
 const reversed=stroke('visible-sharp',10,0);
 const r=make([first,reversed],[],[native('visible-sharp',0,1)]);
 assert.deepEqual(r.rows.map(x=>x.originalM0ExactRationalPaperInterval),
  [['0','1'],['0','1']]);
 assert.equal(r.counts.positiveGenerated2DSourceParameterOverlapPairs,1);
 assert.equal(r.counts.generated2DEdgesHeldForSourceParameterOverlap,2);
 assert.equal(r.sourceScoped2DClassBoundWithoutRounding,false);
 assert.equal(r.officialV5Authorized,false);
});
test('adjacent nonoverlapping source-scoped 2D strokes may retain native class consistency',()=>{
 const r=make([
  stroke('visible-sharp',0,5),
  stroke('visible-sharp',5,10)
 ],[],[native('visible-sharp',0,1)]);
 assert.equal(r.counts.positiveGenerated2DSourceParameterOverlapPairs,0);
 assert.equal(r.counts.generated2DEdgesHeldForSourceParameterOverlap,0);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,2);
 assert.equal(r.sourceScoped2DGeneratedPaperPositiveOverlapPresent,false);
 assert.equal(r.sourceScoped2DClassBoundWithoutRounding,true);
 assert.equal(r.officialV5Authorized,false);
});
test('one binary64-ULP positive source interval overlap cannot be silently tolerated',()=>{
 const nextBelowFive=5-Number.EPSILON*4;
 assert.equal(nextBelowFive,4.999999999999999);
 assert.ok(5>nextBelowFive);
 const r=make([
  stroke('visible-sharp',0,5),
  stroke('visible-sharp',nextBelowFive,10)
 ],[],[native('visible-sharp',0,1)]);
 assert.equal(r.counts.positiveGenerated2DSourceParameterOverlapPairs,1);
 assert.equal(r.counts.generated2DEdgesHeldForSourceParameterOverlap,2);
 assert.equal(r.sourceScoped2DClassBoundWithoutRounding,false);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,0);
 assert.equal(r.officialV5Authorized,false);
});

test('native source paper tolerances are per-axis, preserve legitimate v rounding, never sign V5',()=>{
 const {boundedOriginalFullPaperEndpointEnvelope:envelope}=
  require('../../workbench/c1-native-scoped-2d-3d-class-binding.cjs');
 const big=2**40,ulp=2**-12;
 const a={u:0,v:big},b={u:100,v:big+1000};
 const bad=envelope(a,b,{u:1e-10,v:big},b);
 assert.equal(bad.compatible,false);
 assert.ok(bad.originalPaperAxisOneULPEnvelopesMm.u<1e-10);
 assert.ok(bad.originalPaperAxisOneULPEnvelopesMm.v>=ulp);
 const good=envelope(a,b,{u:0,v:big+ulp},b);
 assert.equal(good.compatible,true);
 assert.equal(good.exactClosedOriginalEndpointGeometryCertified,false);
 assert.equal(good.sourceScopedHLRWithinOneScaleULPIsNotOriginalParameterIdentity,true);
 assert.equal(envelope(a,b,b,{u:1e-10,v:big}).compatible,false);
 assert.equal(envelope(a,b,b,{u:0,v:big+ulp}).compatible,true);
});

test('sub-unit source scale never borrows one-millimetre ULP for bounded paper evidence',()=>{
 const {boundedOriginalFullPaperEndpointEnvelope:envelope}=
  require('../../workbench/c1-native-scoped-2d-3d-class-binding.cjs');
 const a={u:1e-6,v:0},b={u:2e-6,v:0};
 const far={u:a.u+1e-17,v:0};
 assert.ok(far.u>a.u);
 const report=envelope(a,b,far,b);
 assert.equal(report.compatible,false);
 assert.ok(report.originalPaperAxisOneULPEnvelopesMm.u<1e-20);
 assert.ok(Math.abs(far.u-a.u)>report.originalPaperAxisOneULPEnvelopesMm.u);
 // One real representable ULP at the larger original source coordinate
 // remains a necessary rounded-output compatibility witness, not history.
 const nextUp={u:b.u+Number.EPSILON*b.u,v:0};
 assert.ok(nextUp.u>b.u);
 const accepted=envelope(a,b,a,nextUp);
 assert.equal(accepted.compatible,true);
 assert.equal(accepted.exactClosedOriginalEndpointGeometryCertified,false);
 assert.equal(envelope(b,a,nextUp,a).compatible,true);
 // A truly zero-valued source paper axis never borrows a 1-mm epsilon.
 assert.equal(envelope(a,b,{u:a.u,v:1e-18},b).compatible,false);
});

test('native M4 keeps sub-unit original source paper drift held despite whole 3D class',()=>{
 const a={u:1e-6,v:0},b={u:2e-6,v:0};
 const received={...stroke('visible-sharp'),
  from:{u:a.u+1e-17,v:0},to:{...b}};
 const r=audit({view,sourceEdgeId,
  sourceProjectedFrom:a,sourceProjectedTo:b,
  scoped2DVisible:[received],scoped2DHidden:[],
  nativeOriginal3DM4:{
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
   native3DOutlineSegments:[],
   view,sourceEdgeId,segments:[native('visible-sharp',0,1)],
   native3DSourceParameterPartitionCompleteExactlyOnce:true,
   M4OriginalUnitIntervalCandidateCoverageComplete:true,
   native3DOriginalParameterPositiveGaps:[],
   native3DOriginalParameterPositiveOverlaps:[],
   M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
   officialV5Authorized:false
  }
 });
 assert.equal(r.rows[0].exactOriginalM0PaperAffineCollinearity,true);
 assert.equal(r.rows[0].native3DSameVisibilityClassExactlyCoversWholeOriginalSource,true);
 assert.equal(r.rows[0].originalNativeSourceScopedGenerated2DFullEdgeOneULPEnvelope.compatible,false);
 assert.equal(r.rows[0].generated2DRepresentationWithinOneULPOfFullOriginalM0Source,false);
 assert.equal(r.counts.roundedPaperRepresentationCompatibleButNotExactCertified,0);
 assert.equal(r.rows[0].signedV5Action,false);
 assert.equal(r.officialV5Authorized,false);
});

test('real M4 source binding holds cross-axis alias with full native class evidence',()=>{
 const big=2**40,ulp=2**-12,a={u:0,v:big},b={u:100,v:big+1000};
 const mk=from=>audit({
  view,sourceEdgeId,sourceProjectedFrom:a,sourceProjectedTo:b,
  scoped2DVisible:[{...stroke('visible-sharp'),from,to:b}],
  scoped2DHidden:[],
  nativeOriginal3DM4:{
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
   view,sourceEdgeId,native3DOutlineSegments:[],
   segments:[native('visible-sharp',0,1)],
   native3DSourceParameterPartitionCompleteExactlyOnce:true,
   M4OriginalUnitIntervalCandidateCoverageComplete:true,
   native3DOriginalParameterPositiveGaps:[],
   native3DOriginalParameterPositiveOverlaps:[],
   M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
   officialV5Authorized:false
  }
 });
 const bad=mk({u:1e-10,v:big});
 assert.equal(bad.rows[0].originalNativeSourceScopedGenerated2DFullEdgeOneULPEnvelope.compatible,false);
 assert.equal(bad.rows[0].generated2DRepresentationWithinOneULPOfFullOriginalM0Source,false);
 assert.equal(bad.counts.roundedPaperRepresentationCompatibleButNotExactCertified,0);
 assert.equal(bad.officialV5Authorized,false);
 const good=mk({u:0,v:big+ulp});
 assert.equal(good.rows[0].originalNativeSourceScopedGenerated2DFullEdgeOneULPEnvelope.compatible,true);
 assert.equal(good.rows[0].generated2DRepresentationWithinOneULPOfFullOriginalM0Source,true);
 assert.equal(good.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
 assert.equal(good.officialV5Authorized,false);
});

// The real consumer supplies both CAD revision and M0 geometry identity.
// A stale M4 partition must not be recycled after a mesh edit even when
// its original edge ID and projected coordinates happen to remain equal.
test('real CAD source-class binding rejects stale revision and foreign M0 geometry',()=>{
 const args={view,sourceEdgeId,sourceProjectedFrom,sourceProjectedTo,
  scoped2DVisible:[stroke('visible-sharp')],scoped2DHidden:[],
  expectedSourceGeometryId:'m',expectedRevision:12,
  nativeOriginal3DM4:{
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
   sourceGeometryId:'m',revision:12,view,sourceEdgeId,
   originalNative3DSourceParameterRange:[0,1],
   original3DSourceCurveDirection:'forward',
   segments:[{...native('visible-sharp',0,1),
    originalNative3DParameterRange:[0,1]}],
   native3DSourceParameterPartitionCompleteExactlyOnce:true,
   M4OriginalUnitIntervalCandidateCoverageComplete:true,
   native3DOriginalParameterPositiveGaps:[],
   native3DOriginalParameterPositiveOverlaps:[],
   M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
   officialV5Authorized:false
  }};
 const ok=audit(args);
 assert.equal(ok.sourceScoped2DClassBoundWithoutRounding,true);
 assert.equal(ok.officialV5Authorized,false);
 // Both partitions can appear complete while the raw OCCT intervals are
 // deliberately assigned to DIFFERENT normalized M4 source positions.
 const misbound=structuredClone(args);
 misbound.nativeOriginal3DM4.segments=[
  {...native('visible-sharp',0,.25),
   originalNative3DParameterRange:[0,.5]},
  {...native('visible-sharp',.25,1),
   originalNative3DParameterRange:[.5,1]}
 ];
 assert.throws(()=>audit(misbound),/native-to-M4 source interval normalization mismatch/);
 // Reversed original BRep orientation is legitimate when every M4 cut
 // is reproduced by the same direction-specific native normalization.
 const reversed=structuredClone(args);
 reversed.nativeOriginal3DM4.original3DSourceCurveDirection='reversed';
 assert.equal(audit(reversed).sourceScoped2DClassBoundWithoutRounding,true);
 // Held native source intervals must also reproduce their original
 // normalized range; they may not silently borrow a different paper cut.
 const heldMapping=structuredClone(args);
 heldMapping.nativeOriginal3DM4.segments=[
  {...native('visible-sharp',0,.25),
   originalNative3DParameterRange:[0,.25]},
  {...native('visible-sharp',.5,1),
   originalNative3DParameterRange:[.5,1]}
 ];
 heldMapping.nativeOriginal3DM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation=[
  {view,sourceEdgeId,sourceGeometryId:'m',revision:12,
   originalVertexIds:['A','B'],
   reason:'positive-original-interval-collapsed-by-binary64-paper-projection',
   originalNative3DParameterRange:[.25,.5],
   roundedOriginalM0UnitParameterRange:[.25,.5],
   native3DHLRClass:'visible-sharp',
   engineeringLineStyle:'undetermined',signedV5Action:false}
 ];
 heldMapping.nativeOriginal3DM4.M4OriginalUnitIntervalCandidateCoverageComplete=false;
 assert.equal(audit(heldMapping).sourceScoped2DClassBoundWithoutRounding,false);
 // A real held native 3D interval cannot be borrowed from a different
 // original edge, first-angle view, revision, model or HLR class, even
 // when its numerical [first,last] partition is identical.
 for(const [field,wrong] of [
  ['sourceEdgeId','m::A|C'],['sourceGeometryId','foreign'],
  ['view','H'],['revision',11],['native3DHLRClass','visible-outline'],
  ['signedV5Action',true],['engineeringLineStyle','continuous'],
  ['reason','unverified-native-interval'],['originalVertexIds',['A','C']]
 ]){
  const forged=structuredClone(heldMapping);
  forged.nativeOriginal3DM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation[0][field]=wrong;
  assert.throws(()=>audit(forged),/held native M4 interval source\/revision\/class provenance mismatch/,field);
 }
 heldMapping.nativeOriginal3DM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation[0]
  .roundedOriginalM0UnitParameterRange=[.25,.49999999999999994];
 assert.throws(()=>audit(heldMapping),/native-to-M4 source interval normalization mismatch/);
 // Rounded M4 [0,1] appears complete but original OCCT parameters have
 // a STRICTLY positive one-ULP gap. Forged upstream flags must not pass.
 const forged=structuredClone(args);
 forged.nativeOriginal3DM4.segments=[
  {...native('visible-sharp',0,.5),
   originalNative3DParameterRange:[0,.5]},
  {...native('visible-sharp',.5,1),
   originalNative3DParameterRange:[.5000000000000001,1]}
 ];
 assert.throws(()=>audit(forged),/independently replayed M4 source/);
 // A truthfully reported native gap stays unsigned when two distinct
 // ORIGINAL BRep parameters normalize to the same binary64 M4 t=1/2.
 // Unlike the forged fixture above, this reproduces the actual forward
 // normalization for BOTH segments, so it must return held, not throw.
 const held=structuredClone(args);
 held.nativeOriginal3DM4.originalNative3DSourceParameterRange=[-1e10,1e10];
 held.nativeOriginal3DM4.segments=[
  {...native('visible-sharp',0,.5),
   originalNative3DParameterRange:[-1e10,0]},
  {...native('visible-sharp',.5,1),
   originalNative3DParameterRange:[Number.MIN_VALUE,1e10]}
 ];
 assert.equal((1e10+Number.MIN_VALUE)/2e10,.5);
 held.nativeOriginal3DM4.native3DSourceParameterPartitionCompleteExactlyOnce=false;
 held.nativeOriginal3DM4.M4OriginalUnitIntervalCandidateCoverageComplete=false;
 held.nativeOriginal3DM4.native3DOriginalParameterPositiveGaps=
  [[0,Number.MIN_VALUE]];
 const heldResult=audit(held);
 assert.equal(heldResult.originalNativeParameterPartitionIndependentlyVerified,false);
 assert.equal(heldResult.sourceScoped2DClassBoundWithoutRounding,false);
 assert.equal(heldResult.officialV5Authorized,false);
 const overlapping=structuredClone(args);
 overlapping.nativeOriginal3DM4.segments=[
  {...native('visible-sharp',0,.5),originalNative3DParameterRange:[0,.6]},
  {...native('visible-sharp',.5,1),originalNative3DParameterRange:[.5,1]}
 ];
 assert.throws(()=>audit(overlapping),/independently replayed M4 source/);
 const noDomain=structuredClone(args);
 delete noDomain.nativeOriginal3DM4.originalNative3DSourceParameterRange;
 assert.throws(()=>audit(noDomain),/bounded original native 3D curve parameter range/);
 assert.throws(()=>audit({...args,expectedRevision:13}),/current genuine source-filtered/);
 assert.throws(()=>audit({...args,expectedSourceGeometryId:'other'}),/current genuine source-filtered/);
 assert.throws(()=>audit({...args,nativeOriginal3DM4:{...args.nativeOriginal3DM4,revision:11}}),/current genuine source-filtered/);
 assert.throws(()=>audit({...args,nativeOriginal3DM4:{...args.nativeOriginal3DM4,sourceGeometryId:'foreign'}}),/current genuine source-filtered/);
});

test('finite overflowing source span retains only bounded unsigned endpoint compatibility',()=>{
 const {boundedOriginalFullPaperEndpointEnvelope:envelope}=
  require('../../workbench/c1-native-scoped-2d-3d-class-binding.cjs');
 const max=Number.MAX_VALUE;
 const a={u:-max,v:0},b={u:max,v:0};
 assert.equal(Math.hypot(b.u-a.u,b.v-a.v),Infinity);
 const exact=envelope(a,b,{...a},{...b});
 assert.equal(exact.compatible,true);
 assert.equal(exact.exactClosedOriginalEndpointGeometryCertified,false);
 const reversed=envelope(a,b,{...b},{...a});
 assert.equal(reversed.compatible,true);
 // No infinite received coordinates or transverse drift can inherit
 // an original-source endpoint identity merely because hypot overflowed.
 assert.equal(envelope(a,b,{u:Infinity,v:0},b).compatible,false);
 assert.equal(envelope(a,b,{u:-max,v:2*Number.MIN_VALUE},b).compatible,false);
});

test('two individually class-backed scoped 2D fragments cannot conceal an uncovered original-source suffix',()=>{
 const r=make([stroke('visible-sharp',0,5)],[],
  [native('visible-sharp',0,1)]);
 assert.equal(r.sourceScoped2DClassBoundWithoutRounding,true,
  'per-fragment native class consistency is not whole-source coverage');
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,true);
 assert.deepEqual(r.sourceScoped2DGeneratedPaperPositiveOriginalSourceGaps,
  [['1/2','1']]);
 assert.equal(r.counts.positiveGenerated2DSourceParameterGapCount,1);
 assert.equal(r.sourceScoped2DGeneratedPaperFullOriginalParameterCoverageExact,false);
 assert.equal(r.globalGenerated2DEdgeToOriginalTopoDSIdentityCertified,false);
 assert.equal(r.officialV5Authorized,false);
});
test('reverse-ordered contiguous source-scoped 2D fragments cover exact original [0,1] without claiming TopoDS history',()=>{
 const r=make([stroke('visible-sharp',10,5),stroke('visible-sharp',5,0)],[],
  [native('visible-sharp',0,1)]);
 assert.deepEqual(r.sourceScoped2DGeneratedPaperPositiveOriginalSourceGaps,[]);
 assert.equal(r.sourceScoped2DGeneratedPaperFullOriginalParameterCoverageExact,true);
 assert.equal(r.counts.positiveGenerated2DSourceParameterGapCount,0);
 assert.equal(r.globalGenerated2DEdgeToOriginalTopoDSIdentityCertified,false);
 assert.equal(r.officialV5Authorized,false);
});
test('strict one-ULP positive gap between generated 2D fragments survives exact rational source union',()=>{
 const next=5.000000000000001;
 assert.ok(next>5);
 const r=make([stroke('visible-sharp',0,5),
  stroke('visible-sharp',next,10)],[],
  [native('visible-sharp',0,1)]);
 assert.equal(r.counts.positiveGenerated2DSourceParameterGapCount,1);
 assert.equal(r.sourceScoped2DGeneratedPaperFullOriginalParameterCoverageExact,false);
 assert.notDeepEqual(r.sourceScoped2DGeneratedPaperPositiveOriginalSourceGaps,[]);
 assert.equal(r.officialV5Authorized,false);
});
test('off-source paper alias cannot fill missing native generated 2D original-source coverage',()=>{
 const fake=stroke('visible-sharp',5,10);
 fake.to.v=Number.MIN_VALUE;
 const r=make([stroke('visible-sharp',0,5),fake],[],
  [native('visible-sharp',0,1)]);
 assert.deepEqual(r.sourceScoped2DGeneratedPaperPositiveOriginalSourceGaps,
  [['1/2','1']]);
 assert.equal(r.sourceScoped2DGeneratedPaperFullOriginalParameterCoverageExact,false);
 assert.equal(r.rows[1].exactOriginalM0PaperAffineCollinearity,false);
 assert.equal(r.officialV5Authorized,false);
});

test('absent native source-scoped 2D output leaves the entire physical source uncovered',()=>{
 const r=make([],[],[native('visible-sharp',0,1)]);
 assert.deepEqual(r.sourceScoped2DGeneratedPaperPositiveOriginalSourceGaps,[['0','1']]);
 assert.equal(r.counts.positiveGenerated2DSourceParameterGapCount,1);
 assert.equal(r.sourceScoped2DGeneratedPaperFullOriginalParameterCoverageExact,false);
 assert.equal(r.sourceScoped2DClassBoundWithoutRounding,false);
 assert.equal(r.officialV5Authorized,false);
});
test('two full-length generated 2D aliases cannot claim exact-once source coverage',()=>{
 const r=make([stroke('visible-sharp'),stroke('visible-sharp')],[],
  [native('visible-sharp',0,1)]);
 assert.deepEqual(r.sourceScoped2DGeneratedPaperPositiveOriginalSourceGaps,[]);
 assert.equal(r.sourceScoped2DGeneratedPaperPositiveOverlapPresent,true);
 assert.equal(r.sourceScoped2DGeneratedPaperFullOriginalParameterCoverageExact,false);
 assert.equal(r.counts.generated2DEdgesHeldForSourceParameterOverlap,2);
 assert.equal(r.officialV5Authorized,false);
});
