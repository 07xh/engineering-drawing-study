'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createPrismV5SvgScene:create}=
 require('../../engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs');
const point=(x,y,z)=>({x,y,z});
const box=()=>({min:point(0,0,0),max:point(10,10,10)});
const plane=()=>({point:point(0,0,12),normal:point(1,1,1)});
const rays=()=>({V:point(0,-1,0),H:point(0,0,1),W:point(-1,0,0)});
function make({confirmed=false,b=box(),pl=plane(),directions=rays()}={}){
 return create(b,pl,{revision:5,...(confirmed?{
  retainedHalfspace:'positive',observerDirections:directions
 }:{})});
}
const whole=s=>s.renderFrame({elapsedMs:s.totalMs,expectedRevision:5});
function firstStroke(f){
 const m=f.svg.match(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"[^>]*data-action="(prism-section-[1-6]-[VHW])"/);
 assert.ok(m,'real mathematical result line must be rendered');
 return {p:{x:(Number(m[1])+Number(m[3]))/2,y:(Number(m[2])+Number(m[4]))/2},id:m[5]};
}
test('04 trusted mathematical prism SVG strokes map back to real V5 step identifiers',()=>{
 const s=make({confirmed:true}),f=whole(s),a=firstStroke(f);
 const hit=s.inspectAt({...a.p,elapsedMs:s.totalMs,expectedRevision:5,tolerancePx:5});
 assert.ok(hit);
 assert.equal(hit.layer,'result');
 assert.match(hit.actionId,/^prism-section-/);
 assert.ok(hit.stepIndex>=0&&hit.stepIndex<s.stepCount);
 assert.equal(hit.stepId,s.steps[hit.stepIndex].id);
 assert.match(hit.sourceSectionEdgeId,/^section-edge-/);
 assert.ok(['visible','hidden','undetermined'].includes(hit.visibility));
 assert.ok(hit.seekMs>=s.steps[hit.stepIndex].startMs);
 assert.ok(hit.seekMs<s.steps[hit.stepIndex].endMs);
});
test('04 the same future answer is not selectable at V5 time zero',()=>{
 const s=make({confirmed:true}),a=firstStroke(whole(s));
 const hit=s.inspectAt({...a.p,elapsedMs:0,expectedRevision:5,tolerancePx:3});
 assert.ok(hit===null||hit.layer==='given');
 const at0=s.renderFrame({elapsedMs:0,expectedRevision:5});
 assert.equal(at0.counts.results,0);
});
test('04 source geometric coordinates determine bounded, aspect-preserving focus viewport',()=>{
 const s=make(),a=firstStroke(whole(s));
 const one=s.focusOnAction({actionId:a.id,expectedRevision:5});
 const ratio=960/680;
 for(const f of [one,...[0,2,6,s.stepCount-1].map(stepIndex=>
  s.focusOnStep({stepIndex,expectedRevision:5}))]){
  assert.ok(f.x>=0&&f.y>=0);
  assert.ok(f.width>=320&&f.width<=960);
  assert.ok(f.height>0&&f.height<=680);
  assert.ok(f.x+f.width<=960.000001);
  assert.ok(f.y+f.height<=680.000001);
  assert.ok(Math.abs(f.width/f.height-ratio)<1e-9);
  assert.equal(f.viewBox.split(' ').length,4);
 }
});
test('04 picking same geometry in uncertain mode never invents a signed-off visibility class',()=>{
 const s=make(),a=firstStroke(whole(s));
 const hit=s.inspectAt({...a.p,elapsedMs:s.totalMs,expectedRevision:5,tolerancePx:4});
 assert.ok(hit);assert.equal(hit.layer,'result');
 assert.equal(hit.visibility,'undetermined');
 assert.equal(s.visibilityEvidenceMode,'unconfirmed');
});
test('04 invalid pointer positions, unknown action ID, negative step or stale revisions fail closed',()=>{
 const s=make({confirmed:true}),a=firstStroke(whole(s));
 assert.throws(()=>s.focusOnAction({actionId:'fake',expectedRevision:5}),/trusted/);
 assert.throws(()=>s.focusOnStep({stepIndex:-1,expectedRevision:5}),/unknown/);
 assert.throws(()=>s.focusOnStep({stepIndex:s.stepCount,expectedRevision:5}),/unknown/);
 assert.throws(()=>s.inspectAt({...a.p,elapsedMs:0,expectedRevision:4}),/stale/);
 assert.throws(()=>s.inspectAt({x:-2,y:1,elapsedMs:0,expectedRevision:5}),/invalid/);
 assert.throws(()=>s.inspectAt({x:20,y:20,elapsedMs:0,expectedRevision:5,
  tolerancePx:100}),/invalid/);
 assert.throws(()=>s.inspectAt({x:NaN,y:20,elapsedMs:0,expectedRevision:5}),/invalid/);
});
test('04 changing any previously verified material geometry or observer vector invalidates picks/focus',()=>{
 const b=box(),pl=plane(),dirs=rays(),s=make({confirmed:true,b,pl,directions:dirs});
 const chosen=firstStroke(whole(s)).id;
 b.max.x=12;
 assert.throws(()=>s.focusOnAction({actionId:chosen,expectedRevision:5}),/modified/);
 b.max.x=10;dirs.H.z=-1;
 assert.throws(()=>s.focusOnStep({stepIndex:0,expectedRevision:5}),/modified/);
 assert.throws(()=>s.inspectAt({x:10,y:10,elapsedMs:0,expectedRevision:5}),/modified/);
});
test('04 mobile hit results are deterministic and do not mutate the source shape',()=>{
 const a=make({confirmed:true}),b=make({confirmed:true});
 const line=firstStroke(whole(a));
 assert.deepEqual(
  a.inspectAt({...line.p,elapsedMs:a.totalMs,expectedRevision:5,tolerancePx:5}),
  b.inspectAt({...line.p,elapsedMs:b.totalMs,expectedRevision:5,tolerancePx:5})
 );
});
test('04 UI exposes touch selection/focus and keyboard support without changing original V5 player',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../../labs/prism-cut-live.html'),'utf8');
 const entry=fs.readFileSync(path.join(__dirname,'../../labs/prism-cut-live-entry.cjs'),'utf8');
 for(const id of ['board','pickedInfo','autofocus','fit','rayStatus'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/role="region" tabindex="0"/);
 assert.match(html,/data-selected="true"/);
 assert.match(entry,/getScreenCTM/);
 assert.match(entry,/matrixTransform\(matrix\.inverse\(\)\)/);
 assert.match(entry,/state\.scene\.inspectAt\(/);
 assert.match(entry,/state\.scene\.focusOnAction\(/);
 assert.match(entry,/state\.scene\.focusOnStep\(/);
 assert.match(entry,/state\.player\.seekMs\(/);
 assert.match(entry,/querySelectorAll\('\[data-action\]'\)/);
 assert.match(entry,/svg\.setAttribute\('viewBox',state\.viewBox\)/);
 assert.match(entry,/ArrowLeft/);assert.match(entry,/ArrowRight/);
 assert.match(entry,/state\.selected=null/);
 assert.match(entry,/state\.rev\+\+/);
});
test('04 exact V5 seek, speed and local SVG export remain present after adding touch controls',()=>{
 const entry=fs.readFileSync(path.join(__dirname,'../../labs/prism-cut-live-entry.cjs'),'utf8');
 for(const token of ['seekStep','seekProgress','setSpeed','Blob([frame.svg]',
  'URL.createObjectURL','URL.revokeObjectURL'])
  assert.ok(entry.includes(token),token);
 assert.doesNotMatch(entry,/fetch\(|XMLHttpRequest|WebSocket/);
 const s=make({confirmed:true}),player=s.createPlayer({speed:2});
 player.play(0);assert.equal(player.snapshot(200).elapsedMs,400);
 assert.equal(player.seekStep(5,300).elapsedMs,s.steps[5].startMs);
});
