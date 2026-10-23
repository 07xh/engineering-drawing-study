'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8');
const home=read('index.html');
const build=read('scripts/build-static.cjs');
test('verified mathematics MVP routes remain reachable during AI product transition',()=>{
 const nav=home.match(/<nav class="site-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
 const hero=home.match(/<section class="hero-main">([\s\S]*?)<\/section>/)?.[1];
 assert.ok(nav);assert.ok(hero);
 for(const route of ['labs/point-projection-live.html','labs/circle-fillet-live.html']){
  assert.ok(nav.includes('href="'+route+'"'),route);
  assert.ok(hero.includes('href="'+route+'"')||home.includes('<a class="tool-card" href="'+route+'"'),route);
 }
 assert.match(home,/智能尺规作图/);
 assert.match(home,/三面投影 · 动态数学求解/);
});
test('existing study companion, modeler and separate experiments remain navigable',()=>{
 for(const route of ['labs/point-coach.html','labs/free-modeler.html',
  'labs/dof-lab-v2.html','labs/tangent-constraint.html',
  'labs/paper-geometry.html','labs/composite-geometry.html'])
  assert.ok(home.includes('href="'+route+'"'),route);
});
test('V3.1 homepage discloses solver limits, privacy boundary and unavailable image upload',()=>{
 assert.match(home,/当前不支持上传任意题图后自动完成解答/);
 assert.match(home,/图片自动识别仍在开发中/);
 assert.match(home,/部分题型仍在完善中/);
 assert.match(home,/href="public-use.html"/);
 assert.doesNotMatch(home,/<input\b[^>]*type=["']file["']/i);
 assert.doesNotMatch(home,/<form\b/i);
 assert.ok(home.includes('href="public-use.html"'));
});

test('V3.1 sole homepage positioning is AI geometry solving with mathematics-first rollout',()=>{
 assert.match(home,/<title>DraftAI · AI 工程制图自动解题与动态作图<\/title>/);
 assert.match(home,/工程制图解题 · 动态作图/);
 assert.match(home,/选择题型、调整条件，查看逐笔作图过程/);
 assert.match(home,/class="ui-refresh workbench-blue"/);
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
