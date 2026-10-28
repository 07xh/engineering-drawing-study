'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const tick=()=>new Promise(r=>setImmediate(r));
test('C2 reviewed two-box UI lives in local workbench and never fabricates V5',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const native=document.createElement.bind(document);
 function adapt(el){
  if(!el||el.nodeType!==1)return el;
  for(const name of ['disabled','checked','hidden'])
   Object.defineProperty(el,name,{configurable:true,
    get(){return this.hasAttribute(name)},
    set(v){v?this.setAttribute(name,''):this.removeAttribute(name)}});
  if(['INPUT','SELECT','OPTION','TEXTAREA'].includes(el.tagName))
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.hasOwn(this,'_c2value'))return this._c2value;
     if(this.tagName==='SELECT')return (this.querySelector('option[selected]')||
      this.querySelector('option'))?.value||'';
     return this.getAttribute('value')??'';
    },set(v){this._c2value=String(v)}});
  return el;
 }
 for(const el of document.querySelectorAll('*'))adapt(el);
 Object.defineProperty(document,'createElement',{configurable:true,value:tag=>adapt(native(tag))});
 const saved={document:global.document,window:global.window};
 global.document=document;global.window=window;
 global.requestAnimationFrame=fn=>setImmediate(()=>fn(performance.now()));
 global.cancelAnimationFrame=clearImmediate;
 const $=id=>document.getElementById(id);
 const evt=(id,type)=>$(id).dispatchEvent(new window.Event(type,{bubbles:true}));
 try{
  require('../../project/unified-workbench-entry.cjs');
  for(let i=0;i<12&&!$('v7-review').textContent.includes('尚未提交');i++)await tick();
  $('v7-task').value='composition';evt('v7-task','change');
  for(let i=0;i<6;i++)await tick();
  assert.equal(document.querySelector('fieldset[data-v7-task="composition"]').hidden,false);
  assert.equal($('v8-c2-build').disabled,true);
  const inputs={
   a:[0,0,0,20,20,10],
   b:[5,5,10,15,15,20]
  };
  for(const [letter,arr] of Object.entries(inputs)){
   ['x0','y0','z0','x1','y1','z1'].forEach((part,i)=>{
    const id='v8-c2-'+letter+'-'+part;$(id).value=String(arr[i]);evt(id,'input');
   });
  }
  $('v8-c2-ack').checked=true;evt('v8-c2-ack','change');
  assert.equal($('v8-c2-build').disabled,false);
  evt('v8-c2-build','click');
  for(let i=0;i<16;i++)await tick();
  assert.match($('v8-c2-status').textContent,/两形体已保存/,$('v7-save').textContent);
  assert.match($('v7-c-contacts').textContent,/已核对 2 个轴对齐闭合长方体/);
  assert.equal($('v7-play').disabled,true);
  assert.equal($('v8-result-status').dataset.state,'partial');
  assert.equal($('v7-c-objects').querySelectorAll('option').length,3);
  // Existing model cannot be overwritten by another one-click import.
  $('v8-c2-ack').checked=true;evt('v8-c2-ack','change');
  evt('v8-c2-build','click');await tick();await tick();
  assert.match($('v7-save').textContent,/已有条件/);
  assert.equal($('v7-c-objects').querySelectorAll('option').length,3);
 }finally{
  global.document=saved.document;global.window=saved.window;
  delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
 }
});
