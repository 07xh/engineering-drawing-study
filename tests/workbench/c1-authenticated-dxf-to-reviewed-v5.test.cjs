'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {validateGivenPacket,reconstructC1FromDxfGiven,
 compileReviewedC1DxfGivenToSoleV5}=
 require('../../workbench/c1-authenticated-dxf-to-reviewed-v5.cjs');
const SHA='12ff96f3bbcb3fc71ca759dabec0c025b6bae594754f7913d2e1fc3d03509a5c';
const DXF='a'.repeat(64);
const physical=[
 // All three common axes are unique: a source-identical tetra must be
 // independently recoverable for VH, VW and HW first-angle known pairs.
 {x:0,y:0,z:0},{x:2,y:1,z:2},
 {x:4,y:3,z:7},{x:6,y:6,z:5}
];
function packet(pair=['V','H']){
 return {
  schema:'draftai-c1-authenticated-dxf-reviewed-given/1',
  sourceSha256:SHA,convertedDxfSha256:DXF,
  views:Object.fromEntries(pair.map(v=>[v,physical.map(p=>project(p)[v])])),
  givenOriginalHandleEndpoints:Object.fromEntries(pair.map(v=>[
   v,physical.map((_,i)=>({handle:v+(i+1),endpoint:'point'}))
  ])),
  missingView:['V','H','W'].find(v=>!pair.includes(v)),
  assumedScope:'all-extreme-vertices-of-one-closed-convex-opaque-solid',
  humanSelectedFullExtremeVertexSet:true,
  originalSourceCompletenessIndependentlyProved:false,
  sourceImageRecognitionVerified:false,
  referenceWasNotExportedAsSolverInput:true,
  sourceIsNotYetConfirmedForProduction:true,
  textbookBlindSolveAccepted:false
 };
}
function review(revision=3,geometryId='C1DXFReview'){
 return {sourceSha256:SHA,convertedDxfSha256:DXF,
  confirmedCurrentRevision:revision,confirmedGeometryId:geometryId,
  originalGivenPointSetsChecked:true,
  allOriginalExtremeVerticesPresentChecked:true,
  closedConvexFaceAndEdgeTopologyReviewed:true,
  referenceAnswerWasNotUsedToConfirmTopology:true,
  explicitReviewedInputKind:'human-reviewed-original-candidate'
 };
}
for(const pair of [['V','H'],['V','W'],['H','W']]){
 test('authentic-source-like DXF point clouds reconstruct verified tetra in 3D, then ONE source-scoped C1 V5 '+pair.join(''),async()=>{
  const source=packet(pair),revision=3,geometryId='C1DXFReview';
  assert.equal(validateGivenPacket(source),true);
  const candidate=await reconstructC1FromDxfGiven({
   givenPacket:source,geometryId,revision});
  assert.equal(candidate.inferred.inferredOriginal3DPointCount,4);
  assert.equal(candidate.inferred.independentlyValidatedByCurrentM0,true);
  assert.equal(candidate.humanReviewed,false);
  assert.equal(candidate.realTextbookBlindTestPassed,false);
  const result=await compileReviewedC1DxfGivenToSoleV5({
   givenPacket:source,geometryId,revision,
   confirmedReview:review(),sheetTransform:{origin:{x:330,y:200},scale:4}
  });
  assert.equal(result.schema,'draftai-c1-DXF-reviewed-to-original-sole-v5/1');
  assert.equal(result.solution.sceneResult.missingView,source.missingView);
  assert.equal(result.solution.singleOriginalV5Player,true);
  assert.equal(result.solution.m0M3M5PhysicalSourceAcceptance.status,
   'bounded-original-source-math-acceptance');
  assert.equal(result.solution.player.canRender(revision),true);
  assert.equal(result.referenceAnswerWasNeverAConsumerInput,true);
  assert.equal(result.wholeOriginalTextbookAnswerBlindVerified,false);
  assert.equal(result.originalTextbookC1DeliveryComplete,false);
  assert.equal(result.sourceDrawingCompletenessIndependentlyAuthenticated,false);
 });
}
test('isolated DXF packet cannot be treated as user review by setting a boolean alone',async()=>{
 const data=packet();
 await assert.rejects(()=>compileReviewedC1DxfGivenToSoleV5({
  givenPacket:data,revision:3,geometryId:'C1DXFReview',
  confirmedReview:{allOriginalExtremeVerticesPresentChecked:true},
  sheetTransform:{origin:{x:330,y:200},scale:4}
 }),/human confirmed/);
 await assert.rejects(()=>compileReviewedC1DxfGivenToSoleV5({
  givenPacket:data,revision:4,geometryId:'C1DXFReview',
  confirmedReview:review(3),
  sheetTransform:{origin:{x:330,y:200},scale:4}
 }),/human confirmed/);
});
test('no private reference or arbitrary engineering-style fields may enter original M3 given packet',async()=>{
 const leaked=packet();
 leaked.referenceStrokes=[{from:{u:0,v:0},to:{u:1,v:0}}];
 assert.throws(()=>validateGivenPacket(leaked),/answer-bearing/);
 const replaced=packet();replaced.textbookBlindSolveAccepted=true;
 assert.throws(()=>validateGivenPacket(replaced),/unsigned/);
});
test('tampered first-angle point or duplicate original endpoint cannot fabricate a candidate mesh',async()=>{
 const bad=packet();bad.views.V[1]={u:50,v:10};
 await assert.rejects(()=>reconstructC1FromDxfGiven({
  givenPacket:bad,geometryId:'C1DXFReview',revision:3
 }),/correspondence|detected|unique|ambiguous/);
 const dupe=packet();
 dupe.givenOriginalHandleEndpoints.V[1]=dupe.givenOriginalHandleEndpoints.V[0];
 assert.throws(()=>validateGivenPacket(dupe),/duplicate original CAD/);
});
test('without completed DXF source extraction, no false original textbook theorem can be signed',async()=>{
 const bad=packet();
 bad.sourceSha256='not-sha256';
 await assert.rejects(()=>reconstructC1FromDxfGiven({givenPacket:bad}),
  /unsigned current original DXF/);
 assert.equal(review().referenceAnswerWasNotUsedToConfirmTopology,true);
});
