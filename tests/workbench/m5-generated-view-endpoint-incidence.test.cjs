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
const {auditGeneratedViewEndpointIncidence}=
 require('../../workbench/m5-generated-view-endpoint-incidence.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const p=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',p(0,0,0),p(10,10,10));
const B=()=>box('B',p(5,5,5),p(15,15,15));
function audit(geometry,revision=57){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const m4=partitionReviewedSourceEdges({geometry,revision,
  sceneDepthEvidence:scene});
 const physical=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const view=auditGeneratedViewEndpointIncidence({
  geometry,revision,projectedStrokePartitions:m4,
  physicalJunctionEvidence:physical});
 return {scene,m4,physical,view};
}
test('C2 M5 six authentic new 3D edges map exactly to twelve noncollapsed V/H/W candidates and 24 physical endpoints',()=>{
 const {m4,physical,view:v}=audit([A(),B()]);
 assert.equal(physical.generatedSegmentCount,6);
 assert.equal(m4.generatedProjectedCandidateCount,12);
 assert.equal(v.status,'source-bound-generated-3d-to-projected-endpoints');
 assert.equal(v.source3DGeneratedFeatureCount,6);
 assert.equal(v.candidateCount,12);
 assert.equal(v.physicallyMatched3DEndpointCount,24);
 assert.equal(v.signedV5LineActions,0);
 assert.equal(v.officialLineStylesVerified,false);
 assert.equal(v.allGeneratedViewJunctionsVerified,false);
 assert.ok(Object.isFrozen(v.candidates));
 for(const item of v.candidates){
  assert.equal(item.originalSourceMeshEdgeId,null);
  assert.equal(item.bothPhysical3DEndpointIdentitiesVerified,true);
  assert.equal(item.endpoints.length,2);
  assert.notEqual(item.endpoints[0].physicalSourceNodeId,
   item.endpoints[1].physicalSourceNodeId);
  assert.equal(item.engineeringStandardLineStyle,'undetermined');
  assert.equal(item.officialConstructionIntentDAGV5LineSigned,false);
  for(const witness of item.endpoints){
   assert.deepEqual(witness.projectedModelMm,
    project(witness.source3DPoint)[item.view]);
   assert.equal(witness.physicalNodeCoincidenceVerified,true);
   assert.equal(witness.endpointSourceOfficialLineStyle,'undetermined');
   assert.equal(witness.completeProjectedContourJunctionVerified,false);
   assert.equal(witness.formalV5EndpointReleased,false);
  }
 }
});
test('C2 source projection alias is stored as unresolved, not a fabricated spatial joint',()=>{
 const {physical,view}=audit([A(),B()],58);
 const total=physical.projectedAliases.filter(a=>a.different3DPhysicalPoints);
 assert.ok(total.length>0);
 assert.ok(view.candidates.every(c=>c.endpoints.every(e=>
  e.otherPhysicalNodeIdsAtSamePaperPoint.every(id=>
   id!==e.physicalSourceNodeId))));
 for(const c of view.candidates)for(const e of c.endpoints){
  assert.equal(e.projectedDepthAliasUnresolved,
   e.otherPhysicalNodeIdsAtSamePaperPoint.length>0);
  assert.equal(e.completeProjectedContourJunctionVerified,false);
 }
});
test('C2 a third opaque source buries ONLY middle generated z segment and does not join endpoints across the missing 3D gap',()=>{
 const C=box('C',p(9,4,6),p(11,6,8));
 const {m4,view:v}=audit([A(),B(),C],59);
 const source=m4.generatedUnionCreaseEvidence.segments.filter(s=>
  s.sourceGeometryIds.join(',')==='A,B'&&s.sourceAxis==='z'&&
  s.sourceFacePlanes[0].axis==='x'&&s.sourceFacePlanes[1].axis==='y');
 assert.deepEqual(source.map(s=>s.status),[
  'certified-new-concave-union-open-crease',
  'certified-new-face-intersection-buried-in-union',
  'certified-new-concave-union-open-crease'
 ]);
 const approvedSourceIds=new Set(source.filter(s=>
  s.positiveNewConcaveUnionOpenFeatureVerified).map(s=>s.id));
 const shown=v.candidates.filter(c=>
  approvedSourceIds.has(c.generated3DSourceFeatureId));
 assert.equal(shown.length,4);
 assert.ok(shown.every(x=>x.officialConstructionIntentDAGV5LineSigned===false));
 assert.equal(v.signedV5LineActions,0);
});
test('C2 stale or forged M4 source endpoints and fake V5 style are refused',()=>{
 const geometry=[A(),B()],revision=60;
 const {m4,physical}=audit(geometry,revision);
 const base={geometry,revision,physicalJunctionEvidence:physical};
 assert.throws(()=>auditGeneratedViewEndpointIncidence({
  ...base,projectedStrokePartitions:{...m4,
   generatedStrokeSignedCount:1}}),/unsigned current M4/);
 const generated=m4.generatedSegments.map(s=>({...s}));
 generated[0]={...generated[0],source3DFrom:{
  ...generated[0].source3DFrom,x:generated[0].source3DFrom.x+1}};
 assert.throws(()=>auditGeneratedViewEndpointIncidence({
  ...base,projectedStrokePartitions:{...m4,generatedSegments:generated}
 }),/authentic 3D generated union feature/);
 assert.throws(()=>auditGeneratedViewEndpointIncidence({
  ...base,physicalJunctionEvidence:{...physical,
   allBoundaryJunctionsVerified:true},
  projectedStrokePartitions:m4}),/stale or forged 3D union/);
 assert.throws(()=>auditGeneratedViewEndpointIncidence({
  ...base,revision:-1,projectedStrokePartitions:m4}),/revision/);
});
test('C2 face-only contact has no new 3D feature candidates and no false releases',()=>{
 const B2=box('B',p(10,0,0),p(20,10,10));
 const {view:v}=audit([A(),B2],61);
 assert.equal(v.candidateCount,0);
 assert.equal(v.source3DGeneratedFeatureCount,0);
 assert.equal(v.physicallyMatched3DEndpointCount,0);
 assert.equal(v.signedV5LineActions,0);
});
test('C2 existing actual per-action V5 gate receives exact projected endpoint evidence without signing a stroke',()=>{
 const geometry=[A(),B()],revision=62;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const result=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 assert.equal(result.generatedProjectedEndpointEvidence.status,
  'source-bound-generated-3d-to-projected-endpoints');
 assert.equal(result.generated3DProjectedMatchedEndpointCount,24);
 assert.equal(result.generatedProjectedEndpointEvidence.signedV5LineActions,0);
 assert.equal(result.generatedSourceStrokeSignedCount,0);
 assert.equal(result.signedCount,0);
 assert.equal(result.v5Ready,false);
 assert.ok(result.spans.every(x=>x.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/generated3DProjectedMatchedEndpointCount/);
 assert.match(ui,/generated3DProjectedDepthAliasEndpointCount/);
 assert.match(ui,/接合候选不是正式工程图的端点连接/);
});
