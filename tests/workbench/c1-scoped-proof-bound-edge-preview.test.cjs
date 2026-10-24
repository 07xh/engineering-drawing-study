'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {compileReviewedSolidVertexV5}=
 require('../../workbench/reviewed-solid-vertex-v5.cjs');

const paper={origin:{x:350,y:195},scale:3};
const cuboid=()=>prismMesh({solid:{
 min:{x:-8,y:3,z:-5},max:{x:21,y:18,z:24}
}});
function source(mesh,pair='VH',revision=14){
 return {geometryId:'ReviewC1',confirmedBy:'user',topologyConfirmed:true,
  revision,unit:'mm',
  vertices:Object.entries(mesh.data.points).map(([id,p])=>{
   const projections=project(p);
   return {id,knownViews:Object.fromEntries([...pair].map(view=>
    [view,[projections[view].u,projections[view].v]]))};
  }),edges:mesh.data.edges.map(e=>[...e]),
  faces:mesh.data.faces.map(f=>[...f])};
}
const compile=(mesh,pair='VH',revision=14)=>compileReviewedSolidVertexV5({
 input:source(mesh,pair,revision),sheetTransform:paper
});
for(const pair of ['VH','VW','HW']){
 test('C1 '+pair+': projected source edge previews are bound to exact current M5 crease and V/H/W rays',()=>{
  const result=compile(cuboid(),pair);
  const {scopedEdgePreviews:previews,wholeSourceEdgeRayEvidence:m5,sceneResult:scene}=result;
  assert.equal(previews.length,36);
  assert.equal(previews.filter(x=>x.renderedAsPhysicalSourceCandidate).length,36);
  assert.ok(previews.every(x=>Object.isFrozen(x)));
  assert.ok(Object.isFrozen(previews));
  assert.equal(result.vertexConstructionCount,8);
  assert.equal(result.wholeSolidV5Ready,false);
  assert.equal(m5.signedEdgeV5Ready,false);
  // A cuboid has four viewing-direction edges collapsed in EACH
  // orthographic view. All other source edges cover geometric hull sides;
  // opposite-depth sources may overlap, yet no style is signed.
  assert.equal(m5.collapsedCount,12);
  assert.equal(m5.positiveFullSingleSolidHullGeometryEdgeCount,24);
  assert.ok(m5.positiveHullAndWholeFrontRayCandidateCount>0);
  assert.ok(m5.positiveHullAndWholeFrontRayCandidateCount<=24);
  assert.equal(result.player.canRender(14),true);
  for(const view of ['V','H','W']){
   assert.equal(previews.filter(e=>e.view===view).length,12);
   for(const e of previews.filter(e=>e.view===view)){
    const sourceEdge=m5.edges.filter(x=>x.view===view&&x.sourceEdgeId===e.sourceEdgeId);
    assert.equal(sourceEdge.length,1);
    const sourceRow=sourceEdge[0];
    assert.equal(e.revision,14);
    assert.equal(e.sourceGeometryId,scene.geometry.id);
    assert.deepEqual(e.fromModelMm,sourceRow.projectedFrom);
    assert.deepEqual(e.toModelMm,sourceRow.projectedTo);
    assert.equal(e.sourcePhysicalCreaseVerified,true);
    assert.equal(e.sourceCoplanarSubdivisionVerified,false);
    assert.equal(e.rayEvidenceStatus,sourceRow.status);
    assert.equal(e.projectedFullSingleSolidHullBoundaryVerified,
     sourceRow.projectedFullSingleSolidHullBoundaryVerified);
    assert.equal(e.projectedHullBoundarySideIndex,
     sourceRow.projectedHullBoundarySideIndex);
    assert.equal(e.singleSolidHullAndWholeFrontRayCandidateVerified,
     sourceRow.singleSolidHullAndWholeFrontRayCandidateVerified);
    assert.equal(e.continuousFrontRayClearVerified,sourceRow.continuouslyFrontRayClearVerified);
    assert.equal(e.entireEdgeStrictlyOccludedVerified,sourceRow.completeStrictInteriorOcclusionVerified);
    assert.equal(e.finalEngineeringLineStyle,'undetermined');
    assert.equal(e.officialV5Stroke,false);
   }
  }
 });
}
test('C1 triangulated flat face does not render its nonphysical subdivision as a real crease',()=>{
 const g=cuboid(),m={...g,data:{
  points:{...g.data.points},
  edges:g.data.edges.map(e=>[...e]),
  faces:g.data.faces.map(f=>[...f])
 }};
 const face=m.data.faces.shift();
 assert.equal(face.length,4);
 m.data.faces.unshift([face[0],face[1],face[2]],
  [face[0],face[2],face[3]]);
 m.data.edges.push([face[0],face[2]]);
 const r=compile(m);
 const diagonal='ReviewC1::'+[face[0],face[2]].sort().join('|');
 const flat=r.scopedEdgePreviews.filter(e=>e.sourceEdgeId===diagonal);
 assert.equal(flat.length,3);
 assert.ok(flat.every(e=>e.sourceCoplanarSubdivisionVerified));
 assert.ok(flat.every(e=>!e.renderedAsPhysicalSourceCandidate));
 assert.ok(flat.every(e=>!e.singleSolidHullAndWholeFrontRayCandidateVerified));
 assert.ok(flat.every(e=>e.finalEngineeringLineStyle==='undetermined'));
 assert.equal(r.scopedEdgePreviews.length,39);
 assert.equal(r.scopedEdgePreviews.filter(e=>e.renderedAsPhysicalSourceCandidate).length,36);
 assert.equal(r.wholeSolidV5Ready,false);
});
test('C1 mutated source revision cannot retain scoped geometry or V5 certification',()=>{
 const m=cuboid();
 const a=compile(m,'VH',18);
 const changed=prismMesh({solid:{
  min:{x:5,y:3,z:-5},max:{x:34,y:18,z:24}
 }});
 const b=compile(changed,'VH',19);
 assert.equal(a.scopedEdgePreviews.every(e=>e.revision===18),true);
 assert.equal(b.scopedEdgePreviews.every(e=>e.revision===19),true);
 assert.notDeepEqual(a.scopedEdgePreviews[0].fromModelMm,
  b.scopedEdgePreviews[0].fromModelMm);
 assert.equal(a.player.canRender(19),false);
 assert.equal(b.player.canRender(18),false);
 assert.equal(a.scopedEdgePreviews.every(e=>!e.officialV5Stroke),true);
 assert.equal(b.scopedEdgePreviews.every(e=>!e.officialV5Stroke),true);
});
test('C1 UI only paints verified-source scoped preview candidates, never signs lines',()=>{
 const ui=fs.readFileSync('labs/solid-third-view-live-entry.cjs','utf8');
 assert.match(ui,/certified\.scopedEdgePreviews\.filter/);
 assert.match(ui,/e\.renderedAsPhysicalSourceCandidate/);
 assert.match(ui,/data-ray-evidence/);
 assert.match(ui,/data-single-solid-hull/);
 assert.match(ui,/data-hull-and-front-ray/);
 assert.match(ui,/data-proof-scope/);
 assert.match(ui,/data-visibility','undetermined/);
 assert.match(ui,/data-official-v5','false/);
 assert.match(ui,/draw\(result,certified\)/);
 assert.doesNotMatch(ui,/data-official-v5','true/);
});

test('C1 hull/front-ray join matches independent box extrema after translation and scaling',()=>{
 for(const [min,max] of [
  [{x:-8,y:3,z:-5},{x:21,y:18,z:24}],
  [{x:5,y:-19,z:42},{x:63,y:11,z:100}],
  [{x:-500,y:-300,z:-400},{x:120,y:30,z:850}]
 ]){
  const mesh=prismMesh({solid:{min,max}}),r=compile(mesh,'HW',23);
  const points=mesh.data.points;
  for(const view of ['V','H','W']){
   const vv=Object.values(points).map(p=>project(p)[view]);
   const loU=Math.min(...vv.map(p=>p.u)),hiU=Math.max(...vv.map(p=>p.u));
   const loV=Math.min(...vv.map(p=>p.v)),hiV=Math.max(...vv.map(p=>p.v));
   for(const row of r.scopedEdgePreviews.filter(x=>x.view===view)){
    const a=row.fromModelMm,b=row.toModelMm;
    const independentExpected=!row.projectionCollapsedToPoint&&(
     (a.u===loU&&b.u===loU)||(a.u===hiU&&b.u===hiU)||
     (a.v===loV&&b.v===loV)||(a.v===hiV&&b.v===hiV));
    assert.equal(row.projectedFullSingleSolidHullBoundaryVerified,
     independentExpected,view+' '+row.sourceEdgeId);
    assert.equal(row.singleSolidHullAndWholeFrontRayCandidateVerified,
     Boolean(independentExpected&&row.continuousFrontRayClearVerified&&
      row.sourcePhysicalCreaseVerified));
    assert.equal(row.finalEngineeringLineStyle,'undetermined');
    assert.equal(row.officialV5Stroke,false);
   }
  }
  assert.equal(r.wholeSolidV5Ready,false);
 }
});
