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
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1',
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
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1',
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
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1',
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
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1',
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
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1',
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
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1',
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
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1',
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


test('partial source-scoped 2D stroke cannot borrow forged complete M4 source coverage',()=>{
 const incomplete=make([stroke('visible-sharp',0,5)],[],
  [native('visible-sharp',0,.5)]);
 assert.equal(incomplete.rows[0].exactSameClassNative3DSourceIntervalCoverage,true);
 assert.equal(incomplete.rows[0].originalNativeParameterPartitionIndependentlyVerified,false);
 assert.equal(incomplete.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
 assert.equal(incomplete.counts.exactSameClassNative3DBackedEdges,0);
 assert.equal(incomplete.officialV5Authorized,false);
});

test('same-class overlapping original M4 intervals cannot double-count a full native source',()=>{
 const overlap=make([stroke('visible-sharp')],[],[
  native('visible-sharp',0,.75),native('visible-sharp',.5,1)
 ]);
 assert.equal(overlap.rows[0].exactSameClassNative3DSourceIntervalCoverage,true);
 assert.equal(overlap.rows[0].originalNativeParameterPartitionIndependentlyVerified,false);
 assert.equal(overlap.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
 assert.equal(overlap.counts.exactSameClassNative3DBackedEdges,0);
});

test('one-ULP M4 gap outside a partial paper stroke is still a whole-source proof blocker',()=>{
 const gap=make([stroke('visible-sharp',0,5)],[],[
  native('visible-sharp',0,.5),
  native('visible-sharp',.5000000000000001,1)
 ]);
 assert.equal(gap.rows[0].exactSameClassNative3DSourceIntervalCoverage,true);
 assert.equal(gap.rows[0].originalNativeParameterPartitionIndependentlyVerified,false);
 assert.equal(gap.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
});

test('exact adjacent complete M4 source partition retains valid partial 2D class support',()=>{
 const complete=make([stroke('visible-sharp',0,5)],[],[
  native('visible-sharp',0,.5),native('visible-sharp',.5,1)
 ]);
 assert.equal(complete.rows[0].originalNativeParameterPartitionIndependentlyVerified,true);
 assert.equal(complete.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,true);
 assert.equal(complete.officialV5Authorized,false);
});
