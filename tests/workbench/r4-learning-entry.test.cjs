'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8');
const home=read('index.html');
const build=read('scripts/build-static.cjs');
test('verified mathematics MVP routes remain reachable during AI product transition',()=>{
 const nav=home.match(/<nav class="site-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
 const hero=home.match(/<section class="df-hero"[^>]*>([\s\S]*?)<\/section>/)?.[1];
 assert.ok(nav);assert.ok(hero);
 for(const route of ['labs/point-projection-live.html','labs/circle-fillet-live.html']){
  assert.ok(nav.includes('href="'+route+'"'),route);
  assert.ok(hero.includes('href="'+route+'"')||home.includes('href="'+route+'"><span class="df-tool-icon"'),route);
 }
 assert.match(home,/圆弧连接/);
 assert.match(home,/点的三面投影/);
});
test('existing study companion, modeler and separate experiments remain navigable',()=>{
 for(const route of ['labs/point-coach.html','labs/free-modeler.html',
  'labs/dof-lab-v2.html','labs/tangent-constraint.html',
  'labs/paper-geometry.html','labs/composite-geometry.html'])
  assert.ok(home.includes('href="'+route+'"'),route);
});
test('V3.1 homepage discloses solver limits, privacy boundary and unavailable image upload',()=>{
 assert.match(home,/通用图片上传、任意新题自动识别/);
 assert.match(home,/任意图片 AI 自动解题功能仍在开发中/);
 assert.match(home,/当前开放范围/);
 assert.match(home,/href="public-use.html"/);
 assert.doesNotMatch(home,/<input\b[^>]*type=["']file["']/i);
 assert.doesNotMatch(home,/<form\b/i);
 assert.ok(home.includes('href="public-use.html"'));
});

test('V3.1 sole homepage positioning is AI geometry solving with mathematics-first rollout',()=>{
 assert.match(home,/<title>绘序 · DraftFlow｜AI 工程制图推理与动态作图<\/title>/);
 assert.match(home,/让工程制图的每一步/);
 assert.match(home,/从已知条件出发，计算几何关系/);
 assert.match(home,/class="ui-refresh workbench-blue draftflow-home"/);
 assert.ok(home.indexOf('id="ai"')<home.indexOf('id="tools"'));
 assert.doesNotMatch(home,/三面投影 · 动态数学教学/);
});
test('R4 navigation changes do not modify public bundling whitelist or private textbook assets',()=>{
 for(const asset of ['labs/point-projection-live.html','labs/circle-fillet-live.html',
  'labs/free-modeler.html','labs/point-coach.html'])
  assert.ok(build.includes("'"+asset+"'"),asset);
 for(const secret of ['knowledge/index.html','labs/verified-exercises.js','src/data/settings.json'])
  assert.ok(!build.includes("'"+secret+"'"),secret);
});
