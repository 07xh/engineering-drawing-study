'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {mount}=require('./helpers/dom-app.cjs');
const page='labs/cone-cut-live.html';
const jpeg=()=>({type:'image/jpeg',size:1000,name:'PRIVATE_WITH_ANSWERS.jpg'});
const canvasFactory=()=>({width:0,height:0,
 getContext(){return {fillRect(){},drawImage(){},set fillStyle(_v){}}}});
class Detector{
 async detect(_canvas){
  return [{rawValue:'Φ20 mm',
   boundingBox:{x:80,y:120,width:100,height:25}}];
 }
}
function prepare({next=true,nativeTextDetector=Detector}={}){
 let issued=0;const revoked=[];
 const urls={createObjectURL(){return 'blob:cone-ocr-'+(++issued);},
  revokeObjectURL(x){revoked.push(x)}};
 const app=mount(page,{next,urls,nativeTextDetector,canvasFactory});
 const file=app.get('coneSourceFile'),img=app.get('coneSourcePreview');
 const change=(id,type='change')=>app.get(id).dispatchEvent(
  new app.document.defaultView.Event(type,{bubbles:true}));
 function load(){
  Object.defineProperty(file,'files',{configurable:true,value:[jpeg()]});
  change('coneSourceFile');
  Object.defineProperty(img,'naturalWidth',{configurable:true,value:900});
  Object.defineProperty(img,'naturalHeight',{configurable:true,value:700});
  img.onload();
 }
 const confirmed=()=>{app.get('coneConfirm').checked=true;change('coneConfirm')};
 return {app,change,load,confirmed,revoked};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('09 real cone page native OCR proposes Φ dimension, but never solves before explicit user review',async()=>{
 for(const next of [false,true]){
  const e=prepare({next}),a=e.app;
  assert.equal(a.get('coneOcrRun').disabled,true);
  e.load();
  assert.equal(a.get('coneOcrRun').disabled,false);
  assert.equal(a.get('coneOcrApply').disabled,true);
  a.click('coneOcrRun');
  await flush();
  assert.equal(a.get('coneOcrCandidate').disabled,false);
  assert.match(a.get('coneOcrStatus').textContent,/找到 1 条候选/);
  assert.equal(a.get('coneRadius').value,'5');
  assert.equal(a.get('conePlay').disabled,true);
  a.set('coneOcrCandidate','ocr_1');
  assert.equal(a.get('coneOcrReviewedValue').value,'20');
  assert.equal(a.get('coneOcrReviewedValue').disabled,false);
  a.click('coneOcrApply');
  assert.equal(a.get('coneRadius').value,'5',
   'candidate without units/link/acceptance must not enter the solver');
  for(const id of ['coneOcrUnits','coneOcrLink','coneOcrAccept'])
   a.get(id).checked=true;
  a.set('coneOcrAnswers','contains-answers');
  a.click('coneOcrApply');
  assert.equal(a.get('coneRadius').value,'10',
   'explicitly reviewed Φ20 converts to editable 10 mm radius');
  assert.equal(a.get('coneConfirm').checked,false);
  assert.equal(a.get('conePlay').disabled,true);
  assert.match(a.get('coneOcrStatus').textContent,/含参考答案/);
  e.confirmed();a.click('coneSolve');
  assert.equal(a.get('coneSteps').children.length,16);
  assert.equal(a.get('conePlay').disabled,false);
  assert.match(a.get('coneProof').textContent,/OCR 候选经人工核对/);
  assert.match(a.get('coneProof').textContent,/禁止计入无答案盲测/);
 }
});
test('09 replacement image while OCR is pending discards stale native detections',async()=>{
 let finish;
 class SlowDetector{detect(){return new Promise(resolve=>{finish=resolve})}}
 const e=prepare({nativeTextDetector:SlowDetector}),a=e.app;
 e.load();a.click('coneOcrRun');
 assert.equal(a.get('coneOcrRun').disabled,true);
 a.click('coneSourceClear');
 assert.equal(a.get('coneOcrRun').disabled,true);
 finish([{rawValue:'R500',boundingBox:{x:80,y:120,width:90,height:25}}]);
 await flush();
 assert.equal(a.get('coneOcrCandidate').disabled,true);
 assert.equal(a.get('coneOcrApply').disabled,true);
 assert.equal(a.get('coneRadius').value,'5');
 assert.equal(a.get('coneConfirm').checked,false);
 assert.deepEqual(e.revoked,['blob:cone-ocr-1']);
});
test('09 unsupported native TextDetector keeps existing manual math input usable',async()=>{
 const e=prepare({nativeTextDetector:null}),a=e.app;
 e.load();a.click('coneOcrRun');await flush();
 assert.match(a.get('coneOcrStatus').textContent,/TextDetector/);
 assert.equal(a.get('coneOcrApply').disabled,true);
 assert.equal(a.get('coneRadius').value,'5');
 e.confirmed();a.click('coneSolve');
 assert.equal(a.get('conePlay').disabled,false);
});
test('09 approved candidate cannot survive user-edited radius, source swap, or no-answer claim',async()=>{
 const e=prepare(),a=e.app;e.load();
 a.click('coneOcrRun');await flush();a.set('coneOcrCandidate','ocr_1');
 for(const id of ['coneOcrUnits','coneOcrLink','coneOcrAccept'])
  a.get(id).checked=true;
 a.click('coneOcrApply');
 assert.equal(a.get('coneRadius').value,'10');
 a.set('coneRadius','13','input');
 assert.equal(a.get('coneConfirm').checked,false);
 e.confirmed();a.click('coneSolve');
 assert.doesNotMatch(a.get('coneProof').textContent,/OCR 候选经人工核对/);
 a.click('coneSourceClear');
 assert.equal(a.get('coneOcrApply').disabled,true);
 assert.equal(a.get('conePlay').disabled,true);
});
