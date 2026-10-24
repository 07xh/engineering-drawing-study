'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const {project}=require('../../core/projection/conventions.js');
const {buildC3VHProjectionDedup:build,
 evaluateC3VHProjectedSpan:at}=require('../../workbench/c3-vh-projection-dedup.cjs');
const {compileFiniteCylinderEndpointV5:compile}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('V/H shared source-circle projections de-duplicate all overlapping signed M3 branches',()=>{
 const source=input(),r=build({input:source,revision:8});
 const M=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input:source,revision:8});
 assert.equal(r.status,'scoped-projected-analytic-interval-deduplicated');
 assert.equal(r.sourceBranchCount,M.branchCount);
 assert.equal(r.visibleUniqueVSpanCount,2);
 assert.equal(r.visibleUniqueHSpanCount,2);
 assert.ok(r.visibleUniqueVSpanCount<M.branchCount);
 assert.ok(r.visibleUniqueHSpanCount<M.branchCount);
 assert.equal(r.projectionOwnershipVerified,true);
 assert.equal(r.originalCylinderContourCoincidenceProven,true);
 for(const view of ['V','H'])for(const b of M.branches){
  const row=r.spans.find(s=>s.view===view&&
   s.sourceBranchIds.includes(b.id));
  assert.ok(row);
  assert.ok(row.xOpenRange[0]<=b.xRange[0]);
  assert.ok(row.xOpenRange[1]>=b.xRange[1]);
  for(const witness of b.witnesses){
   const expected=project(witness.point)[view];
   const actual=at(row,witness.point.x);
   assert.ok(Math.abs(actual.u-expected.u)<1e-8);
   assert.ok(Math.abs(actual.v-expected.v)<1e-8);
   const C=row.projectedSourceCircle;
   assert.ok(Math.abs((actual.u-C.xCenter)**2+
    (actual.v-C.coordinateCenter)**2-C.radius**2)<1e-7);
  }
 }
 assert.ok(r.spans.every(s=>s.officialLineStyle==='undetermined'&&
  s.v5CurveActionAuthorized===false&&
  s.originalEngineeringContourOwnershipVerified===false));
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.v5CurveActionsAuthorized,false);
 assert.equal(Object.isFrozen(r.spans),true);
});
test('finite cap clipping preserves source coverage when sign branches have different x domains',()=>{
 const source=input();
 source.yCylinder.yMin=-9;source.yCylinder.yMax=10;
 source.zCylinder.zMin=-8;source.zCylinder.zMax=7;
 const r=build({input:source,revision:19});
 const M=evaluateUnifiedMath({kind:'finite-orthogonal-cylinder-intersection',
  input:source,revision:19});
 assert.equal(r.status,'scoped-projected-analytic-interval-deduplicated');
 assert.ok(M.branchCount>0);
 for(const view of ['V','H'])for(const branch of M.branches){
  const parent=r.spans.filter(s=>s.view===view&&
   s.sourceBranchIds.includes(branch.id)&&
   s.xOpenRange[0]<=branch.xRange[0]&&
   s.xOpenRange[1]>=branch.xRange[1]);
  assert.equal(parent.length,1);
 }
});
test('same X centers: V/H retained-sign equivalence holds despite W projected self collisions',()=>{
 const source=input();source.yCylinder.xCenter=0;
 const r=build({input:source,revision:3});
 assert.equal(r.status,'scoped-projected-analytic-interval-deduplicated');
 assert.ok(r.spans.length>0);
 assert.ok(r.spans.every(s=>s.v5CurveActionAuthorized===false));
});
test('projected-source evaluator rejects guessed or out-of-range arc values',()=>{
 const source=input();
 const r=build({input:source,revision:6}),row=r.spans[0];
 assert.throws(()=>at(row,row.xOpenRange[1]+1),/reviewed C3 projected source/);
 assert.throws(()=>at({...row,v5CurveActionAuthorized:true},
  (row.xOpenRange[0]+row.xOpenRange[1])/2),/reviewed C3 projected source/);
 const p=at(row,(row.xOpenRange[0]+row.xOpenRange[1])/2);
 assert.ok(Number.isFinite(p.u)&&Number.isFinite(p.v));
});
test('V/H de-dup visualization never alters real canonical original V5 point actions',()=>{
 const source=input(),r=build({input:source,revision:9});
 const compiled=compile({input:source,revision:9,
  sheetTransform:{origin:{x:320,y:240},scale:4},
  stationCountPerBranch:2});
 assert.ok(r.spans.length>0);
 assert.ok(compiled.constructionSteps.every(s=>
  s.actions.every(a=>a.kind==='point')));
 assert.equal(compiled.entireCurveV5Ready,false);
 assert.equal(compiled.standardVisibleHiddenLineStylesVerified,false);
 const js=fs.readFileSync('labs/finite-cylinder-intersection-live-entry.cjs','utf8');
 assert.match(js,/buildC3VHProjectionDedup\(\{input,revision\}\)/);
 assert.match(js,/evaluateC3VHProjectedSpan\(row,x\)/);
 assert.match(js,/data-analytic-projection-deduplicated/);
 assert.match(js,/data-original-contour-owner/);
 assert.match(js,/data-official-v5.*false/);
});
test('empty finite source cannot declare projected ownership or canonical V5 line strokes',()=>{
 const source=input();source.zCylinder.zMin=55;source.zCylinder.zMax=70;
 const r=build({input:source,revision:2});
 assert.equal(r.status,'not-covered');
 assert.equal(r.projectionOwnershipVerified,false);
 assert.equal(r.spans.length,0);
 assert.equal(r.v5CurveActionsAuthorized,false);
});
