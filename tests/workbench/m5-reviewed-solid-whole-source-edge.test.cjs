'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {auditReviewedSolidWholeSourceEdges}=
 require('../../workbench/m5-reviewed-solid-source-edge-ledger.cjs');
const {compileReviewedSolidVertexV5}=
 require('../../workbench/reviewed-solid-vertex-v5.cjs');
const cube=()=>prismMesh({solid:{min:{x:0,y:0,z:0},max:{x:20,y:10,z:14}}});
function reviewedInput(mesh,revision=3,pair='VH'){
 return {geometryId:'ReviewedSolid',confirmedBy:'user',topologyConfirmed:true,
  revision,unit:'mm',vertices:Object.entries(mesh.data.points).map(([id,p])=>{
   const v=project(p);
   return {id,knownViews:Object.fromEntries([...pair].map(view=>
    [view,[v[view].u,v[view].v]]))};
  }),edges:mesh.data.edges.map(x=>[...x]),faces:mesh.data.faces.map(x=>[...x])};
}
test('M5 12 authentic cuboid source edges × V/H/W have accountable complete ray scopes',()=>{
 const geo={...cube(),id:'ReviewedSolid'};
 const r=auditReviewedSolidWholeSourceEdges({geometry:geo,revision:3});
 assert.equal(r.status,'scoped-full-original-source-edge-ray-evidence');
 assert.equal(r.sourceProjectedEdgeCount,36);
 assert.equal(r.positiveWholeVisibleRayCount+r.provenWholeOccludedCount+
  r.collapsedCount+r.undeterminedCount,36);
 assert.equal(r.completeSolidVisibilityVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedEdgeV5Ready,false);
 assert.ok(Object.isFrozen(r.edges));
 for(const item of r.edges){
  assert.ok(['V','H','W'].includes(item.view));
  assert.equal(item.sourceGeometryId,'ReviewedSolid');
  assert.deepEqual(item.fullOriginalSourceParameterRange,[0,1]);
  assert.equal(item.standardEngineeringLineStyle,'undetermined');
  assert.equal(item.V5LineActionSignedOff,false);
  assert.equal(item.allProjectedJunctionContinuityVerified,false);
  if(item.continuouslyFrontRayClearVerified){
   assert.equal(item.trueOriginalEndpointRaysVerified,true);
   assert.equal(item.completeStrictInteriorOcclusionVerified,false);
  }
  if(item.completeStrictInteriorOcclusionVerified)
   assert.equal(item.continuouslyFrontRayClearVerified,false);
 }
 assert.ok(r.positiveWholeVisibleRayCount>0);
});
test('M5 true source proof changes with revision, no stale official line or geometry certification',()=>{
 const original=cube(),altered=prismMesh({solid:{
  min:{x:-4,y:1,z:0},max:{x:27,y:10,z:14}}});
 const a=auditReviewedSolidWholeSourceEdges({geometry:{
  ...original,id:'ReviewedSolid'},revision:4});
 const b=auditReviewedSolidWholeSourceEdges({geometry:{
  ...altered,id:'ReviewedSolid'},revision:5});
 assert.equal(a.revision,4);
 assert.equal(b.revision,5);
 assert.equal(b.signedEdgeV5Ready,false);
 assert.notDeepEqual(a.edges[0].projectedFrom,b.edges[0].projectedFrom);
});
test('M5 open/invalid source is never promoted into official solid source strokes',()=>{
 const open={...cube(),id:'ReviewedSolid'};
 open.data.faces.pop();
 const result=auditReviewedSolidWholeSourceEdges({geometry:open,revision:3});
 assert.equal(result.status,'not-covered');
 assert.equal(result.signedEdgeV5Ready,false);
 assert.throws(()=>auditReviewedSolidWholeSourceEdges({
  geometry:{...cube(),id:'ReviewedSolid'},revision:-1}),/revision/);
 assert.throws(()=>auditReviewedSolidWholeSourceEdges({geometry:{
  ...cube(),id:'ReviewedSolid',unit:'px'},revision:3}),/current 3D convex mesh/);
});
test('M5 existing C1 certified point DAG remains independent of unapproved edge strokes',()=>{
 const mesh=cube();
 const r=compileReviewedSolidVertexV5({input:reviewedInput(mesh),
  sheetTransform:{origin:{x:350,y:195},scale:4}});
 assert.equal(r.certifiedPointConstructionReady,true);
 assert.equal(r.vertexConstructionCount,8);
 assert.equal(r.wholeSourceEdgeRayEvidence.status,
  'scoped-full-original-source-edge-ray-evidence');
 assert.equal(r.wholeSourceEdgeRayEvidence.sourceProjectedEdgeCount,36);
 assert.equal(r.wholeSourceEdgeRayEvidence.officialLineStylesVerified,false);
 assert.equal(r.officialSolidLineStylesVerified,false);
 assert.equal(r.wholeSolidV5Ready,false);
 assert.ok(r.intents.every(i=>i.source.proofScope!=='full-mesh-visible-line'));
 assert.equal(r.player.canRender(r.revision),true);
});
test('M5 published C1 page exposes bounded ray evidence, not a certified solid plan',()=>{
 const ui=fs.readFileSync('labs/solid-third-view-live-entry.cjs','utf8');
 assert.match(ui,/wholeSourceEdgeRayEvidence/);
 assert.match(ui,/接合\/轮廓\/标准实虚线均未认证/);
 assert.match(ui,/compileReviewedSolidVertexV5/);
});
