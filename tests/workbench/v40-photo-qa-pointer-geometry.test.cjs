'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {imagePointFromClient:point,createPhotoQaGesture:create}=
 require('../../labs/photo-qa-pointer-geometry.cjs');
const {createManualPhotoAnnotation}=require('../../labs/photo-qa-annotation-gestures.cjs');
const image={width:2400,height:1200};
test('CSS viewport and 1x display map through actual SVG rect to original image pixels',()=>{
 const rect={left:30,top:100,width:600,height:300};
 const actual=point({clientX:180,clientY:175},rect,image);
 assert.deepEqual(actual,{x:600,y:300});
 assert.deepEqual(point({clientX:630,clientY:400},rect,image),
  {x:2400,y:1200});
});
test('2.5x zoom and scroll/pan do not change original pixel coordinates',()=>{
 const unzoomed=point({clientX:180,clientY:175},
  {left:30,top:100,width:600,height:300},image);
 // Browser zoom increases SVG width; scrolling moves its live client rect.
 const zoomed=point({clientX:405,clientY:287.5},
  {left:30,top:100,width:1500,height:750},image);
 assert.deepEqual(zoomed,unzoomed);
 const scrolled=point({clientX:105,clientY:87.5},
  {left:-270,top:-100,width:1500,height:750},image);
 assert.deepEqual(scrolled,unzoomed);
});
test('portrait paper aspect ratio and resized screen preserve manual circle geometry',()=>{
 const portrait={width:1200,height:2400};
 const start=point({clientX:100,clientY:80},
  {left:50,top:30,width:240,height:480},portrait);
 const end=point({clientX:120,clientY:80},
  {left:50,top:30,width:240,height:480},portrait);
 const a=createManualPhotoAnnotation('circle',start,end);
 assert.deepEqual(a.center,{x:250,y:250});
 assert.equal(a.radius,100);
});
test('outside releases, invalid rect, unbounded client and zero visible size reject not clamp',()=>{
 const rect={left:10,top:20,width:100,height:50};
 assert.equal(point({clientX:9,clientY:30},rect,image),null);
 assert.equal(point({clientX:111,clientY:30},rect,image),null);
 assert.equal(point({clientX:20,clientY:71},rect,image),null);
 assert.equal(point({clientX:NaN,clientY:50},rect,image),null);
 assert.equal(point({clientX:20,clientY:30},{...rect,width:0},image),null);
 assert.equal(point({clientX:20,clientY:30},rect,{width:0,height:100}),null);
});
test('single-finger touch preserves exact original pixel start and release',()=>{
 const g=create();
 assert.equal(g.down(1,{x:20,y:30},'line').status,'started');
 assert.deepEqual(g.move(1,{x:60,y:30}).last,{x:60,y:30});
 const result=g.up(1,{x:130,y:30});
 assert.equal(result.status,'completed');
 assert.deepEqual(result.gesture,{pointerId:1,kind:'line',
  start:{x:20,y:30},last:{x:130,y:30}});
 assert.equal(g.pointers,0);
 assert.equal(g.snapshot(),null);
});
test('touch and stylus: second finger invalidates whole gesture, not commit first drag',()=>{
 const g=create();
 g.down(11,{x:30,y:30},'dimension');
 assert.equal(g.down(12,{x:40,y:40},'dimension').status,'multitouch-cancelled');
 assert.equal(g.snapshot(),null);
 assert.equal(g.blocked,true);
 assert.equal(g.up(11,{x:100,y:100}).status,'cancelled');
 assert.equal(g.up(12,{x:40,y:40}).status,'cancelled');
 assert.equal(g.blocked,false);
 assert.equal(g.down(13,{x:20,y:20},'circle').status,'started');
 assert.equal(g.up(13,{x:90,y:20}).status,'completed');
});
test('pointercancel, lost capture, reset and release off image never create fake truth',()=>{
 const g=create();
 g.down(2,{x:50,y:60},'line');
 assert.equal(g.up(2,null).status,'outside-cancelled');
 assert.equal(g.snapshot(),null);
 g.down(3,{x:20,y:25},'arc');
 assert.equal(g.cancel(3).status,'cancelled');
 assert.equal(g.up(3,{x:100,y:100}).status,'ignored');
 g.down(4,{x:40,y:40},'arrow');
 g.reset();
 assert.equal(g.up(4,{x:40,y:40}).status,'ignored');
 assert.equal(g.pointers,0);
});
test('gesture snapshot is defensive and direct mutation cannot alter pixel evidence',()=>{
 const g=create();
 const first={x:20,y:20};
 g.down(5,first,'line');
 first.x=999;
 const snapshot=g.snapshot();
 snapshot.start.x=-100;
 assert.deepEqual(g.snapshot().start,{x:20,y:20});
 assert.equal(g.down(5,{x:30,y:30},'line').status,'ignored');
 assert.equal(g.move(7,{x:60,y:60}),null);
});
test('real browser QA UI connects zoom and pointer capture safeguards to image-space adapter',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('labs/recognition-qa.html','utf8');
 const source=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
 for(const id of ['qaViewport','qaZoomIn','qaZoomOut','qaZoomReset','qaZoomLevel'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(source,/imagePointFromClient\(event,overlay\.getBoundingClientRect\(\),size\)/);
 assert.match(source,/createPhotoQaGesture\(\)/);
 assert.match(source,/setPointerCapture\?/);
 assert.match(source,/lostpointercapture/);
 assert.match(source,/pointercancel/);
 assert.match(source,/setZoom\(zoom\+\.25\)/);
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB/);
 assert.doesNotMatch(source,/solveFiniteFillet|session\.replace|G1Verified/);
});
