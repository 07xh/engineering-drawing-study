'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS}=require('../../core/projection/conventions.js');
const {auditC1ConvexContourSourceCoverage:coverage}=
 require('../../workbench/m5-c1-convex-contour-source-coverage.cjs');
const {auditC1ContourPhysicalJunctionIncidence:audit}=
 require('../../workbench/m5-c1-contour-physical-junction-incidence.cjs');
const {compileReviewedSolidVertexV5}=
 require('../../workbench/reviewed-solid-vertex-v5.cjs');
const P=(x,y,z)=>({x,y,z});
const min=P(-4,7,-12),max=P(23,18,31);
function cuboid(){
 const x=prismMesh({solid:{min,max}});
 return {...x,id:'ReviewedC1',data:{
  points:Object.fromEntries(Object.entries(x.data.points).map(([id,p])=>[id,{...p}])),
  edges:x.data.edges.map(e=>[...e]),faces:x.data.faces.map(f=>[...f])}};
}
function given(g,pair,revision=31){
 return {geometryId:g.id,confirmedBy:'user',topologyConfirmed:true,
  revision,unit:'mm',edges:g.data.edges.map(e=>[...e]),
  faces:g.data.faces.map(f=>[...f]),vertices:
  Object.entries(g.data.points).map(([id,p])=>{
   const pv=project(p);
   return {id,knownViews:Object.fromEntries([...pair].map(v=>
    [v,[pv[v].u,pv[v].v]]))};
  })};
}
const paper={origin:{x:350,y:200},scale:2};
function ready(g,revision=31){
 const proof=coverage({geometry:g,revision});
 assert.equal(proof.status,'scoped-convex-hull-physical-source-coverage');
 return audit({geometry:g,revision,contourCoverage:proof});
}
function checks(r,g){
 assert.equal(r.status,'scoped-physical-3d-contour-endpoint-candidates');
 assert.equal(r.revision,31);
 assert.equal(r.sourceGeometryId,g.id);
 assert.equal(r.currentConvexSourceGeometryAndProjectionVerified,true);
 assert.equal(r.fullFinalContourJunctionTopologyCertified,false);
 assert.equal(r.continuousFinalStrokeVisibilityCertified,false);
 assert.equal(r.standardEngineeringLineStylesCertified,false);
 assert.equal(r.signedV5EdgeActions,0);
 assert.equal(r.completeSolidV5Ready,false);
 assert.ok(Object.isFrozen(r.views));
 assert.ok(r.physical3DJoinCandidateCount>0);
 let expectedCount=0;
 for(const view of r.views){
  assert.equal(view.allContourSidePaperEndpointsAccountedFor,true);
  assert.equal(view.officialLineStylesVerified,false);
  expectedCount+=view.endpointCount*2;
  for(const j of view.junctions){
   const p=j.projectedModelMm;
   assert.ok(j.fromSourceEndpoints.length>0);
   assert.ok(j.toSourceEndpoints.length>0);
   assert.equal(j.entireFinalContourJunctionCertified,false);
   assert.equal(j.standardEngineeringLineStyle,'undetermined');
   assert.equal(j.constructionIntentDAGV5Approved,false);
   for(const c of [...j.fromSourceEndpoints,...j.toSourceEndpoints]){
    const real=c.real3DPoint,q=project(real)[view.view];
    assert.ok(Math.hypot(p.u-q.u,p.v-q.v)<1e-7);
    assert.equal(c.currentSourceProjectionVerified,true);
    assert.equal(c.officialLineJoinAuthorized,false);
    assert.ok(g.data.edges.some(e=>
     c.sourceEdgeId===g.id+'::'+[...e].sort().join('|')));
    assert.ok(Object.values(real).every(Number.isFinite));
   }
   for(const pair of j.authenticatedCommon3DJoinCandidates){
    assert.equal(pair.sharedPhysical3DPointVerified,true);
    assert.equal(pair.entireDrawingContourJoinAndVisibilityVerified,false);
    const matching=j.fromSourceEndpoints.find(q=>
     q.sourceEdgeId===pair.arrivingSourceEdgeId&&
     Math.hypot(q.real3DPoint.x-pair.real3DPoint.x,
      q.real3DPoint.y-pair.real3DPoint.y,
      q.real3DPoint.z-pair.real3DPoint.z)<1e-7);
    assert.ok(matching);
   }
   const depths=j.distinct3DPhysicalPoints.map(pt=>{
    const d=FIRST_ANGLE_OBSERVER_RAYS[view.view];
    return pt.x*d.x+pt.y*d.y+pt.z*d.z;
   }).sort((a,b)=>b-a);
   assert.deepEqual(j.observerDepthMm,depths);
   if(j.paperProjectionHasPhysicallyDifferentDepthSources)
    assert.ok(j.distinct3DPointCount>1);
  }
 }
 assert.equal(r.inspectedContourIntervalEndpointCount,expectedCount);
}
test('C1 every V/H/W mathematical hull interval junction has authentic 3D candidates and observer-depth aliases',()=>{
 const g=cuboid(),r=ready(g);
 checks(r,g);
 assert.equal(r.views.length,3);
 assert.equal(r.views.every(v=>v.endpointCount===4),true);
 assert.equal(r.inspectedContourIntervalEndpointCount,24);
 // A box has back/front physical vertices projecting to the same paper
 // corners, even though front/back optical depths have opposite ranking.
 assert.ok(r.depthAliasedPaperJunctionCount>=4);
 assert.ok(r.views.every(v=>v.distinct3DProjectionAliasCount>0));
 assert.ok(r.views.every(v=>v.locallyMatchedPhysical3DEndpointCount>0));
});
test('C1 the same physical endpoint incidence survives translated and rotated reviewed convex source',()=>{
 const g=cuboid();
 const a=Math.PI/6;
 for(const p of Object.values(g.data.points)){
  const x=p.x+35,y=p.y-11;
  p.x=x*Math.cos(a)-y*Math.sin(a);
  p.y=x*Math.sin(a)+y*Math.cos(a);
  p.z+=7;
 }
 const r=ready(g);
 checks(r,g);
 assert.ok(r.inspectedContourIntervalEndpointCount>=24);
 assert.equal(r.signedV5EdgeActions,0);
});
test('C1 coplanar triangulation edge cannot become an authentic physical node partner',()=>{
 const g=cuboid(),i=g.data.faces.findIndex(face=>
  face.every(id=>g.data.points[id].z===max.z));
 assert.ok(i>=0);
 const f=g.data.faces.splice(i,1)[0];
 g.data.faces.push([f[0],f[1],f[2]],[f[0],f[2],f[3]]);
 const diagonal=g.id+'::'+[f[0],f[2]].sort().join('|');
 g.data.edges.push([f[0],f[2]]);
 const r=ready(g);
 checks(r,g);
 assert.ok(r.views.flatMap(v=>v.junctions).every(j=>
  [...j.fromSourceEndpoints,...j.toSourceEndpoints].every(s=>
   s.sourceEdgeId!==diagonal)));
});
test('C1 point V5 remains single original timeline and exposes only scoped endpoint candidates for all view pairs',()=>{
 const g=cuboid();
 for(const pair of ['VH','VW','HW']){
  const x=compileReviewedSolidVertexV5({
   input:given(g,pair),sheetTransform:paper});
  const r=x.contourPhysicalJunctionIncidence;
  assert.ok(r);
  checks(r,x.sceneResult.geometry);
  assert.equal(x.vertexConstructionCount,8);
  assert.equal(x.wholeSolidV5Ready,false);
  assert.equal(x.officialSolidLineStylesVerified,false);
  assert.equal(x.player.canRender(31),true);
  x.player.invalidate(32,0);
  assert.equal(x.player.canRender(31),false);
 }
});
test('C1 forged revision, physical source ID or unsigned proof cannot authorize a contour junction',()=>{
 const g=cuboid(),c=coverage({geometry:g,revision:31});
 assert.throws(()=>audit({geometry:g,revision:32,contourCoverage:c}),/proof/);
 assert.throws(()=>audit({geometry:g,revision:31,contourCoverage:{
  ...c,sourceGeometryId:'InventedSource'}}),/proof/);
 const view=c.views[0],side=view.sides[0],span=side.intervals[0];
 const fake=Object.freeze({...c,views:[{...view,sides:[{
  ...side,intervals:[{...span,sourceEdgeIds:['ReviewedC1::NotARealEdge']},
   ...side.intervals.slice(1)]},...view.sides.slice(1)]},
  ...c.views.slice(1)]});
 assert.throws(()=>audit({geometry:g,revision:31,contourCoverage:fake}),
  /nonphysical source/);
 const open=cuboid();open.data.faces.pop();
 const disallowed=coverage({geometry:open,revision:31});
 assert.equal(disallowed.status,'not-covered');
 assert.throws(()=>audit({geometry:open,revision:31,contourCoverage:disallowed}),
  /proof/);
});
