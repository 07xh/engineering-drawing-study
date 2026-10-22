'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cylinderVisibilityV5Preview:build,renderVisibilityActionSvg:render}=
 require('../../engines/spatial/sections/cylinder-visibility-v5-svg.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const p=(x,y,z)=>({x,y,z});
const c=(radiusMm=5,heightMm=30,baseCenter=p(0,0,0))=>
 ({radiusMm,heightMm,baseCenter});
const plane=(point,normal)=>({point,normal});
const tilted=z=>plane(p(0,0,z),p(1,0,1));
const observers={
 V:p(1,0,0),H:p(0,0,1),W:p(-1,0,.2)
};
const evaluate=(settings={})=>build(c(),tilted(3),{
 retainedHalfspace:'negative',observerDirections:observers,...settings
});
const resultActions=r=>r.steps.filter(x=>x.role==='result').flatMap(x=>x.actions);
test('04 V5 pipeline really replaces unstyled section strokes with classified math-backed actions',()=>{
 const result=evaluate();
 assert.equal(result.status,'ready');
 assert.equal(result.v5PreviewReady,true);
 assert.equal(result.independentVisibilitySvgRendererReady,true);
 assert.equal(result.existingV5RendererHonorsCustomDashStyle,false);
 assert.equal(result.productionUiIntegrated,false);
 assert.equal(result.completeEngineeringDrawingVerified,false);
 assert.equal(result.standardLineStyleSignedOff,false);
 assert.equal(result.firstAngleObserverConventionsSignedOff,false);
 assert.ok(result.totalVisibilityActions>50);
 const actions=resultActions(result);
 assert.equal(actions.length,result.totalVisibilityActions);
 assert.ok(actions.some(a=>a.visibility==='visible'));
 assert.ok(actions.some(a=>a.visibility==='hidden'));
 assert.ok(actions.every(a=>a.sourceEdgeId&&a.observerView));
 assert.equal(new Set(actions.map(a=>a.id)).size,actions.length);
});
test('04 real visibility generates actually dashed SVG for hidden curve and solid for clear intervals',()=>{
 const result=evaluate();
 const actions=resultActions(result);
 const hidden=actions.find(a=>a.visibility==='hidden'&&a.kind==='line');
 const visible=actions.find(a=>a.visibility==='visible'&&a.kind==='line');
 assert.ok(hidden&&visible);
 const dash=render(hidden,1),solid=render(visible,1);
 assert.match(dash,/stroke-dasharray="6 4"/);
 assert.match(dash,/data-visibility="hidden"/);
 assert.match(solid,/stroke-dasharray="none"/);
 assert.match(solid,/data-visibility="visible"/);
 assert.match(dash,/^<line /);
 const middle=render(hidden,.5);
 assert.notEqual(middle,dash);
 assert.match(middle,/^<line /);
});
test('04 uncertain view is visibly marked pending and cannot claim standard line style approval',()=>{
 const unknown=build(c(),tilted(3),{
  retainedHalfspace:'negative',
  observerDirections:{V:p(1,0,-1),H:p(0,0,1),W:p(-1,0,.2)}
 });
 assert.equal(unknown.status,'ready');
 assert.ok(unknown.unknownRuns>0);
 assert.equal(unknown.visibilityLineStylesFullyVerified,false);
 const action=resultActions(unknown).find(a=>a.visibility==='undetermined');
 assert.ok(action);
 const svg=render(action,.5);
 assert.match(svg,/data-visibility="undetermined"/);
 if(action.kind==='line')assert.match(svg,/stroke-dasharray="1.5 5"/);
});
test('04 all observations toward removed halfspace result in no invented hidden segments',()=>{
 const result=build(c(),tilted(3),{
  retainedHalfspace:'negative',
  observerDirections:{V:p(1,0,0),H:p(0,0,1),W:p(1,0,.2)}
 });
 assert.equal(result.status,'ready');
 assert.equal(result.unknownRuns,0);
 assert.equal(result.visibilityLineStylesFullyVerified,true);
 assert.ok(resultActions(result).every(a=>a.visibility==='visible'));
});
test('04 changes to retained side change actual solid/dashed SVG outputs',()=>{
 const outside=build(c(),tilted(3),{
  retainedHalfspace:'negative',observerDirections:observers
 });
 const opposite=build(c(),tilted(3),{
  retainedHalfspace:'positive',observerDirections:observers
 });
 assert.equal(outside.status,'ready');
 assert.equal(opposite.status,'ready');
 const one=resultActions(outside).filter(a=>a.observerView==='V');
 const two=resultActions(opposite).filter(a=>a.observerView==='V');
 assert.ok(one.every(a=>a.visibility==='visible'));
 assert.ok(two.some(a=>a.visibility==='hidden'));
});
test('04 original V5 can compile and seek proof-backed visibility strokes without modifying core',()=>{
 const result=evaluate();
 assert.ok(result.timing.totalMs>0);
 assert.ok(result.steps.every(s=>s.actions.length<=48));
 assert.equal(result.steps[0].id,'cap-45-transfer');
 for(let i=1;i<result.steps.length;i++)
  assert.deepEqual(result.steps[i].dependsOn,[result.steps[i-1].id]);
 for(const action of resultActions(result))
  assert.ok(Motion.actionShapeAttrs(action,1));
 const player=Timeline.createPlayer(result.timing,{revision:14,speed:2});
 player.play(0);
 assert.equal(player.snapshot(300).elapsedMs,600);
 const snap=player.seekStep(4,400);
 assert.equal(snap.activeStepIndex,4);
 player.invalidate(15,500);
 assert.equal(player.canRender(14),false);
});
test('04 high-resolution curve remains within V5 step bounds and retains analytic style changes',()=>{
 const coarse=evaluate({samplesPerTurn:16});
 const fine=evaluate({samplesPerTurn:256});
 assert.equal(fine.status,'ready');
 assert.ok(fine.totalVisibilityActions>coarse.totalVisibilityActions);
 assert.ok(fine.steps.every(s=>s.actions.length<=48));
 assert.equal(fine.visibilityByView.W.counts.hidden,
  coarse.visibilityByView.W.counts.hidden);
 assert.equal(fine.visibilityByView.W.counts.visible,
  coarse.visibilityByView.W.counts.visible);
 assert.ok(fine.steps.length<=300);
});
test('04 top and both caps are handled with actual plane/disk chord evidence',()=>{
 for(const [h,z] of [[30,27],[8,4]]){
  const preview=build(c(5,h),tilted(z),{
   retainedHalfspace:'negative',observerDirections:observers
  });
  assert.equal(preview.status,'ready');
  const actions=resultActions(preview);
  assert.ok(actions.some(a=>a.sourceEdgeId.startsWith('cap-')));
  assert.ok(actions.some(a=>a.sourceEdgeId.startsWith('side-')));
 }
});
test('04 invalid material choice, missing per-view rays, or blocked geometry never gets colored answer',()=>{
 assert.throws(()=>build(c(),tilted(3),{
  retainedHalfspace:'negative',
  observerDirections:{V:p(1,0,0),H:p(0,0,1)}
 }),/observerDirections/);
 assert.throws(()=>build(c(),tilted(3),{
  retainedHalfspace:'bad',observerDirections:observers
 }),/retainedHalfspace/);
 const blocked=build(c(),tilted(-5),{
  retainedHalfspace:'negative',observerDirections:observers
 });
 assert.equal(blocked.status,'blocked');
 assert.equal(blocked.v5PreviewReady,false);
 assert.deepEqual(blocked.steps,[]);
});
test('04 hostile or forged SVG shape metadata cannot change verified rendering styles',()=>{
 const action=resultActions(evaluate()).find(a=>a.visibility==='hidden');
 assert.ok(action);
 assert.throws(()=>render({...action,id:'<script>'}),/supported/);
 assert.throws(()=>render({...action,style:{...action.style,lineStyle:'solid'}}),/inconsistent/);
 assert.throws(()=>render({...action,visibility:'forged'}),/supported/);
 assert.throws(()=>render(action,NaN),/fraction/);
 const svg=render(action,1);
 assert.doesNotMatch(svg,/<script|<foreignObject|<image|href=|<style/i);
});
test('04 pure repeated processing does not alter mathematical input, viewer, or proof metadata',()=>{
 const body=c(),cut=tilted(3),dirs=structuredClone(observers);
 const a=build(body,cut,{retainedHalfspace:'negative',observerDirections:dirs});
 const b=build(structuredClone(body),structuredClone(cut),{
  retainedHalfspace:'negative',observerDirections:structuredClone(dirs)});
 assert.deepEqual(a,b);
 assert.deepEqual(body,c());
 assert.deepEqual(cut,tilted(3));
 assert.deepEqual(dirs,observers);
});
