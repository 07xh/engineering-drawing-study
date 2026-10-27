'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {verifiedTeachingActionToV5}=
 require('../../workbench/construction-step-v5-adapter.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const {assertM3ToV5Consistency}=
 require('../../workbench/m3-v5-consistency-gate.cjs');
const {CONSTRUCTION_INTENT_VERSION}=
 require('../../core/contracts/construction-intent.js');
const sheet={origin:{x:100,y:100},scale:1};
const hiddenStyle='gb-t-4457.4-thin-dashed-hidden-edge';
function example(){
 const action={id:'real_hidden_line',kind:'line',
  coordinateSpace:'sheet-px',from:{x:0,y:0},to:{x:10,y:0},
  engineeringLineStyle:hiddenStyle};
 const source={solver:'workbench/reviewed-solid-vertex-v5.cjs',
  revision:1,unit:'mm',proofScope:'single-confirmed-convex-physical-edge',
  proofLevel:'analytic',resultId:null,branchId:null,
  status:'unique',evidenceSource:'verified-original-3d-M0-M4-M5-rays'};
 const intent={schema:CONSTRUCTION_INTENT_VERSION,id:'real_hidden_step',
  purpose:'draw-certified-hidden-physical-crease',role:'result',
  dependsOn:[],inputEntityIds:[],outputEntityIds:['real_hidden_line'],
  operations:[{id:'real_hidden_line',kind:'line',coordinateSpace:'sheet-px',
   geometry:{from:{x:0,y:0},to:{x:10,y:0}}}],source};
 const step={id:intent.id,dependsOn:[],role:'result',
  actions:[verifiedTeachingActionToV5(action,sheet)]};
 const intents=[intent],steps=[step],timing=Timeline.compileTimeline(steps);
 return {intents,steps,timing};
}
test('existing V5 preserves real dashed engineering line in the timeline',()=>{
 const {intents,steps,timing}=example();
 assert.equal(assertM3ToV5Consistency({revision:1,intents,steps,timing,
  sheet,styleByIntentId:{real_hidden_step:hiddenStyle}}),true);
 const action=steps[0].actions[0];
 assert.equal(action.engineeringLineStyle,hiddenStyle);
 const attrs=Motion.actionShapeAttrs(action,1);
 assert.equal(attrs['stroke-dasharray'],'6 3');
 assert.equal(attrs['stroke-width'],1);
 const player=Timeline.createPlayer(timing,{revision:1});
 assert.equal(player.canRender(1),true);
 assert.equal(timing.segments.length,1);
});
test('style cannot bypass original canonical M3/Intent -> V5 parity',()=>{
 const {intents,steps,timing}=example();
 assert.throws(()=>assertM3ToV5Consistency({
  revision:1,intents,steps,timing,sheet
 }),/V5 geometry differs/);
 assert.throws(()=>assertM3ToV5Consistency({
  revision:1,intents,steps,timing,sheet,
  styleByIntentId:{real_hidden_step:'invented-visible'}
 }),/engineering line style/);
 assert.throws(()=>verifiedTeachingActionToV5({
  id:'bad',kind:'line',coordinateSpace:'sheet-px',
  from:{x:0,y:0},to:{x:10,y:0},engineeringLineStyle:'unknown'
 },sheet),/line-style/);
});
test('C1 SVG differentiates signed M5 dashed from unsigned review overlay',()=>{
 const {renderC1ThirdViewSvg}=
  require('../../workbench/c1-third-view-svg-preview.cjs');
 const d={schema:'draftai-c1-m3-m5-third-view-drawing/1',
  view:'W',revision:1,completeDrawingCertified:false,
  uncertifiedEdgesAreNotV5Actions:true,
  sheetPoints:{A:{x:0,y:0},B:{x:10,y:0},C:{x:0,y:10},D:{x:10,y:10}},
  certifiedVisibleContour:[],
  certifiedPhysicalFeatures:[{sourceEdgeId:'solid::A|B',
   v5ActionId:'signed-hidden-action',standardLineStyle:hiddenStyle,
   fromSheetPx:{x:0,y:0},toSheetPx:{x:10,y:0}}],
  unresolvedPhysicalEdges:[{sourceEdgeId:'solid::C|D',
   v5ActionId:null,standardLineStyle:'undetermined',
   fromSheetPx:{x:0,y:10},toSheetPx:{x:10,y:10}}]};
 const svg=renderC1ThirdViewSvg(d);
 assert.match(svg,/data-status="certified-hidden"/);
 assert.match(svg,/data-v5-action="signed-hidden-action"/);
 assert.match(svg,/stroke-dasharray="6 3"/);
 assert.match(svg,/data-status="undetermined-review"/);
 assert.throws(()=>{
  d.certifiedPhysicalFeatures[0].v5ActionId='';
  renderC1ThirdViewSvg(d);
 },/unique signed V5/);
});
