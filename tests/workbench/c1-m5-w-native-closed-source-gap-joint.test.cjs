'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1WNativeClosedPhysicalGap:audit,
 auditC1NativeClosedPhysicalGap:auditAllViews}=
 require('../../workbench/c1-m5-w-native-closed-source-gap-joint.cjs');
const {auditC1Native3DSourceScopedIntervals:coverage}=
 require('../../workbench/c1-native-source-scoped-3d-parameter-coverage.cjs');
const {auditC1M5NativeGlobal3DSourceJoin:rebindNativeGlobal}=
 require('../../workbench/c1-m5-global-native-3d-source-join.cjs');
function fixture(edge='A|C',gap=[0.9999999999999998,1]){
 const sourceEdgeId='tetra::'+edge,bounds=edge==='A|D'?
  [0,24.289915602982237]:[0,16.401219466856727];
 const generated=[{
  nativeSourceFilterOriginalEdgeId:sourceEdgeId,
  native3DCurveExactlySameAsOriginalAtThreeParameters:true,
  originalGeneratedTopoDSHistoryCertified:false,
  signedV5Action:false,
  nativeOriginalCurveParameterRange:[...bounds]
 }];
 const scoped={originalPhysicalSourceEdgeId:sourceEdgeId,
  visible3D:{nativeSourceFilteredOriginalTopoDSEdge:true,
   native3DGeneratedCurveIntervals:generated},
  hidden3D:{nativeSourceFilteredOriginalTopoDSEdge:true,
   native3DGeneratedCurveIntervals:[]},
  combinedNative3DSourceParameterPartition:coverage({
   originalNativeParameterRange:bounds,
   generatedNativeParameterRanges:[...bounds].length?[bounds]:[]
  })
 };
 const geometry={id:'tetra',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points:{
   A:{x:0,y:0,z:0},C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}
  },edges:[edge.split('|')]}};
 const nativeW=edge==='A|C'?
  {from:{u:0,v:0},to:{u:15.999999999999998,v:1.9999999999999998}}:
  {from:{u:8.881784197001252e-16,v:0},to:{u:6,v:23}};
 const [originalFirst,originalLast]=edge.split('|').map(id=>geometry.data.points[id]);
 const originalEndpointWitnesses=[{view:'W',sourceEdgeId,
  hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:0,
  originalM0PhysicalVertexIds:edge.split('|'),
  original3DBRepExactModelVertexEndpoints:true,
  original3DSourceClassComplete:true,
  generatedPaperExactlyReprojectsBothOriginalVertices:false,
  nativeGenerated3DJunctionIdentityCertified:false,
  globalOpaqueFaceOcclusionCertified:false,signedV5Action:false}];

 const result={
  geometry,view:'W',sourceEdgeId,positiveGap:[...gap],
  cad:{revision:7,views:{W:[nativeW]},hiddenSharpViews:{W:[]},originalBRepSourceEdges:[{
   sourceEdgeId,occtSourceCurveType:'line',
   occtSourceCurveParameterRange:bounds,
   fromOCCT3D:{...originalFirst},toOCCT3D:{...originalLast},
   occtSourceCurveFirstPoint3D:{...originalFirst},
   occtSourceCurveLastPoint3D:{...originalLast},
   originalOCCTBRepVertexXYZMatched:true,
   occtSourceCurve3DEndpointsAndMidpointVerified:true
  }],nativeSourceScopedSharpOutputByView:{W:{rows:[scoped]}}},
  originalStatus:{view:'W',originalPhysicalSourceEdgeId:sourceEdgeId,
   nativeHLROriginalEdgeMapIndex:4,originalSourceClass:'all-visible',
   originalEdgeStatusAllVisible:true,originalEdgeStatusAllHidden:false,
   nativeOriginalVisiblePartCount:1,
   generated2DHLREdgeToOriginalSourceHistoryCertified:false,
   globalContinuousM5OcclusionCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false},
  global3DSource:{
   view:'W',sourceEdgeId,sourceGeometryId:'tetra',revision:7,
   generated2DTopoDSHistoryCertified:false,officialV5Authorized:false,
   differentOriginal3DSourceClaimsHeld:0,unknownGlobalOrdinalClaimsHeld:0,
   claims:[{actualNativeGlobal3DOriginalSourceEdgeId:sourceEdgeId,
    original3DCurveAndScopedNativeParameterIntervalCorroborated:true,
    hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:0,
    originalNativeCurveParameterRange:[...bounds]}]
  },
  m4Depth:{view:'W',sourceEdgeId,sourceGeometryId:'tetra',revision:7,
   completeOriginalM4SourceDepthPartition:true,
   openDepthSourceIntervalCount:1,openDepthCutCount:1,
   closedOriginalVerticesAndOpaqueSceneStillUnproven:true,
   generatedHLRToOriginalTopoDSHistoryCertified:false,signedV5Action:false,
   everyOpenDepthCutClassified:true,openDepthFrontCuts:1,openDepthHiddenCuts:0,
   openDepthHeldCuts:0,positiveSubpixelCutsHeld:0},
  originalClosedRayClear:true,openRayClass:'visible-sharp',
  originalEndpointWitnesses,
  exactPaperGap:{
   originalSourceParameterGap:[...gap],
   originalPositiveM5GapRemainsUnclosedWithoutGeneratedTopoDSHistory:true,
   sourceGapClosedByNativeEndpointEvidence:false,
   engineeringLineStyle:'undetermined',signedV5Action:false,
   positiveRationalGapResidualAfterCollinearPaperCandidates:[[...gap]]
  }
 };
 // Construct same-run native-global 3D witness; do not hand-invent a
 // M5 summary and then treat the summary as independent CAD truth.
 const ledger={
  schema:'draftai-c1-global-native-hlr-3d-original-curve-corroboration/1',
  sourceGeometryId:'tetra',revision:7,view:'W',
  allGenerated3DSharpCurvesBoundToOriginalBRepAnd2DPaper:true,
  globalGenerated2DSharpEdges:1,
  globalGenerated3DSharpEdgesWithUniqueOriginalCurve:1,
  generated2DTo3DTopoDSHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  officialV5Authorized:false,signedV5ActionCount:0,
  rows:[{
   view:'W',hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:0,
   originalPhysicalSourceEdgeId:sourceEdgeId,
   originalNativeCurveParameterRange:[...bounds],
   globalNative3DHLRCurveEqualsOriginalBRepAtThreeParameters:true,
   global3DAnd2DHLRMeasuredPaperPairUnique:true,
   global3DAnd2DHLRMeasuredPaperPairExactBinary64:true,
   global3DAnd2DHLRMeasuredPaperPairBoundedSourceScaleULPOnly:false,
   global3DAndOriginalScoped3DHLRParameterIntervalExact:true,
   globalGenerated2DTo3DTopoDSHistoryCertified:false,
   fullOpaqueSceneContinuousOcclusionCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  }]
 };
 result.cad.nativeSourceScopedSharpOutputByView.W.nativeGlobal3DOriginalSourceEvidence=ledger;
 result.global3DSource=structuredClone(rebindNativeGlobal({
  geometry:result.geometry,cad:result.cad,
  view:'W',sourceEdgeId,
  generatedClaims:[{hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:0}]
 }));
 return result;
}
test('genuine native original all-visible EdgeStatus, full 3D curve, closed convex rays and M4 open depth jointly prove original physical W source, NOT its paper gap',()=>{
 for(const [id,gap] of [['A|C',[0.9999999999999998,1]],['A|D',[0,9.431983218054427e-18]]]){
  const r=audit(fixture(id,gap));
  assert.equal(r.status,'physical-original-3d-source-closed-ray-complete-paper-held');
  assert.equal(r.jointOriginalClosedPhysicalSourceVisibilityProven,true);
  assert.equal(r.globalGeneratedNative3DToOriginalBRepIntervalComplete,true);
  assert.equal(r.sameRunOriginal3DAnd2DJointIndependentlyRechecked,true);
  assert.equal(r.sameRunOriginal3DNativeParameterAndActual2DPaperJoint
   .generated2DTopoDSHistoryCertified,false);
  assert.equal(r.heldM5ClaimsCoverEverySameOriginalGlobalGenerated3DEdge,true);
  assert.equal(r.sameRunWholeSolidNative3DOriginalOwnerRowCount,1);
  assert.equal(r.coProjectedOriginalSourceOpenFrontmostProven,true);
  assert.equal(r.generatedPaperGapStrictlyPositiveStillHeld,true);
  assert.equal(r.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence
   .nativeGlobalWEdgesWithReceivedBinary64EndpointDrift,1);
  const paper=r.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence;
  assert.equal(paper.nativeGlobalWEdgesWithExactTwoPhysicalPaperEndpoints,0);
  assert.equal(paper.nativeGlobalWEdgesExactlyCollinearWithOriginalSource,
   id==='A|C'?1:0);
  assert.equal(paper.nativeGlobalWEdgesWithTransverseBinary64PaperDrift,
   id==='A|D'?1:0);
  assert.equal(paper.receivedExactBinary64PaperCandidateCoverage
   .exactBinary64PaperCandidateCoverageComplete,id==='A|D');
  assert.deepEqual(paper.receivedExactBinary64PaperCandidateCoverage
   .exactBinary64PaperPositiveLengthUncoveredIntervals,id==='A|C'?
    [['9007199254740991/9007199254740992','1']]:[]);
  assert.equal(paper.receivedExactBinary64PaperCandidateCoverage
   .generatedToOriginalTopoDSHistoryCertified,false);
  const strict=paper.receivedExactTwoAxisQualifiedPaperCoverage;
  assert.equal(strict.schema,
   'draftai-c1-generated-hlr-exact-two-axis-paper-source-coverage/1');
  assert.equal(strict.strictReceivedTwoAxisPaperCoverageComplete,false);
  assert.equal(strict.exactlyCollinearGeneratedSegments,id==='A|C'?1:0);
  assert.equal(strict.transverseDisplacedGeneratedSegments,id==='A|D'?1:0);
  assert.equal(strict.falseDominantAxisFullCoverageVetoed,id==='A|D');
  assert.deepEqual(strict.exactTwoAxisQualifiedPaperCoverage
   .exactBinary64PaperPositiveLengthUncoveredIntervals,id==='A|C'?
    [['9007199254740991/9007199254740992','1']]:[['0','1']]);
  assert.equal(strict.generated2DTopoDSHistoryCertified,false);
  assert.equal(strict.globalOpaqueSceneContinuousOcclusionCertified,false);
  assert.equal(r.actualGlobal2DPaperClosedEndpointsCertified,false);
  assert.equal(r.globalOpaqueSceneContinuousVisibilityCertified,false);
  assert.equal(r.engineeringLineStyle,'undetermined');
  assert.equal(r.signedV5Action,false);
  assert.deepEqual(r.originalPositivePaperGap,gap);
  assert.ok(Object.isFrozen(r));
 }
});
test('wrong W source 3D owner or native partial curve cannot become a positive physical visibility certificate',()=>{
 const alias=fixture();
 alias.global3DSource.claims[0].actualNativeGlobal3DOriginalSourceEdgeId='tetra::B|C';
 // Once actual global W endpoints are independently cross-checked, a
 // forged original owner with no matching genuine endpoint witness must
 // FAIL CLOSED rather than quietly become a held physical source.
 assert.throws(()=>audit(alias),
  /native global generated 3D HLR source provenance|W original source and generated HLR endpoint ledgers/);
 const partial=fixture();
 const scoped=partial.cad.nativeSourceScopedSharpOutputByView.W.rows[0];
 scoped.visible3D.native3DGeneratedCurveIntervals[0].nativeOriginalCurveParameterRange=[0,16];
 const ledger=partial.cad.nativeSourceScopedSharpOutputByView.W
  .nativeGlobal3DOriginalSourceEvidence;
 ledger.rows[0].originalNativeCurveParameterRange=[0,16];
 partial.global3DSource=structuredClone(rebindNativeGlobal({
  geometry:partial.geometry,cad:partial.cad,view:'W',
  sourceEdgeId:partial.sourceEdgeId,
  generatedClaims:[{hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:0}]
 }));
 scoped.combinedNative3DSourceParameterPartition=coverage({
  originalNativeParameterRange:[0,16.401219466856727],
  generatedNativeParameterRanges:[[0,16]]
 });
 const b=audit(partial);
 assert.equal(b.status,'held-physical-source-proof-incomplete');
 assert.equal(b.scopedNativeOriginal3DVisibilityParameterComplete,false);
 assert.equal(b.generatedPaperGapStrictlyPositiveStillHeld,true);
});
test('closed endpoints, original EdgeStatus and M4 co-projected front order are independently necessary',()=>{
 for(const mutate of [
  x=>x.originalClosedRayClear=false,
  x=>x.openRayClass='hidden-sharp',
  x=>x.originalStatus.originalSourceClass='all-hidden',
  x=>x.originalStatus.originalEdgeStatusAllVisible=false,
  x=>{x.m4Depth.openDepthFrontCuts=0;x.m4Depth.openDepthHiddenCuts=1;},
  x=>{x.m4Depth.openDepthFrontCuts=0;x.m4Depth.openDepthHeldCuts=1;
   x.m4Depth.everyOpenDepthCutClassified=false;}
 ]){
  const x=fixture();mutate(x);
  assert.equal(audit(x).jointOriginalClosedPhysicalSourceVisibilityProven,false);
 }
});
test('reject forged source bounds, false status ancestry, stale revision and eliminated positive W gap',()=>{
 for(const mutate of [
  x=>x.cad.originalBRepSourceEdges[0].occtSourceCurveParameterRange=[0,17],
  x=>x.cad.nativeSourceScopedSharpOutputByView.W.rows.push(
   structuredClone(x.cad.nativeSourceScopedSharpOutputByView.W.rows[0])),
  x=>x.originalStatus.nativeHLROriginalEdgeMapIndex=0,
  x=>x.originalStatus.generated2DHLREdgeToOriginalSourceHistoryCertified=true,
  x=>x.global3DSource.revision=8,
  x=>x.global3DSource.generated2DTopoDSHistoryCertified=true,
  x=>x.exactPaperGap.sourceGapClosedByNativeEndpointEvidence=true,
  x=>x.exactPaperGap.originalSourceParameterGap=[0.8,1],
  x=>x.positiveGap=[1,1]
 ]){
  const x=fixture();mutate(x);
  assert.throws(()=>audit(x),/W|positive|native|source|history|interval|gap|revision/i);
 }
});
test('rejects altered received native W paper geometry and forged physical endpoint parity',()=>{
 for(const mutate of [
  x=>x.originalEndpointWitnesses[0].generatedPaperExactlyReprojectsBothOriginalVertices=true,
  x=>x.originalEndpointWitnesses[0].originalM0PhysicalVertexIds=['B','C'],
  x=>x.originalEndpointWitnesses[0].nativeGenerated3DJunctionIdentityCertified=true,
  x=>x.cad.views.W[0].from.u=Infinity,
  x=>x.cad.views.W[0].to.v+=1e-12,
  x=>x.global3DSource.claims[0].wholeSolidGeneratedHLREdgeOrdinal=1,
  x=>x.originalEndpointWitnesses.push({...x.originalEndpointWitnesses[0]})
 ]){
  const x=fixture();mutate(x);
  // Altering actual received HLR paper AFTER the native original-3D
  // replay certificate was generated makes that certificate stale.
  // A genuine one-ULP drift is represented by a fresh same-run ledger;
  // replaying this old certificate must fail closed, never silently update.
  assert.throws(()=>audit(x),
   /W|paper|witness|ordinal|source|endpoint|provenance/i);
 }
});

test('non-W original gaps are outside this witness, never considered a certified line',()=>{
 const x=fixture();x.view='H';
 assert.equal(audit(x),null);
});

test('whole-solid hidden native 3D HLR claim vetoes an original all-visible W certificate',()=>{
 const x=fixture();
 x.cad.hiddenSharpViews.W.push(structuredClone(x.cad.views.W[0]));
 const scoped=x.cad.nativeSourceScopedSharpOutputByView.W.rows[0];
 const original=structuredClone(scoped.visible3D.native3DGeneratedCurveIntervals[0]);
 scoped.hidden3D.native3DGeneratedCurveIntervals.push(original);
 scoped.combinedNative3DSourceParameterPartition=coverage({
  originalNativeParameterRange:x.cad.originalBRepSourceEdges[0].occtSourceCurveParameterRange,
  generatedNativeParameterRanges:[original.nativeOriginalCurveParameterRange,
   scoped.visible3D.native3DGeneratedCurveIntervals[0].nativeOriginalCurveParameterRange]
 });
 const ledger=x.cad.nativeSourceScopedSharpOutputByView.W.nativeGlobal3DOriginalSourceEvidence;
 ledger.rows.push({...ledger.rows[0],hlrClass:'hidden-sharp'});
 ledger.globalGenerated2DSharpEdges=2;
 ledger.globalGenerated3DSharpEdgesWithUniqueOriginalCurve=2;
 x.global3DSource=rebindNativeGlobal({
  geometry:x.geometry,cad:x.cad,view:'W',sourceEdgeId:x.sourceEdgeId,
  generatedClaims:[
   {hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:0},
   {hlrClass:'hidden-sharp',wholeSolidGeneratedHLREdgeOrdinal:0}
  ]
 });
 x.originalEndpointWitnesses.push({
  ...x.originalEndpointWitnesses[0],hlrClass:'hidden-sharp'
 });
 const result=audit(x);
 assert.equal(result.globalGeneratedNative3DClassConsistentWithOriginalAllVisible,false);
 assert.equal(result.globalGeneratedNative3DToOriginalBRepIntervalComplete,false);
 assert.equal(result.jointOriginalClosedPhysicalSourceVisibilityProven,false);
 assert.equal(result.status,'held-physical-source-proof-incomplete');
 assert.equal(result.generatedPaperGapStrictlyPositiveStillHeld,true);
 assert.equal(result.engineeringLineStyle,'undetermined');
 assert.equal(result.signedV5Action,false);
});
test('held W claimant omitting another native hidden owner edge cannot certify whole original source',()=>{
 const x=fixture();
 x.cad.hiddenSharpViews.W.push(structuredClone(x.cad.views.W[0]));
 const scoped=x.cad.nativeSourceScopedSharpOutputByView.W.rows[0];
 const hidden=structuredClone(scoped.visible3D.native3DGeneratedCurveIntervals[0]);
 scoped.hidden3D.native3DGeneratedCurveIntervals.push(hidden);
 scoped.combinedNative3DSourceParameterPartition=coverage({
  originalNativeParameterRange:x.cad.originalBRepSourceEdges[0].occtSourceCurveParameterRange,
  generatedNativeParameterRanges:[
   scoped.visible3D.native3DGeneratedCurveIntervals[0].nativeOriginalCurveParameterRange,
   hidden.nativeOriginalCurveParameterRange]
 });
 const native=x.cad.nativeSourceScopedSharpOutputByView.W.nativeGlobal3DOriginalSourceEvidence;
 native.rows.push({...native.rows[0],hlrClass:'hidden-sharp'});
 native.globalGenerated2DSharpEdges=2;
 native.globalGenerated3DSharpEdgesWithUniqueOriginalCurve=2;
 x.global3DSource=rebindNativeGlobal({
  geometry:x.geometry,cad:x.cad,view:'W',sourceEdgeId:x.sourceEdgeId,
  generatedClaims:[{hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:0}]
 });
 const r=audit(x);
 assert.equal(r.sameRunWholeSolidNative3DOriginalOwnerRowCount,2);
 assert.equal(r.heldM5ClaimsCoverEverySameOriginalGlobalGenerated3DEdge,false);
 assert.equal(r.sameRunOriginal3DAnd2DJointIndependentlyRechecked,true);
 assert.equal(r.sameRunSelectedM5GeneratedEdgesExhaustNative3DAnd2DSource,false);
 assert.equal(r.globalGeneratedNative3DClassConsistentWithOriginalAllVisible,false);
 assert.equal(r.globalGeneratedNative3DToOriginalBRepIntervalComplete,false);
 assert.equal(r.jointOriginalClosedPhysicalSourceVisibilityProven,false);
 assert.equal(r.generatedPaperGapStrictlyPositiveStillHeld,true);
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.signedV5Action,false);
});
test('held W claimant omitting second visible original subinterval cannot certify complete global source',()=>{
 const x=fixture(),scoped=x.cad.nativeSourceScopedSharpOutputByView.W.rows[0];
 const range=x.cad.originalBRepSourceEdges[0].occtSourceCurveParameterRange,mid=range[1]/2;
 const first=structuredClone(scoped.visible3D.native3DGeneratedCurveIntervals[0]);
 const second=structuredClone(first);
 first.nativeOriginalCurveParameterRange=[range[0],mid];
 second.nativeOriginalCurveParameterRange=[mid,range[1]];
 scoped.visible3D.native3DGeneratedCurveIntervals=[first,second];
 scoped.combinedNative3DSourceParameterPartition=coverage({
  originalNativeParameterRange:range,
  generatedNativeParameterRanges:[[range[0],mid],[mid,range[1]]]
 });
 x.cad.views.W.push(structuredClone(x.cad.views.W[0]));
 const native=x.cad.nativeSourceScopedSharpOutputByView.W.nativeGlobal3DOriginalSourceEvidence;
 native.rows[0].originalNativeCurveParameterRange=[range[0],mid];
 native.rows.push({...native.rows[0],wholeSolidGeneratedHLREdgeOrdinal:1,
  originalNativeCurveParameterRange:[mid,range[1]]});
 native.globalGenerated2DSharpEdges=2;
 native.globalGenerated3DSharpEdgesWithUniqueOriginalCurve=2;
 x.global3DSource=rebindNativeGlobal({
  geometry:x.geometry,cad:x.cad,view:'W',sourceEdgeId:x.sourceEdgeId,
  generatedClaims:[{hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:0}]
 });
 const r=audit(x);
 assert.equal(r.scopedNativeOriginal3DVisibilityParameterComplete,true);
 assert.equal(r.sameRunWholeSolidNative3DOriginalOwnerRowCount,2);
 assert.equal(r.heldM5ClaimsCoverEverySameOriginalGlobalGenerated3DEdge,false);
 assert.equal(r.sameRunOriginal3DAnd2DJointIndependentlyRechecked,true);
 assert.equal(r.sameRunSelectedM5GeneratedEdgesExhaustNative3DAnd2DSource,false);
 assert.equal(r.globalGeneratedNative3DToOriginalBRepIntervalComplete,false);
 assert.equal(r.jointOriginalClosedPhysicalSourceVisibilityProven,false);
 assert.equal(r.generated2DTopoDSHistoryCertified,false);
 assert.equal(r.signedV5Action,false);
});
test('partial W generated edge pairs BOTH endpoints to original vertices exactly, not just nearest from',()=>{
 const x=fixture();
 x.cad.views.W[0]={from:{u:7.84,v:0.98},to:{u:0,v:0}};
 // The generated paper edge was changed after its same-run global
 // native 3D/source parameter proof. The old proof cannot be replayed,
 // regardless of how convincing the new 2D coordinates look.
 assert.throws(()=>audit(x),
  /native global generated 3D HLR source provenance does not replay/);
});

function hGapFixture(){
 const record=fixture('A|C',[0,5.02742501717052e-18]);
 record.view='H';
 record.m4Depth.view='H';
 record.originalStatus.view='H';
 record.global3DSource.view='H';
 record.originalEndpointWitnesses[0].view='H';
 // The original A->C in H is (0,0)->(3,16). The received native
 // output has a positive binary64 endpoint drift. Do NOT snap it to M0.
 record.cad.views={H:[{from:{u:0,v:0},to:{u:3,v:15.999999999999998}}]};
 record.cad.hiddenSharpViews={H:[]};
 const scoped=record.cad.nativeSourceScopedSharpOutputByView.W,
  native=scoped.nativeGlobal3DOriginalSourceEvidence;
 native.view='H';
 for(const row of native.rows)row.view='H';
 record.cad.nativeSourceScopedSharpOutputByView={H:scoped};
 record.global3DSource=structuredClone(rebindNativeGlobal({
  geometry:record.geometry,cad:record.cad,view:'H',
  sourceEdgeId:record.sourceEdgeId,
  generatedClaims:[{hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:0}]
 }));
 return record;
}
test('H A|C positive source gap consumes SAME original BRep, native HLR, M4 and closed rays, but keeps real paper residual',()=>{
 const row=hGapFixture(),r=auditAllViews(row);
 assert.equal(r.schema,'draftai-c1-vhw-m5-native-closed-original-gap-joint/1');
 assert.equal(r.view,'H');
 assert.equal(r.sourceEdgeId,'tetra::A|C');
 assert.deepEqual(r.originalPositivePaperGap,[0,5.02742501717052e-18]);
 assert.equal(r.jointOriginalClosedPhysicalSourceVisibilityProven,true);
 assert.equal(r.globalGeneratedNative3DToOriginalBRepIntervalComplete,true);
 assert.equal(r.generatedPaperGapStrictlyPositiveStillHeld,true);
 assert.equal(r.generated2DTopoDSHistoryCertified,false);
 assert.equal(r.globalOpaqueSceneContinuousVisibilityCertified,false);
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.signedV5Action,false);
 assert.equal(r.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence,null);
 const paper=r.nativeGlobalGenerated2DPaperEndpointDriftEvidence;
 assert.equal(paper.view,'H');
 assert.equal(paper.nativeGlobalGeneratedHLREdgesChecked,1);
 assert.equal(paper.nativeGlobalGeneratedEdgesWithReceivedBinary64EndpointDrift,1);
 assert.equal(paper.nativeGlobalGeneratedEdgesWithTransverseBinary64PaperDrift,1);
 assert.equal(paper.receivedExactTwoAxisQualifiedPaperCoverage.strictReceivedTwoAxisPaperCoverageComplete,false);
 assert.equal(paper.receivedExactTwoAxisQualifiedPaperCoverage.positiveLengthTwoAxisPaperResidualsStillPresent,true);
 assert.equal(audit(row),null,'previous W-only entry cannot claim H physics');
});
test('H closed-source proof is never inferred from different view, revised M0 owner or unverified depth',()=>{
 for(const mutate of [
  x=>{x.originalStatus.view='W';},
  x=>{x.originalEndpointWitnesses[0].view='W';},
  x=>{x.global3DSource.revision=8;},
  x=>{x.cad.views.H[0].to.v=Infinity;},
  x=>{x.originalEndpointWitnesses[0].generatedPaperExactlyReprojectsBothOriginalVertices=true;}
 ]){
  const x=hGapFixture();mutate(x);
  assert.throws(()=>auditAllViews(x),/H|W|native|source|revision|endpoint|global/i);
 }
 const x=hGapFixture();x.originalClosedRayClear=false;
 const held=auditAllViews(x);
 assert.equal(held.jointOriginalClosedPhysicalSourceVisibilityProven,false);
 assert.equal(held.generatedPaperGapStrictlyPositiveStillHeld,true);
 assert.equal(held.signedV5Action,false);
});
test('missing global original physical endpoint ledger holds joint proof and never signs',()=>{
 const x=fixture();delete x.originalEndpointWitnesses;
 const r=audit(x);
 assert.equal(r.globalGeneratedNative3DToOriginalBRepIntervalComplete,true);
 assert.equal(r.nativeGlobalGenerated2DPaperEndpointDriftEvidence,null);
 assert.equal(r.jointOriginalClosedPhysicalSourceVisibilityProven,false);
 assert.equal(r.status,'held-physical-source-proof-incomplete');
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.signedV5Action,false);
});
test('foreign or inconsistent M4 summary cannot certify same-source positive gap',()=>{
 for(const mutate of [
  x=>x.m4Depth.view='H',
  x=>x.m4Depth.sourceEdgeId='tetra::A|D',
  x=>x.m4Depth.sourceGeometryId='other',
  x=>x.m4Depth.revision=8,
  x=>x.m4Depth.openDepthCutCount=2,
  x=>x.m4Depth.openDepthSourceIntervalCount=0,
  x=>x.m4Depth.openDepthHeldCuts=-1,
  x=>x.m4Depth.everyOpenDepthCutClassified=false,
  x=>x.m4Depth.generatedHLRToOriginalTopoDSHistoryCertified=true,
  x=>x.m4Depth.signedV5Action=true
 ]){
  const x=fixture();mutate(x);
  assert.throws(()=>audit(x),/M4 source-depth summary/);
 }
 const h=hGapFixture();h.m4Depth.sourceEdgeId='tetra::A|D';
 assert.throws(()=>auditAllViews(h),/M4 source-depth summary/);
});
test('H positive source gap also requires original 3D endpoint witnesses',()=>{
 const x=hGapFixture();x.originalEndpointWitnesses=undefined;
 const r=auditAllViews(x);
 assert.equal(r.globalGeneratedNative3DToOriginalBRepIntervalComplete,true);
 assert.equal(r.jointOriginalClosedPhysicalSourceVisibilityProven,false);
 assert.equal(r.generated2DTopoDSHistoryCertified,false);
 assert.equal(r.globalOpaqueSceneContinuousVisibilityCertified,false);
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.signedV5Action,false);
});
test('V/H/W source-gap consumers reject foreign views and genuine zero-length gaps without epsilon escape',()=>{
 const h=hGapFixture();
 assert.equal(auditAllViews({...h,view:'drawing-2d'}),null);
 assert.throws(()=>auditAllViews({...h,positiveGap:[0,0]}),/positive|gap/i);
 assert.throws(()=>auditAllViews({...h,positiveGap:[1,1]}),/positive|gap/i);
});

test('native original TopoDS BRep source 3D vertices independently match BOTH exact M0 endpoints, including inverse orientation',()=>{
 for(const view of ['W','H']){
  const x=view==='W'?fixture():hGapFixture();
  const source=x.cad.originalBRepSourceEdges[0],a=source.fromOCCT3D,b=source.toOCCT3D;
  source.fromOCCT3D=b;source.toOCCT3D=a;
  const out=auditAllViews(x);
  assert.equal(out.originalNativeBRepM0PhysicalVertexBijectionCertified,true);
  assert.equal(out.originalNativeBRepToM0ExactPhysicalVertexEvidence.
   exactNativeOriginal3DVertexToM0EndpointBijection,true);
  assert.equal(out.originalNativeBRepToM0ExactPhysicalVertexEvidence.
   nativeOriginalCurveEndpointSamplesExactlyEqualM0,true);
  assert.equal(out.jointOriginalClosedPhysicalSourceVisibilityProven,true);
  assert.equal(out.generatedPaperGapStrictlyPositiveStillHeld,true);
  assert.equal(out.generated2DTopoDSHistoryCertified,false);
  assert.equal(out.signedV5Action,false);
 }
});
test('tolerantly source-matched but EXACTLY displaced native original 3D vertices cannot certify M5 original physical junction',()=>{
 for(const drift of [
  x=>{x.cad.originalBRepSourceEdges[0].fromOCCT3D.x+=1e-9;},
  x=>{delete x.cad.originalBRepSourceEdges[0].fromOCCT3D;},
  x=>{x.cad.originalBRepSourceEdges[0].toOCCT3D.x=Infinity;},
  x=>{x.cad.originalBRepSourceEdges[0].toOCCT3D=
   {...x.cad.originalBRepSourceEdges[0].fromOCCT3D};}
 ]){
  const x=fixture();drift(x);
  // Unlike an unsigned class candidate, the global native source
  // rebind now requires exact original TopoDS vertices against M0.
  // Invalid/stale physical BRep input is rejected before any M5 result.
  assert.throws(()=>audit(x),
   /original native BRep physical 3D endpoints contradict current M0/);
 }
});
test('rounded original BRepAdaptor endpoint sample is explicitly distinct from actual TopoDS M0 vertex identity',()=>{
 const x=fixture(),source=x.cad.originalBRepSourceEdges[0];
 source.occtSourceCurveLastPoint3D.z+=1e-12;
 const r=audit(x),proof=r.originalNativeBRepToM0ExactPhysicalVertexEvidence;
 assert.equal(proof.exactNativeOriginal3DVertexToM0EndpointBijection,true);
 assert.equal(proof.nativeOriginalCurveEndpointSamplesExactlyEqualM0,false);
 assert.equal(proof.rounded3DCurveSamplesCannotReplaceActualOriginalTopoDSVertexIdentity,true);
 assert.equal(r.generated2DTopoDSHistoryCertified,false);
 assert.equal(r.signedV5Action,false);
});
test('neutral original paper endpoints are V/H/W scoped; legacy W-only aliases never masquerade as H coordinates',()=>{
 const w=audit(fixture()).nativeGlobalGenerated2DPaperEndpointDriftEvidence;
 assert.deepEqual(w.exactOriginalProjectedSourceFrom,w.exactOriginalProjectedWFrom);
 assert.deepEqual(w.exactOriginalProjectedSourceTo,w.exactOriginalProjectedWTo);
 const h=auditAllViews(hGapFixture()).nativeGlobalGenerated2DPaperEndpointDriftEvidence;
 assert.equal(h.view,'H');
 assert.deepEqual(h.exactOriginalProjectedSourceFrom,{u:0,v:0});
 assert.deepEqual(h.exactOriginalProjectedSourceTo,{u:3,v:16});
 assert.equal(h.exactOriginalProjectedWFrom,null);
 assert.equal(h.exactOriginalProjectedWTo,null);
});

test('current generated HLR native 3D source/ordinal/class/parameter must replay identically from raw same-run CAD',()=>{
 for(const mutate of [
  x=>{x.global3DSource.claims[0].originalNativeCurveParameterRange[1]-=0.001;},
  x=>{x.global3DSource.claims[0].hlrClass='hidden-sharp';},
  x=>{x.global3DSource.claims[0].actualNativeGlobal3DOriginalSourceEdgeId='tetra::A|D';},
  x=>{x.global3DSource.sourceEdgeId='tetra::A|D';},
  x=>{x.global3DSource.claimCount=2;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.W.nativeGlobal3DOriginalSourceEvidence.
   rows[0].originalNativeCurveParameterRange[1]-=0.001;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.W.nativeGlobal3DOriginalSourceEvidence.
   rows[0].originalPhysicalSourceEdgeId='tetra::A|D';},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.W.nativeGlobal3DOriginalSourceEvidence.
   revision=8;},
  x=>{delete x.cad.nativeSourceScopedSharpOutputByView.W.
   nativeGlobal3DOriginalSourceEvidence;}
 ]){
  const x=fixture();mutate(x);
  assert.throws(()=>audit(x),/native|global|revision|source|ordinal|HLR|CAD|interval/i);
 }
});
test('a completed original native global 3D owner replay is still not generated projected TopoDS history',()=>{
 for(const x of [fixture(),hGapFixture()]){
  const r=auditAllViews(x);
  assert.equal(r.sameRunGlobalGenerated3DHLROriginalSourceAndParameterReplayVerified,true);
  assert.equal(r.generated2DTopoDSSourceHistoryCannotBeInferredFromGlobal3DReplay,true);
  assert.equal(r.globalGeneratedNative3DToOriginalBRepIntervalComplete,true);
  assert.equal(r.generated2DTopoDSHistoryCertified,false);
  assert.equal(r.globalOpaqueSceneContinuousVisibilityCertified,false);
  assert.equal(r.actualGlobal2DPaperClosedEndpointsCertified,false);
  assert.equal(r.signedV5Action,false);
 }
});
