'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1SingleConvexSourceSubspanRays:audit}=
 require('../../workbench/m5-c1-source-subspan-opaque-rays.cjs');
const p=(x,y,z)=>({x,y,z});
const box=()=>{
 const g=prismMesh({solid:{min:p(-5,2,-3),max:p(27,19,41)}});
 return {...g,id:'C1OpaqueBox'};
};
const tetra=()=>({id:'C1OpaqueSkewTetra',kind:'mesh',
 space:'model-3d',unit:'mm',data:{
  points:{A:p(0,0,0),B:p(17,1,3),
   C:p(3,16,2),D:p(5,6,23)},
  edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
  faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]}}
);
function check(g,revision){
 const r=audit({geometry:g,revision});
 assert.equal(r.sourceGeometryId,g.id);
 assert.equal(r.revision,revision);
 assert.equal(r.schema,'draftai-c1-m5-original-source-subspan-opaque-ray/1');
 assert.equal(r.signedV5ActionCount,0);
 assert.equal(r.onlyOneReviewedConvexOpaqueSolidChecked,true);
 assert.equal(r.wholeSolidV5Ready,false);
 assert.equal(r.allCoProjectedSourceDepthsCertified,false);
 assert.equal(r.sourceSubspanCount,
  r.counts.clear+r.counts.strictHidden+r.counts.unresolved+
   r.counts.excludedAlreadySignedContour);
 assert.ok(r.counts.clear+r.counts.exactOriginalFaceOutwardClear>0);
 assert.ok(r.sourceEventCount>0);
 for(const s of r.subspans){
  assert.ok(['V','H','W'].includes(s.view));
  assert.ok(s.originalParameterRange[0]>=0&&
   s.originalParameterRange[1]<=1&&
   s.originalParameterRange[0]<s.originalParameterRange[1]);
  assert.equal(s.signedV5Action,false);
  assert.equal(s.signedLineStyle,'undetermined');
  assert.equal(s.engineeringLineStyleAuthorized,false);
  assert.equal(s.globallyFrontmostPhysicalSourceCertified,false);
  assert.ok(!(s.exactOriginalFaceWholeOpenRayClear&&
   s.fullAnalyticStrictInteriorRayOcclusion));
  assert.ok(!(s.analyticConservativeWholeOpenRayClear&&
   s.fullAnalyticStrictInteriorRayOcclusion));
  if(s.status==='single-opaque-solid-whole-open-ray-clear')
   assert.ok(s.exactOriginalFaceWholeOpenRayClear||
    s.analyticConservativeWholeOpenRayClear);
  if(s.status==='single-opaque-solid-whole-open-ray-strictly-hidden')
   assert.equal(s.fullAnalyticStrictInteriorRayOcclusion,true);
  if(s.status==='exterior-contour-held-by-original-m5')
   assert.equal(s.originalM5ExteriorContourOverlap,true);
 }
 assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.subspans));
 return r;
}
test('M0 exact/analytic WHOLE source-subspan ray proof is bounded for a real reviewed box',()=>{
 const g=box(),r=check(g,17);
 assert.ok(r.counts.excludedAlreadySignedContour>0);
});
test('the same source-subspan method handles nonregular tetrahedron with exact incidence',()=>{
 const g=tetra(),r=check(g,19);
 assert.ok(r.counts.exactOriginalFaceOutwardClear>0);
 assert.ok(r.counts.excludedAlreadySignedContour>0);
});
test('fake original source cannot inherit any ray or official line certificate',()=>{
 const g=box();
 assert.throws(()=>audit({geometry:g,revision:0}),/revision/);
 assert.throws(()=>audit({geometry:{...g,id:'WrongVersion',
  data:{...g.data,faces:g.data.faces.slice(1)}},revision:9}),
 /closed|Euler|face/);
 assert.throws(()=>audit({geometry:{...g,data:{...g.data,
  edges:[...g.data.edges,[...g.data.edges[0]]}},revision:9}),
 /duplicate|explicit finite|declared/);
});
