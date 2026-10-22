'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createCylinderVisibilitySvgScene:make}=
 require('../../engines/spatial/sections/cylinder-visibility-frame-svg.cjs');
const read=p=>fs.readFileSync(path.join(__dirname,'../../',p),'utf8');
const html=read('labs/cylinder-cut-live.html');
const ui=read('labs/cylinder-cut-live-entry.cjs');
const p=(x,y,z)=>({x,y,z});
const args=()=>({
 cylinder:{baseCenter:p(0,0,0),radiusMm:5,heightMm:30},
 plane:{point:p(0,0,3),normal:p(1,0,1)},
 options:{revision:4,retainedHalfspace:'negative',
  observerDirections:{V:p(1,0,0),H:p(0,0,1),W:p(-1,0,.2)}}
});
test('04 real responsive lab exposes tap inspection and independent focus/fit controls',()=>{
 for(const id of ['board','pickedInfo','autofocus','fit','steps','seek',
  'speed','play','previous','next','mono','guides','save','recompute'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/id="autofocus"[^>]*checked/);
 assert.match(html,/id="board"[^>]*role="region" tabindex="0"/);
 assert.match(html,/data-selected="true"/);
 assert.match(html,/board:focus-visible/);
 assert.match(html,/max-width:960px/);
 assert.match(html,/轻触|定位/);
 assert.doesNotMatch(html,/<input[^>]*type="file"/);
});
test('04 pointer click is converted from actual SVG screen CTM, not guessed 960px taps',()=>{
 assert.match(ui,/getScreenCTM/);
 assert.match(ui,/matrixTransform\(ctm\.inverse\(\)\)/);
 assert.match(ui,/getBoundingClientRect\(\)/);
 assert.match(ui,/viewBox\.baseVal/);
 assert.match(ui,/state\.scene\.inspectAt\(/);
 assert.match(ui,/tolerancePx:12/);
 assert.match(ui,/addEventListener\('click',inspectClick\)/);
 assert.match(ui,/selected\.seekMs/);
 assert.match(ui,/state\.player\.seekMs/);
});
test('04 selected stroke highlight is rendered from verified data-action each new frame',()=>{
 assert.match(ui,/decorateSheet\(frame\)/);
 assert.match(ui,/querySelectorAll\('\[data-action\]'\)/);
 assert.match(ui,/data-selected/);
 assert.match(ui,/state\.selectedHit\.actionId/);
 assert.match(ui,/clearSelection\(\)/);
 assert.match(ui,/stepIndex===null/);
});
test('04 step navigation and playback clear past selection to prevent incorrect attribution',()=>{
 assert.match(ui,/function step\(direction\)\{[\s\S]*clearSelection\(\)/);
 assert.match(ui,/function playback\(\)\{[\s\S]*clearSelection\(\)/);
 assert.match(ui,/\$\('seek'\)\.addEventListener\('input',\(\)=>\{[\s\S]*clearSelection\(\)/);
 assert.match(ui,/state\.selectedHit=null;state\.focusKey=''/);
 assert.match(ui,/scene\.renderFrame\(/);
 assert.match(ui,/expectedRevision:state\.revision/);
});
test('04 autofocus uses the reviewed model-time step or selected action, not screenshot zoom',()=>{
 assert.match(ui,/state\.scene\.focusOnAction\(/);
 assert.match(ui,/state\.scene\.focusOnStep\(/);
 assert.match(ui,/state\.focusViewBox=result\?\.viewBox/);
 assert.match(ui,/svg\.setAttribute\('viewBox',state\.focusViewBox\)/);
 assert.match(ui,/\$\('autofocus'\)\.addEventListener\('change'/);
 assert.match(ui,/\$\('fit'\)\.addEventListener\('click'/);
 assert.match(ui,/\$\('autofocus'\)\.checked=false/);
});
test('04 keyboard navigation and export are still preserved as safe local-only flows',()=>{
 assert.match(ui,/event\.key==='ArrowLeft'/);
 assert.match(ui,/event\.key==='ArrowRight'/);
 assert.match(ui,/Blob\(\[frame\.svg\]/);
 assert.match(ui,/URL\.createObjectURL\(blob\)/);
 assert.match(ui,/URL\.revokeObjectURL/);
 assert.doesNotMatch(ui,/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/);
});
test('04 actual math-driven SVG marker maps through reviewed step and focus at finished time',()=>{
 const x=args(),scene=make(x.cylinder,x.plane,x.options);
 assert.equal(scene.status,'ready');
 const svg=scene.renderFrame({elapsedMs:scene.totalMs,expectedRevision:4}).svg;
 const m=svg.match(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"[^>]*data-action="(vis-[VHW]-[0-9]+-[0-9]+)"/);
 assert.ok(m);
 const at={x:(Number(m[1])+Number(m[3]))/2,
  y:(Number(m[2])+Number(m[4]))/2};
 const hit=scene.inspectAt({...at,elapsedMs:scene.totalMs,expectedRevision:4});
 assert.ok(hit);assert.equal(hit.layer,'result');
 assert.ok(hit.stepIndex>=0&&hit.stepIndex<scene.stepCount);
 const focus=scene.focusOnAction({actionId:hit.actionId,expectedRevision:4});
 const fit=scene.focusOnStep({stepIndex:hit.stepIndex,expectedRevision:4});
 assert.ok(focus.width<=960&&focus.height<=680);
 assert.ok(fit.width<=960&&fit.height<=680);
});
test('04 changed geometry still invalidates all inspection and frame data',()=>{
 const x=args(),s=make(x.cylinder,x.plane,x.options);
 assert.equal(s.status,'ready');
 const before=s.renderFrame({elapsedMs:0,expectedRevision:4});
 assert.equal(before.revision,4);
 x.cylinder.radiusMm=6;
 assert.throws(()=>s.renderFrame({elapsedMs:0,expectedRevision:4}),/changed/);
 assert.throws(()=>s.focusOnStep({stepIndex:0,expectedRevision:4}),/changed/);
 assert.throws(()=>s.inspectAt({x:50,y:50,elapsedMs:0,expectedRevision:4}),/changed/);
});
