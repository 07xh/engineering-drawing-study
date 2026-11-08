'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {compileScopedFullyProvenConvexC1}=
 require('../../workbench/c1-fully-proven-convex-third-view-delivery.cjs');
const sheet={origin:{x:320,y:270},scale:5};
function tetrahedron(){
 const points={
  A:{x:0,y:0,z:0},
  B:{x:5,y:1,z:0.5},
  C:{x:1,y:4,z:1.5},
  D:{x:2,y:2,z:6}
 };
 const faces=[['A','C','B'],['A','B','D'],['A','D','C'],['B','C','D']];
 const edges=[],seen=new Set();
 for(const face of faces)for(let i=0;i<face.length;i++){
  const a=face[i],b=face[(i+1)%face.length],k=[a,b].sort().join('|');
  if(!seen.has(k)){seen.add(k);edges.push([a,b]);}
 }
 return {geometryId:'FullTetraConvexC1',revision:1,unit:'mm',
  confirmedBy:'user',topologyConfirmed:true,
  vertices:Object.entries(points).map(([id,xyz])=>{
   const v=project(xyz);
   return {id,knownViews:{
    V:[v.V.u,v.V.v],H:[v.H.u,v.H.v]
   }};
  }),edges,faces};
}
test('real non-axis tetrahedron computes bounded complete positive C1 M0/M3/M4/M5/V5 source coverage',()=>{
 const proof=compileScopedFullyProvenConvexC1({
  input:tetrahedron(),sheetTransform:sheet
 });
 assert.equal(proof.missingView,'W');
 assert.equal(proof.allThreeViewsGlobalContourCertified,true);
 assert.equal(proof.allOriginalPositivePhysicalSourceRangesAccounted,true,
  JSON.stringify(proof.sourceCoverage.filter(x=>!x.completeAndNonOverlapping)));
 assert.equal(proof.scopedSingleConvexFullyCertified,true,
  proof.missingObligations.join(', '));
 assert(proof.signedV5ActionCount>0);
 assert.match(proof.firstAngleOfficialThirdViewSvg,/<svg/);
 assert.equal(proof.originalV5ReusablePlayer.canRender(1),true);
 assert.equal(proof.realTextbookBlindTestPassed,false);
 assert.equal(proof.fullGenericC1ImagesOrNonconvexVerified,false);
});
test('exact signed original edge coverage is revised after geometry edits',()=>{
 const input=tetrahedron();
 input.revision=3;
 const proof=compileScopedFullyProvenConvexC1({
  input,sheetTransform:sheet
 });
 assert.equal(proof.revision,3);
 assert.equal(proof.originalV5ReusablePlayer.canRender(3),true);
 assert.equal(proof.originalV5ReusablePlayer.canRender(1),false);
});
test('unsupported or unconfirmed original source cannot be silently signed',()=>{
 const input=tetrahedron();
 input.topologyConfirmed=false;
 assert.throws(()=>compileScopedFullyProvenConvexC1({
  input,sheetTransform:sheet
 }),/confirmed millimetre solid/);
});

/**
 * A non-axis-aligned, six-vertex, nine-edge, five-face closed convex prism.
 * All five original 3D face loops are oriented OUTWARD. The solver only
 * receives two projections per vertex; its third view is never pre-filled
 * from the independent reference coordinates in this test.
 *
 * This is a fresh generated convex fixture, not an unexamined textbook
 * photographic GIVEN or a universal nonconvex/C2 acceptance certificate.
 */
function obliqueSixVertexPrism(missingView='W',revision=41){
 const xyz={
  A:{x:0,y:0,z:0}, B:{x:12,y:1,z:2}, C:{x:4,y:3,z:10},
  D:{x:2,y:7,z:1}, E:{x:14,y:8,z:3}, F:{x:6,y:10,z:11}
 };
 const faces=[
  ['A','B','C'],['D','F','E'],
  ['A','D','E','B'],['B','E','F','C'],['C','F','D','A']
 ];
 const edges=[],seen=new Set();
 for(const face of faces)for(let i=0;i<face.length;i++){
  const a=face[i],b=face[(i+1)%face.length],key=[a,b].sort().join('|');
  if(!seen.has(key)){seen.add(key);edges.push([a,b]);}
 }
 const known=['V','H','W'].filter(view=>view!==missingView);
 return {
  geometryId:'C1ObliquePrism'+missingView,revision,unit:'mm',
  confirmedBy:'user',topologyConfirmed:true,
  vertices:Object.entries(xyz).map(([id,point])=>{
   const projections=project(point);
   const knownViews={};
   for(const view of known)knownViews[view]=[
    projections[view].u,projections[view].v
   ];
   return {id,knownViews};
  }),edges,faces
 };
}
test('new oblique six-vertex closed prism: independent C1 V/H input solves genuine W view and signed V5',()=>{
 const input=obliqueSixVertexPrism('W'),proof=compileScopedFullyProvenConvexC1({
  input,sheetTransform:sheet,includeCanonicalSolution:true
 });
 assert.equal(input.vertices.length,6);
 assert.equal(input.edges.length,9);
 assert.equal(input.faces.length,5);
 assert.ok(input.vertices.every(v=>!Object.hasOwn(v.knownViews,'W')),
  'do not feed final W projection to the solver');
 assert.equal(proof.missingView,'W');
 assert.equal(proof.scopedSingleConvexFullyCertified,true,
  JSON.stringify(proof.missingObligations));
 assert.equal(proof.allOriginalPositivePhysicalSourceRangesAccounted,true,
  JSON.stringify(proof.sourceCoverage.filter(r=>!r.completeAndNonOverlapping)));
 assert.ok(proof.sourceCoverage.length>=18,
  'a multi-face solid must exercise many physical source/view intervals');
 assert.ok(proof.signedV5ActionCount>0);
 assert.match(proof.firstAngleOfficialThirdViewSvg,/<svg/);
 assert.equal(proof.originalV5ReusablePlayer,proof.canonicalSolution.player,
  'keep ONE original ConstructionStep/V5 clock');
 assert.equal(proof.originalV5Timeline,proof.canonicalSolution.timeline);
 assert.equal(proof.realTextbookBlindTestPassed,false,
  'fresh synthetic geometry must never impersonate a real textbook blind solve');
});
test('same six-vertex oblique prism: swapping which two GIVEN views are used preserves source coverage',()=>{
 for(const missingView of ['H','V']){
  const input=obliqueSixVertexPrism(missingView,42);
  const proof=compileScopedFullyProvenConvexC1({
   input,sheetTransform:sheet
  });
  assert.equal(proof.missingView,missingView);
  assert.equal(proof.scopedSingleConvexFullyCertified,true,
   missingView+': '+proof.missingObligations.join(','));
  assert.equal(proof.allOriginalPositivePhysicalSourceRangesAccounted,true);
  assert.ok(proof.signedV5ActionCount>0);
  assert.equal(proof.originalV5ReusablePlayer.canRender(42),true);
  assert.equal(proof.originalV5ReusablePlayer.canRender(41),false);
  assert.equal(proof.realTextbookBlindTestPassed,false);
 }
});
