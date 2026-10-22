'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {attachLocalDimensionReview}=require('../../labs/local-dimension-review-ui.cjs');
const {parseTextCandidates}=require('../../recognition/dimension-notation-candidates.cjs');
const {createFieldReview}=require('../../recognition/image-field-review.cjs');
const {stageReviewedImageDimension}=require('../../recognition/reviewed-image-dimension-field.cjs');
const {defaultValues,defaultChoices}=require('../../labs/auto-fillet-form.cjs');
const {createConfirmedFilletSession}=require('../../workbench/v31-fillet-session.cjs');
const imageSize={width:800,height:600};
const candidate=(text='Φ10')=>parseTextCandidates([{
 id:'ocr_1',text,confidence:0.65,bbox:[120,90,60,25]
}],imageSize)[0];
function element(value=''){
 const handlers={};
 return {value,checked:false,disabled:false,textContent:'',children:[],
  handlers,hidden:false,complete:true,naturalWidth:800,naturalHeight:600,
  addEventListener(name,handler){handlers[name]=handler;},
  replaceChildren(...elements){this.children=elements;},
  append(node){this.children.push(node);}
 };
}
function setup({detectImpl=async()=>({status:'ok',candidates:[candidate()]})}={}){
 const ids=['image','photoInput','photoClear','kind','run','clear',
   'candidateSelect','fieldSelect','reviewedValue','accept','stage','status'];
 const controls=Object.fromEntries(ids.map(name=>[name,element()]));
 controls.kind.value='two-circles';
 controls.fieldSelect.value='r1';
 const controller=createFieldReview();controller.setKind('two-circles');
 controller.setImage(800,600);
 const fieldReview={
  currentField:()=>controls.fieldSelect.value,
  confirmNotation({candidate:c,reviewedTextValueMm,currentModelValueMm,accepted,revision}){
   return stageReviewedImageDimension({fieldReview:controller,candidate:c,
    field:controls.fieldSelect.value,reviewedTextValueMm,
    currentModelValueMm,accepted,revision});
  }
 };
 const values=defaultValues('two-circles');
 const ui=attachLocalDimensionReview({...controls,fieldReview,
  getValues:()=>values,getRevision:()=>3,detectImpl,
  dom:{createElement(type){assert.equal(type,'option');return element();}}
 });
 return {c:controls,controller,ui,values};
}
test('native photo R/Φ text is a selectable local suggestion, with correction and separate field click',async()=>{
 const {c,controller,values}=setup();
 assert.equal(c.stage.disabled,true);
 await c.run.handlers.click();
 assert.equal(c.candidateSelect.children.length,2);
 assert.match(c.status.textContent,/未经核验|未核验/);
 c.candidateSelect.value='ocr_1';c.candidateSelect.handlers.change();
 assert.equal(c.reviewedValue.value,'10');
 assert.equal(c.stage.disabled,false);
 c.stage.handlers.click();
 assert.equal(controller.progress().confirmed,0);
 assert.match(c.status.textContent,/未接受文字候选/);
 c.accept.checked=true;c.reviewedValue.value='10';
 c.reviewedValue.valueAsNumber=10;
 c.stage.handlers.click();
 assert.equal(controller.progress().marked,1);
 assert.equal(controller.progress().confirmed,1);
 assert.equal(controller.accept(),false);
 assert.equal(c.accept.checked,false);
 assert.match(c.status.textContent,/仅此一项被确认/);
 for(const id of controller.required()){
  if(id==='r1')continue;
  controller.mark(id,[5,6,40,30]);controller.confirm(id,values[id]);
 }
 assert.equal(controller.accept(),true);
 const checked=controller.review(values,defaultChoices('two-circles'),3);
 assert.equal(checked.status,'ready-for-math');
 const session=createConfirmedFilletSession(checked.input,{now:0});
 assert.equal(session.snapshot(0).plan.typedMathEvidence.g1Verified,true);
 controller.edited('r1');
 assert.equal(controller.progress().accepted,false);
});
test('unsupported browser and invalid image are surfaced instead of simulated OCR',async()=>{
 const {c,controller}=setup({detectImpl:async()=>({status:'unsupported',candidates:[]})});
 await c.run.handlers.click();
 assert.match(c.status.textContent,/不支持/);
 assert.equal(c.candidateSelect.children.length,1);
 assert.equal(controller.progress().confirmed,0);
 c.image.hidden=true;await c.run.handlers.click();
 assert.match(c.status.textContent,/先选择并加载/);
});
test('OCR result for previous photo is discarded if image changes during await',async()=>{
 let release;
 const {c,controller}=setup({detectImpl:()=>new Promise(r=>{release=r;})});
 const oldRun=c.run.handlers.click();
 c.photoInput.handlers.change();
 release({status:'ok',candidates:[candidate('R10')]});
 await oldRun;
 assert.equal(c.candidateSelect.children.length,1);
 assert.equal(c.stage.disabled,true);
 assert.equal(controller.progress().confirmed,0);
 assert.match(c.status.textContent,/未确认/);
});
test('model/recognized text conflict fails without staging geometry',async()=>{
 const {c,controller}=setup();
 await c.run.handlers.click();
 c.candidateSelect.value='ocr_1';c.candidateSelect.handlers.change();
 c.accept.checked=true;c.reviewedValue.value='12';c.reviewedValue.valueAsNumber=12;
 c.stage.handlers.click();
 assert.equal(controller.progress().marked,0);
 assert.match(c.status.textContent,/contradicts/);
});
test('diameter cannot be mapped to target connection R even when its half equals field R',async()=>{
 const {c,controller}=setup({detectImpl:async()=>({
  status:'ok',candidates:[candidate('Φ20')]
 })});
 await c.run.handlers.click();
 c.candidateSelect.value='ocr_1';c.candidateSelect.handlers.change();
 c.fieldSelect.value='filletRadius';c.fieldSelect.handlers.change();
 c.accept.checked=true;c.reviewedValue.value='20';c.reviewedValue.valueAsNumber=20;
 c.stage.handlers.click();
 assert.equal(controller.progress().confirmed,0);
 assert.match(c.status.textContent,/diameter cannot be assigned/);
});
test('candidate choice, edited OCR value and changing kind revoke the current checkbox',async()=>{
 const {c,controller}=setup();
 await c.run.handlers.click();
 c.candidateSelect.value='ocr_1';c.candidateSelect.handlers.change();
 c.accept.checked=true;
 c.reviewedValue.handlers.input();assert.equal(c.accept.checked,false);
 c.accept.checked=true;
 c.fieldSelect.value='r2';c.fieldSelect.handlers.change();
 assert.equal(c.accept.checked,false);
 c.kind.value='two-segments';c.kind.handlers.change();
 assert.equal(c.candidateSelect.children.length,1);
 assert.equal(c.stage.disabled,true);
 assert.equal(controller.progress().confirmed,0);
});
test('malformed native OCR candidates are rejected; never trust a pre-confirmed source',async()=>{
 const cases=[
  [{...candidate(),confirmed:true}],
  [{...candidate(),bbox:[10000,30,50,20]}],
  [{id:'malformed',kind:'dimension',sourceText:'R5',dimensionKind:'radius'}],
  Array(151).fill(candidate())
 ];
 for(const tokens of cases){
  const {c,controller}=setup({detectImpl:async()=>({status:'ok',candidates:tokens})});
  await c.run.handlers.click();
  if(c.candidateSelect.children.length>1){
   c.candidateSelect.value='ocr_1';c.candidateSelect.handlers.change();
   c.accept.checked=true;c.reviewedValue.valueAsNumber=10;
   c.stage.handlers.click();
  }
  assert.equal(controller.progress().confirmed,0);
 }
});
test('HTML/entry contain actual controls and strictly reuse current image review, no upload or second solver',()=>{
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const src=fs.readFileSync('labs/local-dimension-review-ui.cjs','utf8');
 for(const id of ['detectOcr','clearOcr','ocrCandidate','ocrReviewedValue',
  'ocrAccept','ocrStage','ocrReviewStatus'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(entry,/attachLocalDimensionReview/);
 assert.match(entry,/attachImageFieldReview/);
 assert.match(entry,/fieldReview,getValues:values/);
 assert.match(entry,/session\.replace\(current/);
 assert.match(src,/detectBrowserDimensionCandidates/);
 assert.doesNotMatch(src,/(innerHTML|insertAdjacentHTML|fetch\(|XMLHttpRequest|localStorage|sessionStorage)/);
 assert.doesNotMatch(src,/(solveFiniteFillet|confirmedFilletTimeline|session\.replace)/);
});
