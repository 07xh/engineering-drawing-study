'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseReviewedC1Rows,serializeReviewedC1Rows,IDS}=
 require('../../project/c1-reviewed-input.cjs');
const {prismMesh,createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const {newProject,createCoordinator,exportProject,importProject}=
 require('../../project/project-coordinator.cjs');
const {project}=require('../../core/projection/conventions.js');
function sample(pair='VH'){
 const p=prismMesh({solid:{min:{x:0,y:0,z:0},max:{x:30,y:15,z:20}}});
 return IDS.map(id=>{
  const views=project(p.data.points[id]);
  return [id,...[...pair].flatMap(v=>[views[v].u,views[v].v])].join(',');
 }).join('\n');
}
function mount(rows=sample(),pair='VH'){
 const coordinator=createCoordinator(newProject({id:'C1VerifiedInput',task:'c1-third-view'}));
 const session=createUnifiedProjectSession();
 coordinator.attachSolver(session);
 coordinator.putObject({id:'C1Solid',kind:'solid',spatialId:'C1Solid_3D',
  projections:{V:['C1Solid_V'],H:['C1Solid_H'],W:['C1Solid_W']}});
 coordinator.putCondition({id:'coords',objectId:'C1Solid',confirmed:false,
  sourceCandidateId:null,value:{type:'reviewed-c1-third-view',
   unit:'mm',pair,vertices:parseReviewedC1Rows(rows,pair),
   topologyConfirmed:true,imageId:null}});
 return {coordinator,session};
}
test('C1 manual two-view reviewer parses exactly eight original topology IDs',()=>{
 for(const pair of ['VH','VW','HW']){
  const rows=parseReviewedC1Rows(sample(pair),pair);
  assert.equal(rows.length,8);
  assert.deepEqual(rows.map(r=>r.id),IDS);
  assert.equal(serializeReviewedC1Rows(rows,pair),sample(pair));
 }
 assert.throws(()=>parseReviewedC1Rows('V000,0,0,0,0','VH'),/8 个/);
 assert.throws(()=>parseReviewedC1Rows(sample().replace('V001','V000'),'VH'),/编号/);
 assert.throws(()=>parseReviewedC1Rows(sample().replace('V000,0,0,0,0','V000,0,0,,0'),'VH'),/有限/);
 assert.throws(()=>parseReviewedC1Rows(sample(),'VX'),/视图/);
});
test('C1 unified session reuses canonical convex M3 and original V5, never full answer',()=>{
 const {coordinator,session}=mount();
 assert.throws(()=>session.solve(),/确认/);
 coordinator.confirmCondition('coords');
 const result=session.solve();
 assert.equal(result.kind,'c1-reviewed-preview');
 assert.equal(result.verified,false);
 assert.equal(result.evidence.sceneResult.provenVertexCount,8);
 assert.equal(result.evidence.sceneResult.provenEdgeCount,12);
 assert.equal(result.evidence.sceneResult.provenFaceCount,6);
 assert.equal(result.evidence.singleOriginalV5Player,true);
 assert.equal(result.evidence.wholeSolidV5Ready,false);
 assert.equal(result.evidence.completeDrawingExportAllowed,false);
 assert.equal(result.scopedProof.originalV5ReusablePlayer,result.evidence.player);
 assert.equal(result.scopedProof.originalV5Timeline,result.evidence.timeline);
 assert.equal(result.scopedProof.sourceGeometryId,result.evidence.sceneResult.geometry.id);
 assert.equal(result.scopedProof.revision,coordinator.snapshot().revision);
 assert.equal(result.scopedProof.fullGenericC1ImagesOrNonconvexVerified,false);
 assert.equal(result.scopedProof.realTextbookBlindTestPassed,false);
 assert.equal(result.plan.canPromoteToVerifiedResult,false);
 assert.equal(result.clock,result.evidence.player,'reuse single existing player');
 assert.equal(result.clock.canRender(coordinator.snapshot().revision),true);
 assert.ok(result.plan.steps.length>0);
 assert.equal(result.scene.schema,'draftai-geometry-scene-views/1.0.0');
 assert.equal(coordinator.canExport(),false);
 assert.equal(coordinator.currentResult(),null,'a partial C1 preview must not become certified result');
 const old=result.clock,oldRevision=coordinator.snapshot().revision;
 coordinator.setCamera({yaw:34});
 assert.equal(coordinator.snapshot().revision,oldRevision,'view changes do not change proof revision');
 coordinator.putCondition({id:'coords',objectId:'C1Solid',sourceCandidateId:null,
  value:{...coordinator.snapshot().conditions[0].value}});
 assert.equal(old.canRender(coordinator.snapshot().revision),false);
 assert.equal(session.readSnapshot(),null,'edits revoke old scene and player');
 const saved=importProject(exportProject(coordinator.snapshot()));
 assert.equal(saved.task,'c1-third-view');
 assert.equal(saved.conditions[0].confirmed,false);
 coordinator.dispose();
});
test('C1 cannot silently change to an untrusted wrong image or topology',()=>{
 const {coordinator,session}=mount();
 coordinator.confirmCondition('coords');
 coordinator.setImage('AnotherSourceImage');
 assert.throws(()=>session.solve(),/当前原图|确认/);
 coordinator.dispose();
 const {coordinator:unreviewed,session:other}=mount();
 const input=unreviewed.snapshot().conditions[0];
 unreviewed.putCondition({...input,value:{...input.value,topologyConfirmed:false}});
 unreviewed.confirmCondition('coords');
 assert.throws(()=>other.solve(),/拓扑/);
 unreviewed.dispose();
});

test('C1 real oblique convex eight-corner two-view input positively signs all original M5 ranges',()=>{
 const xyz={
  V000:{x:0,y:0,z:0},V100:{x:4,y:1,z:0},
  V110:{x:3,y:4,z:0},V010:{x:-1,y:3,z:0},
  V001:{x:1,y:-1,z:5},V101:{x:5,y:0,z:5},
  V111:{x:4,y:3,z:5},V011:{x:0,y:2,z:5}
 };
 for(const pair of ['VH','VW','HW']){
  const rows=IDS.map(id=>[id,...[...pair].flatMap(v=>{
   const p=project(xyz[id])[v];return [p.u,p.v];
  })].join(',')).join('\n');
  const {coordinator,session}=mount(rows,pair);
  coordinator.confirmCondition('coords');
  const result=session.solve(),proof=result.scopedProof;
  assert.equal(result.kind,'c1-reviewed-preview');
  assert.equal(proof.missingView,['V','H','W'].find(v=>!pair.includes(v)));
  assert.equal(proof.scopedSingleConvexFullyCertified,true,
   proof.missingObligations.join(','));
  assert.equal(proof.allOriginalPositivePhysicalSourceRangesAccounted,true);
  assert.equal(proof.allThreeViewsGlobalContourCertified,true);
  assert.ok(proof.signedV5ActionCount>0);
  assert.ok(proof.sourceCoverage.length>0);
  assert.ok(proof.sourceCoverage.every(x=>x.completeAndNonOverlapping));
  assert.match(proof.firstAngleOfficialThirdViewSvg,/<svg/);
  assert.equal(result.clock,proof.originalV5ReusablePlayer);
  assert.equal(result.verified,false,'not textbook-verified generalized answer');
  assert.equal(coordinator.canExport(),false,'generic export still blocked');
  coordinator.dispose();
 }
});
