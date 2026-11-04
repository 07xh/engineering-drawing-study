'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createRequire}=require('node:module');
const {parseHTML}=require('linkedom');
const entry=path.resolve('labs/solid-third-view-live-entry.cjs');

test('real reviewed C1 page: six-point oblique prism loads only GIVEN views, solves with sole V5, and edits invalidate',()=>{
 const {document,window}=parseHTML(
  fs.readFileSync('labs/solid-third-view-live.html','utf8'));
 for(const el of document.querySelectorAll('input,button,select,textarea')){
  for(const property of ['checked','disabled'])
   Object.defineProperty(el,property,{configurable:true,
    get(){return this.hasAttribute(property);},
    set(value){value?this.setAttribute(property,''):
     this.removeAttribute(property);}
   });
  if(['INPUT','SELECT','TEXTAREA','OPTION'].includes(el.tagName))
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.hasOwn(this,'__c1Value'))return this.__c1Value;
     if(this.tagName==='SELECT'){
      const option=this.querySelector('option[selected]')||
       this.querySelector('option');
      return option?.getAttribute('value')||'';
     }
     return this.getAttribute('value')||'';
    },set(value){this.__c1Value=String(value);}
   });
 }
 const scope={document,window,require:createRequire(entry),
  performance:{now:()=>0},requestAnimationFrame:()=>0,
  cancelAnimationFrame:()=>{},console};
 vm.runInNewContext(fs.readFileSync(entry,'utf8'),scope,{filename:entry});
 const $=id=>document.getElementById(id);
 const fire=(id,event='change')=>$(id).dispatchEvent(
  new window.Event(event,{bubbles:true}));
 assert.equal($('shapePreset').value,'box');
 assert.equal($('vertices').value.trim().split(/\r?\n/).length,8);
 assert.equal($('pointV5Play').disabled,true);
 $('shapePreset').value='oblique';fire('shapePreset');
 const rows=$('vertices').value.trim().split(/\r?\n/);
 assert.equal(rows.length,6);
 assert.deepEqual(rows.map(row=>row.split(',')[0]),['A','B','C','D','E','F']);
 assert.ok(rows.every(row=>row.split(',').length===5));
 assert.equal($('confirmed').checked,false);
 assert.equal($('pointV5Play').disabled,true);
 fire('solve','click');
 assert.equal($('status').dataset.status,'blocked',
  'sample selection cannot auto-authorize a geometric solution');
 assert.match($('status').textContent,/核对原题/);
 $('confirmed').checked=true;fire('confirmed');
 fire('solve','click');
 assert.equal($('status').dataset.status,'ready',
  $('status').textContent);
 assert.match($('status').textContent,/6 个点、9 条棱与 5 个面/);
 assert.equal($('pointV5Play').disabled,false);
 assert.ok($('paper').querySelectorAll('[data-source-edge]').length>0);
 assert.equal($('paper').querySelectorAll(
  '[data-view="W"][data-source-edge], [data-view="W"][data-m5-hull-interval]').length,0,
  'GIVEN-first: future W candidate/hull answer must not be prepainted');
 assert.equal($('paper').querySelectorAll('[data-source-v5-action]').length,0,
  'frame zero has no prematurely drawn V5 answer');
 fire('pointV5Next','click');
 assert.ok($('paper').querySelectorAll('[data-source-v5-action]').length>0,
  'the existing V5 clock must progressively draw authentic source actions');
 assert.match($('proof').textContent,/M5/);
 // A second solve is a fresh transaction, not an append to the old player.
 const originalRows=$('vertices').value;
 fire('solve','click');
 assert.equal($('status').dataset.status,'ready');
 assert.equal($('paper').querySelectorAll('[data-source-v5-action]').length,0,
  're-solving the same reviewed input must start from a blank V5 frame');
 fire('pointV5Next','click');
 assert.ok($('paper').querySelectorAll('[data-source-v5-action]').length>0);
 // Even if a programmatic edit omitted its input event, a failed re-solve
 // must revoke the previously signed timeline and disable ALL playback.
 $('vertices').value=originalRows.split('\n').slice(0,-1).join('\n');
 fire('solve','click');
 assert.equal($('status').dataset.status,'blocked');
 for(const id of ['pointV5Play','pointV5Pause','pointV5Prev','pointV5Next'])
  assert.equal($(id).disabled,true,id+' cannot replay stale geometry');
 assert.equal($('paper').querySelectorAll('[data-source-v5-action]').length,0);
 // Correcting the reviewed rows can create a new valid timeline.
 $('vertices').value=originalRows;
 fire('solve','click');
 assert.equal($('status').dataset.status,'ready');
 assert.equal($('pointV5Play').disabled,false);
 // The valid same-source V5 actions must be invalidated immediately.
 $('vertices').value+='\n';
 fire('vertices','input');
 assert.equal($('pointV5Play').disabled,true);
 assert.equal($('paper').querySelectorAll('[data-source-v5-action]').length,0);
 assert.equal($('confirmed').checked,false);
 // Selecting a different known-view pair never silently rewrites input.
 $('pair').value='VW';fire('pair');
 assert.equal($('pointV5Play').disabled,true);
 fire('loadExample','click');
 assert.equal($('vertices').value.trim().split(/\r?\n/).length,6);
 assert.match($('format').textContent,/W.u/);
 assert.equal($('confirmed').checked,false);
 $('confirmed').checked=true;fire('confirmed');
 fire('solve','click');
 assert.equal($('status').dataset.status,'ready',
  $('status').textContent);
 assert.match($('status').textContent,/第三视图为 H/);
 assert.equal($('pointV5Play').disabled,false);
 assert.equal($('paper').querySelectorAll(
  '[data-view="H"][data-source-edge], [data-view="H"][data-m5-hull-interval]').length,0,
  'GIVEN-first must also hold after changing the missing view');
 // Switching topology also invalidates the result and returns 8 points.
 $('shapePreset').value='box';fire('shapePreset');
 assert.equal($('vertices').value.trim().split(/\r?\n/).length,8);
 assert.equal($('confirmed').checked,false);
 assert.equal($('pointV5Play').disabled,true);
});
