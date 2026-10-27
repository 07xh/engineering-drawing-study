'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {compileReviewedC1DxfGivenToSoleV5}=
 require('../../workbench/c1-authenticated-dxf-to-reviewed-v5.cjs');
const {compareIsolatedC1DxfReferenceAfterSolve}=
 require('../../workbench/c1-isolated-dxf-reference-after-solve.cjs');
const SHA='12ff96f3bbcb3fc71ca759dabec0c025b6bae594754f7913d2e1fc3d03509a5c';
const DXF='a'.repeat(64);
const points=[{x:0,y:0,z:0},{x:2,y:1,z:2},
 {x:4,y:3,z:7},{x:6,y:6,z:5}];
function given(){
 const views={V:points.map(p=>project(p).V),H:points.map(p=>project(p).H)};
 return {schema:'draftai-c1-authenticated-dxf-reviewed-given/1',
  sourceSha256:SHA,convertedDxfSha256:DXF,
  views,missingView:'W',
  givenOriginalHandleEndpoints:Object.fromEntries(
   ['V','H'].map(v=>[v,points.map((_,i)=>({
    handle:v+(i+1),endpoint:'point'}))])),
  assumedScope:'all-extreme-vertices-of-one-closed-convex-opaque-solid',
  humanSelectedFullExtremeVertexSet:true,
  originalSourceCompletenessIndependentlyProved:false,
  sourceImageRecognitionVerified:false,
  referenceWasNotExportedAsSolverInput:true,
  sourceIsNotYetConfirmedForProduction:true,
  textbookBlindSolveAccepted:false
 };
}
function review(){return {
 sourceSha256:SHA,convertedDxfSha256:DXF,confirmedCurrentRevision:6,
 confirmedGeometryId:'ReviewedDXFOriginal',
 originalGivenPointSetsChecked:true,allOriginalExtremeVerticesPresentChecked:true,
 closedConvexFaceAndEdgeTopologyReviewed:true,
 referenceAnswerWasNotUsedToConfirmTopology:true,
 explicitReviewedInputKind:'human-reviewed-original-candidate'
};}
function ref(rows){return {
 schema:'draftai-c1-isolated-dxf-answer-strokes/1',
 sourceSha256:SHA,convertedDxfSha256:DXF,view:'W',
 referenceStrokes:rows.map((row,i)=>({
  from:{...row.fromModelMm},to:{...row.toModelMm},
  standardLineStyle:row.standardLineStyle,
  originalReferenceHandle:'ANSWER'+(i+1)
 })),
 engineeringStylesExplicitlyReviewed:true,
 wasUsedAsM3Input:false,actualIndependentModelSolverRun:false,
 textbookBlindSolveAccepted:false
};}
let sourcePromise=null;
async function source(){
 if(!sourcePromise)sourcePromise=compileReviewedC1DxfGivenToSoleV5({
  givenPacket:given(),revision:6,geometryId:'ReviewedDXFOriginal',
  confirmedReview:review(),sheetTransform:{origin:{x:350,y:210},scale:4}
 });
 return sourcePromise;
}
test('real source M3/M0/M5 and sole V5 are immutable before isolated DXF reference is ever admitted',async()=>{
 const original=await source(),solved=original.solution,view='W',
  signed=[...solved.certifiedVisibleContourLineBindings,
   ...solved.certifiedPhysicalLineBindings].filter(x=>x.view===view);
 assert(signed.length>0,'actual reviewed 3D source must sign at least one true W edge');
 const sourceDigest=JSON.stringify(solved.thirdViewDrawing),
  actualActionIds=solved.steps.flatMap(s=>s.actions.map(a=>a.id));
 const outcome=compareIsolatedC1DxfReferenceAfterSolve({
  reviewedSourceResult:original,isolatedReference:ref(signed)
 });
 assert.equal(outcome.originalReferenceHandleCount,signed.length);
 assert.equal(outcome.parity.predictedV5LineCount,signed.length);
 assert.equal(outcome.exactlyStyledBidirectionalReferenceCoverage,true);
 assert.equal(outcome.originalGivenGeometryWasSolvedBeforePrivateReferenceAccess,true);
 assert.equal(outcome.privateAnswerHandlesNeverEnteredM3M5OrV5,true);
 assert.equal(outcome.realTextbookBlindTestPassed,false);
 assert.equal(outcome.completeC1DeliveryAuthorized,false);
 assert.equal(outcome.sourceOriginalDWGByteAuthenticationPerformedInThisFunction,false);
 assert.equal(JSON.stringify(solved.thirdViewDrawing),sourceDigest);
 assert.deepEqual(solved.steps.flatMap(s=>s.actions.map(a=>a.id)),actualActionIds);
 assert.equal(solved.player.canRender(6),true);
});
test('original answer containing extra or missing engineering line is caught AFTER solving',async()=>{
 const original=await source(),solved=original.solution,
  signed=[...solved.certifiedVisibleContourLineBindings,
   ...solved.certifiedPhysicalLineBindings].filter(x=>x.view==='W');
 assert(signed.length>0);
 const incomplete=compareIsolatedC1DxfReferenceAfterSolve({
  reviewedSourceResult:original,isolatedReference:ref(signed.slice(0,-1).length?
   signed.slice(0,-1):[{fromModelMm:{u:50,v:0},
   toModelMm:{u:51,v:0},standardLineStyle:
   'gb-t-4457.4-continuous-wide-visible-outline'}])
 });
 assert.equal(incomplete.exactlyStyledBidirectionalReferenceCoverage,false);
 assert.equal(incomplete.realTextbookBlindTestPassed,false);
 const shifted=ref(signed);
 shifted.referenceStrokes[0].to.v+=.001;
 const wrong=compareIsolatedC1DxfReferenceAfterSolve({
  reviewedSourceResult:original,isolatedReference:shifted
 });
 assert.equal(wrong.exactlyStyledBidirectionalReferenceCoverage,false);
});
test('source and DXF digests, answer view, original CAD styles and provenance cannot be swapped',async()=>{
 const original=await source(),rows=[...original.solution.certifiedVisibleContourLineBindings,
  ...original.solution.certifiedPhysicalLineBindings].filter(x=>x.view==='W');
 const altered=ref(rows);altered.convertedDxfSha256='0'.repeat(64);
 assert.throws(()=>compareIsolatedC1DxfReferenceAfterSolve({
  reviewedSourceResult:original,isolatedReference:altered
 }),/source identity/);
 const wrongView=ref(rows);wrongView.view='H';
 assert.throws(()=>compareIsolatedC1DxfReferenceAfterSolve({
  reviewedSourceResult:original,isolatedReference:wrongView
 }),/source identity/);
 const fakeInput=ref(rows);fakeInput.wasUsedAsM3Input=true;
 assert.throws(()=>compareIsolatedC1DxfReferenceAfterSolve({
  reviewedSourceResult:original,isolatedReference:fakeInput
 }),/answer isolation/);
 const dubious=ref(rows);dubious.referenceStrokes[0].standardLineStyle='guessed';
 assert.throws(()=>compareIsolatedC1DxfReferenceAfterSolve({
  reviewedSourceResult:original,isolatedReference:dubious
 }),/isolated actual reference/);
});
