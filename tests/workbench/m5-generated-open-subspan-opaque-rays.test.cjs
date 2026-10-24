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
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const a=()=>box('A',P(0,0,0),P(10,10,10));
const b=()=>box('B',P(5,5,5),P(15,15,15));
function audit(geometry,revision=97){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const m4=partitionReviewedSourceEdges({geometry,revision,sceneDepthEvidence:scene});
 const physical=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const depth=auditProjectedSourceOverlapDepth({geometry,revision,
  physicalJunctionEvidence:physical});
 const endpoints=auditGeneratedViewEndpointIncidence({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical});
 const partition=auditGeneratedStrokeOverlapPartitions({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical,
  projectedOverlapDepthEvidence:depth,
  generatedProjectedEndpointEvidence:endpoints});
 const args={geometry,revision,projectedStrokePartitions:m4,
  physicalJunctionEvidence:physical,projectedOverlapDepthEvidence:depth,
  generatedProjectedEndpointEvidence:endpoints,
  generatedOverlapPartitionEvidence:partition};
 return {args,result:auditGeneratedOpenSubspanOpaqueRays(args)};
}
test('M5 generated source cut events: independent whole-open-subspan M0 rays fully account for all actual first-angle fragments',()=>{
 const {args,result:r}=audit([a(),b()]);
 assert.equal(r.status,'all-current-generated-open-subspan-source-rays-recomputed');
 assert.equal(r.pieceCount,args.generatedOverlapPartitionEvidence.openPieceCount);
 assert.ok(r.pieceCount>=12);
 assert.equal(r.certifiedClearPieceCount+r.certifiedOccludedPieceCount+
  r.undeterminedPieceCount,r.pieceCount);
 assert.equal(r.entireSourceM4PieceCoverageVerified,true);
 assert.equal(r.fullModel3DConvexSourceGeometryRechecked,true);
 assert.equal(r.completeFinalEngineeringLineFeatureTopologyVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 assert.ok(Object.isFrozen(r.pieces));
 for(const x of r.pieces){
  assert.ok(['V','H','W'].includes(x.view));
  assert.deepEqual(x.independentConvexSourceGeometryIds,['A','B']);
  assert.deepEqual(x.sourceProjectedFromModelMm,project(x.source3DFrom)[x.view]);
  assert.deepEqual(x.sourceProjectedToModelMm,project(x.source3DTo)[x.view]);
  assert.equal(x.sourceWholeOpenPieceObserverClearVerified&&
   x.sourceWholeOpenPieceStrictlyOccludedVerified,false);
  assert.equal(x.applicableEngineeringLineStyle,'undetermined');
  assert.equal(x.officialSingleV5LineActionAuthorized,false);
  assert.equal(x.globalProjectedOuterContourAndAllOpaqueFacesVerified,false);
  if(x.sourceWholeOpenPieceObserverClearVerified){
   assert.ok(x.independentSolidObserverRayStatuses.every(s=>
    s.continuousOpenRayClearVerified===true&&s.status==='certified-clear'));
   assert.equal(x.sourceRayStatus,
    'certified-whole-open-subspan-forward-rays-clear');
  }
  if(x.sourceWholeOpenPieceStrictlyOccludedVerified){
   assert.ok(x.strictOccluderGeometryIds.length>0);
   assert.equal(x.sourceRayStatus,
    'certified-whole-open-subspan-strictly-occluded');
  }
 }
});
test('M5 a third reviewed body locally buries a middle generated source interval; no false official V5 or made-up line style',()=>{
 const geometry=[a(),b(),box('C',P(9,4,6),P(11,6,8))];
 const {args,result:r}=audit(geometry,98);
 assert.equal(r.pieceCount,args.generatedOverlapPartitionEvidence.openPieceCount);
 assert.deepEqual(r.sourceGeometryIds,['A','B','C']);
 assert.ok(r.pieces.every(p=>
  p.independentConvexSourceGeometryIds.length===3));
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
});
test('M5 disjoint face-contact source provides zero new generated ray strokes',()=>{
 const geometry=[a(),box('B',P(10,0,0),P(20,10,10))];
 const {result:r}=audit(geometry,99);
 assert.equal(r.pieceCount,0);
 assert.equal(r.certifiedClearPieceCount,0);
 assert.equal(r.certifiedOccludedPieceCount,0);
 assert.equal(r.signedV5LineActions,0);
});
test('M5 rejects old revision and attacker-modified source-feature relative-depth certificates',()=>{
 const {args}=audit([a(),b()],100);
 assert.throws(()=>auditGeneratedOpenSubspanOpaqueRays({...args,revision:-1}),
  /revision/);
 assert.throws(()=>auditGeneratedOpenSubspanOpaqueRays({...args,
  generatedOverlapPartitionEvidence:{
   ...args.generatedOverlapPartitionEvidence,signedV5LineActions:1}
 }),/forged or stale/);
 assert.throws(()=>auditGeneratedOpenSubspanOpaqueRays({...args,
  generatedOverlapPartitionEvidence:{
   ...args.generatedOverlapPartitionEvidence,
   entries:args.generatedOverlapPartitionEvidence.entries.slice(1)}
 }),/forged or stale/);
});
test('M5 existing release gate carries independent M0 rays per exact generated subspan without official standard drawing',()=>{
 const geometry=[a(),b()],revision=101;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const result=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 const proof=result.generatedSubspanRayEvidence;
 assert.equal(proof.status,'all-current-generated-open-subspan-source-rays-recomputed');
 assert.equal(result.generatedSubspanWholeClearCount,proof.certifiedClearPieceCount);
 assert.equal(result.generatedSubspanStrictlyHiddenCount,proof.certifiedOccludedPieceCount);
 assert.equal(result.generatedSubspanRayUndeterminedCount,proof.undeterminedPieceCount);
 assert.equal(proof.pieceCount,result.generatedOverlapSubspanCount);
 assert.equal(proof.signedV5LineActions,0);
 assert.equal(result.generatedSourceStrokeActionCount,0);
 assert.equal(result.signedCount,0);
 assert.equal(result.v5Ready,false);
 assert.ok(result.spans.every(x=>x.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/generatedSubspanWholeClearCount/);
 assert.match(ui,/generatedSubspanStrictlyHiddenCount/);
 assert.match(ui,/generatedSubspanRayUndeterminedCount/);
 assert.match(ui,/只针对两条已列出的来源线/);
 assert.match(ui,/不能发布实线\/虚线/);
});
