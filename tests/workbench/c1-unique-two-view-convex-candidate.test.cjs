'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {inferC1UniqueConvexGeometryCandidate,
 mergeCoplanarQuickHullTriangles,exactCoplanarOriginalVertices}=
 require('../../workbench/c1-unique-two-view-convex-candidate.cjs');
const {verifiedConvexMeshHalfspaces}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {reviewedSolidThirdView}=
 require('../../workbench/reviewed-multipoint-solid-third-view.cjs');
const pts=[
 {x:0,y:0,z:0},{x:2,y:1,z:0},
 {x:4,y:0,z:2},{x:6,y:3,z:1}
];
function views(points=pts){
 return {
  V:points.map(p=>project(p).V),
  H:points.map(p=>project(p).H).reverse()
 };
}
test('unlabelled two views uniquely recover all genuine 3D points and QuickHull topology',async()=>{
 const r=await inferC1UniqueConvexGeometryCandidate({views:views()});
 assert.equal(r.source2DVerticesMatchedWithoutManualIds,true);
 assert.equal(r.inferredOriginal3DPointCount,4);
 assert.equal(r.candidateTetrahedronTopologyDeductedFromFourExtremes,true);
 assert.equal(r.independentlyValidatedByCurrentM0,true);
 assert.equal(r.missingView,'W');
 assert.equal(r.reviewedSolidInputCandidate.vertices.length,4);
 assert.equal(r.candidateGeometry.data.faces.length,4);
 const p=Object.values(r.candidateGeometry.data.points);
 for(const x of pts)
  assert(p.some(y=>Math.hypot(x.x-y.x,x.y-y.y,x.z-y.z)<=1e-8));
 assert.equal(r.reviewedSolidInputCandidate.confirmedBy,
  'unconfirmed-automatic-reconstruction');
 assert.throws(()=>reviewedSolidThirdView(r.reviewedSolidInputCandidate));
 assert.equal(r.realTextbookBlindTestPassed,false);
});
test('two-view unlabeled correspondence is order-independent',async()=>{
 const v=views();
 v.V.reverse();
 const out=await inferC1UniqueConvexGeometryCandidate({
  views:v,revision:3
 });
 assert.equal(out.inferredOriginal3DPointCount,4);
 assert.equal(out.revision,3);
});
test('repeated shared projection X cannot be silently guessed into 3D IDs',async()=>{
 const p=pts.map(x=>({...x}));p[1].x=p[0].x;
 await assert.rejects(()=>inferC1UniqueConvexGeometryCandidate({
  views:views(p)
 }),/ambiguous|duplicate\/collapsed/);
});
test('2D missing source vertex is not a unique 3D body',async()=>{
 const v=views();v.H.pop();
 await assert.rejects(()=>inferC1UniqueConvexGeometryCandidate({
  views:v
 }),/different source vertex counts|independently detected view vertices/);
});
test('no automatic acceptance of unknown/non-convex source assumptions',async()=>{
 await assert.rejects(()=>inferC1UniqueConvexGeometryCandidate({
  views:views(),assumedScope:'all-nonconvex-shapes-just-from-two-pictures'
 }),/explicit bounded convex candidate assumptions/);
});

const pyramidPoints={
 A:{x:0,y:0,z:0},B:{x:2,y:0,z:0},
 C:{x:4,y:2,z:0},D:{x:1,y:3,z:0},E:{x:3,y:1,z:4}
};
const pyramidTriangles=[
 ['A','D','C'],['A','C','B'],
 ['A','B','E'],['B','C','E'],['C','D','E'],['D','A','E']
];
test('coplanar QuickHull base diagonals are not original physical C1 edges',()=>{
 const faces=mergeCoplanarQuickHullTriangles(pyramidTriangles,pyramidPoints);
 assert.equal(faces.length,5);
 assert(faces.some(face=>face.length===4&&
  ['A','B','C','D'].every(id=>face.includes(id))));
 const edges=[...new Set(faces.flatMap(face=>face.map((id,i)=>
  [id,face[(i+1)%face.length]].sort().join('|'))))]
  .map(key=>key.split('|'));
 assert.equal(edges.length,8);
 assert(!edges.some(e=>e.join('|')==='A|C'));
 const m0=verifiedConvexMeshHalfspaces({
  id:'PyramidOriginal',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points:pyramidPoints,edges,faces}
 });
 assert.equal(m0.status,'validated-closed-convex-mesh');
 assert.equal(m0.sourceFaceCount,5);
 assert.equal(m0.sourceEdgeCount,8);
});
test('exact 3D coplanarity refuses even a real sub-tolerance crease',()=>{
 assert.equal(exactCoplanarOriginalVertices(
  pyramidPoints.A,pyramidPoints.B,pyramidPoints.C,pyramidPoints.D),true);
 const perturbed={...pyramidPoints,D:{...pyramidPoints.D,z:1e-9}};
 assert.equal(exactCoplanarOriginalVertices(
  perturbed.A,perturbed.B,perturbed.C,perturbed.D),false);
 assert.equal(mergeCoplanarQuickHullTriangles(
  pyramidTriangles,perturbed).length,6);
});
test('coplanar face recovery is independent of QuickHull triangle ordering',()=>{
 const reversed=mergeCoplanarQuickHullTriangles(
  [...pyramidTriangles].reverse(),pyramidPoints);
 assert.equal(reversed.length,5);
 assert.equal(reversed.filter(face=>face.length===4).length,1);
});
