'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {homeHTML}=require('../../ui-next/home.cjs');

function courseSection(){
 const full=homeHTML();
 const start=full.indexOf('<section class="v7-course-entry"');
 const end=full.indexOf('<div class="v7-bar"',start);
 assert.ok(start>=0 && end>start,'course entry must be before V7 project operations');
 return {full,html:full.slice(start,end)};
}
function hrefs(section){
 return [...section.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
}
test('C0 course-first paths are in the actual production V7 workbench template',()=>{
 const {full,html}=courseSection();
 assert.ok(full.indexOf('id="project-workbench"')<full.indexOf('id="v7-course-entry"'));
 assert.ok(full.indexOf('id="v7-course-entry"')<full.indexOf('id="v7-projects"'));
 assert.deepEqual([...html.matchAll(/data-course="([^"]+)"/g)].map(m=>m[1]),
  ['intersection','composition','third-view']);
 for(const id of ['v7-projects','v7-image-input','v7-task','v7-solve','v7-sheet','v7-3d','v7-play']){
  assert.ok(full.includes('id="'+id+'"'),id+' must remain in original workbench');
 }
});
test('C0 links reach existing public tools and never navigate the active project',()=>{
 const {html}=courseSection();
 assert.deepEqual(hrefs(html),[
  'labs/composite-geometry.html?mode=intersection',
  '#v7-task',
  'labs/composite-geometry.html?mode=composite',
  'labs/point-projection-live.html'
 ]);
 const build=fs.readFileSync('scripts/build-static.cjs','utf8');
 for(const href of hrefs(html).filter(h=>h.startsWith('labs/'))){
  const file=href.split('?')[0];
  assert.ok(fs.existsSync(file),file+' missing from repository');
  assert.ok(build.includes("'"+file+"'"),file+' absent from public allowlist');
 }
 const externalTags=[...html.matchAll(/<a\b[^>]*href="labs\/[^"]+"[^>]*>/g)].map(m=>m[0]);
 assert.equal(externalTags.length,3);
 for(const tag of externalTags){
  assert.match(tag,/target="_blank"/);
  assert.match(tag,/rel="noopener noreferrer"/);
 }
});
test('C0 differentiates original demonstrations from certified engineering answers',()=>{
 const {html}=courseSection();
 assert.match(html,/有限端盖、完整遮挡与标准虚实线未认证/);
 assert.match(html,/非组合体标准答案/);
 assert.match(html,/非任意形体补视图/);
 assert.match(html,/不会切换本机项目题型、删除已确认条件/);
 assert.doesNotMatch(html,/<button\b|<form\b/i);
});
test('C0 responsive accessibility contract preserves existing V7 layout',()=>{
 const css=fs.readFileSync('project/workbench-ui.css','utf8');
 assert.match(css,/\.v7-course-grid\{display:grid/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/\.v7-course-card a:focus-visible/);
 const {html}=courseSection();
 assert.match(html,/aria-labelledby="v7-course-title"/);
 assert.match(html,/<h2 id="v7-course-title">/);
 assert.equal([...html.matchAll(/role="listitem"/g)].length,3);
});
