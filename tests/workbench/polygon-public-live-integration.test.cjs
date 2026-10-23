'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('07 actual public polygon page binds verified M3 -> canonical Intent -> existing V5',()=>{
 const source=read('labs/polygon-live-entry.cjs');
 assert.match(source,/require\('\.\.\/workbench\/unified-math-pipeline\.cjs'\)/);
 assert.match(source,/evaluateUnifiedMath\(\{kind:'inscribed-polygon',input,sheet,revision\}\)/);
 assert.match(source,/Timeline\.createPlayer\(result\.timing/);
 assert.match(source,/Motion\.updateSvg\(el,action,fraction\)/);
 assert.match(source,/player\.invalidate\(revision,now\(\)\)/);
 assert.match(source,/player\.seekStep/);
 assert.match(source,/player\.seekProgress/);
 assert.match(source,/player\.setSpeed/);
 assert.match(source,/sourceConfirmed:\$\('polygonConfirm'\)\.checked/);
 assert.doesNotMatch(source,/function\s+(?:regularPolygonInCircle|compileTimeline)\s*\(/);
 assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|localStorage/);
});
test('07 controls and action selection exist on public page without private material',()=>{
 const page=read('labs/polygon-live.html');
 const ids=['polygonSides','polygonX','polygonY','polygonRadius',
  'polygonAngle','polygonDirection','polygonConfirm','polygonSolve',
  'polygonPlay','polygonBack','polygonForward','polygonRestart',
  'polygonSpeed','polygonSeek','polygonMono','polygonFocus',
  'polygonStatus','polygonProof','polygonStepList','polygonStepLabel',
  'polygonSvg','polygonDraw','polygonPicked'];
 for(const id of ids)assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(page,/polygon-live-bundle\.js/);
 assert.match(page,/暂不支持任意图片自动识别/);
 assert.doesNotMatch(page,/教材答案图片|答案扫描|API_KEY|sk-[a-zA-Z0-9]/);
});
test('07 public build includes opt-in tool only through existing esbuild and whitelist',()=>{
 const build=read('scripts/build-static.cjs');
 const home=read('index.html');
 assert.match(build,/'labs\/polygon-live\.html'/);
 assert.match(build,/entryPoints:\[path\.join\(root,'labs\/polygon-live-entry\.cjs'\)\]/);
 assert.match(build,/outfile:path\.join\(out,'labs\/polygon-live-bundle\.js'\)/);
 assert.match(home,/href="labs\/polygon-live\.html"/);
 assert.doesNotMatch(build,/'tests\/workbench\/polygon-canonical-intent-v5\.test\.cjs'/);
});
