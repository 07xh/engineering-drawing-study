'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1WNativeClosedPhysicalGap:audit}=
 require('../../workbench/c1-m5-w-native-closed-source-gap-joint.cjs');
const {auditC1Native3DSourceScopedIntervals:coverage}=
 require('../../workbench/c1-native-source-scoped-3d-parameter-coverage.cjs');
function fixture(edge='A|C',gap=[0.9999999999999998,1]){
 const sourceEdgeId='tetra::'+edge,bounds=[0,16.401219466856727];
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
   A:{x:0,y:0,z:0},C:{x:0,y:16,z:2},D:{x:0,y:0,z:24}
  },edges:[edge.split('|')]}};
 const nativeW=edge==='A|C'?
  {from:{u:0,v:0},to:{u:15.999999999999998,v:1.9999999999999998}}:
  {from:{u:8.881784197001252e-16,v:0},to:{u:0,v:24}};
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
  m4Depth:{completeOriginalM4SourceDepthPartition:true,
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
  assert.equal(r.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence
   .nativeGlobalWEdgesWithExactTwoPhysicalPaperEndpoints,0);
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
 const r=audit(alias);
 assert.equal(r.jointOriginalClosedPhysicalSourceVisibilityProven,false);
 assert.equal(r.generated2DTopoDSHistoryCertified,false);
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
   continue;
  }
  assert.throws(()=>audit(x),/W|paper|witness|ordinal|source|endpoint/i);
 }
});

test('non-W original gaps are outside this witness, never considered a certified line',()=>{
 const x=fixture();x.view='H';
 assert.equal(audit(x),null);
});
