'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const {deriveScopedSectionVisibility}=
 require('../../workbench/spatial-section-visibility-evidence.cjs');
const {solveVerifiedSectionEvidence}=
 require('../../engines/spatial/sections/verified-section-evidence.cjs');
const p=(x,y,z)=>({x,y,z});
const prism={
 kind:'rectangular-prism',solid:{min:p(0,0,0),max:p(10,10,10)},
 plane:{point:p(0,0,12),normal:p(1,1,1)},
 frame:'model-mm-3d',unit:'mm'
};
const pyramid={
 kind:'rectangular-pyramid',solid:{
  base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)},
 plane:{point:p(0,0,15),normal:p(1,1,1)},
 frame:'model-mm-3d',unit:'mm'
};
const directions={V:p(0,-1,0),H:p(0,0,1),W:p(1,0,0)};
const review=revision=>({
 retainedHalfspace:'negative',observerDirections:directions,sourceRevision:revision
});
test('without retained material and explicit observer rays all views stay undetermined',()=>{
 for(const input of [prism,pyramid]){
  const response=evaluateUnifiedMath({kind:'spatial-section',input,revision:8});
  const result=response.sectionVisibilityEvidence;
  assert.equal(result.status,'unreviewed');
  assert.equal(result.revision,8);
  assert.equal(result.sourceKind,input.kind);
  assert.equal(result.geometryId,'Section1');
  assert.equal(result.counts.visible,0);
  assert.equal(result.counts.hidden,0);
  assert.equal(result.counts.undetermined,
   response.sectionPerimeterGeometry.data.points.length*3);
  assert.equal(result.fullLineStylesReady,false);
  assert.equal(response.v5Ready,false);
  assert.equal(response.verifiedVisibility,false);
  assert.equal(Object.isFrozen(result.perView.V[0]),true);
 }
});
test('one trusted prism specialist may provide scoped open-edge evidence for three views',()=>{
 const result=evaluateUnifiedMath({kind:'spatial-section',input:prism,
  revision:5,visibilityReview:review(5)});
 const v=result.sectionVisibilityEvidence,n=result.sectionPerimeterGeometry.data.points.length;
 assert.equal(v.status,'open-edge-ray-only');
 assert.equal(v.reviewBound,true);
 assert.equal(v.openEdgeEvidenceAvailable,true);
 assert.equal(v.counts.visible+v.counts.hidden+v.counts.undetermined,n*3);
 for(const view of ['V','H','W']){
  assert.equal(v.perView[view].length,n);
  v.perView[view].forEach((e,i)=>{
   assert.equal(e.index,i);
   assert.equal(e.sourceGeometryId,'Section1');
   assert.equal(e.sourceEdgeId,'section-edge-'+(i+1));
   assert.equal(e.endpointsVerified,false);
   assert.equal(e.standardLineStyleVerified,false);
   assert.ok(['visible','hidden','undetermined'].includes(e.visibility));
   if(e.visibility!=='undetermined')
    assert.equal(e.proofScope,'single-convex-solid-open-edge-ray');
  });
 }
 assert.equal(v.endpointVisibilityVerified,false);
 assert.equal(v.completeOcclusionVerified,false);
 assert.equal(v.standardViewMappingVerified,false);
 assert.equal(v.wholeDrawingVerified,false);
 assert.equal(result.v5Ready,false);
 assert.equal(result.verifiedVisibility,false);
 assert.equal(result.mathematicallyVerified,false);
});
test('review is versioned and cannot be forged, partial or treated as proof of any other shape',()=>{
 for(const bad of [
  {...review(3),sourceRevision:2},
  {...review(3),observerDirections:{V:directions.V,H:directions.H}},
  {...review(3),observerDirections:{...directions,W:p(0,0,0)}},
  {...review(3),observerDirections:{...directions,V:p(0,1,0)}},
  {...review(3),observerDirections:{...directions,W:p(-1,0,0)}},
  {...review(3),observerDirections:{...directions,H:p(0,1,1)}},
  {...review(3),retainedHalfspace:'unknown'},
  {...review(3),verifiedVisibility:true}
 ]){
  assert.throws(()=>evaluateUnifiedMath({kind:'spatial-section',
   input:prism,revision:3,visibilityReview:bad}),/visibility evidence/);
 }
 const pyramidResult=evaluateUnifiedMath({kind:'spatial-section',input:pyramid,
  revision:3,visibilityReview:review(3)});
 assert.equal(pyramidResult.sectionVisibilityEvidence.status,'unsupported-proof');
 assert.equal(pyramidResult.sectionVisibilityEvidence.counts.visible,0);
 assert.equal(pyramidResult.sectionVisibilityEvidence.fullLineStylesReady,false);
 assert.equal(pyramidResult.v5Ready,false);
 assert.throws(()=>evaluateUnifiedMath({kind:'point-projection',
  input:{},revision:1,visibilityReview:review(1)}),/only for scoped/);
});
test('no section, untrusted source and sampled cylinder produce NO polygon edge ray packet',()=>{
 const absent={...prism,plane:{point:p(0,0,100),normal:p(0,0,1)}};
 const response=evaluateUnifiedMath({kind:'spatial-section',input:absent,
  revision:7,visibilityReview:review(7)});
 assert.equal(response.status,'not-verified');
 assert.equal(response.sectionVisibilityEvidence,null);
 const fake={...solveVerifiedSectionEvidence(prism),
  sourceMethod:'untrusted-caller-result'};
 assert.equal(deriveScopedSectionVisibility({
  input:prism,evidence:fake,revision:7,review:review(7)}),null);
 const cyl={kind:'cylinder-lateral',
  solid:{baseCenter:p(0,0,0),radiusMm:5,heightMm:30},
  plane:{point:p(0,0,15),normal:p(1,0,1)},
  frame:'model-mm-3d',unit:'mm',samples:24};
 const c=evaluateUnifiedMath({kind:'spatial-section',input:cyl,revision:7});
 assert.equal(c.status,'geometry-only');
 assert.equal(c.sectionVisibilityEvidence,null,
  'sampled curve is not a proven polygon edge list');
});
