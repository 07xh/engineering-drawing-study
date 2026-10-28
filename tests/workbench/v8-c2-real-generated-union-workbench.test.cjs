'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildReviewedC2Boxes}=require('../../project/c2-reviewed-two-boxes.cjs');
const {newProject,createCoordinator}=require('../../project/project-coordinator.cjs');
const {createUnifiedProjectSession}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
function mount(boxes){
 const coordinator=createCoordinator(newProject({
  id:'C2GeneratedBooleanDemo',task:'composition'
 }));
 const session=createUnifiedProjectSession();
 coordinator.attachSolver(session);
 for(const box of buildReviewedC2Boxes(boxes)){
  coordinator.putObject(box.model);
  coordinator.putCondition({id:'geo_'+box.id,objectId:box.id,
   sourceCandidateId:null,
   value:{type:'manual-geometry',unit:'mm',imageId:null,
    geometry:box.geometry}});
  coordinator.confirmCondition('geo_'+box.id);
 }
 return {coordinator,session};
}
const A={min:[0,0,0],max:[10,10,10]};
const overlapB={min:[5,5,5],max:[15,15,15]};
test('C2 actual overlapping cuboids: generated AND original 3D union sources are linked in live session',()=>{
 const {coordinator,session}=mount([A,overlapB]);
 const out=session.solve(),m=out.orthogonalBooleanFeatureAudit;
 assert.ok(m);
 assert.equal(out.kind,'composition-evidence');
 assert.equal(out.verified,false);
 assert.equal(out.clock,null);
 assert.equal(m.schema,'draftai-c2-workbench-original-plus-generated-union-evidence/1');
 assert.equal(m.revision,coordinator.snapshot().revision);
 assert.deepEqual(m.sourceGeometryIds,['C2BoxA','C2BoxB']);
 assert.equal(m.source.sourceEdgeCount,24);
 assert.equal(m.generated.segmentCount,6);
 assert.equal(m.generatedOpenSourceIntervalCount,6);
 assert.equal(m.generated.certifiedNewConcaveOpenCount,6);
 assert.equal(m.generated.buriedNewFaceIntersectionCount,0);
 assert.equal(m.physical.generatedSegmentCount,6);
 const proof=out.c2PaperRayProof;
 assert.equal(proof.schema,
  'draftai-c2-current-first-angle-source-open-ray-review/1');
 assert.equal(proof.revision,coordinator.snapshot().revision);
 assert.deepEqual(proof.sourceGeometryIds,['C2BoxA','C2BoxB']);
 assert.ok(proof.paperIntervalCount>0);
 assert.equal(proof.paperIntervalCount,proof.entries.length);
 assert.equal(proof.counts.locallyClear+proof.counts.locallyOpaque+
  proof.counts.unresolved,proof.paperIntervalCount);
 assert.equal(proof.fullSourceCrossAudit,true);
 assert.equal(proof.sourceBoundaries.length,
  m.projectedRegion.projectedBoundarySegmentCount);
 assert.equal(proof.sourceCoveredBoundaryCount+
  proof.sourceIncompleteBoundaryCount,proof.sourceBoundaries.length);
 assert.equal(proof.sourceBoundariesByView.length,3);
 assert.deepEqual(proof.sourceBoundariesByView.map(x=>x.view),['V','H','W']);
 assert.equal(proof.boundaryRayEvidence.length,proof.sourceBoundaries.length);
 assert.equal(proof.boundaryRayOpenPieceCount,proof.boundaryRayEvidence.reduce(
  (n,b)=>n+b.paperPieces.length,0));
 assert.equal(proof.boundaryRayCorroboratedPieceCount,
  proof.boundaryRayEvidence.reduce((n,b)=>n+
   b.positiveLocalWholeOpenRayPieceCount,0));
 assert.ok(proof.boundaryRayCorroboratedPieceCount>0,
  'genuine physical source and open ray corroboration exists');
 assert.ok(proof.boundaryAllPiecesCorroboratedCount<=
  proof.sourceCoveredBoundaryCount);
 for(const bound of proof.boundaryRayEvidence){
  const src=proof.sourceBoundaries.find(x=>
   x.id===bound.id&&x.view===bound.view);
  assert.ok(src);
  assert.equal(bound.officialEngineeringLineStyle,'undetermined');
  assert.equal(bound.officialV5Approved,false);
  assert.equal(bound.full3DBooleanOcclusionAndJunctionProof,false);
  assert.equal(bound.paperPieces[0].fromT,0);
  assert.equal(bound.paperPieces.at(-1).toT,1);
  assert.ok(Math.abs(bound.paperPieces.reduce((n,p)=>
   n+(p.toT-p.fromT),0)-1)<1e-14);
  assert.equal(bound.paperPieces.some(p=>
   p.exactCurrentPhysicalSourceAndOpenRayCorroborated),
   bound.positiveLocalWholeOpenRayPieceCount>0);
  for(const [i,p] of bound.paperPieces.entries()){
   if(i>0)assert.equal(bound.paperPieces[i-1].toT,p.fromT);
   assert.equal(p.officialEngineeringLineStyle,'undetermined');
   assert.equal(p.officialV5Approved,false);
   assert.equal(p.completeClosedEndpointAndGlobalVisibilityCertified,false);
   if(p.exactCurrentPhysicalSourceAndOpenRayCorroborated){
    assert.ok(src.completeProjectedPhysicalSourceCoverage);
    assert.equal(p.real3DSourceClassKeys.length,1);
    assert.ok(src.physical3DSourceClassKeys.includes(
     p.real3DSourceClassKeys[0]));
    assert.ok(['scoped-continuous-front-ray-clear',
     'scoped-continuous-front-ray-opaque'].includes(
      p.localWholeOpenRayStatus));
   }else assert.equal(p.localWholeOpenRayStatus,'undetermined');
  }
  if(bound.locallyRayCorroboratedFullBoundary)
   assert.equal(bound.exactUnprovenBoundaryRanges.length,0);
  if(!src.completeProjectedPhysicalSourceCoverage)
   assert.equal(bound.locallyRayCorroboratedFullBoundary,false);
 }
 assert.ok(proof.sourceBoundaries.every(b=>
  b.revision===proof.revision&&
  b.officialEngineeringLineStyle==='undetermined'&&
  b.officialV5Approved===false&&
  b.globalContinuousOcclusionProven===false));
 for(const view of ['V','H','W']){
  const rows=proof.sourceBoundaries.filter(x=>x.view===view);
  const inventory=m.projectedRegion.projectedViews.find(x=>x.view===view);
  assert.equal(rows.length,inventory.boundaries.length);
  assert.equal(rows.filter(x=>x.completeProjectedPhysicalSourceCoverage).length,
   proof.sourceBoundariesByView.find(x=>x.view===view).sourceCovered);
  for(const b of inventory.boundaries){
   const matching=rows.find(x=>x.id===b.id);
   assert.ok(matching);
   assert.equal(matching.kind,b.type);
   assert.deepEqual(matching.from,b.projectedFromModelMm);
   assert.deepEqual(matching.to,b.projectedToModelMm);
  }
 }
 assert.ok(proof.sourceBoundaries.filter(x=>
  x.completeProjectedPhysicalSourceCoverage).every(x=>
   x.physical3DSourceClassKeys.length>0));
 assert.equal(proof.officialDrawingLineStylesVerified,false);
 assert.equal(proof.completeV5DrawingAuthorized,false);
 assert.ok(proof.entries.every(x=>
  x.engineeringLineStyle==='undetermined'&&
  x.officialV5Approved===false&&
  x.unresolvedObligations.length>=5&&
  ['V','H','W'].includes(x.view)&&x.revision===proof.revision));
 assert.ok(proof.entries.some(x=>x.rayStatus===
  'scoped-continuous-front-ray-clear'));
 assert.ok(proof.entries.every(x=>Number.isFinite(x.from.u)&&
  Number.isFinite(x.from.v)&&Number.isFinite(x.to.u)&&
  Number.isFinite(x.to.v)));
 assert.equal(new Set(proof.entries.map(x=>x.view)).size,3);
 assert.ok(m.physical.sourceSegmentCount>0);
 assert.ok(m.physical.nodeCount>0);
 assert.ok(m.physical.sharedPhysicalNodeCount>0);
 assert.equal(m.physical.exactEndpointIncidenceVerified,true);
 assert.equal(m.sourceEndpointOctants.length,2*m.physical.segments.length);
 assert.equal(m.certifiedLocalEndpointCount+m.unresolvedLocalEndpointCount,
  m.sourceEndpointOctants.length);
 assert.ok(m.certifiedLocalEndpointCount>0);
 assert.equal(m.projectedRegion.viewCount,3);
 assert.equal(m.projectedRegion.allProjectedOccupancyRegionBoundariesComplete,true);
 assert.equal(m.projectedLoops.totalSimpleClosedBoundaryLoopCount,3);
 assert.equal(m.projectedLoops.totalExteriorClosedLoopCount,3);
 assert.equal(m.projectedLoops.totalProjectedHoleClosedLoopCount,0);
 assert.equal(m.projectedLoops.allProjectedBoundaryCyclesSimpleAndClosedVerified,true);
 assert.equal(m.projectedLoops.totalProjectedBoundarySegmentCount,
  m.projectedRegion.projectedBoundarySegmentCount);
 for(const [view,i] of ['V','H','W'].map((v,i)=>[v,i])){
  const e=m.projectedRegion.projectedViews[i];
  const topology=m.projectedLoops.projectedViews[i];
  assert.equal(e.view,view);
  assert.equal(topology.view,view);
  assert.equal(e.completeProjectedUnionAreaMm2,175);
  assert.equal(topology.sourceProjectedUnionAreaMm2,175);
  assert.equal(topology.signedLoopAreasTotalMm2,175);
  assert.equal(topology.simpleClosedLoopCount,1);
  assert.ok(e.boundaries.every(x=>
   x.exactOpenCellOppositeOccupancyVerified&&
   x.projectedEngineeringSolidDashedStyle==='undetermined'&&
   x.canonicalIntentDAGAndV5Approved===false));
 }
 assert.ok(m.sourceEndpointOctants.every(x=>
  x.localBoundaryWitness.outgoingSourceAxis!==null&&
  x.localBoundaryWitness.closedEndpointCompleteEngineeringLinecapVerified===false&&
  x.localBoundaryWitness.signedV5LineActions===0));
 assert.equal(m.projectedLoops.officialLineStylesVerified,false);
 assert.equal(m.projectedLoops.v5Ready,false);
 assert.equal(m.directional.nodeCount,m.physical.nodeCount);
 assert.equal(m.directional.listedNodesDepthOrderVerified,true);
 assert.ok(m.physical.projectedAliases.some(x=>
  x.different3DPhysicalPoints&&
  x.mayJoinDrawingStrokesOnProjectionAlone===false));
 for(const line of m.generated.segments){
  assert.equal(line.positiveNewConcaveUnionOpenFeatureVerified,true);
  assert.equal(line.generatedByTwoSourceFacePlanes,true);
  assert.equal(line.originalSourceMeshEdgeId,null);
  assert.equal(line.officialEngineeringLineStyle,'undetermined');
  assert.equal(line.officialConstructionStepV5ActionAuthorized,false);
  for(const v of ['V','H','W']){
   const projected=project(line.source3DFrom)[v];
   const end=project(line.source3DTo)[v];
   assert.deepEqual(line.projected[v].from,projected);
   assert.deepEqual(line.projected[v].to,end);
  }
 }
 assert.equal(m.officialDrawingLineStylesVerified,false);
 assert.equal(m.completeV5DrawingAuthorized,false);
 assert.equal(m.physical.officialV5FeatureActionsSigned,0);
 assert.equal(m.directional.signedV5LineActions,0);
 assert.equal(out.originalMultiBodyEdgeRays.completedDrawingV5Authorized,false);
 assert.equal(coordinator.canExport(),false);
 coordinator.deleteCondition('geo_C2BoxA');
 assert.equal(session.readSnapshot(),null);
 coordinator.dispose();
});
test('C2 planar face contact has NO invented generated pairwise feature and remains unsigned',()=>{
 const {coordinator,session}=mount([
  A,{min:[10,0,0],max:[20,10,10]}
 ]);
 const out=session.solve(),m=out.orthogonalBooleanFeatureAudit;
 assert.ok(m);
 assert.equal(m.source.sourceEdgeCount,24);
 assert.equal(m.generated.segmentCount,0);
 assert.equal(m.generatedOpenSourceIntervalCount,0);
 assert.equal(m.physical.generatedSegmentCount,0);
 assert.ok(m.source.flatNoCreaseCount>0);
 assert.ok(out.c2PaperRayProof.boundaryRayEvidence.length>0);
 assert.ok(out.c2PaperRayProof.boundaryRayEvidence.every(x=>
  x.officialV5Approved===false&&
  x.paperPieces.every(p=>p.completeClosedEndpointAndGlobalVisibilityCertified===false)));
 assert.equal(m.projectedLoops.allProjectedBoundaryCyclesSimpleAndClosedVerified,true);
 assert.ok(out.c2PaperRayProof.paperIntervalCount>0);
 assert.equal(out.c2PaperRayProof.sourceCoveredBoundaryCount+
  out.c2PaperRayProof.sourceIncompleteBoundaryCount,
  m.projectedRegion.projectedBoundarySegmentCount);
 assert.equal(out.c2PaperRayProof.officialDrawingLineStylesVerified,false);
 assert.equal(out.c2PaperRayProof.completeV5DrawingAuthorized,false);
 assert.equal(m.projectedRegion.viewCount,3);
 assert.equal(m.projectedLoops.totalProjectedHoleClosedLoopCount,0);
 assert.equal(m.completeV5DrawingAuthorized,false);
 assert.equal(coordinator.canExport(),false);
 coordinator.dispose();
});

test('C2 projected frame with a genuine H-view HOLE keeps inner/outer contours independent of hidden-stroke authorization',()=>{
 const {prismMesh}=require('../../project/unified-workbench-session.cjs');
 const {reviewC2OrthogonalBooleanFeatures}=
  require('../../project/c2-orthogonal-boolean-feature-review.cjs');
 const extents=[
  [[0,0,0],[10,2,5]],
  [[0,8,0],[10,10,5]],
  [[0,2,0],[2,8,5]],
  [[8,2,0],[10,8,5]]
 ];
 const geometry=extents.map(([lo,hi],index)=>({
  ...prismMesh({solid:{
   min:{x:lo[0],y:lo[1],z:lo[2]},
   max:{x:hi[0],y:hi[1],z:hi[2]}}}),id:'Frame'+index
 }));
 const r=reviewC2OrthogonalBooleanFeatures({geometry,revision:631});
 assert.ok(r);
 assert.equal(r.projectedLoops.viewCount,3);
 assert.equal(r.projectedLoops.totalProjectedHoleClosedLoopCount>=1,true);
 const H=r.projectedLoops.projectedViews.find(v=>v.view==='H');
 assert.equal(H.simpleClosedLoopCount,2);
 assert.equal(H.exteriorClosedLoopCount,1);
 assert.equal(H.boundedHoleClosedLoopCount,1);
 assert.equal(H.sourceProjectedUnionAreaMm2,64);
 assert.equal(H.signedLoopAreasTotalMm2,64);
 assert.equal(r.projectedRegion.physical3DSourceReviewMode,
  'm0-projected-region-geometry-only');
 assert.equal(r.projectedLoops.allPhysical3DSourceAndFullProjectedIntersectionsContinuouslyVerified,false);
 assert.equal(r.projectedLoops.officialLineStylesVerified,false);
 assert.equal(r.completeV5DrawingAuthorized,false);
 assert.ok(r.sourceEndpointOctants.every(x=>
  x.localBoundaryWitness.actualGlobalPhysicalFeatureContinuityVerified===false));
});
