'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createConfirmedFilletSession:createSession}=
 require('../../workbench/v31-fillet-session.cjs');
const point=(x,y)=>({x,y});
const seg=(x1,y1,x2,y2)=>({a:point(x1,y1),b:point(x2,y2)});
const input=(radius=3)=>({
 problem:{
  kind:'two-segments',unit:'mm',revision:5,filletRadius:radius,
  geometry:{first:seg(-10,0,10,0),second:seg(0,-10,0,10)}
 },
 selection:{branchId:'s++',direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'},
 sheet:{origin:point(350,200),scale:4}
});
const make=()=>createSession(input(),{now:0,speed:1});

test('real verified V5 player uses the current revision and supports speed/seek',()=>{
 const session=make();
 assert.equal(session.revision,5);
 const first=session.snapshot(0);
 assert.equal(first.status,'ready');
 assert.equal(first.mathematicallyVerified,true);
 assert.equal(first.ready,true);
 assert.equal(first.playback.revision,5);
 assert.equal(first.playback.playing,false);
 assert.equal(session.canRender(5),true);
 assert.equal(session.canRender(4),false);
 const running=session.play(100);
 assert.equal(running.playback.playing,true);
 const advanced=session.snapshot(300);
 assert.ok(advanced.playback.elapsedMs>0);
 const fast=session.setSpeed(2,350);
 assert.equal(fast.playback.speed,2);
 const sought=session.seekProgress(.5,400);
 assert.ok(sought.playback.ratio>=.49&&sought.playback.ratio<=.51);
 const stopped=session.pause(450);
 assert.equal(stopped.playback.playing,false);
});
test('editing radius invalidates original timeline and recomputes all geometry',()=>{
 const session=make(),before=session.snapshot(0);
 session.play(50);
 const changed=input(4);
 const next=session.replace(changed,{expectedRevision:5,now:100});
 assert.equal(next.status,'ready');
 assert.equal(next.revision,6);
 assert.equal(session.canRender(5),false);
 assert.equal(session.canRender(6),true);
 assert.equal(next.playback.playing,false);
 assert.equal(next.playback.elapsedMs,0);
 assert.equal(next.plan.typedMathEvidence.center.x,-4);
 assert.equal(next.plan.typedMathEvidence.center.y,4);
 assert.equal(next.plan.steps.at(-1).actions[0].geometry.radius,16);
 assert.equal(before.plan.steps.at(-1).actions[0].geometry.radius,12);
 assert.equal(changed.problem.revision,5,'original revision must not be edited');
});
test('ambiguous change blocks all current and old steps until new valid revision',()=>{
 const session=make();
 const changed=input();
 delete changed.selection.branchId;
 const blocked=session.replace(changed,{expectedRevision:5,now:100});
 assert.equal(blocked.revision,6);
 assert.equal(blocked.status,'requires-branch');
 assert.equal(blocked.playback,null);
 assert.deepEqual(blocked.plan.steps,[]);
 assert.equal(session.canRender(5),false);
 assert.equal(session.canRender(6),false);
 const recovered=session.replace(input(4),{expectedRevision:6,now:200});
 assert.equal(recovered.revision,7);
 assert.equal(recovered.status,'ready');
 assert.equal(recovered.playback.revision,7);
 assert.equal(session.canRender(7),true);
});
test('invalid geometry fails closed and leaves no old verified result',()=>{
 const session=make();
 const invalid=input();
 invalid.problem.geometry.first=seg(0,0,0,0);
 const r=session.replace(invalid,{expectedRevision:5,now:10});
 assert.equal(r.revision,6);
 assert.equal(r.status,'invalid-input');
 assert.equal(r.mathematicallyVerified,false);
 assert.equal(r.playback,null);
 assert.deepEqual(r.plan.steps,[]);
 assert.equal(session.canRender(5),false);
 assert.equal(session.canRender(6),false);
 const after=session.replace(input(),{expectedRevision:6,now:20});
 assert.equal(after.status,'ready');
});
test('stale revisions are rejected atomically without invalidating current plan',()=>{
 const session=make();
 const original=session.snapshot(0);
 assert.throws(()=>session.replace(input(4),{expectedRevision:4,now:10}),/stale/);
 assert.equal(session.revision,5);
 const still=session.snapshot(10);
 assert.equal(still.ready,true);
 assert.deepEqual(still.plan.typedMathEvidence,original.plan.typedMathEvidence);
 const changed=session.replace(input(4),{expectedRevision:5,now:20});
 assert.equal(changed.revision,6);
 assert.throws(()=>session.replace(input(3),{expectedRevision:5,now:30}),/stale/);
 assert.equal(session.revision,6);
});
test('session snapshots cannot mutate internal source geometry or final animation',()=>{
 const session=make(),snap=session.snapshot(0);
 snap.plan.steps.at(-1).actions[0].geometry.radius=10000;
 snap.plan.typedMathEvidence.center.x=999;
 snap.playback.actionFractions['unknown']=1;
 const fresh=session.snapshot(1);
 assert.equal(fresh.plan.steps.at(-1).actions[0].geometry.radius,12);
 assert.equal(fresh.plan.typedMathEvidence.center.x,-3);
 assert.equal(fresh.playback.actionFractions.unknown,undefined);
});
test('strict monotonic timestamps prevent stale playback time reordering',()=>{
 const session=make();
 session.play(20);
 assert.throws(()=>session.pause(10),/backwards/);
 assert.throws(()=>session.replace(input(4),{expectedRevision:5,now:0}),/backwards/);
 assert.equal(session.revision,5);
 assert.equal(session.canRender(5),true);
 assert.throws(()=>session.seekStep(-1,30),/index/);
});
test('blocked session cannot start playback or seek old geometry',()=>{
 const b=input();delete b.selection.direction;
 const session=createSession(b,{now:0});
 const r=session.play(10);
 assert.equal(r.status,'requires-direction');
 assert.equal(r.playback,null);
 assert.deepEqual(r.plan.steps,[]);
 const seek=session.seekProgress(.5,20);
 assert.equal(seek.playback,null);
});
test('independent sessions never share current revision, player or old result',()=>{
 const a=make(),b=make();
 const next=a.replace(input(4),{expectedRevision:5,now:100});
 assert.equal(next.revision,6);
 assert.equal(a.canRender(5),false);
 assert.equal(b.canRender(5),true);
 assert.equal(b.snapshot(100).plan.typedMathEvidence.center.x,-3);
});
