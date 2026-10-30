'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1M5UnresolvedGlobalSourceObligations:audit}=
 require('../../workbench/c1-m5-unresolved-global-source-obligations.cjs');
function fixture(){
 const sourceEdgeId='g::A|B',view='V',ordinal=2,hlrClass='hidden-sharp';
 const paper={view,sourceEdgeId,hlrClass,wholeSolidGeneratedHLREdgeOrdinal:ordinal,
  sourceScopedWholeGeneratedBinary64PaperExactlyMatched:true,
  originalNative3DClassExactlyBacksEntireGeneratedLine:true,
  originalNative3DClassWithinFullSourceOneULPEnvelopeOnly:false,
  actualGeneratedToOriginalTopoDSHistoryCertified:false,
  allOpaqueFaceOcclusionCertified:false,signedV5Action:false};
 const endpoint={view,sourceEdgeId,hlrClass,wholeSolidGeneratedHLREdgeOrdinal:ordinal,
  original3DBRepExactModelVertexEndpoints:true,original3DSourceClassComplete:true,
  originalM0PhysicalVertexIds:['A','B'],
  nativeGenerated3DJunctionIdentityCertified:false,
  globalOpaqueFaceOcclusionCertified:false,signedV5Action:false};
 const join={view,originalPhysicalM0SourceEdges:[sourceEdgeId,'g::A|C'],
  original3DPhysicalVertexProvenFromM0NotNativeHistory:true,
  noIndependentGlobalOpaqueVisibilityOrGBLineJoinCertification:true,
  generatedHLRNativeTopoDSIsSamePairProven:false,
  generatedHLRNativeTopoDSDistinctDespitePhysicalM0Join:true,
  signedV5Action:false};
 const row={view,sourceEdgeId,
  wholeSolidGeneratedHLROriginalSourceFilterMatches:[paper],
  wholeSolidGeneratedHLROriginal3DEndpointWitnesses:[endpoint],
  wholeSolidGeneratedOriginal3DPhysicalNativeJunctionPairs:[join],
  originalM0PhysicalEndpointEvidenceCannotReplaceNativeHLRJunctionIdentity:true,
  originalPhysicalJunctionAndGeneratedNativeIsSameCannotReplaceSceneM5:true};
 return {geometry:{id:'g'},cad:{sourceGeometryId:'g',revision:3},
  positiveOriginalGapRays:{
   schema:'draftai-c1-native-gap-positive-original-ray-theorem/1',
   sourceGeometryId:'g',revision:3,officialV5Authorized:false,
   signedV5ActionCount:0,missingOriginalM0SourceViewRows:[row],
   rows:[{...structuredClone(row),originalSourceParameterGap:[0.2,0.3]}]
  }};
}
test('each omitted source and positive gap independently joins the same real generated HLR ordinal and original BRep endpoint',()=>{
 const r=audit(fixture());
 assert.equal(r.counts.unresolvedM5Obligations,2);
 assert.equal(r.counts.obligationsWithGlobalOriginalSourceAnd3DEndpoints,2);
 assert.equal(r.counts.obligationsWithStrictNative3DClass,2);
 assert.equal(r.counts.obligationsWithDistinctNativeGeneratedVertices,2);
 assert.equal(r.records[1].originalM0PositiveParameterGap[0],0.2);
 assert.equal(r.officialV5Authorized,false);
 assert.equal(r.signedV5ActionCount,0);
 assert.ok(Object.isFrozen(r));
});
test('bounded class only remains strictly separate from exact native class interval',()=>{
 const x=fixture();
 for(const row of [...x.positiveOriginalGapRays.missingOriginalM0SourceViewRows,
  ...x.positiveOriginalGapRays.rows]){
  row.wholeSolidGeneratedHLROriginalSourceFilterMatches[0].
   originalNative3DClassExactlyBacksEntireGeneratedLine=false;
  row.wholeSolidGeneratedHLROriginalSourceFilterMatches[0].
   originalNative3DClassWithinFullSourceOneULPEnvelopeOnly=true;
 }
 const r=audit(x);
 assert.equal(r.counts.obligationsWithBoundedOnlyNative3DClass,2);
 assert.equal(r.counts.obligationsWithStrictNative3DClass,0);
 assert.equal(r.signedV5ActionCount,0);
});
test('rejects missing/duplicate generated edge or forged cross-source physical endpoint evidence',()=>{
 const changes=[
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginal3DEndpointWitnesses.pop(),
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginalSourceFilterMatches.push(
   structuredClone(x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginalSourceFilterMatches[0])),
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginal3DEndpointWitnesses[0].sourceEdgeId='g::C|D',
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginalSourceFilterMatches[0].hlrClass='visible-sharp',
  x=>x.positiveOriginalGapRays.rows[0].originalSourceParameterGap=[0.3,0.3],
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedOriginal3DPhysicalNativeJunctionPairs[0].
   originalPhysicalM0SourceEdges=['g::C|D'],
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedOriginal3DPhysicalNativeJunctionPairs[0].
   generatedHLRNativeTopoDSIsSamePairProven=true,
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginalSourceFilterMatches[0].
   originalNative3DClassWithinFullSourceOneULPEnvelopeOnly=true,
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginal3DEndpointWitnesses[0].
   globalOpaqueFaceOcclusionCertified=true
 ];
 for(const change of changes){
  const x=fixture();change(x);
  assert.throws(()=>audit(x),/gap|source|endpoint|bijection|class|junction|native|contradicted/i);
 }
});

test('independent original 3D all-face rays classify native HLR owner without signing a source',()=>{
 const x=fixture(),missing=x.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0],
  positive=x.positiveOriginalGapRays.rows[0];
 missing.expectedHLRClassFromIndependentOriginalRay='hidden-sharp';
 positive.independentOriginal3DExactRayStatus='exact-original-open-strict-interior';
 const r=audit(x);
 assert.equal(r.counts.obligationsWithIndependentExactOriginalRayClass,2);
 assert.equal(r.counts.generatedHLRSourceClassContradictionsHeldForHistory,0);
 assert.equal(r.records[0].independentOriginal3DAllFaceRayClass,'hidden-sharp');
 assert.equal(r.records[1].independentOriginal3DAllFaceRayClass,'hidden-sharp');
 assert.equal(r.signedV5ActionCount,0);
});
test('opposing global HLR class versus independently proven original all-face ray is held, not relabeled',()=>{
 const x=fixture(),row=x.positiveOriginalGapRays.rows[0];
 row.independentOriginal3DExactRayStatus='exact-original-closed-ray-clear';
 const r=audit(x);
 assert.equal(r.counts.generatedHLRSourceClassContradictionsHeldForHistory,1);
 assert.equal(r.records[1].independentOriginal3DAllFaceRayClass,'visible-sharp');
 assert.deepEqual(r.records[1].generatedHLRClassesDisagreeingWithOriginal3DRay,
  [{hlrClass:'hidden-sharp',wholeSolidGeneratedHLREdgeOrdinal:2}]);
 assert.equal(r.records[1].nativeHLRClassContradictionNotAllowedToOverrideOriginalRay,true);
 assert.equal(r.records[1].signedV5Action,false);
});
test('forged independent all-face original ray class is rejected',()=>{
 const x=fixture();x.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0].
  expectedHLRClassFromIndependentOriginalRay='visible-and-hidden';
 assert.throws(()=>audit(x),/original 3D all-face ray classification/);
});


test('same-revision M4 full [0,1] source and exact OPEN depth cuts reach M5 without signing V5',()=>{
 const x=fixture(),row=x.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0],
  view=row.view,sourceEdgeId=row.sourceEdgeId;
 Object.assign(row,{
  nativeOriginal3DM4SourceProjectionPresent:true,
  nativeOriginal3DM4ProjectionWholeSourceCoverage:true,
  completeRealNative3DSourceParameterPartition:true,
  originalM4SourcePartitionComplete:true,
  native3DM4ProjectedCandidateSegments:[{
   view,sourceEdgeId,native3DHLRClass:'hidden-sharp',
   originalM0UnitParameterRange:[0,1]}],
  nativeOriginalM4CoProjectedDepthOrder:[{
   originalM0UnitParameterRange:[0,1],native3DHLRClass:'hidden-sharp',
   canonicalOriginalM4EventCutPartitionCoversNative3DInterval:true,
   originalM4CutEndpointDoesNotAuthorize3DPhysicalJunction:true,
   originalSourceCompetitionOnlyNotWholeOpaqueSceneVisibility:true,
   generated2DHLREdgeTopologyProven:false,
   engineeringLineStyle:'undetermined',signedV5Action:false,
   canonicalOriginalM4EventCutDepthRows:[{
    originalM4SourceCutParameterRange:[0,1],
    originalM4CutFromCurrentReviewedEventGraph:true,
    originalM4EventPaperOnlyIsNot3DPhysicalJunction:true,
    openIntervalSourceOrderCannotCertifyClosedOriginalVertices:true,
    engineeringLineStyle:'undetermined',signedV5Action:false,
    strictlyFrontmostAmongOriginal3DSourcesOnOpenIntervalOnly:true,
    hiddenBehindIndependentlyClearOriginalSourceOnOpenIntervalOnly:false,
    coProjectedOriginal3DDepthOrder:{
     schema:'draftai-c1-original-3d-coproject-depth-order/1',
     view,sourceEdgeId,originalParameterRange:[0,1],
     entireOpenIntervalStrictlyInFrontOfAllOriginalCoProjectedSources:true,
     entireOpenIntervalBehindIndependentlyClearOriginalCoProjectedSource:false,
     wholeIntervalFrontmostCertified:false,visibleSourceCoversEntireLine:false,
     engineeringLineStyleSigned:false,signedV5ActionCount:0
    }
   }]
  }]
 });
 const positive=audit(x);
 assert.equal(positive.counts.originalM4FullSourceOpenDepthPartitions,1);
 assert.equal(positive.counts.originalM4FullSourceOpenDepthAllClassified,1);
 assert.equal(positive.counts.originalM4OpenFrontCuts,1);
 assert.equal(positive.counts.unresolvedM5Obligations,2);
 assert.equal(positive.records[0].sourceOriginalTopoDSGeneratedHistoryCertified,false);
 assert.equal(positive.officialV5Authorized,false);
 const gap=structuredClone(x);
 gap.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0].
  nativeOriginalM4CoProjectedDepthOrder[0].
  canonicalOriginalM4EventCutDepthRows[0].
  originalM4SourceCutParameterRange=[Number.MIN_VALUE,1];
 assert.throws(()=>audit(gap),/M4 canonical event cut/);
 const swapped=structuredClone(x);
 swapped.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0].
  native3DM4ProjectedCandidateSegments[0].sourceEdgeId='g::C|D';
 assert.throws(()=>audit(swapped),/native M4 source\/depth/);
 const missing=structuredClone(x);
 missing.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0].
  nativeOriginalM4CoProjectedDepthOrder[0].
  canonicalOriginalM4EventCutDepthRows[0].
  coProjectedOriginal3DDepthOrder.entireOpenIntervalStrictlyInFrontOfAllOriginalCoProjectedSources=false;
 assert.throws(()=>audit(missing),/M4 open-depth class/);
 // Neither an unverified "frontmost" flag nor an unverified "covered"
 // flag may override the canonical open-source theorem.
 for(const [flag,property] of [
  ['wholeIntervalFrontmostCertified',
   'entireOpenIntervalStrictlyInFrontOfAllOriginalCoProjectedSources'],
  ['visibleSourceCoversEntireLine',
   'entireOpenIntervalBehindIndependentlyClearOriginalCoProjectedSource']
 ]){
  const forged=structuredClone(x),cut=forged.positiveOriginalGapRays.
   missingOriginalM0SourceViewRows[0].nativeOriginalM4CoProjectedDepthOrder[0].
   canonicalOriginalM4EventCutDepthRows[0];
  cut.coProjectedOriginal3DDepthOrder[flag]=true;
  cut.coProjectedOriginal3DDepthOrder[property]=false;
  cut.strictlyFrontmostAmongOriginal3DSourcesOnOpenIntervalOnly=false;
  assert.throws(()=>audit(forged),/M4 open-depth class/);
 }
});


test('positive M5 paper gap consumes complete original M4 3D open-depth partition but remains unsigned',()=>{
 const x=fixture(),missing=x.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0],
  gap=x.positiveOriginalGapRays.rows[0],view=gap.view,
  sourceEdgeId=gap.sourceEdgeId;
 Object.assign(gap,{
  nativeOriginal3DM4GapSourceProjectionAvailable:true,
  completeRealNative3DSourceParameterPartition:true,
  originalM4SourcePartitionComplete:true,
  realNative3DM4OriginalParameterGapCoverage:{
   originalParameterRange:[0.2,0.3],
   entireOriginalParameterIntervalCovered:true},
  nativeOriginal3DM4ProjectedCandidateSegments:[{
   view,sourceEdgeId,native3DHLRClass:'hidden-sharp',
   originalM0UnitParameterRange:[0,1]}],
  nativeOriginalM4CoProjectedDepthOrder:[{
   originalM0UnitParameterRange:[0,1],native3DHLRClass:'hidden-sharp',
   canonicalOriginalM4EventCutPartitionCoversNative3DInterval:true,
   originalM4CutEndpointDoesNotAuthorize3DPhysicalJunction:true,
   originalSourceCompetitionOnlyNotWholeOpaqueSceneVisibility:true,
   generated2DHLREdgeTopologyProven:false,
   engineeringLineStyle:'undetermined',signedV5Action:false,
   canonicalOriginalM4EventCutDepthRows:[{
    originalM4SourceCutParameterRange:[0,1],
    originalM4CutFromCurrentReviewedEventGraph:true,
    originalM4EventPaperOnlyIsNot3DPhysicalJunction:true,
    openIntervalSourceOrderCannotCertifyClosedOriginalVertices:true,
    engineeringLineStyle:'undetermined',signedV5Action:false,
    strictlyFrontmostAmongOriginal3DSourcesOnOpenIntervalOnly:false,
    hiddenBehindIndependentlyClearOriginalSourceOnOpenIntervalOnly:true,
    coProjectedOriginal3DDepthOrder:{
     schema:'draftai-c1-original-3d-coproject-depth-order/1',
     view,sourceEdgeId,originalParameterRange:[0,1],
     entireOpenIntervalStrictlyInFrontOfAllOriginalCoProjectedSources:false,
     entireOpenIntervalBehindIndependentlyClearOriginalCoProjectedSource:true,
     wholeIntervalFrontmostCertified:false,visibleSourceCoversEntireLine:false,
     engineeringLineStyleSigned:false,signedV5ActionCount:0
    }
   }]
  }]
 });
 const r=audit(x);
 assert.equal(r.counts.positivePaperGapsWithFullOriginalM4OpenDepthPartition,1);
 assert.equal(r.counts.originalM4OpenHiddenCuts,1);
 assert.equal(r.counts.unresolvedM5Obligations,2);
 assert.equal(r.records[1].originalM4OpenSourceDepthEvidence.
  generatedHLRToOriginalTopoDSHistoryCertified,false);
 assert.equal(r.records[1].generatedEdgeEngineeringLineStyle,'undetermined');
 const forged=structuredClone(x);
 forged.positiveOriginalGapRays.rows[0].
  realNative3DM4OriginalParameterGapCoverage.originalParameterRange=[0.2,0.4];
 assert.throws(()=>audit(forged),/does not belong to the positive M5 gap/);
 for(const mutate of [
  row=>{delete row.realNative3DM4OriginalParameterGapCoverage;},
  row=>{delete row.realNative3DM4OriginalParameterGapCoverage.originalParameterRange;},
  row=>{row.realNative3DM4OriginalParameterGapCoverage.originalParameterRange=[];}
 ]){
  const bad=structuredClone(x);
  mutate(bad.positiveOriginalGapRays.rows[0]);
  assert.throws(()=>audit(bad),/does not belong to the positive M5 gap/);
 }
});

test('positive dyadic binary64-collapsed original M4 event cut is held, not a fake drawable line',()=>{
 const x=fixture(),row=x.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0];
 const view=row.view,sourceEdgeId=row.sourceEdgeId;
 const basicCut=(range,collapsed)=>({
  originalM4SourceCutParameterRange:range,
  originalM4CutFromCurrentReviewedEventGraph:true,
  originalM4EventPaperOnlyIsNot3DPhysicalJunction:true,
  openIntervalSourceOrderCannotCertifyClosedOriginalVertices:true,
  strictlyFrontmostAmongOriginal3DSourcesOnOpenIntervalOnly:!collapsed,
  hiddenBehindIndependentlyClearOriginalSourceOnOpenIntervalOnly:false,
  engineeringLineStyle:'undetermined',signedV5Action:false,
  coProjectedOriginal3DDepthOrder:collapsed?{
   status:'positive-original-dyadic-projection-binary64-collapsed-held',
   view,sourceEdgeId,originalParameterRange:range,
   originalDyadicProjectedIntervalPositive:true,
   renderedPaperSegmentNotCertified:true,
   wholeIntervalFrontmostCertified:false,
   visibleSourceCoversEntireLine:false,
   engineeringLineStyleSigned:false,signedV5ActionCount:0
  }:{
   schema:'draftai-c1-original-3d-coproject-depth-order/1',
   view,sourceEdgeId,originalParameterRange:range,
   entireOpenIntervalStrictlyInFrontOfAllOriginalCoProjectedSources:true,
   entireOpenIntervalBehindIndependentlyClearOriginalCoProjectedSource:false,
   wholeIntervalFrontmostCertified:true,
   visibleSourceCoversEntireLine:false,
   engineeringLineStyleSigned:false,signedV5ActionCount:0
  }
 });
 Object.assign(row,{
  nativeOriginal3DM4SourceProjectionPresent:true,
  nativeOriginal3DM4ProjectionWholeSourceCoverage:true,
  completeRealNative3DSourceParameterPartition:true,
  originalM4SourcePartitionComplete:true,
  native3DM4ProjectedCandidateSegments:[{
   view,sourceEdgeId,native3DHLRClass:'hidden-sharp',
   originalM0UnitParameterRange:[0,1]
  }],
  nativeOriginalM4CoProjectedDepthOrder:[{
   originalM0UnitParameterRange:[0,1],native3DHLRClass:'hidden-sharp',
   canonicalOriginalM4EventCutPartitionCoversNative3DInterval:true,
   originalM4CutEndpointDoesNotAuthorize3DPhysicalJunction:true,
   originalSourceCompetitionOnlyNotWholeOpaqueSceneVisibility:true,
   generated2DHLREdgeTopologyProven:false,
   engineeringLineStyle:'undetermined',signedV5Action:false,
   canonicalOriginalM4EventCutDepthRows:[
    basicCut([0,0.5],true),basicCut([0.5,1],false)
   ]
  }]
 });
 const out=audit(x),depth=out.records[0].originalM4OpenSourceDepthEvidence;
 assert.equal(depth.completeOriginalM4SourceDepthPartition,true);
 assert.equal(depth.everyOpenDepthCutClassified,false);
 assert.equal(depth.positiveSubpixelCutsHeld,1);
 assert.equal(depth.openDepthHeldCuts,1);
 assert.equal(depth.openDepthFrontCuts,1);
 assert.equal(out.counts.originalM4PositiveSubpixelCutsHeld,1);
 assert.equal(out.officialV5Authorized,false);
 assert.equal(out.signedV5ActionCount,0);
 const forged=structuredClone(x);
 forged.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0].
  nativeOriginalM4CoProjectedDepthOrder[0].canonicalOriginalM4EventCutDepthRows[0].
  strictlyFrontmostAmongOriginal3DSourcesOnOpenIntervalOnly=true;
 assert.throws(()=>audit(forged),/subpixel positive M4 cut cannot become a stroke/);
});

test('HLR paper endpoints and caller-supplied flags cannot fabricate original closed endpoint rays',()=>{
 const x=fixture();
 for(const row of [...x.positiveOriginalGapRays.missingOriginalM0SourceViewRows,
                    ...x.positiveOriginalGapRays.rows]){
  row.originalPhysicalClosedEndpointRaysIndependentlyCertified=true;
  row.wholeSolidGeneratedHLROriginal3DEndpointWitnesses[0].
   generatedPaperExactlyReprojectsBothOriginalVertices=true;
 }
 const result=audit(x);
 assert.equal(result.counts.originalPhysicalClosedEndpointRayRowsIndependentlyCertified,0);
 assert.equal(result.counts.originalPhysicalClosedEndpointRayRowsWithExactGlobalHLRPaperEndpoints,0);
 assert.equal(result.counts.distinctOriginalPhysicalClosedEndpointRaySourceViews,0);
 assert.ok(result.records.every(row=>
  row.originalPhysicalClosedEndpointRaysIndependentlyCertified===false&&
  row.originalPhysicalClosedEndpointRaysWithExactGlobalHLRPaperEndpoints===false&&
  row.generatedHLRVertexTopoDSHistoryAndWholeSceneEndpointOcclusionStillUnproven===true&&
  row.generatedEdgeEngineeringLineStyle==='undetermined'&&
  row.signedV5Action===false));
});

test('same-run exact generated-paper rational partial gap is consumed by M5 only as unsigned evidence',()=>{
 const x=fixture(),row=x.positiveOriginalGapRays.rows[0];
 row.sameRunExactCollinearGeneratedHLRPaperGapCandidate={
  originalSourceParameterGap:[0.2,0.3],
  exactReceivedCollinearPaperCandidateSubrangesWithoutSourceHistory:[
   ['1/4','5404319552844595/18014398509481984']
  ],
  positiveRationalGapResidualAfterCollinearPaperCandidates:[
   ['3602879701896397/18014398509481984','1/4']
  ],
  originalPositiveM5GapRemainsUnclosedWithoutGeneratedTopoDSHistory:true,
  sourceGapClosedByNativeEndpointEvidence:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 };
 const out=audit(x),stats=out.counts;
 assert.equal(stats.unresolvedM5Obligations,2);
 assert.equal(stats.positiveM5GapsWithSameRunExactCollinearGeneratedPaperWitness,1);
 assert.equal(stats.positiveM5GapsWithExactRationalPaperCandidateSubranges,1);
 assert.equal(stats.positiveM5GapsWithExactRationalPaperResidualStillPositive,1);
 assert.equal(stats.positiveM5GapsWithCandidateOnlyPaperCoverageButNoSourceHistory,0);
 assert.deepEqual(out.records[1].sameRunExactCollinearHLRPaperCandidateOnlyGapEvidence.
  positiveRationalGapResidualAfterCollinearPaperCandidates,
  [['3602879701896397/18014398509481984','1/4']]);
 assert.equal(out.records[1].generatedPaperCandidateDoesNotCloseOriginalM5SourceGap,true);
 assert.equal(out.records[1].sourceOriginalTopoDSGeneratedHistoryCertified,false);
 assert.equal(out.signedV5ActionCount,0);
 const fullyPaper=structuredClone(x);
 fullyPaper.positiveOriginalGapRays.rows[0].
  sameRunExactCollinearGeneratedHLRPaperGapCandidate.
  positiveRationalGapResidualAfterCollinearPaperCandidates=[];
 const onlyPaper=audit(fullyPaper);
 assert.equal(onlyPaper.counts.positiveM5GapsWithCandidateOnlyPaperCoverageButNoSourceHistory,1);
 assert.equal(onlyPaper.counts.unresolvedM5Obligations,2);
 assert.equal(onlyPaper.officialV5Authorized,false);
 for(const corrupt of [
  y=>y.positiveOriginalGapRays.rows[0].sameRunExactCollinearGeneratedHLRPaperGapCandidate.
   originalSourceParameterGap=[0.2,0.4],
  y=>y.positiveOriginalGapRays.rows[0].sameRunExactCollinearGeneratedHLRPaperGapCandidate.
   sourceGapClosedByNativeEndpointEvidence=true,
  y=>y.positiveOriginalGapRays.rows[0].sameRunExactCollinearGeneratedHLRPaperGapCandidate.
   signedV5Action=true
 ]){
  const forged=structuredClone(x);corrupt(forged);
  assert.throws(()=>audit(forged),/same-run rational generated HLR paper candidate/);
 }
});

test('same-run original OCCT indexed EdgeStatus reaches unresolved M5 without becoming generated history',()=>{
 const x=fixture(),row=x.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0],
  native={view:'V',originalPhysicalSourceEdgeId:'g::A|B',
   nativeHLROriginalEdgeMapIndex:1,originalSourceClass:'all-hidden',
   nativeOriginalVisiblePartCount:0,originalEdgeStatusAllVisible:false,
   originalEdgeStatusAllHidden:true,
   generated2DHLREdgeToOriginalSourceHistoryCertified:false,
   globalContinuousM5OcclusionCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false};
 x.cad.nativeHLRSourceHistoryAPISurfaceByView={V:{
  originalDataStructureIndex:{edgeMapSourceBijectionVerified:true,
   indexedOriginalSources:[{
    originalPhysicalSourceEdgeId:'g::A|B',hlrDataStructureOneBasedEdgeIndex:1}]},
  originalEdgeStatusAPI:{originalHLROpenSourceClassBoundToOriginalEdgeMap:true,
   nativeOriginalSourceEdgeStatusRows:[native]}
 }};
 for(const held of [row,x.positiveOriginalGapRays.rows[0]]){
  held.independentOriginalNativeHLREdgeStatusSource={...native};
  held.nativeOriginalEdgeStatusDoesNotCloseGenerated2DSourceHistory=true;
 }
 const out=audit(x);
 assert.equal(out.counts.unresolvedM5Obligations,2);
 assert.equal(out.counts.obligationsWithNativeOriginalIndexedHLREdgeStatus,2);
 assert.equal(out.counts.nativeOriginalIndexedHLRAllHiddenObligationsStillHeld,2);
 assert.equal(out.records[0].sameRunNativeOriginalHLREdgeStatus.nativeHLROriginalEdgeMapIndex,1);
 assert.equal(out.records[1].nativeOriginalHLREdgeStatusDoesNotCloseGenerated2DHistory,true);
 assert.equal(out.records[1].sourceOriginalTopoDSGeneratedHistoryCertified,false);
 assert.equal(out.signedV5ActionCount,0);
 const disagree=structuredClone(x);
 disagree.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0].
  expectedHLRClassFromIndependentOriginalRay='visible-sharp';
 const held=audit(disagree);
 assert.equal(held.counts.nativeOriginalHLREdgeStatusContradictsIndependentRayHeld,1);
 assert.equal(held.officialV5Authorized,false);
 for(const corrupt of [
  y=>y.positiveOriginalGapRays.rows[0].
   independentOriginalNativeHLREdgeStatusSource.nativeHLROriginalEdgeMapIndex=2,
  y=>y.positiveOriginalGapRays.rows[0].
   independentOriginalNativeHLREdgeStatusSource.originalSourceClass='all-visible',
  y=>y.positiveOriginalGapRays.rows[0].
   independentOriginalNativeHLREdgeStatusSource.generated2DHLREdgeToOriginalSourceHistoryCertified=true,
  y=>y.cad.nativeHLRSourceHistoryAPISurfaceByView.V.originalDataStructureIndex.
   indexedOriginalSources[0].hlrDataStructureOneBasedEdgeIndex=2
 ]){
  const bad=structuredClone(x);corrupt(bad);
  assert.throws(()=>audit(bad),/original indexed HLR EdgeStatus cannot replace M5 source history/);
 }
});

test('direct native source-filter causal 2D edges remain unsigned in both absent-source and positive-gap M5 obligations',()=>{
 const x=fixture(),native={
  view:'V',originalPhysicalSourceEdgeId:'g::A|B',
  nativeHLROriginalEdgeMapIndex:1,originalSourceClass:'all-hidden',
  nativeOriginalVisiblePartCount:0,originalEdgeStatusAllVisible:false,
  originalEdgeStatusAllHidden:true,
  generated2DHLREdgeToOriginalSourceHistoryCertified:false,
  globalContinuousM5OcclusionCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 };
 x.cad.nativeHLRSourceHistoryAPISurfaceByView={V:{
  originalDataStructureIndex:{edgeMapSourceBijectionVerified:true,
   indexedOriginalSources:[{originalPhysicalSourceEdgeId:'g::A|B',
    hlrDataStructureOneBasedEdgeIndex:1}]},
  originalEdgeStatusAPI:{originalHLROpenSourceClassBoundToOriginalEdgeMap:true,
   nativeOriginalSourceEdgeStatusRows:[native]}
 }};
 for(const held of [...x.positiveOriginalGapRays.missingOriginalM0SourceViewRows,
                   ...x.positiveOriginalGapRays.rows]){
  held.independentOriginalNativeHLREdgeStatusSource={...native};
  held.nativeOriginalEdgeStatusDoesNotCloseGenerated2DSourceHistory=true;
  Object.assign(held.wholeSolidGeneratedHLROriginalSourceFilterMatches[0],{
   originalHLRSourceFilterToGenerated2DCausalNativeIsSameVerified:true,
   originalHLRIndexedSourceStatusClass:'all-hidden',
   originalHLRIndexedSourceStatusOneBasedIndex:1,
   sourceFilterNativeGeneratedIdentityDoesNotCertifyOriginalParameterHistory:true
  });
 }
 const r=audit(x);
 assert.equal(r.counts.unresolvedM5Obligations,2);
 assert.equal(r.counts.unresolvedObligationsWithDirectNativeSourceFilteredGeneratedCausalEdges,2);
 assert.equal(r.counts.directNativeSourceFilteredGeneratedCausalEdgesStillMissingParameterHistory,2);
 assert.ok(r.records.every(row=>
  row.directNativeSourceFilteredToWholeSolidGeneratedEdgeCausalOrdinals.length===1&&
  row.directCausalGeneratedEdgeCannotReplaceOriginalParameterHistory===true&&
  row.sourceOriginalTopoDSGeneratedHistoryCertified===false));
 assert.equal(r.officialV5Authorized,false);
 assert.equal(r.signedV5ActionCount,0);
 for(const corrupt of [
  y=>{y.positiveOriginalGapRays.rows[0].
   wholeSolidGeneratedHLROriginalSourceFilterMatches[0].
   originalHLRIndexedSourceStatusOneBasedIndex=2;},
  y=>{y.positiveOriginalGapRays.rows[0].
   wholeSolidGeneratedHLROriginalSourceFilterMatches[0].
   originalHLRIndexedSourceStatusClass='all-visible';},
  y=>{y.positiveOriginalGapRays.rows[0].
   wholeSolidGeneratedHLROriginalSourceFilterMatches[0].
   originalNative3DClassExactlyBacksEntireGeneratedLine=false;},
  y=>{y.positiveOriginalGapRays.rows[0].
   wholeSolidGeneratedHLROriginalSourceFilterMatches[0].
   sourceFilterNativeGeneratedIdentityDoesNotCertifyOriginalParameterHistory=false;}
 ]){
  const bad=structuredClone(x);corrupt(bad);
  assert.throws(()=>audit(bad),/native source-filter causal edge cannot authorize original M5 history|one original native source class/);
 }
});
