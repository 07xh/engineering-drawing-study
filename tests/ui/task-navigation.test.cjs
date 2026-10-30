'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {enhancePage}=require('../../ui-next/enhance-page.cjs');
const fs=require('node:fs');
for(const page of ['index.html','labs/circle-fillet-live.html']) test(`${page} offers distinct task navigation`,()=>{
 const html=fs.readFileSync(page,'utf8');
 const {document}=parseHTML(enhancePage(html,{page,preview:false}));
 const nav=document.querySelector('.next-topbar nav[aria-label="主要导航"]');
 assert.ok(nav);
 const links=[...nav.querySelectorAll('a')];
 assert.deepEqual(links.map(a=>a.textContent.trim()),['解题','工具']);
 assert.match(links[0].getAttribute('href'),/^(?:\.\.\/index\.html)?#project-workbench$/);
 assert.match(links[1].getAttribute('href'),/^(?:\.\.\/index\.html)?#tools$/);
 assert.equal(document.querySelector('.next-sidebar'),null);
});
test('specialist and help pages identify their current section',()=>{
 for(const [page,label] of [['labs/circle-fillet-live.html','工具'],['public-use.html','帮助']]){
  const {document}=parseHTML(enhancePage(fs.readFileSync(page,'utf8'),{page,preview:false}));
  assert.equal(document.querySelector('[aria-current="page"]')?.textContent.trim(),label);
 }
});
test('tool navigation reveals tool list without changing entered values',()=>{
 const {document}=parseHTML(enhancePage(fs.readFileSync('index.html','utf8'),{page:'index.html'}));
 const {syncNavigation}=require('../../ui-next/ui-next.js');
 const input=document.getElementById('v7-x');input.setAttribute('value','27');
 syncNavigation(document,'#tools');
 assert.ok(document.body.classList.contains('next-show-tools'));
 syncNavigation(document,'#all-tools');
 assert.ok(document.getElementById('all-tools').hasAttribute('open'));
 syncNavigation(document,'#project-workbench');
 assert.ok(!document.body.classList.contains('next-show-tools'));
 assert.equal(input.getAttribute('value'),'27');
});

test('home links do not reload the active project',()=>{
 const {document}=parseHTML(enhancePage(fs.readFileSync('index.html','utf8'),{page:'index.html'}));
 assert.deepEqual([...document.querySelectorAll('.next-task-nav a')].map(a=>a.getAttribute('href')),['#project-workbench','#tools']);
});
test('brand returns to workbench without reloading current home session',()=>{
 const {document}=parseHTML(enhancePage(fs.readFileSync('index.html','utf8'),{page:'index.html'}));
 assert.equal(document.querySelector('.next-brand').getAttribute('href'),'#project-workbench');
});
