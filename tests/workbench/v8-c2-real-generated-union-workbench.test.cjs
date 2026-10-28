'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildReviewedC2Boxes}=require('../../project/c2-reviewed-two-boxes.cjs');
const {newProject,createCoordinator}=require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
function mount(boxes){
 const coordinator=createCoordinator(newProject({
  id:'C2GeneratedBooleanDemo',task:'composition'
 }));
 const session=createUnifiedProjectSession();
 coordinator.attachSolver(session);
 for(const box of buildReviewedC2Boxes(boxes)){
  coordinator.putObject(box.model);
  coordinator.putCondition({id:'geo_'+box.id,objectId:box.id,
   sourceCandidateId:null,
   value:{type:'manual-geometry',unit:'mm',imageId:null,
    geometry:box.geometry}});
  coordinator.confirmCondition('geo_'+box.id);
 }
 return {coordinator,session};
}
const A={min:[0,0,0],max:[10,10,10]};
const overlapB={min:[5,5,5],max:[15,15,15]};
test('C2 actual overlapping cuboids: generated AND original 3D union sources are linked in live session',()=>{
 const {coordinator,session}=mount([A,overlapB]);
 const out=session.solve(),m=out.orthogonalBooleanFeatureAudit;
 assert.ok(m);
 assert.equal(out.kind,'composition-evidence');
 assert.equal(out.verified,false);
 assert.equal(out.clock,null);
 assert.equal(m.schema,'draftai-c2-workbench-original-plus-generated-union-evidence/1');
 assert.equal(m.revision,coordinator.snapshot().revision);
 assert.deepEqual(m.sourceGeometryIds,['C2BoxA','C2BoxB']);
 assert.equal(m.source.sourceEdgeCount,24);
 assert.equal(m.generated.segmentCount,6);
 assert.equal(m.generatedOpenSourceIntervalCount,6);
 assert.equal(m.generated.certifiedNewConcaveOpenCount,6);
 assert.equal(m.generated.buriedNewFaceIntersectionCount,0);
 assert.equal(m.physical.generatedSegmentCount,6);
 assert.ok(m.physical.sourceSegmentCount>0);
 assert.ok(m.physical.nodeCount>0);
 assert.ok(m.physical.sharedPhysicalNodeCount>0);
 assert.equal(m.physical.exactEndpointIncidenceVerified,true);
 assert.equal(m.directional.nodeCount,m.physical.nodeCount);
 assert.equal(m.directional.listedNodesDepthOrderVerified,true);
 assert.ok(m.physical.projectedAliases.some(x=>
  x.different3DPhysicalPoints&&
  x.mayJoinDrawingStrokesOnProjectionAlone===false));
 for(const line of m.generated.segments){
  assert.equal(line.positiveNewConcaveUnionOpenFeatureVerified,true);
  assert.equal(line.generatedByTwoSourceFacePlanes,true);
  assert.equal(line.originalSourceMeshEdgeId,null);
  assert.equal(line.officialEngineeringLineStyle,'undetermined');
  assert.equal(line.officialConstructionStepV5ActionAuthorized,false);
  for(const v of ['V','H','W']){
   const projected=project(line.source3DFrom)[v];
   const end=project(line.source3DTo)[v];
   assert.deepEqual(line.projected[v].from,projected);
   assert.deepEqual(line.projected[v].to,end);
  }
 }
 assert.equal(m.officialDrawingLineStylesVerified,false);
 assert.equal(m.completeV5DrawingAuthorized,false);
 assert.equal(m.physical.officialV5FeatureActionsSigned,0);
 assert.equal(m.directional.signedV5LineActions,0);
 assert.equal(out.originalMultiBodyEdgeRays.completedDrawingV5Authorized,false);
 assert.equal(coordinator.canExport(),false);
 coordinator.deleteCondition('geo_C2BoxA');
 assert.equal(session.readSnapshot(),null);
 coordinator.dispose();
});
test('C2 planar face contact has NO invented generated pairwise feature and remains unsigned',()=>{
 const {coordinator,session}=mount([
  A,{min:[10,0,0],max:[20,10,10]}
 ]);
 const out=session.solve(),m=out.orthogonalBooleanFeatureAudit;
 assert.ok(m);
 assert.equal(m.source.sourceEdgeCount,24);
 assert.equal(m.generated.segmentCount,0);
 assert.equal(m.generatedOpenSourceIntervalCount,0);
 assert.equal(m.physical.generatedSegmentCount,0);
 assert.ok(m.source.flatNoCreaseCount>0);
 assert.equal(m.completeV5DrawingAuthorized,false);
 assert.equal(coordinator.canExport(),false);
 coordinator.dispose();
});
