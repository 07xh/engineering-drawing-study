'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditExactBinary64PaperCandidateCoverage:audit,
 auditExactBinary64PaperVisibilityConflict:classConflict}=
 require('../../workbench/c1-exact-binary64-paper-parameter.cjs');
const {auditC1NativeScopedHLRSourceConsumer:consume}=
 require('../../workbench/c1-native-scoped-hlr-source-consumer.cjs');
const {auditC1ScopedHLRSourceIdentityConflicts:checkNativeClaims}=
 require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
function rebindFixtureNativeLedger(cad,view){
 const scoped=cad.nativeSourceScopedSharpOutputByView[view];
 scoped.nativeSourceIdentityConflicts=checkNativeClaims({
  matches:scoped.rows.flatMap(row=>[...row.visible,...row.hidden]),
  wholeSolidCounts:{
   'visible-sharp':cad.views[view].length,
   'hidden-sharp':cad.hiddenSharpViews[view].length
  }
 });
}
const p=u=>({u,v:0});
const segment=(from,to)=>({from:p(from),to:p(to)});
const run=(sourceFrom,sourceTo,segments)=>audit({
 sourceFrom:p(sourceFrom),sourceTo:p(sourceTo),segments
});

test('exact rational paper union rejects a representable one-ULP positive gap',()=>{
 const next=0.5000000000000001;
 const r=run(0,1,[segment(0,0.5),segment(next,1)]);
 assert.equal(r.exactBinary64PaperCandidateCoverageComplete,false);
 assert.deepEqual(r.exactBinary64PaperPositiveLengthUncoveredIntervals,
  [['1/2','4503599627370497/9007199254740992']]);
 assert.equal(r.generatedToOriginalTopoDSHistoryCertified,false);
 assert.equal(r.signedV5Action,false);
});

test('an interior HLR paper endpoint whose inverse t underflows to 0 cannot close a source tail',()=>{
 const huge=Number.MAX_VALUE,tiny=Number.MIN_VALUE;
 assert.equal(tiny/huge,0); // prior Number inverse silently became original t=0
 const r=run(0,huge,[segment(tiny,huge)]);
 assert.equal(r.exactBinary64PaperCandidateCoverageComplete,false);
 assert.equal(r.exactBinary64PaperPositiveLengthUncoveredIntervals.length,1);
 assert.equal(r.exactBinary64PaperPositiveLengthUncoveredIntervals[0][0],'0');
 assert.notEqual(r.exactBinary64PaperPositiveLengthUncoveredIntervals[0][1],'0');
 assert.equal(r.exactPositiveLengthPaperSegments,1);
 assert.equal(r.engineeringLineStyle,'undetermined');
});

test('exact union remains complete for reversed, overlapping and shuffled candidates',()=>{
 const parts=[segment(0,0.75),segment(0.5,1),segment(0.25,0.5)];
 const a=run(0,1,parts),b=run(0,1,[...parts].reverse());
 assert.equal(a.exactBinary64PaperCandidateCoverageComplete,true);
 assert.deepEqual(a.exactBinary64PaperPositiveLengthCoveredIntervals,[['0','1']]);
 assert.deepEqual(a,b);
 const reversed=run(1,0,[segment(1,0.5),segment(0.5,0)]);
 assert.equal(reversed.exactBinary64PaperCandidateCoverageComplete,true);
 assert.deepEqual(reversed.exactBinary64PaperPositiveLengthUncoveredIntervals,[]);
 assert.equal(reversed.signedV5Action,false);
});

test('exact union rejects nonfinite, out-of-domain and collapsed original sources',()=>{
 for(const bad of [segment(-Number.MIN_VALUE,1),segment(0,1.0000000000000002)]){
  assert.throws(()=>run(0,1,[bad]),RangeError);
 }
 assert.throws(()=>run(0,0,[segment(0,0)]),RangeError);
 assert.throws(()=>run(0,1,[{from:p(NaN),to:p(1)}]),TypeError);
 assert.throws(()=>run(0,1,Array.from({length:513},()=>segment(0,1))),TypeError);
 const empty=run(0,1,[]);
 assert.deepEqual(empty.exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1']]);
 assert.equal(empty.exactBinary64PaperCandidateCoverageComplete,false);
});

test('zero-length dominant-axis native fragments cannot invent positive paper coverage',()=>{
 const r=run(0,1,[segment(0.5,0.5)]);
 assert.equal(r.exactZeroLengthDominantAxisSegments,1);
 assert.equal(r.exactPositiveLengthPaperSegments,0);
 assert.deepEqual(r.exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1']]);
});

function nativeUnderflowFixture(){
 const id='C1Binary64',source=id+'::A|B';
 const geometry={id,data:{points:{
  A:{x:0,y:0,z:0},B:{x:Number.MAX_VALUE,y:0,z:0}
 },edges:[['A','B']]}};
 const cad={sourceGeometryId:id,revision:29,views:{},hiddenSharpViews:{},
  nativeHLRSourceHistoryAPISurfaceByView:{},nativeSourceScopedSharpOutputByView:{}};
 for(const view of ['V','H','W']){
  const visible=view==='W'?[]:[{
   view,hlrClass:'visible-sharp',originalPhysicalSourceEdgeId:source,
   from:p(Number.MIN_VALUE),to:p(Number.MAX_VALUE),
   globalPaperCandidateOrdinals:[0],
   globalDirectSameGeneratedTopoDSOrdinals:[],
   actualNativeScopedToGlobalGeneratedEdgeIsSameProven:false,
   fullOriginalSourceParameterCoverageProven:false,
   globalContinuousOcclusionProven:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  }];
  cad.views[view]=view==='W'?[]:[{
   from:p(Number.MIN_VALUE),to:p(Number.MAX_VALUE),
   projectedOriginalEdgeCandidates:[source]
  }];
  cad.hiddenSharpViews[view]=[];
  cad.nativeHLRSourceHistoryAPISurfaceByView[view]={
   originalDataStructureIndex:{
    availability:'real-native-edge-map-inspected',
    everyOriginalBRepSourcePresentInHLRDataStructure:true,
    indexedOriginalSources:[{
     originalPhysicalSourceEdgeId:source,
     hlrDataStructureOneBasedEdgeIndex:1,
     directlySameOriginalTopoDSInputEdge:true
    }]
   }
  };
  cad.nativeSourceScopedSharpOutputByView[view]={
   schema:'draftai-c1-ocjs-real-original-topods-scoped-hlr/1',
   sourceEdgeCount:1,
   originalTopoDSEdgeIndexCheckedAgainstActualHLREdgeMap:true,
   allScopedOutputsReboundToWholeSolidPaper:true,
   fullGlobalGeneratedEdgeToOriginalSourceHistoryProven:false,
   fullContinuousVisibilityProven:false,signedV5ActionCount:0,
   nativeSourceScopedOutputEdgeCount:visible.length,
   nativeScopedToWholeSolidGeneratedIsSameCount:0,
   paperOnlyScopedOutputEdgeCount:visible.length,
   rows:[{originalPhysicalSourceEdgeId:source,
    hlrDataStructureOneBasedEdgeIndex:1,visible,hidden:[]}]
  };
 }
 for(const view of ['V','H','W'])rebindFixtureNativeLedger(cad,view);
 return {geometry,cad};
}

test('real V/H/W C1 consumer rejects false full rounded t coverage and keeps V5 unsigned',()=>{
 const r=consume(nativeUnderflowFixture());
 assert.equal(r.counts.projectedSourcesWithRoundedFalseFullPaperCandidateCoverage,2);
 assert.equal(r.counts.projectedSourcesWithExactBinary64PaperCandidateGaps,2);
 assert.equal(r.counts.projectedSourcesWithFullExactBinary64PaperCandidateCoverage,0);
 for(const view of ['V','H']){
  const row=r.views[view].sourceParameterCandidates[0];
  // Number division reported [0,1], but the received binary64
  // endpoint is strictly inside the original source.
  assert.deepEqual(row.paperDerivedOriginalSourceParameterCandidateIntervals,[[0,1]]);
  assert.deepEqual(row.paperDerivedPositiveLengthUncoveredCandidateIntervals,[]);
  assert.equal(row.entireOriginalSourcePaperCandidateIntervalCovered,false);
  assert.equal(row.fullOriginalPaperCandidateCoverageWithoutClassConflict,false);
  assert.equal(row.exactBinary64PaperCandidateCoverage.
   exactBinary64PaperCandidateCoverageComplete,false);
  assert.equal(row.actualOriginalTopoDSParameterCoverageCertified,false);
  assert.equal(row.engineeringLineStyle,'undetermined');
  assert.equal(row.signedV5Action,false);
 }
 assert.equal(r.views.W.sourceParameterCandidates[0].originalProjectedEdgeCollapsed,true);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.globalContinuousVisibilityCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});

test('exact visible/hidden source paper intersection detects overlap lost by Number inverse t',()=>{
 const tiny=Number.MIN_VALUE,huge=Number.MAX_VALUE;
 const r=classConflict({
  sourceFrom:p(0),sourceTo:p(huge),
  visibleSegments:[segment(tiny,4*tiny)],
  hiddenSegments:[segment(2*tiny,3*tiny)]
 });
 assert.equal(tiny/huge,0);
 assert.equal((4*tiny)/huge,0);
 assert.equal(r.hasExactPositiveLengthVisibleHiddenPaperClassConflict,true);
 assert.equal(r.exactBinary64PaperPositiveLengthVisibleHiddenConflictIntervals.length,1);
 assert.notEqual(r.exactBinary64PaperPositiveLengthVisibleHiddenConflictIntervals[0][0],
  r.exactBinary64PaperPositiveLengthVisibleHiddenConflictIntervals[0][1]);
 assert.equal(r.actualNativeGeneratedToOriginalTopoDSHistoryCertified,false);
 assert.equal(r.officialEngineeringLineStyle,'undetermined');
 assert.equal(r.signedV5Action,false);
});

test('exact source class overlap ignores shared endpoints, but merges adjacent positive collisions',()=>{
 const common={sourceFrom:p(0),sourceTo:p(1)};
 const none=classConflict({...common,
  visibleSegments:[segment(0,0.5)],
  hiddenSegments:[segment(0.5,1)]
 });
 assert.equal(none.hasExactPositiveLengthVisibleHiddenPaperClassConflict,false);
 assert.deepEqual(none.exactBinary64PaperPositiveLengthVisibleHiddenConflictIntervals,[]);
 const yes=classConflict({...common,
  visibleSegments:[segment(0,0.75),segment(0.75,1)],
  hiddenSegments:[segment(0.25,0.5),segment(0.5,0.875)]
 });
 assert.deepEqual(yes.exactBinary64PaperPositiveLengthVisibleHiddenConflictIntervals,
  [['1/4','7/8']]);
});

test('C1 real native consumer cannot miss an exact conflicting visibility class when rounded t collapses',()=>{
 const {geometry,cad}=nativeUnderflowFixture();
 const id=geometry.id+'::A|B',tiny=Number.MIN_VALUE;
 const hidden={
  view:'V',hlrClass:'hidden-sharp',originalPhysicalSourceEdgeId:id,
  from:p(2*tiny),to:p(3*tiny),
  globalPaperCandidateOrdinals:[0],
  globalDirectSameGeneratedTopoDSOrdinals:[],
  actualNativeScopedToGlobalGeneratedEdgeIsSameProven:false,
  fullOriginalSourceParameterCoverageProven:false,
  globalContinuousOcclusionProven:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 };
 cad.hiddenSharpViews.V=[{
  from:{...hidden.from},to:{...hidden.to},
  projectedOriginalEdgeCandidates:[id]
 }];
 const scoped=cad.nativeSourceScopedSharpOutputByView.V;
 scoped.rows[0].hidden=[hidden];
 scoped.nativeSourceScopedOutputEdgeCount=2;
 scoped.paperOnlyScopedOutputEdgeCount=2;
 rebindFixtureNativeLedger(cad,'V');
 const result=consume({geometry,cad});
 const V=result.views.V.sourceParameterCandidates[0];
 assert.equal(V.paperDerivedPositiveLengthVisibleHiddenConflictDetected,false);
 assert.equal(V.exactBinary64PaperVisibleHiddenClassOverlap.
  hasExactPositiveLengthVisibleHiddenPaperClassConflict,true);
 assert.equal(V.fullOriginalPaperCandidateCoverageWithoutClassConflict,false);
 assert.equal(result.counts.projectedSourcesWithRoundedMissedVisibleHiddenCandidateConflicts,1);
 assert.equal(result.paperDerivedVisibleHiddenSourceConflictsDetected,true);
 assert.equal(result.formalEngineeringLineStyleCertified,false);
 assert.equal(result.signedV5ActionCount,0);
});
