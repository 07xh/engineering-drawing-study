'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismSectionV5Preview:solve}=
 require('../../engines/spatial/sections/rectangular-prism-v5-preview.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const P=(x,y,z)=>({x,y,z});
const box=(min=P(0,0,0),max=P(10,10,10))=>({min,max});
const plane=(point,normal)=>({point,normal});
const diag=z=>plane(P(0,0,z),P(1,1,1));
const near=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<=eps,String(a)+' != '+String(b));
function validate(result,n){
 assert.equal(result.status,'ready');
 assert.equal(result.v5PreviewReady,true);
 assert.equal(result.mathematicalPerimeterVerified,true);
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.completeEngineeringDrawingVerified,false);
 assert.equal(result.firstAngleConventionSignedOff,false);
 assert.equal(result.constructionStandardSignedOff,false);
 assert.equal(result.globallyUnique,null);
 assert.equal(result.sectionEdgeCount,n);
 assert.equal(result.stations.length,n);
 assert.equal(result.givens.length,12);
 assert.equal(result.steps.length,1+2*n+n);
 assert.equal(result.proof.polygonDegreeTwo,true);
 assert.equal(result.timing.steps.length,result.steps.length);
 assert.ok(result.timing.totalMs>0);
 const paper=result.sheet;
 for(const station of result.stations){
  near(station.V.x,station.H.x);
  near(station.V.y,station.W.y);
  near(station.transfer.x,station.W.x);
  near(station.transfer.y,station.H.y);
  near(station.transfer.x-paper.transferCorner.x,
    station.transfer.y-paper.transferCorner.y);
  assert.ok(station.sourceEdgeIds.length>=1);
  assert.ok(station.planeResidualMm<1e-6);
  assert.ok(station.boxOutsideMm<1e-6);
 }
 for(let i=0;i<result.steps.length;i++){
  const s=result.steps[i];
  assert.equal(s.actions.length>0,true);
  assert.deepEqual(s.dependsOn,i?[result.steps[i-1].id]:[]);
  for(const a of s.actions)
   assert.ok(Motion.actionShapeAttrs(a,.5));
 }
}
test('04 real hexagonal oblique prism produces math-proven step-by-step three views',()=>{
 const out=solve(box(),diag(12));validate(out,6);
 assert.equal(out.steps[0].actions[0].id,'prism-guide-45deg');
 near(out.steps[0].actions[0].geometry.to.x-
  out.steps[0].actions[0].geometry.from.x,
  out.steps[0].actions[0].geometry.to.y-
  out.steps[0].actions[0].geometry.from.y);
 for(const vertex of out.stations)
  near(vertex.modelMm.x+vertex.modelMm.y+vertex.modelMm.z,12);
 assert.equal(out.steps.filter(s=>s.role==='result').length,6);
 assert.equal(out.steps.filter(s=>s.role==='guide').length,13);
});
test('04 triangular prism section x+y+z=3 yields exactly three drawing edges',()=>{
 const out=solve(box(),diag(3));validate(out,3);
 near(out.areaMm2,9*Math.sqrt(3)/2);
 assert.ok(out.steps.at(-1).actions.every(a=>a.visibility==='undetermined'));
});
test('04 horizontal and vertical rectangular cuts preserve true prism dimensions',()=>{
 for(const section of [plane(P(0,0,5),P(0,0,1)),
  plane(P(5,0,0),P(1,0,0))]){
  const out=solve(box(),section);validate(out,4);
  near(out.areaMm2,100);near(out.perimeterMm,40);
 }
});
test('04 mathematical projection lines, points and result strokes are actual V5 drawable',()=>{
 const out=solve(box(),diag(12));
 for(const action of out.givens)Motion.actionShapeAttrs(action,1);
 const all=out.steps.flatMap(s=>s.actions);
 assert.equal(new Set(all.map(a=>a.id)).size,all.length);
 assert.equal(all.filter(a=>a.visibility==='undetermined').length,18);
 const first=Timeline.frame(out.timing,0);
 const last=Timeline.frame(out.timing,out.timing.totalMs);
 assert.equal(first.done,false);assert.equal(last.done,true);
 assert.equal(last.completedIds.length,all.length);
 assert.equal(first.completedIds.length,0);
});
test('04 V5 native step rewind, speed and revision invalidation work unchanged',()=>{
 const out=solve(box(),diag(12));
 const player=Timeline.createPlayer(out.timing,{revision:11,speed:2});
 player.play(0);
 near(player.snapshot(250).elapsedMs,500);
 const p=player.seekStep(3,300);
 assert.equal(p.activeStepIndex,3);
 const back=player.seekStep(0,400);
 near(back.elapsedMs,0);
 player.invalidate(12,500);
 assert.equal(player.canRender(11),false);
 assert.equal(player.canRender(12),false);
});
test('04 source model coordinates, 45-degree transfer and paper preserve translation invariants',()=>{
 const a=solve(box(),diag(12)),b=solve(
  box(P(8,-9,4),P(18,1,14)),
  plane(P(8,-9,16),P(1,1,1))
 );validate(a,6);validate(b,6);
 near(a.areaMm2,b.areaMm2);near(a.perimeterMm,b.perimeterMm);
 const flatten=o=>o.stations.map(s=>[s.V,s.H,s.W,s.transfer]).flat();
 const pa=flatten(a),pb=flatten(b);
 for(let i=0;i<pa.length;i++){
  near(pa[i].x,pb[i].x);near(pa[i].y,pb[i].y);
 }
});
test('04 coordinate scaling changes real paper extent, never hardcodes a sample screenshot',()=>{
 const small=solve(box(),diag(12));
 const big=solve(box(P(0,0,0),P(20,20,20)),diag(24));
 validate(small,6);validate(big,6);
 near(big.areaMm2,4*small.areaMm2);
 near(big.perimeterMm,2*small.perimeterMm);
 assert.notEqual(small.sheet.scale,big.sheet.scale);
});
test('04 degenerate, face-coincident and unsupported sections yield no fake animation',()=>{
 for(const section of [
  diag(33),diag(0),plane(P(0,0,0),P(0,0,1)),
  plane(P(0,0,0),P(1,1,0))
 ]){
  const out=solve(box(),section);
  assert.equal(out.status,'blocked');
  assert.equal(out.v5PreviewReady,false);
  assert.deepEqual(out.steps,[]);assert.equal(out.timing,null);
  assert.deepEqual(out.givens,[]);
 }
});
test('04 no plane normal or negative prism dimensions never pass the solver',()=>{
 assert.throws(()=>solve(box(),plane(P(0,0,0),P(0,0,0))),/degenerate/);
 assert.throws(()=>solve(box(P(0,0,0),P(-1,10,10)),diag(3)),/finite axis-aligned/);
});
test('04 repeated pure solutions preserve source edge IDs, input and step determinism',()=>{
 const b=box(),pl=diag(12),copyB=structuredClone(b),copyP=structuredClone(pl);
 const a=solve(b,pl),c=solve(structuredClone(b),structuredClone(pl));
 assert.deepEqual(a,c);assert.deepEqual(b,copyB);assert.deepEqual(pl,copyP);
 assert.ok(a.stations.every(s=>s.sourceEdgeIds.every(id=>id.startsWith('edge-vertex-'))));
});
