'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {mount}=require('./helpers/dom-app.cjs');
const page='labs/cone-cut-live.html';
function setup({next=true}={}){
 let seq=0;
 const revoked=[],seen=[];
 const urls={
  createObjectURL(file){seen.push(file);return 'blob:private-'+(++seq);},
  revokeObjectURL(uri){revoked.push(uri);}
 };
 const app=mount(page,{next,urls});
 const source=app.get('coneSourceFile'),image=app.get('coneSourcePreview');
 const setFile=file=>{
  Object.defineProperty(source,'files',{configurable:true,value:file?[file]:[]});
  source.dispatchEvent(new app.document.defaultView.Event('change',{bubbles:true}));
 };
 const finish=(w=900,h=700)=>{
  Object.defineProperty(image,'naturalWidth',{configurable:true,value:w});
  Object.defineProperty(image,'naturalHeight',{configurable:true,value:h});
  if(typeof image.onload!=='function')throw Error('image load handler missing');
  image.onload();
 };
 const confirm=()=>{
  app.get('coneConfirm').checked=true;
  app.get('coneConfirm').dispatchEvent(new app.document.defaultView.Event('change',{bubbles:true}));
 };
 const solve=()=>{confirm();app.click('coneSolve');};
 return {app,source,image,setFile,finish,confirm,solve,revoked,seen};
}
const photo=(type='image/png',size=250000)=>({
 name:'ORIGINAL_BOOK_WITH_ANSWERS.png',type,size
});
test('09 real cone UI: choose local image invalidates running V5, demands new confirmation',()=>{
 for(const next of [false,true]){
  const e=setup({next}),a=e.app;
  e.solve();
  assert.equal(a.get('coneSteps').children.length,16);
  a.click('conePlay');a.advance(300);
  assert.ok(a.frames.size>0);
  e.setFile(photo());
  assert.equal(a.frames.size,0);
  assert.equal(a.get('conePlay').disabled,true);
  assert.equal(a.get('coneConfirm').checked,false);
  assert.equal(a.get('coneSteps').children.length,0);
  assert.ok(e.image.getAttribute('src')?.startsWith('blob:'));
  assert.equal(e.image.hidden,true);
  e.finish();
  assert.equal(e.image.hidden,false);
  assert.match(a.get('coneSourceStatus').textContent,/不识别图片/);
  assert.doesNotMatch(a.get('coneSourceStatus').textContent,/已通过原题盲测/);
  e.solve();
  assert.equal(a.get('coneSteps').children.length,16);
  assert.match(a.get('coneProof').textContent,/无答案隔离证明/);
  assert.equal(a.get('conePlay').disabled,false);
  a.click('coneSourceClear');
  assert.equal(a.get('conePlay').disabled,true);
  assert.equal(a.get('coneSteps').children.length,0);
  assert.equal(e.image.hidden,true);
  assert.ok(!e.image.hasAttribute('src'));
  assert.deepEqual(e.revoked,['blob:private-1']);
 }
});
test('09 stale async image-load callback cannot restore replaced old reference',()=>{
 const e=setup(),a=e.app;
 e.setFile(photo('image/jpeg'));const oldLoad=e.image.onload;
 e.setFile(photo('image/png'));
 assert.deepEqual(e.revoked,['blob:private-1']);
 oldLoad();
 assert.equal(e.image.hidden,true);
 assert.equal(a.get('coneSourceClear').disabled,true);
 e.finish(600,900);
 assert.equal(e.image.hidden,false);
 assert.equal(a.get('coneSourceClear').disabled,false);
 a.click('coneReset');
 assert.deepEqual(e.revoked,['blob:private-1','blob:private-2']);
 assert.equal(e.image.hidden,true);
 assert.equal(a.get('coneSourceFile').value,'');
});
test('09 invalid file and oversize decoded image fail closed; no remote URLs or leaked input',()=>{
 const e=setup();
 e.setFile(photo('image/svg+xml'));
 assert.equal(e.revoked.length,0);
 assert.equal(e.image.hidden,true);
 assert.match(e.app.get('coneSourceStatus').textContent,/图片被拒绝/);
 e.setFile(photo('image/jpeg',16*1024*1024));
 assert.equal(e.revoked.length,0);
 assert.equal(e.app.get('conePlay').disabled,true);
 e.setFile(photo('image/jpeg',1000));
 e.finish(10000,10000);
 assert.equal(e.revoked.length,1);
 assert.equal(e.image.hidden,true);
 assert.match(e.app.get('coneSourceStatus').textContent,/图片尺寸不符合安全范围/);
 assert.ok(!e.image.hasAttribute('src'));
});
test('09 source changing while loaded does not infer geometry or turn reference into a solved exercise',()=>{
 const e=setup(),a=e.app;
 e.setFile(photo());e.finish();e.solve();
 assert.match(a.get('coneProof').textContent,/未自动识图/);
 a.set('coneRadius','7','input');
 assert.equal(e.image.hidden,false,'photo can stay as a local reference');
 assert.equal(a.get('conePlay').disabled,true);
 assert.equal(a.get('coneConfirm').checked,false);
 e.solve();
 assert.match(a.get('coneStatus').textContent,/已就绪/);
 assert.match(a.get('coneProof').textContent,/本地原题图仅作为人工转录参照/);
});
