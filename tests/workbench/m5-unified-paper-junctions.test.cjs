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
const {auditUnifiedPaperSourceIdentity}=
 require('../../workbench/m5-unified-paper-source-identity.cjs');
const {auditUnifiedPaperJunctions}=
 require('../../workbench/m5-unified-paper-junctions.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const pt=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',pt(0,0,0),pt(10,10,10));
const B=()=>box('B',pt(5,5,5),pt(15,15,15));
function audit(geometry,revision=81){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const m4=partitionReviewedSourceEdges({geometry,revision,sceneDepthEvidence:scene});
 const physical=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const depth=auditProjectedSourceOverlapDepth({geometry,revision,
  physicalJunctionEvidence:physical});
 const endpoints=auditGeneratedViewEndpointIncidence({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical});
 const overlap=auditGeneratedStrokeOverlapPartitions({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical,
  projectedOverlapDepthEvidence:depth,generatedProjectedEndpointEvidence:endpoints});
 const rays=auditGeneratedOpenSubspanOpaqueRays({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical,
  projectedOverlapDepthEvidence:depth,generatedProjectedEndpointEvidence:endpoints,
  generatedOverlapPartitionEvidence:overlap});
 const unified=auditUnifiedProjectedFeatureEvents({geometry,revision,
  projectedStrokePartitions:m4,generatedSubspanRayEvidence:rays});
 const paper=auditUnifiedPaperSourceIdentity({geometry,revision,
  projectedStrokePartitions:m4,generatedSubspanRayEvidence:rays,
  unifiedProjectedFeatureEventEvidence:unified});
 const args={geometry,revision,projectedStrokePartitions:m4,
  generatedSubspanRayEvidence:rays,
  unifiedProjectedFeatureEventEvidence:unified,
  unifiedPaperSourceIdentityEvidence:paper};
 return {args,unified,paper,node:auditUnifiedPaperJunctions(args)};
}
test('M5 C2 source 3D endpoints from both original and generated source lines create one V/H/W paper junction graph',()=>{
 const {unified,paper,node:r}=audit([A(),B()]);
 assert.equal(r.status,'real-source-reviewed-first-angle-paper-endpoint-incidence');
 assert.equal(r.registeredSourceOpenSubspanCount,unified.subspans.length);
 assert.equal(r.allSourceOpenLineEndpointIncidencesAccountedFor,true);
 assert.equal(r.endpointIncidenceCount,unified.subspans.length*2);
 assert.ok(r.nodeCount>0);
 assert.ok(r.physicallySharedEndpointNodeCount>0);
 assert.equal(r.entireFinalProjectedContourJunctionTopologyVerified,false);
 assert.equal(r.completeOpaqueFaceAndEngineeringLineStandardVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 assert.ok(Object.isFrozen(r.paperNodes));
 assert.ok(paper.paperIntervalCount>0);
 for(const n of r.paperNodes){
  assert.ok(['V','H','W'].includes(n.view));
  assert.equal(n.allSourceEdgePaperEndpointsIdentified,true);
  assert.equal(n.entireProjectedContourJunctionAndVisibilityVerified,false);
  assert.equal(n.officialLineStyle,'undetermined');
  assert.equal(n.canonicalIntentDAGAndV5EndpointAuthorized,false);
  assert.equal(n.incidentCount,n.incidentSourceEndpoints.length);
  assert.ok(n.distinctPhysical3DNodeCount>=1);
  for(const e of n.incidentSourceEndpoints){
   assert.deepEqual(project(e.real3DEndpoint)[n.view],n.paperCoordinateMm);
   assert.equal(e.exactSourceProjectionAndCurrentGeometryVerified,true);
   assert.equal(e.actualEngineeringStrokeEndpointSignedOff,false);
  }
  for(const pair of n.localPairwise3DJunctionRelations){
   assert.equal(pair.officialEngineeringLineJoinAuthorized,false);
   assert.equal(pair.actualGlobalPhysicalFeatureConnectionProven,false);
   assert.equal(pair.fullPaperContinuityAndOcclusionProven,false);
   if(pair.paperOnlyDepthAlias)
    assert.equal(pair.exactlySharedPhysical3DEndpoint,false);
  }
 }
});
test('M5 C2 spatially disjoint cuboids with same W projected endpoints remain separate real physical nodes',()=>{
 const {node:r}=audit([A(),
  box('B',pt(30,0,0),pt(40,10,10))],82);
 const paperAliases=r.paperNodes.filter(n=>n.view==='W'&&
  n.projectedCoincidentButReal3DDistinct);
 assert.ok(paperAliases.length>0);
 assert.ok(paperAliases.some(n=>n.distinctPhysical3DNodeCount>1));
 assert.ok(paperAliases.every(n=>n.localPairwise3DJunctionRelations.some(p=>
  p.paperOnlyDepthAlias)));
 assert.ok(paperAliases.every(n=>!n.canonicalIntentDAGAndV5EndpointAuthorized));
});
test('M5 C2 identical cuboids include legitimate physical 3D co-located endpoints but are NOT signed as unique engineering joins',()=>{
 const {node:r}=audit([A(),box('B',
  pt(0,0,0),pt(10,10,10))],83);
 assert.ok(r.physicallySharedEndpointNodeCount>0);
 assert.ok(r.paperNodes.some(n=>n.localPairwise3DJunctionRelations.some(
  x=>x.exactlySharedPhysical3DEndpoint)));
 assert.equal(r.entireFinalProjectedContourJunctionTopologyVerified,false);
 assert.equal(r.signedV5LineActions,0);
});
test('M5 C2 true 3D touching and third-solid burial do not infer official line joins across hidden intervals',()=>{
 const {node:r}=audit([A(),B(),
  box('C',pt(9,4,6),pt(11,6,8))],84);
 assert.ok(r.nodeCount>0);
 assert.ok(r.paperNodes.every(n=>
  n.officialLineStyle==='undetermined'));
 assert.ok(r.paperNodes.every(n=>
  n.localPairwise3DJunctionRelations.every(j=>
   !j.officialEngineeringLineJoinAuthorized)));
});
test('M5 refuses falsified physical and projected source registry provenance and stale revision',()=>{
 const geometry=[A(),B()],revision=85;
 const {args,unified,paper}=audit(geometry,revision);
 assert.throws(()=>auditUnifiedPaperJunctions({...args,revision:-1}),
  /revision/);
 assert.throws(()=>auditUnifiedPaperJunctions({...args,
  unifiedProjectedFeatureEventEvidence:{...unified,
   officialLineStylesVerified:true}}),/forged or stale/);
 assert.throws(()=>auditUnifiedPaperJunctions({...args,
  unifiedPaperSourceIdentityEvidence:{...paper,
   signedV5LineActions:1}}),/forged or stale/);
});
test('M5 existing final per-action gate includes physical-vs-paper junction evidence and no official line style',()=>{
 const geometry=[A(),B()],revision=86;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const r=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 assert.equal(r.unifiedPaperJunctionEvidence.status,
  'real-source-reviewed-first-angle-paper-endpoint-incidence');
 assert.equal(r.unifiedPaperJunctionNodeCount,
  r.unifiedPaperJunctionEvidence.nodeCount);
 assert.equal(r.unifiedPhysicalSourceCoincidentPaperJunctionCount,
  r.unifiedPaperJunctionEvidence.physicallySharedEndpointNodeCount);
 assert.equal(r.unifiedPaperOnlyDifferent3DDepthJunctionCount,
  r.unifiedPaperJunctionEvidence.paperOnlyDifferent3DDepthNodeCount);
 assert.equal(r.unifiedPaperJunctionEvidence.signedV5LineActions,0);
 assert.equal(r.signedCount,0);
 assert.equal(r.v5Ready,false);
 assert.ok(r.spans.every(s=>s.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/unifiedPaperJunctionNodeCount/);
 assert.match(ui,/unifiedPhysicalSourceCoincidentPaperJunctionCount/);
 assert.match(ui,/unifiedPaperOnlyDifferent3DDepthJunctionCount/);
 assert.match(ui,/真实物理共点不等于完整轮廓接合/);
 assert.match(ui,/不能发布实线\/虚线/);
});
