'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Bridge=require('../../workbench/verified-plan-v5-bridge.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
const segment=()=>({
 first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'
});
const circle=()=>({
 first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},
 filletRadius:10,firstMode:'external',secondMode:'external',
 branchId:'center-1',direction:'cw',
 knownFirstTravel:'ccw',knownSecondTravel:'ccw'
});
const sheet={origin:{x:360,y:220},scale:8};
test('actual point projection draws 4 proofs in sheet pixels without remapping pixels twice',()=>{
 const input={knownPoint:{x:15,y:10,z:12},
  sheetTransform:{origin:{x:360,y:175},scale:4}};
 const p=Bridge.pointTimeline(input,3);
 assert.equal(p.status,'ready');
 assert.equal(p.mathematicallyVerified,true);
 assert.equal(p.revision,3);
 assert.equal(p.steps.length,4);
 assert.equal(p.steps[0].actions[0].kind,'line');
 assert.deepEqual(p.steps[0].actions[0].geometry.from,
  p.originalLesson.steps[0].actions[0].from);
 assert.ok(p.timing.totalMs>0);
 assert.equal(Timeline.frame(p.timing,p.timing.totalMs).done,true);
});
test('given two views, the fifth result point is from proven third-view sheet point',()=>{
 const input={knownViews:{V:[15,12],H:[15,10]},
  sheetTransform:{origin:{x:100,y:100},scale:2}};
 const p=Bridge.pointTimeline(input,8);
 assert.equal(p.status,'ready');
 assert.equal(p.steps.length,5);
 assert.equal(p.steps.at(-1).id,'third-view');
 assert.deepEqual(p.steps.at(-1).actions[0].geometry.center,
  p.originalLesson.sheet.W);
 assert.deepEqual(p.steps.at(-1).dependsOn,['guide_4']);
 assert.deepEqual(p.givens.map(x=>x.name),['V','H']);
});
test('single projection plane or contradictory pair blocks timeline and published answer',()=>{
 const a=Bridge.pointTimeline({knownViews:{V:[15,12]}});
 assert.equal(a.status,'not-verified');assert.equal(a.steps.length,0);
 assert.equal(a.mathematicallyVerified,false);
 const b=Bridge.pointTimeline({knownViews:{V:[15,12],H:[20,10]}});
 assert.equal(b.status,'not-verified');assert.equal(b.steps.length,0);
});
test('two circle mathematical cw arc transforms to sheet-space ccw sweep',()=>{
 const p=Bridge.filletTimeline('circles',circle(),sheet,6);
 assert.equal(p.status,'ready');
 assert.equal(p.steps.length,4);
 assert.equal(p.selectedBranchId,'center-1');
 assert.equal(p.originalLesson.result.arc.direction,'cw');
 const a=p.steps.at(-1).actions[0].geometry;
 assert.ok(a.sweepRadians>0,'paper y-axis flips cw to positive SVG sweep');
 const visible=Motion.arc(a.center,a.radius,a.startRadians,a.sweepRadians,1);
 assert.ok(visible.finished);assert.match(visible.d,/ A /);
 near(a.radius,80);
 assert.ok(p.g1Residual<=1e-7);
});
test('two finite segments mathematical ccw arc transforms to sheet-space cw sweep',()=>{
 const p=Bridge.filletTimeline('segments',segment(),sheet,11);
 assert.equal(p.status,'ready');assert.equal(p.steps.length,6);
 const a=p.steps.at(-1).actions[0].geometry;
 assert.ok(a.sweepRadians<0);
 const visible=Motion.arc(a.center,a.radius,a.startRadians,a.sweepRadians,1);
 assert.ok(visible.finished);assert.match(visible.d,/ A /);
 assert.equal(p.selectedBranchId,'s++');
 assert.ok(p.steps[0].actions[0].kind==='line');
 assert.ok(p.steps[2].actions[0].kind==='point');
 assert.equal(p.steps[4].actions[0].kind,'line');
});
test('camera animation fractions cannot corrupt model-space proof',()=>{
 const args=segment(),start=JSON.stringify(args);
 const p=Bridge.filletTimeline('segments',args,sheet,4);
 const id=p.steps.at(-1).actions[0];
 for(const t of [0,.15,.5,.99,1]){
  const shape=Motion.actionShapeAttrs(id,t);
  assert.equal(typeof shape.d,'string');
 }
 assert.equal(JSON.stringify(args),start);
 assert.equal(p.originalLesson.result.arc.direction,'ccw');
});
test('branches and failed directed continuity cannot leak a verified timeline',()=>{
 const a=segment();delete a.branchId;
 assert.equal(Bridge.filletTimeline('segments',a,sheet).status,'not-verified');
 a.branchId='s++';a.firstTravel='reverse';
 const b=Bridge.filletTimeline('segments',a,sheet);
 assert.equal(b.status,'not-verified');
 assert.equal(b.mathematicallyVerified,false);
 assert.deepEqual(b.steps,[]);
 const c=circle();delete c.knownSecondTravel;
 assert.equal(Bridge.filletTimeline('circles',c,sheet).status,'not-verified');
});
test('mathematical coordinates scale and translate but step proof IDs stay unchanged',()=>{
 const one=Bridge.filletTimeline('segments',segment(),sheet,0);
 const alternative={origin:{x:100,y:100},scale:16};
 const two=Bridge.filletTimeline('segments',segment(),alternative,0);
 assert.deepEqual(one.steps.map(s=>s.id),two.steps.map(s=>s.id));
 const a=one.steps.at(-1).actions[0].geometry,b=two.steps.at(-1).actions[0].geometry;
 near(b.radius,2*a.radius);
 assert.equal(Math.sign(a.sweepRadians),Math.sign(b.sweepRadians));
});
test('invalid transform, type and revision are not coerced into a valid animation',()=>{
 assert.throws(()=>Bridge.filletTimeline('segments',segment(),
  {origin:{x:Infinity,y:0},scale:8}),/sheet/);
 assert.throws(()=>Bridge.filletTimeline('segments',segment(),
  {origin:{x:0,y:0},scale:0}),/sheet/);
 assert.throws(()=>Bridge.filletTimeline('lines',segment(),sheet),/kind/);
 assert.throws(()=>Bridge.filletTimeline('circles',circle(),sheet,-1),/revision/);
 assert.throws(()=>Bridge.pointTimeline({knownPoint:{x:1,y:2,z:3},
  sheetTransform:{origin:{x:0,y:0},scale:-2}}));
});
test('recomputations give deterministic timebase without manufactured steps',()=>{
 const a=Bridge.pointTimeline({knownPoint:{x:15,y:10,z:12}},3);
 const b=Bridge.pointTimeline({knownPoint:{x:15,y:10,z:12}},3);
 assert.deepEqual(a,b);
 const player=Timeline.createPlayer(a.timing,{speed:1.5,revision:3});
 player.play(0);
 assert.ok(player.snapshot(300).elapsedMs>0);
 player.invalidate(4,400);
 assert.equal(player.canRender(3),false);
 assert.equal(player.canRender(4),false);
});

const segmentCircle=()=>({segment:{a:{x:-15,y:0},b:{x:15,y:0}},
 circle:{center:{x:0,y:5},radius:8},
 filletRadius:3,side:1,branchId:'candidate-1',direction:'ccw',
 lineTravel:'forward',knownCircleTravel:'cw'});
test('actual R1 line+circle G1 yields one consistent V5 proof-backed five-action timeline',()=>{
 const result=Bridge.filletTimeline('segment-circle',segmentCircle(),sheet,23);
 assert.equal(result.status,'ready');assert.equal(result.mathematicallyVerified,true);
 assert.equal(result.selectedBranchId,'candidate-1');assert.equal(result.revision,23);
 assert.equal(result.steps.length,5);assert.ok(result.timing.totalMs>0);
 assert.deepEqual(result.steps.map(s=>s.actions.map(a=>a.kind)),[
  ['line'],['circle'],['point'],['point','point'],['arc']]);
 assert.equal(result.steps[1].actions[0].geometry.radius,88);
 assert.equal(result.originalLesson.result.g1Verified,true);
 assert.equal(result.originalLesson.result.finiteSegmentContactVerified,true);
 const arc=result.steps.at(-1).actions[0].geometry;
 assert.ok(arc.sweepRadians<0,'model CCW appears SVG CW after flipping y');
 near(arc.radius,24);
 const attrs=Motion.actionShapeAttrs(result.steps.at(-1).actions[0],1);
 assert.match(attrs.d,/ A /);
});
test('line-circle V5 uses true source mm and preserves proof across display scale changes',()=>{
 const input=segmentCircle();
 const one=Bridge.filletTimeline('segment-circle',input,sheet,3);
 const scaled=Bridge.filletTimeline('segment-circle',input,
  {origin:{x:100,y:150},scale:16},3);
 assert.deepEqual(one.steps.map(s=>s.id),scaled.steps.map(s=>s.id));
 const a=one.steps.at(-1).actions[0].geometry,b=scaled.steps.at(-1).actions[0].geometry;
 near(b.radius,a.radius*2);
 near(b.sweepRadians,a.sweepRadians);
 assert.deepEqual(one.originalLesson.steps,scaled.originalLesson.steps);
});
test('no selected branch, missing travel, and invalid given arc cannot leak drawable V5 arc',()=>{
 const a=segmentCircle();delete a.branchId;
 const p=Bridge.filletTimeline('segment-circle',a,sheet,8);
 assert.equal(p.status,'not-verified');assert.deepEqual(p.steps,[]);
 a.branchId='candidate-1';delete a.lineTravel;
 assert.equal(Bridge.filletTimeline('segment-circle',a,sheet).status,'not-verified');
 const forbidden=segmentCircle();
 forbidden.circle.arc={startAngle:60,endAngle:90,direction:'ccw'};
 const n=Bridge.filletTimeline('segment-circle',forbidden,sheet);
 assert.equal(n.status,'not-verified');assert.equal(n.mathematicallyVerified,false);
});
test('bounded given circle source arc is retained as mathematical evidence in line-circle V5',()=>{
 const args=segmentCircle();
 const candidate=require('../../engines/planar/segment-circle-fillet.cjs')
  .finiteSegmentCircleFillets(args).candidates[0];
 const t=Math.atan2(candidate.circleContact.y-args.circle.center.y,
  candidate.circleContact.x-args.circle.center.x)*180/Math.PI;
 args.circle.arc={startAngle:t-8,endAngle:t+8,direction:'ccw'};
 const p=Bridge.filletTimeline('segment-circle',args,sheet,5);
 assert.equal(p.status,'ready');
 assert.equal(p.originalLesson.result.finiteCircleArcCount,1);
 assert.equal(p.originalLesson.result.sourceArcRangeVerified,true);
 assert.equal(p.steps.length,5);
});
