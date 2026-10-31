'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');const {homeHTML}=require('../../ui-next/home.cjs');
test('home keeps solving and real tools without placeholder project cards or marketing illustrations',()=>{
 const {document}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 assert.ok(document.querySelector('#project-workbench #v7-projects'));
 assert.ok(document.querySelector('#project-workbench #v7-sheet'));
 assert.ok(document.querySelector('#tools a[href="labs/circle-fillet-live.html"]'));
 assert.ok(!document.querySelector('.v8-project-strip'));
 assert.doesNotMatch(document.body.textContent,/暂无可恢复的解题记录|历史进度同步尚未接入|个人工程制图工作台/);
});
test('legacy project anchors and all public tools remain reachable',()=>{
 const {document}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 for(const id of ['recent','knowledge'])assert.ok(document.getElementById(id).closest('.v7-bar'));
 assert.ok(document.querySelector('#tools a[href="labs/finite-cylinder-intersection-live.html"]'));
});
