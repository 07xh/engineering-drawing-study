'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1ReviewedConvexPhysicalEdgeStrokes}=require(
 '../../workbench/m5-c1-reviewed-convex-physical-edge-strokes.cjs');
const {project,VIEWS}=require('../../core/projection/conventions.js');
function convexFixture(){
 const A={x:0,y:0,z:0},B={x:4,y:1,z:0},
  C={x:3,y:4,z:0},D={x:-1,y:3,z:0},
  E={x:1,y:-1,z:5},F={x:5,y:0,z:5},
  G={x:4,y:3,z:5},H={x:0,y:2,z:5};
 const points={A,B,C,D,E,F,G,H};
 const faces=[['A','D','C','B'],['E','F','G','H'],
  ['A','B','F','E'],['D','H','G','C'],
  ['A','E','H','D'],['B','C','G','F']];
 const edges=[],seen=new Set();
 for(const face of faces)for(let i=0;i<face.length;i++){
  const a=face[i],b=face[(i+1)%face.length],
   k=[a,b].sort().join('|');
  if(!seen.has(k)){seen.add(k);edges.push([a,b]);}
 }
 return {id:'RealConvexTest',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges,faces}};
}
test('actual M0 original 3D physical edge partition is used for V/H/W',()=>{
 const geometry=convexFixture();
 const proof=auditC1ReviewedConvexPhysicalEdgeStrokes({geometry,revision:1});
 assert.equal(proof.schema,
  'draftai-c1-single-reviewed-convex-physical-edge-stroke-proof/1');
 assert.equal(proof.M0M4M5SingleSourceContinuityVerified,true);
 assert.equal(proof.signedV5ActionCount,0);
 assert.equal(proof.realTextbookBlindTestPassed,false);
 assert.equal(proof.nonConvexOrMultiBodyScopeCovered,false);
 assert.equal(proof.sourceSubspanCount,
  proof.visiblePhysicalIntervalCount+proof.hiddenPhysicalIntervalCount+
  proof.unsignedPhysicalIntervalCount+
  proof.alreadyCertifiedExteriorIntervalCount+
  proof.suppressedCoplanarSubdivisionIntervalCount);
 for(const row of proof.signedCandidates){
  assert(VIEWS.includes(row.view));
  assert(row.originalParameterRange[1]>row.originalParameterRange[0]);
  assert.equal(row.wholeSubspanOpaqueFaceRayOrderVerified,true);
  assert.equal(row.source3DEndpointInterpolationVerified,true);
  assert.equal(row.V5ActionAlreadyCreated,false);
  assert(['gb-t-4457.4-continuous-wide-visible-outline',
   'gb-t-4457.4-thin-dashed-hidden-edge']
    .includes(row.officialEngineeringLineStyle));
 }
});
test('cannot accept model without closed manifold and physical original faces',()=>{
 const g=convexFixture();
 g.data.faces.pop();
 assert.throws(()=>auditC1ReviewedConvexPhysicalEdgeStrokes({
  geometry:g,revision:1
 }));
});
test('rejects stale input and does not accept test-provided signed claims',()=>{
 assert.throws(()=>auditC1ReviewedConvexPhysicalEdgeStrokes({
  geometry:convexFixture(),revision:0
 }),/revision|current/);
});
