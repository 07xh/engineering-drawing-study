'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8');
const home=read('index.html');
const build=read('scripts/build-static.cjs');
test('mathematical two MVP lesson URLs are available from primary nav and hero',()=>{
 const nav=home.match(/<nav class="site-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
 const hero=home.match(/<section class="hero-main">([\s\S]*?)<\/section>/)?.[1];
 assert.ok(nav);assert.ok(hero);
 for(const route of ['labs/point-projection-live.html','labs/circle-fillet-live.html']){
  assert.ok(nav.includes('href="'+route+'"'),route);
  assert.ok(hero.includes('href="'+route+'"'),route);
 }
 assert.match(home,/智能尺规作图/);
 assert.match(home,/三面投影 · 动态数学教学/);
});
test('existing study companion, modeler and separate experiments remain navigable',()=>{
 for(const route of ['labs/point-coach.html','labs/free-modeler.html',
  'labs/dof-lab-v2.html','labs/tangent-constraint.html',
  'labs/paper-geometry.html','labs/composite-geometry.html'])
  assert.ok(home.includes('href="'+route+'"'),route);
});
test('public homepage does not claim unrestricted geometry or complete student proof',()=>{
 assert.match(home,/学生数字尺规目前只核验相应的辅助构造/);
 assert.match(home,/不能替代整道工程制图题目的完整数学证明/);
 assert.match(home,/AI 识图尚未开放/);
 assert.match(home,/公开工具与私人资料分开/);
 assert.doesNotMatch(home,/<input\b[^>]*type=["']file["']/i);
 assert.doesNotMatch(home,/<form\b/i);
 assert.ok(home.includes('href="public-use.html"'));
});
test('R4 navigation changes do not modify public bundling whitelist or private textbook assets',()=>{
 for(const asset of ['labs/point-projection-live.html','labs/circle-fillet-live.html',
  'labs/free-modeler.html','labs/point-coach.html'])
  assert.ok(build.includes("'"+asset+"'"),asset);
 for(const secret of ['knowledge/index.html','labs/verified-exercises.js','src/data/settings.json'])
  assert.ok(!build.includes("'"+secret+"'"),secret);
});
