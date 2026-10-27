'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {compileScopedFullyProvenConvexC1}=
 require('../../workbench/c1-fully-proven-convex-third-view-delivery.cjs');
function source(pair,revision){
 const points={
  A:{x:0,y:0,z:0},B:{x:4,y:1,z:0},
  C:{x:3,y:4,z:0},D:{x:-1,y:3,z:0},
  E:{x:1,y:-1,z:5},F:{x:5,y:0,z:5},
  G:{x:4,y:3,z:5},H:{x:0,y:2,z:5}
 };
 const faces=[['A','D','C','B'],['E','F','G','H'],
  ['A','B','F','E'],['D','H','G','C'],
  ['A','E','H','D'],['B','C','G','F']];
 const seen=new Set(),edges=[];
 for(const face of faces)for(let i=0;i<face.length;i++){
  const a=face[i],b=face[(i+1)%face.length],
   key=[a,b].sort().join('|');
  if(!seen.has(key)){seen.add(key);edges.push([a,b]);}
 }
 return {geometryId:'ReviewedSkewPrismC1',revision,unit:'mm',
  confirmedBy:'user',topologyConfirmed:true,
  faces,edges,vertices:Object.entries(points).map(([id,p])=>{
   const view=project(p);
   return {id,knownViews:Object.fromEntries(pair.map(v=>
    [v,[view[v].u,view[v].v]]))};
  })};
}
for(const pair of [['V','H'],['V','W'],['H','W']]){
 test('real oblique 8-vertex convex prism fully certifies original-source edges for known '+
  pair.join(''),()=>{
  const input=source(pair,4),proof=compileScopedFullyProvenConvexC1({
   input,sheetTransform:{origin:{x:320,y:240},scale:5}
  });
  assert.equal(proof.allThreeViewsGlobalContourCertified,true);
  assert.equal(proof.allOriginalPositivePhysicalSourceRangesAccounted,true,
   JSON.stringify(proof.sourceCoverage.filter(x=>!x.completeAndNonOverlapping)));
  assert.equal(proof.scopedSingleConvexFullyCertified,true,
   JSON.stringify(proof.missingObligations));
  assert.equal(proof.missingView,['V','H','W'].find(v=>!pair.includes(v)));
  assert(proof.signedV5ActionCount>0);
  assert.match(proof.firstAngleOfficialThirdViewSvg,/<svg/);
  assert.equal(proof.originalV5ReusablePlayer.canRender(4),true);
  assert.equal(proof.realTextbookBlindTestPassed,false);
 });
}
