'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');const {initUI}=require('../../ui-next/ui-next.js');
const order=d=>[...d.querySelector('.v7-layout').children].map(e=>e.id||'steps');
test('home DOM follows visible order across phone and desktop without replacing input',()=>{
 const {document}=parseHTML('<html><body>'+homeHTML()+'</body></html>');let changed;const media={matches:true,addEventListener:(type,fn)=>{if(type==='change')changed=fn;}};
 const old=document.defaultView.matchMedia;document.defaultView.matchMedia=q=>q.includes("860px")?media:{matches:false};
 try{const input=document.getElementById('v7-x');input.value='27';initUI(document);
  assert.deepEqual(order(document),['v7-paper-section','v7-input-section','steps']);
  media.matches=false;changed({matches:false});assert.deepEqual(order(document),['v7-input-section','v7-paper-section','steps']);
  assert.equal(document.getElementById('v7-x'),input);assert.equal(input.value,'27');
 }finally{if(old===undefined)delete document.defaultView.matchMedia;else document.defaultView.matchMedia=old;}
});
test('viewport change does not move a focused condition until focus leaves',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');let changed;const media={matches:false,addEventListener:(type,fn)=>{if(type==='change')changed=fn;}};
 const old=document.defaultView.matchMedia;document.defaultView.matchMedia=q=>q.includes("860px")?media:{matches:false};let active=document.getElementById('v7-x');Object.defineProperty(document,'activeElement',{configurable:true,get:()=>active});
 try{initUI(document);media.matches=true;changed({matches:true});assert.deepEqual(order(document),['v7-input-section','v7-paper-section','steps']);
  active=null;document.getElementById('v7-input-section').dispatchEvent(new window.Event('focusout',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,0));
  assert.deepEqual(order(document),['v7-paper-section','v7-input-section','steps']);
 }finally{if(old===undefined)delete document.defaultView.matchMedia;else document.defaultView.matchMedia=old;}
});
test('expanded paper view keeps keyboard order consistent on desktop',async()=>{
 const {document}=parseHTML('<html><body>'+homeHTML()+'</body></html>');const old=document.defaultView.matchMedia;document.defaultView.matchMedia=()=>({matches:false});
 try{initUI(document);const layout=document.querySelector('.v7-layout');layout.classList.add('v8-paper-focus');document.getElementById('v8-paper-focus').click();await Promise.resolve();assert.deepEqual(order(document),['v7-paper-section','v7-input-section','steps']);
 layout.classList.remove('v8-paper-focus');document.getElementById('v8-paper-focus').click();await Promise.resolve();assert.deepEqual(order(document),['v7-input-section','v7-paper-section','steps']);
 }finally{if(old===undefined)delete document.defaultView.matchMedia;else document.defaultView.matchMedia=old;}
});
