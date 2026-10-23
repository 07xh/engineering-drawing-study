'use strict';
/* Android synthetic policy checks only; never claims a physical device run. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('07 mobile touch and pen pointerdown pauses V5 DOM recreation before hit click',()=>{
 const code=read('labs/cone-cut-live-entry.cjs');
 assert.match(code,/function freezeBeforeTap\(event\)/);
 assert.match(code,/if\(event\.isPrimary!==false&&player&&player\.canRender\(revision\)\)stop\(\)/);
 assert.match(code,/hit\.addEventListener\('pointerdown',freezeBeforeTap\)/);
 assert.match(code,/mark\.addEventListener\('pointerdown',freezeBeforeTap\)/);
 assert.match(code,/el\.addEventListener\('pointerdown',freezeBeforeTap\)/);
 assert.match(code,/hit\.addEventListener\('click',pick\)/);
 assert.match(code,/Motion\.updateSvg\(hit,action,fraction\)/);
 assert.match(code,/data-cone-action-hit/);
 assert.match(code,/'stroke-width':'18'/);
 assert.match(code,/if\(action\.kind==='point'\)hit\.setAttribute\('r','11'\)/);
});
test('07 mobile horizontal one-finger orbit uses same spatial model and V5 player',()=>{
 const code=read('labs/cone-cut-live-entry.cjs'),html=read('labs/cone-cut-live.html');
 assert.match(code,/function beginOrbit\(event\)/);
 assert.match(code,/function moveOrbit\(event\)/);
 assert.match(code,/function endOrbit\(event\)/);
 assert.match(code,/event\.pointerType!=='touch'&&event\.pointerType!=='pen'/);
 assert.match(code,/setPointerCapture\?\.\(event\.pointerId\)/);
 assert.match(code,/releasePointerCapture\(event\.pointerId\)/);
 assert.match(code,/orbitGesture\.azimuth\+delta\*0\.7/);
 for(const name of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])
  assert.match(code,new RegExp("cone3dSvg'\\)\\.addEventListener\\('"+name+"'"));
 assert.match(html,/#cone3dSvg\{[^}]*touch-action:pan-y/);
 assert.match(html,/\.cone-spatial-controls input\{min-height:44px/);
 assert.match(html,/左右拖动三维空白区域/);
 assert.match(code,/evaluateUnifiedMath\(\{/);
 assert.match(code,/kind:'cone-plane-section'/);
 assert.match(code,/coneLinkedSpatialScene\(plan\.spatialIntent/);
 assert.doesNotMatch(code,/function\s+(?:createPlayer|compileTimeline|conePlaneFullEllipse)\s*\(/);
});
test('09 do not silently certify Android execution, full visibility or new pointer math',()=>{
 const code=read('labs/cone-cut-live-entry.cjs');
 assert.match(code,/完整遮挡仍未证明/);
 assert.match(code,/data-cone-view-focus/);
 assert.match(code,/player\.seekMs\(link\.views\.V\.actionEndMs,now\(\)\)/);
 assert.doesNotMatch(code,/innerHTML|localStorage|WebSocket|sendBeacon|window\.fetch\(/);
});
