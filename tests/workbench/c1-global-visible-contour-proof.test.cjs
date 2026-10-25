'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {auditC1GlobalVisibleContourProof:audit}=
 require('../../workbench/m5-c1-global-visible-contour-proof.cjs');
const {compileReviewedSolidVertexV5}=
 require('../../workbench/reviewed-solid-vertex-v5.cjs');
const vec=(x,y,z)=>({x,y,z});
const box=()=>{
 const g=prismMesh({solid:{min:vec(-4,5,-9),max:vec(24,18,31)}});
 return {...g,id:'C1HullProof',data:{
  points:Object.fromEntries(Object.entries(g.data.points).map(([k,v])=>[k,{...v}])),
  edges:g.data.edges.map(x=>[...x]),faces:g.data.faces.map(x=>[...x])}};
};
function input(g,pair='VH',revision=22){
 return {geometryId:g.id,confirmedBy:'user',topologyConfirmed:true,
  revision,unit:'mm',edges:g.data.edges.map(x=>[...x]),
  faces:g.data.faces.map(x=>[...x]),
  vertices:Object.entries(g.data.points).map(([id,p])=>({
   id,knownViews:Object.fromEntries([...pair].map(v=>{
    const q=project(p)[v];return [v,[q.u,q.v]];
   }))
  }))};
}
const tol=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v)<=1e-7;
function oracle(proof){
 let signed=0,blocked=0;
 for(const view of proof.views){
  assert.ok(['V','H','W'].includes(view.view));
  assert.equal(view.everyAtomicPaperHullSourceRetained,true);
  const c=proof.contourCoverage.views.find(x=>x.view===view.view);
  const ray=proof.continuousFrontmostSourceRays.views.find(x=>x.view===view.view);
  const physical=proof.contourPhysicalJunctionIncidence.views.find(x=>x.view===view.view);
  const original=c.sides.flatMap(s=>s.intervals);
  assert.equal(original.length,view.candidateIntervals.length);
  assert.equal(original.length,ray.intervals.length);
  assert.equal(original.length,physical.junctions.length);
  for(let i=0;i<view.candidateIntervals.length;i++){
   const line=view.candidateIntervals[i],hull=original[i],r=ray.intervals[i];
   assert.ok(tol(line.projectedFromModelMm,hull.fromModelMm));
   assert.ok(tol(line.projectedToModelMm,hull.toModelMm));
   const next=view.candidateIntervals[(i+1)%view.candidateIntervals.length];
   assert.ok(tol(line.projectedToModelMm,next.projectedFromModelMm));
   if(line.v5ActionAuthorized){
    signed++;
    assert.equal(line.sourceContourCoverageVerified,true);
    assert.equal(line.genuineFrontSourceEndpointJoinsVerified,true);
    assert.equal(line.continuouslyFrontRayClearVerified,true);
    assert.equal(line.locallyCompleteVisibleHullSegmentProven,true);
    assert.ok(hull.sourceEdgeIds.includes(line.sourceEdgeId));
    assert.ok(r.sources.some(s=>s.sourceEdgeId===line.sourceEdgeId&&
     s.fullOpenSubintervalClear&&
     ['x','y','z'].every(axis=>s.from3D[axis]===line.real3DFrom[axis]&&
      s.to3D[axis]===line.real3DTo[axis])));
    assert.equal(line.signedOfficialLineStyle,
     'gb-t-4457.4-continuous-wide-visible-outline');
    assert.equal(view.globalSingleConvexClosedVisibleContourVerified,true);
   }else{
    blocked++;
    assert.equal(line.signedOfficialLineStyle,'undetermined');
   }
  }
  if(!view.globalSingleConvexClosedVisibleContourVerified)
   assert.equal(view.candidateIntervals.every(x=>!x.v5ActionAuthorized),true);
 }
 assert.equal(proof.certifiedVisibleContourLineCount,signed);
 assert.equal(proof.nonExteriorInternalEdgesSigned,false);
 assert.equal(proof.hiddenLineTopologyAndStylesCertified,false);
 assert.equal(proof.canonicalV5ActionParityVerified,false);
 return {signed,blocked};
}
test('C1 validated cuboid has complete globally joined visible V/H/W silhouette source rings',()=>{
 const g=box(),p=audit({geometry:g,revision:22}),result=oracle(p);
 assert.equal(p.sourceGeometryId,g.id);
 assert.equal(p.acceptedFirstAngleViews.length,3);
 assert.equal(p.allThreeViewsGlobalContourCertified,true);
 assert.equal(result.signed,12);
 assert.equal(result.blocked,0);
});
test('C1 rotated valid convex solid never invents hidden/internal/coplanar split styles',()=>{
 const g=box(),rad=Math.PI/6;
 for(const p of Object.values(g.data.points)){
  const [x,y]=[p.x+5,p.y-7];
  p.x=x*Math.cos(rad)-y*Math.sin(rad);
  p.y=x*Math.sin(rad)+y*Math.cos(rad);
 }
 const result=oracle(audit({geometry:g,revision:22}));
 assert.ok(result.signed>=0);
});
test('C1 nonphysical coplanar diagonal never becomes a certified physical stroke',()=>{
 const g=box(),ix=g.data.faces.findIndex(face=>
  face.every(id=>g.data.points[id].z===31));
 assert.ok(ix>=0);
 const face=g.data.faces.splice(ix,1)[0];
 g.data.faces.push([face[0],face[1],face[2]],[face[0],face[2],face[3]]);
 g.data.edges.push([face[0],face[2]]);
 const diag=g.id+'::'+[face[0],face[2]].sort().join('|');
 const p=audit({geometry:g,revision:22});
 oracle(p);
 assert.ok(p.views.every(v=>v.candidateIntervals.every(i=>i.sourceEdgeId!==diag)));
});
test('C1 authentic source V/H/W known-view pair enters current canonical point V5 without signing hidden lines',()=>{
 const g=box();
 for(const pair of ['VH','VW','HW']){
  const result=compileReviewedSolidVertexV5({
   input:input(g,pair),
   sheetTransform:{origin:{x:350,y:195},scale:4}});
  assert.equal(result.globalVisibleContourProof.schema,
   'draftai-m5-c1-single-convex-visible-contour/1');
  assert.equal(result.globalVisibleContourProof.revision,22);
  assert.equal(result.player.canRender(22),true);
  result.player.invalidate(23,0);
  assert.equal(result.player.canRender(22),false);
 }
});
test('C1 degenerate/inconsistent or nonreviewed source refuses any positive silhouette theorem',()=>{
 const g=box();
 assert.throws(()=>audit({geometry:g,revision:0}),/reviewed/);
 assert.throws(()=>audit({geometry:{...g,unit:'px'},revision:22}),/reviewed/);
 const broken=box();broken.data.faces.pop();
 assert.throws(()=>audit({geometry:broken,revision:22}),/convex|proof|current/);
});
