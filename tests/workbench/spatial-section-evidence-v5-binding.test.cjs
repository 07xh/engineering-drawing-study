'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const {bindScopedSectionEvidenceToV5:bind}=
 require('../../workbench/spatial-section-evidence-v5-binding.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const P=(x,y,z)=>({x,y,z});
const frame={frame:'model-mm-3d',unit:'mm'};
const prism={...frame,kind:'rectangular-prism',
 solid:{min:P(0,0,0),max:P(10,10,10)},
 plane:{point:P(0,0,12),normal:P(1,1,1)}};
const pyramid={...frame,kind:'rectangular-pyramid',
 solid:{base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:P(5,5,15)},
 plane:{point:P(0,0,15),normal:P(1,1,1)}};
const review=revision=>({
 sourceRevision:revision,retainedHalfspace:'negative',
 observerDirections:{V:P(0,-1,0),H:P(0,0,1),W:P(1,0,0)}
});
const solve=(input,revision=23,reviewed=true)=>evaluateUnifiedMath({
 kind:'spatial-section',input,revision,
 ...(reviewed?{visibilityReview:review(revision)}:{})
});
test('M3 polygon, M5 reviewed open-edge rays and EXISTING V5 DAG share all stable identities',()=>{
 const r=solve(prism),v=r.sectionVisibilityEvidence;
 const b=r.sectionEvidenceV5Bindings,preview=r.sectionConstructionPreview;
 assert.equal(b.schema,'draftai-spatial-v5-evidence-bindings/1');
 assert.equal(b.status,'preview-evidence-only');
 assert.equal(b.revision,23);
 assert.equal(b.evidenceStatus,'open-edge-ray-only');
 assert.equal(b.geometryId,r.sectionPerimeterGeometry.id);
 assert.equal(b.bindingCount,3*r.sectionPerimeterGeometry.data.points.length);
 assert.deepEqual(b.sourceCounts,v.counts);
 assert.equal(Object.isFrozen(b),true);
 assert.equal(Object.isFrozen(b.bindings),true);
 assert.equal(Object.isFrozen(b.bindings[0]),true);
 const actionIds=new Set(preview.steps.flatMap(s=>s.actions.map(a=>a.id)));
 const stepIds=new Set(preview.steps.map(s=>s.id));
 for(const link of b.bindings){
  const expected=v.perView[link.view].find(e=>e.sourceEdgeId===link.sourceEdgeId);
  assert.ok(expected);
  assert.equal(link.sourceOpenInteriorVisibility,expected.visibility);
  assert.ok(actionIds.has(link.v5ActionId),'link must lead to old V5 action');
  assert.ok(stepIds.has(link.stepId),'link must lead to existing DAG step');
  assert.equal(link.projectedFullStrokeVisibility,'undetermined');
  assert.equal(link.endpointsVisibilityVerified,false);
  assert.equal(link.officialHiddenLineStyleVerified,false);
  assert.equal(link.canonicalConstructionIntentVerified,false);
  if(link.projectedPrimitiveKind==='point')
   assert.equal(link.openInteriorVisibility,'undetermined');
 }
 assert.equal(b.mutatesExistingTimeline,false);
 assert.equal(b.v5VerifiedExportReady,false);
 assert.equal(r.v5Ready,false);
 assert.equal(r.verifiedVisibility,false);
 assert.deepEqual(Timeline.compileTimeline(preview.steps),preview.timing);
 assert.ok(preview.steps.filter(s=>s.role==='result').every(s=>
   s.actions.every(a=>a.visibility==='undetermined')));
 assert.deepEqual(r.constructionIntents,[]);
 assert.deepEqual(r.steps,[]);
 assert.equal(r.timing,null);
});
test('unreviewed prism and currently unsupported pyramid map but never borrow ray proof',()=>{
 for(const [input,reviewed,status] of [
  [prism,false,'unreviewed'],
  [pyramid,true,'unsupported-proof'],
  [pyramid,false,'unreviewed']]){
  const r=solve(input,24,reviewed);
  assert.ok(r.sectionConstructionPreview);
  assert.ok(r.sectionEvidenceV5Bindings);
  assert.equal(r.sectionEvidenceV5Bindings.evidenceStatus,status);
  assert.ok(r.sectionEvidenceV5Bindings.bindings.every(e=>
   e.sourceOpenInteriorVisibility==='undetermined'&&
   e.projectedFullStrokeVisibility==='undetermined'));
  assert.equal(r.v5Ready,false);
 }
});
test('stale, forged, mixed view, duplicated and promoted evidence cannot bind to V5',()=>{
 const r=solve(prism),clone=()=>({
  preview:structuredClone(r.sectionConstructionPreview),
  visibilityEvidence:structuredClone(r.sectionVisibilityEvidence),revision:23
 });
 const bad=[];
 let a=clone();a.revision=24;bad.push(a);
 a=clone();a.visibilityEvidence.revision=22;bad.push(a);
 a=clone();a.visibilityEvidence.geometryId='ForgedGeometry';bad.push(a);
 a=clone();a.visibilityEvidence.sourceKind='rectangular-pyramid';bad.push(a);
 a=clone();a.visibilityEvidence.perView.V[0].sourceGeometryId='Other';bad.push(a);
 a=clone();a.visibilityEvidence.perView.H[0].view='W';bad.push(a);
 a=clone();a.visibilityEvidence.perView.W[0].sourceEdgeId='section-edge-2';bad.push(a);
 a=clone();a.visibilityEvidence.perView.V[0].standardLineStyleVerified=true;bad.push(a);
 a=clone();a.visibilityEvidence.perView.V[0].endpointsVerified=true;bad.push(a);
 a=clone();a.visibilityEvidence.endpointVisibilityVerified=true;bad.push(a);
 a=clone();a.visibilityEvidence.counts.visible++;bad.push(a);
 a=clone();a.preview.steps.find(s=>s.role==='result').actions[0].visibility='visible';bad.push(a);
 a=clone();a.preview.steps.find(s=>s.role==='result').actions[0].sourceSectionEdgeId='section-edge-999';bad.push(a);
 a=clone();a.preview.steps.find(s=>s.role==='result').actions[0].id='forged-V';bad.push(a);
 a=clone();a.preview.steps[1].dependsOn=['nonexistent-step'];bad.push(a);
 a=clone();a.preview.timing.totalMs++;bad.push(a);
 a=clone();a.preview.fullSpatialConstructionIntentVerified=true;bad.push(a);
 a=clone();a.visibilityEvidence.fullLineStylesReady=true;bad.push(a);
 for(const candidate of bad)assert.throws(()=>bind(candidate),
  /spatial construction evidence binding|invalid\/duplicate/);
});
test('no verified perimeter or analytic-only sampled cylinder cannot invent a polygon/V5 link',()=>{
 const absent=solve({...prism,plane:{point:P(0,0,40),normal:P(0,0,1)}},31);
 assert.equal(absent.sectionConstructionPreview,null);
 assert.equal(absent.sectionEvidenceV5Bindings,null);
 const cylinder=solve({...frame,kind:'cylinder-lateral',
  solid:{baseCenter:P(0,0,0),radiusMm:5,heightMm:30},
  plane:{point:P(0,0,15),normal:P(1,0,1)},samples:24},32);
 assert.equal(cylinder.status,'geometry-only');
 assert.equal(cylinder.sectionEvidenceV5Bindings,null);
 assert.equal(cylinder.sectionVisibilityEvidence,null);
 assert.equal(cylinder.v5Ready,false);
});
