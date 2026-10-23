'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {actionBounds,actionViewBox}=require('../../workbench/v5-action-camera.cjs');
const {compileConfirmedTwoPoint}=require('../../workbench/confirmed-two-point-v5.cjs');
const FULL={x:0,y:0,width:720,height:470};
const eq=(a,b)=>assert.deepEqual(a,b);
const finiteBounds=b=>b&&Object.values(b).every(Number.isFinite);
test('focus computes a bounded SVG view from an actual source-certified V5 point-action',()=>{
 const real=compileConfirmedTwoPoint({confirmedBy:'user',revision:7,unit:'mm',
  sheetTransform:{origin:{x:360,y:210},scale:3},points:[
   {id:'A',x:15,y:27,z:30},{id:'B',x:30,y:0,z:23}]});
 const action=real.steps.flatMap(s=>s.actions).find(a=>a.kind==='line');
 assert.ok(action,'certified projection should emit a real V5 construction line');
 const untouched=JSON.stringify(action),bounds=actionBounds(action),v=actionViewBox(action);
 assert.ok(finiteBounds(bounds));
 assert.ok(v.width>0&&v.height>0&&v.width<=720&&v.height<=470);
 assert.ok(v.x>=0&&v.y>=0&&v.x+v.width<=720+1e-9&&v.y+v.height<=470+1e-9);
 eq(JSON.stringify(action),untouched);
 assert.equal(real.canonicalVerified,true);
 assert.equal(real.player.canRender(7),true);
});
test('view controls accept true line, circle, arc and point sheet primitives without introducing geometry',()=>{
 const x=actionViewBox({kind:'line',geometry:{from:{x:300,y:180},to:{x:380,y:210}}});
 assert.ok(x.width<720);
 assert.ok(x.x<=300&&x.x+x.width>=380);
 const p=actionViewBox({kind:'point',geometry:{center:{x:330,y:220},radius:5}});
 assert.ok(p.width<720);
 for(const kind of ['circle','arc']){
  const v=actionViewBox({kind,geometry:{center:{x:350,y:230},radius:20}});
  assert.ok(v.width<720);
  assert.ok(v.x<=330&&v.x+v.width>=370);
 }
});
test('unsafe, unsupported or out-of-paper shapes never move or zoom the viewer',()=>{
 const inputs=[
  null,{kind:'line',geometry:{from:{x:NaN,y:1},to:{x:2,y:3}}},
  {kind:'line',geometry:{from:{x:-1,y:1},to:{x:4,y:4}}},
  {kind:'circle',geometry:{center:{x:30,y:30},radius:Infinity}},
  {kind:'arc',geometry:{center:{x:700,y:230},radius:50}},
  {kind:'point',geometry:{center:{x:Infinity,y:0},radius:4}},
  {kind:'unknown',geometry:{from:{x:1,y:1},to:{x:2,y:2}}}
 ];
 for(const action of inputs)eq(actionViewBox(action),FULL);
 assert.throws(()=>actionViewBox(null,{width:NaN,height:470}),RangeError);
 assert.throws(()=>actionViewBox(null,{width:720,height:0}),RangeError);
});
test('large verified stroke preserves full sheet view and no false focus',()=>{
 const line={kind:'line',geometry:{from:{x:0,y:0},to:{x:720,y:470}}};
 eq(actionViewBox(line),FULL);
 eq(actionBounds(line),{minX:0,maxX:720,minY:0,maxY:470});
});
