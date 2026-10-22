'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {photoTruthToReviewedDraft:convert}=
 require('../../labs/photo-truth-to-raster-draft.cjs');
const {validateDraft}=require('../../recognition/problem-draft.cjs');
const {prepareReviewedRasterImport}=
 require('../../labs/local-raster-fillet-import.cjs');
const {buildConfirmedInput}=
 require('../../labs/auto-fillet-form.cjs');
const {confirmedFilletTimeline}=
 require('../../workbench/v31-confirmed-fillet-v5.cjs');

const SHA='a'.repeat(64),BAD='b'.repeat(64);
const image={width:120,height:120,byteLength:3072,mediaType:'image/png'};
const line=(id,a,b)=>({id,kind:'line',coordinateSpace:'original-image-px',from:a,to:b});
const circle=(id,x,y,r)=>({id,kind:'circle',coordinateSpace:'original-image-px',
 center:{x,y},radius:r});
const pack=annotations=>({
 schema:'draftai-photo-annotations/1',
 image:{width:image.width,height:image.height,sha256:SHA},
 annotations,notice:'user provided geometry; not mathematical proof'
});
const transform=(labels,changes={})=>convert({
 pack:pack(labels),image,sha256:SHA,...changes
});
test('reviewed same-image manual segments become UNCONFIRMED R0 source candidates',()=>{
 const labels=[
  line('truth_1',{x:40,y:70},{x:60,y:70}),
  line('truth_2',{x:50,y:60},{x:50,y:80})
 ];
 const x=transform(labels);
 assert.equal(x.status,'needs-human-geometry-and-mm-review');
 assert.equal(x.sameOriginalPhotoFingerprintChecked,true);
 assert.equal(x.originalImageHashRetained,false);
 assert.equal(x.modelUnits,null);
 assert.equal(x.solverReady,false);
 assert.equal(x.geometryVerified,false);
 assert.equal(x.globallyUnique,null);
 assert.equal(x.draft.candidates.length,2);
 assert.deepEqual(x.importedIds,['qa_truth_1','qa_truth_2']);
 for(const c of x.draft.candidates){
  assert.equal(c.kind,'segment');
  assert.equal(c.reviewStatus,'unconfirmed');
  assert.equal(c.method,'manual');
  assert.equal(c.confidence,0);
  assert.equal(c.geometry.frame,'drawing-px');
 }
 assert.equal(x.draft.candidates[0].bbox.height,4,
  'horizontal source has a valid positive-height source box');
 assert.equal(x.draft.candidates[1].bbox.width,4,
  'vertical source has a valid positive-width source box');
 assert.equal(validateDraft(x.draft).revision,0);
});
test('local manual geometry can go through EXISTING math→G1→V5 only after human mm and branch review',()=>{
 const labels=[
  line('truth_1',{x:40,y:70},{x:60,y:70}),
  line('truth_2',{x:50,y:60},{x:50,y:80})
 ];
 const prepared=transform(labels),d=prepared.draft;
 const edits=Object.fromEntries(d.candidates.map(c=>[c.id,{
  from:{...c.geometry.from},to:{...c.geometry.to}
 }]));
 assert.throws(()=>prepareReviewedRasterImport({
  draft:d,expectedRevision:d.revision,kind:'two-segments',
  firstId:'qa_truth_1',secondId:'qa_truth_2',edits,
  originX:50,originY:70,mmPerPx:1,yAxis:'down',filletRadiusMm:3,
  accepted:false
 }),/human/);
 const reviewed=prepareReviewedRasterImport({
  draft:d,expectedRevision:d.revision,kind:'two-segments',
  firstId:'qa_truth_1',secondId:'qa_truth_2',edits,
  originX:50,originY:70,mmPerPx:1,yAxis:'down',filletRadiusMm:3,
  accepted:true
 });
 assert.equal(reviewed.geometrySourceReviewed,true);
 assert.equal(reviewed.metricCalibrationMathematicallyProven,false);
 const unselected=buildConfirmedInput(reviewed.kind,reviewed.fields,{
  branchId:'',direction:'',firstTravel:'',secondTravel:''
 },reviewed.reviewedDraftRevision);
 const unfinished=confirmedFilletTimeline(unselected);
 assert.equal(unfinished.mathematicallyVerified,false);
 const selected=buildConfirmedInput(reviewed.kind,reviewed.fields,{
  branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'
 },reviewed.reviewedDraftRevision);
 const proven=confirmedFilletTimeline(selected);
 assert.equal(proven.mathematicallyVerified,true);
 assert.equal(proven.typedMathEvidence.g1Verified,true);
 assert.equal(proven.typedMathEvidence.globallyUnique,null);
});
test('manually drawn complete circles become editable pixel radius, never OCR-confirmed metric dimension',()=>{
 const result=transform([
  circle('truth_1',50,55,10),
  circle('truth_2',85,55,10)
 ]);
 assert.equal(result.draft.candidates.length,2);
 assert.equal(result.draft.candidates[0].kind,'circle');
 assert.equal(result.draft.candidates[0].geometry.radiusPx,10);
 assert.equal(result.draft.candidates[0].bbox.width,20);
 assert.equal(result.draft.candidates[0].reviewStatus,'unconfirmed');
 assert.equal(result.draft.candidates[0].dimension,null);
 assert.equal(result.requiresIndependentMmCalibration,true);
});
test('partial arcs, free OCR boxes and arrow tips remain unsupported, not silently turned into circles or mm',()=>{
 const extra=[
  {id:'truth_2',kind:'arc',coordinateSpace:'original-image-px',
   center:{x:55,y:55},radius:12,coverageDeg:145},
  {id:'truth_3',kind:'dimension',coordinateSpace:'original-image-px',
   bbox:[10,10,30,12],text:'R12'},
  {id:'truth_4',kind:'arrow',coordinateSpace:'original-image-px',
   tip:{x:92,y:75}}
 ];
 const result=transform([line('truth_1',{x:20,y:30},{x:70,y:30}),...extra]);
 assert.deepEqual(result.unsupportedIds,['truth_2','truth_3','truth_4']);
 assert.equal(result.draft.candidates.length,1);
 assert.equal(JSON.stringify(result.draft).includes('R12'),false);
 assert.throws(()=>transform(extra),/no full line or circle/);
});
test('same-sized but different image digest is forbidden; no file content or extra private metadata',()=>{
 const data=[line('truth_1',{x:20,y:30},{x:70,y:30})];
 assert.throws(()=>transform(data,{sha256:BAD}),/fingerprint/);
 const tampered=pack(data);tampered.filename='my-private-homework.png';
 assert.throws(()=>convert({pack:tampered,image,sha256:SHA}),/schema/);
 assert.throws(()=>transform(data,{image:{...image,byteLength:0}}),/byteLength/);
 assert.throws(()=>transform(data,{image:{...image,width:121}}),/fingerprint/);
});
test('cropped full circle or malformed manual line cannot pass R0 source review',()=>{
 assert.throws(()=>transform([circle('truth_1',5,40,10)]),/cropped/);
 assert.throws(()=>transform([line('truth_1',{x:50,y:40},{x:50,y:40})]));
 assert.throws(()=>transform([line('truth_1',{x:-10,y:40},{x:50,y:40})]));
});
test('output and source stay on client and do not promise math proof',()=>{
 const fs=require('node:fs');
 const source=fs.readFileSync('labs/photo-truth-to-raster-draft.cjs','utf8');
 assert.match(source,/validateAnnotationPack\(pack,\{image:meta,sha256\}\)/);
 assert.match(source,/reviewStatus:'unconfirmed',method:'manual',confidence:0/);
 assert.match(source,/newDraft\(\{image:meta,candidates\}\)/);
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB/);
 assert.doesNotMatch(source,/solveFiniteFillet|globallyUnique:true|mathematicallyVerified:true/);
});
