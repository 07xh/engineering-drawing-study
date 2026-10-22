'use strict';
/** F0 / #377: existing public learning tools must remain reachable and
 * honest about the mathematical gate. This is a static integration contract,
 * NOT a browser, Android or production deployment acceptance test.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');
const build=read('scripts/build-static.cjs');

const tools=[
 {page:'labs/auto-fillet-live.html',bundle:'labs/auto-fillet-live-bundle.js',entry:'labs/auto-fillet-live-entry.cjs'},
 {page:'labs/circle-fillet-live.html',bundle:'labs/circle-fillet-live-bundle.js',entry:'labs/circle-fillet-live-entry.cjs'},
 {page:'labs/point-projection-live.html',bundle:'labs/point-projection-live-bundle.js',entry:'labs/point-projection-live-entry.cjs'}
];
test('F0 three existing public tools are explicitly allowlisted and bundled',()=>{
 for(const tool of tools){
  assert.ok(fs.existsSync(tool.page),tool.page);
  assert.ok(fs.existsSync(tool.entry),tool.entry);
  assert.ok(build.includes("'"+tool.page+"'"),tool.page+' missing public allowlist');
  assert.ok(build.includes("labs/"+tool.bundle.split('/').at(-1)),tool.bundle+' missing build target');
  assert.ok(build.includes("labs/"+tool.entry.split('/').at(-1)),tool.entry+' missing bundle entry');
  assert.ok(read(tool.page).includes('src="'+tool.bundle.split('/').at(-1)+'"'),tool.page+' not loading its bundle');
 }
});

test('F0 main 2D page exposes branch, direction, playback and proof status',()=>{
 const html=read('labs/auto-fillet-live.html');
 for(const id of ['branch','direction','status','result','prev','play','next','progress','speed','stepList','stepDetail']){
  assert.ok(html.includes('id="'+id+'"'),'missing '+id);
 }
 const entry=read('labs/auto-fillet-live-entry.cjs');
 assert.match(entry,/solveFiniteFillet/);
 assert.match(entry,/createConfirmedFilletSession/);
 assert.match(entry,/session\.canRender\(snap\.revision\)/);
 assert.match(entry,/result\.mathematicallyVerified===true/);
 assert.match(entry,/snap\.playback\?\.revision===snap\.revision/);
 assert.match(entry,/result\.steps/);
 assert.match(entry,/Motion\.updateSvg/);
 assert.match(entry,/requires-branch/);
 assert.match(entry,/invalid-input/);
});

test('F0 no unreviewed mathematical answer or proof is inferred from a static HTML shell',()=>{
 const entry=read('labs/auto-fillet-live-entry.cjs');
 assert.match(entry,/checked\.status==='ready-for-math'/);
 assert.match(entry,/return checked\.status==='ready-for-math'\?checked\.input:null/);
 assert.match(entry,/if\(verified\)/);
 assert.ok(entry.includes("$('result').hidden=!verified;"), 'verified result visibility guard missing');
});
