'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateUnifiedMath:run}=require('../../workbench/unified-math-pipeline.cjs');
const {assertConeM3ToV5Consistency}=require('../../workbench/m3-v5-consistency-gate.cjs');
const P=(x,y,z)=>({x,y,z});
const cone={baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane=z=>({point:P(0,0,z),normal:P(1,0,3),modelUnit:'mm'});
const request=(z,extra={},revision=7)=>run({kind:'cone-plane-section',revision,
 input:{kind:'cone-plane',cone,plane:plane(z),sourceConfirmed:true,
  requestedKind:'auto',samples:64,...extra}});
test('unified M3 automatically chooses true cone full / clipped geometry with one spatial Intent and V5',()=>{
 for(const [z,kind] of [[6,'full-ellipse'],[1,'clipped-ellipse']]){
  const out=request(z);
  assert.equal(out.status,'preview-only');
  assert.equal(out.sectionClassification.kind,kind);
  assert.equal(out.unifiedMathPipeline,'m3-spatial-intent-single-v5-preview/1');
  assert.equal(out.canonicalSpatialIntentVerified,true);
  assert.equal(out.spatialConstructionIntent,out.spatialIntent);
  assert.equal(out.spatialIntent.revision,7);
  assert.equal(out.canonicalGuideDagConnected,true);
  assert.equal(out.canonicalGuideStepCount,12);
  assert.equal(out.player.canRender(7),true);
  assert.equal(out.v5Ready,false);
  assert.equal(out.realExerciseAccepted,false);
  assert.equal(out.visibilityVerified,false);
  assert.equal(assertConeM3ToV5Consistency({preview:out,revision:7}),true);
  const completed=out.player.seekProgress(1,0);
  assert.equal(completed.done,true);
 }
});
test('separated finite cone yields proven none but no geometry, no misleading V5',()=>{
 for(const z of [12,-2]){
  const out=request(z);
  assert.equal(out.status,'none');
  assert.equal(out.sectionClassification.separationVerified,true);
  assert.equal(out.spatialConstructionIntent,null);
  assert.deepEqual(out.steps,[]);
  assert.equal(out.player,null);
  assert.equal(out.v5ProjectionPreviewReady,false);
 }
});
test('unverified conic cases fail closed, never promote guessed steps',()=>{
 const vertical=request(5,{plane:{point:P(1,0,5),normal:P(1,0,0),modelUnit:'mm'}});
 assert.equal(vertical.status,'not-verified');
 assert.equal(vertical.sectionClassification.status,'unsupported-conic');
 assert.deepEqual(vertical.steps,[]);
 const mismatched=request(6,{requestedKind:'clipped-ellipse'});
 assert.equal(mismatched.status,'not-verified');
 assert.deepEqual(mismatched.steps,[]);
});
test('strict M3 cone source revision, model units, no caller proof or 2D sheet',()=>{
 assert.throws(()=>request(6,{result:{verified:true}}),/caller proof/);
 assert.throws(()=>request(6,{verified:true}),/caller proof/);
 assert.throws(()=>request(6,{cone:{...cone,modelUnit:'px'}}),/model-mm/);
 assert.throws(()=>run({kind:'cone-plane-section',revision:3,
  input:{kind:'cone-plane',revision:2,cone,plane:plane(6),sourceConfirmed:true}}),/stale/);
 assert.throws(()=>run({kind:'cone-plane-section',revision:1,sheet:{origin:P(0,0,0),scale:1},
  input:{kind:'cone-plane',cone,plane:plane(6),sourceConfirmed:true}}),/3D cone/);
 const unconfirmed=request(6,{sourceConfirmed:false});
 assert.equal(unconfirmed.status,'not-verified');
 assert.equal(unconfirmed.player,null);
});
test('M3-to-V5 audit rejects altered projection geometry and forged timing',()=>{
 const ready=request(6);
 const p={...ready,steps:ready.steps.map(s=>({...s,actions:s.actions.map(a=>({...a,geometry:{...a.geometry}}))}))};
 const found=p.steps.flatMap(s=>s.actions).find(a=>a.sourceBoundary==='analytic-cone-lateral');
 found.geometry={...found.geometry,from:{...found.geometry.from,x:found.geometry.from.x+3}};
 assert.throws(()=>assertConeM3ToV5Consistency({preview:p,revision:7}),/differs/);
 assert.throws(()=>assertConeM3ToV5Consistency({preview:{...ready,timing:{...ready.timing,totalMs:1}},revision:7}),/timeline/);
});
