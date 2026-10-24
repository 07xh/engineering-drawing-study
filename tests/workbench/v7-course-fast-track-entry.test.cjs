'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');

function doc(){
 return parseHTML('<!doctype html><html lang="zh-CN"><body>'+homeHTML()+'</body></html>').document;
}
test('C0 course-first paths are actually inside the production V7 project workspace',()=>{
 const d=doc(),section=d.querySelector('#v7-course-entry');
 assert.ok(section);
 assert.ok(d.querySelector('#project-workbench').contains(section));
 assert.equal(section.querySelectorAll('[data-course]').length,3);
 assert.deepEqual([...section.querySelectorAll('[data-course]')].map(n=>n.dataset.course),
  ['intersection','composition','third-view']);
 for(const id of ['v7-projects','v7-image-input','v7-task','v7-solve','v7-sheet','v7-3d','v7-play']){
  assert.ok(d.getElementById(id),id+' must remain in original workbench');
 }
});
test('C0 all links resolve to already-built public capabilities, never empty or fake solver URLs',()=>{
 const d=doc(),s=d.querySelector('#v7-course-entry');
 const links=[...s.querySelectorAll('a')];
 const hrefs=links.map(a=>a.getAttribute('href'));
 assert.deepEqual(hrefs,[
  'labs/composite-geometry.html?mode=intersection',
  '#v7-task',
  'labs/composite-geometry.html?mode=composite',
  'labs/point-projection-live.html'
 ]);
 const build=fs.readFileSync('scripts/build-static.cjs','utf8');
 for(const href of hrefs.filter(h=>h.startsWith('labs/'))){
  const file=href.split('?')[0];
  assert.ok(fs.existsSync(file),file+' unavailable in repository');
  assert.ok(build.includes("'"+file+"'"),file+' absent from public allowlist');
 }
 for(const a of links.filter(a=>a.getAttribute('href')!=='#v7-task')){
  assert.equal(a.getAttribute('target'),'_blank','experiment must not navigate active project');
  assert.match(a.getAttribute('rel'),/\bnoopener\b/);
  assert.match(a.getAttribute('rel'),/\bnoreferrer\b/);
 }
});
test('C0 clearly distinguishes mathematics demos from full verified solutions',()=>{
 const d=doc(),s=d.querySelector('#v7-course-entry');
 assert.match(s.textContent,/有限端盖、完整遮挡与标准虚实线未认证/);
 assert.match(s.textContent,/非组合体标准答案/);
 assert.match(s.textContent,/非任意形体补视图/);
 assert.match(s.textContent,/不会切换本机项目题型、删除已确认条件/);
 assert.ok(!s.querySelector('button'),'course nav must not silently mutate project');
 assert.ok(!s.querySelector('form'),'course nav is not a second math form');
});
test('C0 mobile/tablet layout and accessible labels use existing V7 CSS',()=>{
 const css=fs.readFileSync('project/workbench-ui.css','utf8');
 assert.match(css,/\.v7-course-grid\{display:grid/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/\.v7-course-card a:focus-visible/);
 const s=doc().querySelector('#v7-course-entry');
 assert.equal(s.getAttribute('aria-labelledby'),'v7-course-title');
 assert.ok(s.querySelector('h2#v7-course-title'));
 assert.equal(s.querySelector('[role=list]').querySelectorAll('[role=listitem]').length,3);
});
