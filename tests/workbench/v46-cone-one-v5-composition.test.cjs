'use strict';
/**
 * 09 end-to-end M3 -> canonical 3D-based ConstructionStep -> existing
 * verified sheet-px V5 adapter -> SAME V5 timeline as cone result strokes.
 * No second solver/player; real 3D and sheet coordinates must match.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSpatialV5Preview:run}=
 require('../../workbench/cone-spatial-v5-preview.cjs');
const {coneProvenConstructionSteps}=
 require('../../workbench/cone-proven-construction-steps.cjs');
const {project,toSheet}=require('../../core/projection/conventions.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const P=(x,y,z)=>({x,y,z});
const cone=(b=P(0,0,0),r=5,h=10)=>
 ({baseCenter:b,radiusMm:r,heightMm:h,modelUnit:'mm'});
const plane=(z=6,n=P(1,0,3),b=P(0,0,0))=>
 ({point:P(b.x,b.y,b.z+z),normal:n,modelUnit:'mm'});
const opts=(kind='full-ellipse',revision=21,samples=64)=>({
 kind,revision,samples,sourceConfirmed:true,
 presentationMode:'split-sheet',provenGuideDag:true
});
const near=(a,b,t=1e-7)=>assert.ok(Number.isFinite(a)&&
 Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),
 String(a)+' != '+String(b));
const all=r=>r.steps.flatMap(s=>s.actions);
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test('04/07 '+kind+' proven generator guides and result contour share EXACTLY one V5 timeline',()=>{
  const c=cone(),p=plane(z),r=run(c,p,opts(kind));
  assert.equal(r.status,'preview-only');
  assert.equal(r.canonicalGuideDagConnected,true);
  assert.equal(r.canonicalGuideStepCount,12);
  assert.equal(r.v5ProjectionPreviewReady,true);
  assert.equal(r.visibilityVerified,false);
  assert.equal(r.constructionStepsReady,false);
  assert.equal(r.spatialIntent.source.v5StepsReady,false);
  assert.equal(r.firstAngleLayoutVerified,false);
  assert.equal(r.publicWorkbenchConnected,false);
  assert.equal(r.steps.length,1+12+3);
  assert.equal(r.steps.filter(s=>s.role==='guide').length,13);
  assert.equal(r.steps.filter(s=>s.role==='result').length,3);
  assert.equal(r.steps[0].id,'cone_45_guide');
  assert.equal(r.steps[1].id,'v5_step_1');
  assert.equal(r.steps[12].id,'v5_step_12');
  assert.equal(r.steps[13].id,'cone_V');
  assert.deepEqual(r.steps[1].dependsOn,['cone_45_guide']);
  for(let i=2;i<=12;i++)
   assert.deepEqual(r.steps[i].dependsOn,['v5_step_'+(i-1)]);
  assert.deepEqual(r.steps[13].dependsOn,['v5_step_12']);
  assert.equal(new Set(all(r).map(a=>a.id)).size,all(r).length);
  assert.ok(r.steps.every(s=>s.actions.length<=100));
  assert.equal(r.timing.steps.length,r.steps.length);
  assert.ok(r.timing.steps[12].endMs<=r.timing.steps[13].startMs);
  assert.equal(Timeline.frame(r.timing,r.timing.totalMs).completedIds.length,
   all(r).length);
  // Independently derive the first real M3 generator intersection from
  // shared XYZ and the split-sheet transform, not from the V5 geometry.
  const q=r.spatialIntent.operation.samplePoints[0];
  const apex=P(c.baseCenter.x,c.baseCenter.y,c.baseCenter.z+c.heightMm);
  const scale=r.splitSheet.scale;
  const sh={origin:{x:85+(c.baseCenter.x+c.radiusMm)*scale,
   y:40+(c.baseCenter.z+c.heightMm)*scale},scale};
  const A=toSheet('V',project(apex).V,sh);
  const B=toSheet('V',project(q).V,sh);
  const guide=r.steps[1];
  assert.equal(guide.sourceStepId,'cone_generator_0_V');
  assert.equal(guide.actions[0].kind,'line');
  near(guide.actions[0].geometry.from.x,A.x);
  near(guide.actions[0].geometry.from.y,A.y);
  near(guide.actions[0].geometry.to.x,B.x);
  near(guide.actions[0].geometry.to.y,B.y);
  near(guide.actions[1].geometry.center.x,r.viewPositions.V[0].x);
  near(guide.actions[1].geometry.center.y,r.viewPositions.V[0].y);
  for(const action of guide.actions)assert.ok(Motion.actionShapeAttrs(action,.5));
  const player=r.createPlayer({speed:2});
  assert.equal(player.canRender(21),true);
  player.play(0);assert.ok(player.snapshot(300).elapsedMs>0);
  assert.equal(player.seekStep(12,400).activeStepIndex,12);
  assert.equal(player.seekStep(13,500).activeStepIndex,13);
  assert.equal(player.invalidate(22,600).invalid,true);
  assert.equal(player.canRender(21),false);
 });
}
test('09 geometric scale and translated cone never flip canonical V/H/W guide points',()=>{
 const c=cone(P(100,-70,25),10,20),p=plane(12,P(1,0,3),c.baseCenter);
 const r=run(c,p,opts());
 assert.equal(r.status,'preview-only');
 // The 4 generators emit one V/H/W mark in each view with no second flip.
 for(let j=0;j<4;j++){
  const index=Math.floor(j*64/4);
  const section=r.spatialIntent.operation.samplePoints[index];
  for(const [v,view] of ['V','H','W'].entries()){
   const step=r.steps[1+3*j+v],expected=r.viewPositions[view][index];
   assert.equal(step.sourceStepId,'cone_generator_'+j+'_'+view);
   const mark=step.actions.at(-1);
   near(mark.geometry.center.x,expected.x);
   near(mark.geometry.center.y,expected.y);
   const uv=project(section)[view];
   assert.ok(Number.isFinite(uv.u)&&Number.isFinite(uv.v));
  }
 }
});
test('07 existing opt-in ray visibility stays on the SAME result actions as canonical guides',()=>{
 const p=plane(),r=run(cone(),p,{...opts(),
  retainedHalfspace:'positive',
  observerDirections:{V:P(0,-1,0),H:P(0,0,1),W:P(1,0,0)}
 });
 assert.equal(r.status,'preview-only');
 assert.equal(r.rayEvidence.status,'open-ray-evidence');
 assert.equal(r.steps[1].actions[0].sourceGuideOnly,true);
 const w=all(r).find(a=>a.id==='cone_W_lateral_4');
 assert.equal(w.visibility,'visible');
 assert.equal(w.visibilityProof,'analytic-open-ray-only');
 const nearSilhouette=all(r).find(a=>a.id==='cone_W_lateral_16');
 assert.equal(nearSilhouette.visibility,'undetermined');
 assert.equal(r.visualLineStylesApplied,false);
 assert.equal(r.spatialIntent.source.visibilityVerified,false);
});
test('07 256 samples and canonical DAG fit the existing ONE V5 step/action budget',()=>{
 const r=run(cone(),plane(1),opts('clipped-ellipse',28,256));
 assert.equal(r.status,'preview-only');
 assert.equal(r.canonicalGuideStepCount,12);
 assert.equal(r.steps.filter(s=>s.role==='result').length,9);
 assert.ok(r.steps.length<300);
 assert.ok(r.steps.every(s=>s.actions.length<=100));
 assert.equal(new Set(all(r).map(a=>a.id)).size,all(r).length);
 assert.equal(Timeline.frame(r.timing,r.timing.totalMs).completedIds.length,
  all(r).length);
});
test('09 frozen default preview and original guide-only entry remain backward compatible',()=>{
 const r=run(cone(),plane(),{kind:'full-ellipse',sourceConfirmed:true,
  presentationMode:'split-sheet',revision:30,samples:64});
 assert.equal(r.status,'preview-only');
 assert.equal(r.canonicalGuideDagConnected,false);
 assert.equal(r.canonicalGuideStepCount,0);
 assert.equal(r.steps.length,12);
 assert.deepEqual(r.steps.filter(s=>s.role==='result').map(s=>s.id),
  ['cone_V','cone_H','cone_W']);
 const legacy=coneProvenConstructionSteps(cone(),plane(),{
  kind:'full-ellipse',sourceConfirmed:true,revision:30,samples:64,
  sheetTransform:{origin:{x:340,y:240},scale:6}
 });
 assert.equal(legacy.status,'verified-guide-steps');
 assert.equal(legacy.steps.length,12);
});
test('09 unconfirmed, unsupported and mismatched presentation settings fail closed',()=>{
 const invalid=run(cone(),plane(),{...opts(),sourceConfirmed:false});
 assert.equal(invalid.status,'not-verified');
 assert.deepEqual(invalid.steps,[]);
 assert.equal(invalid.player,null);
 const apex=run(cone(),plane(10),opts());
 assert.equal(apex.status,'not-verified');
 assert.deepEqual(apex.steps,[]);
 assert.throws(()=>run(cone(),plane(),{...opts(),
  presentationMode:'single-transform'}),/split-sheet/);
 assert.throws(()=>run(cone(),plane(),{...opts(),provenGuideDag:'yes'}),
  /provenGuideDag/);
 const c=cone(),p=plane(),r=run(c,p,opts());
 assert.equal(r.stillCurrent(21),true);
 p.point.z=5;
 assert.equal(r.stillCurrent(21),false);
 assert.throws(()=>r.createPlayer(),/stale source/);
});
