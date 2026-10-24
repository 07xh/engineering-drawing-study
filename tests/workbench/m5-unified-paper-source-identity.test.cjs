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
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const pt=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',pt(0,0,0),pt(10,10,10));
const B=()=>box('B',pt(5,5,5),pt(15,15,15));
function audit(geometry,revision=71){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const m4=partitionReviewedSourceEdges({geometry,revision,
  sceneDepthEvidence:scene});
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
 const source=auditUnifiedPaperSourceIdentity({geometry,revision,
  projectedStrokePartitions:m4,generatedSubspanRayEvidence:rays,
  unifiedProjectedFeatureEventEvidence:unified});
 return {m4,rays,unified,source};
}
test('M5 one canonical paper-source registry accounts for ALL original and newly generated projected subspans',()=>{
 const {unified,source:r}=audit([A(),B()]);
 assert.equal(r.status,'source-traced-canonical-projected-open-interval-registry');
 assert.ok(r.paperIntervalCount>0);
 assert.equal(r.allCandidatePiecesRetained,true);
 assert.equal(r.inputEventPartitionedCandidateCount,unified.subspans.length);
 assert.equal(r.groups.reduce((n,g)=>n+g.sourceMultiplicity,0),
  unified.subspans.length);
 assert.equal(r.fullGlobalProjectedUnionAndOpaqueFaceCompletenessVerified,false);
 assert.equal(r.fullEngineeringStandardLineRuleVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 assert.ok(Object.isFrozen(r.groups));
 for(const g of r.groups){
  assert.ok(['V','H','W'].includes(g.view));
  assert.ok(g.sourceMultiplicity>=1);
  assert.equal(g.exactPaperLineCandidateGroupVerified,true);
  assert.equal(g.soleFinalDrawingSourceForThisPaperSegmentCertified,false);
  assert.equal(g.completeOccluderFaceAndProjectedJunctionProofVerified,false);
  assert.equal(g.applicableEngineeringLineStyle,'undetermined');
  assert.equal(g.formalConstructionIntentDAGAndV5Approved,false);
  for(const row of g.sourceSubspans){
   assert.equal(row.source3DAndFirstAnglePaperCoordinatesVerified,true);
   assert.ok(['original-physical-crease','generated-two-face-crease'].includes(row.kind));
  }
  for(const pair of g.physical3DPairwiseDepthAndDuplicates){
   assert.equal(pair.approvedEngineeringStyle,false);
   assert.equal(pair.sourceLineDedupAndWholeOpaqueFaceOcclusionVerified,false);
   assert.equal(pair.authentic3DSourceCoordinatesVerified,true);
  }
 }
});
test('M5 different real 3D depths with identical W paper interval can order LISTED sources but NOT approve visible line',()=>{
 const {source:r}=audit([A(),
  box('B',pt(30,0,0),pt(40,10,10))],72);
 const groups=r.groups.filter(g=>g.view==='W'&&g.sourceMultiplicity>1);
 assert.ok(groups.length>0);
 assert.ok(groups.some(g=>g.relativeNearestListed3DSourceLineVerified));
 assert.ok(groups.every(g=>
  g.soleFinalDrawingSourceForThisPaperSegmentCertified===false));
 assert.ok(groups.some(g=>g.physical3DPairwiseDepthAndDuplicates.some(p=>
  p.wholePairRelativeDepthStatus.startsWith('source-'))));
 assert.equal(r.officialLineStylesVerified,false);
});
test('M5 identical opaque cuboids have duplicate SAME 3D paper line sources requiring final dedup, NOT two authorized V5 strokes',()=>{
 const {source:r}=audit([A(),
  box('B',pt(0,0,0),pt(10,10,10))],73);
 assert.ok(r.physicallyDuplicatedSourceIntervalCount>0);
 assert.ok(r.groups.some(g=>g.repeatedIdenticalReal3DSourceFeature));
 for(const g of r.groups.filter(x=>x.repeatedIdenticalReal3DSourceFeature)){
  assert.ok(g.sourceMultiplicity>=2);
  assert.ok(g.physical3DPairwiseDepthAndDuplicates.some(p=>
   p.wholePairRelativeDepthStatus==='duplicate-same-3d-source'));
  assert.equal(g.soleFinalDrawingSourceForThisPaperSegmentCertified,false);
 }
 assert.equal(r.signedV5LineActions,0);
});
test('M5 third body burial causes no fake final official line style in the new original/generated paper groups',()=>{
 const geometry=[A(),B(),
  box('C',pt(9,4,6),pt(11,6,8))];
 const {source:r}=audit(geometry,74);
 assert.ok(r.paperIntervalCount>0);
 assert.ok(r.groups.every(g=>
  g.applicableEngineeringLineStyle==='undetermined'));
 assert.ok(r.groups.every(g=>!g.soleFinalDrawingSourceForThisPaperSegmentCertified));
 assert.equal(r.signedV5LineActions,0);
});
test('M5 forged current source intervals and counterfeit authorization are rejected',()=>{
 const geometry=[A(),B()],revision=75;
 const {m4,rays,unified}=audit(geometry,revision);
 const args={geometry,revision,projectedStrokePartitions:m4,
  generatedSubspanRayEvidence:rays,
  unifiedProjectedFeatureEventEvidence:unified};
 assert.throws(()=>auditUnifiedPaperSourceIdentity({...args,revision:-1}),/revision/);
 assert.throws(()=>auditUnifiedPaperSourceIdentity({...args,
  unifiedProjectedFeatureEventEvidence:{...unified,signedV5LineActions:1}
 }),/current original\/new unified/);
 assert.throws(()=>auditUnifiedPaperSourceIdentity({...args,
  unifiedProjectedFeatureEventEvidence:{...unified,
   subspans:unified.subspans.slice(1)}
 }),/current original\/new unified/);
 assert.throws(()=>auditUnifiedPaperSourceIdentity({...args,
  projectedStrokePartitions:{...m4,generatedStrokeSignedCount:1}
 }),/only unsigned original M4/);
});
test('M5 official per-action review receives canonical physical/paper source grouping without drawing a line',()=>{
 const geometry=[A(),B()],revision=76;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const r=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 assert.equal(r.unifiedPaperSourceIdentityEvidence.status,
  'source-traced-canonical-projected-open-interval-registry');
 assert.equal(r.unifiedPaperIntervalCount,
  r.unifiedPaperSourceIdentityEvidence.paperIntervalCount);
 assert.equal(r.unifiedCoProjectedMultipleSourceIntervalCount,
  r.unifiedPaperSourceIdentityEvidence.coProjectedMultiSourceIntervalCount);
 assert.equal(r.unifiedPhysicallyDuplicatedSourceIntervalCount,
  r.unifiedPaperSourceIdentityEvidence.physicallyDuplicatedSourceIntervalCount);
 assert.equal(r.unifiedPaperSourceIdentityEvidence.signedV5LineActions,0);
 assert.equal(r.signedCount,0);
 assert.equal(r.v5Ready,false);
 assert.ok(r.spans.every(s=>s.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/unifiedPaperIntervalCount/);
 assert.match(ui,/unifiedCoProjectedMultipleSourceIntervalCount/);
 assert.match(ui,/unifiedPhysicallyDuplicatedSourceIntervalCount/);
 assert.match(ui,/unifiedLocallyFrontListedSourceIntervalCount/);
 assert.match(ui,/不代表独立证明最终唯一可绘图来源/);
});
