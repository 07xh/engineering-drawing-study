'use strict';
/* Bidirectional 3D/first-angle V/H/W correspondence using ONE M3/V5 source. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {coneSpatialV5Preview}=
 require('../../workbench/cone-spatial-v5-preview.cjs');
const {coneSpatialProjectionFocus:focus}=
 require('../../workbench/cone-spatial-projection-focus.cjs');
const {project}=require('../../core/projection/conventions.js');
const {coneLinkedSpatialScene}=
 require('../../workbench/cone-linked-spatial-view.cjs');
const P=(x,y,z)=>({x,y,z});
const cone={baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane=z=>({point:P(0,0,z),normal:P(1,0,3),modelUnit:'mm'});
const run=(kind='full-ellipse',z=6,samples=64,revision=32)=>
 coneSpatialV5Preview(cone,plane(z),{
  kind,samples,revision,sourceConfirmed:true,
  presentationMode:'split-sheet',provenGuideDag:true
 });
const near=(a,b,t=1e-7)=>assert.ok(Number.isFinite(a)&&
 Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),a+' != '+b);
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test('03/07 '+kind+' sampled XYZ -> three first-angle views -> existing exact V5 action IDs',()=>{
  const result=run(kind,z),all=result.steps.flatMap(s=>s.actions);
  const before=JSON.stringify(result.spatialIntent);
  for(const index of [0,1,15,16,31,32,48,63,64]){
   const link=focus(result,index),q=result.spatialIntent.operation.samplePoints[index];
   assert.deepEqual(link.world,q);
   assert.equal(link.sourceSpatialIntentId,result.spatialIntent.id);
   assert.equal(link.oneExistingV5Timeline,true);
   assert.equal(link.allThreeViewsLinked,true);
   assert.equal(link.visibilityVerified,false);
   assert.equal(link.overlaysNotConstructionSteps,true);
   for(const view of ['V','H','W']){
    const v=link.views[view],p=project(q)[view];
    near(v.modelUv.u,p.u);near(v.modelUv.v,p.v);
    near(v.sheetPx.x,result.viewPositions[view][index].x);
    near(v.sheetPx.y,result.viewPositions[view][index].y);
    assert.equal(v.sourceActionId,'cone_'+view+'_lateral_'+(index===0?1:index));
    assert.equal(v.overlayOnly,true);
    assert.equal(v.certifiedWholeStrokeVisibility,false);
    assert.ok(all.some(a=>a.id===v.sourceActionId));
    assert.ok(result.timing.segments.some(s=>
     s.id===v.sourceActionId&&s.endMs===v.actionEndMs));
   }
   const expected=[0,16,32,48].includes(index)?3:0;
   assert.equal(link.canonicalGeneratorStepIds.length,expected);
  }
  assert.equal(JSON.stringify(result.spatialIntent),before);
  assert.equal(result.player.canRender(32),true);
  const link=focus(result,25);
  const from3D=coneLinkedSpatialScene(result.spatialIntent).sourcePoints[25];
  assert.deepEqual(from3D.world,link.world);
  assert.ok(Number.isFinite(from3D.screen.x));
 });
}
test('09 all source resolution budgets, translated model and revisions obey same link contract',()=>{
 for(const n of [32,128,256]){
  const out=run('full-ellipse',6,n,41);
  const last=focus(out,n);
  assert.equal(last.sourceIndex,n);
  assert.equal(last.views.W.sourceActionId,'cone_W_lateral_'+n);
  const first=focus(out,0);
  assert.equal(first.canonicalGeneratorStepIds.length,3);
  const player=out.createPlayer({speed:2});
  player.seekMs(last.views.V.actionEndMs,15);
  assert.equal(player.snapshot().actionFractions[last.views.V.sourceActionId],1);
  player.invalidate(42,20);
  assert.equal(player.canRender(41),false);
 }
});
test('09 unconfirmed, stale and missing first-angle evidence fail closed',()=>{
 const o=run();
 for(const invalid of [-1,1.5,100000,NaN]){
  assert.throws(()=>focus(o,invalid),/index/);
 }
 assert.throws(()=>focus({...o,firstAngleCoordinateMappingVerified:false},1),
  /reviewed/);
 assert.throws(()=>focus({...o,viewPositions:{...o.viewPositions,
  W:o.viewPositions.W.map((p,i)=>i===5?{x:p.x+7,y:p.y}:p)}},5),
  /disagree/);
 assert.throws(()=>focus({...o,timing:{steps:[],segments:[]}},5),
  /missing canonical/);
 const c=cone,p=plane(6),original=coneSpatialV5Preview(c,p,{
  kind:'full-ellipse',samples:64,revision:45,
  sourceConfirmed:true,presentationMode:'split-sheet',provenGuideDag:true
 });
 p.point.z=5;
 assert.throws(()=>focus(original,1),/current reviewed/);
});
test('07 page renders three independent linked focus rings and touch-targets, not a second player',()=>{
 const root=path.resolve(__dirname,'../..');
 const js=fs.readFileSync(path.join(root,'labs/cone-cut-live-entry.cjs'),'utf8');
 assert.match(js,/coneSpatialProjectionFocus\(plan,selectedSpatial\)/);
 assert.match(js,/data-cone-view-focus/);
 assert.match(js,/data-cone-source-index/);
 assert.match(js,/data-cone-3d-segment-hit/);
 assert.match(js,/player\.seekMs\(link\.views\.V\.actionEndMs,now\(\)\)/);
 assert.match(js,/selectedSpatial=null/);
 assert.doesNotMatch(js,/window\.fetch\(|WebSocket|sendBeacon|localStorage|innerHTML/);
 const module=fs.readFileSync(path.join(root,
  'workbench/cone-spatial-projection-focus.cjs'),'utf8');
 assert.doesNotMatch(module,/createPlayer|compileTimeline|requestAnimationFrame/);
});
