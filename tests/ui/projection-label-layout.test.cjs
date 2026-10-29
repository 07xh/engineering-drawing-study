'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {placeLabel}=require('../../labs/projection-label-layout.cjs');
test('nearby point labels avoid each other and stay within the viewport',()=>{
 const camera={x:0,y:0,width:720,height:470},occupied=[];
 const a=placeLabel({x:360,y:210},'已知 V',camera,occupied);
 const b=placeLabel({x:361,y:210},'已知 H',camera,occupied);
 assert.ok(a.x>=0&&a.y>=16&&a.x+a.width<=720&&a.y<=465);
 assert.ok(b.x>=0&&b.y>=16&&b.x+b.width<=720&&b.y<=465);
 assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y<=b.y-20||b.y<=a.y-20);
});
test('near the drawing edge labels are kept inside without altering the point',()=>{
 const point={x:718,y:3},camera={x:0,y:0,width:720,height:470};
 const label=placeLabel(point,'投影 W',camera,[]);
 assert.deepEqual(point,{x:718,y:3});
 assert.ok(label.x>=0&&label.x+label.width<=720&&label.y>=16&&label.y<=465);
});
test('a point outside the focused view does not get a misleading detached label',()=>{
 const point={x:900,y:210};const label=placeLabel(point,'V',{x:0,y:0,width:720,height:470},[]);
 assert.ok(label.x>=point.x,'offscreen label stays next to its source point');
});
