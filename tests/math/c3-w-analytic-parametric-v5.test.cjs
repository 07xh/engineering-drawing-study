'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {compileFiniteCylinderEndpointV5:compile}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const {project,toSheet}=require('../../core/projection/conventions.js');
const {validateConstructionIntentDAG,validateConstructionIntent}=
 require('../../core/contracts/construction-intent.js');
const {verifiedTeachingActionToV5:convert}=
 require('../../workbench/construction-step-v5-adapter.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const {assertM3ToV5Consistency}=
 require('../../workbench/m3-v5-consistency-gate.cjs');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const frames=()=>({
 V:{origin:{x:310,y:260},scale:4},
 H:{origin:{x:310,y:420},scale:4},
 W:{origin:{x:650,y:260},scale:4}
});
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-7,'difference '+a+' vs '+b);
test('each M3 signed-root W curve becomes one REAL canonical analytic action in original V5',()=>{
 const model=input(),revision=8,v=frames();
 const r=compile({input:model,revision,sheetTransform:v.V,
  viewTransforms:v,stationCountPerBranch:2,includeSourceCircleGuides:true,
  includeProjectedSeamArcGuides:true,includeWAnalyticCurveGuides:true});
 assert.equal(r.status,'analytic-three-view-curve-guides-and-points');
 assert.equal(r.trueAnalyticWCurveV5GuideCount,r.sourceM3.branchCount);
 assert.equal(r.analyticWCurveGuideV5Ready,true);
 assert.equal(r.singleOriginalV5Player,true);
 assert.equal(r.player.canRender(revision),true);
 assert.equal(validateConstructionIntentDAG(r.constructionIntents).ok,true);
 const actions=r.constructionSteps.filter(s=>s.actions[0]?.kind==='analytic-curve');
 assert.equal(actions.length,r.sourceM3.branchCount);
 assert.equal(r.constructionSteps.length,r.constructionIntents.length);
 assert.equal(r.constructionSteps.length,r.timing.segments.length);
 assert.equal(r.entireCurveV5Ready,false);
 assert.equal(r.standardVisibleHiddenLineStylesVerified,false);
 assert.equal(r.canExportCertifiedDrawing,false);
 const map={},viewMap={};
 for(const intent of r.constructionIntents){
  const kind=intent.operations[0].kind;
  if(!['circle','directed-arc','analytic-curve'].includes(kind))continue;
  const view=kind==='analytic-curve'?'W':intent.id.at(-1);
  map[intent.id]=v[view];viewMap[intent.id]=view;
 }
 assert.equal(assertM3ToV5Consistency({revision,
  intents:r.constructionIntents,steps:r.constructionSteps,
  timing:r.timing,sheet:v.V,
  sheetByIntentId:map,viewByIntentId:viewMap}),true);
 for(const g of r.wAnalyticCurveGuides){
  assert.equal(g.view,'W');assert.equal(g.sourceM3BranchVerified,true);
  assert.equal(g.sourceM5WholeBranchPartitionVerified,true);
  assert.equal(g.exactAnalyticSourceVerified,true);
  assert.equal(g.visualSvgApproximationOnly,true);
  assert.equal(g.officialStandardLineStyleVerified,false);
  assert.equal(g.projectedContourAndEndpointVisibilityVerified,false);
  const b=r.sourceM3.branches.find(x=>x.id===g.branchId);
  assert.deepEqual(g.xRange,b.xRange);
  const intent=r.constructionIntents.find(i=>i.id===g.id);
  assert.equal(intent.operations[0].kind,'analytic-curve');
  assert.equal(intent.operations[0].coordinateSpace,'model-mm');
  const step=r.constructionSteps.find(s=>s.id===g.id);
  assert.equal(step.actions[0].kind,'analytic-curve');
  const scene=step.actions[0].geometry;
  for(const t of [0,.17,.5,.83,1]){
   const x=b.xRange[0]+(b.xRange[1]-b.xRange[0])*t;
   const point={x,
    y:model.zCylinder.yCenter+b.signY*Math.sqrt(Math.max(0,
     model.zCylinder.radius**2-(x-model.zCylinder.xCenter)**2)),
    z:model.yCylinder.zCenter+b.signZ*Math.sqrt(Math.max(0,
     model.yCylinder.radius**2-(x-model.yCylinder.xCenter)**2))};
   const expect=toSheet('W',project(point).W,v.W);
   const actual=Motion.evaluateAnalyticCurvePoint(scene,x);
   close(expect.x,actual.x);close(expect.y,actual.y);
  }
  const partial=Motion.analyticCurve(scene,.42);
  assert.equal(partial.finished,false);
  assert.equal(partial.renderApproximationOnly,true);
  assert.ok(partial.d.startsWith('M '));
  assert.ok(partial.d.includes(' L '));
  const attr=Motion.actionShapeAttrs(step.actions[0],.42);
  assert.equal(attr.d,partial.d);
  assert.equal(attr.opacity,1);
  const last=Motion.analyticCurve(scene,1);
  assert.equal(last.finished,true);
  assert.ok(last.d.length>partial.d.length);
 }
 r.player.invalidate(revision+1,0);
 assert.equal(r.player.canRender(revision),false);
});
test('source W analytic guides are explicit opt-in and do not mutate prior point/arc V5',()=>{
 const model=input(),v=frames(),r=compile({input:model,revision:5,
  sheetTransform:v.V,viewTransforms:v,includeProjectedSeamArcGuides:true});
 assert.equal(r.wAnalyticCurveGuides.length,0);
 assert.equal(r.trueAnalyticWCurveV5GuideCount,0);
 assert.equal(r.analyticWCurveGuideV5Ready,false);
 assert.ok(r.constructionSteps.every(s=>s.actions.every(a=>a.kind!=='analytic-curve')));
 for(const invalid of [null,2,'true',{},[]]){
  assert.throws(()=>compile({input:model,revision:2,sheetTransform:v.V,
   includeWAnalyticCurveGuides:invalid}),/W curve guide toggle/);
 }
});
test('analytic renderer refuses source outside radial supports, bad sheet view and forged source operations',()=>{
 const g={parameter:{from:-3,to:3},
  u:{kind:'signed-circle-radical',center:0,offset:2,radius:4,sign:1},
  v:{kind:'signed-circle-radical',center:0,offset:-1,radius:5,sign:-1}};
 const sheet=frames().W,request={id:'radial',kind:'analytic-curve',
  coordinateSpace:'model-mm',view:'W',...g};
 const converted=convert(request,sheet);
 assert.equal(converted.kind,'analytic-curve');
 assert.throws(()=>convert({...request,view:'U'},sheet),/first-angle/);
 assert.throws(()=>convert({...request,view:undefined},sheet),/first-angle model/);
 assert.throws(()=>convert({...request,
  parameter:{from:-7,to:3}},sheet),/radial domain/);
 assert.throws(()=>Motion.evaluateAnalyticCurvePoint(converted.geometry,6),
  /bounded analytic curve parameter/);
 assert.throws(()=>Motion.actionShapeAttrs({
  id:'broken',kind:'analytic-curve',geometry:{
   ...converted.geometry,paper:{...converted.geometry.paper,signU:0}
  }},1),/trusted V5 analytic curve/);
 const source=input();source.zCylinder.zMin=60;source.zCylinder.zMax=80;
 assert.throws(()=>compile({input:source,revision:2,sheetTransform:frames().V,
  includeWAnalyticCurveGuides:true}),/endpoint proof unavailable/);
});
test('original web UI plays W M3 mathematical curve without claiming standard hidden-line answer',()=>{
 const ui=fs.readFileSync('labs/finite-cylinder-intersection-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/finite-cylinder-intersection-live.html','utf8');
 assert.match(ui,/includeWAnalyticCurveGuides:true/);
 assert.match(ui,/analytic-curve/);
 assert.match(ui,/Motion\.updateSvg\(shape,action,fraction\)/);
 assert.match(ui,/M3-source-M5-open-ray-evidence-not-official-line-style/);
 assert.match(html,/SVG 则采用自适应分段显示/);
 assert.match(html,/均非国标实虚线/);
 assert.doesNotMatch(ui,/data-official-line-style.*true/);
});
