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
 assert.match($('proof').textContent,/M5/);
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
 // Switching topology also invalidates the result and returns 8 points.
 $('shapePreset').value='box';fire('shapePreset');
 assert.equal($('vertices').value.trim().split(/\r?\n/).length,8);
 assert.equal($('confirmed').checked,false);
 assert.equal($('pointV5Play').disabled,true);
});
