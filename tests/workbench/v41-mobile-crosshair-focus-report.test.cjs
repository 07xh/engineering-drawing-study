'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scrollToImagePoint:focus}=
 require('../../labs/photo-qa-viewport-scroll.cjs');
const {imagePointFromClient}=
 require('../../labs/photo-qa-pointer-geometry.cjs');
const {createPhotoTouchCheck}=
 require('../../labs/photo-qa-touch-check.cjs');
test('automatic next-target positioning centers crosshair in a zoomed viewport',()=>{
 const image={width:2400,height:1200};
 const view={width:1800,height:900},container={width:600,height:300};
 const at=focus(image,{x:1200,y:600},view,container);
 assert.deepEqual(at,{left:600,top:300});
 const rect={left:-at.left,top:-at.top,width:view.width,height:view.height};
 const pointer={clientX:300,clientY:150};
 assert.deepEqual(imagePointFromClient(pointer,rect,image),
  {x:1200,y:600});
});
test('portrait paper and frame edges produce only valid scroll coordinates',()=>{
 const image={width:1000,height:3000};
 const view={width:900,height:2700},container={width:450,height:500};
 assert.deepEqual(focus(image,{x:0,y:0},view,container),
  {left:0,top:0});
 assert.deepEqual(focus(image,{x:1000,y:3000},view,container),
  {left:450,top:2200});
 assert.deepEqual(focus(image,{x:500,y:1500},view,container),
  {left:225,top:1100});
});
test('fitted image should not auto-scroll and invalid DOM values are rejected',()=>{
 const image={width:400,height:300};
 assert.deepEqual(focus(image,{x:200,y:150},
  {width:400,height:300},{width:600,height:500}),{left:0,top:0});
 for(const invalid of [
  focus(image,{x:-1,y:150},{width:800,height:600},{width:400,height:300}),
  focus(image,{x:200,y:301},{width:800,height:600},{width:400,height:300}),
  focus(image,{x:200,y:150},{width:0,height:600},{width:400,height:300}),
  focus(image,{x:200,y:150},{width:800,height:600},{width:Infinity,height:300}),
  focus(null,{x:200,y:150},{width:800,height:600},{width:400,height:300})
 ])assert.equal(invalid,null);
});
test('real diagnostic order preserves sample count with auto focus as pure viewport action',()=>{
 const check=createPhotoTouchCheck();
 const result=check.start({width:2400,height:1200});
 assert.deepEqual(result.target,{x:1200,y:600});
 const viewport={width:1200,height:600},stage={width:400,height:300};
 const pos=focus({width:2400,height:1200},result.target,viewport,stage);
 assert.deepEqual(pos,{left:400,top:150});
 assert.equal(check.snapshot().errors.length,0);
 const after=check.tap(result.target);
 assert.equal(after.index,1);
 assert.deepEqual(after.target,{x:480,y:240});
 assert.equal(after.errors.length,1);
});
test('latest V4.1 pan mode is preserved and photo QA safely exposes export',()=>{
 const fs=require('node:fs');
 const entry=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
 const page=fs.readFileSync('labs/recognition-qa.html','utf8');
 const keys=['qaModePan','qaModeDraw','qaTouchCheck','qaTouchExport'];
 for(const id of keys)assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(entry,/setInteractionMode\('pan'\)/);
 assert.match(entry,/setInteractionMode\('annotate'\)/);
 assert.match(entry,/touchCheckStatus\(touchCheck\.tap\(g\.last\)\);\s*focusTouchTarget\(\)/);
 assert.match(entry,/touchCheckStatus\(touchCheck\.start\(snap\.image\)\);\s*draw\(\);\s*focusTouchTarget\(\)/);
 assert.match(entry,/scrollToImagePoint\(imageSize,check\.target/);
 assert.match(entry,/downloadJson\(report,'draftai-touch-diagnostic\.json'\)/);
 assert.match(entry,/buildTouchDiagnosticReport\(touchCheck\.snapshot\(\)\)/);
 assert.doesNotMatch(entry,/\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB/);
});
