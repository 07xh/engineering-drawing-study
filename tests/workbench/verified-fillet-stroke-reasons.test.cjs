'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Progressive=require('../../workbench/verified-fillet-progressive-motion.cjs');
const Bridge=require('../../workbench/verified-plan-v5-bridge.cjs');
const Reason=require('../../workbench/verified-fillet-step-reasons.cjs');
const Narration=require('../../workbench/verified-fillet-stroke-reasons.cjs');
const origin={x:360,y:220},scale=8;
const inputs={
 circles:{
  first:{center:{x:0,y:0},radius:5},second:{center:{x:20,y:0},radius:5},
  filletRadius:10,firstMode:'external',secondMode:'external',
  branchId:'center-1',direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'},
 segments:{
  first:{a:{x:-20,y:0},b:{x:20,y:0}},
  second:{a:{x:0,y:-20},b:{x:0,y:20}},
  filletRadius:10,branchId:'s++',direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'},
 'segment-circle':{
  segment:{a:{x:-15,y:0},b:{x:15,y:0}},
  circle:{center:{x:0,y:5},radius:8},filletRadius:3,side:1,
  branchId:'candidate-1',direction:'ccw',
  lineTravel:'forward',knownCircleTravel:'cw'}
};
function verified(kind,revision=12){
 const source=Bridge.filletTimeline(kind,inputs[kind],{origin,scale},revision);
 assert.equal(source.status,'ready');
 const motion=Progressive.build({kind,teaching:source,verified:true,
  origin,scale,revision,max:source.steps.length});
 const reasons=Reason.build(source,{kind,revision});
 assert.equal(reasons.status,'ready');
 return {motion,reasons,revision};
}
function current(options,ms){
 return Narration.at({...options,frame:Timeline.frame(options.motion.timeline,ms)});
}
test('V5 first and second mathematically sourced auxiliary circles give different frame-synchronized explanations',()=>{
 const sample=verified('circles');
 const first=current(sample,300),second=current(sample,800);
 assert.equal(first.status,'drawing');
 assert.match(first.title,/第 1 条圆心辅助圆轨迹/);
 assert.match(second.title,/第 2 条圆心辅助圆轨迹/);
 assert.ok(first.percent>0&&first.percent<100);
 assert.ok(second.percent>0&&second.percent<100);
 assert.equal(first.step,1);assert.equal(first.action,1);
 assert.equal(second.step,1);assert.equal(second.action,2);
 assert.match(first.why,/内切|外切/);
 assert.doesNotMatch(first.check,/G1 验证通过|G1 向量最大不匹配/);
});
test('V5 two finite segments and finite segment-circle narrate their actual offset lines',()=>{
 for(const [kind,expected] of [['segments',/第 1 条半径偏移辅助线/],
  ['segment-circle',/有限线段的半径偏移线/]]){
  const x=verified(kind,4),story=current(x,450);
  assert.equal(story.status,'drawing');
  assert.match(story.title,expected);
  assert.equal(story.canClaimFinal,false);
  assert.match(story.check,/不把辅助线/);
 }
 const mixed=verified('segment-circle',4);
 const middle=current(mixed,1550);
 assert.match(middle.title,/同心辅助圆/);
});
test('V5 partial final G1 arc never discloses residuals before arc completion',()=>{
 for(const kind of Object.keys(inputs)){
  const x=verified(kind,22),start=x.motion.timeline.steps.at(-1).startMs;
  const half=current(x,start+200);
  assert.equal(half.status,'drawing',kind);
  assert.match(half.title,/有向连接圆弧/);
  assert.equal(half.canClaimFinal,false);
  assert.doesNotMatch(half.check,/双侧有向 G1 验证通过|最大残差|最大不匹配/);
  const completed=current(x,x.motion.timeline.totalMs);
  assert.equal(completed.status,'complete');
  assert.equal(completed.canClaimFinal,true);
  assert.match(completed.check,/双侧有向 G1 验证通过/);
  assert.match(completed.check,/最大残差/);
 }
});
test('V5 exploratory construction can describe a real candidate but cannot claim a selected final arc',()=>{
 const centers=require('../../engines/planar/circle-circle-fillet.cjs')
  .circleCircleFilletCenters(inputs.circles);
 const motion=Progressive.build({kind:'circles',centers,chosen:null,teaching:null,
  verified:false,revision:8,origin,scale,max:4});
 const first=Narration.at({motion,reasons:null,frame:Timeline.frame(motion.timeline,800),
  revision:8});
 assert.equal(first.status,'drawing');
 assert.match(first.title,/第 2 条圆心辅助圆轨迹/);
 assert.equal(first.canClaimFinal,false);
 const last=Narration.at({motion,reasons:null,
  frame:Timeline.frame(motion.timeline,motion.timeline.totalMs),revision:8});
 assert.equal(last.canClaimFinal,false);
 assert.doesNotMatch(last.check,/双侧有向 G1 验证通过/);
});
test('invalid frame, old revision, mismatched proof and hidden learning modes fail closed',()=>{
 const x=verified('circles',7);
 const frame=Timeline.frame(x.motion.timeline,300);
 assert.equal(Narration.at({...x,frame,revision:8}).status,'unverified');
 assert.equal(Narration.at({...x,frame,revision:7,mode:'hint'}).status,'hidden');
 assert.equal(Narration.at({...x,frame,revision:7,mode:'draw'}).status,'hidden');
 assert.equal(Narration.at({...x,frame:{...frame,invalid:true}}).status,'unverified');
 assert.equal(Narration.at({...x,reasons:{...x.reasons,revision:10},frame}).status,'blocked');
 const altered={...x.motion,steps:x.motion.steps.map((v,i)=>i===0?
  {...v,actions:v.actions.map((a,j)=>j===0?{...a,id:'forged-id'}:a)}:v)};
 assert.equal(Narration.at({motion:altered,reasons:x.reasons,frame,revision:7}).status,'blocked');
 const fractions={...frame.actionFractions,
  [x.motion.steps[0].actions[0].id]:Number.NaN};
 assert.equal(Narration.at({...x,frame:{...frame,actionFractions:fractions}}).status,'blocked');
});
