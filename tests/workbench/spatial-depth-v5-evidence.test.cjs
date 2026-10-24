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
const dirs={V:P(0,-1,0),H:P(0,0,1),W:P(1,0,0)};
const review=revision=>({retainedHalfspace:'negative',sourceRevision:revision,
 observerDirections:dirs});
const solve=(a,reviewed=true)=>evaluateUnifiedMath({
 kind:'spatial-section',input:a,revision:101,
 ...(reviewed?{visibilityReview:review(101)}:{})
});
test('recomputed retained-solid V/H/W open-edge depths join existing V5 action identities',()=>{
 const result=solve(input),v=result.sectionVisibilityEvidence,
  bind=result.sectionEvidenceV5Bindings;
 const n=result.sectionPerimeterGeometry.data.points.length;
 assert.equal(v.openEdgeDepthAvailable,true);
 assert.equal(bind.bindingCount,n*3);
 assert.equal(result.v5Ready,false);
 for(const view of ['V','H','W'])for(let i=0;i<n;i++){
  const depth=v.openEdgeDepthEvidence[view][i],
   link=bind.bindings.find(a=>a.view===view&&
    a.sourceEdgeId==='section-edge-'+(i+1));
  assert.ok(link);
  assert.equal(depth.scope,'only-supplied-convex-halfspaces');
  assert.equal(depth.status,'scoped-depth-audit');
  assert.equal(link.sourceOpenEdgeDepthAudit.status,depth.occlusion);
  assert.equal(depth.completeSceneVerified,false);
  assert.equal(link.sourceOpenEdgeDepthAudit.completeSceneVerified,false);
  assert.equal(link.projectedFullStrokeVisibility,'undetermined');
  assert.equal(link.officialHiddenLineStyleVerified,false);
  if(depth.occlusion!=='undetermined'){
   const observed=depth.occlusion==='occluded'?'hidden':'visible';
   assert.equal(depth.pointRayVisibility,observed);
   const independent=v.perView[view][i];
   if(independent.visibility!=='undetermined')
    assert.equal(independent.visibility,observed);
  }
 }
 assert.ok(result.sectionConstructionPreview.steps.flatMap(s=>s.actions)
  .filter(a=>a.sourceSectionEdgeId).every(a=>a.visibility==='undetermined'));
});
test('unreviewed prism or unsupported pyramid cannot carry a forged ray-depth proof',()=>{
 for(const [source,reviewed] of [[input,false],[pyramid,true],[pyramid,false]]){
  const r=solve(source,reviewed),v=r.sectionVisibilityEvidence;
  assert.equal(v.openEdgeDepthAvailable,false);
  for(const item of Object.values(v.openEdgeDepthEvidence).flat()){
   assert.equal(item.status,'unreviewed');
   assert.equal(item.occlusion,'undetermined');
   assert.equal(item.scope,'none');
  }
  assert.equal(r.sectionEvidenceV5Bindings.v5VerifiedExportReady,false);
 }
});
test('missing, stale and illicitly promoted depth evidence fails existing V5 binding',()=>{
 const r=solve(input);
 const args=()=>({preview:structuredClone(r.sectionConstructionPreview),
  visibilityEvidence:structuredClone(r.sectionVisibilityEvidence),revision:101});
 for(const damage of [
  x=>{x.visibilityEvidence.openEdgeDepthAvailable=false;},
  x=>{x.visibilityEvidence.openEdgeDepthEvidence.V[0].sourceEdgeId='section-edge-99';},
  x=>{x.visibilityEvidence.openEdgeDepthEvidence.H.pop();},
  x=>{x.visibilityEvidence.openEdgeDepthEvidence.W[0].completeSceneVerified=true;},
  x=>{x.visibilityEvidence.openEdgeDepthEvidence.V[0].officialLineStyleVerified=true;},
  x=>{x.visibilityEvidence.openEdgeDepthEvidence.V[0].status='whole-drawing-verified';},
  x=>{x.visibilityEvidence.openEdgeDepthEvidence.V[0].scope='all-solids';},
  x=>{x.visibilityEvidence.openEdgeDepthEvidence.V[0].occlusion='occluded';
       x.visibilityEvidence.openEdgeDepthEvidence.V[0].nearestDepthMm=null;}
 ]){
  const x=args();damage(x);
  assert.throws(()=>bind(x),/spatial construction evidence binding/);
 }
});
