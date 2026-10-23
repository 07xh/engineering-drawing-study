'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {newProject,createCoordinator,importProject,exportProject}=
 require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession,confirmedCompositionGeometry,prismMesh}=
 require('../../project/unified-workbench-session.cjs');
const point=(id,x,y,z)=>({id,kind:'point',space:'model-3d',unit:'mm',data:{x,y,z}});
function start(){
 const coordinator=createCoordinator(newProject({id:'MultiProject',task:'composition'}));
 const session=createUnifiedProjectSession();coordinator.attachSolver(session);
 return {coordinator,session};
}
function add(c,g,confirmed=true){
 const spatial=g.space==='model-3d';
 c.putObject({id:g.id,kind:g.kind==='point'?'point':g.kind==='mesh'?'solid':'edge',
  spatialId:spatial?g.id+'_3D':null,projections:{
   V:spatial?[g.id+'_V']:[],H:spatial?[g.id+'_H']:[],W:spatial?[g.id+'_W']:[]}});
 c.putCondition({id:'geo_'+g.id,objectId:g.id,sourceCandidateId:null,
  confirmed:false,value:{type:'manual-geometry',unit:'mm',imageId:c.snapshot().source.imageId,geometry:g}});
 if(confirmed)c.confirmCondition('geo_'+g.id);
}
test('confirmed mixed multi-object scene keeps IDs and geometric projection without fake M3/V5',()=>{
 const {coordinator:c,session:s}=start();
 add(c,point('A',2,3,4));
 add(c,{id:'B',kind:'circle',space:'drawing-2d',unit:'mm',
  data:{center:{x:5,y:6},radius:7}});
 const prism=prismMesh({solid:{min:{x:0,y:0,z:0},max:{x:10,y:15,z:20}}});
 add(c,{...prism,id:'C'});
 const output=s.solve();
 assert.equal(output.status,'confirmed-input-only');
 assert.equal(output.verified,false);
 assert.equal(output.clock,null);
 assert.equal(output.plan,null);
 assert.equal(c.canExport(),false);
 assert.deepEqual(output.scene.objects.map(x=>x.id),['A','B','C']);
 assert.deepEqual(output.scene.objects[0].representations.V.at,{u:2,v:4});
 assert.equal(output.scene.objects[1].representations['3D'],null);
 assert.equal(output.scene.objects[2].representations.H.edges.length,12);
 assert.equal(Object.isFrozen(output.scene.objects[2].model.data),true);
 c.selectObject('B');assert.equal(c.snapshot().view.selectedObjectId,'B');
 const rev=c.snapshot().revision;
 c.setCamera({yaw:30,pitch:20});
 assert.equal(c.snapshot().revision,rev);
 assert.equal(s.readSnapshot(),output);
 const restored=createCoordinator(importProject(exportProject(c.snapshot())));
 assert.equal(restored.snapshot().conditions.length,3);
 assert.equal(restored.currentResult(),null);
 assert.equal(restored.canExport(),false);
 restored.dispose();c.dispose();
});
test('unconfirmed, missing, swapped and stale-image sources cannot become geometry evidence',()=>{
 const {coordinator:c,session:s}=start();
 add(c,point('A',1,2,3),false);
 assert.throws(()=>s.solve(),/确认/);
 c.confirmCondition('geo_A');s.solve();
 c.putCondition({id:'geo_A',objectId:'A',sourceCandidateId:null,confirmed:true,
  value:{type:'manual-geometry',unit:'mm',imageId:null,
   geometry:point('A',8,9,10)}});
 assert.throws(()=>s.solve(),/确认/);
 c.confirmCondition('geo_A');s.solve();
 c.setImage('NewImage');
 assert.throws(()=>s.solve(),/确认/);
 assert.equal(c.canExport(),false);
 c.dispose();
});
test('editing or deleting any object revokes all former scene snapshots and restores no verification',()=>{
 const {coordinator:c,session:s}=start();
 add(c,point('A',1,2,3));
 add(c,point('B',4,5,6));
 const first=s.solve(),oldRev=c.snapshot().revision;
 c.putCondition({id:'geo_B',objectId:'B',sourceCandidateId:null,confirmed:true,
  value:{type:'manual-geometry',unit:'mm',imageId:null,geometry:point('B',7,8,9)}});
 assert.ok(c.snapshot().revision>oldRev);
 assert.equal(s.readSnapshot(),null);
 assert.throws(()=>s.solve(),/确认/);
 c.confirmCondition('geo_B');s.solve();
 c.deleteObject('A');
 assert.equal(s.readSnapshot(),null);
 assert.equal(c.snapshot().conditions.length,1);
 assert.deepEqual(confirmedCompositionGeometry({...c.snapshot(),
  projectId:c.snapshot().id}).map(x=>x.id),['B']);
 assert.equal(first.verified,false);
 c.dispose();
});
test('geometry input must have unique matching IDs, mm and bounded known representations',()=>{
 const {coordinator:c,session:s}=start();
 add(c,point('A',1,2,3));
 const x=c.snapshot(),v={...x,conditions:x.conditions.map(c=>({
  ...c,value:{...c.value,geometry:{...c.value.geometry,id:'Wrong'}}}))};
 assert.throws(()=>confirmedCompositionGeometry(v),/身份/);
 const unknown={...x,conditions:x.conditions.map(c=>({
  ...c,value:{...c.value,unit:'px'}}))};
 assert.throws(()=>confirmedCompositionGeometry(unknown),/人工核对/);
 assert.throws(()=>confirmedCompositionGeometry({...x,conditions:[]}),/逐项/);
 c.dispose();
});
