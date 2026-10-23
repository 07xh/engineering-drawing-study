'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {verifiedConeThreeViewTimeline:run}=
 require('../../workbench/verified-cone-spatial-v5.cjs');
const {validateSpatialConstructionIntent}=
 require('../../core/contracts/spatial-construction-intent.js');
const {validateConstructionIntent}=
 require('../../core/contracts/construction-intent.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const P=(x,y,z)=>({x,y,z});
const cone=(center=P(0,0,0),radiusMm=5,heightMm=10)=>
 ({baseCenter:center,radiusMm,heightMm,modelUnit:'mm'});
const plane=(point=P(0,0,6),normal=P(1,0,3))=>
 ({point,normal,modelUnit:'mm'});
const verified=(kind='full-ellipse',samples=64,revision=7,c=cone(),p=
 kind==='clipped-ellipse'?plane(P(0,0,1)):plane())=>
 run(c,p,{kind,samples,revision,sourceConfirmed:true});
const near=(a,b,tol=1e-7)=>assert.ok(Number.isFinite(a)&&
 Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),
 String(a)+' != '+String(b));
const list=r=>r.steps.flatMap(s=>s.actions);
const length3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
test('04 genuine full cone analytic M3 -> separate spatial Intent -> single V5, no duplicate player',()=>{
 const r=verified();
 assert.equal(r.status,'ready');
 assert.equal(r.mathematicallyVerified,true);
 assert.equal(r.v5ProjectionPreviewReady,true);
 assert.equal(r.sectionKind,'full-ellipse');
 assert.equal(r.spatialIntentV5Certified,false);
 assert.equal(r.visibilityVerified,false);
 assert.equal(r.firstAngleLayoutVerified,false);
 assert.equal(r.completeEngineeringDrawingVerified,false);
 assert.equal(validateSpatialConstructionIntent(r.spatialIntent).ok,true);
 assert.equal(validateConstructionIntent(r.spatialIntent).ok,false);
 assert.equal(r.spatialIntent.source.v5StepsReady,false);
 assert.equal(r.spatialIntent.source.visibilityVerified,false);
 assert.equal(r.steps.length,1+2*4+64);
 assert.equal(r.strokeCount,64*3);
 assert.equal(r.steps.filter(s=>s.role==='result').length,64);
 assert.equal(r.stations.length,4);
 assert.equal(r.timing.steps.length,r.steps.length);
 assert.equal(r.sheet.width,960);
 assert.equal(r.sheet.height,680);
 assert.deepEqual([...new Set(list(r).map(x=>x.id))].length,list(r).length);
 assert.ok(r.steps.some(s=>s.role==='guide'&&s.title.includes('45°')));
 assert.equal(r.steps.at(-1).dependsOn[0],r.steps.at(-2).id);
 assert.deepEqual(r.steps[0].dependsOn,[]);
 assert.equal(r.steps.filter(s=>s.role==='result')
  .flatMap(s=>s.actions).every(a=>a.visibility==='undetermined'&&a.sampledPolylineOnly),true);
 assert.equal(r.spatialIntent.operation.capChord,null);
});
test('03 all cone sampled V/H/W points preserve independent 3D residual and 45 degree transfer',()=>{
 const c=cone(),pl=plane(),r=verified();
 const points=r.spatialIntent.operation.samplePoints;
 near(points.length,65);
 for(let i=0;i<points.length;i++){
  const q=points[i],p=r.spatialIntent.projectionSamples;
  near(Math.hypot(q.x,q.y),c.radiusMm*(10-q.z)/10);
  near(q.x+3*(q.z-6),0);
  near(p.V[i].u,q.x);near(p.V[i].v,q.z);
  near(p.H[i].u,q.x);near(p.H[i].v,q.y);
  near(p.W[i].u,q.y);near(p.W[i].v,q.z);
  const V=r.positions.V[i],H=r.positions.H[i],W=r.positions.W[i];
  near(V.x,H.x);near(V.y,W.y);
  near(W.x-r.sheet.transferCorner.x,H.y-r.sheet.transferCorner.y);
  for(const xy of [V,H,W]){
   assert.ok(xy.x>=0&&xy.x<=960);
   assert.ok(xy.y>=0&&xy.y<=680);
  }
 }
 for(const p of r.stations){
  near(p.V.x,p.H.x);near(p.V.y,p.W.y);
  near(p.transfer.x,p.W.x);near(p.transfer.y,p.H.y);
 }
 assert.ok(length3(points[0],points.at(-1))<1e-7);
});
test('04 each approximate cone boundary segment is driven by actual model projections',()=>{
 const r=verified();
 for(let i=0;i<64;i++){
  const s=r.steps.filter(x=>x.role==='result')[i];
  assert.equal(s.actions.length,3);
  for(const [j,view] of ['V','H','W'].entries()){
   const action=s.actions[j];
   assert.equal(action.sourceSpatialIntentId,r.spatialIntent.id);
   assert.equal(action.sourceRevision,7);
   assert.equal(action.sourceBoundaryKind,'lateral-sampled-segment');
   assert.equal(action.visibility,'undetermined');
   const a=r.positions[view][i],b=r.positions[view][i+1];
   if(action.kind==='line'){
    near(action.geometry.from.x,a.x);
    near(action.geometry.from.y,a.y);
    near(action.geometry.to.x,b.x);
    near(action.geometry.to.y,b.y);
   }else{
    assert.equal(action.kind,'point');
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-8);
   }
   Motion.actionShapeAttrs(action,.5);
  }
 }
 const start=Timeline.frame(r.timing,0);
 const end=Timeline.frame(r.timing,r.timing.totalMs);
 assert.equal(start.done,false);
 assert.equal(end.done,true);
 assert.equal(end.completedIds.length,list(r).length);
 assert.ok(r.timing.totalMs>0);
});
test('04 clipped ellipse V5 includes directed true base chord, never invents ellipse closure',()=>{
 for(const normal of [P(1,0,3),P(-1,0,-3)]){
  const r=verified('clipped-ellipse',64,8,cone(),plane(P(0,0,1),normal));
  assert.equal(r.status,'ready');
  assert.equal(r.strokeCount,64*3+3);
  assert.equal(r.steps.length,1+2*5+64+1);
  assert.equal(r.stations.length,5);
  const curve=r.spatialIntent.operation.samplePoints;
  const chord=r.spatialIntent.operation.capChord;
  assert.ok(length3(curve.at(-1),chord.start)<1e-7);
  assert.ok(length3(curve[0],chord.end)<1e-7);
  assert.ok(length3(curve[0],curve.at(-1))>1);
  near(chord.start.z,0);near(chord.end.z,0);
  for(const q of [chord.start,chord.end]){
   near(Math.hypot(q.x,q.y),5);
   near(q.x+3*(q.z-1),0);
  }
  const s=r.steps.at(-1);
  assert.equal(s.id,'cone-cap-chord');
  assert.equal(s.actions.length,3);
  for(const [i,view] of ['V','H','W'].entries()){
   const a=s.actions[i],end=r.positions[view].at(-1),start=r.positions[view][0];
   assert.equal(a.sourceBoundaryKind,'verified-base-chord');
   assert.equal(a.visibility,'undetermined');
   if(a.kind==='line'){
    near(a.geometry.from.x,end.x);near(a.geometry.from.y,end.y);
    near(a.geometry.to.x,start.x);near(a.geometry.to.y,start.y);
   }else assert.ok(Math.hypot(end.x-start.x,end.y-start.y)<1e-8);
  }
  assert.equal(r.spatialIntent.source.sectionInteriorVerified,false);
 }
});
test('09 source confirmation, apex/vertical/unsupported cases never issue an animation',()=>{
 const c=cone();
 for(const [pl,opts] of [
  [plane(),{}],
  [plane(P(0,0,10)),{sourceConfirmed:true}],
  [plane(P(0,0,6),P(1,0,0)),{sourceConfirmed:true}]
 ]){
  const r=run(c,pl,opts);
  assert.equal(r.status,'not-verified');
  assert.deepEqual(r.steps,[]);
  assert.equal(r.timing,null);
  assert.equal(r.v5ProjectionPreviewReady,false);
  assert.equal(r.visibilityVerified,false);
 }
 assert.throws(()=>run(c,plane(),{sourceConfirmed:true,status:'ready'}),
  /unexpected caller-supplied/);
 assert.throws(()=>run(c,plane(),{sourceConfirmed:true,
  spatialIntent:{source:{visibilityVerified:true}}}),/unexpected/);
 assert.throws(()=>run(c,plane(),{sourceConfirmed:true,revision:-1}),/revision/);
 assert.throws(()=>run(c,plane(),{sourceConfirmed:true,samples:257}),/samples/);
 assert.throws(()=>run(c,plane(),{sourceConfirmed:true,kind:'parabola'}),/unsupported/);
 assert.throws(()=>run(cone(P(0,0,0),0),plane(),
  {sourceConfirmed:true}),/bounded|positive/);
});
test('09 transformation and normal reversal preserve analytic source without inventing hidden lines',()=>{
 const c=cone(),p=plane();
 const a=verified(),rev=verified('full-ellipse',64,7,c,plane(P(0,0,6),P(-1,0,-3)));
 assert.equal(rev.status,'ready');
 for(let i=0;i<65;i++)
  assert.ok(length3(a.spatialIntent.operation.samplePoints[i],
   rev.spatialIntent.operation.samplePoints[i])<1e-7);
 const translation=P(100,-70,25),factor=2;
 const c2=cone(P(translation.x,translation.y,translation.z),10,20);
 const p2=plane(P(translation.x,translation.y,translation.z+12),P(1,0,3));
 const bigger=verified('full-ellipse',64,7,c2,p2);
 assert.equal(bigger.status,'ready');
 for(let i=0;i<65;i++){
  const v=a.spatialIntent.operation.samplePoints[i];
  const w=bigger.spatialIntent.operation.samplePoints[i];
  near(w.x,factor*v.x+translation.x);
  near(w.y,factor*v.y+translation.y);
  near(w.z,factor*v.z+translation.z);
 }
 assert.equal(bigger.visibilityVerified,false);
});
test('07 unchanged player supports progressive strokes, rewind, speed and source invalidation',()=>{
 const c=cone(),p=plane(),r=verified('full-ellipse',32,12,c,p);
 const player=r.createPlayer({speed:2});
 assert.equal(player.canRender(12),true);
 player.play(0);
 near(player.snapshot(300).elapsedMs,600);
 const stepped=player.seekStep(4,400);
 assert.equal(stepped.activeStepIndex,4);
 assert.equal(player.pause(500).playing,false);
 assert.equal(player.seekProgress(0,600).elapsedMs,0);
 assert.equal(player.setSpeed(.5,700).speed,.5);
 const again=player.play(800);
 assert.equal(again.playing,true);
 assert.equal(player.invalidate(13,900).invalid,true);
 assert.equal(player.canRender(12),false);
 assert.equal(player.canRender(13),false);
 assert.equal(r.isCurrent(12),true);
 p.point.z=5;
 assert.equal(r.isCurrent(12),false);
 assert.throws(()=>r.createPlayer(),/source changed/);
});
test('09 max verified sample budget stays within single V5 limits',()=>{
 const r=verified('full-ellipse',256,3);
 assert.equal(r.status,'ready');
 assert.equal(r.steps.length,1+2*4+256);
 assert.ok(r.steps.length<=300);
 assert.ok(r.steps.every(s=>s.actions.length<=100));
 assert.equal(new Set(list(r).map(a=>a.id)).size,list(r).length);
 assert.equal(Timeline.frame(r.timing,r.timing.totalMs).completedIds.length,
  list(r).length);
});