'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const pause=()=>new Promise(resolve=>setImmediate(resolve));

test('AI C2 browser flow fills existing editable workbench, refuses disabled geometry, never auto signs',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 for(const el of document.querySelectorAll('*')){
  if(!el||el.nodeType!==1)continue;
  for(const key of ['disabled','checked','hidden'])
   Object.defineProperty(el,key,{configurable:true,
    get(){return this.hasAttribute(key)},
    set(v){this.toggleAttribute(key,!!v)}});
  if(['INPUT','SELECT','OPTION','TEXTAREA'].includes(el.tagName))
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.prototype.hasOwnProperty.call(this,'_aiValue'))return this._aiValue;
     if(this.tagName==='SELECT')return (this.querySelector('option[selected]')||
      this.querySelector('option'))?.getAttribute('value')??'';
     return this.getAttribute('value')??'';
    },
    set(v){this._aiValue=String(v)}});
 }
 const $=id=>document.getElementById(id);
 const candidate={
  answer:'需要先核对已知实体位置',
  approach:'两个轴对齐长方体分别计算投影和接触',
  steps:['读出两组边界','核对后交由原 C2 引擎'],
  tool:'composite',
  twoBoxCandidate:{unit:'mm',
   boxes:[{min:[0,0,0],max:[20,20,10]},{min:[5,5,10],max:[15,15,20]}],
   evidenceText:'原题标注两长方体三维最小和最大坐标'}
 };
 let requests=0,confirms=0,inputs=0;
 window.confirm=()=>{confirms++;return true};
 const fakeFetch=async(url)=>{
  if(url==='/api/ai/status')return {ok:true,json:async()=>({enabled:true})};
  assert.equal(url,'/api/ai/solve');
  requests++;
  return {ok:true,json:async()=>({candidate})};
 };
 const localStorage={getItem(){return null},setItem(){}};
 const script=fs.readFileSync(path.join(__dirname,'../../ui-next/ai-solve.js'),'utf8');
 vm.runInNewContext(script,{document,window,Event:window.Event,fetch:fakeFetch,localStorage,
  setTimeout,clearTimeout,AbortController,console},{filename:'ai-solve.js',timeout:6000});
 await pause();
 assert.equal($('ai-solve-run').disabled,false);
 $('ai-solve-question').value='两个已知长方体的组合投影';
 $('ai-solve-access-token').value='example_long_local_private_token_123';
 $('ai-solve-consent').checked=true;
 $('ai-solve-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 for(let i=0;i<5;i++)await pause();
 assert.equal(requests,1);
 assert.equal($('ai-solve-two-box').hidden,false);
 assert.equal($('ai-c2-a-x1').value,'20');
 assert.equal($('ai-c2-b-z0').value,'10');
 // A saved/occupied C2 project disables quick-entry fields in the real UI.
 $('v7-task').value='composition';
 $('v8-c2-a-x0').value='999';
 $('v8-c2-a-x0').disabled=true;
 $('ai-solve-fill-two-box').click();
 assert.equal($('v8-c2-a-x0').value,'999','must never overwrite an occupied project');
 assert.match($('ai-solve-status').textContent,/已有|只读/);
 assert.equal($('v8-c2-ack').checked,false);
 // On an empty C2 quick entry, all twelve numbers transfer as unconfirmed input.
 $('v8-c2-a-x0').disabled=false;
 $('v8-c2-build').disabled=true;
 $('v8-c2-a-y1').addEventListener('input',()=>{inputs++});
 $('ai-solve-fill-two-box').click();
 assert.equal($('v8-c2-a-x0').value,'0');
 assert.equal($('v8-c2-b-x0').value,'5');
 assert.equal($('v8-c2-b-z1').value,'20');
 assert.ok(inputs>0,'must notify original workbench preflight');
 assert.equal($('v8-c2-ack').checked,false);
 assert.equal($('v8-c2-build').disabled,true);
 assert.equal(confirms,2);
 // Invalid reviewed edit fails locally, leaving original fields intact.
 $('ai-c2-b-z1').value='0';
 $('ai-solve-fill-two-box').click();
 assert.equal($('v8-c2-b-z1').value,'20');
 assert.match($('ai-solve-status').textContent,/最大值必须大于最小值/);
 assert.equal(confirms,2);
 // Editing the source after AI response revokes stale text and all transfer handlers.
 $('ai-solve-question').value='另一道不同尺寸的组合题';
 $('ai-solve-question').dispatchEvent(new window.Event('input',{bubbles:true}));
 assert.equal($('ai-solve-result').hidden,true);
 assert.equal($('ai-solve-fill-two-box').onclick,null);
 assert.match($('ai-solve-status').textContent,/旧 AI 候选已失效/);
});
