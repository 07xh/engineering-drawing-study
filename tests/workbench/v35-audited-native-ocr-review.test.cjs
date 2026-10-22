'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {attachLocalNativeOcr}=require('../../labs/local-native-ocr-ui.cjs');
const {parseTextCandidates}=require('../../recognition/dimension-notation-candidates.cjs');
const {stageReviewedImageDimension}=require('../../recognition/reviewed-image-dimension-field.cjs');
const {createFieldReview}=require('../../recognition/image-field-review.cjs');
const {defaultValues,defaultChoices}=require('../../labs/auto-fillet-form.cjs');
const {createConfirmedFilletSession}=require('../../workbench/v31-fillet-session.cjs');

const image={width:1200,height:800};
const recognized=(text='R12')=>parseTextCandidates([{
 id:'ocr_1',text,confidence:.5,bbox:[100,200,70,24]
}],image)[0];
function control(){
 const handlers={};
 return {handlers,children:[],value:'',valueAsNumber:NaN,
  disabled:false,hidden:true,checked:false,textContent:'',
  naturalWidth:1200,naturalHeight:800,
  addEventListener(name,fn){handlers[name]=fn;},
  replaceChildren(...a){this.children=[...a]},
  append(x){this.children.push(x)},
  setAttribute(){},
  async fire(name){return handlers[name]?.()}
 };
}
function setup({kind='two-circles',text='R12',recognize}={}){
 const names=['image','photoInput','photoClear','run','clear','overlay','status',
  'selector','associate','sourceField','prefillButton','unitConfirmed',
  'reviewedValue','reviewAccept','reviewButton'];
 const c=Object.fromEntries(names.map(name=>[name,control()]));
 c.sourceField.value='filletRadius';
 const state=createFieldReview();state.setKind(kind);state.setImage(1200,800);
 const evidence=[];
 const fieldReview={
  markCandidate:()=>({ok:true,reason:'bbox only; not a math value'}),
  confirmNotation({candidate,reviewedTextValueMm,currentModelValueMm,accepted,revision}){
   const r=stageReviewedImageDimension({fieldReview:state,candidate,
    field:c.sourceField.value,reviewedTextValueMm,currentModelValueMm,
    accepted,revision});
   if(/^ocr_[0-9]+$/.test(r.sourceId)){
    state.mark(c.sourceField.value,r.bbox,r.sourceId);
    state.confirm(c.sourceField.value,currentModelValueMm);
   }
   evidence.push(r);return r;
  }
 };
 const original=global.document;
 global.document={
  createElement(tag){assert.equal(tag,'option');return {value:'',textContent:''}},
  createElementNS(){return {setAttribute(){}}}
 };
 const values=defaultValues(kind);
 const ui=attachLocalNativeOcr({...c,fieldReview,
  getCurves:()=>[],getValues:()=>values,getRevision:()=>9,
  recognize:recognize||(async()=>({status:'ok',candidates:[recognized(text)]}))});
 return {c,state,values,ui,evidence,restore(){global.document=original}};
}
test('R12 OCR may be human-corrected to R10 but cannot directly verify other geometry',async()=>{
 const x=setup();
 try{
  await x.c.run.fire('click');
  x.c.selector.value='ocr_1';await x.c.selector.fire('change');
  assert.equal(x.c.reviewedValue.value,'12');
  assert.equal(x.c.reviewButton.disabled,false);
  x.c.reviewAccept.checked=true;
  x.c.reviewedValue.value='10';x.c.reviewedValue.valueAsNumber=10;
  await x.c.reviewButton.fire('click');
  assert.equal(x.state.progress().confirmed,1);
  assert.equal(x.state.progress().accepted,false);
  assert.equal(x.state.boxes()[0].detectorCandidateId,'ocr_1');
  assert.equal(x.evidence[0].ocrAccuracyProven,false);
  assert.equal(x.evidence[0].finalFieldSetAccepted,false);
  assert.equal(x.evidence[0].recognizedKind,'radius');
  assert.equal(x.c.reviewAccept.checked,false);
  assert.equal(x.state.accept(),false);
  for(const id of x.state.required()){
   if(id==='filletRadius')continue;
   x.state.mark(id,[10,15,45,24]);
   x.state.confirm(id,x.values[id]);
  }
  assert.equal(x.state.accept(),true);
  const actual=x.state.review(x.values,defaultChoices('two-circles'),9);
  assert.equal(actual.status,'ready-for-math');
  const session=createConfirmedFilletSession(actual.input,{now:0});
  assert.equal(session.snapshot(0).plan.typedMathEvidence.g1Verified,true);
  x.state.edited('filletRadius');
  assert.equal(x.state.progress().accepted,false);
 }finally{x.restore();}
});
test('unreviewed candidate cannot pass, and edited text/field choice revoke confirmation',async()=>{
 const x=setup();
 try{
  await x.c.run.fire('click');
  x.c.selector.value='ocr_1';await x.c.selector.fire('change');
  x.c.reviewedValue.valueAsNumber=12;
  await x.c.reviewButton.fire('click');
  assert.equal(x.state.progress().confirmed,0);
  x.c.reviewAccept.checked=true;
  await x.c.reviewedValue.fire('input');
  assert.equal(x.c.reviewAccept.checked,false);
  x.c.reviewAccept.checked=true;
  x.c.sourceField.value='r1';
  await x.c.sourceField.fire('change');
  assert.equal(x.c.reviewAccept.checked,false);
  assert.equal(x.state.progress().confirmed,0);
 }finally{x.restore();}
});
test('Φ20 cannot be misused for target R; conflicting radius cannot enter field state',async()=>{
 const x=setup({text:'Φ20'});
 try{
  await x.c.run.fire('click');x.c.selector.value='ocr_1';
  await x.c.selector.fire('change');
  x.c.reviewedValue.value='20';x.c.reviewedValue.valueAsNumber=20;
  x.c.reviewAccept.checked=true;await x.c.reviewButton.fire('click');
  assert.equal(x.state.progress().confirmed,0);
  assert.match(x.c.status.textContent,/diameter cannot be assigned/);
  x.c.sourceField.value='r1';await x.c.sourceField.fire('change');
  x.c.reviewAccept.checked=true;
  await x.c.reviewButton.fire('click');
  assert.equal(x.state.progress().confirmed,0);
  assert.match(x.c.status.textContent,/contradicts/);
 }finally{x.restore();}
});
test('a new image cancels an in-flight native OCR result and resets numeric approval',async()=>{
 let done;
 const x=setup({recognize:()=>new Promise(resolve=>{done=resolve})});
 try{
  const p=x.c.run.fire('click');
  await x.c.photoInput.fire('change');
  done({status:'ok',candidates:[recognized('R10')]});
  await p;
  assert.equal(x.ui.count,0);
  assert.equal(x.c.reviewButton.disabled,true);
  assert.equal(x.c.reviewAccept.checked,false);
  assert.equal(x.state.progress().confirmed,0);
 }finally{x.restore();}
});
test('unsupported native OCR reports fallback; never manufactures diameter or measured geometry',async()=>{
 const x=setup({recognize:async()=>({status:'unsupported',candidates:[]})});
 try{
  await x.c.run.fire('click');
  assert.equal(x.ui.count,0);
  assert.match(x.c.status.textContent,/不支持/);
  assert.equal(x.c.reviewButton.disabled,true);
  assert.equal(x.state.progress().confirmed,0);
 }finally{x.restore();}
});
test('HTML, original-image review integration and native detector remain local-only',()=>{
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const ui=fs.readFileSync('labs/local-native-ocr-ui.cjs','utf8');
 const review=fs.readFileSync('labs/image-field-review-ui.cjs','utf8');
 for(const id of ['ocrCorrectedValue','ocrNumericAccept','confirmOcrNumeric'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(entry,/getRevision:\(\)=>session\?\.revision\?\?0/);
 assert.match(entry,/sourceField:\$\('sourceField'\),fieldReview/);
 assert.match(entry,/getValues:values/);
 assert.match(ui,/fieldReview\.confirmNotation/);
 assert.match(review,/stageReviewedImageDimension/);
 assert.doesNotMatch(ui,/(fetch\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML)/);
 assert.doesNotMatch(ui,/(solveFiniteFillet|session\.replace|confirmedFilletTimeline)/);
});
