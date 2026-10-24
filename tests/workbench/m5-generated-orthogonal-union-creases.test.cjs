'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const {proveGeneratedOrthogonalUnionCreases}=
 require('../../workbench/m5-generated-orthogonal-union-creases.cjs');
const P=(x,y,z)=>({x,y,z});
const B=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>B('A',P(0,0,0),P(10,10,10));
const moved=()=>B('B',P(5,5,5),P(15,15,15));
const audit=(geo,rev=8)=>proveGeneratedOrthogonalUnionCreases({
 geometry:geo,revision:rev});
function generatedABZ(result){
 return result.segments.filter(s=>s.sourceGeometryIds.join(',')==='A,B'&&
  s.sourceAxis==='z'&&s.sourceFacePlanes[0].axis==='x'&&
  s.sourceFacePlanes[1].axis==='y');
}
test('C2 M5 original cuboid faces crossing transversely creates SIX previously nonexistent source 3D concave lines',()=>{
 const r=audit([A(),moved()]);
 assert.equal(r.status,'scoped-pairwise-new-perpendicular-face-open-features');
 assert.equal(r.segmentCount,6);
 assert.equal(r.certifiedNewConcaveOpenCount,6);
 assert.equal(r.buriedNewFaceIntersectionCount,0);
 assert.equal(r.uncertainCount,0);
 assert.equal(r.noOriginalSourceMeshEdgeSubstituted,true);
 assert.equal(r.generatedFeatureV5Ready,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.ok(Object.isFrozen(r.segments));
 const axes={x:0,y:0,z:0};
 for(const s of r.segments){
  axes[s.sourceAxis]++;
  assert.equal(s.generatedByTwoSourceFacePlanes,true);
  assert.equal(s.originalSourceMeshEdgeId,null);
  assert.equal(s.supportingFacePlaneIncidenceIndependentlyVerified,true);
  assert.equal(s.quadrantInsideSolidUnion.filter(Boolean).length,3);
  assert.equal(s.status,'certified-new-concave-union-open-crease');
  assert.equal(s.positiveNewConcaveUnionOpenFeatureVerified,true);
  assert.equal(s.originalAndNovelFeatureEndpointTopologyVerified,false);
  assert.equal(s.officialEngineeringLineStyle,'undetermined');
  assert.equal(s.officialConstructionStepV5ActionAuthorized,false);
  assert.equal(s.sourceCapEndEvents.length,2);
  for(const v of ['V','H','W']){
   assert.deepEqual(s.projected[v].from,project(s.source3DFrom)[v]);
   assert.deepEqual(s.projected[v].to,project(s.source3DTo)[v]);
   assert.equal(s.projected[v].standardLineStyle,'undetermined');
  }
  assert.equal(['V','H','W'].filter(v=>
   s.projected[v].kind==='collapsed-point').length,1);
 }
 assert.deepEqual(axes,{x:2,y:2,z:2});
 const seg=generatedABZ(r);
 assert.equal(seg.length,1);
 assert.deepEqual(seg[0].source3DFrom,P(10,5,5));
 assert.deepEqual(seg[0].source3DTo,P(10,5,10));
 assert.deepEqual(seg[0].sourceCapEndEvents.map(a=>a.map(x=>x.sourceGeometryId)),[['B'],['A']]);
});
test('C2 M5 third reviewed solid creates critical axial splits and BURIES only part of a new feature',()=>{
 const third=B('C',P(9,4,6),P(11,6,8));
 const r=audit([A(),moved(),third],15);
 const rows=generatedABZ(r);
 assert.equal(rows.length,3);
 assert.deepEqual(rows.map(s=>s.sourceParameterOpenRangeMm),
  [[5,6],[6,8],[8,10]]);
 assert.deepEqual(rows.map(s=>s.status),[
  'certified-new-concave-union-open-crease',
  'certified-new-face-intersection-buried-in-union',
  'certified-new-concave-union-open-crease'
 ]);
 assert.equal(rows[1].occupiedQuadrantCount,4);
 assert.equal(rows[1].positiveNewFeatureBuriedVerified,true);
 assert.equal(rows[1].positiveNewConcaveUnionOpenFeatureVerified,false);
 assert.ok(r.buriedNewFaceIntersectionCount>0);
 assert.equal(r.generatedFeatureV5Ready,false);
});
test('C2 M5 face contact, partial face contact and separated solids do not invent two-face NEW intersection edges',()=>{
 const whole=B('B',P(10,0,0),P(20,10,10));
 const part=B('B',P(10,2,2),P(17,8,8));
 const far=B('B',P(20,0,0),P(30,10,10));
 for(const geometry of [[A(),whole],[A(),part],[A(),far]]){
  const r=audit(geometry,11);
  assert.equal(r.segmentCount,0);
  assert.equal(r.certifiedNewConcaveOpenCount,0);
  assert.equal(r.officialLineStylesVerified,false);
 }
});
test('C2 M5 identical boxes have no novel cross-pair line, no false construction readiness',()=>{
 const r=audit([A(),B('B',P(0,0,0),P(10,10,10))]);
 assert.equal(r.segmentCount,0);
 assert.equal(r.generatedFeatureV5Ready,false);
});
test('C2 M5 current M0 source proof refuses non-cuboid and broken/forged mesh data',()=>{
 const source=A();source.data.faces.pop();
 const r=audit([source,moved()]);
 assert.equal(r.status,'not-covered-non-cuboid');
 assert.equal(r.generatedFeatureV5Ready,false);
 assert.throws(()=>audit([A(),A()]),/duplicate/);
 assert.throws(()=>audit([A(),moved()],-1),/revision/);
 const forged=moved();forged.data.points.V000.x=4.2;
 assert.equal(audit([A(),forged()]).status,'not-covered-non-cuboid');
});
test('C2 M5 generated edges are separate from OLD source M4/V5 candidate actions and NEVER signed',()=>{
 const geometry=[A(),moved()],revision=13;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const r=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 assert.equal(r.status,'per-source-span-proof-obligations-audited');
 assert.equal(r.generatedUnionCreaseEvidence.certifiedNewConcaveOpenCount,6);
 assert.equal(r.generatedSource3DOpenCandidateCount,6);
 assert.equal(r.generatedSourceStrokeActionCount,0);
 assert.equal(r.generatedSourceStrokeSignedCount,0);
 assert.equal(r.signedCount,0);
 assert.equal(r.v5Ready,false);
 assert.ok(r.spans.every(s=>s.authorizedStyle==='undetermined'));
 assert.ok(r.generatedUnionCreaseEvidence.segments.every(s=>
  s.officialConstructionStepV5ActionAuthorized===false));
});
test('C2 published V7 status displays truly generated features distinctly and withholds all V5 lines',()=>{
 const src=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(src,/generatedUnionCreaseEvidence\?\.certifiedNewConcaveOpenCount/);
 assert.match(src,/generatedUnionCreaseEvidence\?\.buriedNewFaceIntersectionCount/);
 assert.match(src,/新增曲线\/棱线正式 V5 动作为 0/);
 assert.match(src,/不能发布实线\/虚线/);
});
