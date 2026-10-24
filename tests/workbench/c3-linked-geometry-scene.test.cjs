'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {compileFiniteCylinderEndpointV5}=require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {buildC3LinkedGeometryScene}=require('../../workbench/c3-linked-geometry-scene.cjs');
const {compileGeometryScene}=require('../../project/geometry-scene-consumer.cjs');
const {project}=require('../../core/projection/conventions.js');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const transforms=()=>({
 V:{origin:{x:310,y:265},scale:4},
 H:{origin:{x:310,y:410},scale:4},
 W:{origin:{x:655,y:265},scale:4}
});
function build(source=input(),rev=3,n=2){
 const f=transforms();
 const compiled=compileFiniteCylinderEndpointV5({
  input:source,revision:rev,sheetTransform:f.V,viewTransforms:f,
  stationCountPerBranch:n,includeCapFacePairGuides:true
 });
 const linked=buildC3LinkedGeometryScene({
  input:source,revision:rev,compiled,viewTransforms:f});
 return {compiled,linked,f};
}
test('one C3 M3 solution and original V5 source drive canonical 3D + V/H/W Geometry Scene',()=>{
 const {compiled,linked}=build();
 assert.equal(linked.schema,'draftai-c3-3d-vhw-linked-scene/1');
 assert.equal(linked.revision,compiled.revision);
 assert.equal(linked.scene.viewMethod,'first-angle-orthographic');
 assert.equal(linked.scene.revision,linked.revision);
 assert.equal(linked.scene.objects.length,linked.spatialObjectCount);
 assert.equal(linked.links.length,linked.spatialObjectCount);
 assert.ok(linked.groups.some(g=>g.role.startsWith('interior-')));
 assert.equal(linked.groups.some(g=>g.role==='finite-cap-pair-auxiliary'),false,
  'default distant endcaps have no physical contact and must not fabricate 3D cap edges');
 for(const g of linked.groups){
  const sceneObject=linked.scene.objects.find(o=>o.id===g.geometryId);
  assert.ok(sceneObject);
  assert.equal(g.certifiedEngineeringStroke,false);
  assert.equal(sceneObject.space,'model-3d');
  for(const view of ['V','H','W']){
   assert.ok(sceneObject.representations[view]);
   const act=compiled.constructionSteps.flatMap(x=>x.actions).find(
    a=>a.id===g.v5ActionIds[view]);
   assert.ok(act,'real V5 action must exist for '+view);
  }
 }
 const rend=compileGeometryScene(linked.scene);
 assert.ok(rend.paper.some(x=>x.view==='V'));
 assert.ok(rend.paper.some(x=>x.view==='H'));
 assert.ok(rend.paper.some(x=>x.view==='W'));
 assert.ok(rend.spatial.length>0);
 assert.equal(rend.proof,'display-only');
 assert.equal(linked.entireCurveV5Ready,false);
 assert.equal(linked.analyticCurveInScene,false);
 assert.equal(linked.officialLineStylesVerified,false);
 assert.equal(linked.createsSecondPlayer,false);
});
test('true finite endcap clipping links complete 3D cap line to V/H/W real V5 line or collapsed point',()=>{
 const source=input();
 source.yCylinder.yMin=-6;source.yCylinder.yMax=6;
 const {compiled,linked}=build(source,10,1);
 const caps=linked.groups.filter(g=>g.role==='finite-cap-pair-auxiliary');
 assert.equal(caps.length,2);
 assert.equal(compiled.sourceCapFaceProjectionActionCount,6);
 for(const group of caps){
  const obj=linked.scene.objects.find(x=>x.id===group.geometryId);
  assert.equal(obj.kind,'segment');
  assert.equal(obj.representations.H.kind,'point',
   'cap parallel to H observer must be an actual collapsed projection');
  assert.equal(obj.representations.V.kind,'segment');
  assert.equal(obj.representations.W.kind,'segment');
  const acts=compiled.constructionSteps.flatMap(x=>x.actions);
  assert.equal(acts.find(x=>x.id===group.v5ActionIds.H).kind,'point');
  assert.equal(acts.find(x=>x.id===group.v5ActionIds.V).kind,'line');
  assert.equal(acts.find(x=>x.id===group.v5ActionIds.W).kind,'line');
 }
});
test('bounded first-angle scene projections are sourced from original 3D point, never invented curves',()=>{
 const {linked}=build(input(),6,1);
 for(const row of linked.scene.objects){
  if(row.kind==='point'){
   const xyz=row.model.data, views=project(xyz);
   for(const v of ['V','H','W'])
    assert.deepEqual(row.representations[v].at,views[v]);
  }else{
   assert.equal(row.kind,'segment');
   assert.ok(row.representations.V);
   assert.ok(row.representations.H);
   assert.ok(row.representations.W);
   assert.equal(row.representations['3D'].kind,'segment');
  }
 }
});
test('stale revisions, changed user geometry, forged sheets and V5 actions fail closed',()=>{
 const src=input(),{compiled,f}=build(src,8,2);
 const run=(overrides={})=>buildC3LinkedGeometryScene({
  input:src,revision:8,compiled,viewTransforms:f,...overrides});
 assert.throws(()=>run({revision:9}),/current real M3/);
 const edited=input();edited.yCylinder.radius=8;
 assert.throws(()=>run({input:edited}),/source M3 changed/);
 const shifted=transforms();shifted.W.origin.x+=1;
 assert.throws(()=>run({viewTransforms:shifted}),/source triple|point is not one real/);
 const fake={...compiled,bindings:compiled.bindings.map(x=>({...x}))};
 fake.bindings[0].point3D={x:1,y:2,z:3};
 assert.throws(()=>run({compiled:fake}),/point is not one real/);
 const fakeCap={...compiled,capFacePairGuides:compiled.capFacePairGuides.map(x=>({...x}))};
 if(fakeCap.capFacePairGuides.length){
  fakeCap.capFacePairGuides[0].originalSegment3D={from:{x:8,y:8,z:8},
   to:{x:9,y:9,z:9}};
  assert.throws(()=>run({compiled:fakeCap}),/cap source triple/);
 }
 const missing={...compiled,constructionSteps:[]};
 assert.throws(()=>run({compiled:missing}),/real M3 station/);
 compiled.player.invalidate(9,0);
 assert.throws(()=>run(),/current real M3/);
});
test('unsupported or empty intersection never becomes a canonical spatial scene',()=>{
 const bad=input();bad.yCylinder.xCenter=50;
 const f=transforms();
 assert.throws(()=>compileFiniteCylinderEndpointV5({
  input:bad,revision:2,stationCountPerBranch:1,
  sheetTransform:f.V,viewTransforms:f,includeCapFacePairGuides:true
 }),/proof unavailable/);
});
