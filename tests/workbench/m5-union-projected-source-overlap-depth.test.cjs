'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../../core/projection/conventions.js');
const {auditUnionPhysicalFeatureJunctions}=
 require('../../workbench/m5-union-physical-feature-junctions.cjs');
const {auditProjectedSourceOverlapDepth}=
 require('../../workbench/m5-union-projected-overlap-depth.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const p=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',p(0,0,0),p(10,10,10));
const far=()=>box('B',p(30,0,0),p(40,10,10));
const same=()=>box('B',p(0,0,0),p(10,10,10));
const moved=()=>box('B',p(5,5,5),p(15,15,15));
const compare=(geometry,revision=71)=>{
 const physical=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const r=auditProjectedSourceOverlapDepth({geometry,revision,
  physicalJunctionEvidence:physical});
 return {r,physical};
};
const near=(a,b)=>Math.abs(a-b)<=1e-8;
const xyz=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
 z:a.z+(b.z-a.z)*t});
test('M5 C2 disjoint X-separated cuboids co-project to identical W source strokes with STRICT forward-depth order over WHOLE overlaps',()=>{
 const {r,physical}=compare([A(),far()]);
 assert.equal(r.status,'full-analytic-listed-source-pair-overlap-depth');
 assert.ok(r.overlapCount>0);
 assert.ok(r.strictlyOrderedPairCount>0);
 assert.equal(r.allListedSameProjectedSourcePairsExamined,true);
 assert.equal(r.allOpaqueFacesAndFinalSourceStrokeOcclusionVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 assert.ok(Object.isFrozen(r.overlaps));
 const lines=new Map(physical.segments.map(s=>[s.id,s]));
 const between=r.overlaps.filter(x=>x.view==='W'&&
  x.sourceA.sourceGeometryIds[0]!==x.sourceB.sourceGeometryIds[0]&&
  x.strictlyPositiveRelativeDepthAcrossWholeOverlap);
 assert.ok(between.length>0);
 for(const pair of between){
  const winner=pair.frontSourceFeatureId,source=lines.get(winner);
  assert.ok(source.sourceGeometryIds.includes('B'));
  assert.ok(['strict-source-A-front-across-overlap',
    'strict-source-B-front-across-overlap'].includes(pair.status));
  assert.equal(pair.officialSolidDashedEngineeringStyle,'undetermined');
  assert.equal(pair.canonicalV5ActionSigned,false);
  assert.equal(pair.thirdPartyOpaqueFaceOcclusionVerified,false);
  assert.equal(pair.analyticSourceDepthTransitionParameter,null);
  for(const [j,t] of pair.sourceA.sourceOpenParameterRange.entries()){
   const a=lines.get(pair.sourceA.id),b=lines.get(pair.sourceB.id),
     q=pair.sourceB.sourceOpenParameterRange[j],
     xyzA=xyz(a.source3DFrom,a.source3DTo,t),
     xyzB=xyz(b.source3DFrom,b.source3DTo,q);
   assert.deepEqual(project(xyzA).W,project(xyzB).W);
   const ray=FIRST_ANGLE_OBSERVER_RAYS.W;
   const depth=(xyzA.x-xyzB.x)*ray.x+
    (xyzA.y-xyzB.y)*ray.y+(xyzA.z-xyzB.z)*ray.z;
   assert.ok(near(depth,pair.endpointSourceDepthDifferenceMm[j]));
   assert.ok(winner===a.id?depth>0:depth<0);
  }
 }
});
test('M5 C2 identical source cuboids have coincident 3D projected-edge duplicates: NOT separately approved visible lines',()=>{
 const {r}=compare([A(),same()],72);
 assert.ok(r.identicalDepthPairCount>0);
 for(const x of r.overlaps.filter(x=>
  x.status==='coincident-3d-depth-needs-union-feature-dedup')){
  assert.equal(x.frontSourceFeatureId,null);
  assert.equal(x.exactAffineInteriorDepthOrderVerified,true);
  assert.equal(x.strictlyPositiveRelativeDepthAcrossWholeOverlap,false);
  assert.equal(x.allProjectedFeatureDuplicatesMerged,false);
  assert.equal(x.canonicalV5ActionSigned,false);
 }
 assert.equal(r.officialLineStylesVerified,false);
});
test('M5 C2 two partly overlapping cuboids: every projected depth candidate preserves authentic source IDs, V/H/W and zero styles',()=>{
 const {r,physical}=compare([A(),moved()],73);
 const ids=new Set(physical.segments.map(s=>s.id));
 assert.equal(r.status,'full-analytic-listed-source-pair-overlap-depth');
 for(const x of r.overlaps){
  assert.ok(['V','H','W'].includes(x.view));
  assert.ok(ids.has(x.sourceA.id)&&ids.has(x.sourceB.id));
  assert.notEqual(x.sourceA.id,x.sourceB.id);
  assert.equal(x.officialSolidDashedEngineeringStyle,'undetermined');
  assert.equal(x.globalFrontmostLineStyleVerified,false);
  assert.equal(x.completeReal3DJunctionAndPaperDepthVerified,false);
  assert.equal(x.canonicalV5ActionSigned,false);
  assert.equal(x.endpointSourceDepthDifferenceMm.length,2);
  if(x.strictlyPositiveRelativeDepthAcrossWholeOverlap){
   const ds=x.endpointSourceDepthDifferenceMm;
   assert.equal(Math.sign(ds[0]),Math.sign(ds[1]));
  }
 }
});
test('M5 C2 forged physical source graph and stale revision cannot create depth style or official V5',()=>{
 const geometry=[A(),far()],revision=74;
 const {physical}=compare(geometry,revision);
 const bad={...physical,officialV5FeatureActionsSigned:1};
 assert.throws(()=>auditProjectedSourceOverlapDepth({
  geometry,revision,physicalJunctionEvidence:bad}),/forged or stale/);
 const stale={...physical,revision:revision-1};
 assert.throws(()=>auditProjectedSourceOverlapDepth({
  geometry,revision,physicalJunctionEvidence:stale}),/forged or stale/);
 assert.throws(()=>auditProjectedSourceOverlapDepth({
  geometry,revision:-1,physicalJunctionEvidence:physical}),/revision/);
 const broken=A();broken.data.faces.pop();
 const unsupported=auditUnionPhysicalFeatureJunctions({
  geometry:[broken,far()],revision});
 assert.equal(auditProjectedSourceOverlapDepth({
  geometry:[broken,far()],revision,
  physicalJunctionEvidence:unsupported
 }).status,'not-covered');
});
test('M5 C2 generated features remain unsigned in actual final V5 per-action gate after full overlap-depth proof',()=>{
 const geometry=[A(),far()],revision=75;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const r=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 assert.equal(r.projectedSourceOverlapDepthEvidence.status,
  'full-analytic-listed-source-pair-overlap-depth');
 assert.ok(r.comparedProjectedSourceOverlapCount>0);
 assert.ok(r.fullySortedProjectedSourceOverlapCount>0);
 assert.equal(r.projectedSourceOverlapDepthEvidence.signedV5LineActions,0);
 assert.equal(r.signedCount,0);
 assert.equal(r.v5Ready,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.ok(r.spans.every(s=>s.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/comparedProjectedSourceOverlapCount/);
 assert.match(ui,/fullySortedProjectedSourceOverlapCount/);
 assert.match(ui,/coincidentDepthSourceFeaturePairCount/);
 assert.match(ui,/unresolvedProjectedSourcePairDepthCount/);
 assert.match(ui,/只针对两条已列出的来源线/);
 assert.match(ui,/不能发布实线\/虚线/);
});
