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
