'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {inferC1UniqueConvexGeometryCandidate}=
 require('../../workbench/c1-unique-two-view-convex-candidate.cjs');
const {reconstructC1FromDxfGiven,validateGivenPacket,
 compileReviewedC1DxfGivenToSoleV5}=
 require('../../workbench/c1-authenticated-dxf-to-reviewed-v5.cjs');
const SHA='12ff96f3bbcb3fc71ca759dabec0c025b6bae594754f7913d2e1fc3d03509a5c';
const DXF='f'.repeat(64);
const cube=[];
for(const x of [-2,3])for(const y of [-3,4])for(const z of [0,5])
 cube.push({x,y,z});
const equal2=(a,b)=>a.u===b.u&&a.v===b.v;
function sourceData(pair=['V','H']){
 const alphabetical=[...pair].sort();
 const views=Object.fromEntries(alphabetical.map(view=>{
  const uniques=[];
  for(const p of cube){const uv=project(p)[view];
   if(!uniques.some(q=>equal2(q,uv)))uniques.push(uv);}
  return [view,uniques];
 }));
 const pairs=cube.map(p=>({
  firstIndex:views[alphabetical[0]].findIndex(q=>
   equal2(q,project(p)[alphabetical[0]])),
  secondIndex:views[alphabetical[1]].findIndex(q=>
   equal2(q,project(p)[alphabetical[1]]))
 }));
 const handles=Object.fromEntries(alphabetical.map(v=>[
  v,views[v].map((_,i)=>({handle:v+(i+1),endpoint:'point'}))
 ]));
 return {views,pairs,packet:{
  schema:'draftai-c1-authenticated-dxf-reviewed-given/1',
  sourceSha256:SHA,convertedDxfSha256:DXF,
  views,givenOriginalHandleEndpoints:handles,
  reviewedCorrespondences:pairs,
  missingView:['V','H','W'].find(v=>!pair.includes(v)),
  assumedScope:'all-extreme-vertices-of-one-closed-convex-opaque-solid',
  humanSelectedFullExtremeVertexSet:true,
  originalSourceCompletenessIndependentlyProved:false,
  sourceImageRecognitionVerified:false,
  referenceWasNotExportedAsSolverInput:true,
  sourceIsNotYetConfirmedForProduction:true,
  textbookBlindSolveAccepted:false
 }};
}
function review(revision,id){return{
 sourceSha256:SHA,convertedDxfSha256:DXF,
 confirmedCurrentRevision:revision,confirmedGeometryId:id,
 originalGivenPointSetsChecked:true,
 allOriginalExtremeVerticesPresentChecked:true,
 closedConvexFaceAndEdgeTopologyReviewed:true,
 referenceAnswerWasNotUsedToConfirmTopology:true,
 explicitReviewedInputKind:'human-reviewed-original-candidate'
};}
for(const pair of [['V','H'],['V','W'],['H','W']]){
 test('real 8-corner solid (only 4 distinct points/view) -> reviewed original pair graph -> M3/QuickHull/M0 -> canonical C1 V5 '+pair.join(''),async()=>{
  const {views,pairs,packet}=sourceData(pair);
  assert.equal(Object.keys(views).length,2);
  for(const points of Object.values(views))assert.equal(points.length,4);
  assert.equal(new Set(pairs.map(x=>x.firstIndex+'|'+x.secondIndex)).size,8);
  assert.equal(validateGivenPacket(packet),true);
  await assert.rejects(()=>inferC1UniqueConvexGeometryCandidate({views}),
   /ambiguous original 3D correspondence/);
  const candidate=await reconstructC1FromDxfGiven({
   givenPacket:packet,revision:8,geometryId:'ReviewedEightCorners'});
  assert.equal(candidate.inferred.inferredOriginal3DPointCount,8);
  assert.equal(candidate.inferred.independentlyValidatedByCurrentM0,true);
  assert.equal(candidate.inferred.candidateGeometry.data.faces.length,6);
  assert.equal(candidate.inferred.candidateGeometry.data.edges.length,12);
  assert.equal(candidate.inferred.reviewedOriginal3DPairCount,8);
  assert.equal(candidate.inferred.source2DVerticesMatchedWithoutManualIds,false);
  assert.equal(candidate.inferred.reviewedSolidInputCandidate.topologyConfirmed,false);
  assert.equal(candidate.realTextbookBlindTestPassed,false);
  const result=await compileReviewedC1DxfGivenToSoleV5({
   givenPacket:packet,revision:8,geometryId:'ReviewedEightCorners',
   confirmedReview:review(8,'ReviewedEightCorners'),
   sheetTransform:{origin:{x:350,y:210},scale:4}
  });
  assert.equal(result.solution.singleOriginalV5Player,true);
  assert.equal(result.solution.sceneResult.missingView,packet.missingView);
  assert.equal(result.solution.m0M3M5PhysicalSourceAcceptance.status,
   'bounded-original-source-math-acceptance');
  assert.equal(result.solution.sceneResult.geometry.data.edges.length,12);
  assert.equal(result.solution.player.canRender(8),true);
  assert.equal(result.originalTextbookC1DeliveryComplete,false);
 });
}
test('ambiguous box never gets automatic correspondences; explicit original mappings required',async()=>{
 const {packet,views}=sourceData();
 const unsigned=structuredClone(packet);delete unsigned.reviewedCorrespondences;
 assert.equal(validateGivenPacket(unsigned),true);
 await assert.rejects(()=>reconstructC1FromDxfGiven({givenPacket:unsigned}),
  /ambiguous original 3D correspondence/);
 const spoofed=structuredClone(packet);spoofed.reviewedCorrespondences[0].secondIndex=50;
 assert.throws(()=>validateGivenPacket(spoofed),/point indices/);
});
test('M0/M3 rejects false manual correspondence shared-axis, duplicate original 3D point, missing view point and answer leak',async()=>{
 const src=sourceData().packet;
 const bad=structuredClone(src);
 const first=Object.keys(bad.views).sort()[0],second=Object.keys(bad.views).sort()[1];
 const candidateIndex=bad.reviewedCorrespondences[0];
 const wrongIdx=bad.views[second].findIndex((p,j)=>j!==candidateIndex.secondIndex&&
  p.u!==bad.views[first][candidateIndex.firstIndex].u);
 assert(wrongIdx>=0);
 bad.reviewedCorrespondences[0].secondIndex=wrongIdx;
 await assert.rejects(()=>reconstructC1FromDxfGiven({givenPacket:bad}),
  /shared first-angle axis/);
 const duplicate=structuredClone(src);
 duplicate.reviewedCorrespondences[1]={...duplicate.reviewedCorrespondences[0]};
 assert.throws(()=>validateGivenPacket(duplicate),/duplicate reviewed source/);
 const omitted=structuredClone(src);
 omitted.reviewedCorrespondences=omitted.reviewedCorrespondences.filter(x=>
  x.firstIndex!==3);
 assert.throws(()=>validateGivenPacket(omitted),/all actual original 2D/);
 const leaked=structuredClone(src);leaked.referenceStrokes=[{status:'answer'}];
 assert.throws(()=>validateGivenPacket(leaked),/answer-bearing/);
});
test('confirmed review cannot bypass current source hashes, revision, or original convex topology confirmation',async()=>{
 const {packet}=sourceData();
 const r=review(8,'ReviewedEightCorners');r.convertedDxfSha256='0'.repeat(64);
 await assert.rejects(()=>compileReviewedC1DxfGivenToSoleV5({
  givenPacket:packet,revision:8,geometryId:'ReviewedEightCorners',
  confirmedReview:r,sheetTransform:{origin:{x:350,y:210},scale:4}
 }),/human confirmed/);
});
