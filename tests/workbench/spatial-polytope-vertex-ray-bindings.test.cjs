'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const {bindScopedSectionEvidenceToV5:bind}=
 require('../../workbench/spatial-section-evidence-v5-binding.cjs');
const P=(x,y,z)=>({x,y,z});
const input={kind:'rectangular-prism',frame:'model-mm-3d',unit:'mm',
 solid:{min:P(0,0,0),max:P(10,10,10)},
 plane:{point:P(0,0,12),normal:P(1,1,1)}};
const pyramid={kind:'rectangular-pyramid',frame:'model-mm-3d',unit:'mm',
 solid:{base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:P(5,5,15)},
 plane:{point:P(0,0,15),normal:P(1,1,1)}};
const directions={V:P(0,-1,0),H:P(0,0,1),W:P(1,0,0)};
const review=rev=>({retainedHalfspace:'negative',
 sourceRevision:rev,observerDirections:directions});
test('M5 reviewed prism proves scoped point-ray witnesses from M3 exact polygon vertices',()=>{
 const r=evaluateUnifiedMath({kind:'spatial-section',input,revision:53,
  visibilityReview:review(53)});
 const e=r.sectionVisibilityEvidence,b=r.sectionEvidenceV5Bindings;
 const n=r.sectionPerimeterGeometry.data.points.length;
 assert.equal(e.vertexPointRayEvidenceAvailable,true);
 assert.equal(e.endpointVisibilityVerified,false);
 assert.equal(e.completeOcclusionVerified,false);
 assert.equal(b.bindingCount,n*3);
 let certified=0,uncertain=0;
 for(const view of ['V','H','W']){
  const v=e.vertexPointRayEvidence[view];
  assert.equal(v.length,n);
  for(let i=0;i<n;i++){
   const p=v[i],actual=r.sectionPerimeterGeometry.data.points[i];
   assert.equal(p.sourceVertexId,'section-vertex-'+(i+1));
   assert.equal(p.sourceGeometryId,'Section1');
   assert.equal(p.index,i);
   assert.equal(p.projectedJoinCertified,false);
   assert.equal(p.officialEndpointStyleVerified,false);
   assert.ok(['visible','hidden','undetermined'].includes(p.visibility));
   if(p.pointRayCertified){
    certified++;
    assert.equal(p.proofScope,'single-retained-convex-polytope-point-ray');
    assert.ok(p.activeFaceIds.includes('retained-cut-plane'));
    assert.equal(p.visibility==='undetermined',false);
   }else {uncertain++;assert.equal(p.visibility,'undetermined');}
   // A valid source vertex remains on the original plane and inside box.
   assert.ok(Math.abs(actual.x+actual.y+actual.z-12)<1e-6);
  }
 }
 assert.ok(certified>0,'must establish some independent point ray witnesses');
 assert.ok(uncertain>0,'tangent/edge-on first-angle rays must remain unproven');
 for(const link of b.bindings){
  const found=e.vertexPointRayEvidence[link.view];
  assert.deepEqual(link.sourceEndpointPointRays.map(x=>x.sourceVertexId),[
   found[Number(link.sourceEdgeId.split('-').at(-1))-1].sourceVertexId,
   found[Number(link.sourceEdgeId.split('-').at(-1))%n].sourceVertexId
  ]);
  assert.ok(link.sourceEndpointPointRays.every(x=>x.projectedJoinCertified===false));
  assert.equal(link.projectedFullStrokeVisibility,'undetermined');
  assert.equal(link.endpointsVisibilityVerified,false);
 }
 assert.equal(r.v5Ready,false);
 assert.equal(r.verifiedVisibility,false);
 assert.equal(r.sectionConstructionPreview.canPromoteToVerifiedResult,false);
 assert.ok(r.sectionConstructionPreview.steps.filter(s=>s.role==='result')
  .flatMap(s=>s.actions).every(a=>a.visibility==='undetermined'));
});
test('unreviewed and unsupported shapes do not borrow local prism vertex proof',()=>{
 for(const [source,visibilityReview] of [
  [input,undefined],[pyramid,review(71)],[pyramid,undefined]
 ]){
  const r=evaluateUnifiedMath({kind:'spatial-section',input:source,
   revision:71,visibilityReview});
  assert.equal(r.sectionVisibilityEvidence.vertexPointRayEvidenceAvailable,false);
  assert.ok(Object.values(r.sectionVisibilityEvidence.vertexPointRayEvidence)
   .flat().every(x=>x.visibility==='undetermined'&&
    !x.pointRayCertified&&x.proofScope==='none'));
  assert.equal(r.sectionEvidenceV5Bindings.v5VerifiedExportReady,false);
  assert.equal(r.v5Ready,false);
 }
});
test('M4 binder rejects tampered local point status, identity and illicit endpoint style',()=>{
 const r=evaluateUnifiedMath({kind:'spatial-section',input,revision:93,
  visibilityReview:review(93)});
 const args=()=>({preview:structuredClone(r.sectionConstructionPreview),
  visibilityEvidence:structuredClone(r.sectionVisibilityEvidence),revision:93});
 for(const mutate of [
  a=>{a.visibilityEvidence.vertexPointRayEvidence.V[0].visibility='visible';
      a.visibilityEvidence.vertexPointRayEvidence.V[0].pointRayCertified=false;},
  a=>{a.visibilityEvidence.vertexPointRayEvidence.V[0].projectedJoinCertified=true;},
  a=>{a.visibilityEvidence.vertexPointRayEvidence.V[0].officialEndpointStyleVerified=true;},
  a=>{a.visibilityEvidence.vertexPointRayEvidence.W[0].sourceVertexId='other';},
  a=>{a.visibilityEvidence.vertexPointRayEvidenceAvailable=false;},
  a=>{a.visibilityEvidence.vertexPointRayEvidence.H.pop();},
  a=>{a.visibilityEvidence.vertexPointRayEvidence.V[0].index=4;}
 ]){
  const a=args();mutate(a);
  assert.throws(()=>bind(a),/spatial construction evidence binding/);
 }
});
