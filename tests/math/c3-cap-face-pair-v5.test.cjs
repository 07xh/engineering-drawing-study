'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {compileFiniteCylinderEndpointV5:compile}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {auditC3CapBoundaryIncidence}=require('../../workbench/c3-cap-boundary-incidence.cjs');
const {project,toSheet}=require('../../core/projection/conventions.js');
const {validateConstructionIntentDAG}=require('../../core/contracts/construction-intent.js');
const {assertM3ToV5Consistency}=
 require('../../workbench/m3-v5-consistency-gate.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const paper=()=>({V:{origin:{x:310,y:265},scale:4},
 H:{origin:{x:310,y:410},scale:4},
 W:{origin:{x:655,y:265},scale:4}});
test('clipped finite Y-cap/Z-lateral curves use real first-angle line/point V5 without fake 0-length lines',()=>{
 const s=input();s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const v=paper(),revision=12;
 const cap=auditC3CapBoundaryIncidence({input:s,revision});
 assert.equal(cap.status,'scoped-analytic-cap-junction-incidence');
 assert.equal(cap.capSegments.length,2);
 const r=compile({input:s,revision,sheetTransform:v.V,viewTransforms:v,
  stationCountPerBranch:1,includeSourceCircleGuides:true,
  includeProjectedSeamArcGuides:true,
  includeWAnalyticCurveGuides:true,wRayPartitionedV5:true,
  includeCapFacePairGuides:true});
 assert.equal(r.sourceCapFaceGeometryV5Ready,true);
 assert.equal(r.sourceCapFaceProjectionActionCount,6);
 assert.equal(r.sourceCapFaceCollapsedProjectionPointCount,2);
 assert.equal(r.capFacePairGuides.length,6);
 assert.equal(r.singleOriginalV5Player,true);
 assert.equal(r.player.canRender(revision),true);
 assert.equal(validateConstructionIntentDAG(r.constructionIntents).ok,true);
 for(const g of r.capFacePairGuides){
  assert.equal(g.sourceExactCapFacePairMathVerified,true);
  assert.equal(g.originalLateralJunctionContinuationVerified,false);
  assert.equal(g.officialStandardLineStyleVerified,false);
  assert.equal(g.sourceProjectionCollapsedToPoint,g.view==='H');
  const source=cap.capSegments.find(s=>s.id===g.sourceFeatureId);
  assert.ok(source);
  const projectedFrom=project(source.from)[g.view];
  const projectedTo=project(source.to)[g.view];
  assert.deepEqual(g.projectedModelMm.from,projectedFrom);
  assert.deepEqual(g.projectedModelMm.to,projectedTo);
  const action=r.constructionSteps.find(x=>x.id===g.id).actions[0];
  const a=toSheet(g.view,projectedFrom,v[g.view]);
  const b=toSheet(g.view,projectedTo,v[g.view]);
  if(g.sourceProjectionCollapsedToPoint){
   assert.equal(action.kind,'point');
   assert.deepEqual(action.geometry.center,a);
   assert.deepEqual(a,b);
  }else{
   assert.equal(action.kind,'line');
   assert.deepEqual(action.geometry,{from:a,to:b});
   assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>0);
  }
  assert.ok(Object.isFrozen(g));
  assert.equal(g.officialStandardLineStyleVerified,false);
 }
 const mapping={},viewMap={};
 for(const intent of r.constructionIntents){
  const k=intent.operations[0].kind;
  if(['circle','directed-arc','analytic-curve'].includes(k)){
   const view=k==='analytic-curve'?'W':intent.id.at(-1);
   mapping[intent.id]=v[view];viewMap[intent.id]=view;
  }
  if(intent.id.startsWith('C3CapPair')){
   const view=intent.id.at(-1);mapping[intent.id]=v[view];viewMap[intent.id]=view;
  }
 }
 assert.equal(assertM3ToV5Consistency({revision,
  intents:r.constructionIntents,steps:r.constructionSteps,timing:r.timing,
  sheet:v.V,sheetByIntentId:mapping,viewByIntentId:viewMap}),true);
 assert.equal(r.entireCurveV5Ready,false);
 assert.equal(r.standardVisibleHiddenLineStylesVerified,false);
 assert.equal(r.canExportCertifiedDrawing,false);
 r.player.invalidate(revision+1,0);
 assert.equal(r.player.canRender(revision),false);
});
test('all three analytic finite cap-pair feature families produce one source-bound action per first-angle view',()=>{
 const s=input();s.zCylinder.zMin=-5;s.zCylinder.zMax=5;
 s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const cap=auditC3CapBoundaryIncidence({input:s,revision:6});
 assert.equal(cap.capSegments.length,10);
 const r=compile({input:s,revision:6,sheetTransform:paper().V,
  viewTransforms:paper(),stationCountPerBranch:1,
  includeCapFacePairGuides:true});
 assert.equal(r.capFacePairGuides.length,30);
 assert.equal(r.sourceCapFaceCollapsedProjectionPointCount,10);
 assert.equal(r.constructionSteps.filter(s=>s.id.startsWith('C3CapPair')).length,30);
 assert.equal(r.constructionIntents.length,r.bindings.length+30);
 assert.ok(r.capFacePairGuides.some(g=>g.pairKind==='z-cap-to-y-cap'));
 for(const g of r.capFacePairGuides){
  assert.equal(g.officialStandardLineStyleVerified,false);
  const action=r.constructionSteps.find(s=>s.id===g.id).actions[0];
  assert.equal(action.kind,g.sourceProjectionCollapsedToPoint?'point':'line');
  const half=Motion.actionShapeAttrs(action,.5);
  if(action.kind==='line')assert.ok(Number.isFinite(half.x2));
  else assert.ok(Number.isFinite(half.cx));
 }
 assert.equal(r.standardVisibleHiddenLineStylesVerified,false);
});
test('opt-in cap source cannot change legacy C3 canonical V5 or authorize engineering lines',()=>{
 const s=input(),base=compile({input:s,revision:2,sheetTransform:paper().V,
  includeWAnalyticCurveGuides:true});
 assert.equal(base.capFacePairGuides.length,0);
 assert.equal(base.sourceCapFaceProjectionActionCount,0);
 assert.equal(base.sourceCapFaceGeometryV5Ready,false);
 for(const invalid of [null,1,'true',[],{}]){
  assert.throws(()=>compile({input:s,revision:2,sheetTransform:paper().V,
   includeCapFacePairGuides:invalid}),/face-pair guide toggle/);
 }
 const tangency=input();tangency.zCylinder.zMax=9;
 assert.throws(()=>compile({input:tangency,revision:5,
  sheetTransform:paper().V,includeCapFacePairGuides:true}),
  /cap-face pair analytic source unavailable|endpoint proof unavailable/);
});
test('real workbench plays exact capped feature guides on one V5 with explicit unsigned provenance',()=>{
 const ui=fs.readFileSync('labs/finite-cylinder-intersection-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/finite-cylinder-intersection-live.html','utf8');
 assert.match(ui,/includeCapFacePairGuides:true/);
 assert.match(ui,/capFacePairGuides\.find/);
 assert.match(ui,/data-cap-pair-id/);
 assert.match(ui,/cap-face-pair-geometry-only-not-official/);
 assert.match(ui,/Motion\.updateSvg\(shape,action,fraction\)/);
 assert.match(html,/绿色虚点线 \/ 绿点/);
 assert.match(html,/不代表国标实虚线/);
 assert.doesNotMatch(ui,/data-official-line-style.*true/);
});
