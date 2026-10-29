'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {enhancePage}=require('../../ui-next/enhance-page.cjs');
const {syncNavigation}=require('../../ui-next/ui-next.js');
const fs=require('fs');
test('navigation reflects the selected section without resetting project input',()=>{
 const {document}=parseHTML(enhancePage(fs.readFileSync('index.html','utf8'),{page:'index.html'}));
 const input=document.getElementById('v7-x');input.setAttribute('value','27');
 const links=[...document.querySelectorAll('.next-sidebar nav a')];
 for(const [hash,label] of [['','工作台'],['#recent','我的项目'],['#tools','题型工具'],['#project-workbench','工作台']]){
  syncNavigation(document,hash);
  assert.equal(links.find(a=>a.getAttribute('aria-current')==='page')?.getAttribute('aria-label'),label);
  assert.equal(input.getAttribute('value'),'27');
 }
});
