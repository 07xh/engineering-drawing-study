'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {compileFiniteCylinderEndpointV5}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {buildC3LinkedGeometryScene}=
 require('../../workbench/c3-linked-geometry-scene.cjs');
const {auditC3M0M3M5AnalyticSources}=
 require('../../workbench/c3-m0-m3-m5-analytic-source-acceptance.cjs');
function input(){return {
 kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}
};}
function transforms(){return {
 V:{origin:{x:310,y:265},scale:4},
 H:{origin:{x:310,y:410},scale:4},
 W:{origin:{x:655,y:265},scale:4}
};}
function build(source=input(),revision=3){
 const viewTransforms=transforms();
 const compiled=compileFiniteCylinderEndpointV5({
  input:source,revision,sheetTransform:viewTransforms.V,viewTransforms,
  stationCountPerBranch:1,includeSourceCircleGuides:true,
  includeProjectedSeamArcGuides:true,includeWAnalyticCurveGuides:true,
  wRayPartitionedV5:true,includeCapFacePairGuides:true
 });
 const linked=buildC3LinkedGeometryScene({
  input:source,revision,compiled,viewTransforms
 });
 return {source,revision,compiled,linked,viewTransforms};
}
for(const solidOperation of [null,'intersection','union']){
 test('C3 real finite perpendicular-cylinder M0/M3/M5 analytic original-source proof: '+(solidOperation||'unselected'),()=>{
  const f=build();
  const accepted=auditC3M0M3M5AnalyticSources({
   input:f.source,revision:f.revision,compiled:f.compiled,
   linked:f.linked,viewTransforms:f.viewTransforms,solidOperation
  });
  assert.equal(accepted.status,'actual-current-M3-source-and-M5-local-ray-parity');
  assert.equal(accepted.originalSymbolic3DCurveCount,f.compiled.sourceM3.branchCount);
  assert.ok(accepted.originalSymbolic3DCurveCount>0);
  assert.equal(accepted.independentFirstAngleProjectionCount,
   f.linked.spatialObjectCount*3);
  assert.equal(accepted.officialEngineeringLineStylesVerified,false);
  assert.equal(accepted.entireCurveV5Ready,false);
  assert.equal(accepted.createsSecondMathSolver,false);
  assert.equal(accepted.createsSecondV5Player,false);
  if(solidOperation){
   assert.equal(accepted.booleanM5RayProof.schema,
    'draftai-c3-boolean-VHW-open-rays/1');
   assert.equal(accepted.booleanM5RayProof.solidOperation,solidOperation);
   assert.equal(accepted.analyticallyAgreeingM0M5ObserverRayIntervals,
    accepted.independentlyCheckedAnalyticM5OpenRayIntervals);
   assert.equal(accepted.booleanM5RayProof.finalV5CurveAuthorized,false);
  }else assert.equal(accepted.booleanM5RayProof,null);
 });
}
test('C3 finite cap-clipped genuine analytic source and 3D segment projections remain linked',()=>{
 const source=input();
 source.yCylinder.yMin=-6;source.yCylinder.yMax=6;
 const f=build(source,11);
 const accepted=auditC3M0M3M5AnalyticSources({
  input:source,revision:11,compiled:f.compiled,linked:f.linked,
  viewTransforms:f.viewTransforms,solidOperation:'intersection'});
 assert.ok(accepted.originalFiniteCapSegmentCount>=1);
 assert.ok(accepted.originalSymbolic3DCurveCount>0);
 assert.equal(accepted.independentFirstAngleProjectionCount,
  f.linked.spatialObjectCount*3);
 assert.equal(accepted.entireCurveV5Ready,false);
});
test('edited independent 3D analytic branch projection cannot masquerade as canonical M0 geometry',()=>{
 const f=build(),forged=structuredClone(f.linked);
 const curve=forged.scene.objects.find(o=>o.kind==='analytic-curve');
 assert.ok(curve);
 curve.representations.W.start.u+=0.5;
 assert.throws(()=>auditC3M0M3M5AnalyticSources({
  input:f.source,revision:f.revision,compiled:f.compiled,linked:forged,
  viewTransforms:f.viewTransforms,solidOperation:'union'
 }),/caller scene/);
});
test('C3 stale radius and wrong revision cannot reuse original M3 source or V5',()=>{
 const f=build(),edited=structuredClone(f.source);
 edited.zCylinder.radius+=0.5;
 assert.throws(()=>auditC3M0M3M5AnalyticSources({
  input:edited,revision:f.revision,compiled:f.compiled,linked:f.linked,
  viewTransforms:f.viewTransforms,solidOperation:'intersection'
 }),/M3 source/);
 assert.throws(()=>auditC3M0M3M5AnalyticSources({
  input:f.source,revision:f.revision+1,compiled:f.compiled,linked:f.linked,
  viewTransforms:f.viewTransforms,solidOperation:'intersection'
 }),/M3 source|current real M3/);
});
test('no intersection cannot fake solved C3 analytic M0/M3/M5 source',()=>{
 const source=input();source.yCylinder.xCenter=50;
 const t=transforms();
 assert.throws(()=>compileFiniteCylinderEndpointV5({
  input:source,revision:5,sheetTransform:t.V,viewTransforms:t,
  includeWAnalyticCurveGuides:true,wRayPartitionedV5:true
 }),/proof unavailable/);
});
