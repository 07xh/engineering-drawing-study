'use strict';
/**
 * Independent pinned-Three QuickHull integration: CI validate installs Three,
 * while the four workbench shards exercise the no-dependency exact merger.
 * These are original synthetic points, not textbook answer coordinates.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {inferC1UniqueConvexGeometryCandidate}=
 require('../../workbench/c1-unique-two-view-convex-candidate.cjs');
const {reviewedSolidThirdView}=
 require('../../workbench/reviewed-multipoint-solid-third-view.cjs');
const pyramid=[
 {x:0,y:0,z:0},{x:2,y:0,z:0},
 {x:4,y:2,z:0},{x:1,y:3,z:0},
 {x:3,y:1,z:4}
];
test('real Three QuickHull five-vertex pyramid yields 5 physical faces and 8 edges, not a triangulation diagonal',async()=>{
 const views={
  V:pyramid.map(p=>project(p).V),
  H:pyramid.map(p=>project(p).H).reverse()
 };
 const r=await inferC1UniqueConvexGeometryCandidate({
  views,geometryId:'SyntheticConvexPyramid',revision:7
 });
 assert.equal(r.inferredOriginal3DPointCount,5);
 assert.equal(r.candidateClosedConvexTopologyInferredByPinnedThreeQuickHull,true);
 assert.equal(r.independentlyValidatedByCurrentM0,true);
 assert.equal(r.missingView,'W');
 const {points,faces,edges}=r.candidateGeometry.data;
 assert.equal(Object.keys(points).length,5);
 assert.equal(faces.length,5);
 assert.equal(edges.length,8);
 assert.equal(faces.filter(face=>face.length===4).length,1);
 assert.equal(faces.filter(face=>face.length===3).length,4);
 assert.equal(r.reviewedSolidInputCandidate.confirmedBy,
  'unconfirmed-automatic-reconstruction');
 assert.equal(r.reviewedSolidInputCandidate.topologyConfirmed,false);
 assert.throws(()=>reviewedSolidThirdView(r.reviewedSolidInputCandidate));
 assert.equal(r.productionConstructionIntentAuthorized,false);
 assert.equal(r.signedV5ActionCount,0);
 assert.equal(r.realTextbookBlindTestPassed,false);
});
