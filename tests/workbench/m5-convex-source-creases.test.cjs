'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditReviewedConvexSourceCreases}=
 require('../../workbench/m5-reviewed-convex-source-creases.cjs');
const {auditReviewedSolidWholeSourceEdges}=
 require('../../workbench/m5-reviewed-solid-source-edge-ledger.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const p=(x,y,z)=>({x,y,z});
const make=(id='A',min=p(0,0,0),max=p(20,12,9))=>
 ({...prismMesh({solid:{min,max}}),id});
function triangleSplitBox(){
 const mesh=make();
 const f=mesh.data.faces;
 const faceIndex=f.findIndex(face=>
  face.every(id=>mesh.data.points[id].z===9));
 assert.ok(faceIndex>=0);
 const original=f[faceIndex],a=original[0],b=original[1],
   c=original[2],d=original[3];
 const faces=f.filter((_,i)=>i!==faceIndex);
 faces.push([a,b,c],[a,c,d]);
 return {...mesh,data:{...mesh.data,
  edges:[...mesh.data.edges.map(e=>[...e]),[a,c]],
  faces:faces.map(e=>[...e])}};
}
const solve=(g,revision=7)=>{
 const geometry=[g],scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 return inspectFinalSourceStrokeObligations({
  geometry,revision,sceneDepthEvidence:scene});
};
test('M5 cuboid has exactly twelve geometrically proven single-solid crease edges',()=>{
 const src=make(),r=auditReviewedConvexSourceCreases({geometry:src,revision:7});
 assert.equal(r.status,'single-source-dihedral-feature-evidence');
 assert.equal(r.sourceEdgeCount,12);
 assert.equal(r.certifiedSingleSolidCreaseCount,12);
 assert.equal(r.provenCoplanarSubdivisionCount,0);
 assert.equal(r.ambiguousDihedralCount,0);
 assert.equal(r.exactTwoFaceIncidenceVerified,true);
 assert.equal(r.sourceConvexSupportPlanesVerified,true);
 assert.equal(r.multiBodyFeatureSemanticsVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.ok(Object.isFrozen(r.edges));
 for(const x of r.edges){
  assert.equal(x.adjacentFaceIds.length,2);
  assert.ok(Math.abs(x.exteriorDihedralAngleRad-Math.PI/2)<1e-8);
  assert.equal(x.sourceIsPhysicalCreaseWithinSingleSolid,true);
  assert.equal(x.sourceIsCoplanarSubdivisionWithinSingleSolid,false);
  assert.equal(x.finalV5LineActionAuthorized,false);
  assert.equal(x.officialEngineeringLineStyle,'undetermined');
 }
});
test('M5 triangulated coplanar source face diagonal MUST NOT be treated as a visible or hidden engineering feature',()=>{
 const src=triangleSplitBox(),r=auditReviewedConvexSourceCreases({
  geometry:src,revision:9});
 assert.equal(r.sourceEdgeCount,13);
 assert.equal(r.certifiedSingleSolidCreaseCount,12);
 assert.equal(r.provenCoplanarSubdivisionCount,1);
 assert.equal(r.ambiguousDihedralCount,0);
 const flat=r.edges.filter(e=>e.sourceIsCoplanarSubdivisionWithinSingleSolid);
 assert.equal(flat.length,1);
 assert.equal(flat[0].sourceIsPhysicalCreaseWithinSingleSolid,false);
 assert.ok(flat[0].exteriorDihedralAngleRad<=1e-9);
 assert.equal(flat[0].sourceFeatureClassification,'proven-coplanar-source-mesh-subdivision');
 assert.equal(flat[0].finalV5LineActionAuthorized,false);
});
test('M5 actual per-action final V5 ledger excludes fake coplanar source creases from every local positive or hidden line candidate',()=>{
 const src=triangleSplitBox(),r=solve(src,10);
 assert.equal(r.status,'per-source-span-proof-obligations-audited');
 assert.equal(r.sourceCreaseProofCount,12);
 assert.equal(r.coplanarSubdivisionExcludedCount,1);
 const coplanar=r.spans.filter(s=>
  s.independentlyRecomputedSourceCrease.sourceIsCoplanarSubdivisionWithinSingleSolid);
 assert.ok(coplanar.length>0);
 for(const s of coplanar){
  assert.equal(s.singleSolidSourceDihedralFeatureVerified,false);
  assert.equal(s.sourceMeshSubdivisionNotDrawnAsFeature,true);
  assert.equal(s.localPositiveOuterGeometryCandidate,false);
  assert.equal(s.hiddenDepthEvidenceCandidate,false);
  assert.ok(s.missingProofs.includes(
   'source-edge-is-coplanar-mesh-subdivision-not-physical-crease'));
  assert.equal(s.authorizedStyle,'undetermined');
  assert.equal(s.officialV5ActionReleaseApproved,false);
 }
 assert.equal(r.signedCount,0);
 assert.equal(r.officialLineStylesVerified,false);
});
test('M5 source crease proof travels through the C1 actual third-view source ledger without promoting line styles',()=>{
 const g=triangleSplitBox();
 const r=auditReviewedSolidWholeSourceEdges({geometry:g,revision:11});
 assert.equal(r.sourceCreaseEvidence.provenCoplanarSubdivisionCount,1);
 assert.equal(r.sourceCreaseEvidence.certifiedSingleSolidCreaseCount,12);
 const flat=r.edges.filter(e=>e.originalCoplanarMeshSubdivisionVerified);
 assert.ok(flat.length>0);
 assert.ok(flat.every(e=>!e.originalSingleSolidCreaseVerified));
 assert.ok(flat.every(e=>e.standardEngineeringLineStyle==='undetermined'));
 assert.equal(r.signedEdgeV5Ready,false);
});
test('M5 two contacting solids have authentic individual crease but NOT a proven external composite feature',()=>{
 const a=make(),b=make('B',p(20,0,0),p(27,12,9));
 const geometry=[a,b],revision=15;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const r=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 assert.equal(r.sourceCreaseEvidence.length,2);
 assert.equal(r.sourceCreaseProofCount,24);
 assert.ok(r.spans.every(s=>
  s.independentlyRecomputedSourceCrease.compositeUnionFeatureSemanticsVerified===false));
 assert.equal(r.completeMultiBodyDepthAndSourceFeaturesVerified,false);
 assert.equal(r.signedCount,0);
});
test('M5 rejects an incomplete face incidence or source revision, not allowing external feature style injection',()=>{
 const a=make();a.data.faces.pop();
 assert.throws(()=>auditReviewedConvexSourceCreases({geometry:a,revision:3}),
  /closed|nonmanifold|Euler|face boundary/);
 assert.throws(()=>auditReviewedConvexSourceCreases({
  geometry:make(),revision:-1}),/revision/);
 const invalid=make();invalid.data.edges.push([...invalid.data.edges[0]]);
 assert.throws(()=>auditReviewedConvexSourceCreases({geometry:invalid,revision:3}),
  /Euler|duplicate|declared Geometry|explicit finite model-3d mm mesh/);
});
test('M5 visible basic-solid UI explicitly separates geometric mesh creases from certified standard line styles',()=>{
 const js=fs.readFileSync('labs/solid-third-view-live-entry.cjs','utf8');
 assert.match(js,/sourceCreaseEvidence\.certifiedSingleSolidCreaseCount/);
 assert.match(js,/sourceCreaseEvidence\.provenCoplanarSubdivisionCount/);
 assert.match(js,/多实体并集外露语义仍未证明/);
 assert.match(js,/接合\/轮廓\/标准实虚线均未认证/);
});
