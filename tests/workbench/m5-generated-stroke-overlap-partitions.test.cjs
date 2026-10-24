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
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const point=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const a=()=>box('A',point(0,0,0),point(10,10,10));
const b=()=>box('B',point(5,5,5),point(15,15,15));
function audit(geometry,revision=71){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const m4=partitionReviewedSourceEdges({geometry,revision,sceneDepthEvidence:scene});
 const p=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const depth=auditProjectedSourceOverlapDepth({geometry,revision,
  physicalJunctionEvidence:p});
 const ends=auditGeneratedViewEndpointIncidence({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:p});
 const result=auditGeneratedStrokeOverlapPartitions({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:p,
  projectedOverlapDepthEvidence:depth,generatedProjectedEndpointEvidence:ends});
 return {scene,m4,p,depth,ends,result};
}
test('M5 new C2 physical source 3D lines map to full-domain V/H/W relative-depth overlap event subspans',()=>{
 const {m4,p,depth,ends,result:r}=audit([a(),b()]);
 assert.equal(r.status,'source-generated-view-pair-overlap-open-partitions');
 assert.equal(r.generatedM4CandidateCount,12);
 assert.equal(r.entries.length,m4.generatedProjectedCandidateCount);
 assert.equal(r.generatedM4CandidateCount,ends.candidateCount);
 assert.equal(p.generatedSegmentCount,6);
 assert.ok(depth.overlapCount>0);
 assert.ok(r.openPieceCount>=r.generatedM4CandidateCount);
 assert.ok(r.projectedCriticalEventCount>=0);
 assert.equal(r.allListedOverlappingSourceLineDepthsPartitioned,true);
 assert.equal(r.allOpaqueFacesAndFinalContoursVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 assert.ok(Object.isFrozen(r.entries));
 for(const x of r.entries){
  assert.deepEqual(x.listedDepthEventCuts.slice(0,1),[0]);
  assert.equal(x.listedDepthEventCuts.at(-1),1);
  assert.equal(x.openPieceCount,x.pieces.length);
  assert.equal(x.officialLineStylesVerified,false);
  assert.equal(x.signedV5LineActions,0);
  assert.equal(x.entireOpaqueFaceDepthAndContourVerified,false);
  const m=m4.generatedSegments.find(s=>s.id===x.m4GeneratedCandidateId);
  assert.ok(m);
  assert.equal(x.sourceGeneratedFeatureId,m.sourceGeneratedFeatureId);
  assert.equal(x.pieces[0].source3DOpenParameterRange[0],0);
  assert.equal(x.pieces.at(-1).source3DOpenParameterRange[1],1);
  for(let i=0;i<x.pieces.length;i++){
   const piece=x.pieces[i];
   if(i)assert.ok(Math.abs(piece.source3DOpenParameterRange[0]-
     x.pieces[i-1].source3DOpenParameterRange[1])<1e-9);
   const [lo,hi]=piece.source3DOpenParameterRange;
   assert.ok(hi>lo);
   const xyz=t=>({x:m.source3DFrom.x+t*(m.source3DTo.x-m.source3DFrom.x),
    y:m.source3DFrom.y+t*(m.source3DTo.y-m.source3DFrom.y),
    z:m.source3DFrom.z+t*(m.source3DTo.z-m.source3DFrom.z)});
   assert.deepEqual(piece.physicalSource3DFrom,xyz(lo));
   assert.deepEqual(piece.physicalSource3DTo,xyz(hi));
   assert.deepEqual(piece.projectedFromModelMm,project(xyz(lo))[x.view]);
   assert.deepEqual(piece.projectedToModelMm,project(xyz(hi))[x.view]);
   assert.equal(piece.authorizedEngineeringLineStyle,'undetermined');
   assert.equal(piece.certifiedConstructionIntentDAGOrV5Line,false);
   assert.equal(piece.allSceneOpaqueFacesAndProjectedContourJunctionsVerified,false);
   if(piece.sourceFrontOfEveryListedCoProjectedFeatureVerified){
    assert.ok(piece.listedSourceOverlapWitnesses.length>0);
    assert.ok(piece.listedSourceOverlapWitnesses.every(w=>
     w.status==='self-strictly-ahead'&&
     w.independentlyVerifiedAcrossEntireOpenSubspan));
   }
   if(piece.sourceStrictlyBehindSomeListedCoProjectedFeatureVerified)
    assert.ok(piece.listedSourceOverlapWitnesses.some(w=>
     w.status==='self-strictly-behind'));
  }
 }
});
test('M5 generated candidate co-projection witness remains LINE-only relative: third party V5 authorization cannot be inferred',()=>{
 const {result:r}=audit([a(),b()],72);
 for(const row of r.entries){
  for(const sub of row.pieces){
   assert.equal(sub.originalAndGenerated3DEndpointsOnlyLocallyVerified,true);
   assert.equal(sub.authorizedEngineeringLineStyle,'undetermined');
   assert.equal(sub.certifiedConstructionIntentDAGOrV5Line,false);
   for(const witness of sub.listedSourceOverlapWitnesses)
    assert.equal(witness.globalOccludingFaceAbsenceVerified,false);
  }
 }
});
test('M5 3rd body hides middle generated source line and preserves open pieces on both sides',()=>{
 const geometry=[a(),b(),
  box('C',point(9,4,6),point(11,6,8))];
 const {m4,result:r}=audit(geometry,73);
 assert.equal(r.generatedM4CandidateCount,m4.generatedProjectedCandidateCount);
 const sourceIds=new Set(m4.generatedUnionCreaseEvidence.segments.filter(s=>
  s.sourceGeometryIds.join(',')==='A,B'&&s.sourceAxis==='z'&&
  s.sourceFacePlanes[0].axis==='x'&&s.sourceFacePlanes[1].axis==='y'&&
  s.positiveNewConcaveUnionOpenFeatureVerified).map(s=>s.id));
 const active=r.entries.filter(e=>sourceIds.has(e.sourceGeneratedFeatureId));
 assert.equal(active.length,4);
 assert.ok(active.every(e=>e.pieces.length>=1));
 assert.equal(r.signedV5LineActions,0);
});
test('M5 full-face touching solids create no fabricated generated union source line or overlap partitions',()=>{
 const geometry=[a(),box('B',point(10,0,0),point(20,10,10))];
 const {result:r}=audit(geometry,74);
 assert.equal(r.generatedM4CandidateCount,0);
 assert.equal(r.openPieceCount,0);
 assert.equal(r.projectedCriticalEventCount,0);
 assert.equal(r.signedV5LineActions,0);
});
test('M5 rejected old revision, forged projected endpoint and fabricated co-projection depth release',()=>{
 const geometry=[a(),b()],revision=75;
 const {m4,p,depth,ends}=audit(geometry,revision);
 const args={geometry,revision,projectedStrokePartitions:m4,
  physicalJunctionEvidence:p,projectedOverlapDepthEvidence:depth,
  generatedProjectedEndpointEvidence:ends};
 assert.throws(()=>auditGeneratedStrokeOverlapPartitions({...args,revision:-1}),
  /revision/);
 assert.throws(()=>auditGeneratedStrokeOverlapPartitions({...args,
  physicalJunctionEvidence:{...p,signedV5LineActions:1}}),
  /forged or stale/);
 assert.throws(()=>auditGeneratedStrokeOverlapPartitions({...args,
  projectedOverlapDepthEvidence:{...depth,officialLineStylesVerified:true}}),
  /forged or stale/);
 assert.throws(()=>auditGeneratedStrokeOverlapPartitions({...args,
  generatedProjectedEndpointEvidence:{...ends,signedV5LineActions:1}}),
  /forged or stale/);
 const manipulated=m4.generatedSegments.map(x=>({...x}));
 manipulated[0].projectedFromModelMm={u:10000,v:10000};
 assert.throws(()=>auditGeneratedStrokeOverlapPartitions({...args,
  projectedStrokePartitions:{...m4,generatedSegments:manipulated}}),
  /projection|diverge/);
});
test('M5 actual C2 source action gate consumes relative-depth partitions without signing any official line',()=>{
 const geometry=[a(),b()],revision=76;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const gate=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 const r=gate.generatedOverlapPartitionEvidence;
 assert.equal(r.status,'source-generated-view-pair-overlap-open-partitions');
 assert.equal(gate.generatedOverlapSubspanCount,r.openPieceCount);
 assert.equal(gate.generatedOverlapDepthCriticalCutCount,r.projectedCriticalEventCount);
 assert.equal(gate.generatedOverlapLocallyAheadCount,r.strictlyFrontRelativePieceCount);
 assert.equal(gate.generatedOverlapLocallyBehindCount,r.strictlyBehindRelativePieceCount);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(gate.generatedSourceStrokeActionCount,0);
 assert.equal(gate.signedCount,0);
 assert.equal(gate.v5Ready,false);
 assert.ok(gate.spans.every(x=>x.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/generatedOverlapSubspanCount/);
 assert.match(ui,/generatedOverlapDepthCriticalCutCount/);
 assert.match(ui,/generatedOverlapLocallyAheadCount/);
 assert.match(ui,/generatedOverlapLocallyBehindCount/);
 assert.match(ui,/不证明其他实体表面无遮挡/);
});
