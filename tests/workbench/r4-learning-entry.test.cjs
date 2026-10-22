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
  assert.ok(hero.includes('href="'+route+'"'),route);
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
 assert.match(home,/数字尺规只能核验相应的辅助构造和候选圆心/);
 assert.match(home,/尚未实现任意题图的 AI 自动识别与完整解题/);
 assert.match(home,/AI 识图尚未开放/);
 assert.match(home,/公开工具与私人资料分开/);
 assert.doesNotMatch(home,/<input\b[^>]*type=["']file["']/i);
 assert.doesNotMatch(home,/<form\b/i);
 assert.ok(home.includes('href="public-use.html"'));
});

test('V3.1 sole homepage positioning is AI geometry solving with mathematics-first rollout',()=>{
 assert.match(home,/<title>DraftAI · AI 工程制图自动解题与动态作图<\/title>/);
 assert.match(home,/上传工程图题，自动求解并动态作图/);
 assert.match(home,/唯一主线：识图 → 确认 → 数学 → 真实步骤 → 动画/);
 assert.match(home,/先验收数学基础和二维真实求解/);
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
