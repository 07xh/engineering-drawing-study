'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const {auditOrthogonalUnionSourceEdges}=
 require('../../workbench/m5-orthogonal-union-source-edges.cjs');
const p=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const a=()=>box('A',p(0,0,0),p(10,10,10));
const audit=(geometry,revision=9)=>
 auditOrthogonalUnionSourceEdges({geometry,revision});
function edgeAt(report,id,axis,fixed){
 return report.edges.find(e=>e.sourceGeometryId===id&&e.axis===axis&&
  Object.entries(fixed).every(([k,v])=>e.originalSourceEdge3D.every(pt=>pt[k]===v)));
}
test('M5 full face-contact boxes: shared-plane original creases disappear into flat UNION face',()=>{
 const r=audit([a(),box('B',p(10,0,0),p(20,10,10))]);
 assert.equal(r.status,'source-orthogonal-union-open-sector-coverage');
 assert.equal(r.sourceEdgeCount,24);
 assert.equal(r.ambiguousCount,0);
 assert.ok(r.flatNoCreaseCount>=8);
 const seam=edgeAt(r,'A','y',{x:10,z:10});
 assert.ok(seam);
 assert.equal(seam.subintervals.length,1);
 assert.equal(seam.subintervals[0].status,'certified-flat-union-boundary-no-crease');
 assert.equal(seam.subintervals[0].occupiedQuadrantCount,2);
 assert.equal(seam.subintervals[0].positiveUnionExternalCreaseVerified,false);
 const exterior=edgeAt(r,'A','y',{x:0,z:10});
 assert.ok(exterior.subintervals.every(s=>
  s.status==='certified-convex-exterior-open-crease'));
 assert.equal(r.v5Ready,false);
 assert.equal(r.globalLineStylesVerified,false);
});
test('M5 partial face touch proves locally concave UNION creases newly exposed on B original edges',()=>{
 const geometry=[a(),box('B',p(10,2,2),p(16,8,8))];
 const r=audit(geometry,11);
 assert.ok(r.verifiedConcaveOpenCreaseCount>0);
 const seam=edgeAt(r,'B','z',{x:10,y:2});
 assert.ok(seam);
 assert.equal(seam.subintervals.length,1);
 const item=seam.subintervals[0];
 assert.equal(item.status,'certified-concave-exterior-open-crease');
 assert.equal(item.occupiedQuadrantCount,3);
 assert.equal(item.positiveUnionExternalCreaseVerified,true);
 assert.equal(item.originalCurveEndpointJunctionsVerified,false);
 assert.equal(item.projectedContourAndFullDepthVerified,false);
 assert.equal(item.canonicalV5LineActionAuthorized,false);
});
test('M5 positive-volume overlapping box can ENTIRELY bury original A source creases',()=>{
 const r=audit([a(),box('B',p(7,-1,-1),p(13,11,11))],13);
 const buried=edgeAt(r,'A','y',{x:10,z:10});
 assert.ok(buried);
 assert.equal(buried.subintervals[0].status,'certified-source-crease-buried-inside-union');
 assert.equal(buried.subintervals[0].occupiedQuadrantCount,4);
 assert.equal(buried.subintervals[0].positiveUnionBuriedOrFlatVerified,true);
 assert.ok(r.buriedSourceIntervalCount>0);
});
test('M5 a true edge-contact of two disjoint 3D interiors is NONMANIFOLD, never a certified feature join',()=>{
 const r=audit([a(),box('B',p(10,10,0),p(20,20,10))],14);
 const touching=edgeAt(r,'A','z',{x:10,y:10});
 assert.ok(touching);
 assert.equal(touching.subintervals[0].status,
  'undetermined-nonmanifold-quadrant-touch');
 assert.deepEqual(touching.subintervals[0].quadrantInsideSolidUnion,
  [true,false,false,true]);
 assert.equal(touching.subintervals[0].positiveUnionExternalCreaseVerified,false);
 assert.ok(r.ambiguousCount>0);
});
test('M5 axial events split original source line: two outer convex spans separated by a flat face-contact middle',()=>{
 const r=audit([a(),box('B',p(10,0,3),p(18,10,7))],15);
 const edge=edgeAt(r,'A','z',{x:10,y:0});
 assert.ok(edge);
 assert.deepEqual(edge.subintervals.map(x=>x.sourceParameterOpenRange),
  [[0,0.3],[0.3,0.7],[0.7,1]]);
 assert.deepEqual(edge.subintervals.map(x=>x.status),
  ['certified-convex-exterior-open-crease',
   'certified-flat-union-boundary-no-crease',
   'certified-convex-exterior-open-crease']);
 assert.ok(edge.subintervals.every(x=>!x.originalSourceEndpointJunctionsVerified));
 assert.equal(edge.completeFinalSourceFeatureVerified,false);
});
test('M5 no-contact bodies do not acquire fake union joins or style release',()=>{
 const r=audit([a(),box('B',p(30,0,0),p(40,10,10))],16);
 assert.equal(r.verifiedConvexOpenCreaseCount,24);
 assert.equal(r.flatNoCreaseCount,0);
 assert.equal(r.buriedSourceIntervalCount,0);
 assert.equal(r.ambiguousCount,0);
 assert.equal(r.v5Ready,false);
});
test('M5 invalid or stale sources fail closed and non-cuboid scope is not falsely generalized',()=>{
 assert.throws(()=>audit([a()],-1),/revision/);
 assert.throws(()=>audit([a(),a()],5),/duplicate/);
 const g=a();g.data.faces.pop();
 assert.equal(audit([g],5).status,'not-covered-non-cuboid');
 const tiny=box('B',p(10+1e-10,0,0),p(20,10,10));
 const near=audit([a(),tiny],17);
 assert.ok(near.ambiguousCount>0);
 assert.equal(near.v5Ready,false);
});
test('M5 actual per-action V5 gate excludes union-flat and fully buried original source-edge candidates',()=>{
 const geometry=[a(),box('B',p(10,0,3),p(18,10,7))],revision=20;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const gate=inspectFinalSourceStrokeObligations({
  geometry,revision,sceneDepthEvidence:scene});
 assert.equal(gate.status,'per-source-span-proof-obligations-audited');
 assert.equal(gate.sourceUnionFeatureEvidence.status,
  'source-orthogonal-union-open-sector-coverage');
 assert.equal(gate.signedCount,0);
 assert.equal(gate.v5Ready,false);
 assert.ok(gate.spans.length>0);
 assert.ok(gate.spans.every(x=>x.authorizedStyle==='undetermined'));
 assert.ok(gate.spans.every(x=>x.sourceUnionFeatureScope===
  'source-orthogonal-union-open-sector-coverage'));
 assert.ok(gate.spans.every(x=>!x.independentlyRecomputedSourceCrease.
  compositeUnionFeatureSemanticsVerified));
 for(const x of gate.spans){
  if(!x.sourceUnionBuriedOrFlatOpenIntervalVerified)continue;
  assert.equal(x.localPositiveOuterGeometryCandidate,false);
  assert.equal(x.hiddenDepthEvidenceCandidate,false);
  assert.ok(x.missingProofs.includes(
   'source-crease-proven-flat-or-buried-in-composite-union'));
  assert.equal(x.officialV5ActionReleaseApproved,false);
 }
 assert.ok(gate.spans.some(x=>x.extraM4UnionAxialEventsRequired||
  x.sourceUnionBuriedOrFlatOpenIntervalVerified));
});
