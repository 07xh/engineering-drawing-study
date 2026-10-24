'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const {auditOrthogonalProjectedUnionSilhouette}=
 require('../../workbench/m5-orthogonal-projected-union-silhouette.cjs');
const {auditOrthogonalProjectedBoundaryTopology}=
 require('../../workbench/m5-orthogonal-projected-boundary-topology.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',P(0,0,0),P(10,10,10));
const B=()=>box('B',P(5,5,5),P(15,15,15));
function sceneGate(geometry,revision=240){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 return inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
}
function regionOnly(geometry,revision){
 const projectedUnionSilhouetteEvidence=
  auditOrthogonalProjectedUnionSilhouette({geometry,revision});
 return auditOrthogonalProjectedBoundaryTopology({geometry,revision,
  projectedUnionSilhouetteEvidence});
}
test('C2 every projected V/H/W boundary from two interpenetrating cuboids is one 2-regular closed exterior loop; oriented loop area equals reviewed union region',()=>{
 const g=sceneGate([A(),B()]),r=g.projectedUnionBoundaryTopologyEvidence;
 assert.equal(r.status,
  'first-angle-projected-occupancy-boundary-loop-incidence-audited');
 assert.deepEqual(r.projectedViews.map(v=>v.view),['V','H','W']);
 assert.equal(r.sourceReviewMode,'full-independent-m0-to-m5-source-cross-audit');
 assert.equal(r.totalSimpleClosedBoundaryLoopCount,3);
 assert.equal(r.totalExteriorClosedLoopCount,3);
 assert.equal(r.totalProjectedHoleClosedLoopCount,0);
 assert.equal(r.unresolvedNonManifoldOrOpenBoundaryComponentCount,0);
 assert.equal(r.allProjectedBoundaryCyclesSimpleAndClosedVerified,true);
 assert.equal(r.allReviewedProjectedRegionBoundarySegmentsAccountedFor,true);
 assert.equal(r.totalProjectedBoundarySegmentCount,
  g.projectedUnionSilhouetteEvidence.projectedBoundarySegmentCount);
 for(const v of r.projectedViews){
  assert.equal(v.simpleClosedLoopCount,1);
  assert.equal(v.exteriorClosedLoopCount,1);
  assert.equal(v.boundedHoleClosedLoopCount,0);
  assert.equal(v.fourWayProjectedPointContactVertexCount,0);
  assert.equal(v.projectedLoopAreaAndUnionOccupancyNumericallyConsistent,true);
  assert.equal(v.sourceProjectedUnionAreaMm2,175);
  assert.equal(v.signedLoopAreasTotalMm2,175);
  assert.ok(v.exactProjectedBoundaryVertices.every(n=>n.degree===2));
  assert.equal(v.certifiedSimpleClosedBoundaryCycles.length,1);
  const ring=v.certifiedSimpleClosedBoundaryCycles[0];
  assert.ok(ring.signedOrientedProjectedAreaMm2>0);
  assert.equal(ring.applicableEngineeringStrokeStyle,'undetermined');
  assert.equal(ring.formalConstructionIntentDAGV5Signed,false);
  assert.equal(ring.completeReal3DSourceJunctionsAndOcclusionVerified,false);
  assert.equal(ring.orderedClosedProjectedPointKeys[0],
   ring.orderedClosedProjectedPointKeys.at(-1));
  assert.equal(ring.orderedSourceBoundarySegmentIds.length,
   v.sourceBoundarySegmentCount);
 }
 assert.equal(g.projectedUnionFourWayPointContactCount,0);
 assert.equal(g.projectedUnionCertifiedExteriorLoopCount,3);
 assert.equal(g.signedCount,0);
 assert.equal(g.v5Ready,false);
 assert.ok(g.spans.every(s=>s.authorizedStyle==='undetermined'));
});
test('C2 4-body rectangular frame: independently prove one outer H loop and one clockwise hole loop; loop area is 100 - 36 = 64',()=>{
 const geometry=[
  box('A',P(0,0,0),P(10,2,5)),
  box('B',P(0,8,0),P(10,10,5)),
  box('C',P(0,2,0),P(2,8,5)),
  box('D',P(8,2,0),P(10,8,5))
 ];
 const r=regionOnly(geometry,241);
 const H=r.projectedViews.find(v=>v.view==='H');
 assert.equal(r.sourceReviewMode,'m0-projected-region-geometry-only');
 assert.equal(H.exteriorClosedLoopCount,1);
 assert.equal(H.boundedHoleClosedLoopCount,1);
 assert.equal(H.simpleClosedLoopCount,2);
 assert.equal(H.sourceProjectedUnionAreaMm2,64);
 assert.equal(H.signedLoopAreasTotalMm2,64);
 const areas=H.certifiedSimpleClosedBoundaryCycles.map(c=>
  [c.kind,c.signedOrientedProjectedAreaMm2]);
 assert.ok(areas.some(([kind,area])=>
  kind==='exterior-projected-region-boundary'&&area===100));
 assert.ok(areas.some(([kind,area])=>
  kind==='bounded-hole-projected-region-boundary'&&area===-36));
 assert.equal(H.projectedLoopAreaAndUnionOccupancyNumericallyConsistent,true);
 assert.equal(H.unresolvedPointContactOrIncompleteCycleCount,0);
 assert.equal(r.allProjectedBoundaryCyclesSimpleAndClosedVerified,true);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
});
test('C2 two X-disjoint solids have two V/H outer components, but co-projected W is one loop, never 3D-joined',()=>{
 const g=sceneGate([A(),box('B',P(30,0,0),P(40,10,10))],242);
 const r=g.projectedUnionBoundaryTopologyEvidence;
 const V=r.projectedViews.find(x=>x.view==='V'),
  H=r.projectedViews.find(x=>x.view==='H'),
  W=r.projectedViews.find(x=>x.view==='W');
 assert.deepEqual([V.exteriorClosedLoopCount,H.exteriorClosedLoopCount,
  W.exteriorClosedLoopCount],[2,2,1]);
 assert.deepEqual([V.signedLoopAreasTotalMm2,H.signedLoopAreasTotalMm2,
  W.signedLoopAreasTotalMm2],[200,200,100]);
 assert.equal(r.allProjectedBoundaryCyclesSimpleAndClosedVerified,true);
 assert.ok(r.projectedViews.every(x=>x.certifiedSimpleClosedBoundaryCycles.every(
  c=>c.completeReal3DSourceJunctionsAndOcclusionVerified===false)));
 assert.equal(r.signedV5LineActions,0);
});
test('C2 diagonal vertex-only touching projected bodies are mathematically full occupied region, yet four-way point contact is nonmanifold and NO arbitrary loop order is certified',()=>{
 const geometry=[A(),box('B',P(10,10,0),P(20,20,10))];
 const r=regionOnly(geometry,243);
 const H=r.projectedViews.find(x=>x.view==='H');
 assert.equal(H.sourceProjectedUnionAreaMm2,200);
 assert.ok(H.fourWayProjectedPointContactVertexCount>0);
 assert.ok(H.unresolvedPointContactOrIncompleteCycleCount>0);
 assert.equal(H.allProjectedBoundaryComponentsAreSimpleCycles,false);
 assert.equal(H.projectedLoopAreaAndUnionOccupancyNumericallyConsistent,false);
 assert.equal(r.allProjectedBoundaryCyclesSimpleAndClosedVerified,false);
 assert.ok(H.exactProjectedBoundaryVertices.some(x=>
  x.nonManifoldProjectedFourWayPointContact&&x.degree===4&&
  !x.local2RegularJoinCandidate));
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
});
test('C2 exact full-face join eliminates the projected interior seam while preserving one closed outer ring in all views',()=>{
 const g=sceneGate([A(),box('B',P(10,0,0),P(20,10,10))],244);
 const r=g.projectedUnionBoundaryTopologyEvidence;
 assert.equal(r.totalExteriorClosedLoopCount,3);
 assert.ok(r.projectedViews.every(x=>x.simpleClosedLoopCount===1));
 assert.deepEqual(r.projectedViews.map(x=>x.signedLoopAreasTotalMm2),
  [200,200,100]);
 assert.equal(r.unresolvedNonManifoldOrOpenBoundaryComponentCount,0);
 assert.equal(r.signedV5LineActions,0);
});
test('C2 source geometry amendment, forged projected region, fake style and partial source proof fail closed',()=>{
 const geometry=[A(),B()],revision=245;
 const projectedUnionSilhouetteEvidence=
  auditOrthogonalProjectedUnionSilhouette({geometry,revision});
 const valid={geometry,revision,projectedUnionSilhouetteEvidence};
 assert.throws(()=>auditOrthogonalProjectedBoundaryTopology({
  ...valid,revision:-1}),/revision/);
 assert.throws(()=>auditOrthogonalProjectedBoundaryTopology({
  ...valid,projectedUnionSilhouetteEvidence:{
   ...projectedUnionSilhouetteEvidence,signedV5LineActions:1}
 }),/forged|stale/i);
 assert.throws(()=>auditOrthogonalProjectedBoundaryTopology({
  ...valid,projectedUnionSilhouetteEvidence:{
   ...projectedUnionSilhouetteEvidence,projectedViews:
    projectedUnionSilhouetteEvidence.projectedViews.slice(1)}
 }),/forged|stale/i);
 assert.throws(()=>auditOrthogonalProjectedBoundaryTopology({
  ...valid,projectedStrokePartitions:{}
 }),/complete M4\/M5 source chain/);
 const edited=[A(),box('B',P(6,5,5),P(15,15,15))];
 assert.throws(()=>auditOrthogonalProjectedBoundaryTopology({
  ...valid,geometry:edited}),/forged|stale/i);
});
test('C2 real M5 release gate reports proved region loop topology but leaves source V5 actions unsigned',()=>{
 const gate=sceneGate([A(),B()],246);
 const p=gate.projectedUnionBoundaryTopologyEvidence;
 assert.equal(gate.projectedUnionCertifiedSimpleLoopCount,
  p.totalSimpleClosedBoundaryLoopCount);
 assert.equal(gate.projectedUnionCertifiedExteriorLoopCount,
  p.totalExteriorClosedLoopCount);
 assert.equal(gate.projectedUnionCertifiedHoleLoopCount,
  p.totalProjectedHoleClosedLoopCount);
 assert.equal(gate.projectedUnionNonManifoldOrOpenLoopComponentCount,
  p.unresolvedNonManifoldOrOpenBoundaryComponentCount);
 assert.equal(gate.projectedUnionFourWayPointContactCount,
  p.totalFourWayProjectedPointContactCount);
 assert.equal(gate.signedCount,0);
 assert.equal(gate.generatedSourceStrokeSignedCount,0);
 assert.equal(gate.v5Ready,false);
 assert.ok(gate.spans.every(s=>s.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/projectedUnionCertifiedSimpleLoopCount/);
 assert.match(ui,/projectedUnionCertifiedHoleLoopCount/);
 assert.match(ui,/projectedUnionFourWayPointContactCount/);
 assert.match(ui,/不证明所有原始\/新生三维线的最终接合与标准虚实线/);
});
