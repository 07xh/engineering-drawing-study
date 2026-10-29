'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
test('workspace headings and tool entries describe user tasks without implementation versions',()=>{
 const {document}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 for(const selector of ['#v7-title','.v7-head','.v7-steps h2','.next-tool-card']){
  for(const node of document.querySelectorAll(selector))assert.doesNotMatch(node.textContent,/V5|V7|OCCT|Geometry Scene|GitHub Actions/,selector);
 }
 assert.ok(document.querySelector('#v7-task'));
 assert.ok(document.querySelector('#v7-proof'));
});
test('task guidance explains capabilities without internal engine labels',()=>{
 const {document}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 for(const node of document.querySelectorAll('.v7-warning,.v7-note,.v8-course-summary'))
  assert.doesNotMatch(node.textContent,/\b(?:V5|M3|M5|C1|C2|C3)\b|Geometry Scene|ConstructionIntent/,node.textContent.trim());
});
test('drawing and step controls stay together without duplicate control ids',()=>{
 const {document}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const paper=document.querySelector('.v7-paper');
 assert.ok(paper.contains(document.querySelector('.v7-steps')),'steps remain next to the drawing');
 for(const id of ['v7-sheet','v7-play','v7-back','v7-next','v7-step-list'])assert.equal(document.querySelectorAll('#'+id).length,1,id);
});
test('the current drawing step is placed before optional details',()=>{
 const {document}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const steps=document.getElementById('v7-step-list');
 const details=document.querySelector('.v8-proof-details');
 assert.ok(steps.compareDocumentPosition(details)&4,'current steps precede optional proof');
});
test('mobile users can jump directly between conditions, drawing and steps',()=>{
 const {document}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const nav=document.querySelector('nav[aria-label="工作台快捷导航"]');assert.ok(nav);
 for(const target of ['#v7-input-section','#v7-paper-section','#v7-step-list']){
  assert.ok(nav.querySelector('a[href="'+target+'"]'),target);
  assert.ok(document.querySelector(target),target+' target');
 }
});
