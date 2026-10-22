'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Bridge=require('../../workbench/verified-plan-v5-bridge.cjs');
const Proof=require('../../workbench/verified-fillet-step-reasons.cjs');
const sheet={origin:{x:360,y:220},scale:8};
const circles=()=>({
 first:{center:{x:0,y:0},radius:5},second:{center:{x:20,y:0},radius:5},
 filletRadius:10,firstMode:'external',secondMode:'external',
 branchId:'center-1',direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'
});
const segments=()=>({
 first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'
});
const mixed=()=>({
 segment:{a:{x:-15,y:0},b:{x:15,y:0}},
 circle:{center:{x:0,y:5},radius:8},
 filletRadius:3,side:1,branchId:'candidate-1',direction:'ccw',
 lineTravel:'forward',knownCircleTravel:'cw'
});
test('V5 proof stage explanations reflect true R1 solver steps for 3 supported geometries',()=>{
 for(const [kind,make,count] of [['circles',circles,4],['segments',segments,6],
  ['segment-circle',mixed,5]]){
  const plan=Bridge.filletTimeline(kind,make(),sheet,14);
  assert.equal(plan.status,'ready',kind);
  const p=Proof.build(plan,{kind,revision:14});
  assert.equal(p.status,'ready',kind+' '+p.reason);
  assert.equal(p.steps.length,count);
  assert.equal(p.steps.at(-1).role,'result');
  assert.equal(p.steps.at(-1).id,plan.steps.at(-1).id);
  const intro=Proof.at(p,{revision:14,stage:0});
  assert.equal(intro.status,'intro');
  assert.doesNotMatch(intro.evidence||'',/G1 向量最大不匹配/);
  for(let i=1;i<count;i++){
   const info=Proof.at(p,{revision:14,stage:i,mode:'full'});
   assert.equal(info.status,'ready');
   assert.equal(info.role,'auxiliary');
   assert.ok(info.why.length>14);
   assert.match(info.evidence,/不会提前展示最终圆弧/);
   assert.doesNotMatch(info.evidence,/双侧有向 G1 验证通过/);
  }
  const end=Proof.at(p,{revision:14,stage:count,mode:'full'});
  assert.match(end.evidence,/双侧有向 G1 验证通过/);
  assert.match(end.evidence,/mm/);
  assert.match(end.scope,/并非完整教材题/);
  assert.equal(p.selectedBranchId,make().branchId);
 }
});
test('V5 never grants a verified proof without explicit directed G1 choice or known source travels',()=>{
 for(const [kind,make] of [['circles',circles],['segments',segments],
  ['segment-circle',mixed]]){
  const args=make();delete args.branchId;
  let raw=Bridge.filletTimeline(kind,args,sheet,8);
  assert.equal(Proof.build(raw,{kind,revision:8}).status,'requires-choice');
  args.branchId=make().branchId;
  if(kind==='circles')delete args.knownFirstTravel;
  else if(kind==='segments')delete args.firstTravel;
  else delete args.lineTravel;
  raw=Bridge.filletTimeline(kind,args,sheet,8);
  assert.notEqual(Proof.build(raw,{kind,revision:8}).status,'ready');
 }
});
test('wrong revision, forged branch and residual cannot turn unverified source into a proof',()=>{
 const raw=Bridge.filletTimeline('circles',circles(),sheet,7);
 assert.equal(Proof.build(raw,{kind:'circles',revision:8}).status,'requires-choice');
 const badBranch={...raw,selectedBranchId:'center-2'};
 assert.equal(Proof.build(badBranch,{kind:'circles',revision:7}).status,'blocked');
 const badG1={...raw,originalLesson:{...raw.originalLesson,
  result:{...raw.originalLesson.result,maxG1Mismatch:.02}}};
 assert.equal(Proof.build(badG1,{kind:'circles',revision:7}).status,'blocked');
 assert.equal(Proof.at(Proof.build(raw,{kind:'circles',revision:7}),
  {revision:8,stage:4}).status,'requires-choice');
 assert.equal(Proof.at(Proof.build(raw,{kind:'circles',revision:7}),
  {revision:7,stage:5}).status,'blocked');
 assert.throws(()=>Proof.build(raw,{kind:'arbitrary',revision:7}));
});
test('hint and draw never expose future proof, center coordinates or final residual',()=>{
 const plan=Proof.build(Bridge.filletTimeline('circles',circles(),sheet,12),{
  kind:'circles',revision:12});
 for(const mode of ['hint','draw']){
  const x=Proof.at(plan,{revision:12,stage:4,mode});
  assert.notEqual(x.status,'ready');
  assert.equal(x.evidence,'');
  assert.equal(x.check,'');
  assert.doesNotMatch(x.reason,/maxResidual|center-1|[0-9]+\.[0-9]+ mm/);
 }
});
test('finite given circular arcs are treated as source membership, not infinite circles',()=>{
 const args=mixed();
 const candidate=require('../../engines/planar/segment-circle-fillet.cjs')
  .finiteSegmentCircleFillets(args).candidates[0];
 const deg=Math.atan2(candidate.circleContact.y-args.circle.center.y,
  candidate.circleContact.x-args.circle.center.x)*180/Math.PI;
 args.circle.arc={startAngle:deg-8,endAngle:deg+8,direction:'ccw'};
 const result=Bridge.filletTimeline('segment-circle',args,sheet,9);
 assert.equal(result.status,'ready');
 const explanation=Proof.build(result,{kind:'segment-circle',revision:9});
 assert.equal(explanation.status,'ready');
 assert.match(Proof.at(explanation,{revision:9,stage:4}).check,/有限原圆弧/);
 const bad={...result,originalLesson:{...result.originalLesson,
  result:{...result.originalLesson.result,sourceArcRangeVerified:false}}};
 assert.equal(Proof.build(bad,{kind:'segment-circle',revision:9}).status,'blocked');
});
