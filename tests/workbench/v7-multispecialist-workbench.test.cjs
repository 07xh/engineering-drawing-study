'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {newProject,createCoordinator,importProject,exportProject}=
 require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession,prismMesh}=
 require('../../project/unified-workbench-session.cjs');
const {homeHTML}=require('../../ui-next/home.cjs');
const seg=(a,b)=>[a,b];
const object=(task)=>{
 if(task==='planar')return {id:'Fillet1',kind:'edge',spatialId:null,
   projections:{V:[],H:[],W:[]}};
 return {id:'Solid1',kind:'solid',spatialId:'Solid1_3D',
  projections:{V:['Solid1_V'],H:['Solid1_H'],W:['Solid1_W']}};
};
const planar={
 type:'segment-fillet',unit:'mm',
 first:seg([-20,0],[20,0]),second:seg([0,-20],[0,20]),
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward',imageId:null
};
const prism={type:'prism-section',unit:'mm',size:[10,10,10],
 planePoint:[0,0,12],planeNormal:[1,1,1],imageId:null};
function start(task,value){
 const coordinator=createCoordinator(newProject({id:'V7Project',task}));
 const session=createUnifiedProjectSession();
 coordinator.attachSolver(session);
 coordinator.putObject(object(task));
 coordinator.putCondition({id:'coords',objectId:object(task).id,
  sourceCandidateId:null,confirmed:false,value});
 return {coordinator,session};
}
test('planar inputs use existing 02 M3 canonical intent and the same V5 clock',()=>{
 const {coordinator:c,session:s}=start('planar',planar);
 assert.throws(()=>s.solve(),/确认/);
 c.confirmCondition('coords');
 const r=s.solve();
 assert.equal(r.kind,'planar-fillet');
 assert.equal(r.verified,true);
 assert.equal(r.plan.unifiedMathPipeline,'m3-canonical-intent-v5/1');
 assert.equal(r.plan.mathematicallyVerified,true);
 assert.equal(r.plan.selectedBranchId,planar.branchId);
 assert.equal(r.clock.canRender(c.snapshot().revision),true);
 assert.ok(r.plan.constructionIntents.length>0);
 assert.deepEqual(r.scene.objects.map(x=>x.kind),['segment','segment','arc']);
 assert.equal(r.scene.objects[2].representations['3D'],null,
  'pure planar must not invent a solid');
 assert.equal(c.canExport(),true);
 const version=c.snapshot().revision;
 const persistedBefore=exportProject(c.snapshot());
 c.selectSceneGeometry('Given1');
 assert.equal(c.selectedGeometryId(),'Given1');
 assert.equal(exportProject(c.snapshot()),persistedBefore,
  'derived object selection must not alter the local project file');
 assert.equal(c.snapshot().revision,version);
 assert.equal(c.canExport(),true);
 assert.equal(c.snapshot().view.selectedObjectId,null,
  'math-derived selection must not leak into persisted project state');
 assert.throws(()=>c.selectSceneGeometry('ForgedGeometry'),/不属于/);
 c.setCamera({yaw:46});
 assert.equal(c.currentResult(),r);
 c.putCondition({id:'coords',objectId:'Fillet1',sourceCandidateId:null,
  confirmed:true,value:{...planar,filletRadius:12}});
 assert.equal(c.currentResult(),null);
 assert.equal(c.selectedGeometryId(),null,'stale derived selection must be revoked');
 assert.equal(r.clock.canRender(c.snapshot().revision),false);
 assert.throws(()=>s.solve(),/确认/);
 c.dispose();
});
test('finite prism uses existing spatial M3 scoped evidence without falsely certifying V5',()=>{
 const {coordinator:c,session:s}=start('exploration',prism);
 assert.throws(()=>s.solve(),/确认/);
 c.confirmCondition('coords');
 const r=s.solve(),rev=c.snapshot().revision;
 assert.equal(r.kind,'prism-evidence');
 assert.equal(r.status,'geometry-only');
 assert.equal(r.verified,false);
 assert.equal(r.evidence.geometryVerifiedWithinSpecialistScope,true);
 assert.equal(r.evidence.mathematicallyVerified,false);
 assert.equal(r.evidence.v5Ready,false);
 assert.ok(r.clock,'the SAME existing V5 player is now available for preview only');
 assert.equal(r.plan.status,'preview-only');
 assert.equal(r.plan.revision,rev);
 assert.equal(r.plan.canPromoteToVerifiedResult,false);
 assert.equal(r.plan.visibilityVerified,false);
 assert.equal(r.clock.canRender(rev),true);
 assert.equal(r.clock.canRender(rev+1),false);
 assert.deepEqual(r.plan.timing.steps.map(s=>s.id),
  r.plan.steps.map(s=>s.id));
 assert.ok(r.plan.givens.length>0);
 assert.equal(r.evidence.v5Ready,false,
  'preview playback is not the coordinator approved engineering answer');
 assert.equal(c.currentResult(),null);
 assert.equal(c.canExport(),false,
  'scoped 3D V5 must never authorize the verified/export path');
 const playback=r.clock.seekProgress(1,performance.now());
 assert.equal(playback.done,true);
 assert.ok(r.plan.steps.filter(s=>s.role==='result').length>=3);
 assert.equal(r.scene.objects[0].kind,'mesh');
 assert.equal(r.scene.objects.length,2);
 const perimeter=r.scene.objects[1];
 assert.equal(perimeter.id,'Section1');
 assert.equal(perimeter.kind,'polyline');
 assert.equal(perimeter.model.data.closed,true);
 assert.ok(perimeter.model.data.points.length>=3&&
  perimeter.model.data.points.length<=6);
 assert.equal(perimeter.model.data.points.length,
  perimeter.representations.V.spans.length);
 assert.equal(r.evidence.sectionPerimeterGeometry?.id,'Section1');
 assert.equal(r.scene.evidence.v5,'requires-verified-construction-intent');
 assert.equal(perimeter.representations.V.visibility,'undetermined');
 assert.equal(perimeter.representations.H.visibility,'undetermined');
 for(const p of perimeter.model.data.points){
  // Independent original plane residual, not solver-reported maxResidual.
  const plane=[1,1,1],origin=[0,0,12];
  const residual=plane.reduce((sum,k,i)=>sum+k*([p.x,p.y,p.z][i]-origin[i]),0)/
   Math.sqrt(3);
  assert.ok(Math.abs(residual)<1e-6);
 }
 for(const view of ['V','H','W']){
  const r2=perimeter.representations[view];
  assert.equal(r2.kind,'polyline-projection');
  assert.ok(r2.spans.every(e=>e.projection.kind==='segment'||e.projection.kind==='point'));
 }
 assert.equal(r.scene.objects[0].representations.V.edges.length,12);
 assert.equal(r.scene.objects[0].representations.H.visibility,'undetermined');
 assert.equal(r.scene.objects[0].representations.W.visibility,'undetermined');
 assert.equal(r.scene.objects[0].model.data.edges.length,12);
 c.selectRepresentation('3D','Solid1_3D');
 assert.equal(c.snapshot().view.selectedObjectId,'Solid1');
 c.setCamera({yaw:40,pitch:20});
 assert.equal(c.snapshot().revision,rev,'camera cannot re-run solver');
 assert.equal(s.readSnapshot(),r);
 const restored=createCoordinator(importProject(exportProject(c.snapshot())));
 assert.equal(restored.currentResult(),null);
 assert.equal(restored.canExport(),false);
 restored.dispose();c.dispose();
});
test('one local project can change mathematical task, with complete source and proof invalidation',()=>{
 const {coordinator:c,session:s}=start('planar',planar);
 c.confirmCondition('coords');s.solve();
 const r=c.currentResult(),previous=c.snapshot().revision;
 c.setImage('ImageA');
 assert.equal(c.currentResult(),null);
 assert.equal(r.clock.canRender(c.snapshot().revision),false);
 c.setTask('exploration');
 assert.equal(c.snapshot().task,'exploration');
 assert.deepEqual(c.snapshot().conditions,[]);
 assert.deepEqual(c.snapshot().objects,[]);
 assert.equal(c.snapshot().source.imageId,'ImageA','original image stays in same project');
 assert.ok(c.snapshot().revision>previous);
 assert.equal(c.canExport(),false);
 assert.throws(()=>s.solve());
 c.dispose();
});
test('spatial mesh generation preserves original mathematical points and independent first-angle projections',()=>{
 const given={kind:'rectangular-prism',solid:{
  min:{x:0,y:0,z:0},max:{x:4,y:6,z:8}}};
 const before=JSON.stringify(given),mesh=prismMesh(given);
 assert.equal(JSON.stringify(given),before);
 assert.equal(Object.keys(mesh.data.points).length,8);
 assert.equal(mesh.data.edges.length,12);
 assert.equal(mesh.data.faces.length,6);
 assert.equal(mesh.data.points.V111.z,8);
});
test('single homepage contains both real specialist scopes but no alternative nested player',()=>{
 const html=homeHTML();
 for(const id of ['v7-task','v7-f-radius','v7-f-branch','v7-f-direction',
   'v7-stage-other','v7-confirm-other','v7-solve-other','v7-p-width',
   'v7-p-pz','v7-p-nx','v7-sheet','v7-3d','v7-step-list'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.equal((html.match(/id="v7-sheet"/g)||[]).length,1);
 assert.equal((html.match(/id="v7-play"/g)||[]).length,1);
});

test('scoped section perimeter is selectable in all projections without promoting V5 proof',()=>{
 const {coordinator:c,session:s}=start('exploration',prism);
 c.confirmCondition('coords');
 const r=s.solve();
 const perimeter=r.scene.objects.find(o=>o.id==='Section1');
 assert.ok(perimeter,'M3 must provide independently audited section perimeter');
 assert.equal(perimeter.kind,'polyline');
 const revision=c.snapshot().revision;
 c.selectSceneGeometry('Section1');
 assert.equal(c.selectedGeometryId(),'Section1');
 assert.equal(c.snapshot().revision,revision);
 assert.equal(c.canExport(),false);
 c.setCamera({yaw:61});
 assert.equal(c.selectedGeometryId(),'Section1');
 assert.equal(s.readSnapshot(),r);
 c.setImage('FreshImage');
 assert.equal(c.selectedGeometryId(),null);
 assert.throws(()=>c.selectSceneGeometry('Section1'),/不属于/);
 c.dispose();
});

test('explicitly reviewed retained halfspace binds scoped first-angle open-edge ray proof to SAME V5 actions',()=>{
 const {coordinator:c,session:s}=start('exploration',
  {...prism,retainedHalfspace:'negative'});
 c.confirmCondition('coords');
 const result=s.solve(),rev=c.snapshot().revision;
 const ray=result.evidence.sectionVisibilityEvidence;
 const bindings=result.evidence.sectionEvidenceV5Bindings;
 assert.equal(ray.status,'open-edge-ray-only');
 assert.equal(ray.revision,rev);
 assert.equal(ray.openEdgeEvidenceAvailable,true);
 assert.equal(bindings.status,'preview-evidence-only');
 assert.equal(bindings.bindingCount,
  result.evidence.sectionPerimeterGeometry.data.points.length*3);
 assert.equal(bindings.revision,rev);
 assert.ok(bindings.bindings.every(b=>
  b.projectedFullStrokeVisibility==='undetermined'&&
  b.endpointsVisibilityVerified===false&&b.officialHiddenLineStyleVerified===false));
 assert.equal(result.clock.canRender(rev),true);
 assert.equal(result.verified,false);
 assert.equal(c.canExport(),false,'ray interiors never certify full drawing');
 const selected=c.snapshot().conditions.find(x=>x.id==='coords').value;
 c.putCondition({id:'coords',objectId:'Solid1',sourceCandidateId:null,
  confirmed:false,value:{...selected,retainedHalfspace:'positive'}});
 assert.equal(c.currentResult(),null);
 assert.equal(result.clock.canRender(c.snapshot().revision),false,
  'changing retained side revokes old scoped ray results and V5 revision');
 assert.throws(()=>s.solve(),/确认/);
 c.dispose();
});
test('forged retained-material mode is rejected before specialist M3 ray proof',()=>{
 const {coordinator:c,session:s}=start('exploration',
  {...prism,retainedHalfspace:'visible'});
 c.confirmCondition('coords');
 assert.throws(()=>s.solve(),/保留材料侧/);
 c.dispose();
});
