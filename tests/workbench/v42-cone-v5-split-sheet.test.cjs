'use strict';
/** Extra M5 tests for the existing (not second) cone → spatial Intent → V5. */
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSpatialV5Preview:run}=
 require('../../workbench/cone-spatial-v5-preview.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const P=(x,y,z)=>({x,y,z});
const C=(baseCenter=P(0,0,0),radiusMm=5,heightMm=10)=>
 ({baseCenter,radiusMm,heightMm,modelUnit:'mm'});
const cut=(z=6,n=P(1,0,3))=>
 ({point:P(0,0,z),normal:n,modelUnit:'mm'});
const check=(kind='full-ellipse',samples=64,c=C(),
 plane=kind==='clipped-ellipse'?cut(1):cut(),revision=9)=>
 run(c,plane,{kind,samples,revision,sourceConfirmed:true,
  presentationMode:'split-sheet'});
const near=(a,b,t=1e-7)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),
 String(a)+' != '+String(b));
const all=r=>r.steps.flatMap(x=>x.actions);
test('07 3 distinct first-angle model panels are computed from real cone spatial Intent',()=>{
 const r=check();
 assert.equal(r.status,'preview-only');
 assert.equal(r.v5ProjectionPreviewReady,true);
 assert.equal(r.mathematicallyVerified,true);
 assert.equal(r.presentationMode,'split-sheet');
 assert.equal(r.splitSheet.width,960);
 assert.equal(r.splitSheet.height,680);
 assert.equal(r.visibilityVerified,false);
 assert.equal(r.firstAngleLayoutVerified,false);
 assert.equal(r.constructionStepsReady,false);
 assert.equal(r.publicWorkbenchConnected,false);
 assert.equal(r.spatialIntent.source.v5StepsReady,false);
 assert.ok(r.steps.some(s=>s.id==='cone_45_guide'));
 assert.equal(r.steps.filter(s=>s.role==='result').length,3);
 assert.equal(r.steps.filter(s=>s.role==='guide').length,9);
 assert.equal(r.steps.length,12);
 assert.deepEqual(r.steps.filter(s=>s.role==='result').map(s=>s.id),
  ['cone_V','cone_H','cone_W']);
 assert.equal(new Set(all(r).map(x=>x.id)).size,all(r).length);
 assert.ok(r.steps.every(s=>s.actions.length<=100));
 for(let i=0;i<65;i++){
  const q=r.spatialIntent.operation.samplePoints[i];
  near(Math.hypot(q.x,q.y),5*(10-q.z)/10);
  near(q.x+3*(q.z-6),0);
  const {V,H,W}=r.viewPositions;
  near(V[i].x,H[i].x);
  near(V[i].y,W[i].y);
  near(W[i].x-542,H[i].y-382);
  // Distinct paper quadrants, no three-overlaid identical common origin.
  assert.ok(V[i].y<340);
  assert.ok(H[i].y>340);
  assert.ok(W[i].x>500);
  for(const v of [V[i],H[i],W[i]]){
   assert.ok(v.x>=0&&v.x<=960);
   assert.ok(v.y>=0&&v.y<=680);
  }
 }
});
test('07 real model sample stations generate 45-degree and V/H/W auxiliary lines',()=>{
 const r=check('full-ellipse',64),g=r.steps.filter(s=>s.role==='guide');
 assert.equal(g.length,9);
 const diagonal=g[0].actions[0];
 assert.equal(diagonal.kind,'line');
 near(diagonal.geometry.to.x-diagonal.geometry.from.x,
  diagonal.geometry.to.y-diagonal.geometry.from.y);
 for(let i=0;i<4;i++){
  const marks=g[1+2*i],links=g[2+2*i];
  assert.equal(marks.actions.length,3);
  assert.equal(links.actions.length,4);
  for(const a of marks.actions)assert.equal(a.kind,'point');
  for(const a of links.actions)Motion.actionShapeAttrs(a,0.25);
  const transfer=links.actions[3].geometry.to;
  const H=marks.actions[1].geometry.center;
  const W=marks.actions[2].geometry.center;
  near(transfer.x,W.x);near(transfer.y,W.y);
  near(H.y-382,W.x-542);
 }
});
test('04 clipped ellipse reuses certified oriented cap chord, projected into all 3 panels',()=>{
 for(const n of [P(1,0,3),P(-1,0,-3)]){
  const r=check('clipped-ellipse',64,C(),cut(1,n));
  assert.equal(r.status,'preview-only');
  assert.equal(r.steps.filter(s=>s.role==='guide').length,11);
  const g=r.spatialIntent.operation,points=g.samplePoints;
  const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  assert.ok(d(points.at(-1),g.capChord.start)<1e-7);
  assert.ok(d(points[0],g.capChord.end)<1e-7);
  assert.equal(g.analytic.closed,false);
  for(const view of ['V','H','W']){
   const a=all(r).find(x=>x.id==='cone_'+view+'_cap_chord');
   assert.ok(a,'cap chord must not be lost in view '+view);
   assert.equal(a.sourceBoundary,'verified-cone-cap-chord');
   assert.equal(a.visibility,'undetermined');
   const endpoint=r.viewPositions[view].at(-1);
   const start=r.viewPositions[view][0];
   if(a.kind==='line'){
    near(a.geometry.from.x,endpoint.x);
    near(a.geometry.from.y,endpoint.y);
    near(a.geometry.to.x,start.x);
    near(a.geometry.to.y,start.y);
   }else{
    assert.equal(a.kind,'point'); // View-direction collapse is geometric.
    near(a.geometry.center.x,endpoint.x);
    near(a.geometry.center.y,endpoint.y);
    assert.ok(Math.hypot(endpoint.x-start.x,endpoint.y-start.y)<1e-8);
   }
  }
  assert.equal(r.spatialIntent.source.visibilityVerified,false);
 }
});
test('07 256 analytic source samples fit the ORIGINAL <=100 action V5 step budget',()=>{
 const r=check('clipped-ellipse',256);
 assert.equal(r.status,'preview-only');
 assert.ok(r.steps.length<300);
 assert.ok(r.steps.every(s=>s.actions.length<=100));
 assert.equal(new Set(all(r).map(a=>a.id)).size,all(r).length);
 assert.equal(r.steps.filter(s=>s.role==='result').length,9);
 assert.ok(r.steps.filter(s=>s.role==='result')
  .flatMap(s=>s.actions).length>600);
 assert.equal(Timeline.frame(r.timing,r.timing.totalMs).completedIds.length,
  all(r).length);
});
test('07 legacy single-transform cone V5 behavior is retained',()=>{
 const sheetTransform={origin:{x:340,y:240},scale:6};
 for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
  const r=run(C(),cut(z),{kind,sourceConfirmed:true,revision:4,
   samples:64,sheetTransform});
  assert.equal(r.status,'preview-only');
  assert.deepEqual(r.steps.map(s=>s.id),['cone_V','cone_H','cone_W']);
  assert.equal(r.splitSheet,null);
  assert.equal(r.player.canRender(4),true);
  assert.equal(r.visibilityVerified,false);
 }
});
test('09 no source confirmation, invalid inputs and stale edits never certify V5',()=>{
 const c=C(),p=cut();
 const b=run(c,p,{sourceConfirmed:false,presentationMode:'split-sheet'});
 assert.equal(b.status,'not-verified');
 assert.deepEqual(b.steps,[]);
 assert.equal(b.player,null);
 for(const z of [10,20]){
  const failed=run(c,cut(z),{sourceConfirmed:true,
   presentationMode:'split-sheet'});
  assert.equal(failed.status,'not-verified');
  assert.deepEqual(failed.steps,[]);
 }
 assert.throws(()=>run(c,p,{sourceConfirmed:true,
  presentationMode:'split-sheet',verified:true}),/untrusted/);
 assert.throws(()=>run(c,p,{sourceConfirmed:true,
  presentationMode:'wrong'}),/unsupported/);
 assert.throws(()=>run(c,p,{sourceConfirmed:true,
  presentationMode:'split-sheet',samples:257}),/32..256/);
 const good=check('full-ellipse',64,c,p,12);
 assert.equal(good.stillCurrent(12),true);
 const player=good.createPlayer({speed:2});
 player.play(0);
 near(player.snapshot(500).elapsedMs,1000);
 assert.equal(player.seekStep(2,600).activeStepIndex,2);
 assert.equal(player.pause(700).playing,false);
 assert.equal(player.invalidate(13,800).invalid,true);
 assert.equal(player.canRender(12),false);
 p.point.z=5;
 assert.equal(good.stillCurrent(12),false);
 assert.throws(()=>good.createPlayer(),/stale source/);
});
test('09 normal reversal and translated finite cone preserve checked 3D source and panel invariants',()=>{
 const a=check(),reversed=check('full-ellipse',64,C(),cut(6,P(-1,0,-3)));
 assert.equal(reversed.status,'preview-only');
 for(let i=0;i<65;i++)for(const k of ['x','y','z'])
  near(a.spatialIntent.operation.samplePoints[i][k],
   reversed.spatialIntent.operation.samplePoints[i][k]);
 const scaled=check('full-ellipse',64,C(P(100,-70,25),10,20),
  {point:P(100,-70,37),normal:P(1,0,3),modelUnit:'mm'});
 assert.equal(scaled.status,'preview-only');
 for(let i=0;i<65;i++){
  const x=a.spatialIntent.operation.samplePoints[i];
  const y=scaled.spatialIntent.operation.samplePoints[i];
  near(y.x,100+2*x.x);near(y.y,-70+2*x.y);near(y.z,25+2*x.z);
  near(scaled.viewPositions.V[i].x,scaled.viewPositions.H[i].x);
  near(scaled.viewPositions.W[i].x-542,scaled.viewPositions.H[i].y-382);
 }
});