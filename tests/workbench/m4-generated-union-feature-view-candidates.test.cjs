'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project,VIEWS}=require('../../core/projection/conventions.js');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {partitionReviewedSourceEdges}=
 require('../../workbench/scoped-projected-stroke-partition.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const first=()=>box('A',P(0,0,0),P(10,10,10));
const other=()=>box('B',P(5,5,5),P(15,15,15));
function audit(geometry,revision=30){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const partition=partitionReviewedSourceEdges({geometry,revision,
  sceneDepthEvidence:scene});
 const release=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 return {scene,partition,release};
}
test('M4 newly generated six concave 3D union lines yield exactly twelve NONCOLLAPSED first-angle view candidates',()=>{
 const {scene,partition:m,release:r}=audit([first(),other()]);
 assert.equal(m.status,'preview-partition-evidence-only');
 assert.equal(m.generatedUnionCreaseEvidence.certifiedNewConcaveOpenCount,6);
 assert.equal(m.generatedProjectedCandidateCount,12);
 assert.equal(m.generatedProjectedCollapsedCount,6);
 assert.equal(m.generatedSegments.length,12);
 assert.equal(m.generatedStrokeSignedCount,0);
 assert.equal(r.generatedSource3DOpenCandidateCount,6);
 assert.equal(r.generatedM4ProjectedCandidateCount,12);
 assert.equal(r.generatedM4ProjectionCollapseCount,6);
 assert.equal(r.generatedSourceStrokeActionCount,0);
 assert.equal(r.generatedSourceStrokeSignedCount,0);
 assert.equal(r.signedCount,0);
 assert.equal(r.v5Ready,false);
 assert.equal(m.segmentCount,scene.projectedStrokePartitions.segmentCount);
 assert.ok(Object.isFrozen(m.generatedSegments));
 for(const candidate of m.generatedSegments){
  assert.ok(VIEWS.includes(candidate.view));
  assert.equal(candidate.originalSourceMeshEdgeId,null);
  assert.equal(candidate.localGeneratedUnionConcaveGeometryVerified,true);
  assert.deepEqual(candidate.projectedFromModelMm,
   project(candidate.source3DFrom)[candidate.view]);
  assert.deepEqual(candidate.projectedToModelMm,
   project(candidate.source3DTo)[candidate.view]);
  assert.equal(candidate.officialEngineeringLineStyle,'undetermined');
  assert.equal(candidate.canonicalIntentAndV5LineStepApproved,false);
  assert.equal(candidate.completeProjectiveJunctionsVerified,false);
  assert.equal(candidate.originalSourceMeshVertexInferred,false);
  assert.equal(candidate.independentSolidForwardRayStatuses.length,2);
  assert.equal(candidate.wholeOpenSourceForwardRayClearVerified&&
   candidate.wholeSourceStrictlyOccludedVerified,false);
 }
});
test('M4 generated face intersection clipped by third source remains source-separated and skips its BURIED middle',()=>{
 const geometry=[first(),other(),
  box('C',P(9,4,6),P(11,6,8))];
 const {partition:m,release:r}=audit(geometry,31);
 const sources=m.generatedUnionCreaseEvidence.segments.filter(s=>
  s.sourceGeometryIds.join(',')==='A,B'&&s.sourceAxis==='z'&&
  s.sourceFacePlanes[0].axis==='x'&&
  s.sourceFacePlanes[1].axis==='y');
 assert.deepEqual(sources.map(s=>s.sourceParameterOpenRangeMm),
  [[5,6],[6,8],[8,10]]);
 assert.equal(sources[1].positiveNewFeatureBuriedVerified,true);
 const active=m.generatedSegments.filter(s=>
  sources.some(e=>e.id===s.sourceGeneratedFeatureId));
 assert.equal(active.length,4);
 assert.deepEqual([...new Set(active.map(s=>
  s.sourceParameterOpenRangeMm.join(':')))].sort(),['5:6','8:10']);
 assert.ok(active.every(s=>s.localGeneratedUnionConcaveGeometryVerified));
 assert.ok(active.every(s=>s.canonicalIntentAndV5LineStepApproved===false));
 assert.equal(r.generatedSourceStrokeSignedCount,0);
 assert.equal(r.v5Ready,false);
});
test('M4 face contact has no newly generated true transverse face intersections to draw',()=>{
 const {partition:m,release:r}=audit([first(),
  box('B',P(10,0,0),P(20,10,10))],32);
 assert.equal(m.generatedProjectedCandidateCount,0);
 assert.equal(m.generatedProjectedCollapsedCount,0);
 assert.equal(r.generatedM4ProjectedCandidateCount,0);
 assert.equal(r.signedCount,0);
});
test('M4 geometry edits get a distinct source revision and no reused valid standard stroke signature',()=>{
 const a=audit([first(),other()],33);
 const b=audit([first(),
  box('B',P(4,5,5),P(15,15,15))],34);
 assert.equal(a.partition.revision,33);
 assert.equal(b.partition.revision,34);
 assert.equal(a.release.generatedSourceStrokeSignedCount,0);
 assert.equal(b.release.generatedSourceStrokeSignedCount,0);
 assert.notDeepEqual(
  a.partition.generatedUnionCreaseEvidence.segments.map(s=>({
   sourceId:s.id,from:s.source3DFrom,to:s.source3DTo
  })),
  b.partition.generatedUnionCreaseEvidence.segments.map(s=>({
   sourceId:s.id,from:s.source3DFrom,to:s.source3DTo
  }))
 );
});
test('M4 new candidate source proof cannot mint original source edge ID or actual line styles',()=>{
 const {partition:m,release:r}=audit([first(),other()],35);
 assert.ok(m.generatedSegments.every(s=>
  s.sourceGeneratedFeatureId.startsWith('new:')));
 assert.ok(m.generatedSegments.every(s=>
  s.sourceGeometryIds.length===2&&s.originalSourceMeshEdgeId===null));
 assert.ok(m.generatedSegments.every(s=>
  s.rayClassification==='undetermined'||
  s.rayClassification==='strictly-occluded-by-reviewed-volume'||
  s.rayClassification==='forward-ray-clear-over-reviewed-solids'));
 assert.equal(r.generatedSourceStrokeActionCount,0);
 assert.equal(r.officialLineStylesVerified,false);
});
test('V7 generated feature evidence distinguishes 3D geometry count from first-angle M4 rays and V5 signoff',()=>{
 const text=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(text,/generatedM4ProjectedCandidateCount/);
 assert.match(text,/generatedM4ProjectionCollapseCount/);
 assert.match(text,/generatedM4ForwardRayClearCount/);
 assert.match(text,/generatedM4StrictlyOccludedCount/);
 assert.match(text,/新生线正式 V5 动作为 0/);
});
