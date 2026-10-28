'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {reviewC2OrthogonalBooleanFeatures}=
 require('../../project/c2-orthogonal-boolean-feature-review.cjs');
const {buildC2GeneratedLinkedScene}=
 require('../../project/c2-generated-linked-scene.cjs');
const {compileGeometryScene}=
 require('../../project/geometry-scene-consumer.cjs');
const {project}=require('../../core/projection/conventions.js');
const P=(x,y,z)=>({x,y,z});
const box=(id,a,b)=>({...prismMesh({solid:{min:P(...a),max:P(...b)}}),id});
const A=()=>box('A',[0,0,0],[10,10,10]),B=()=>box('B',[5,5,5],[15,15,15]);
const review=(g,revision=19)=>reviewC2OrthogonalBooleanFeatures({geometry:g,revision});
const compile=(g,revision=19)=>buildC2GeneratedLinkedScene({
 geometry:g,revision,orthogonalBooleanFeatureAudit:review(g,revision)
});
test('six M5-proven new C2 3D edges have 3 orthographic source-stable aliases each',()=>{
 const geometry=[A(),B()],linked=compile(geometry),scene=linked.scene;
 assert.equal(linked.schema,'draftai-c2-novel-source-linked-scene/1');
 assert.equal(scene.revision,19);
 assert.equal(scene.objects.length,8);
 assert.equal(linked.generatedGeometryCount,6);
 assert.equal(linked.groups.length,6);
 assert.ok(Object.isFrozen(scene));
 assert.ok(linked.groups.every(g=>g.sourceGeometryIds.join(',')==='A,B'&&
  g.certifiedEngineeringStroke===false&&g.v5ActionAuthorized===false));
 const actual=review(geometry).generated.segments.filter(x=>
  x.positiveNewConcaveUnionOpenFeatureVerified);
 const presentation=compileGeometryScene(scene);
 for(const [i,g] of linked.groups.entries()){
  const obj=scene.objects.find(x=>x.id===g.geometryId);
  const physical=actual.find(x=>x.id===g.sourceFeatureId);
  assert.ok(physical&&obj);
  assert.deepEqual(obj.model.data.start,physical.source3DFrom);
  assert.deepEqual(obj.model.data.end,physical.source3DTo);
  assert.equal(obj.model.parentObjectId,undefined);
  const source=[...presentation.paper,...presentation.spatial].filter(x=>
   x.objectId===g.geometryId);
  assert.deepEqual(source.map(x=>x.view).sort(),['3D','H','V','W']);
  assert.equal(new Set(source.map(x=>x.sourceFeatureKey)).size,1);
  assert.deepEqual(source.map(x=>x.kind).sort(),['circle','line','line','line'].sort());
  for(const view of ['V','H','W']){
   const row=obj.representations[view],a=project(physical.source3DFrom)[view];
   assert.deepEqual(row.kind==='point'?row.at:row.start,a);
  }
 }
 assert.equal(presentation.proof,'display-only');
 assert.equal(linked.completeV5Authorized,false);
 assert.equal(linked.wholeDrawingLineStylesVerified,false);
});
test('third solid buries exactly corresponding generated source open spans',()=>{
 const C=box('C',[9,4,6],[11,6,8]);
 const linked=compile([A(),B(),C],20);
 assert.ok(linked.generatedGeometryCount>0);
 assert.ok(linked.generatedGeometryCount<
  review([A(),B(),C],20).generated.segmentCount);
 const sourceIds=new Set(linked.groups.map(x=>x.sourceFeatureId));
 assert.ok(review([A(),B(),C],20).generated.segments.filter(x=>
  x.positiveNewFeatureBuriedVerified).every(x=>!sourceIds.has(x.id)));
});
test('face touching, separate or identical reviewed solids produce no imaginary generated edges',()=>{
 for(const Bbox of [
  box('B',[10,0,0],[20,10,10]),
  box('B',[20,0,0],[30,10,10]),
  box('B',[0,0,0],[10,10,10])
 ]){
  const linked=compile([A(),Bbox]);
  assert.equal(linked.generatedGeometryCount,0);
  assert.equal(linked.scene.objects.length,2);
 }
});
test('reject changed source geometry, forged M5 flags and stale revisions; never issue V5',()=>{
 const geometry=[A(),B()],audit=review(geometry,15);
 const call=(g=geometry,m=audit,r=15)=>buildC2GeneratedLinkedScene({
  geometry:g,revision:r,orthogonalBooleanFeatureAudit:m});
 assert.throws(()=>call(geometry,audit,16),/修订|不一致/);
 const edited=[A(),box('B',[5,5,6],[15,15,15])];
 assert.throws(()=>call(edited,audit),/不一致/);
 assert.throws(()=>call(geometry,{...audit,completeV5DrawingAuthorized:true}),/可信/);
 assert.throws(()=>call(geometry,{...audit,generated:{
  ...audit.generated,segments:audit.generated.segments.slice(1)}}),/不一致/);
 assert.throws(()=>call([A(),A()]),/来源/);
});
