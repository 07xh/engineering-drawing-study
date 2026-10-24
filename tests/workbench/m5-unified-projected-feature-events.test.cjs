'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
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
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',P(0,0,0),P(10,10,10));
const B=()=>box('B',P(5,5,5),P(15,15,15));
function audit(geometry,revision=91){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const m4=partitionReviewedSourceEdges({geometry,revision,sceneDepthEvidence:scene});
 const physical=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const depth=auditProjectedSourceOverlapDepth({geometry,revision,
  physicalJunctionEvidence:physical});
 const ends=auditGeneratedViewEndpointIncidence({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical});
 const partition=auditGeneratedStrokeOverlapPartitions({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical,
  projectedOverlapDepthEvidence:depth,
  generatedProjectedEndpointEvidence:ends});
 const rays=auditGeneratedOpenSubspanOpaqueRays({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical,
  projectedOverlapDepthEvidence:depth,
  generatedProjectedEndpointEvidence:ends,
  generatedOverlapPartitionEvidence:partition});
 return {scene,m4,physical,depth,ends,partition,rays,
  union:auditUnifiedProjectedFeatureEvents({geometry,revision,
   projectedStrokePartitions:m4,generatedSubspanRayEvidence:rays})};
}
test('M5 C2 old source edges AND new source-face intersections share one current V/H/W event ledger and remain unsigned',()=>{
 const {m4,rays,union:r}=audit([A(),B()]);
 assert.equal(r.status,'reviewed-original-and-generated-paper-event-candidates');
 assert.ok(r.originalSourceCandidateCount>0);
 assert.ok(r.generatedSourceCandidateCount>0);
 assert.equal(r.originalSourceCandidateCount+r.generatedSourceCandidateCount,
  r.candidateCount);
 assert.ok(r.generatedSourceCandidateCount<=rays.pieceCount);
 assert.ok(r.eventCount>0);
 assert.ok(r.partitionedOpenSubspanCount>=r.candidateCount);
 assert.equal(r.firstAngleProjectedGeometrySourceAccountedFor,true);
 assert.equal(r.projectedDuplicateResolutionAndFinalSourceUniquenessVerified,false);
 assert.equal(r.allRelevantFinalOutlineFeaturesProvenComplete,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 assert.ok(Object.isFrozen(r.subspans));
 const known=new Set(r.candidates.map(c=>c.id));
 for(const c of r.candidates){
  assert.ok(['V','H','W'].includes(c.view));
  assert.equal(c.verifiedUnionExteriorOpenFeature,true);
  assert.deepEqual(c.from2D,project(c.from3D)[c.view]);
  assert.deepEqual(c.to2D,project(c.to3D)[c.view]);
  assert.equal(c.officialEngineeringLineStyle,'undetermined');
  assert.equal(c.formalV5ActionAuthorized,false);
  if(c.kind==='generated-two-face-crease'){
   assert.equal(c.sourceEdgeId,null);
   assert.ok(c.generatedSourceFeatureId.startsWith('new:'));
  }else{
   assert.ok(c.sourceEdgeId.startsWith('A::')||
    c.sourceEdgeId.startsWith('B::'));
   assert.equal(c.generatedSourceFeatureId,null);
  }
 }
 for(const x of r.events){
  assert.equal(x.officialV5ActionAuthorized,false);
  assert.equal(x.standardLineStyleApproved,false);
  assert.ok(x.candidateIds.every(id=>known.has(id)));
  if(x.kind==='projected-interior-crossing'){
   assert.equal(x.paperCoincidenceCannotAuthorizePhysicalJoin,true);
   assert.equal(x.completeStrokeDepthOrderingVerified,false);
  }else if(x.kind==='projected-collinear-positive-overlap'){
   assert.equal(x.projectedDuplicatesResolvedAndUnique,false);
   assert.equal(x.frontmostOpaqueFaceVerified,false);
  }
 }
 for(const e of r.subspans){
  const src=r.candidates.find(c=>c.id===e.sourceCandidateId);
  assert.ok(src);
  assert.deepEqual(e.projectedFromModelMm,project(e.source3DFrom)[e.view]);
  assert.deepEqual(e.projectedToModelMm,project(e.source3DTo)[e.view]);
  assert.equal(e.authorizedEngineeringLineStyle,'undetermined');
  assert.equal(e.canonicalIntentStepAndV5Approved,false);
  assert.equal(e.uniqueFinalProjectedStrokeProven,false);
  assert.equal(e.fullSceneOpaqueVolumeAndJunctionsVerified,false);
 }
 assert.equal(m4.v5Ready,false);
});
test('M5 two spatially disjoint boxes overlap only on W paper: NEVER invent a physical joint or canonical V5',()=>{
 const {union:r}=audit([A(),box('B',P(30,0,0),P(40,10,10))],92);
 assert.equal(r.generatedSourceCandidateCount,0);
 const alias=r.events.filter(e=>e.view==='W'&&
  e.kind==='projected-collinear-positive-overlap'&&
  e.candidateIds.map(id=>r.candidates.find(c=>c.id===id).sourceGeometryIds[0]).join('|')==='A|B');
 assert.ok(alias.length>0);
 assert.ok(alias.every(e=>e.physicallyCoincidentEntireOverlapVerified===false));
 assert.ok(alias.every(e=>e.projectedDuplicatesResolvedAndUnique===false));
 assert.equal(r.signedV5LineActions,0);
});
test('M5 volume overlap with third body carries real remaining old/new source candidates, without a false unique final stroke',()=>{
 const {union:r}=audit([A(),B(),
  box('C',P(9,4,6),P(11,6,8))],93);
 assert.ok(r.generatedSourceCandidateCount>0);
 assert.ok(r.originalSourceCandidateCount>0);
 assert.equal(r.partitionedOpenSubspanCount>=r.candidateCount,true);
 assert.equal(r.projectedDuplicateResolutionAndFinalSourceUniquenessVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
});
test('M5 full face join cannot reintroduce internal original source seams or invented new source feature',()=>{
 const {union:r}=audit([A(),
  box('B',P(10,0,0),P(20,10,10))],94);
 assert.equal(r.generatedSourceCandidateCount,0);
 assert.ok(r.originalSourceCandidateCount>0);
 assert.ok(r.candidates.every(c=>c.kind==='original-physical-crease'));
 assert.equal(r.allRelevantFinalOutlineFeaturesProvenComplete,false);
 assert.equal(r.signedV5LineActions,0);
});
test('M5 source review blocks forged M4 vertex coordinates, fake proof flags and fabricated generated ray parent',()=>{
 const geometry=[A(),B()],revision=95;
 const {m4,rays}=audit(geometry,revision);
 const baseline={geometry,revision,projectedStrokePartitions:m4,
  generatedSubspanRayEvidence:rays};
 assert.throws(()=>auditUnifiedProjectedFeatureEvents({
  ...baseline,revision:-1}),/current revision/);
 assert.throws(()=>auditUnifiedProjectedFeatureEvents({...baseline,
  projectedStrokePartitions:{...m4,officialLineStylesVerified:true}
 }),/unsigned original M4/);
 const changed=m4.segments.map(s=>({...s}));
 changed[0]={...changed[0],fromModelMm:{
  ...changed[0].fromModelMm,x:changed[0].fromModelMm.x+0.25}};
 assert.throws(()=>auditUnifiedProjectedFeatureEvents({...baseline,
  projectedStrokePartitions:{...m4,segments:changed}
 }),/original M4 source endpoints/);
 const altered=rays.pieces.map(s=>({...s}));
 altered[0]={...altered[0],source3DFrom:{
  ...altered[0].source3DFrom,z:altered[0].source3DFrom.z+0.25}};
 assert.throws(()=>auditUnifiedProjectedFeatureEvents({...baseline,
  generatedSubspanRayEvidence:{...rays,pieces:altered}
 }),/authentic M4 parent/);
});
test('M5 real per-action gate includes unified geometry source events while all official V5 lines remain undetermined',()=>{
 const geometry=[A(),B()],revision=96;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const r=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 assert.equal(r.unifiedProjectedFeatureEventEvidence.status,
  'reviewed-original-and-generated-paper-event-candidates');
 assert.equal(r.unifiedProjectedOriginalCandidateCount,
  r.unifiedProjectedFeatureEventEvidence.originalSourceCandidateCount);
 assert.equal(r.unifiedProjectedGeneratedCandidateCount,
  r.unifiedProjectedFeatureEventEvidence.generatedSourceCandidateCount);
 assert.equal(r.unifiedProjectedEventSubspanCount,
  r.unifiedProjectedFeatureEventEvidence.partitionedOpenSubspanCount);
 assert.equal(r.unifiedProjectedFeatureEventEvidence.signedV5LineActions,0);
 assert.equal(r.generatedSourceStrokeSignedCount,0);
 assert.equal(r.signedCount,0);
 assert.equal(r.v5Ready,false);
 assert.ok(r.spans.every(s=>s.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/unifiedProjectedOriginalCandidateCount/);
 assert.match(ui,/unifiedProjectedGeneratedCandidateCount/);
 assert.match(ui,/unifiedProjectedCrossingEventCount/);
 assert.match(ui,/unifiedProjectedCollinearOverlapCount/);
 assert.match(ui,/unifiedProjectedEventSubspanCount/);
 assert.match(ui,/不证明最终唯一轮廓与标准线型/);
 assert.match(ui,/不能发布实线\/虚线/);
});
