'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {newProject,createCoordinator,exportProject,importProject}=
 require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession,verifiedPointFromInputs}=
 require('../../project/unified-workbench-session.cjs');
const {homeHTML}=require('../../ui-next/home.cjs');
function start(){
 const coord=createCoordinator(newProject({id:'ProjectTest',task:'projection'}));
 const session=createUnifiedProjectSession();
 coord.attachSolver(session);
 coord.putObject({id:'Point1',kind:'point',spatialId:'Point1_3D',
  projections:{V:['Point1_V'],H:['Point1_H'],W:['Point1_W']}});
 return {coord,session};
}
function condition(xyz=[15,10,12],imageId=null){
 return {id:'coords',objectId:'Point1',sourceCandidateId:null,
  confirmed:true,value:{type:'point-xyz',unit:'mm',xyz,imageId}};
}
test('V7 homepage is an operable on-page workbench, not only a decorative landing',()=>{
 const html=homeHTML();
 for(const id of ['project-workbench','v7-projects','v7-image-input','v7-stage',
  'v7-confirm','v7-solve','v7-sheet','v7-3d','v7-seek','v7-speed','v7-play',
  'v7-import','v7-export','v7-step-list'])
  assert.ok(html.includes('id="'+id+'"'),id+' missing');
 assert.match(html,/V7 · 同一份本机项目/);
 assert.match(html,/href="#project-workbench"/);
});
test('candidate remains untrusted until explicit review, then trusted 03 M3→V5 is reusable',()=>{
 const {coord,session}=start();
 coord.putCondition(condition());
 assert.equal(coord.snapshot().conditions[0].confirmed,false);
 assert.equal(coord.canExport(),false);
 assert.throws(()=>session.solve(),/确认/);
 coord.confirmCondition('coords');
 const result=session.solve();
 assert.equal(coord.currentResult(),result);
 assert.equal(coord.canExport(),true);
 assert.equal(result.verified,true);
 assert.equal(result.plan.canonicalVerified,true);
 assert.equal(result.plan.mathematicallyVerified,true);
 assert.equal(result.plan.unifiedMathPipeline,'m3-canonical-intent-v5/1');
 assert.ok(result.plan.steps.length>0);
 assert.equal(result.scene.revision,coord.snapshot().revision);
 const representations=result.scene.objects[0].representations;
 assert.deepEqual(representations.V.at,{u:15,v:12});
 assert.deepEqual(representations.H.at,{u:15,v:10});
 assert.deepEqual(representations.W.at,{u:10,v:12});
 assert.equal(result.links[0].representations['3D'].objectId,'Point1');
 assert.equal(result.clock.canRender(coord.snapshot().revision),true);
 coord.dispose();
});
test('photo changes, edits, undo and reload revoke all V5 and export authority',()=>{
 const {coord,session}=start();
 coord.putCondition(condition());
 coord.confirmCondition('coords');
 const r=session.solve(),oldRev=coord.snapshot().revision;
 coord.setCamera({yaw:55,pitch:20});
 coord.selectRepresentation('W','Point1_W');
 assert.equal(coord.snapshot().revision,oldRev);
 assert.equal(coord.currentResult(),r);
 coord.putCondition(condition([20,10,12]));
 assert.equal(coord.canExport(),false);
 assert.equal(r.clock.canRender(coord.snapshot().revision),false);
 assert.throws(()=>session.solve(),/确认/);
 coord.confirmCondition('coords');
 session.solve();
 coord.setImage('NewOriginal');
 assert.equal(coord.canExport(),false);
 assert.throws(()=>coord.confirmCondition('coords'),/旧图片/);
 const restored=createCoordinator(importProject(exportProject(coord.snapshot())));
 assert.equal(restored.currentResult(),null);
 assert.equal(restored.canExport(),false);
 restored.dispose();coord.dispose();
});
test('untrusted model units, fake candidate and unsupported task never become a verified session',()=>{
 assert.throws(()=>verifiedPointFromInputs({task:'projection',revision:1,
  source:{imageId:null},objects:[{id:'Point1'}],conditions:[
   {id:'coords',objectId:'Point1',confirmed:true,
    value:{type:'point-xyz',unit:'px',xyz:[1,2,3]}}
  ]}),/确认/);
 const {coord,session}=start();
 coord.putCondition(condition([Number.MAX_VALUE,10,12]));
 coord.confirmCondition('coords');
 assert.throws(()=>session.solve(),/确认/);
 assert.equal(coord.canExport(),false);
 coord.dispose();
});
test('canonical V5 time controls and selection are from one math session',()=>{
 const {coord,session}=start();
 coord.putCondition(condition([8,9,10]));
 coord.confirmCondition('coords');
 const result=session.solve();
 const clock=result.clock;
 const t=clock.timeline.totalMs;
 assert.ok(t>0);
 clock.seekProgress(.5,100);
 assert.ok(clock.snapshot().ratio>0);
 clock.setSpeed(2,100);
 clock.seekMs(t,100);
 assert.equal(clock.snapshot().done,true);
 coord.selectRepresentation('H','Point1_H');
 assert.equal(coord.snapshot().view.selectedObjectId,'Point1');
 assert.equal(coord.currentResult(),result);
 coord.dispose();
});
