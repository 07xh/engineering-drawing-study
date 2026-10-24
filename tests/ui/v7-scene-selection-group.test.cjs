'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {deriveGeometryScene,projectSelectionLinks}=
 require('../../core/projection/geometry-scene-views.cjs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {compileGeometryScene}=require('../../project/geometry-scene-consumer.cjs');
const {sceneSelectionGroup}=require('../../project/scene-selection-group.cjs');

const p=(x,y,z)=>({x,y,z});
function scene(revision=7){
 const box=prismMesh({solid:{min:p(0,0,0),max:p(10,12,14)}});
 const section={
  id:'Section1',kind:'polyline',space:'model-3d',unit:'mm',
  parentObjectId:'Solid1',
  data:{points:[p(0,0,5),p(10,0,5),p(10,12,5),p(0,12,5)],closed:true}
 };
 const independent={id:'IndependentPoint',kind:'point',space:'model-3d',
  unit:'mm',data:p(20,30,40)};
 const planar={id:'Given2D',kind:'segment',space:'drawing-2d',unit:'mm',
  data:{start:{x:1,y:2},end:{x:3,y:5}}};
 return deriveGeometryScene({
  geometry:[box,section,independent,planar],revision,
  resultId:'ManualGeometryEvidence'
 });
}

test('same canonical scene links parent and M3 derived geometry in V/H/W and 3D',()=>{
 const s=scene();
 const owner=sceneSelectionGroup(s,'Solid1',7);
 const derived=sceneSelectionGroup(s,'Section1',7);
 assert.deepEqual([...owner],['Solid1','Section1']);
 assert.deepEqual([...derived],[...owner]);
 assert.equal(Object.isFrozen(owner),true);
 const links=projectSelectionLinks(s);
 assert.equal(links.find(x=>x.objectId==='Section1').selectionObjectId,'Solid1');
 const rendered=compileGeometryScene(s);
 for(const view of ['V','H','W']){
  const matching=rendered.paper.filter(x=>x.objectId==='Section1'&&x.view===view);
  assert.ok(matching.length>0,'missing shared projection '+view);
  assert.ok(matching.every(x=>x.selectionObjectId==='Solid1'));
 }
 assert.ok(rendered.spatial.some(x=>
  x.objectId==='Section1'&&x.selectionObjectId==='Solid1'));
 assert.ok([...rendered.paper,...rendered.spatial]
  .filter(x=>owner.includes(x.objectId))
  .every(x=>x.objectId==='Solid1'||x.objectId==='Section1'));
 assert.equal(rendered.proof,'display-only');
});

test('selection cannot cross objects, model revisions or 2D-only/3D scene scope',()=>{
 const s=scene();
 assert.deepEqual([...sceneSelectionGroup(s,'Given2D',7)],['Given2D']);
 assert.deepEqual([...sceneSelectionGroup(s,'IndependentPoint',7)],['IndependentPoint']);
 for(const [id,revision] of [
  ['Solid1',8],['Section1',6],['GoneFromOldRevision',7],[null,7]
 ])assert.deepEqual([...sceneSelectionGroup(s,id,revision)],[]);
 assert.equal(s.objects.find(x=>x.id==='Given2D').representations['3D'],null);
 assert.ok(s.objects.find(x=>x.id==='Solid1').representations['3D']);
 assert.deepEqual([...sceneSelectionGroup(s,'Solid1',7)],['Solid1','Section1'],
  'camera and viewport changes cannot affect mathematical scene correspondence');
});
