'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS}=require('../../core/projection/conventions.js');
const {auditC1ConvexContourSourceCoverage:coverage}=
 require('../../workbench/m5-c1-convex-contour-source-coverage.cjs');
const {auditC1ContourPhysicalJunctionIncidence:junctions}=
 require('../../workbench/m5-c1-contour-physical-junction-incidence.cjs');
const {auditC1ContinuousFrontmostSourceRays:audit}=
 require('../../workbench/m5-c1-continuous-frontmost-source-rays.cjs');
const {compileReviewedSolidVertexV5}=
 require('../../workbench/reviewed-solid-vertex-v5.cjs');
const P=(x,y,z)=>({x,y,z});
function box(){
 const g=prismMesh({solid:{min:P(-4,5,-9),max:P(24,18,31)}});
 return {...g,id:'C1Source',data:{
  points:Object.fromEntries(Object.entries(g.data.points).map(([id,p])=>[id,{...p}])),
  edges:g.data.edges.map(e=>[...e]),faces:g.data.faces.map(f=>[...f])}};
}
function input(g,pair='VH',revision=11){
 return {confirmedBy:'user',topologyConfirmed:true,geometryId:g.id,
  revision,unit:'mm',edges:g.data.edges.map(e=>[...e]),
  faces:g.data.faces.map(f=>[...f]),
  vertices:Object.entries(g.data.points).map(([id,p])=>{
   const pv=project(p);
   return {id,knownViews:Object.fromEntries([...pair].map(v=>
    [v,[pv[v].u,pv[v].v]]))};
  })};
}
function collect(g,revision=11){
 const c=coverage({geometry:g,revision});
 const j=junctions({geometry:g,revision,contourCoverage:c});
 return {c,j,r:audit({geometry:g,revision,contourCoverage:c,physicalJunctionIncidence:j})};
}
const depth=(p,v)=>{
 const d=FIRST_ANGLE_OBSERVER_RAYS[v];
 return p.x*d.x+p.y*d.y+p.z*d.z;
};
function independentCheck(r,g,revision=11){
 assert.equal(r.status,'source-scoped-affine-depth-and-open-ray-verified');
 assert.equal(r.revision,revision);
 assert.equal(r.sourceGeometryId,g.id);
 assert.equal(r.authenticSourceAndPaperProjectionVerified,true);
 assert.equal(r.entireGlobalFinalStrokeTopologyVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 assert.equal(r.views.length,3);
 assert.ok(Object.isFrozen(r.views));
 const ids=new Set(g.data.edges.map(e=>g.id+'::'+[...e].sort().join('|')));
 let total=0;
 for(const v of r.views){
  assert.ok(['V','H','W'].includes(v.view));
  assert.equal(v.intervalCount,v.intervals.length);
  assert.equal(v.completeFinalEngineeringLineContourVerified,false);
  for(const s of v.intervals){
   total++;
   assert.equal(s.view,v.view);
   assert.equal(s.standardEngineeringLineStyle,'undetermined');
   assert.equal(s.signedV5LineAction,false);
   assert.equal(s.fullProjectedJunctionAndContourMembershipProven,false);
   assert.ok(s.sources.length>=1);
   assert.equal(s.sources.some(x=>x.fullOpenSubintervalClear&&
    x.fullOpenSubintervalStrictlyOccluded),false);
   for(const x of s.sources){
    assert.ok(ids.has(x.sourceEdgeId));
    assert.equal(x.officialEngineeringLineStyle,'undetermined');
    assert.equal(x.v5StrokeApproved,false);
    assert.ok(Math.abs(x.observerDepthAtFromMm-depth(x.from3D,v.view))<1e-8);
    assert.ok(Math.abs(x.observerDepthAtToMm-depth(x.to3D,v.view))<1e-8);
    const xy0=project(x.from3D)[v.view],xy1=project(x.to3D)[v.view];
    assert.ok(Math.hypot(xy0.u-s.paperFromModelMm.u,
     xy0.v-s.paperFromModelMm.v)<1e-7);
    assert.ok(Math.hypot(xy1.u-s.paperToModelMm.u,
     xy1.v-s.paperToModelMm.v)<1e-7);
   }
   if(s.uniqueStrictFrontPhysical3DSourceAmongListedCandidates){
    assert.ok(s.sources.some(x=>x.sourceEdgeId===s.uniqueStrictFrontSourceId));
    const lead=s.sources.find(x=>x.sourceEdgeId===s.uniqueStrictFrontSourceId);
    for(const another of s.sources.filter(x=>x!==lead)){
     assert.ok(lead.observerDepthAtFromMm-another.observerDepthAtFromMm>1e-8);
     assert.ok(lead.observerDepthAtToMm-another.observerDepthAtToMm>1e-8);
    }
   }else assert.equal(s.uniqueStrictFrontSourceId,null);
   for(const c of s.relativeSourceDepthComparisons){
    assert.ok(c.sourceEdgeIds.every(id=>ids.has(id)));
    assert.equal(c.officialLineStyleVerified,false);
    if(c.relativeDepthProvenForWholeInterval)
     assert.ok(c.depthDifferenceFromMm*c.depthDifferenceToMm>0);
    else assert.ok(c.relation.endsWith('undetermined'));
   }
  }
 }
 assert.equal(r.auditedIntervalCount,total);
}
test('C1 full V/H/W convex contour source order and continuous positive observer-ray independent checks',()=>{
 const g=box(),{r}=collect(g);
 independentCheck(r,g);
 assert.ok(r.auditedIntervalCount>=12);
 assert.ok(r.independentlyClearLeadingSourceIntervalCount>0);
 assert.equal(r.ambiguousDepthIntervalCount,0);
 assert.ok(r.views.every(x=>x.strictUniqueListedFrontCount>0));
});
test('C1 generic oblique convex mesh transformation keeps affine signed depth, no fake V5 line',()=>{
 const g=box(),angle=Math.PI/6;
 for(const p of Object.values(g.data.points)){
  const x=p.x+20,y=p.y-13;
  p.x=x*Math.cos(angle)-y*Math.sin(angle);
  p.y=x*Math.sin(angle)+y*Math.cos(angle);
  p.z+=4;
 }
 const {r}=collect(g);
 independentCheck(r,g);
 assert.ok(r.auditedIntervalCount>=12);
 assert.equal(r.signedV5LineActions,0);
});
test('C1 coplanar split is ignored in visible/hide source comparison candidates',()=>{
 const g=box(),ix=g.data.faces.findIndex(f=>f.every(id=>
  g.data.points[id].z===31));
 assert.ok(ix>=0);
 const face=g.data.faces.splice(ix,1)[0],diag=[face[0],face[2]];
 g.data.faces.push([face[0],face[1],face[2]],[face[0],face[2],face[3]]);
 g.data.edges.push(diag);
 const {r}=collect(g),fake=g.id+'::'+[...diag].sort().join('|');
 independentCheck(r,g);
 assert.ok(r.views.every(v=>v.intervals.every(s=>
  s.sources.every(x=>x.sourceEdgeId!==fake))));
});
test('C1 latest user-confirmed pair reuses same single original V5, never certifies edge strokes',()=>{
 const g=box();
 for(const pair of ['VH','VW','HW']){
  const proof=compileReviewedSolidVertexV5({input:input(g,pair),
   sheetTransform:{origin:{x:320,y:220},scale:2}});
  independentCheck(proof.continuousFrontmostSourceRays,proof.sceneResult.geometry);
  assert.equal(proof.vertexConstructionCount,8);
  assert.equal(proof.singleOriginalV5Player,true);
  assert.equal(proof.wholeSolidV5Ready,false);
  assert.equal(proof.officialSolidLineStylesVerified,false);
  assert.equal(proof.player.canRender(11),true);
  proof.player.invalidate(12,0);
  assert.equal(proof.player.canRender(11),false);
 }
});
test('C1 stale/tampered real source or projected endpoint claims fail closed',()=>{
 const g=box(),{c,j}=collect(g);
 assert.throws(()=>audit({geometry:g,revision:12,contourCoverage:c,
  physicalJunctionIncidence:j}),/unsigned current/);
 const fake=Object.freeze({...j,sourceGeometryId:'Wrong'});
 assert.throws(()=>audit({geometry:g,revision:11,contourCoverage:c,
  physicalJunctionIncidence:fake}),/unsigned current/);
 const first=j.views[0],original=first.junctions[0],
  wrong=Object.freeze({...original,
   fromSourceEndpoints:[{...original.fromSourceEndpoints[0],
    real3DPoint:P(999,999,999)}]});
 const forgery=Object.freeze({...j,views:[
  {...first,junctions:[wrong,...first.junctions.slice(1)]},
  ...j.views.slice(1)]});
 assert.throws(()=>audit({geometry:g,revision:11,contourCoverage:c,
  physicalJunctionIncidence:forgery}),
  /projection|interpolated|source 3D|unmatched/);
 const open=box();open.data.faces.pop();
 const uncovered=coverage({geometry:open,revision:11});
 assert.equal(uncovered.status,'not-covered');
});
