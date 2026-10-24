'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh,createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const {newProject,createCoordinator}=
 require('../../project/project-coordinator.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const q=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const one=()=>box('A',q(0,0,0),q(20,12,9));
const pair=()=>box('B',q(20,3,0),q(32,12,9));
function audit(geometry,revision=11){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 return {scene,result:inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene})};
}
test('M5 one confirmed convex solid: every candidate joins all source depth/contour/junction obligations',()=>{
 const {scene,result:r}=audit([one()]);
 assert.equal(r.status,'per-source-span-proof-obligations-audited');
 assert.equal(r.revision,11);
 assert.equal(r.spanCount,scene.projectedStrokePartitions.segmentCount);
 assert.equal(r.originalSourceCutpointCount,r.spanCount*2);
 assert.equal(r.signedCount,0);
 assert.equal(r.blockedCount,r.spanCount);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.v5Ready,false);
 assert.ok(r.spanCount>0);
 assert.ok(Object.isFrozen(r.spans));
 for(const [index,x] of r.spans.entries()){
  const src=scene.projectedStrokePartitions.segments[index];
  assert.equal(x.index,index);
  assert.equal(x.sourceEdgeId,src.sourceEdgeId);
  assert.equal(x.view,src.view);
  assert.equal(x.sourceGeometryId,'A');
  assert.deepEqual(x.sourceParameterRange,src.sourceParameterRange);
  assert.equal(x.authorizedStyle,'undetermined');
  assert.equal(x.officialV5ActionReleaseApproved,false);
  assert.equal(x.finalContourAndStandardLineStyleVerified,false);
  assert.ok(x.missingProofs.includes(
   'independent-m3-final-answer-geometry-and-feature-semantics'));
  assert.ok(x.missingProofs.includes(
   'applicable-engineering-standard-solid-dashed-complete-line'));
  assert.ok(x.missingProofs.includes(
   'signed-canonical-construction-order-and-single-v5-action'));
  if(x.localPositiveOuterGeometryCandidate){
   assert.equal(x.visibleOpenRayCertified,true);
   assert.equal(x.fullUnionOpenBoundaryCoverage,true);
   assert.equal(x.uniqueFrontmostOpenContourCoverage,true);
   assert.equal(x.original3DCutpointIncidenceVerified,true);
   assert.equal(x.originalEndpointPositiveObserverRaysVerified,true);
   assert.equal(x.localProjectedSourceJunctionCandidatesVerified,true);
  }
  if(x.hiddenDepthEvidenceCandidate){
   assert.equal(x.strictlyOccludedOpenRayCertified,true);
   assert.equal(x.original3DCutpointIncidenceVerified,true);
  }
 }
});
test('M5 touching two-body scene rejects screen-overlap as true final feature line',()=>{
 const {scene,result:r}=audit([one(),pair()],13);
 assert.equal(r.spanCount,scene.projectedStrokePartitions.segmentCount);
 assert.equal(r.signedCount,0);
 assert.equal(r.v5Ready,false);
 assert.ok(r.spanCount>0);
 assert.ok(r.spans.every(x=>x.authorizedStyle==='undetermined'));
 assert.ok(r.spans.every(x=>x.officialV5ActionReleaseApproved===false));
 assert.ok(r.spans.some(x=>x.unresolvedProjectedIntersectionOrTangency||
  !x.localProjectedSourceJunctionCandidatesVerified||
  !x.fullUnionOpenBoundaryCoverage));
});
test('M5 overlapping boxes retain full 3D source identities and never sign an invisible seam',()=>{
 const other=box('B',q(7,3,2),q(25,17,11));
 const {result:r}=audit([one(),other],14);
 assert.ok(r.spanCount>0);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedCount,0);
 assert.ok(r.spans.every(x=>x.missingProofs.includes(
  'global-multibody-depth-sorted-final-feature-contour')));
});
test('M5 current source modifications and revised math invalidate old source-signed claims',()=>{
 const first=audit([one()],3).result;
 const second=audit([box('A',q(-2,0,0),q(25,12,9))],4).result;
 assert.equal(first.revision,3);
 assert.equal(second.revision,4);
 assert.equal(first.signedCount,0);
 assert.equal(second.signedCount,0);
 assert.notDeepEqual(first.spans[0],second.spans[0]);
});
test('M5 forged union, M4 split list or true final V5 readiness is rejected',()=>{
 const geometry=[one()],revision=5;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const forged={...scene,projectedUnionOutlines:{
  ...scene.projectedUnionOutlines,officialLineStylesVerified:true}};
 assert.throws(()=>inspectFinalSourceStrokeObligations({
  geometry,revision,sceneDepthEvidence:forged}),/stale or unsupported/);
 const partition={...scene,projectedStrokePartitions:{
  ...scene.projectedStrokePartitions,segmentCount:0}};
 assert.throws(()=>inspectFinalSourceStrokeObligations({
  geometry,revision,sceneDepthEvidence:partition}),/stale or unsupported|cutpoints|untrusted or stale source stroke partition/);
 assert.equal(inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:{...scene,revision:revision-1}}).status,'not-covered');
 assert.equal(inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:{...scene,v5Ready:true}}).status,'not-covered');
 assert.throws(()=>inspectFinalSourceStrokeObligations({
  geometry,revision:-1}),/revision/);
});
test('M5 actual V7 composition source action gate consumes exact candidates but signs zero',()=>{
 const c=createCoordinator(newProject({id:'M5ReleaseProof',task:'composition'}));
 const session=createUnifiedProjectSession();c.attachSolver(session);
 for(const mesh of [one(),pair()]){
  c.putObject({id:mesh.id,kind:'solid',spatialId:mesh.id+'_3D',
   projections:{V:[mesh.id+'_V'],H:[mesh.id+'_H'],W:[mesh.id+'_W']}});
  c.putCondition({id:'source_'+mesh.id,objectId:mesh.id,sourceCandidateId:null,
   confirmed:false,value:{type:'manual-geometry',unit:'mm',
    imageId:c.snapshot().source.imageId,geometry:mesh}});
  c.confirmCondition('source_'+mesh.id);
 }
 const result=session.solve();
 const gate=result.spatialV5ActionRelease;
 assert.equal(gate.status,'all-actions-held-evidence-incomplete');
 assert.equal(gate.signedCount,0);
 assert.equal(gate.singleV5Ready,false);
 assert.equal(gate.finalStrokeObligations.spanCount,gate.actionCount);
 for(const action of gate.actions){
  assert.equal(action.authorizedLineStyle,'undetermined');
  assert.equal(action.actionReleaseStatus,'blocked');
  assert.equal(action.independentFinalSourceContourDepthJunctionEvidence.
   officialV5ActionReleaseApproved,false);
  assert.ok(action.missingProofs.some(s=>s.startsWith('source:')));
 }
 assert.equal(result.verified,false);
 assert.equal(result.plan,null);
 assert.equal(result.clock,null);
 assert.equal(c.canExport(),false);
 c.deleteObject('B');
 assert.equal(session.readSnapshot(),null);
 session.dispose();c.dispose();
});
