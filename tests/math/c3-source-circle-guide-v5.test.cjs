'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {compileFiniteCylinderEndpointV5:compile}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {assertM3ToV5Consistency}=
 require('../../workbench/m3-v5-consistency-gate.cjs');
const {validateConstructionIntentDAG}=
 require('../../core/contracts/construction-intent.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const input=()=>({
 kind:'finite-orthogonal-cylinder-intersection',sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}
});
const transforms=()=>({
 V:{origin:{x:310,y:260},scale:4},
 H:{origin:{x:310,y:420},scale:4},
 W:{origin:{x:650,y:260},scale:4}
});
test('C3 exact original V/H circle projections become canonical proven V5 guides',()=>{
 const views=transforms(),revision=9;
 const r=compile({input:input(),revision,stationCountPerBranch:2,
  sheetTransform:views.V,viewTransforms:views,
  includeSourceCircleGuides:true});
 assert.equal(r.status,'analytic-point-actions-and-original-circle-guides');
 assert.equal(r.originalSourceCircleGuidesV5Ready,true);
 assert.equal(r.provenOriginalSourceCircleV5ActionCount,2);
 assert.equal(r.sourceCircleGuides.length,2);
 assert.equal(r.constructionIntents.length,r.bindings.length+2);
 assert.equal(r.constructionSteps.length,r.constructionIntents.length);
 assert.equal(r.timing.segments.length,r.constructionIntents.length);
 assert.equal(validateConstructionIntentDAG(r.constructionIntents).ok,true);
 assert.equal(r.singleOriginalV5Player,true);
 assert.equal(r.player.canRender(revision),true);
 const circleSteps=r.constructionSteps.filter(s=>
  s.actions.length===1&&s.actions[0].kind==='circle');
 assert.equal(circleSteps.length,2);
 assert.deepEqual(circleSteps.map(s=>s.id),['C3SourceCircleV','C3SourceCircleH']);
 assert.ok(r.constructionIntents.every(i=>
  i.source.proofScope==='finite-cylinder-original-circles-and-analytic-points'));
 const V=r.sourceCircleGuides.find(g=>g.view==='V');
 const H=r.sourceCircleGuides.find(g=>g.view==='H');
 assert.equal(V.sourceSolid,'yCylinder');
 assert.deepEqual(V.centerModelMm,{x:2,y:0});
 assert.equal(V.radiusModelMm,9);
 assert.deepEqual(V.centerSheetPx,{x:302,y:260});
 assert.equal(V.radiusSheetPx,36);
 assert.equal(H.sourceSolid,'zCylinder');
 assert.deepEqual(H.centerModelMm,{x:0,y:0});
 assert.equal(H.radiusModelMm,12);
 assert.deepEqual(H.centerSheetPx,{x:310,y:420});
 assert.equal(H.radiusSheetPx,48);
 const mapping=Object.fromEntries(circleSteps.map(s=>
  [s.id,views[s.id.at(-1)]]));
 const viewMap=Object.fromEntries(circleSteps.map(s=>
  [s.id,s.id.at(-1)]));
 assert.equal(assertM3ToV5Consistency({
  revision,intents:r.constructionIntents,steps:r.constructionSteps,
  timing:r.timing,sheet:views.V,sheetByIntentId:mapping,
  viewByIntentId:viewMap
 }),true);
 for(const guide of r.sourceCircleGuides){
  assert.equal(guide.firstAngleSourceGeometryVerified,true);
  assert.equal(guide.sourceProjectionGuideV5Authorized,true);
  assert.equal(guide.officialContourLineStyleVerified,false);
  assert.equal(guide.interpenetrationCurveLineStyleVerified,false);
  assert.equal(Object.isFrozen(guide),true);
 }
 for(const step of circleSteps){
  const action=step.actions[0],half=Motion.actionShapeAttrs(action,.5);
  assert.equal(half.r,action.geometry.radius);
  assert.ok(half['stroke-dasharray'].includes(' '));
  assert.equal(Motion.actionShapeAttrs(action,1)['stroke-dasharray'],'none');
 }
 assert.ok(r.constructionSteps.slice(2).every(s=>s.actions.every(a=>a.kind==='point')));
 assert.equal(r.entireCurveV5Ready,false);
 assert.equal(r.standardVisibleHiddenLineStylesVerified,false);
 assert.equal(r.canExportCertifiedDrawing,false);
 r.player.invalidate(revision+1,0);
 assert.equal(r.player.canRender(revision),false);
});
test('new optional circular source geometry cannot silently modify endpoint-only V5',()=>{
 const legacy=compile({input:input(),revision:2,
  sheetTransform:transforms().V,stationCountPerBranch:0});
 assert.equal(legacy.status,'analytic-endpoint-point-actions-only');
 assert.equal(legacy.provenOriginalSourceCircleV5ActionCount,0);
 assert.equal(legacy.originalSourceCircleGuidesV5Ready,false);
 assert.equal(legacy.sourceCircleGuides.length,0);
 assert.ok(legacy.constructionSteps.every(s=>
  s.actions.every(a=>a.kind==='point')));
 assert.equal(legacy.constructionSteps.length,legacy.bindings.length);
 for(const bad of [null,1,'true',{},[]]){
  assert.throws(()=>compile({input:input(),revision:2,
   sheetTransform:transforms().V,includeSourceCircleGuides:bad}),
   /source-circle guide toggle/);
 }
});
test('the shared M3→V5 gate rejects missing, wrong or invented paper frames',()=>{
 const views=transforms(),revision=4;
 const r=compile({input:input(),revision,
  sheetTransform:views.V,viewTransforms:views,
  includeSourceCircleGuides:true});
 assert.throws(()=>assertM3ToV5Consistency({
  revision,intents:r.constructionIntents,
  steps:r.constructionSteps,timing:r.timing,sheet:views.V
 }),/V5 geometry differs/);
 assert.throws(()=>assertM3ToV5Consistency({
  revision,intents:r.constructionIntents,
  steps:r.constructionSteps,timing:r.timing,sheet:views.V,
  sheetByIntentId:{forged:{origin:{x:1,y:2},scale:4}}
 }),/untrusted Intent-specific paper transform/);
 assert.throws(()=>assertM3ToV5Consistency({
  revision,intents:r.constructionIntents,
  steps:r.constructionSteps,timing:r.timing,sheet:views.V,
  sheetByIntentId:{C3SourceCircleV:views.V,
   C3SourceCircleH:views.V}
 }),/V5 geometry differs/);
});
test('translated genuine source circle retains real model geometry and V5 sheet parity',()=>{
 const src=input(),shift=input();
 shift.zCylinder.xCenter+=7;shift.yCylinder.xCenter+=7;
 shift.zCylinder.yCenter-=3;
 shift.yCylinder.zCenter+=6;
 const a=compile({input:src,revision:1,sheetTransform:transforms().V,
  includeSourceCircleGuides:true});
 const b=compile({input:shift,revision:2,sheetTransform:transforms().V,
  includeSourceCircleGuides:true});
 assert.equal(b.sourceCircleGuides[0].centerModelMm.x-
  a.sourceCircleGuides[0].centerModelMm.x,7);
 assert.equal(b.sourceCircleGuides[0].centerModelMm.y-
  a.sourceCircleGuides[0].centerModelMm.y,6);
 assert.equal(b.sourceCircleGuides[1].centerModelMm.x-
  a.sourceCircleGuides[1].centerModelMm.x,7);
 assert.equal(b.sourceCircleGuides[1].centerModelMm.y-
  a.sourceCircleGuides[1].centerModelMm.y,-3);
 assert.equal(b.entireCurveV5Ready,false);
});
test('real UI consumes same original V5 circle actions, not faux sampled curves',()=>{
 const ui=fs.readFileSync('labs/finite-cylinder-intersection-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/finite-cylinder-intersection-live.html','utf8');
 assert.match(ui,/includeSourceCircleGuides:true/);
 assert.match(ui,/renderVerifiedV5Actions/);
 assert.match(ui,/Motion\.updateSvg\(shape,action,fraction\)/);
 assert.match(ui,/originalGuide=action.kind==='circle'/);
 assert.match(ui,/data-certified-scope/);
 assert.match(html,/原始圆柱辅助圆 V5/);
 assert.match(html,/没有获得正式工程实虚线资格/);
 assert.doesNotMatch(ui,/data-official-v5':'true'/);
});
