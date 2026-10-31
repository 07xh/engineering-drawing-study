'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1WNativeClosedPhysicalGap:audit,
 auditC1NativeClosedPhysicalGap:auditAllViews}=
 require('../../workbench/c1-m5-w-native-closed-source-gap-joint.cjs');
const {auditC1Native3DSourceScopedIntervals:coverage}=
 require('../../workbench/c1-native-source-scoped-3d-parameter-coverage.cjs');
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
 const originalEndpointWitnesses=[{view:'W',sourceEdgeId,
  hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:0,
  originalM0PhysicalVertexIds:edge.split('|'),
  original3DBRepExactModelVertexEndpoints:true,
  original3DSourceClassComplete:true,
  generatedPaperExactlyReprojectsBothOriginalVertices:false,
  nativeGenerated3DJunctionIdentityCertified:false,
  globalOpaqueFaceOcclusionCertified:false,signedV5Action:false}];

 return {
  geometry,view:'W',sourceEdgeId,positiveGap:[...gap],
  cad:{revision:7,views:{W:[nativeW]},hiddenSharpViews:{W:[]},originalBRepSourceEdges:[{
   sourceEdgeId,occtSourceCurveType:'line',
   occtSourceCurveParameterRange:bounds,
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
}
test('genuine native original all-visible EdgeStatus, full 3D curve, closed convex rays and M4 open depth jointly prove original physical W source, NOT its paper gap',()=>{
 for(const [id,gap] of [['A|C',[0.9999999999999998,1]],['A|D',[0,9.431983218054427e-18]]]){
  const r=audit(fixture(id,gap));
  assert.equal(r.status,'physical-original-3d-source-closed-ray-complete-paper-held');
  assert.equal(r.jointOriginalClosedPhysicalSourceVisibilityProven,true);
  assert.equal(r.globalGeneratedNative3DToOriginalBRepIntervalComplete,true);
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
  /W original source and generated HLR endpoint ledgers lack bijection/);
 const partial=fixture();
 const scoped=partial.cad.nativeSourceScopedSharpOutputByView.W.rows[0];
 scoped.visible3D.native3DGeneratedCurveIntervals[0].nativeOriginalCurveParameterRange=[0,16];
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
  x=>x.m4Depth.openDepthHiddenCuts=1,
  x=>x.m4Depth.openDepthHeldCuts=1
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
  // A different but still finite received endpoint is legitimate drift;
  // it must remain recorded, not silently matched to the M0 vertex.
  if(Number.isFinite(x.cad.views.W[0].to.v)&&
     x.cad.views.W[0].to.v!==1.9999999999999998){
   const r=audit(x);
   assert.equal(r.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence
    .nativeGlobalWEdgesWithReceivedBinary64EndpointDrift,1);
   assert.equal(r.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence
    .nativeGlobalWEdgesWithTransverseBinary64PaperDrift,1);
   assert.equal(r.generatedPaperGapStrictlyPositiveStillHeld,true);
   continue;
  }
  assert.throws(()=>audit(x),/W|paper|witness|ordinal|source|endpoint/i);
 }
});

test('non-W original gaps are outside this witness, never considered a certified line',()=>{
 const x=fixture();x.view='H';
 assert.equal(audit(x),null);
});

test('whole-solid hidden native 3D HLR claim vetoes an original all-visible W certificate',()=>{
 const x=fixture();
 x.cad.hiddenSharpViews.W.push(structuredClone(x.cad.views.W[0]));
 x.global3DSource.claims.push({
  ...x.global3DSource.claims[0],hlrClass:'hidden-sharp'
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
test('partial W generated edge pairs BOTH endpoints to original vertices exactly, not just nearest from',()=>{
 const x=fixture();
 x.cad.views.W[0]={from:{u:7.84,v:0.98},to:{u:0,v:0}};
 const result=audit(x);
 const row=result.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence.rows[0];
 assert.equal(BigInt(row.fromDisplacementFromPhysicalSource.u.numerator)<0n,true);
 assert.equal(BigInt(row.toDisplacementFromPhysicalSource.u.numerator),0n);
 assert.equal(result.generatedPaperGapStrictlyPositiveStillHeld,true);
 assert.equal(result.signedV5Action,false);
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
 record.cad.nativeSourceScopedSharpOutputByView={
  H:record.cad.nativeSourceScopedSharpOutputByView.W
 };
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
test('V/H/W source-gap consumers reject foreign views and genuine zero-length gaps without epsilon escape',()=>{
 const h=hGapFixture();
 assert.equal(auditAllViews({...h,view:'drawing-2d'}),null);
 assert.throws(()=>auditAllViews({...h,positiveGap:[0,0]}),/positive|gap/i);
 assert.throws(()=>auditAllViews({...h,positiveGap:[1,1]}),/positive|gap/i);
});
