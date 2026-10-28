'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('V8 review requires explicit approval, calls canonical V5 and revokes approval on edits',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const originalCreate=document.createElement.bind(document);
 function adapt(el){
  if(!el||el.nodeType!==1)return el;
  for(const name of ['disabled','hidden','checked'])Object.defineProperty(el,name,{
   configurable:true,get(){return this.hasAttribute(name)},
   set(value){if(value)this.setAttribute(name,'');else this.removeAttribute(name)}
  });
  if(['INPUT','SELECT','OPTION','TEXTAREA'].includes(el.tagName))
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.hasOwn(this,'__v8Value'))return this.__v8Value;
     if(this.tagName==='SELECT'){
      const selected=this.querySelector('option[selected]')||this.querySelector('option');
      return selected?selected.value:'';
     }
     return this.getAttribute('value')??'';
    },
    set(value){this.__v8Value=String(value)}
   });
  return el;
 }
 for(const el of document.querySelectorAll('*'))adapt(el);
 Object.defineProperty(document,'createElement',{configurable:true,value:tag=>adapt(originalCreate(tag))});
 const prev={document:global.document,window:global.window};
 global.document=document;global.window=window;
 global.requestAnimationFrame=cb=>setImmediate(()=>cb(performance.now()));
 global.cancelAnimationFrame=clearImmediate;
 const $=id=>document.getElementById(id);
 const fire=(id,type)=>$(id).dispatchEvent(new window.Event(type,{bubbles:true}));
 try{
  require('../../project/unified-workbench-entry.cjs');
  for(let i=0;i<12&&!$('v7-review').textContent.includes('尚未提交');i++)await tick();
  assert.ok($('v8-review-summary').textContent.includes('x=15'));
  assert.equal($('v8-review-run').disabled,true,'cannot skip human review');
  assert.match($('v8-result-status').textContent,/尚未解题/);
  // A real user checks displayed coordinates and explicitly grants approval.
  $('v8-review-ack').checked=true;fire('v8-review-ack','change');
  assert.equal($('v8-review-run').disabled,false);
  fire('v8-review-run','click');
  for(let i=0;i<8;i++)await tick();
  assert.match($('v7-proof').textContent,/M3.*ConstructionIntent.*V5/);
  assert.match($('v8-result-status').textContent,/已完成/);
  assert.equal($('v8-result-status').dataset.state,'verified');
  assert.equal($('v8-review-ack').checked,false,'ack is not permanent');
  assert.equal($('v8-review-run').disabled,true);
  // Changing one entry revokes old proof and cannot silently authorize V5.
  $('v7-x').value='23';fire('v7-x','input');
  await tick();await tick();
  assert.match($('v7-proof').textContent,/未计算/);
  assert.equal($('v8-review-ack').checked,false);
  assert.equal($('v8-review-run').disabled,true);
  assert.match($('v8-review-summary').textContent,/x=23/);
  assert.match($('v8-review-summary').textContent,/尚未保存/);
  // Switching with unsaved typed input is forbidden even when the storage
  // backend isn't available. This prevents silent loss of draft form values.
  $('v7-task').value='planar';fire('v7-task','change');
  await tick();await tick();
  assert.equal($('v7-task').value,'projection');
  assert.match($('v7-save').textContent,/尚未保存的条件修改/);
  assert.equal($('v7-x').value,'23');
  assert.equal($('v8-review-run').disabled,true);
 }finally{
  global.document=prev.document;global.window=prev.window;
  delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
 }
});
