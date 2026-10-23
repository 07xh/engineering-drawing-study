'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseTextCandidates}=require('../../recognition/dimension-notation-candidates.cjs');
const {stageReviewedImageDimension,validateOcrDimension}=
 require('../../recognition/reviewed-image-dimension-field.cjs');
const {createFieldReview}=require('../../recognition/image-field-review.cjs');
const {defaultValues,defaultChoices}=require('../../labs/auto-fillet-form.cjs');
const {createConfirmedFilletSession}=require('../../workbench/v31-fillet-session.cjs');
const image={width:800,height:600};
const proposal=(text='Φ10',id='ocr_a')=>parseTextCandidates(
 [{id,text,confidence:.71,bbox:[100,120,55,25]}],image)[0];
const state=kind=>{
 const out=createFieldReview();out.setKind(kind);out.setImage(image.width,image.height);
 return out;
};
test('OCR Φ10 becomes candidate evidence, not a mathematical radius until separate human review',()=>{
 const s=state('two-circles'),c=proposal();
 assert.equal(c.confirmed,false);assert.equal(c.mathematicalProof,false);
 const evidence=stageReviewedImageDimension({fieldReview:s,candidate:c,
  field:'r1',reviewedTextValueMm:10,currentModelValueMm:5,
  accepted:true,revision:3});
 assert.equal(evidence.recognizedKind,'diameter');
 assert.equal(evidence.field,'r1');assert.equal(evidence.currentModelValueMm,5);
 assert.equal(evidence.ocrAccuracyProven,false);assert.equal(evidence.geometryLinkProven,false);
 assert.equal(evidence.mathematicalProof,false);assert.equal(evidence.globallyUnique,null);
 assert.equal(evidence.finalFieldSetAccepted,false);
 assert.deepEqual(s.boxes()[0].bbox,[100,120,55,25]);
 assert.equal(s.progress().confirmed,1);
 assert.equal(s.accept(),false);
 const blocked=s.review(defaultValues('two-circles'),defaultChoices('two-circles'),3);
 assert.equal(blocked.status,'needs-confirmation');assert.equal(blocked.input,null);
});
test('corrected untrusted OCR Φ12 can confirm 10 mm diameter but cannot skip other fields',()=>{
 const s=state('two-circles'),ocr=proposal('Φ12');
 const accepted=stageReviewedImageDimension({fieldReview:s,candidate:ocr,
  field:'r1',reviewedTextValueMm:10,currentModelValueMm:5,
  accepted:true,revision:9});
 assert.equal(ocr.numericValue,12);
 assert.equal(accepted.reviewedTextValueMm,10);
 assert.equal(s.progress().confirmed,1);
 const values=defaultValues('two-circles');
 for(const id of s.required()){
  if(id==='r1')continue;
  s.mark(id,[70,80,70,24]);
  s.confirm(id,values[id]);
 }
 assert.equal(s.accept(),true);
 const r=s.review(values,defaultChoices('two-circles'),9);
 assert.equal(r.status,'ready-for-math');
 assert.equal(r.input.problem.unit,'mm');
 const session=createConfirmedFilletSession(r.input,{now:0});
 const snap=session.snapshot(0);
 assert.equal(snap.status,'ready');
 assert.equal(snap.plan.typedMathEvidence.g1Verified,true);
 assert.equal(snap.plan.typedMathEvidence.globallyUnique,null);
 s.edited('r1');
 assert.equal(s.progress().accepted,false);
 assert.equal(s.review(values,defaultChoices('two-circles'),10).input,null);
});
test('target fillet R must be radius, independent of candidate OCR numerical text',()=>{
 const s=state('two-circles'),values=defaultValues('two-circles');
 const r=stageReviewedImageDimension({fieldReview:s,candidate:proposal('R10'),
  field:'filletRadius',reviewedTextValueMm:10,
  currentModelValueMm:values.filletRadius,accepted:true,revision:2});
 assert.equal(r.field,'filletRadius');
 assert.equal(r.recognizedKind,'radius');
 assert.throws(()=>stageReviewedImageDimension({fieldReview:s,
  candidate:proposal('Φ20'),field:'filletRadius',
  reviewedTextValueMm:20,currentModelValueMm:10,accepted:true,revision:2}),
 /diameter cannot be assigned/);
});
test('missing approval or invalid mm values fail before any field is marked',()=>{
 const s=state('two-circles'),c=proposal();
 const inputs=[
  {accepted:false,reviewedTextValueMm:10,currentModelValueMm:5},
  {accepted:true,reviewedTextValueMm:0,currentModelValueMm:5},
  {accepted:true,reviewedTextValueMm:NaN,currentModelValueMm:5},
  {accepted:true,reviewedTextValueMm:12,currentModelValueMm:5},
  {accepted:true,reviewedTextValueMm:10,currentModelValueMm:-1}
 ];
 for(const t of inputs)assert.throws(()=>stageReviewedImageDimension({
  fieldReview:s,candidate:c,field:'r1',revision:2,...t}));
 assert.equal(s.progress().marked,0);
 assert.equal(s.progress().confirmed,0);
});
test('pixel/metric coordinate-space confusion and forged OCR confirmation are rejected',()=>{
 const s=state('two-circles'),c=proposal();
 const bad=[
  {...c,confirmed:true},
  {...c,coordinateSpace:'model-mm'},
  {...c,bbox:[780,120,55,25]},
  {...c,bbox:[100,120,-55,25]},
  {...c,bbox:[100,120,Infinity,25]},
  {...c,kind:'solve-result'},
  {...c,id:'other'},
  {...c,recognitionScore:2},
  {...c,requiresHumanReview:false},
  {...c,mathematicalProof:true}
 ];
 for(const candidate of bad){
  assert.throws(()=>validateOcrDimension(candidate,image));
  assert.throws(()=>stageReviewedImageDimension({fieldReview:s,candidate,
   field:'r1',reviewedTextValueMm:10,currentModelValueMm:5,
   accepted:true,revision:2}));
 }
 assert.equal(s.progress().marked,0);
});
test('OCR text cannot decide source field or geometry branch by itself',()=>{
 const s=state('two-segments'),c=proposal('R5');
 assert.throws(()=>stageReviewedImageDimension({fieldReview:s,candidate:c,
  field:'a1x',reviewedTextValueMm:5,currentModelValueMm:5,
  accepted:true,revision:0}),/text dimension cannot imply/);
 assert.throws(()=>stageReviewedImageDimension({fieldReview:s,candidate:c,
  field:'r2',reviewedTextValueMm:5,currentModelValueMm:5,
  accepted:true,revision:0}),/text dimension cannot imply/);
 assert.throws(()=>stageReviewedImageDimension({fieldReview:s,candidate:c,
  field:'filletRadius',reviewedTextValueMm:5,currentModelValueMm:5,
  accepted:true,revision:-1}),/revision/);
 assert.equal(s.progress().marked,0);
});
test('metadata is bounded and no raw OCR text instructions reach solver',()=>{
 const s=state('two-circles'),c=proposal('R10');
 const evidence=stageReviewedImageDimension({fieldReview:s,candidate:c,
  field:'filletRadius',reviewedTextValueMm:10,currentModelValueMm:10,
  accepted:true,revision:2});
 assert.equal(evidence.sourceConfidence,.71);
 assert.equal(s.review(defaultValues('two-circles'),defaultChoices('two-circles'),2).input,null);
 const fs=require('node:fs'),impl=fs.readFileSync('recognition/reviewed-image-dimension-field.cjs','utf8');
 assert.doesNotMatch(impl,/(fetch\(|XMLHttpRequest|localStorage|sessionStorage|createElement|innerHTML)/);
 assert.doesNotMatch(impl,/solveFiniteFillet|session\.replace/);
});
