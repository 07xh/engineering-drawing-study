'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {constructionStepsToV5:toV5}=
 require('../../workbench/construction-step-v5-adapter.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const {solveProjection}=require('../../engines/projection/point-projection.cjs');
const sheet={origin:{x:100,y:200},scale:10};
const step=(id,actions,dependsOn=[])=>({id,explanation:'source geometric step '+id,
 actions,dependsOn});
const point=(x,y)=>({kind:'point',geometry:{x,y},style:'auxiliary'});
const line=(x1,y1,x2,y2)=>({kind:'line',geometry:{x1,y1,x2,y2},style:'result'});
const circle=(cx,cy,r)=>({kind:'circle',geometry:{cx,cy,r},style:'given'});
const wrap=(steps,options={})=>toV5({steps,frame:'model-mm-2d',unit:'mm',
 sheet,revision:2,...options});

test('01 ConstructionStep model millimetres convert to same existing 07 V5 player',()=>{
 const model=[
  step('guide', [point(1,2),line(0,0,2,2),circle(1,2,3)]),
  step('answer',[line(1,2,3,4)],['guide'])
 ];
 const before=JSON.stringify(model);
 const r=wrap(model);
 assert.equal(r.status,'presentation-only');
 assert.equal(r.frame,'sheet-px');
 assert.equal(r.mathematicallyVerified,false);
 assert.equal(r.readyForStandardAnswer,false);
 assert.equal(r.requiresTrustedSolveResult,true);
 assert.equal(r.revision,2);
 assert.equal(r.steps[0].sourceStepId,'guide');
 assert.deepEqual(r.steps[0].actions[0].geometry.center,{x:110,y:180});
 assert.deepEqual(r.steps[0].actions[1].geometry,{from:{x:100,y:200},
  to:{x:120,y:180}});
 assert.deepEqual(r.steps[0].actions[2].geometry,{center:{x:110,y:180},radius:30});
 assert.deepEqual(r.steps[1].dependsOn,['v5_step_1']);
 assert.equal(r.steps[1].actions[0].sourceStyle,'result');
 assert.equal(JSON.stringify(model),before);
 assert.ok(r.timing.totalMs>0);
 assert.equal(Timeline.frame(r.timing,r.timing.totalMs).done,true);
 for(const s of r.steps)for(const a of s.actions)
  assert.ok(Motion.actionShapeAttrs(a,1));
});

test('same geometric model reprojects under a changed px-per-mm sheet only',()=>{
 const model=[step('S',[point(-3,4),line(-3,4,2,6)])];
 const a=wrap(model);
 const b=wrap(model,{sheet:{origin:{x:200,y:150},scale:5}});
 assert.deepEqual(a.steps.map(s=>s.sourceStepId),b.steps.map(s=>s.sourceStepId));
 assert.deepEqual(a.steps[0].actions[0].geometry.center,{x:70,y:160});
 assert.deepEqual(b.steps[0].actions[0].geometry.center,{x:185,y:130});
 assert.equal(a.steps[0].actions[1].geometry.to.x,120);
 assert.equal(b.steps[0].actions[1].geometry.to.x,210);
});

test('actual 03 mathematically solved point projects into normalized V5 format',()=>{
 const verified=solveProjection({knownPoint:{x:15,y:10,z:12}});
 assert.equal(verified.status,'unique');
 assert.equal(verified.globallyUnique,true);
 const steps=[step('projectH',[point(verified.point.x,verified.point.y)])];
 const view=wrap(steps);
 assert.deepEqual(view.steps[0].actions[0].geometry.center,{x:250,y:100});
 // The pure adapter remains non-authoritative even for an actual solver input.
 assert.equal(view.mathematicallyVerified,false);
});

test('timebase supports seek, speed, steps and input revision invalidation',()=>{
 const r=wrap([step('A',[line(0,0,1,1)]),step('B',[point(1,1)],['A'])]);
 const player=Timeline.createPlayer(r.timing,{speed:1.7,revision:r.revision});
 player.play(0);
 assert.ok(player.snapshot(200).elapsedMs>0);
 player.setSpeed(.5,250);
 player.seekStep(1,300);
 assert.equal(player.snapshot().activeStepIndex,1);
 player.invalidate(3,400);
 assert.equal(player.canRender(2),false);
 assert.equal(player.canRender(3),false);
});

test('legacy SVG arc cannot silently become mathematically directed model arc',()=>{
 const legacyArc={kind:'arc',geometry:{
  cx:0,cy:0,r:2,startAngle:10,endAngle:80,direction:'clockwise'}};
 assert.throws(()=>wrap([step('arc',[legacyArc])]),/directed-arc contract/);
 for(const bad of [
  {kind:'dimension',geometry:{x1:0,y1:0,x2:1,y2:1},text:'1'},
  {kind:'text',geometry:{x:0,y:0},text:'caption'}
 ])assert.throws(()=>wrap([step('unsupported',[bad])]),/unsupported V5/);
});

test('pixel frames, bad transforms, invalid dependencies and stale source are refused',()=>{
 const good=[step('A',[line(0,0,1,1)])];
 for(const options of [
  {frame:'original-image-px'}, {unit:'px'}, {frame:undefined},
  {sheet:{origin:{x:Infinity,y:0},scale:2}},
  {sheet:{origin:{x:0,y:0},scale:-2}},
  {revision:-1},{verified:true},{solveResult:{status:'unique'}}
 ])assert.throws(()=>wrap(good,options));
 assert.throws(()=>wrap([step('A',[point(1,1)],['B']),
  step('B',[point(2,2)])]),/dependency/);
 assert.throws(()=>wrap([step('A',[point(1,1)]),
  step('A',[point(2,2)])]),/duplicate/);
 assert.throws(()=>wrap([step('A',[line(0,0,0,0)])]),/zero-length/);
 assert.throws(()=>wrap([step('A',[point(Number.MAX_VALUE,0)])]),/overflow/);
 assert.throws(()=>wrap([]),/1..300/);
});
