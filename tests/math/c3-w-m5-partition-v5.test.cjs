'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {compileFiniteCylinderEndpointV5:compile}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {buildC3WIntervalPreview:preview}=
 require('../../workbench/c3-w-ray-preview.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const {assertM3ToV5Consistency}=
 require('../../workbench/m3-v5-consistency-gate.cjs');
const {validateConstructionIntentDAG}=
 require('../../core/contracts/construction-intent.js');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const frames=()=>({
 V:{origin:{x:310,y:260},scale:4},H:{origin:{x:310,y:420},scale:4},
 W:{origin:{x:650,y:260},scale:4}
});
test('W real analytic V5 is partitioned EXACTLY by current M3/M5 reviewed open rays',()=>{
 const input=model(),revision=18,view=frames();
 const proof=preview({input,revision});
 const result=compile({input,revision,sheetTransform:view.V,viewTransforms:view,
  stationCountPerBranch:2,includeSourceCircleGuides:true,
  includeProjectedSeamArcGuides:true,includeWAnalyticCurveGuides:true,
  wRayPartitionedV5:true});
 assert.equal(result.m5OpenRayPartitionedWCurveV5Ready,true);
 assert.equal(result.trueAnalyticWCurveV5GuideCount,proof.intervals.length);
 assert.equal(result.analyticWCurveGuideV5Ready,true);
 assert.equal(result.m5RayCertifiedClearGuideCount,proof.certifiedClearCount);
 assert.equal(result.m5RayCertifiedOccludedGuideCount,proof.certifiedOccludedCount);
 assert.equal(result.singleOriginalV5Player,true);
 assert.equal(result.entireCurveV5Ready,false);
 assert.equal(result.standardVisibleHiddenLineStylesVerified,false);
 assert.equal(result.canExportCertifiedDrawing,false);
 assert.equal(validateConstructionIntentDAG(result.constructionIntents).ok,true);
 const guards=result.wAnalyticCurveGuides;
 for(const [i,g] of guards.entries()){
  const p=proof.intervals[i],action=result.constructionSteps.find(x=>x.id===g.id).actions[0];
  assert.equal(g.branchId,p.branchId);
  assert.equal(g.m5OpenInteriorRayStatus,p.openInteriorRayStatus);
  assert.deepEqual(g.sourceXOpenRange,p.xOpenRange);
  assert.equal(g.m5EvidenceId,p.originalM5EvidenceId);
  assert.equal(g.m5SourcePartitioned,true);
  assert.equal(g.transitionAndEndpointStyleVerified,false);
  assert.equal(g.officialStandardLineStyleVerified,false);
  assert.equal(action.kind,'analytic-curve');
  assert.ok(g.xRange[0]>p.xOpenRange[0]);
  assert.ok(g.xRange[1]<p.xOpenRange[1]);
  assert.deepEqual(action.geometry.parameter,
   {from:g.xRange[0],to:g.xRange[1]});
  assert.equal(Motion.analyticCurve(action.geometry,1).finished,true);
 }
 const sheetBy={},viewBy={};
 for(const intent of result.constructionIntents){
  const kind=intent.operations[0].kind;
  if(!['circle','directed-arc','analytic-curve'].includes(kind))continue;
  const viewName=kind==='analytic-curve'?'W':intent.id.at(-1);
  sheetBy[intent.id]=view[viewName];viewBy[intent.id]=viewName;
 }
 assert.equal(assertM3ToV5Consistency({revision,
  intents:result.constructionIntents,steps:result.constructionSteps,
  timing:result.timing,sheet:view.V,
  sheetByIntentId:sheetBy,viewByIntentId:viewBy}),true);
 result.player.invalidate(revision+1,0);
 assert.equal(result.player.canRender(revision),false);
});
test('exact W projection collisions demote colored W V5 strokes to undetermined evidence',()=>{
 const input=model();input.yCylinder.xCenter=input.zCylinder.xCenter;
 const p=preview({input,revision:2});
 assert.equal(p.exactProjectedLateralSelfOverlapExcluded,false);
 const r=compile({input,revision:2,sheetTransform:frames().V,
  viewTransforms:frames(),includeWAnalyticCurveGuides:true,
  wRayPartitionedV5:true});
 assert.equal(r.wAnalyticCurveGuides.length,p.intervals.length);
 assert.ok(r.wAnalyticCurveGuides.every(g=>
  g.m5OpenInteriorRayStatus==='undetermined'));
 assert.equal(r.m5RayCertifiedClearGuideCount,0);
 assert.equal(r.m5RayCertifiedOccludedGuideCount,0);
 assert.equal(r.standardVisibleHiddenLineStylesVerified,false);
});
test('segment mode is explicit, bounded and cannot be passed without analytic M3 authorization',()=>{
 const input=model(),sheet=frames().V;
 for(const invalid of [null,'true',{},1]){
  assert.throws(()=>compile({input,revision:2,sheetTransform:sheet,
   includeWAnalyticCurveGuides:true,wRayPartitionedV5:invalid}),
  /M5 W interval mode/);
 }
 assert.throws(()=>compile({input,revision:2,sheetTransform:sheet,
  wRayPartitionedV5:true}),/M5 W interval mode/);
 const legacy=compile({input,revision:2,sheetTransform:sheet,
  includeWAnalyticCurveGuides:true});
 assert.equal(legacy.wAnalyticCurveGuides.length,legacy.sourceM3.branchCount);
 assert.equal(legacy.m5OpenRayPartitionedWCurveV5Ready,false);
});
test('W page maps real canonical curve actions to ray-evidence color, not certified engineering styles',()=>{
 const ui=fs.readFileSync('labs/finite-cylinder-intersection-live-entry.cjs','utf8');
 const page=fs.readFileSync('labs/finite-cylinder-intersection-live.html','utf8');
 assert.match(ui,/wRayPartitionedV5:true/);
 assert.match(ui,/data-M5-open-ray-status/);
 assert.match(ui,/WProof\.m5OpenInteriorRayStatus/);
 assert.match(ui,/data-official-line-style.*false/);
 assert.match(page,/端点附近留空/);
 assert.match(page,/均非国标实虚线/);
});
