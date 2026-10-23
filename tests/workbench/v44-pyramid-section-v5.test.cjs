'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pyramidSectionV5Preview:solve}=
 require('../../engines/spatial/sections/rectangular-pyramid-v5-preview.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const p=(x,y,z)=>({x,y,z});
const pyramid=()=>({base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)});
const plane=(point,normal)=>({point,normal});
const diag=k=>plane(p(0,0,k),p(1,1,1));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,String(a)+' vs '+String(b));
function assertPlan(o,n){
 assert.equal(o.status,'ready');
 assert.equal(o.v5PreviewReady,true);assert.equal(o.mathematicalPerimeterVerified,true);
 assert.equal(o.visibilityVerified,false);assert.equal(o.firstAngleConventionSignedOff,false);
 assert.equal(o.completeEngineeringDrawingVerified,false);assert.equal(o.globallyUnique,null);
 assert.equal(o.sectionEdgeCount,n);assert.equal(o.stations.length,n);
 assert.equal(o.givens.length,24);
 assert.equal(o.steps.length,1+3*n);
 assert.equal(o.timing.steps.length,o.steps.length);
 assert.equal(o.steps.filter(s=>s.role==='result').length,n);
 assert.equal(o.steps.filter(s=>s.role==='guide').length,1+2*n);
 assert.equal(o.proof.sourcePyramidEdges,8);
 assert.equal(o.proof.sourceSectionFaces.length,n);
 for(const [i,s] of o.steps.entries()){
  assert.deepEqual(s.dependsOn,i?[o.steps[i-1].id]:[]);
  assert.ok(s.actions.length);
  for(const a of s.actions)assert.ok(Motion.actionShapeAttrs(a,.5));
 }
 for(const station of o.stations){
  near(station.V.x,station.H.x);
  near(station.V.y,station.W.y);
  near(station.transfer.x,station.W.x);
  near(station.transfer.y,station.H.y);
  near(station.transfer.x-o.sheet.transferCorner.x,
   station.transfer.y-o.sheet.transferCorner.y);
  assert.match(station.sourceEdgeId,/^(base|apex)-edge-[0-3]$/);
  assert.ok(station.planeResidualMm<1e-7);
 }
}
test('04 five-sided oblique pyramid section produces real 3-view V5 construction',()=>{
 const o=solve(pyramid(),diag(15));assertPlan(o,5);
 assert.equal(o.steps[0].actions[0].id,'pyramid-transfer-45deg');
 assert.ok(o.steps.filter(s=>s.role==='result').every(s=>
  s.actions.every(a=>a.visibility==='undetermined')));
 assert.ok(o.steps.some(s=>s.explanation&&s.explanation.includes('有限空间棱')));
});
test('04 near base corner oblique cut yields triangle and exact projection stations',()=>{
 const o=solve(pyramid(),diag(3));assertPlan(o,3);
 for(const station of o.stations)
  near(station.modelMm.x+station.modelMm.y+station.modelMm.z,3);
});
test('04 horizontal cut yields quad with true similarity-based area and perimeter',()=>{
 const o=solve(pyramid(),plane(p(0,0,8),p(0,0,1)));assertPlan(o,4);
 const side=10*(15-8)/15;
 near(o.areaMm2,side*side);
 near(o.perimeterMm,4*side);
 for(const station of o.stations)near(station.modelMm.z,8);
});
test('04 V5 actions draw progressively instead of showing completed polygon immediately',()=>{
 const o=solve(pyramid(),diag(15));
 const start=Timeline.frame(o.timing,0),end=Timeline.frame(o.timing,o.timing.totalMs);
 assert.equal(start.done,false);assert.equal(start.completedIds.length,0);
 assert.equal(end.done,true);
 assert.equal(end.completedIds.length,o.steps.flatMap(s=>s.actions).length);
 assert.ok(o.steps.flatMap(s=>s.actions).some(a=>a.kind==='line'));
});
test('04 native V5 step rewind, variable speed and revision invalidation survive pyramid stages',()=>{
 const o=solve(pyramid(),diag(15)),player=Timeline.createPlayer(o.timing,{revision:7,speed:2});
 player.play(0);
 near(player.snapshot(250).elapsedMs,500);
 const snapshot=player.seekStep(5,300);
 assert.equal(snapshot.activeStepIndex,5);
 near(snapshot.elapsedMs,o.timing.steps[5].startMs);
 near(player.seekStep(0,400).elapsedMs,0);
 player.invalidate(8,500);
 assert.equal(player.canRender(7),false);
});
test('04 true 45-degree transfer and location are invariant under translated model',()=>{
 const a=solve(pyramid(),diag(15)),b=solve({
  base:{minX:7,minY:-4,maxX:17,maxY:6,z:3},apex:p(12,1,18)
 },plane(p(7,-4,18),p(1,1,1)));
 assertPlan(a,5);assertPlan(b,5);
 near(a.areaMm2,b.areaMm2);near(a.perimeterMm,b.perimeterMm);
 for(let i=0;i<a.stations.length;i++){
  const found=b.stations.find(q=>Math.hypot(
   q.modelMm.x-a.stations[i].modelMm.x-7,
   q.modelMm.y-a.stations[i].modelMm.y+4,
   q.modelMm.z-a.stations[i].modelMm.z-3)<1e-7);
  assert.ok(found);
  for(const view of ['V','H','W']){
   near(a.stations[i][view].x,found[view].x);
   near(a.stations[i][view].y,found[view].y);
  }
 }
});
test('04 real model scaling changes paper ratio without changing source-edge provenance',()=>{
 const small=solve(pyramid(),diag(15));
 const large=solve({base:{minX:0,minY:0,maxX:20,maxY:20,z:0},
  apex:p(10,10,30)},diag(30));
 assertPlan(small,5);assertPlan(large,5);
 near(large.areaMm2,small.areaMm2*4);
 near(large.perimeterMm,small.perimeterMm*2);
 assert.notEqual(small.sheet.scale,large.sheet.scale);
});
test('04 degenerate or out-of-range cuts yield blocked plan with no false animation',()=>{
 for(const pl of [diag(0),diag(25),plane(p(0,0,0),p(0,0,1)),
  plane(p(0,0,40),p(0,0,1))]){
  const plan=solve(pyramid(),pl);
  assert.equal(plan.status,'blocked');
  assert.equal(plan.v5PreviewReady,false);
  assert.deepEqual(plan.steps,[]);
  assert.equal(plan.timing,null);
 }
});
test('04 deterministic source plan, and original pyramid/plane inputs remain unchanged',()=>{
 const model=pyramid(),pl=diag(15),copy=structuredClone(model);
 const a=solve(model,pl),b=solve(structuredClone(model),structuredClone(pl));
 assert.deepEqual(a,b);
 assert.deepEqual(model,copy);assert.deepEqual(pl,diag(15));
});
