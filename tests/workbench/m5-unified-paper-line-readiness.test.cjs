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
 // Different physical X depths can have an unambiguous nearest W source
 // while still containing distinct real 3D nodes at the SAME paper point.
 // Depth aliases, not presumed source non-uniqueness, must block joins.
 assert.ok(r.depthAliasEndpointLineCount>0);
 assert.ok(r.lines.some(x=>x.view==='W'&&
  x.missingProofObligations.includes(
   'projected-endpoint-has-different-depth-real-3d-nodes')));
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


test('C2 positive local 3D source-join certificate is independently reconstructed from real source XYZ and two continuous open rays',()=>{
 const {proof,paper,nodes}=audit([A(),B()],130);
 const bySource=new Map(paper.groups.flatMap(g=>g.sourceSubspans.map(s=>
  [s.sourceSubspanId,{...s,view:g.view}])));
 const clear=s=>s?.sourceObserverRayScope==='visible'||
  s?.sourceObserverRayScope==='certified-whole-open-subspan-forward-rays-clear';
 const same3=(a,b)=>a&&b&&
  ['x','y','z'].every(axis=>a[axis]===b[axis]);
 let proven=0,complete=0;
 for(const line of proof.lines){
  assert.equal(line.localExact3DJunctionWithTwoWholeOpenRaysCount,
   line.physical3DEndpointIncidence.filter(e=>
    e.localExact3DSourcePairAndBothOpenRaysClearVerified).length);
  assert.equal(line.localBothEndpointSourceOpenRayJoinsVerified,
   line.localExact3DJunctionWithTwoWholeOpenRaysCount===2);
  const selected=bySource.get(line.selectedListed3DSourceSubspanId);
  for(const end of line.physical3DEndpointIncidence){
   const node=nodes.paperNodes.find(n=>n.id===end.physicalPaperNodeId);
   const expected=[];
   if(selected&&clear(selected)){
    for(const peer of bySource.values()){
     if(peer.sourceSubspanId===selected.sourceSubspanId||
        peer.view!==line.view||!clear(peer))continue;
     if(!same3(peer.from3D,end.physicalSource3DPoint)&&
        !same3(peer.to3D,end.physicalSource3DPoint))continue;
     if(!node.localPairwise3DJunctionRelations.some(j=>
      j.exactlySharedPhysical3DEndpoint&&
      !j.paperOnlyDepthAlias&&
      j.sourceSubspanIds.includes(selected.sourceSubspanId)&&
      j.sourceSubspanIds.includes(peer.sourceSubspanId)))continue;
     expected.push(peer.sourceSubspanId);
    }
   }
   assert.deepEqual(end.exactlyJoinedOtherWholeOpenRayClearSourceSubspanIds,
    expected.sort());
   assert.equal(end.localExact3DSourcePairAndBothOpenRaysClearVerified,
    expected.length>0);
   assert.equal(end.actualGlobalFeatureAndEndpointVisibilityCertified,false);
   assert.equal(end.physical3DEndpointJoinAndDrawingLinecapCertified,false);
   proven+=Number(expected.length>0);
  }
  complete+=Number(line.localBothEndpointSourceOpenRayJoinsVerified);
  assert.equal(line.officialEngineeringSolidDashedStyle,'undetermined');
  assert.equal(line.formalV5StrokeSigned,false);
  assert.equal(line.fullClosedEndpointAndAllOpaqueFacesVerified,false);
 }
 assert.equal(proof.locallyJoinedContinuousRayEndpointCount,proven);
 assert.equal(proof.bothEndpointLocallyJoinedContinuousRayLineCount,complete);
 assert.ok(proven>0,
  'reviewed two-cuboid composition must have at least one exact locally joined clear ray pair');
 assert.equal(proof.signedV5LineActions,0);
});
test('C2 projected W depth aliases may never masquerade as positive real-3D joins',()=>{
 const {proof,paper,nodes}=audit([
  A(),box('B',P(30,0,0),P(40,10,10))],131);
 assert.ok(proof.depthAliasEndpointLineCount>0);
 const bySource=new Map(paper.groups.flatMap(g=>g.sourceSubspans.map(s=>
  [s.sourceSubspanId,s])));
 for(const line of proof.lines.filter(x=>x.view==='W')){
  const selected=bySource.get(line.selectedListed3DSourceSubspanId);
  for(const end of line.physical3DEndpointIncidence){
   const node=nodes.paperNodes.find(n=>n.id===end.physicalPaperNodeId);
   assert.ok(node);
   for(const peerId of end.exactlyJoinedOtherWholeOpenRayClearSourceSubspanIds){
    const peer=bySource.get(peerId);
    assert.ok(selected&&peer);
    const p=end.physicalSource3DPoint;
    const same=q=>q&&p&&p.x===q.x&&p.y===q.y&&p.z===q.z;
    assert.ok(same(peer.from3D)||same(peer.to3D));
    assert.ok(node.localPairwise3DJunctionRelations.some(j=>
     j.exactlySharedPhysical3DEndpoint&&
     j.sourceSubspanIds.includes(peerId)&&
     j.sourceSubspanIds.includes(selected.sourceSubspanId)));
   }
   if(end.paperDepthAliasPresent){
    assert.ok(end.otherDistinct3DPointsOnSamePaperEndpointCount>0);
    assert.equal(end.physical3DEndpointJoinAndDrawingLinecapCertified,false);
   }
  }
  assert.equal(line.formalV5StrokeSigned,false);
 }
});
test('C2 spoofed exact endpoint join source graph cannot pass recomputed M5 lineage',()=>{
 const {args,nodes}=audit([A(),B()],132);
 const forged={...nodes,paperNodes:nodes.paperNodes.map((n,i)=>i===0?{
  ...n,localPairwise3DJunctionRelations:[
   {...(n.localPairwise3DJunctionRelations[0]??{
    sourceSubspanIds:['forgedA','forgedB']}),
    exactlySharedPhysical3DEndpoint:true,
    paperOnlyDepthAlias:false},
   ...n.localPairwise3DJunctionRelations
  ]
 }:n)};
 assert.throws(()=>auditUnifiedPaperLineReadiness({
  ...args,unifiedPaperJunctionEvidence:forged}),/stale or spoofed/);
});
