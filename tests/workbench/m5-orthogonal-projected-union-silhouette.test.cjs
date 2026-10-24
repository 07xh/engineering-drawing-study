'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const {auditOrthogonalProjectedUnionSilhouette}=
 require('../../workbench/m5-orthogonal-projected-union-silhouette.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',P(0,0,0),P(10,10,10));
const B=()=>box('B',P(5,5,5),P(15,15,15));
function gate(geometry,revision=211){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 return inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
}
test('C2 three first-angle projected union regions are mathematically COMPLETE for two partially overlapping closed cuboids',()=>{
 const g=gate([A(),B()]),r=g.projectedUnionSilhouetteEvidence;
 assert.equal(r.status,'complete-first-angle-orthogonal-projected-occupancy-boundary');
 assert.equal(r.viewCount,3);
 assert.deepEqual(r.projectedViews.map(v=>v.view),['V','H','W']);
 assert.deepEqual(r.projectedViews.map(v=>v.completeProjectedUnionAreaMm2),
  [175,175,175]);
 assert.equal(r.allProjectedOccupancyRegionBoundariesComplete,true);
 assert.ok(r.projectedExternalBoundarySegmentCount>0);
 assert.equal(r.projectedHoleBoundarySegmentCount,0);
 assert.equal(r.sourceUncoveredProjectedBoundarySegmentCount,
  r.projectedViews.flatMap(v=>v.boundaries).filter(s=>
   !s.originalOrGeneratedProjectedPhysicalSourceCoverageVerified).length);
 assert.ok(Object.isFrozen(r.projectedViews));
 assert.equal(r.fullEngineeringDrawingLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 for(const view of r.projectedViews){
  assert.equal(view.completeProjectedOccupancyRegionBoundaryVerified,true);
  assert.ok(view.filledOpenCellCount>0);
  assert.ok(view.boundaries.length>0);
  for(const s of view.boundaries){
   assert.equal(s.exactOpenCellOppositeOccupancyVerified,true);
   assert.equal(s.projectedEngineeringSolidDashedStyle,'undetermined');
   assert.equal(s.canonicalIntentDAGAndV5Approved,false);
   assert.equal(s.whole3DBooleanFeatureProvenanceAndOcclusionVerified,false);
   assert.ok(s.projectedFromModelMm.u===s.projectedToModelMm.u||
    s.projectedFromModelMm.v===s.projectedToModelMm.v);
   assert.ok(s.projectedFromModelMm.u!==s.projectedToModelMm.u||
    s.projectedFromModelMm.v!==s.projectedToModelMm.v);
  }
 }
 assert.equal(g.signedCount,0);
 assert.equal(g.v5Ready,false);
});
test('C2 face-connected box pair has one complete outside projected rectangle, NO internal source-interface boundary',()=>{
 const B2=box('B',P(10,0,0),P(20,10,10));
 const r=gate([A(),B2],212).projectedUnionSilhouetteEvidence;
 const V=r.projectedViews.find(v=>v.view==='V');
 const H=r.projectedViews.find(v=>v.view==='H');
 const W=r.projectedViews.find(v=>v.view==='W');
 assert.deepEqual([V.completeProjectedUnionAreaMm2,
  H.completeProjectedUnionAreaMm2,W.completeProjectedUnionAreaMm2],
  [200,200,100]);
 for(const v of [V,H]){
  // The x=10 common face is INTERNAL, never part of projected silhouette.
  assert.ok(v.boundaries.every(s=>
   !(s.projectedFromModelMm.u===10&&
     s.projectedToModelMm.u===10)));
 }
 assert.equal(r.projectedHoleBoundarySegmentCount,0);
 assert.equal(r.signedV5LineActions,0);
});
test('C2 disjoint solids remain two projected silhouette islands in V/H but ONE overlapped projected W rectangle',()=>{
 const far=box('B',P(30,0,0),P(40,10,10));
 const r=gate([A(),far],213).projectedUnionSilhouetteEvidence;
 const V=r.projectedViews.find(v=>v.view==='V');
 const H=r.projectedViews.find(v=>v.view==='H');
 const W=r.projectedViews.find(v=>v.view==='W');
 assert.equal(V.completeProjectedUnionAreaMm2,200);
 assert.equal(H.completeProjectedUnionAreaMm2,200);
 assert.equal(W.completeProjectedUnionAreaMm2,100);
 assert.equal(V.boundaries.length,8);
 assert.equal(H.boundaries.length,8);
 assert.equal(W.boundaries.length,4);
 assert.equal(r.allProjectedOccupancyRegionBoundariesComplete,true);
 assert.equal(r.fullEngineeringDrawingLineStylesVerified,false);
});
test('C2 four cuboids forming a projected ring create a genuine interior H hole boundary, not extra exterior strokes',()=>{
 const geometry=[
  box('A',P(0,0,0),P(10,2,5)),
  box('B',P(0,8,0),P(10,10,5)),
  box('C',P(0,2,0),P(2,8,5)),
  box('D',P(8,2,0),P(10,8,5))
 ];
 const r=gate(geometry,214).projectedUnionSilhouetteEvidence;
 const H=r.projectedViews.find(v=>v.view==='H');
 assert.equal(H.completeProjectedUnionAreaMm2,64);
 assert.ok(H.boundedHoleBoundarySegmentCount>=4);
 assert.equal(H.boundaries.filter(s=>s.type===
  'bounded-hole-projected-region-boundary').length,
  H.boundedHoleBoundarySegmentCount);
 assert.ok(H.outerBoundarySegmentCount>0);
 assert.equal(r.signedV5LineActions,0);
 assert.ok(H.boundaries.every(s=>s.projectedEngineeringSolidDashedStyle==='undetermined'));
});
test('C2 invalid or forged M0 source geometry and already-signed physical dedup evidence cannot certify projected region',()=>{
 const geometry=[A(),B()],revision=215;
 const r=gate(geometry,revision);
 const p=r.projectedUnionSilhouetteEvidence;
 assert.equal(p.status,'complete-first-angle-orthogonal-projected-occupancy-boundary');
 const d=r.exactPhysicalDedupEvidence;
 const args={
  geometry,revision,
  projectedStrokePartitions:{},
  generatedSubspanRayEvidence:{},
  unifiedProjectedFeatureEventEvidence:{},
  unifiedPaperSourceIdentityEvidence:{},
  exactPhysicalDedupEvidence:{...d,signedV5LineActions:1}
 };
 assert.throws(()=>auditOrthogonalProjectedUnionSilhouette(args),/forged|stale|source/i);
 const broken=A();broken.data.faces.pop();
 const failed=gate([broken,B()],216);
 assert.equal(failed.v5Ready,false);
 assert.equal(failed.signedCount,0);
});
test('C2 shared workbench inspector shows exact outer/hole boundary counts without prematurely issuing construction steps',()=>{
 const r=gate([A(),B()],217);
 const p=r.projectedUnionSilhouetteEvidence;
 assert.equal(r.completedProjectedUnionBoundarySegmentCount,p.projectedBoundarySegmentCount);
 assert.equal(r.completedProjectedOuterBoundarySegmentCount,p.projectedExternalBoundarySegmentCount);
 assert.equal(r.completedProjectedHoleBoundarySegmentCount,p.projectedHoleBoundarySegmentCount);
 assert.equal(r.unmatchedProjectedBoundarySegmentCount,p.sourceUncoveredProjectedBoundarySegmentCount);
 assert.equal(r.generatedSourceStrokeSignedCount,0);
 assert.equal(r.signedCount,0);
 assert.ok(r.spans.every(x=>x.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/completedProjectedOuterBoundarySegmentCount/);
 assert.match(ui,/completedProjectedHoleBoundarySegmentCount/);
 assert.match(ui,/unmatchedProjectedBoundarySegmentCount/);
 assert.match(ui,/不等于内部线型、唯一最终工程图或 V5/);
});
