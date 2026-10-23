'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneConstructionStepsV5:run}=
 require('../../workbench/cone-constructionsteps-v5.cjs');
const {coneProvenConstructionSteps}=
 require('../../workbench/cone-proven-construction-steps.cjs');
const {project,toSheet}=require('../../core/projection/conventions.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const P=(x,y,z)=>({x,y,z});
const cone={baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane=z=>({point:P(0,0,z),normal:P(1,0,3),modelUnit:'mm'});
const sheetTransform={origin:{x:340,y:240},scale:6};
const near=(a,b,tol=1e-7)=>assert.ok(Number.isFinite(a)&&
 Math.abs(a-b)<=tol,String(a)+' != '+String(b));
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' proven 3D-to-SHEET coordinate survives native V5 without second Y inversion',()=>{
  const options={kind,sourceConfirmed:true,revision:11,sheetTransform,samples:64};
  const output=run(cone,plane(z),options);
  const proof=coneProvenConstructionSteps(cone,plane(z),options);
  assert.equal(output.status,'verified-guides-preview');
  assert.equal(output.sheetProjectionPreserved,true);
  assert.equal(output.steps.length,12);
  assert.equal(output.visibilityVerified,false);
  assert.equal(output.fullContourConstructionVerified,false);
  assert.equal(output.firstAngleLayoutVerified,false);
  assert.equal(output.player.canRender(11),true);
  for(const [i,step] of proof.steps.entries()){
   const converted=output.steps[i];
   assert.equal(converted.sourceStepId,step.id);
   assert.equal(converted.role,'guide');
   assert.deepEqual(converted.dependsOn,i?['v5_step_'+i]:[]);
   assert.equal(converted.actions.length,step.actions.length);
   for(const [j,raw] of step.actions.entries()){
    const a=converted.actions[j],g=raw.geometry;
    assert.equal(a.sourceCoordinates,'verified-3d-to-sheet-px');
    assert.equal(a.sourceGuideOnly,true);
    assert.equal(a.sourceVisibility,'undetermined');
    assert.ok(Motion.actionShapeAttrs(a,.5));
    if(raw.kind==='line'){
     assert.equal(a.kind,'line');
     // Test true mm→sheet coordinates, never legacy y→−y twice.
     near(a.geometry.from.x,g.x1);near(a.geometry.from.y,g.y1);
     near(a.geometry.to.x,g.x2);near(a.geometry.to.y,g.y2);
    }else{
     assert.equal(raw.kind,'point');assert.equal(a.kind,'point');
     near(a.geometry.center.x,g.x);near(a.geometry.center.y,g.y);
    }
   }
  }
  const apex=P(0,0,10);
  const q=proof.spatialIntent.operation.samplePoints[0];
  const A=toSheet('V',project(apex).V,sheetTransform);
  const B=toSheet('V',project(q).V,sheetTransform);
  const first=output.steps[0].actions[0];
  assert.equal(first.kind,'line');
  near(first.geometry.from.x,A.x);near(first.geometry.from.y,A.y);
  near(first.geometry.to.x,B.x);near(first.geometry.to.y,B.y);
  assert.ok(A.y>0&&B.y>0,'real sheet is inside positive SVG viewBox');
  assert.ok(first.geometry.from.y>0&&first.geometry.to.y>0);
  assert.notEqual(first.geometry.from.y,-A.y,
   'regression: legacy identity 2D adapter was not a true identity for Y');
  assert.equal(output.timing.steps.length,proof.steps.length);
  assert.equal(Timeline.frame(output.timing,output.timing.totalMs).completedIds.length,
   output.steps.flatMap(s=>s.actions).length);
 });
}
test('07 speed / seek / pause / invalidation continue using ONE unchanged V5 timeline',()=>{
 const r=run(cone,plane(6),{kind:'full-ellipse',sourceConfirmed:true,
  revision:16,sheetTransform,samples:64});
 const player=r.player;
 player.play(0);
 near(player.snapshot(250).elapsedMs,250);
 assert.equal(player.seekStep(3,300).activeStepIndex,3);
 assert.equal(player.pause(400).playing,false);
 assert.equal(player.invalidate(17,500).invalid,true);
 assert.equal(player.canRender(16),false);
});
test('09 unconfirmed and degenerate cone sources cannot emit mirrored OR trusted guides',()=>{
 const r=run(cone,plane(6),{sourceConfirmed:false,
  revision:12,sheetTransform});
 assert.equal(r.status,'not-verified');
 assert.equal(r.player,null);
 assert.deepEqual(r.steps,[]);
 const q=run(cone,plane(10),{kind:'full-ellipse',
  sourceConfirmed:true,revision:12,sheetTransform});
 assert.equal(q.status,'not-verified');
 assert.deepEqual(q.steps,[]);
});
