'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {enhancePage}=require('../../ui-next/enhance-page.cjs');
const {syncNavigation}=require('../../ui-next/ui-next.js');
const fs=require('fs');
test('navigation reflects the selected section without resetting project input',()=>{
 const {document}=parseHTML(enhancePage(fs.readFileSync('index.html','utf8'),{page:'index.html'}));
 const input=document.getElementById('v7-x');input.setAttribute('value','27');
 const links=[...document.querySelectorAll('[data-task-nav]')];
 for(const [hash,label] of [['','解题'],['#recent','解题'],['#tools','工具'],['#project-workbench','解题']]){
  syncNavigation(document,hash);
  assert.equal(links.find(a=>a.getAttribute('aria-current')==='page')?.getAttribute('data-task-nav'),label);
  assert.equal(input.getAttribute('value'),'27');
 }
});
