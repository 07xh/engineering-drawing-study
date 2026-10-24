'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {compileFiniteCylinderEndpointV5:compile}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {buildC3VHProjectionDedup,evaluateC3VHProjectedSpan}=
 require('../../workbench/c3-vh-projection-dedup.cjs');
const {assertM3ToV5Consistency}=
 require('../../workbench/m3-v5-consistency-gate.cjs');
const {validateConstructionIntentDAG}=
 require('../../core/contracts/construction-intent.js');
const {toSheet}=require('../../core/projection/conventions.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const frames=()=>({
 V:{origin:{x:310,y:260},scale:4},
 H:{origin:{x:310,y:420},scale:4},
 W:{origin:{x:650,y:260},scale:4}
});
const close=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<eps,
 'expected '+a+' close to '+b);
test('all analytic V/H seam arcs compile to real canonical directed V5 arcs, not chords',()=>{
 const source=input(),revision=13,v=frames();
 const dedup=buildC3VHProjectionDedup({input:source,revision});
 const r=compile({input:source,revision,sheetTransform:v.V,viewTransforms:v,
  stationCountPerBranch:2,includeSourceCircleGuides:true,
  includeProjectedSeamArcGuides:true});
 assert.equal(r.status,'analytic-vh-projection-arc-guides-and-points');
 assert.equal(r.exactAnalyticVHArcV5Ready,true);
 assert.equal(r.provenAnalyticVHArcV5ActionCount,dedup.spans.length);
 assert.equal(r.projectedSeamArcGuides.length,dedup.spans.length);
 assert.equal(r.sourceCircleGuides.length,2);
 assert.equal(r.constructionIntents.length,r.bindings.length+dedup.spans.length+2);
 assert.equal(validateConstructionIntentDAG(r.constructionIntents).ok,true);
 assert.equal(r.singleOriginalV5Player,true);
 assert.equal(r.player.canRender(revision),true);
 const viewIntents=r.constructionIntents.filter(i=>
  i.operations[0].kind==='circle'||i.operations[0].kind==='directed-arc');
 const map=Object.fromEntries(viewIntents.map(i=>
  [i.id,v[i.id.at(-1)]]));
 const viewsById=Object.fromEntries(viewIntents.map(i=>
  [i.id,i.id.at(-1)]));
 assert.equal(assertM3ToV5Consistency({revision,
  intents:r.constructionIntents,steps:r.constructionSteps,
  timing:r.timing,sheet:v.V,sheetByIntentId:map,
  viewByIntentId:viewsById}),true);
 const actions=r.constructionSteps.filter(s=>s.actions[0].kind==='arc');
 assert.equal(actions.length,dedup.spans.length);
 for(let index=0;index<dedup.spans.length;index++){
  const row=dedup.spans[index],g=r.projectedSeamArcGuides[index];
  const operation=r.constructionIntents.find(i=>i.id===g.id).operations[0];
  const action=r.constructionSteps.find(s=>s.id===g.id).actions[0];
  assert.equal(operation.kind,'directed-arc');
  assert.equal(operation.coordinateSpace,'model-mm');
  assert.equal(action.kind,'arc');
  assert.equal(g.view,row.view);
  assert.equal(g.sourceCylinder,row.sourceCylinder);
  assert.deepEqual(g.sourceBranchIds,row.sourceBranchIds);
  assert.deepEqual(g.xRange,row.xOpenRange);
  assert.equal(g.retainedSign,row.retainedSign);
  assert.deepEqual(g.centerModelMm,
   {x:row.projectedSourceCircle.xCenter,
    y:row.projectedSourceCircle.coordinateCenter});
  assert.equal(g.radiusModelMm,row.projectedSourceCircle.radius);
  assert.equal(g.modelDirection,row.retainedSign===1?'cw':'ccw');
  assert.equal(g.exactProjectedCircleArcVerified,true);
  assert.equal(g.duplicateSourceProjectionRemoved,true);
  assert.equal(g.canonicalDirectedArcV5Authorized,true);
  assert.equal(g.originalFeatureContourVisibilityVerified,false);
  assert.equal(g.officialStandardLineStyleVerified,false);
  const a=Motion.arc(action.geometry.center,action.geometry.radius,
   action.geometry.startRadians,action.geometry.sweepRadians,0);
  const b=Motion.arc(action.geometry.center,action.geometry.radius,
   action.geometry.startRadians,action.geometry.sweepRadians,1);
  const start=toSheet(row.view,
   evaluateC3VHProjectedSpan(row,row.xOpenRange[0]),v[row.view]);
  const end=toSheet(row.view,
   evaluateC3VHProjectedSpan(row,row.xOpenRange[1]),v[row.view]);
  close(a.pen.x,start.x);close(a.pen.y,start.y);
  close(b.pen.x,end.x);close(b.pen.y,end.y);
  const half=Motion.arc(action.geometry.center,action.geometry.radius,
   action.geometry.startRadians,action.geometry.sweepRadians,.5).pen;
  const uv={u:(half.x-v[row.view].origin.x)/v[row.view].scale,
   v:(v[row.view].origin.y-half.y)/v[row.view].scale};
  close((uv.u-g.centerModelMm.x)**2+
   (uv.v-g.centerModelMm.y)**2,g.radiusModelMm**2);
  assert.ok(uv.u>=row.xOpenRange[0]-1e-7&&
   uv.u<=row.xOpenRange[1]+1e-7);
  assert.ok(row.retainedSign*(uv.v-g.centerModelMm.y)>=-1e-7);
 }
 assert.ok(r.constructionSteps.filter(s=>s.actions[0].kind==='point').length>0);
 assert.equal(r.entireCurveV5Ready,false);
 assert.equal(r.standardVisibleHiddenLineStylesVerified,false);
 assert.equal(r.canExportCertifiedDrawing,false);
 r.player.invalidate(revision+1,0);
 assert.equal(r.player.canRender(revision),false);
});
test('old V5 modes stay closed for analytic arc actions unless explicitly requested',()=>{
 const t=frames().V;
 const legacy=compile({input:input(),revision:3,sheetTransform:t,
  stationCountPerBranch:1});
 assert.equal(legacy.projectedSeamArcGuides.length,0);
 assert.equal(legacy.provenAnalyticVHArcV5ActionCount,0);
 assert.ok(legacy.constructionSteps.every(s=>s.actions[0].kind==='point'));
 const guide=compile({input:input(),revision:3,sheetTransform:t,
  stationCountPerBranch:1,includeSourceCircleGuides:true});
 assert.equal(guide.projectedSeamArcGuides.length,0);
 assert.equal(guide.status,'analytic-point-actions-and-original-circle-guides');
 for(const bad of [null,4,'true',[],{}])
  assert.throws(()=>compile({input:input(),revision:3,sheetTransform:t,
   includeProjectedSeamArcGuides:bad}),/seam-arc guide toggle/);
});
test('true finite cap-clipped V/H subarcs keep their exact source endpoints',()=>{
 const source=input();source.zCylinder.zMin=-8;source.zCylinder.zMax=7;
 source.yCylinder.yMin=-9;source.yCylinder.yMax=10;
 const revision=14;
 const r=compile({input:source,revision,sheetTransform:frames().V,
  viewTransforms:frames(),includeProjectedSeamArcGuides:true});
 const d=buildC3VHProjectionDedup({input:source,revision});
 assert.equal(r.projectedSeamArcGuides.length,d.spans.length);
 assert.ok(r.projectedSeamArcGuides.length>0);
 assert.equal(r.entireCurveV5Ready,false);
 assert.ok(r.projectedSeamArcGuides.every(g=>
  g.officialStandardLineStyleVerified===false));
});
test('without finite M3 intersection no projected V5 curve arc is invented',()=>{
 const source=input();source.zCylinder.zMin=60;source.zCylinder.zMax=80;
 assert.throws(()=>compile({input:source,revision:3,
  sheetTransform:frames().V,viewTransforms:frames(),
  includeProjectedSeamArcGuides:true}),/endpoint proof unavailable/);
});
test('real public page consumes true V5 directed arc, but never upgrades line styles',()=>{
 const source=fs.readFileSync('labs/finite-cylinder-intersection-live-entry.cjs','utf8');
 const page=fs.readFileSync('labs/finite-cylinder-intersection-live.html','utf8');
 assert.match(source,/includeProjectedSeamArcGuides:true/);
 assert.match(source,/provenAnalyticVHArcV5ActionCount/);
 assert.match(source,/analyticArc=action.kind==='arc'/);
 assert.match(source,/Motion\.updateSvg\(shape,action,fraction\)/);
 assert.match(source,/exact-analytic-VH-projection-arc-not-official/);
 assert.match(page,/紫色精确相贯投影弧/);
 assert.match(page,/没有获得正式工程实虚线资格/);
 assert.doesNotMatch(source,/v5CurveReady:true|entireCurveV5Ready:true/);
});
