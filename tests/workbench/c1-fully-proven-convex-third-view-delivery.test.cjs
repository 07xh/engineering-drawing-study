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
