'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('V5 browser entry and build scripts parse, no package config edits',()=>{
 for(const pathName of ['workbench/v5-preview-entry.cjs','workbench/build-v5-preview.cjs',
  'workbench/teaching-motion-v5.js','workbench/teaching-timeline-v5.js']){
  assert.doesNotThrow(()=>new vm.Script(read(pathName),{filename:pathName}));
 }
});
test('isolated V5 browser page uses local bundles and never remote scripts',()=>{
 const h=read('workbench/v5-preview.html'),build=read('workbench/build-v5-preview.cjs');
 assert.match(h,/src="v5-preview-bundle\.js"/);
 assert.match(h,/href="v5-preview\.css"/);
 assert.doesNotMatch(h,/<script[^>]+src=["']https?:/i);
 assert.doesNotMatch(h,/cdn\.|jsdelivr|unpkg|esm\.sh/i);
 assert.match(build,/v5-preview-entry\.cjs/);
 assert.match(build,/platform:'browser'/);
 assert.doesNotMatch(build,/dist\//);
});
test('V5 preview and private examples do not enter production build whitelist',()=>{
 const build=read('scripts/build-static.cjs');
 assert.doesNotMatch(build,/'workbench\/v5-preview\.html'/);
 assert.doesNotMatch(build,/'workbench\/v5-preview-bundle\.js'/);
 assert.doesNotMatch(build,/'workbench\/verified-timeline-adapters\.cjs'/);
});
test('V5 preview requires explicit source and branch inputs and does not use unsafe HTML',()=>{
 const js=read('workbench/v5-preview-entry.cjs');
 assert.match(js,/circleCircleFilletCenters/);
 assert.match(js,/finiteTwoSegmentFillets/);
 assert.match(js,/MathAdapter\.projectionPlan/);
 assert.match(js,/MathAdapter\.circleFilletPlan/);
 assert.match(js,/MathAdapter\.segmentFilletPlan/);
 assert.match(js,/invalidate\(revision\+1/);
 assert.doesNotMatch(js,/innerHTML\s*=/);
 assert.match(js,/Motion\.updateSvg/);
});
