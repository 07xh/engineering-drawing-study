'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const {parseHTML}=require('linkedom');
const {enhancePage}=require('../../ui-next/enhance-page.cjs');const {initUI}=require('../../ui-next/ui-next.js');
for(const initial of [false,true])test('panels follow viewport changes without altering input; initially '+(initial?'wide':'narrow'),()=>{
 const {document}=parseHTML(enhancePage(fs.readFileSync('labs/auto-fillet-live.html','utf8'),{page:'labs/auto-fillet-live.html'}));
 let changed;const media={matches:initial,addEventListener:(type,cb)=>{if(type==='change')changed=cb;}};
 const old=document.defaultView.matchMedia;document.defaultView.matchMedia=()=>media;
 try{
  initUI(document);const workspace=document.querySelector('.next-workspace');const input=document.querySelector('#vectorFilletRadius');input.value='37';
  assert.equal(typeof changed,'function');
  media.matches=!initial;changed({matches:media.matches});
  if(media.matches){assert.equal(workspace.dataset.nextSide,'both');assert.equal(document.querySelector('[data-next-panel=conditions]').hidden,false);assert.equal(document.querySelector('[data-next-panel=steps]').hidden,false);}
  else {assert.notEqual(workspace.dataset.nextSide,'both');assert.equal(document.querySelectorAll('[data-next-panel]:not([hidden])').length,1);}
  assert.equal(input.value,'37');
  media.matches=initial;changed({matches:initial});
  assert.equal(input.value,'37');
  assert.equal(workspace.dataset.nextSide==='both',initial);
 }finally{if(old===undefined)delete document.defaultView.matchMedia;else document.defaultView.matchMedia=old;}
});
test('shrinking keeps the only open steps panel visible',()=>{
 const {document}=parseHTML(enhancePage(fs.readFileSync('labs/auto-fillet-live.html','utf8'),{page:'labs/auto-fillet-live.html'}));
 let changed;const media={matches:true,addEventListener:(_,fn)=>changed=fn};const old=document.defaultView.matchMedia;document.defaultView.matchMedia=()=>media;
 try{initUI(document);document.querySelector('[data-next-open-panel=conditions]').click();media.matches=false;changed({matches:false});assert.equal(document.querySelector('.next-workspace').dataset.nextSide,'steps');assert.equal(document.querySelector('[data-next-panel=steps]').hidden,false);}
 finally{if(old===undefined)delete document.defaultView.matchMedia;else document.defaultView.matchMedia=old;}
});
test('expanding keeps a deliberately collapsed panel closed',()=>{
 const {document}=parseHTML(enhancePage(fs.readFileSync('labs/auto-fillet-live.html','utf8'),{page:'labs/auto-fillet-live.html'}));
 let changed;const media={matches:false,addEventListener:(_,fn)=>changed=fn};const old=document.defaultView.matchMedia;document.defaultView.matchMedia=()=>media;
 try{initUI(document);document.querySelector('[data-next-open-panel=steps]').click();document.querySelector('[data-next-close-panel]').click();media.matches=true;changed({matches:true});assert.equal(document.querySelector('.next-workspace').dataset.nextSide,'none');}
 finally{if(old===undefined)delete document.defaultView.matchMedia;else document.defaultView.matchMedia=old;}
});
test('shrinking retains the panel containing keyboard focus',()=>{
 const {document}=parseHTML(enhancePage(fs.readFileSync('labs/auto-fillet-live.html','utf8'),{page:'labs/auto-fillet-live.html'}));
 let changed;const media={matches:true,addEventListener:(_,fn)=>changed=fn};const old=document.defaultView.matchMedia;document.defaultView.matchMedia=()=>media;
 try{initUI(document);Object.defineProperty(document,'activeElement',{configurable:true,value:document.querySelector('#stepList')});media.matches=false;changed({matches:false});assert.equal(document.querySelector('.next-workspace').dataset.nextSide,'steps');}
 finally{if(old===undefined)delete document.defaultView.matchMedia;else document.defaultView.matchMedia=old;}
});
