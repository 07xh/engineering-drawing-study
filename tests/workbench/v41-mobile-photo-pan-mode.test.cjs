'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('labs/recognition-qa.html','utf8');
const js=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
const {imagePointFromClient,createPhotoQaGesture}=
 require('../../labs/photo-qa-pointer-geometry.cjs');

test('mobile photo QA has explicitly selectable browse and draw modes with semantic pressed state',()=>{
 for(const id of ['qaModePan','qaModeDraw','qaModeStatus'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/aria-pressed="false">浏览图纸/);
 assert.match(html,/aria-pressed="true">手工标注/);
 assert.match(js,/qaModePan'\)\.addEventListener\('click',\(\)=>setInteractionMode\('pan'\)\)/);
 assert.match(js,/qaModeDraw'\)\.addEventListener\('click',\(\)=>setInteractionMode\('annotate'\)\)/);
 assert.match(js,/overlay\.style\.touchAction=mode==='pan'\?'pan-x pan-y':'none'/);
});
test('native scroll mode prevents pointer capture and manual truth gestures',()=>{
 assert.match(js,/if\(interactionMode==='pan'\|\|!session\.snapshot\(\)\.ready/);
 assert.match(js,/if\(interactionMode==='pan'\)return;\s*if\(gesture\.move/);
 assert.match(js,/if\(interactionMode==='pan'\)return;\s*const result=gesture\.up/);
 assert.match(js,/gesture\.reset\(\);\s*overlay\.style\.touchAction/);
 assert.match(html,/\.stage\{[^}]*overflow:auto/);
 assert.match(html,/\.stage svg\{[^}]*touch-action:none/);
 assert.match(js,/overlay\.style\.cursor=mode==='pan'\?'grab':'crosshair'/);
});
test('zoom and local five-target diagnostic keep explicit annotation mode safety',()=>{
 assert.match(js,/if\(zoom>1&&interactionMode==='annotate'&&touchCheck\.snapshot\(\)\.status!=='active'\)/);
 assert.match(js,/setInteractionMode\('pan'\)/);
 assert.match(js,/touchCheck\.cancel\(\);gesture\.reset\(\);setZoom\(1\);setInteractionMode\('annotate'\);session\.reset\(\)/);
 assert.match(js,/gesture\.reset\(\);setInteractionMode\('annotate'\);\s*touchCheckStatus/);
});
test('original pixel coordinates remain invariant when drawing is resumed after panning',()=>{
 const image={width:3000,height:1800};
 const before=imagePointFromClient(
  {clientX:240,clientY:210},{left:40,top:90,width:600,height:360},image);
 const after=imagePointFromClient(
  {clientX:290,clientY:235},{left:-210,top:-65,width:1500,height:900},image);
 assert.deepEqual(before,{x:1000,y:600});
 assert.deepEqual(after,before);
 const g=createPhotoQaGesture();
 g.down(1,before,'line');
 // Switching to native browse resets gesture before any pointerup.
 g.reset();
 assert.equal(g.up(1,after).status,'ignored');
 assert.equal(g.snapshot(),null);
});
test('no upload, retained photo or math solver introduced by touch scrolling',()=>{
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB/);
 assert.doesNotMatch(js,/solveFiniteFillet|session\.replace|G1Verified/);
});
