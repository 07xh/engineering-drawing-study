'use strict';
// Production entry DOM interaction smoke; exercises actual homepage bindings
// with storage intentionally unavailable, not a mocked or duplicate solver.
const test=require('node:test');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('V7 real homepage DOM: stage→human confirm→M3→one V5 and 2D/3D selection',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 // LinkeDOM is intentionally lightweight: emulate standard browser form setters
 // so this tests the actual production event bindings, not its DOM omissions.
 const nativeCreate=document.createElement.bind(document);
 const adapt=el=>{
  if(!el||el.nodeType!==1)return el;
  for(const name of ['disabled','hidden','checked']){
   Object.defineProperty(el,name,{configurable:true,
    get(){return this.hasAttribute(name);},
    set(v){if(v)this.setAttribute(name,'');else this.removeAttribute(name);}});
  }
  if(['INPUT','SELECT','OPTION'].includes(el.tagName)){
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.hasOwn(this,'__v7Value'))return this.__v7Value;
     if(this.tagName==='SELECT'){
      const option=this.querySelector('option[selected]')||this.querySelector('option');
      return option?option.value:'';
     }
     return this.getAttribute('value')??'';
    },
    set(v){this.__v7Value=String(v);}});
  }
  return el;
 };
 for(const el of document.querySelectorAll('*'))adapt(el);
 Object.defineProperty(document,'createElement',{configurable:true,
  value:tag=>adapt(nativeCreate(tag))});
 const original={document:global.document,window:global.window};
 global.document=document;global.window=window;
 global.requestAnimationFrame=cb=>setImmediate(()=>cb(performance.now()));
 global.cancelAnimationFrame=clearImmediate;
 const $=id=>document.getElementById(id);
 const click=id=>$(id).dispatchEvent(new window.Event('click',{bubbles:true}));
 try{
  require('../../project/unified-workbench-entry.cjs');
  for(let i=0;i<12&&!$('v7-review').textContent.includes('尚未提交');i++)await tick();
  assert.match($('v7-review').textContent,/尚未提交/, $('v7-save').textContent);
  assert.match(document.querySelector('#recent .next-home-empty-title').textContent,/本机存储暂不可用/);
  assert.equal(document.querySelector('#recent .next-home-continue-button').getAttribute('href'),'#project-workbench');
  assert.match($('v7-proof').textContent,/未计算/);
  click('v7-solve');await tick();await tick();
  assert.match($('v7-proof').textContent,/未计算/,'unconfirmed click cannot forge a result');
  click('v7-stage');await tick();await tick();
  assert.match($('v7-review').textContent,/待确认/);
  assert.match($('v7-proof').textContent,/未计算/);
  click('v7-confirm');await tick();await tick();
  assert.match($('v7-review').textContent,/已人工确认/);
  click('v7-solve');await tick();await tick();
  assert.match($('v7-proof').textContent,/M3.*ConstructionIntent.*V5/);
  assert.ok($('v7-step-list').querySelector('button'));
  assert.ok($('v7-sheet').querySelector('circle'));
  // Move the exact V5 clock to completion: reveal mathematically derived W.
  $('v7-seek').value='1000';
  $('v7-seek').dispatchEvent(new window.Event('input',{bubbles:true}));
  const w=$('v7-sheet').querySelector('[aria-label="选择 W 投影点"]');
  assert.ok(w,'third projection comes from verified solver geometry');
  w.dispatchEvent(new window.Event('click',{bubbles:true}));
  assert.match($('v7-selection').textContent,/Point1/);
  assert.equal($('v7-3d').querySelectorAll('circle').length,1);
  $('v7-yaw').value='40';
  $('v7-yaw').dispatchEvent(new window.Event('input',{bubbles:true}));
  assert.match($('v7-selection').textContent,/Point1/);
  // A changed condition is a candidate again; V5 may not continue.
  $('v7-x').value='23';
  click('v7-stage');await tick();await tick();
  assert.match($('v7-proof').textContent,/未计算/);
  assert.equal($('v7-step-list').querySelectorAll('button').length,0);
 }finally{
  global.document=original.document;global.window=original.window;
  delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
 }
});
