'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {parseHTML}=require('linkedom');

// Exercise the actual C3 page and its ORIGINAL V5 controller, not mocked
// math or an invented second canvas player. DOM-only smoke is not a browser
// visual or production verification.
test('C3 real page: M3 exact 3D curve ↔ first-angle V/H/W V5 IDs, ambiguous owners and stale invalidation',()=>{
 const html=fs.readFileSync('labs/finite-cylinder-intersection-live.html','utf8');
 const {document,window}=parseHTML(html);
 const old={document:global.document,window:global.window,
  requestAnimationFrame:global.requestAnimationFrame,
  cancelAnimationFrame:global.cancelAnimationFrame};
 const originalCreate=document.createElement.bind(document);
 function adapt(el){
  if(!el||el.nodeType!==1)return el;
  for(const name of ['checked','disabled']){
   Object.defineProperty(el,name,{configurable:true,
    get(){return this.hasAttribute(name);},
    set(v){if(v)this.setAttribute(name,'');else this.removeAttribute(name);}});
  }
  if(['INPUT','SELECT','OPTION'].includes(el.tagName)){
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.hasOwn(this,'_c3Value'))return this._c3Value;
     if(this.tagName==='SELECT'){
      const option=this.querySelector('option[selected]')||
       this.querySelector('option');
      return option?option.value:'';
     }
     return this.getAttribute('value')||'';
    },
    set(v){this._c3Value=String(v);}});
  }
  if(el.tagName==='INPUT')
   Object.defineProperty(el,'valueAsNumber',{configurable:true,
    get(){const n=Number(this.value);return this.value.trim()===''?NaN:n;}});
  return el;
 }
 for(const el of document.querySelectorAll('*'))adapt(el);
 Object.defineProperty(document,'createElement',{configurable:true,
  value:tag=>adapt(originalCreate(tag))});
 global.document=document;global.window=window;
 global.requestAnimationFrame=cb=>setImmediate(()=>cb(performance.now()));
 global.cancelAnimationFrame=clearImmediate;
 const $=id=>document.getElementById(id);
 const change=(id,event='input')=>$(id).dispatchEvent(
  new window.Event(event,{bubbles:true}));
 const click=id=>change(id,'click');
 const path=require.resolve('../../labs/finite-cylinder-intersection-live-entry.cjs');
 try{
  delete require.cache[path];
  require(path);
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  assert.equal($('play').disabled,true);
  click('solve');
  assert.match($('status').textContent,/确认/);
  $('confirmed').checked=true;
  click('solve');
  assert.doesNotMatch($('status').textContent,/数学审核阻断/);
  assert.equal($('play').disabled,false);
  assert.match($('proof').textContent,/共享三维辅助对象/);
  const scenePaths=$('spatialBoard').querySelectorAll(
   'path[data-geometry-id^="C3Branch3D"]');
  assert.ok(scenePaths.length>=2,'exact 3D analytic source is visible');
  assert.ok([...scenePaths].every(p=>p.getAttribute('data-official-engineering-line')==='false'));
  const originalD=scenePaths[0].getAttribute('d');
  const oldProof=$('proof').textContent;
  $('c3-yaw').value='70';change('c3-yaw');
  assert.notEqual($('spatialBoard').querySelector(
   'path[data-geometry-id^="C3Branch3D"]').getAttribute('d'),originalD);
  assert.equal($('proof').textContent,oldProof,'camera cannot rerun M3 or V5');
  // The one existing V5 clock releases original source arcs/actions.
  let alias=null,wAction=null;
  for(let step=0;step<150;step++){
   alias=$('board').querySelector(
    '[data-projection-source-nonunique="true"][data-view="V"]');
   wAction=$('board').querySelector(
    '[data-view="W"][data-geometry-ids^="C3Branch3D"]');
   if(alias&&wAction)break;
   click('next');
  }
  assert.ok(alias,'a true shared V/H projection must retain several 3D owners');
  assert.ok(wAction,'W original analytic V5 action must link to 3D source');
  const sourceIds=alias.getAttribute('data-geometry-ids').split(',');
  assert.ok(sourceIds.length>=2);
  alias.dispatchEvent(new window.Event('click',{bubbles:true}));
  for(const id of sourceIds){
   const spatial=$('spatialBoard').querySelector(
    '[data-geometry-id="'+id+'"]');
   assert.ok(spatial);
   assert.equal(spatial.getAttribute('stroke'),'#ef6730',
    '2D shared arc must highlight every true 3D owner, not a guessed one');
  }
  const independent=$('spatialBoard').querySelector(
   '[data-geometry-id="'+sourceIds[0]+'"]');
  independent.dispatchEvent(new window.Event('click',{bubbles:true}));
  const selected=$('spatialBoard').querySelectorAll('[stroke="#ef6730"]');
  assert.equal(selected.length,1,
   'choosing a 3D branch refines multiple paper aliases to one physical source');
  assert.ok($('board').querySelectorAll(
   '[data-view="W"][stroke="#ef6730"]').length>0);
  assert.ok([...$('board').querySelectorAll('[data-source-v5-action]')]
   .every(x=>x.getAttribute('data-official-line-style')==='false'));
  $('zRadius').value='13';change('zRadius');
  assert.equal($('confirmed').checked,false);
  assert.equal($('play').disabled,true);
  assert.equal($('spatialBoard').querySelectorAll(
   'path[data-geometry-id^="C3Branch3D"]').length,0);
  assert.equal($('board').querySelectorAll('[data-source-v5-action]').length,0);
 }finally{
  delete require.cache[path];
  Object.assign(global,old);
 }
});
