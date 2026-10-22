'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scrollToImagePoint:focus}=
 require('../../labs/photo-qa-viewport-scroll.cjs');
const {imagePointFromClient,createPhotoQaGesture}=
 require('../../labs/photo-qa-pointer-geometry.cjs');
const {createPhotoTouchCheck}=
 require('../../labs/photo-qa-touch-check.cjs');

test('pan focuses an original-image center after zoom without changing pixel coordinates',()=>{
 const image={width:2400,height:1200};
 const viewport={width:1800,height:900};
 const container={width:600,height:300};
 const scroll=focus(image,{x:1200,y:600},viewport,container);
 assert.deepEqual(scroll,{left:600,top:300});
 const visibleRect={left:-scroll.left,top:-scroll.top,
  width:viewport.width,height:viewport.height};
 const pointer={clientX:visibleRect.left+900,clientY:visibleRect.top+450};
 assert.deepEqual(imagePointFromClient(pointer,visibleRect,image),
  {x:1200,y:600});
});
test('scroll clamps targets near edges, and never creates overscroll',()=>{
 const image={width:1000,height:500};
 const view={width:1500,height:750},container={width:500,height:250};
 assert.deepEqual(focus(image,{x:0,y:0},view,container),{left:0,top:0});
 assert.deepEqual(focus(image,{x:1000,y:500},view,container),
  {left:1000,top:500});
 assert.deepEqual(focus(image,{x:200,y:100},view,container),
  {left:50,top:25});
});
test('fit-to-screen returns zero scroll where drawing is smaller than the viewport',()=>{
 assert.deepEqual(focus({width:300,height:400},{x:150,y:200},
  {width:300,height:400},{width:600,height:800}),{left:0,top:0});
});
test('tall portrait photo scrolling also centers vertical target correctly',()=>{
 const image={width:1200,height:3200};
 const target={x:600,y:2500};
 const pos=focus(image,target,{width:600,height:1600},
  {width:600,height:420});
 assert.equal(pos.left,0);
 assert.equal(pos.top,1040);
});
test('untrusted viewport metrics or out-of-image targets fail closed',()=>{
 const i={width:2000,height:1000},p={x:1000,y:500};
 const view={width:900,height:450},stage={width:400,height:250};
 assert.equal(focus(i,{x:-1,y:300},view,stage),null);
 assert.equal(focus(i,{x:2001,y:300},view,stage),null);
 assert.equal(focus(i,{x:NaN,y:300},view,stage),null);
 assert.equal(focus(i,p,{...view,width:0},stage),null);
 assert.equal(focus(i,p,view,{...stage,height:Infinity}),null);
 assert.equal(focus(null,p,view,stage),null);
});
test('native pan gesture path cannot add ground truth to QA session',()=>{
 const gesture=createPhotoQaGesture();
 gesture.down(1,{x:5,y:10},'line');
 gesture.reset(); // same safety transition used before native pan mode starts
 assert.equal(gesture.up(1,{x:40,y:10}).status,'ignored');
 assert.equal(gesture.snapshot(),null);
 const check=createPhotoTouchCheck();
 check.start({width:200,height:200});check.cancel();
 assert.equal(check.snapshot().status,'idle');
});
test('public QA page wires native pan, direct-touch label mode and auto-focus',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('labs/recognition-qa.html','utf8');
 const ui=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
 for(const id of ['qaPanMode','qaMarkMode'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/\.stage\.is-panning svg\{pointer-events:none/);
 assert.match(html,/\.stage\.is-panning\{touch-action:pan-x pan-y/);
 assert.match(ui,/stage\.classList\.toggle\('is-panning',panMode\)/);
 assert.match(ui,/gesture\.reset\(\);\s*if\(panMode/);
 assert.match(ui,/if\(panMode\|\|!session\.snapshot\(\)\.ready/);
 assert.match(ui,/setPanMode\(false\);\s*touchCheckStatus\(touchCheck\.start/);
 assert.match(ui,/focusTouchTarget\(\)/);
 assert.match(ui,/scrollToImagePoint\(imageSize,t\.target/);
 assert.match(ui,/stage\.scrollLeft=scroll\.left/);
 assert.match(ui,/stage\.scrollTop=scroll\.top/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB/);
});
