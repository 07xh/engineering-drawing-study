'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {auditC1ConvexContourSourceCoverage:audit}=
 require('../../workbench/m5-c1-convex-contour-source-coverage.cjs');
const {compileReviewedSolidVertexV5}=
 require('../../workbench/reviewed-solid-vertex-v5.cjs');
const P=(x,y,z)=>({x,y,z});
function make(min=P(-3,4,-7),max=P(22,16,24)){
 return {...prismMesh({solid:{min,max}}),id:'Reviewed'};
}
function reviewed(g,pair,revision){
 return {confirmedBy:'user',topologyConfirmed:true,geometryId:g.id,
  revision,unit:'mm',edges:g.data.edges.map(x=>[...x]),
  faces:g.data.faces.map(f=>[...f]),
  vertices:Object.entries(g.data.points).map(([id,p])=>{
   const v=project(p);
   return {id,knownViews:Object.fromEntries([...pair].map(view=>
    [view,[v[view].u,v[view].v]]))};
  })};
}
const sheet={origin:{x:350,y:200},scale:2};
const segmentLength=(a,b)=>Math.hypot(b.u-a.u,b.v-a.v);
function assertProof(r,geometry){
 assert.equal(r.status,'scoped-convex-hull-physical-source-coverage');
 assert.equal(r.revision,13);
 assert.equal(r.sourceGeometryId,geometry.id);
 assert.equal(r.completeProjectedConvexBoundaryGeometryVerified,true);
 assert.equal(r.fullPhysicalSourceContourCoverageVerified,true);
 assert.equal(r.firstAngleSourceJoinCertified,false);
 assert.equal(r.entireFinalStrokeVisibilityVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.completeSolidV5Ready,false);
 assert.equal(r.views.length,3);
 assert.ok(Object.isFrozen(r.views));
 for(const v of r.views){
  assert.ok(['V','H','W'].includes(v.view));
  assert.equal(v.wholeConvex2DBoundaryVerified,true);
  assert.equal(v.everyHullSideCoveredByPhysicalSourceEdges,true);
  assert.equal(v.officialLineStylesVerified,false);
  for(const side of v.sides){
   assert.equal(side.geometricHullSideVerified,true);
   assert.equal(side.physicalSourceCoverageVerified,true);
   const length=segmentLength(side.fromModelMm,side.toModelMm);
   assert.ok(length>0);
   let last=0;
   for(const i of side.intervals){
    const [lo,hi]=i.projectedParameterRange;
    assert.ok(hi>lo);
    assert.ok(Math.abs(lo-last)<1e-7);
    last=hi;
    assert.equal(i.sourceGeometryId,geometry.id);
    assert.equal(i.view,v.view);
    assert.equal(i.geometricBoundarySourceCoverageVerified,true);
    assert.ok(i.sourceEdgeIds.length>=1);
    assert.equal(i.uniqueFinalPhysicalStrokeSourceVerified,false);
    assert.equal(i.completeProjectedEndpointJoinVerified,false);
    assert.equal(i.certifiedObserverRayForEntireFinalStroke,false);
    assert.equal(i.officialLineStyle,'undetermined');
    assert.equal(i.v5StrokeAuthorized,false);
    for(const id of i.sourceEdgeIds){
     const edge=r.edgeLedger.edges.find(e=>
      e.sourceEdgeId===id&&e.view===v.view);
     assert.ok(edge);
     assert.equal(edge.originalSingleSolidCreaseVerified,true);
     assert.equal(edge.originalCoplanarMeshSubdivisionVerified,false);
     const from={u:side.fromModelMm.u+
      (side.toModelMm.u-side.fromModelMm.u)*lo,
      v:side.fromModelMm.v+
      (side.toModelMm.v-side.fromModelMm.v)*lo};
     assert.ok(segmentLength(from,i.fromModelMm)<1e-8);
    }
   }
   assert.ok(Math.abs(last-1)<1e-7);
  }
 }
}
// Same geometric source in all 3 paper projections, not one special drawing.
test('C1 complete genuine hull side coverage with full original-edge rays across V/H/W',()=>{
 const g=make(),r=audit({geometry:g,revision:13});
 assertProof(r,g);
 assert.equal(r.boundarySideCount,12);
 assert.equal(r.views.every(v=>v.sideCount===4),true);
 const expected={V:(22+3)*(24+7),H:(22+3)*(16-4),W:(16-4)*(24+7)};
 for(const v of r.views){
  const points=v.sides.map(s=>s.fromModelMm);
  const signed=points.reduce((n,p,i)=>{
   const q=points[(i+1)%points.length];
   return n+p.u*q.v-p.v*q.u;
  },0)/2;
  assert.ok(Math.abs(signed-expected[v.view])<1e-7);
 }
});
test('C1 triangulated face creates internal mesh diagonal but not physical contour source',()=>{
 const g=make(),i=g.data.faces.findIndex(f=>f.every(id=>
  g.data.points[id].z===24));
 assert.ok(i>=0);
 const face=g.data.faces.splice(i,1)[0];
 g.data.faces.push([face[0],face[1],face[2]],
  [face[0],face[2],face[3]]);
 const diagonal=[face[0],face[2]];
 g.data.edges.push(diagonal);
 const r=audit({geometry:g,revision:13});
 assertProof(r,g);
 assert.equal(r.edgeLedger.sourceCreaseEvidence.provenCoplanarSubdivisionCount,1);
 assert.ok(r.views.flatMap(v=>v.sides).flatMap(s=>s.intervals)
  .every(x=>x.sourceEdgeIds.every(id=>id!==g.id+'::'+diagonal.sort().join('|'))));
});
test('C1 independent convex hull and M5 source evidence are consumed by the one original vertex V5 for all source pairs',()=>{
 const g=make();
 for(const pair of ['VH','VW','HW']){
  const x=compileReviewedSolidVertexV5({
   input:reviewed(g,pair,13),sheetTransform:sheet});
  assertProof(x.convexContourSourceCoverage,g);
  assert.equal(x.vertexConstructionCount,8);
  assert.equal(x.singleOriginalV5Player,true);
  assert.equal(x.officialSolidLineStylesVerified,false);
  assert.equal(x.wholeSolidV5Ready,false);
  assert.equal(x.player.canRender(13),true);
  x.player.invalidate(14,0);
  assert.equal(x.player.canRender(13),false);
 }
});
test('C1 unsupported open or incorrect source meshes cannot obtain global convex contour coverage',()=>{
 const g=make();g.data.faces.pop();
 const r=audit({geometry:g,revision:13});
 assert.equal(r.status,'not-covered');
 assert.equal(r.completeProjectedConvexBoundaryGeometryVerified,false);
 assert.equal(r.fullPhysicalSourceContourCoverageVerified,false);
 assert.equal(r.completeSolidV5Ready,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.throws(()=>audit({geometry:make(),revision:-1}),/revision/);
});
