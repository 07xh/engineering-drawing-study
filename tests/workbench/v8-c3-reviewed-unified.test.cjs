'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {KEYS,makeReviewedC3Input,c3SheetTransforms}=
 require('../../project/c3-reviewed-input.cjs');
const {newProject,createCoordinator,importProject,exportProject}=
 require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const dimensions={zRadius:10,zX:0,zY:0,zMin:-12,zMax:12,
 yRadius:6,yX:0,yZ:0,yMin:-12,yMax:12};
function fixture(){
 const coordinator=createCoordinator(newProject({id:'ReviewedC3Demo',task:'c3-intersection'}));
 const session=createUnifiedProjectSession();
 coordinator.attachSolver(session);
 coordinator.putObject({id:'C3Intersection',kind:'solid',spatialId:'C3Intersection_3D',
  projections:{V:['C3Intersection_V'],H:['C3Intersection_H'],W:['C3Intersection_W']}});
 coordinator.putCondition({id:'coords',objectId:'C3Intersection',
  sourceCandidateId:null,confirmed:false,value:{type:'reviewed-c3-finite-cylinders',
   unit:'mm',dimensions:{...dimensions},axesConfirmed:true,capsConfirmed:true,
   imageId:null}});
 return {coordinator,session};
}
test('C3 source input requires ten bounded, nondegenerate real mm values',()=>{
 assert.equal(KEYS.length,10);
 const source=makeReviewedC3Input(dimensions);
 assert.deepEqual(Object.keys(source).sort(),['kind','sourceConfirmed','unit','yCylinder','zCylinder'].sort());
 assert.equal(source.zCylinder.radius,10);
 assert.equal(source.yCylinder.radius,6);
 const t=c3SheetTransforms(source);
 assert.deepEqual(Object.keys(t).sort(),['H','V','W']);
 assert.ok(t.V.scale>0&&t.V.scale<=4);
 for(const bad of [
  {...dimensions,zRadius:0},{...dimensions,yRadius:-1},
  {...dimensions,zMin:12,zMax:-12},{...dimensions,yMin:12},
  {...dimensions,zX:NaN},{...dimensions,zRadius:Infinity},
  {...dimensions,zRadius:100001},{...dimensions,extra:2}
 ])assert.throws(()=>makeReviewedC3Input(bad));
});
test('C3 unified task reuses official finite analytic M3 and original V5, fails closed',()=>{
 const {coordinator,session}=fixture();
 assert.throws(()=>session.solve(),/确认/);
 coordinator.confirmCondition('coords');
 const result=session.solve();
 assert.equal(result.kind,'c3-reviewed-preview');
 assert.equal(result.verified,false);
 assert.equal(result.status,'geometry-only');
 assert.equal(result.evidence.mathematicalSourceVerified,true);
 assert.equal(result.evidence.singleOriginalV5Player,true);
 assert.equal(result.evidence.sourceM3.branchCount,4);
 assert.ok(result.evidence.signedEndpointPointActionCount>0);
 assert.ok(result.evidence.signedInteriorAuxiliaryPointActionCount>0);
 assert.equal(result.evidence.entireCurveV5Ready,false);
 assert.equal(result.evidence.canExportCertifiedDrawing,false);
 assert.equal(result.evidence.standardVisibleHiddenLineStylesVerified,false);
 assert.equal(result.plan.canPromoteToVerifiedResult,false);
 assert.equal(result.clock,result.evidence.player);
 assert.equal(result.clock.canRender(coordinator.snapshot().revision),true);
 assert.equal(result.scene.schema,'draftai-geometry-scene-views/1.0.0');
 assert.equal(result.scene.revision,coordinator.snapshot().revision);
 assert.ok(result.plan.steps.length>0);
 assert.equal(coordinator.canExport(),false);
 assert.equal(coordinator.currentResult(),null);
 const restored=importProject(exportProject(coordinator.snapshot()));
 assert.equal(restored.task,'c3-intersection');
 assert.equal(restored.conditions[0].value.dimensions.zRadius,10);
 const oldRevision=coordinator.snapshot().revision;
 coordinator.setCamera({yaw:33});
 assert.equal(coordinator.snapshot().revision,oldRevision);
 coordinator.deleteCondition('coords');
 assert.equal(session.readSnapshot(),null);
 assert.equal(result.clock.canRender(coordinator.snapshot().revision),false);
 coordinator.dispose();
});
test('C3 revision scope, source image and cap confirmation cannot be bypassed',()=>{
 const {coordinator,session}=fixture();
 coordinator.confirmCondition('coords');
 coordinator.setImage('NewSourceImage');
 assert.throws(()=>session.solve(),/确认|原图/);
 coordinator.dispose();
 const second=fixture();
 const condition=second.coordinator.snapshot().conditions[0];
 second.coordinator.putCondition({...condition,
  value:{...condition.value,capsConfirmed:false}});
 second.coordinator.confirmCondition('coords');
 assert.throws(()=>second.session.solve(),/端盖/);
 second.coordinator.dispose();
});
