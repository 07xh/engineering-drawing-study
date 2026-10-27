'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditReviewedM0ScenePartitions}=
 require('../../workbench/m0-reviewed-scene-continuous-partitions.cjs');
const {auditReviewedM0FaceRingJoins}=
 require('../../workbench/m0-reviewed-face-ring-join-consumer.cjs');
const {deriveReviewedProjectedVertexJoins}=
 require('../../workbench/reviewed-projected-vertex-joins.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
function cube(id,z0,z1){
 const p={A:{x:-1,y:-1,z:z0},B:{x:1,y:-1,z:z0},
  C:{x:1,y:1,z:z0},D:{x:-1,y:1,z:z0},
  E:{x:-1,y:-1,z:z1},F:{x:1,y:-1,z:z1},
  G:{x:1,y:1,z:z1},H:{x:-1,y:1,z:z1}};
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points:p,
  edges:[['A','B'],['B','C'],['C','D'],['D','A'],
   ['E','F'],['F','G'],['G','H'],['H','E'],
   ['A','E'],['B','F'],['C','G'],['D','H']],
  faces:[['A','D','C','B'],['E','F','G','H'],
   ['A','B','F','E'],['B','C','G','F'],
   ['C','D','H','G'],['D','A','E','H']]}};
}
function audit(geometry,revision=1){
 const sourcePartitions=auditReviewedM0ScenePartitions({geometry,revision});
 const projectedVertexJoins=deriveReviewedProjectedVertexJoins({geometry,revision});
 return auditReviewedM0FaceRingJoins({geometry,revision,
  sourcePartitions,projectedVertexJoins});
}
test('real model-3d face rings bind original edges, full clear rays and same 3D vertex joins',()=>{
 const r=audit([cube('Solid',0,2)]);
 assert.equal(r.status,'real-original-mesh-local-projected-rings');
 assert.equal(r.reviewedFaceViewCount,18);
 assert.ok(r.locallyCertifiedFaceRingCount>=3);
 for(const view of ['V','H','W']){
  const locallyProven=r.rings.filter(x=>x.view===view&&x.localProjectedTopologyVerified);
  assert.ok(locallyProven.length>=1,'real first-angle '+view+' front face ring');
  for(const ring of locallyProven){
   assert.equal(ring.joins.length,4);
   assert.equal(ring.physicalOriginalSourceEdgeIds.length,4);
   assert.ok(ring.physicalOriginalSourceEdgeIds.every(id=>id.startsWith('Solid::')));
   assert.ok(ring.joins.every(j=>j.localJoinVerified));
   assert.equal(ring.officialLineStylesVerified,false);
   assert.equal(ring.v5ActionAuthorized,false);
  }
 }
 assert.ok(r.rings.some(x=>x.status==='undetermined'),
  'edge-on or obscured projected face is never silently signed');
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.allProjectedSourceJoinsVerified,false);
 assert.equal(r.v5VerifiedExportReady,false);
});
test('two spatially separated boxes cannot mix different 3D vertex IDs sharing paper coordinates',()=>{
 const g=[cube('Low',0,2),cube('High',5,7)];
 const r=audit(g,6);
 assert.equal(r.reviewedFaceViewCount,36);
 assert.ok(r.locallyCertifiedFaceRingCount>0);
 assert.ok(r.rings.every(x=>x.sourceGeometryId==='Low'||x.sourceGeometryId==='High'));
 for(const x of r.rings)for(const j of x.joins){
  assert.match(j.sourceVertexId,/^Vertex[1-4]$/);
  assert.equal(j.completeSceneVerified,false);
 }
});
test('current M5 reviewed scene actually consumes M0 local 3D face ring proof',()=>{
 const geometry=[cube('Live',0,2)];
 const r=evaluateReviewedConvexMeshDepth({geometry,revision:9});
 assert.equal(r.m0ProjectedFaceRingJoins.status,'real-original-mesh-local-projected-rings');
 assert.ok(r.m0ProjectedFaceRingJoins.locallyCertifiedFaceRingCount>=3);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.m0ProjectedFaceRingJoins.v5VerifiedExportReady,false);
});
test('stale revision or changed geometry identity refuses a purported M0 ring',()=>{
 const geometry=[cube('Original',0,2)],revision=3;
 const sourcePartitions=auditReviewedM0ScenePartitions({geometry,revision});
 const projectedVertexJoins=deriveReviewedProjectedVertexJoins({geometry,revision});
 assert.equal(auditReviewedM0FaceRingJoins({
  geometry,revision:revision+1,sourcePartitions,projectedVertexJoins
 }).status,'not-covered');
 assert.equal(auditReviewedM0FaceRingJoins({
  geometry:[{...geometry[0],id:'Swapped'}],revision,
  sourcePartitions,projectedVertexJoins
 }).status,'not-covered');
});
test('fake source coordinate and missing genuine original ray evidence never produce certified rings',()=>{
 const geometry=[cube('Original',0,2)],revision=8;
 const real=auditReviewedM0ScenePartitions({geometry,revision});
 const rays=deriveReviewedProjectedVertexJoins({geometry,revision});
 const clone=structuredClone(real);
 clone.views.H.edges[0].fromProjectedModelMm.u+=.5;
 const result=auditReviewedM0FaceRingJoins({geometry,revision,
  sourcePartitions:clone,projectedVertexJoins:rays});
 assert.ok(result.rings.some(x=>x.reason==='original source/vertex provenance mismatch'));
 assert.equal(result.officialLineStylesVerified,false);
 assert.equal(result.v5VerifiedExportReady,false);
});
