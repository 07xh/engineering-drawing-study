'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {partitionReviewedSourceEdges}=
 require('../../workbench/scoped-projected-stroke-partition.cjs');
const {deriveProjectedCutEndpointTopology}=
 require('../../workbench/reviewed-projected-cut-endpoint-topology.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const p=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',p(0,0,0),p(10,10,10));
function audit(geometry,revision=8){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const partition=partitionReviewedSourceEdges({geometry,revision,
  sceneDepthEvidence:scene});
 const cuts=deriveProjectedCutEndpointTopology({geometry,revision,
  sceneDepthEvidence:scene});
 const release=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 return {scene,partition,cuts,release};
}
test('M4 source crease 0..10 gets true union feature CUTS at z=3 and z=7 in V/W, no invented H line',()=>{
 const geometry=[A(),box('B',p(10,0,3),p(18,10,7))];
 const {partition,cuts,release}=audit(geometry);
 assert.equal(partition.unionSourceFeatureScope,
  'source-orthogonal-union-open-sector-coverage');
 const id='A::V100|V101';
 for(const view of ['V','W']){
  const spans=partition.segments.filter(s=>s.sourceEdgeId===id&&s.view===view);
  assert.ok(spans.length>=3);
  const boundaries=new Set(spans.flatMap(s=>s.sourceParameterRange));
  assert.ok(boundaries.has(0.3));
  assert.ok(boundaries.has(0.7));
  assert.equal(Math.min(...boundaries),0);
  assert.equal(Math.max(...boundaries),1);
  assert.ok(spans.some(s=>s.unionOpenSourceFeatureStatus===
   'certified-flat-union-boundary-no-crease'));
  assert.ok(spans.some(s=>s.unionOpenSourceFeatureStatus===
   'certified-convex-exterior-open-crease'));
  for(const item of spans){
   assert.equal(item.unionOriginalSourceEndpointJoinVerified,false);
   assert.equal(item.officialLineStyleVerified,false);
   assert.equal(item.v5ActionApproved,false);
   if(item.unionOpenSourceBuriedOrFlatVerified)
    assert.equal(item.unionOpenSourceFeatureVerified,false);
  }
  // New 3D axial event is an M4 source cut, NOT a fabricated true mesh vertex.
  for(const t of [0.3,0.7]){
   const matches=cuts.cutEndpoints.filter(e=>e.view===view&&
    e.sourceEdgeId===id&&e.sourceParameter===t);
   assert.ok(matches.length>=2);
   assert.ok(matches.every(e=>e.source3DIncidenceVerified===false));
   assert.ok(matches.every(e=>e.sourceVertexKey===null));
   assert.ok(matches.every(e=>e.canonicalIntentApproved===false));
  }
 }
 assert.equal(partition.segments.filter(s=>
  s.sourceEdgeId===id&&s.view==='H').length,0);
 assert.equal(cuts.cutEndpoints.length,partition.segmentCount*2);
 assert.equal(release.spanCount,partition.segmentCount);
 assert.equal(release.signedCount,0);
 assert.equal(release.v5Ready,false);
 for(const s of release.spans.filter(s=>s.sourceEdgeId===id)){
  if(s.sourceUnionBuriedOrFlatOpenIntervalVerified){
   assert.equal(s.localPositiveOuterGeometryCandidate,false);
   assert.ok(s.missingProofs.includes(
    'source-crease-proven-flat-or-buried-in-composite-union'));
  }
 }
});
test('M4 touching full faces are explicitly classified flat without inventing a joint V5 line',()=>{
 const {partition,release}=audit([A(),box('B',p(10,0,0),p(20,10,10))],12);
 const s=partition.segments.filter(e=>e.sourceEdgeId==='A::V100|V101'&&
  ['V','W'].includes(e.view));
 assert.ok(s.length);
 assert.ok(s.every(e=>e.unionOpenSourceFeatureStatus===
  'certified-flat-union-boundary-no-crease'));
 assert.equal(release.signedCount,0);
 assert.equal(release.officialLineStylesVerified,false);
});
test('M4 opposing quadrant non-manifold edge contact remains undetermined source stroke',()=>{
 const {partition,release}=audit([A(),box('B',p(10,10,0),p(20,20,10))],14);
 const s=partition.segments.filter(e=>e.sourceEdgeId==='A::V110|V111');
 assert.ok(s.length);
 assert.ok(s.every(e=>e.unionOpenSourceFeatureStatus===
  'undetermined-nonmanifold-quadrant-touch'));
 assert.ok(s.every(e=>e.unionOpenSourceFeatureVerified===false));
 assert.equal(release.signedCount,0);
});
test('M4 revised source moves split param from .3/.7 to .2/.8 without inheriting V5 style authority',()=>{
 const a=audit([A(),box('B',p(10,0,3),p(18,10,7))],15);
 const b=audit([A(),box('B',p(10,0,2),p(18,10,8))],16);
 const coords=r=>new Set(r.partition.segments.filter(s=>
  s.sourceEdgeId==='A::V100|V101'&&s.view==='V')
   .flatMap(s=>s.sourceParameterRange));
 assert.ok(coords(a).has(0.3)&&coords(a).has(0.7));
 assert.ok(coords(b).has(0.2)&&coords(b).has(0.8));
 assert.equal(a.release.signedCount,0);
 assert.equal(b.release.signedCount,0);
 assert.equal(a.release.v5Ready,false);
 assert.equal(b.release.v5Ready,false);
});
test('M4 unrelated separated source boxes retain real source identity, no unsupported style claims',()=>{
 const {partition,release}=audit([A(),box('B',p(30,0,0),p(40,10,10))],17);
 assert.equal(partition.unionSourceFeatureScope,
  'source-orthogonal-union-open-sector-coverage');
 assert.ok(partition.segments.every(s=>s.sourceGeometryId===
  s.sourceEdgeId.split('::')[0]));
 assert.ok(partition.segments.every(s=>s.officialLineStyleVerified===false));
 assert.ok(release.spans.every(s=>s.authorizedStyle==='undetermined'));
 assert.equal(release.v5Ready,false);
});
