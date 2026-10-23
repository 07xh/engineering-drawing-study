'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cylinderCapSectionV5Preview:build}=
 require('../../engines/spatial/sections/cylinder-cap-section-v5-preview.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const p=(x,y,z)=>({x,y,z});
const cylinder=(r=5,h=30,baseCenter=p(0,0,0))=>
 ({radiusMm:r,heightMm:h,baseCenter});
const plane=(point,normal)=>({point,normal});
const tilted=z=>plane(p(0,0,z),p(1,0,1));
const horizontal=z=>plane(p(0,0,z),p(0,0,1));
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<=t,
 String(a)+' != '+String(b));
const actions=r=>r.steps.flatMap(s=>s.actions);
test('04 real lower cap boundary and lateral arc produce coherent first-angle V5 construction',()=>{
 const result=build(cylinder(),tilted(3));
 assert.equal(result.status,'ready');
 assert.equal(result.v5PreviewReady,true);
 assert.equal(result.mathematicalPerimeterVerified,true);
 assert.equal(result.completeEngineeringDrawingVerified,false);
 assert.equal(result.capChordCount,1);
 assert.equal(result.lateralArcCount,1);
 assert.equal(result.boundaryEdgeCount,2);
 assert.equal(result.givens.length,9);
 assert.equal(result.proof.topologyClosed,true);
 assert.equal(result.proof.hiddenLineVisibilityVerified,false);
 assert.equal(result.proof.solidSectionInteriorVerified,false);
 assert.equal(result.proof.sharedM2ContractSigned,false);
 assert.equal(result.globallyUnique,null);
 assert.equal(result.steps[0].id,'cap-45-transfer');
 assert.equal(result.steps[0].actions[0].id,'cap-transfer-45deg');
 const kinds=new Set(result.steps.filter(s=>s.role==='result').flatMap(s=>s.actions.map(a=>a.kind)));
 assert.ok(kinds.has('line'));
 assert.ok(result.steps.some(s=>s.title.includes('端盖真实截线')));
 assert.ok(result.steps.some(s=>s.title.includes('解析侧面截弧')));
 assert.ok(result.timing.totalMs>0);
});
test('04 model V/H/W and true 45-degree first-angle transfer hold at every boundary node',()=>{
 for(const [c,pl] of [[cylinder(),tilted(3)],[cylinder(),tilted(27)],
   [cylinder(5,8),tilted(4)],[cylinder(),tilted(15)]]){
  const result=build(c,pl);
  assert.equal(result.status,'ready');
  for(const point of result.nodes){
   near(point.V.x,point.H.x);
   near(point.V.y,point.W.y);
   near(point.transfer.x,point.W.x);
   near(point.transfer.y,point.H.y);
   near(point.transfer.x-result.sheet.transferCorner.x,
    point.transfer.y-result.sheet.transferCorner.y);
  }
 }
});
test('04 one real upper cap chord is connected despite 0/2pi angular seam',()=>{
 const result=build(cylinder(),tilted(27));
 assert.equal(result.status,'ready');
 assert.equal(result.capChordCount,1);
 assert.equal(result.lateralArcCount,2);
 assert.equal(result.proof.maxResidualMm<1e-7,true);
 assert.equal(result.resultActions>0,true);
});
test('04 cut across both cylinder caps projects two genuine cap-chord segments',()=>{
 const result=build(cylinder(5,8),tilted(4));
 assert.equal(result.status,'ready');
 assert.equal(result.capChordCount,2);
 assert.equal(result.lateralArcCount,2);
 assert.ok(result.steps.filter(s=>s.title.includes('端盖真实截线')).length>=6);
});
test('04 complete elliptic cut and internal horizontal cut do not invent cap chords',()=>{
 for(const pl of [tilted(15),horizontal(12)]){
  const result=build(cylinder(),pl);
  assert.equal(result.status,'ready');
  assert.equal(result.capChordCount,0);
  assert.equal(result.lateralArcCount,1);
  assert.equal(result.proof.topologyClosed,true);
 }
});
test('04 high-resolution 256-segment perimeter obeys existing V5 step size constraints',()=>{
 const fine=build(cylinder(),tilted(3),{samplesPerTurn:256});
 const coarse=build(cylinder(),tilted(3),{samplesPerTurn:16});
 assert.equal(fine.status,'ready');
 assert.equal(coarse.status,'ready');
 assert.ok(fine.chordErrorUpperBoundMm<coarse.chordErrorUpperBoundMm);
 assert.ok(fine.resultActions>coarse.resultActions);
 assert.ok(fine.steps.every(step=>step.actions.length<=64));
 const ids=actions(fine).map(a=>a.id);
 assert.equal(new Set(ids).size,ids.length);
 for(let i=1;i<fine.steps.length;i++)
  assert.deepEqual(fine.steps[i].dependsOn,[fine.steps[i-1].id]);
});
test('04 existing V5 speed, pause, replay, step seek and stale invalidation work',()=>{
 const result=build(cylinder(),tilted(3));
 const player=Timeline.createPlayer(result.timing,{speed:2,revision:10});
 player.play(0);
 near(player.snapshot(400).elapsedMs,800);
 const seek=player.seekStep(3,500);
 assert.equal(seek.activeStepIndex,3);
 assert.equal(player.pause(600).playing,false);
 assert.equal(player.seekProgress(0,700).elapsedMs,0);
 assert.equal(player.canRender(10),true);
 player.invalidate(11,800);
 assert.equal(player.canRender(10),false);
 assert.equal(player.canRender(11),false);
});
test('04 each real drawing primitive is valid in unmodified V5 renderer at half stroke',()=>{
 const plan=build(cylinder(),tilted(3));
 assert.equal(plan.status,'ready');
 for(const action of [...plan.givens,...actions(plan)]){
  const attrs=Motion.actionShapeAttrs(action,0.5);
  assert.ok(attrs&&typeof attrs==='object');
 }
 const zero=Timeline.frame(plan.timing,0);
 const end=Timeline.frame(plan.timing,plan.timing.totalMs);
 assert.equal(zero.done,false);
 assert.equal(end.done,true);
 assert.equal(end.completedIds.length,actions(plan).length);
});
test('04 degenerate, coincident, touching only and near-vertical plane refuse false V5 plans',()=>{
 const invalid=[
  horizontal(0),horizontal(30),tilted(-5),tilted(35),
  horizontal(-10),plane(p(2,0,0),p(1,0,0)),
  plane(p(0,0,15),p(1,0,1e-12))
 ];
 for(const pl of invalid){
  const result=build(cylinder(),pl);
  assert.equal(result.status,'blocked');
  assert.equal(result.v5PreviewReady,false);
  assert.deepEqual(result.steps,[]);
  assert.deepEqual(result.givens,[]);
  assert.equal(result.timing,null);
 }
});
test('04 malformed math inputs and invalid sampling fail before animation',()=>{
 assert.throws(()=>build(cylinder(0),tilted(3)),/positive radius/);
 assert.throws(()=>build(cylinder(),plane(p(0,0,0),p(0,0,0))),/degenerate/);
 for(const samplesPerTurn of [0,15,17,257,'64',NaN])
  assert.throws(()=>build(cylinder(),tilted(3),{samplesPerTurn}),/samplesPerTurn/);
});
test('04 presentation and mathematical proof are deterministic and do not modify inputs',()=>{
 const c=cylinder(),pl=tilted(3),beforeC=structuredClone(c),beforeP=structuredClone(pl);
 const a=build(c,pl),b=build(structuredClone(c),structuredClone(pl));
 assert.deepEqual(a,b);
 assert.deepEqual(c,beforeC);
 assert.deepEqual(pl,beforeP);
 assert.match(a.proof.scope,/1D/);
});
