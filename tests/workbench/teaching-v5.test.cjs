'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const T=require('../../workbench/teaching-timeline-v5.js');
const M=require('../../workbench/teaching-motion-v5.js');
const A=require('../../workbench/verified-timeline-adapters.cjs');
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,a+' != '+b);
const steps=[
 {id:'known',actions:[{id:'g0',kind:'line',durationMs:1000}]},
 {id:'aux',dependsOn:['known'],actions:[{id:'a1',kind:'circle',durationMs:2000},{id:'a2',kind:'arc',durationMs:1000}]},
 {id:'explain',dependsOn:['aux'],actions:[]}
];
const compiled=()=>T.compileTimeline(steps,{gapMs:200});
test('timebase compiles deterministic action ordering, step boundaries and empty step',()=>{
 const t=compiled();
 assert.equal(t.totalMs,1000+200+2000+1000+200+200);
 assert.deepEqual(t.segments.map(a=>a.id),['g0','a1','a2']);
 assert.deepEqual(t.steps.map(s=>s.startMs),[0,1200,4400]);
 assert.equal(T.frame(t,500).actionFractions.g0,.5);
 assert.equal(T.frame(t,1200).actionFractions.a1,0);
 assert.equal(T.frame(t,2200).actionFractions.a1,.5);
 assert.deepEqual(T.frame(t,t.totalMs).completedIds,['g0','a1','a2']);
 assert.equal(T.frame(t,t.totalMs).done,true);
 assert.deepEqual(T.frame(t,-999).completedIds,[]);
});
test('speed changed mid playback preserves media time, no jump or restart',()=>{
 const t=compiled(),p=T.createPlayer(t);
 p.play(0);
 near(p.snapshot(500).elapsedMs,500);
 p.setSpeed(2.5,500);
 near(p.snapshot(700).elapsedMs,1000);
 p.pause(700);
 near(p.snapshot(70000).elapsedMs,1000);
 p.setSpeed(.25,70000);
 p.play(70000);
 near(p.snapshot(71000).elapsedMs,1250);
 assert.equal(p.snapshot().speed,.25);
});
test('seek step, seek progress, replay and end boundary honor exact elapsed',()=>{
 const p=T.createPlayer(compiled());
 near(p.seekStep(2,0).elapsedMs,4400);
 near(p.seekProgress(.5,100).elapsedMs,compiled().totalMs/2);
 const end=p.seekStep(3,100);
 assert.equal(end.done,true);assert.equal(end.playing,false);
 p.seekStep(0,110);
 p.play(111);near(p.snapshot(311).elapsedMs,200);
});
test('invalidated input disables stale results, reset demands a fresh revision',()=>{
 const p=T.createPlayer(compiled(),{revision:7});
 p.play(0);p.snapshot(120);
 const stale=p.invalidate(8,121);
 assert.equal(stale.invalid,true);assert.equal(stale.playing,false);
 assert.equal(p.canRender(7),false);
 assert.equal(p.canRender(8),false);
 assert.equal(p.seekStep(2,122).elapsedMs,0);
 assert.equal(p.play(123).playing,false);
 assert.throws(()=>p.reset(7,130));
 const restored=p.reset(8,131);
 assert.equal(restored.invalid,false);assert.equal(p.canRender(8),true);
 assert.equal(restored.elapsedMs,0);
});
test('slow or variable animation clock is deterministic and finishes exactly',()=>{
 const t=compiled(),p=T.createPlayer(t,{speed:4});
 p.play(0);const done=p.snapshot(50000);
 assert.equal(done.elapsedMs,t.totalMs);assert.equal(done.playing,false);
 assert.throws(()=>p.snapshot(49999),/backwards/);
});
test('invalid timing, dependency, duplicate ID, types, ranges rejected',()=>{
 assert.throws(()=>T.compileTimeline([steps[1]]),/dependency/);
 assert.throws(()=>T.compileTimeline([{id:'x',actions:[{id:'a',kind:'line'},{id:'a',kind:'line'}]}]));
 assert.throws(()=>T.compileTimeline([{id:'bad',actions:[{id:'a',kind:'rect'}]}]));
 assert.throws(()=>T.compileTimeline([{id:'a',actions:[]}],{gapMs:-1}));
 assert.throws(()=>T.compileTimeline([{id:'a',actions:[{id:'b',kind:'line',durationMs:Infinity}]}]));
 assert.throws(()=>T.validateSpeed(.1));assert.throws(()=>T.validateSpeed(4.01));
 assert.throws(()=>T.createPlayer(compiled(),{revision:-1}));
 assert.throws(()=>T.createPlayer(compiled()).seekMs(NaN,0));
});
test('line circle and arc rendering preserve exact geometry at full progress',()=>{
 const l=M.line({x:10,y:20},{x:110,y:60},.5);
 assert.deepEqual(l.pen,{x:60,y:40});
 const circle=M.circle({x:2,y:3},10,.25);
 near(circle.pen.x,12);near(circle.pen.y,3);
 near(circle.visibleLength,Math.PI*5);
 const arc=M.arc({x:0,y:0},10,0,Math.PI/2,1);
 near(arc.pen.x,0);near(arc.pen.y,10);
 assert.match(arc.d,/ A 10 10 0 0 1 /);
 const rev=M.arc({x:0,y:0},10,Math.PI/2,-Math.PI/2,1);
 assert.match(rev.d,/ A 10 10 0 0 0 /);
 assert.equal(M.arc({x:0,y:0},10,0,Math.PI/2,0).finished,false);
});
test('only sheet-mapped directed arcs reverse mathematical angular orientation',()=>{
 const projected=M.projectArcFromVerifiedModel({center:{x:0,y:0},radius:10,
  startAngle:90,endAngle:0,direction:'cw'}, {origin:{x:200,y:210},scale:5});
 assert.deepEqual(projected.center,{x:200,y:210});
 near(projected.radius,50);
 assert.ok(projected.sweepRadians>0);
 const full=M.arc(projected.center,projected.radius,projected.startRadians,projected.sweepRadians,1);
 near(full.pen.x,250);near(full.pen.y,210);
 assert.throws(()=>M.projectArcFromVerifiedModel({center:{x:0,y:0},radius:10,
  startAngle:90,endAngle:0,direction:'ccw'},{origin:{x:1,y:1},scale:2}));
});
test('updateSvg changes existing element attributes without recreating DOM nodes',()=>{
 const attrs={},node={setAttribute(k,v){attrs[k]=v}};
 M.updateSvg(node,{kind:'line',geometry:{from:{x:0,y:0},to:{x:100,y:60}}},.4);
 assert.equal(attrs.x2,'40');assert.equal(attrs.y2,'24');
 M.updateSvg(node,{kind:'line',geometry:{from:{x:0,y:0},to:{x:100,y:60}}},1);
 assert.equal(attrs.x2,'100');
 assert.throws(()=>M.updateSvg(node,{kind:'rectangle',geometry:{}},1));
});
test('focus and camera elapsed-ms interpolation are frame-rate independent',()=>{
 const b={minX:80,maxX:100,minY:120,maxY:180};
 const v=M.focus(b,{width:720,height:440,zoom:1.2});
 assert.equal(v.width,600);
 const current={x:0,y:0,width:720,height:440};
 const target={x:100,y:40,width:620,height:400};
 const one=M.cameraTowards(current,target,80,170);
 const two=M.cameraTowards(M.cameraTowards(current,target,40,170),target,40,170);
 for(const k of ['x','y','width','height'])near(one[k],two[k]);
 assert.deepEqual(M.cameraTowards(current,target,16,170,true),target);
});
test('actual DA-03 projection builds only verified four-guide sequence',()=>{
 const p=A.projectionPlan({knownViews:{V:[15,12],H:[15,10]},
  sheetTransform:{origin:{x:100,y:100},scale:2}},13);
 assert.equal(p.status,'ready');assert.equal(p.revision,13);
 assert.equal(p.mathematicallyVerified,true);assert.equal(p.steps.length,5);
 assert.deepEqual(p.steps.map(s=>s.id),['guide_1','guide_2','guide_3','guide_4','third-view']);
 assert.equal(p.steps[3].actions[0].kind,'line');
 assert.equal(p.steps[4].actions[0].kind,'point');
 assert.equal(p.steps[4].actions[0].id,'result-W');
 assert.equal(p.givens.length,2);
 assert.ok(p.timing.totalMs>0);
 assert.ok(T.frame(p.timing,p.timing.totalMs).done);
});
test('DA-03 unconfirmed, contradictory or underconstrained inputs never show animated answer',()=>{
 const one=A.projectionPlan({knownViews:{V:[15,12]}});
 assert.equal(one.status,'not-verified');assert.deepEqual(one.steps,[]);
 const bad=A.projectionPlan({knownViews:{V:[15,12],H:[16,10]}});
 assert.equal(bad.status,'not-verified');assert.deepEqual(bad.steps,[]);
 assert.throws(()=>A.projectionPlan({knownViews:{V:[NaN,12]}}));
});
const circles={first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10};
test('actual DA-02 directed two-circle G1 proof required for four-step animation',()=>{
 const r=A.circleFilletPlan({...circles,branchId:'center-1',direction:'cw',
  knownFirstTravel:'ccw',knownSecondTravel:'ccw'},undefined,3);
 assert.equal(r.status,'ready');assert.equal(r.selectedBranchId,'center-1');
 assert.equal(r.mathematicallyVerified,true);assert.equal(r.steps.length,4);
 assert.equal(r.steps[3].actions[0].kind,'arc');
 assert.ok(r.steps[0].actions.every(a=>a.kind==='circle'));
 assert.ok(r.g1Residual<=1e-7);
});
test('two-circle missing branch, missing direction or unresolved G1 never draw fillet',()=>{
 for(const args of [
  {...circles,direction:'cw'},
  {...circles,branchId:'center-1'},
  {...circles,branchId:'center-1',direction:'cw'},
  {...circles,branchId:'center-1',direction:'cw',knownFirstTravel:'cw',knownSecondTravel:'ccw'}
 ]){
  const r=A.circleFilletPlan(args);
  assert.equal(r.status,'not-verified');
  assert.equal(r.mathematicallyVerified,false);assert.deepEqual(r.steps,[]);
 }
});
test('real finite-segment fillet refuses unchosen and unverified candidate',()=>{
 const input={first:{a:{x:0,y:0},b:{x:30,y:0}},
  second:{a:{x:30,y:0},b:{x:30,y:30}},filletRadius:5};
 const no=A.segmentFilletPlan(input);
 assert.equal(no.status,'not-verified');assert.equal(no.mathematicallyVerified,false);
});

test('actual DA-02 finite-segment interior G1 solution animates verified offset and final arc',()=>{
 const {finiteTwoSegmentFillets}=require('../../engines/planar/two-segment-fillet.cjs');
 const input={first:{a:{x:0,y:0},b:{x:30,y:0}},
  second:{a:{x:30,y:0},b:{x:30,y:30}},filletRadius:5};
 const solved=finiteTwoSegmentFillets(input);
 const candidate=(solved.candidates||[]).find(c=>
  Math.hypot(c.center.x-25,c.center.y-5)<1e-6);
 assert.ok(candidate,'interior finite segment candidate must exist');
 const p=A.segmentFilletPlan({...input,branchId:candidate.id,direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'},undefined,4);
 assert.equal(p.status,'ready',p.reason);
 assert.equal(p.mathematicallyVerified,true);
 assert.equal(p.selectedBranchId,candidate.id);
 assert.equal(p.revision,4);
 assert.ok(p.steps.some(s=>s.actions.some(a=>a.kind==='line')));
 assert.equal(p.steps.at(-1).actions.at(-1).kind,'arc');
 assert.ok(p.timing.totalMs>0);
});
