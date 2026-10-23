'use strict';
// Independent coordinate oracles across M3, shared Geometry Scene and the
// single V5 clock. Synthetic fixtures; not a blind textbook acceptance claim.
const test=require('node:test');
const assert=require('node:assert/strict');
const {newProject,createCoordinator}=require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession}=require('../../project/unified-workbench-session.cjs');
function run(xyz){
 const c=createCoordinator(newProject({id:'OraclePoint',task:'projection'}));
 const s=createUnifiedProjectSession();c.attachSolver(s);
 c.putObject({id:'Point1',kind:'point',spatialId:'Point1_3D',
  projections:{V:['Point1_V'],H:['Point1_H'],W:['Point1_W']}});
 c.putCondition({id:'coords',objectId:'Point1',sourceCandidateId:null,
  confirmed:false,value:{type:'point-xyz',unit:'mm',xyz,imageId:null}});
 assert.throws(()=>s.solve(),/确认/);
 c.confirmCondition('coords');
 return {c,s,r:s.solve()};
}
for(const xyz of [[15,10,12],[-7,4,-9],[2.5,-3.75,8.125]]){
 test('M3/V5 coordinate oracle for '+xyz.join(','),()=>{
  const {c,r}=run(xyz),[x,y,z]=xyz;
  assert.equal(r.status,'unique');
  assert.equal(r.verified,true);
  assert.deepEqual(r.point,{x,y,z});
  assert.ok(r.residualMm<=1e-7,'independent point residual');
  const scene=r.scene.objects.find(o=>o.id==='Point1');
  assert.ok(scene,'same stable object ID in Geometry Scene');
  assert.deepEqual(scene.representations.V.at,{u:x,v:z});
  assert.deepEqual(scene.representations.H.at,{u:x,v:y});
  assert.deepEqual(scene.representations.W.at,{u:y,v:z});
  assert.equal(r.plan.mathematicallyVerified,true);
  assert.equal(r.plan.canonicalVerified,true);
  assert.ok(r.plan.constructionIntents.length>0);
  assert.ok(r.plan.steps.length>0);
  assert.ok(r.clock.timeline.totalMs>0);
  assert.equal(r.clock.canRender(c.snapshot().revision),true);
  assert.equal(r.clock.snapshot().done,false);
  c.setCamera({yaw:27,pitch:14});
  assert.equal(c.currentResult(),r,'camera never re-solves');
  c.putCondition({id:'coords',objectId:'Point1',sourceCandidateId:null,
   confirmed:false,value:{type:'point-xyz',unit:'mm',xyz:[x+1,y,z],imageId:null}});
  assert.equal(c.currentResult(),null);
  assert.equal(r.clock.canRender(c.snapshot().revision),false);
  assert.equal(c.canExport(),false);
  c.dispose();
 });
}

// Known degenerate case: coincident first-angle guide endpoints are not
// drawable line segments. Preserve the regression without certifying V5.
test('origin point must not be falsely marked V5-ready',()=>{
 const c=createCoordinator(newProject({id:'OriginCase',task:'projection'}));
 const s=createUnifiedProjectSession();c.attachSolver(s);
 c.putObject({id:'Point1',kind:'point',spatialId:'Point1_3D',
  projections:{V:['Point1_V'],H:['Point1_H'],W:['Point1_W']}});
 c.putCondition({id:'coords',objectId:'Point1',sourceCandidateId:null,
  confirmed:false,value:{type:'point-xyz',unit:'mm',xyz:[0,0,0],imageId:null}});
 c.confirmCondition('coords');
 assert.throws(()=>s.solve(),/invalid construction segment/);
 assert.equal(c.canExport(),false);
 c.dispose();
});
