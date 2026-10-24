'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {toSheet}=require('../../core/projection/conventions.js');
const {verifiedTeachingActionToV5:convert}=
 require('../../workbench/construction-step-v5-adapter.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const sheet={origin:{x:410,y:270},scale:5};
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-7,
 'paper projection mismatch '+a+' vs '+b);
test('model circle center respects actual first-angle V/H/W signs, not generic positive-x sheet',()=>{
 const original={id:'SourceCircle',kind:'circle',coordinateSpace:'model-mm',
  center:{x:3,y:-4},radius:6};
 for(const view of ['V','H','W']){
  const a=convert({...original,view},sheet);
  assert.equal(a.kind,'circle');
  const expected=toSheet(view,{u:3,v:-4},sheet);
  assert.deepEqual(a.geometry.center,expected);
  assert.equal(a.geometry.radius,30);
 }
 const V=convert({...original,view:'V'},sheet);
 const H=convert({...original,view:'H'},sheet);
 assert.deepEqual(V.geometry.center,{x:395,y:290});
 assert.deepEqual(H.geometry.center,{x:395,y:250});
 assert.notDeepEqual(V.geometry.center,H.geometry.center);
});
test('directed model arc pen matches first-angle projection through whole angle for all views',()=>{
 const original={id:'SourceArc',kind:'arc',coordinateSpace:'model-mm',
  center:{x:3,y:-4},radius:6,
  startAngle:170,endAngle:20,direction:'cw'};
 for(const view of ['V','H','W']){
  const a=convert({...original,view},sheet);
  assert.equal(a.kind,'arc');
  for(const t of [0,.2,.5,.8,1]){
   const phi=(original.startAngle+
    (original.endAngle-original.startAngle)*t)*Math.PI/180;
   const p={u:original.center.x+original.radius*Math.cos(phi),
    v:original.center.y+original.radius*Math.sin(phi)};
   const expected=toSheet(view,p,sheet);
   const actual=Motion.arc(a.geometry.center,a.geometry.radius,
    a.geometry.startRadians,a.geometry.sweepRadians,t).pen;
   near(expected.x,actual.x);near(expected.y,actual.y);
  }
  assert.equal(Math.sign(a.geometry.sweepRadians),
   view==='V'?-1:1);
 }
});
test('invalid view and forged angle cannot pass the shared verified V5 adapter',()=>{
 assert.throws(()=>convert({id:'InvalidView',kind:'circle',
  coordinateSpace:'model-mm',center:{x:0,y:0},radius:5,
  view:'U'},sheet),/first-angle/);
 assert.throws(()=>convert({id:'BadArc',kind:'arc',
  coordinateSpace:'model-mm',center:{x:0,y:0},radius:5,
  startAngle:20,endAngle:140,direction:'cw',view:'V'},sheet),
 /sweep and direction conflict/);
});
