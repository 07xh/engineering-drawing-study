'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {partitionReviewedSourceEdges}=
 require('../../workbench/scoped-projected-stroke-partition.cjs');
const {auditUnionPhysicalFeatureJunctions}=
 require('../../workbench/m5-union-physical-feature-junctions.cjs');
const {auditProjectedSourceOverlapDepth}=
 require('../../workbench/m5-union-projected-overlap-depth.cjs');
const {auditGeneratedViewEndpointIncidence}=
 require('../../workbench/m5-generated-view-endpoint-incidence.cjs');
const {auditGeneratedStrokeOverlapPartitions}=
 require('../../workbench/m5-generated-stroke-overlap-partitions.cjs');
const {auditGeneratedOpenSubspanOpaqueRays}=
 require('../../workbench/m5-generated-open-subspan-opaque-rays.cjs');
const {auditUnifiedProjectedFeatureEvents}=
 require('../../workbench/m5-unified-projected-feature-events.cjs');
const {auditUnifiedPaperSourceIdentity}=
 require('../../workbench/m5-unified-paper-source-identity.cjs');
const {auditUnifiedPaperJunctions}=
 require('../../workbench/m5-unified-paper-junctions.cjs');
const {auditUnifiedPaperLineReadiness}=
 require('../../workbench/m5-unified-paper-line-readiness.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',P(0,0,0),P(10,10,10));
const B=()=>box('B',P(5,5,5),P(15,15,15));
function audit(geometry,revision=117){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const m4=partitionReviewedSourceEdges({geometry,revision,sceneDepthEvidence:scene});
 const physical=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const depth=auditProjectedSourceOverlapDepth({geometry,revision,
  physicalJunctionEvidence:physical});
 const ends=auditGeneratedViewEndpointIncidence({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical});
 const partition=auditGeneratedStrokeOverlapPartitions({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical,
  projectedOverlapDepthEvidence:depth,generatedProjectedEndpointEvidence:ends});
 const rays=auditGeneratedOpenSubspanOpaqueRays({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical,
  projectedOverlapDepthEvidence:depth,generatedProjectedEndpointEvidence:ends,
  generatedOverlapPartitionEvidence:partition});
 const unified=auditUnifiedProjectedFeatureEvents({geometry,revision,
  projectedStrokePartitions:m4,generatedSubspanRayEvidence:rays});
 const paper=auditUnifiedPaperSourceIdentity({geometry,revision,
  projectedStrokePartitions:m4,generatedSubspanRayEvidence:rays,
  unifiedProjectedFeatureEventEvidence:unified});
 const nodes=auditUnifiedPaperJunctions({geometry,revision,
  projectedStrokePartitions:m4,generatedSubspanRayEvidence:rays,
  unifiedProjectedFeatureEventEvidence:unified,
  unifiedPaperSourceIdentityEvidence:paper});
 const args={geometry,revision,projectedStrokePartitions:m4,
  generatedSubspanRayEvidence:rays,
  unifiedProjectedFeatureEventEvidence:unified,
  unifiedPaperSourceIdentityEvidence:paper,
  unifiedPaperJunctionEvidence:nodes};
 return {args,paper,nodes,proof:auditUnifiedPaperLineReadiness(args)};
}
test('C2 M5 every real old/new paper interval receives source, full-ray, 3D endpoints and an explicit official V5 blocker list',()=>{
 const {proof:r,paper,nodes}=audit([A(),B()]);
 assert.equal(r.status,'per-paper-interval-final-stroke-proof-blockers');
 assert.equal(r.paperIntervalCount,paper.paperIntervalCount);
 assert.equal(r.lines.length,paper.groups.length);
 assert.ok(r.paperIntervalCount>0);
 assert.equal(r.allReviewedSourcePaperOpenIntervalsHaveExplicitBlockers,true);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 assert.ok(Object.isFrozen(r.lines));
 for(const line of r.lines){
  assert.ok(['V','H','W'].includes(line.view));
  assert.equal(line.physical3DEndpointIncidence.length,2);
  assert.equal(line.officialEngineeringSolidDashedStyle,'undetermined');
  assert.equal(line.formalV5StrokeSigned,false);
  assert.equal(line.positiveGlobalFinalContourCompletenessVerified,false);
  assert.ok(line.missingProofObligations.includes(
   'global-complete-boolean-exterior-and-final-paper-contour'));
  assert.ok(line.missingProofObligations.includes(
   'applicable-engineering-line-style-standard'));
  assert.ok(line.missingProofObligations.includes(
   'single-v5-construction-intent-dag-and-action-parity'));
  const source=paper.groups.find(p=>p.id===line.paperGroupId);
  assert.ok(source);
  assert.equal(line.nearestListed3DSourceOnlyVerified,
   source.relativeNearestListed3DSourceLineVerified);
  for(const endpoint of line.physical3DEndpointIncidence){
   const node=nodes.paperNodes.find(n=>n.id===endpoint.physicalPaperNodeId);
   assert.ok(node);
   assert.deepEqual(node.paperCoordinateMm,endpoint.projectedModelMm);
   assert.equal(endpoint.physical3DEndpointJoinAndDrawingLinecapCertified,false);
   if(line.selectedListed3DSourceSubspanId)
    assert.equal(endpoint.genuineSelectedSource3DIncidenceVerified,true);
  }
  assert.equal(line.selectedSourceWholeOpenRayClearVerified&&
   line.selectedSourceWholeOpenRayStrictlyOccludedVerified,false);
 }
});
test('C2 spatially disjoint solids sharing W projection remain separately sourced, never physically joined or drawn',()=>{
 const r=audit([A(),box('B',P(30,0,0),P(40,10,10))],118).proof;
 assert.ok(r.nonuniqueSourceGroupCount>0);
 assert.ok(r.lines.some(x=>x.view==='W'&&
  x.missingProofObligations.includes(
   'unique-frontmost-authentic-3d-source-not-proven')));
 assert.ok(r.lines.every(x=>x.officialEngineeringSolidDashedStyle==='undetermined'));
 assert.equal(r.signedV5LineActions,0);
});
test('C2 positive-volume third body changes source incidence without accidentally inheriting approved style',()=>{
 const r=audit([A(),B(),
  box('C',P(9,4,6),P(11,6,8))],119).proof;
 assert.ok(r.paperIntervalCount>0);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 assert.ok(r.lines.every(line=>line.missingProofObligations.length>=5));
});
test('C2 same source plane in full face contact cannot create approved internal seam or official hidden line',()=>{
 const r=audit([A(),box('B',P(10,0,0),P(20,10,10))],120).proof;
 assert.ok(r.paperIntervalCount>0);
 assert.equal(r.signedV5LineActions,0);
 assert.ok(r.lines.every(line=>line.officialEngineeringSolidDashedStyle==='undetermined'));
});
test('C2 source-junction forgery, ray authority forgery and stale source revision all fail closed',()=>{
 const {args}=audit([A(),B()],121);
 assert.throws(()=>auditUnifiedPaperLineReadiness({...args,revision:-1}),/revision/);
 assert.throws(()=>auditUnifiedPaperLineReadiness({...args,
  unifiedPaperJunctionEvidence:{
   ...args.unifiedPaperJunctionEvidence,signedV5LineActions:1}
 }),/stale or spoofed/);
 assert.throws(()=>auditUnifiedPaperLineReadiness({...args,
  unifiedPaperSourceIdentityEvidence:{
   ...args.unifiedPaperSourceIdentityEvidence,
   officialLineStylesVerified:true}
 }),/stale or spoofed/);
 assert.throws(()=>auditUnifiedPaperLineReadiness({...args,
  unifiedPaperSourceIdentityEvidence:{
   ...args.unifiedPaperSourceIdentityEvidence,groups:
    args.unifiedPaperSourceIdentityEvidence.groups.slice(1)}
 }),/stale or spoofed/);
});
test('C2 real source M5 → current sole V5 release gate reports per-line blockers and zero official actions',()=>{
 const geometry=[A(),B()],revision=122;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const r=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 const proof=r.unifiedPaperLineReadinessEvidence;
 assert.equal(proof.status,'per-paper-interval-final-stroke-proof-blockers');
 assert.equal(r.paperStrokeScopedClearSourceCount,
  proof.scopedClearFrontRayCandidateCount);
 assert.equal(r.paperStrokeScopedOpaqueSourceCount,
  proof.scopedOpaqueFrontRayCandidateCount);
 assert.equal(r.paperStrokeNonuniqueSourceCount,
  proof.nonuniqueSourceGroupCount);
 assert.equal(r.paperStrokeDepthAliasEndpointCount,
  proof.depthAliasEndpointLineCount);
 assert.equal(proof.signedV5LineActions,0);
 assert.equal(r.generatedSourceStrokeSignedCount,0);
 assert.equal(r.signedCount,0);
 assert.equal(r.v5Ready,false);
 assert.ok(r.spans.every(s=>s.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/paperStrokeScopedClearSourceCount/);
 assert.match(ui,/paperStrokeScopedOpaqueSourceCount/);
 assert.match(ui,/paperStrokeNonuniqueSourceCount/);
 assert.match(ui,/paperStrokeDepthAliasEndpointCount/);
 assert.match(ui,/以上都未签发标准虚实线和正式 V5/);
});
