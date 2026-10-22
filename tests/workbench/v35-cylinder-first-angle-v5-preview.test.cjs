'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cylinderSectionV5Preview:build}=
 require('../../engines/spatial/sections/cylinder-section-v5-preview.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const pt=(x,y,z)=>({x,y,z});
const cylinder=(radiusMm=5,heightMm=30,baseCenter=pt(0,0,0))=>
 ({radiusMm,heightMm,baseCenter});
const plane=(point,normal)=>({point,normal});
const oblique=()=>plane(pt(0,0,15),pt(1,2,1));
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,
 String(a)+' versus '+String(b));
const normal=()=>build(cylinder(),oblique());
test('04 first-angle V above H and W right from true verified cylinder section',()=>{
 const r=normal();
 assert.equal(r.status,'ready');assert.equal(r.v5PreviewReady,true);
 assert.equal(r.mathematicallyVerified,true);
 assert.equal(r.completeEngineeringDrawingVerified,false);
 assert.equal(r.proof.solidCapContourVerified,false);
 assert.equal(r.proof.hiddenLineVisibilityVerified,false);
 assert.equal(r.proof.sharedM2ContractSigned,false);
 assert.equal(r.globallyUnique,null);
 assert.equal(r.sampledPolylineOnly,true);
 assert.equal(r.givens.length,9);
 assert.ok(r.stations.length>=8);
 assert.ok(r.timing.totalMs>0);
 for(const s of r.stations){
  assert.ok(s.V.y<s.H.y,'front projection must be above top view');
  assert.ok(s.W.x>s.V.x,'right-side projection must be to the right');
  near(s.V.x,s.H.x);
  near(s.V.y,s.W.y);
  near(s.transfer.x,s.W.x);
  near(s.transfer.y,s.H.y);
  near(s.transfer.x-r.sheet.transferCorner.x,
   s.transfer.y-r.sheet.transferCorner.y);
 }
});
test('45-degree guide is actual 1:1 depth transfer, no fixed screenshot',()=>{
 const r=normal();
 const guide=r.steps[0].actions[0];
 assert.equal(guide.id,'transfer-45deg');
 assert.equal(guide.kind,'line');
 near(guide.geometry.to.x-guide.geometry.from.x,
   guide.geometry.to.y-guide.geometry.from.y);
 const r2=build(cylinder(3,16,pt(12,-7,5)),
  plane(pt(12,-7,13),pt(1,0,1)));
 assert.equal(r2.status,'ready');
 assert.notDeepEqual(r2.givens,r.givens);
 assert.ok(r2.stations.every(s=>Math.abs(s.transfer.x-s.W.x)<1e-7));
});
test('every section point was recalculated from real plane plus cylindrical surface',()=>{
 const r=normal();
 assert.ok(r.proof.maxResidualMm<1e-7);
 for(const s of r.stations){
  near(s.modelMm.x*s.modelMm.x+s.modelMm.y*s.modelMm.y,25);
  near(s.modelMm.x+2*s.modelMm.y+s.modelMm.z,15);
  assert.ok(s.residualsMm.plane<1e-7&&s.residualsMm.side<1e-7);
 }
 assert.ok(r.stations.some(s=>s.labels.includes('maximum-height')));
 assert.ok(r.stations.some(s=>s.labels.includes('minimum-height')));
});
test('timeline has real source-backed generator, projection and approximate section steps',()=>{
 const r=normal();
 assert.ok(r.steps.length>=2*r.stations.length+4);
 assert.equal(r.steps[0].id,'draw-transfer-45');
 assert.equal(r.steps.at(-1).id,'sampled-section-W');
 for(let i=1;i<r.steps.length;i++){
  assert.deepEqual(r.steps[i].dependsOn,[r.steps[i-1].id]);
 }
 for(const s of r.steps){
  assert.ok(s.actions.length>0);
  for(const action of s.actions){
   assert.ok(['line','point'].includes(action.kind));
   const attrs=Motion.actionShapeAttrs(action,0.5);
   assert.ok(attrs&&typeof attrs==='object');
  }
 }
 assert.equal(r.steps.filter(s=>s.id.startsWith('sampled-section-')).length,3);
 assert.equal(r.steps.filter(s=>s.id.endsWith('-projectors')).length,r.stations.length);
 const first=Timeline.frame(r.timing,0),last=Timeline.frame(r.timing,r.timing.totalMs);
 assert.equal(first.done,false);assert.equal(last.done,true);
 assert.ok(last.completedIds.length>r.stations.length);
});
test('real V5 player supports variable playback speed, step seeking and rewind',()=>{
 const r=normal();
 const player=Timeline.createPlayer(r.timing,{speed:2,revision:8});
 assert.equal(player.canRender(8),true);
 player.play(0);
 const inMotion=player.snapshot(400);
 assert.equal(inMotion.playing,true);
 near(inMotion.elapsedMs,800);
 const sought=player.seekStep(4,500);
 assert.equal(sought.activeStepIndex,4);
 const rewind=player.seekProgress(0,600);
 assert.equal(rewind.elapsedMs,0);
 player.invalidate(9,700);
 assert.equal(player.canRender(8),false);
 assert.equal(player.canRender(9),false);
 assert.equal(player.snapshot(800).invalid,true);
});
test('analytic polyline error bound is honest and shrinks as visual subdivisions grow',()=>{
 const coarse=build(cylinder(),oblique(),{samples:16});
 const fine=build(cylinder(),oblique(),{samples:128});
 assert.equal(coarse.status,'ready');assert.equal(fine.status,'ready');
 assert.ok(fine.chordErrorUpperBoundMm<coarse.chordErrorUpperBoundMm);
 assert.equal(fine.sampledPolylineOnly,true);
 assert.equal(coarse.sampledPolylineOnly,true);
 assert.ok(coarse.chordErrorUpperBoundMm>0);
 assert.ok(fine.steps.at(-1).actions.length>coarse.steps.at(-1).actions.length);
});
test('horizontal section remains an actual circular analytic cross-section',()=>{
 const r=build(cylinder(),plane(pt(0,0,15),pt(0,0,1)),{samples:32,ordinaryDivisions:4});
 assert.equal(r.status,'ready');assert.equal(r.proof.curveKind,'circle');
 assert.equal(r.stations.length,4);
 assert.ok(r.stations.every(s=>Math.abs(s.modelMm.z-15)<1e-8));
 assert.equal(r.steps.filter(s=>s.id.endsWith('-generators')).length,4);
});
test('clipped, nonintersecting and almost vertical surfaces cannot emit a fake timeline',()=>{
 const shapes=[
  plane(pt(0,0,3),pt(1,0,1)),
  plane(pt(0,0,-10),pt(0,0,1)),
  plane(pt(0,0,15),pt(1,0,1e-12)),
  plane(pt(2,0,0),pt(1,0,0))
 ];
 for(const p of shapes){
  const result=build(cylinder(),p);
  assert.equal(result.status,'blocked');
  assert.equal(result.v5PreviewReady,false);
  assert.equal(result.mathematicallyVerified,false);
  assert.deepEqual(result.steps,[]);
  assert.equal(result.timing,null);
  assert.deepEqual(result.givens,[]);
 }
});
test('invalid model units, overly large subdivisions and degenerate primitives are rejected',()=>{
 assert.throws(()=>build(cylinder(0),oblique()),/positive radius/);
 assert.throws(()=>build(cylinder(),plane(pt(0,0,0),pt(0,0,0))),/degenerate/);
 for(const samples of [0,15,17,129,'32',NaN])
  assert.throws(()=>build(cylinder(),oblique(),{samples}),/samples/);
 for(const ordinaryDivisions of [1,5,40])
  assert.throws(()=>build(cylinder(),oblique(),{ordinaryDivisions}),/ordinaryDivisions/);
});
test('same source inputs produce the same mathematical animation plan without mutation',()=>{
 const shape=cylinder(),section=oblique();
 const beforeShape=structuredClone(shape),beforePlane=structuredClone(section);
 const a=build(shape,section),b=build(structuredClone(shape),structuredClone(section));
 assert.deepEqual(a,b);
 assert.deepEqual(shape,beforeShape);assert.deepEqual(section,beforePlane);
});
