'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildReviewedC2Boxes}=require('../../project/c2-reviewed-two-boxes.cjs');
const {newProject,createCoordinator,importProject,exportProject}=
 require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const boxes=[{min:[0,0,0],max:[20,20,10]},
 {min:[5,5,10],max:[15,15,20]}];
test('two C2 boxes are bound to the original validated mesh and project identities',()=>{
 const prepared=buildReviewedC2Boxes(boxes);
 assert.deepEqual(prepared.map(x=>x.id),['C2BoxA','C2BoxB']);
 for(const box of prepared){
  assert.equal(box.geometry.kind,'mesh');
  assert.equal(box.geometry.space,'model-3d');
  assert.equal(box.geometry.unit,'mm');
  assert.equal(box.geometry.data.edges.length,12);
  assert.equal(box.geometry.data.faces.length,6);
  assert.equal(box.model.id,box.geometry.id);
 }
 for(const malformed of [
  null,[],[boxes[0]],[boxes[0],boxes[0],boxes[0]],
  [boxes[0],{min:[0,0,0],max:[0,2,3]}],
  [boxes[0],{min:[0,0,0],max:[1,NaN,2]}],
  [boxes[0],{min:[0,0,0],max:[1,2,Infinity]}]
 ])assert.throws(()=>buildReviewedC2Boxes(malformed),/两个|有效|mm/);
});
test('C2 existing M0/M2/M5 geometry scene distinguishes local contact from full answer',()=>{
 const coord=createCoordinator(newProject({id:'C2ReviewedTwoBoxes',task:'composition'}));
 const session=createUnifiedProjectSession();coord.attachSolver(session);
 for(const box of buildReviewedC2Boxes(boxes)){
  coord.putObject(box.model);
  coord.putCondition({id:'geo_'+box.id,objectId:box.id,sourceCandidateId:null,
   value:{type:'manual-geometry',unit:'mm',imageId:null,geometry:box.geometry}});
 }
 assert.throws(()=>session.solve(),/确认|未|输入/);
 for(const box of buildReviewedC2Boxes(boxes))
  coord.confirmCondition('geo_'+box.id);
 const result=session.solve();
 assert.equal(result.kind,'composition-evidence');
 assert.equal(result.verified,false);
 assert.equal(result.clock,null);
 assert.equal(result.scene.objects.length,2);
 assert.equal(result.compositionContactEvidence.boxCount,2);
 assert.equal(result.compositionContactEvidence.pairCount,1);
 const rays=result.originalMultiBodyEdgeRays;
 assert.equal(rays.schema,'draftai-m5-multiconvex-original-whole-edge-union-rays/1');
 assert.equal(rays.componentCount,2);
 assert.equal(rays.originalSourceEdgeCount,24);
 assert.equal(rays.projectedEdgeRowCount,72);
 assert.equal(rays.rows.length,72);
 assert.equal(rays.sourceGeometryIds.length,2);
 assert.equal(rays.allBodiesM0ClosedConvexVerified,true);
 assert.equal(rays.allContinuousOriginalSourceRaysCheckedAgainstEveryComponent,true);
 assert.equal(rays.counts.clear+rays.counts.strictHidden+rays.counts.undetermined,
  rays.counts.physicalProjected);
 assert.equal(rays.projectedEdgeRowCount,rays.counts.physicalProjected+
  rays.counts.collapsed+rays.counts.ambiguousSourceDihedral+
  rays.counts.coplanarMeshSubdivision);
 assert.equal(rays.completedDrawingV5Authorized,false);
 assert.equal(rays.combinedC2EngineeringLineStylesCertified,false);
 assert.equal(rays.generatedIntersectionCurveEdgesCertified,false);
 assert.equal(rays.signedV5ActionCount,0);
 for(const row of rays.rows){
  assert.ok(['V','H','W'].includes(row.view));
  assert.ok(rays.sourceGeometryIds.includes(row.sourceGeometryId));
  assert.equal(row.revision,coord.snapshot().revision);
  assert.deepEqual(row.originalParameterRange,[0,1]);
  if(row.sourceIsOriginal3DPhysicalCrease){
   assert.equal(row.originalEntireSourceParameterRangeAudited,true);
   assert.equal(row.allOriginalComponentIdsAudited.length,2);
   assert.equal(row.finalProjectedJunctionAndLineStylesCertified,false);
   assert.equal(row.signedV5Action,false);
  }
 }
 assert.equal(coord.canExport(),false);
 assert.equal(coord.currentResult(),null);
 const copy=importProject(exportProject(coord.snapshot()));
 assert.equal(copy.conditions.filter(x=>x.confirmed).length,2);
 const prev=result;
 coord.deleteCondition('geo_C2BoxA');
 assert.equal(session.readSnapshot(),null);
 assert.notEqual(coord.snapshot().revision,prev.inputRevision);
 coord.dispose();
});
