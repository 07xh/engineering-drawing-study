'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {assertVerifiedArcParity:parity}=
 require('../../workbench/verified-v5-arc-parity.cjs');
const {confirmedFilletTimeline:solve}=
 require('../../workbench/v31-confirmed-fillet-v5.cjs');
const sheet={origin:{x:350,y:220},scale:5};
const P=(x,y)=>({x,y});
const seg=(a,b,c,d)=>({a:P(a,b),b:P(c,d)});
const base=(kind,geometry,filletRadius,selection,options)=>({
 problem:{kind,unit:'mm',revision:5,geometry,filletRadius,...(options?{options}:{})},
 selection,sheet
});
const inputs=[
 ()=>base('two-segments',{first:seg(-10,0,10,0),
  second:seg(0,-10,0,10)},3,
  {branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'}),
 ()=>base('two-circles',{first:{center:P(0,0),radius:5},
  second:{center:P(20,0),radius:5}},10,
  {branchId:'center-1',direction:'cw',
   knownFirstTravel:'ccw',knownSecondTravel:'ccw'},
  {firstMode:'external',secondMode:'external'}),
 ()=>base('segment-circle',{segment:seg(-15,0,15,0),
  circle:{center:P(0,5),radius:8}},3,
  {branchId:'candidate-1',direction:'ccw',lineTravel:'forward',
   knownCircleTravel:'cw'},{side:1})
];
function model(r){
 const arc=r.originalLesson.result.arc;
 const action=r.steps.at(-1).actions.find(a=>a.kind==='arc');
 return {sourceArc:arc,contacts:r.typedMathEvidence.contacts,sheet,action};
}
test('F1 all three real specialized G1 solvers satisfy independent model/animation arc endpoint and sweep parity',()=>{
 for(const make of inputs){
  const result=solve(make());
  assert.equal(result.status,'ready');
  assert.equal(result.mathematicallyVerified,true);
  assert.equal(result.typedMathEvidence.g1Verified,true);
  assert.equal(parity(model(result)),true);
 }
});
test('wrong radius, center, start, sweep, segment contact or direction fail closed',()=>{
 const r=solve(inputs[0]());
 const proof=model(r);
 for(const geometry of [
  {...proof.action.geometry,radius:proof.action.geometry.radius+1},
  {...proof.action.geometry,center:{...proof.action.geometry.center,x:proof.action.geometry.center.x+1}},
  {...proof.action.geometry,startRadians:proof.action.geometry.startRadians+.1},
  {...proof.action.geometry,sweepRadians:-proof.action.geometry.sweepRadians},
  {...proof.action.geometry,sweepRadians:proof.action.geometry.sweepRadians+2*Math.PI}
 ]){
  assert.throws(()=>parity({...proof,action:{...proof.action,geometry}}),/V5 arc/);
 }
 assert.throws(()=>parity({...proof,contacts:{...proof.contacts,
  second:{...proof.contacts.second,x:proof.contacts.second.x+.5}}}),/endpoints/);
 assert.throws(()=>parity({...proof,sourceArc:{...proof.sourceArc,
  direction:proof.sourceArc.direction==='cw'?'ccw':'cw'}}),/direction/);
});
test('reprojection at changed sheet position and scale keeps independent contact math',()=>{
 for(const make of inputs){
  const change=make();
  const base=solve(change);
  change.sheet={origin:{x:280,y:140},scale:11};
  const again=solve(change);
  assert.equal(again.status,'ready');
  assert.deepEqual(again.typedMathEvidence,base.typedMathEvidence);
  assert.equal(parity({...model(again),sheet:change.sheet}),true);
  assert.notEqual(again.steps.at(-1).actions[0].geometry.radius,
   base.steps.at(-1).actions[0].geometry.radius);
 }
});
test('unverified branch or missing directions cannot create arc to pass parity',()=>{
 for(const make of inputs){
  const request=make();delete request.selection.direction;
  const answer=solve(request);
  assert.notEqual(answer.status,'ready');
  assert.equal(answer.mathematicallyVerified,false);
  assert.deepEqual(answer.steps,[]);
 }
});
test('invalid sheet, pixel-derived coordinate or malformed mathematical source is never accepted',()=>{
 const proof=model(solve(inputs[0]()));
 for(const sheet of [{origin:P(0,0),scale:0},
  {origin:P(NaN,0),scale:5},{origin:P(0,0),scale:'5'}])
  assert.throws(()=>parity({...proof,sheet}),/required/);
 assert.throws(()=>parity({...proof,sourceArc:{...proof.sourceArc,radius:NaN}}),/required/);
 assert.throws(()=>parity({...proof,action:{kind:'line',geometry:proof.action.geometry}}),/required/);
});
