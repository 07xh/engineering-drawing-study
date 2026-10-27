'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {compileReviewedSolidVertexV5}=
 require('../../workbench/reviewed-solid-vertex-v5.cjs');
function input(){
 const points={
  A:{x:0,y:0,z:0},B:{x:4,y:1,z:0},
  C:{x:3,y:4,z:0},D:{x:-1,y:3,z:0},
  E:{x:1,y:-1,z:5},F:{x:5,y:0,z:5},
  G:{x:4,y:3,z:5},H:{x:0,y:2,z:5}};
 const faces=[['A','D','C','B'],['E','F','G','H'],
  ['A','B','F','E'],['D','H','G','C'],
  ['A','E','H','D'],['B','C','G','F']];
 const edges=[],known=new Set();
 for(const f of faces)for(let i=0;i<f.length;i++){
  const a=f[i],b=f[(i+1)%f.length],k=[a,b].sort().join('|');
  if(!known.has(k)){edges.push([a,b]);known.add(k);}
 }
 return {geometryId:'SkewPrismVerifiedC1',revision:1,unit:'mm',
  confirmedBy:'user',topologyConfirmed:true,
  vertices:Object.entries(points).map(([id,p])=>{
   const v=project(p);return {id,
    knownViews:{V:[v.V.u,v.V.v],H:[v.H.u,v.H.v]}};
  }),edges,faces};
}
test('real skewed prism C1 builds one V5 stream from M3 and source rays',()=>{
 const result=compileReviewedSolidVertexV5({input:input(),
  sheetTransform:{origin:{x:300,y:250},scale:5}});
 assert.equal(result.singleOriginalV5Player,true);
 assert.equal(result.sceneResult.missingView,'W');
 assert(result.physicalEdgeProof);
 assert.equal(result.physicalEdgeProof.M0M4M5SingleSourceContinuityVerified,true);
 assert.equal(result.certifiedPhysicalLineActionCount,
  result.certifiedPhysicalLineBindings.length);
 assert.equal(result.timeline.segments.length,
  result.steps.reduce((n,step)=>n+step.actions.length,0));
 assert.equal(result.player.canRender(1),true);
 for(const binding of result.certifiedPhysicalLineBindings){
  const action=result.steps.flatMap(s=>s.actions)
   .find(a=>a.id===binding.actionId);
  assert(action,'every positive M5 proof must have the real V5 action');
  assert.equal(action.engineeringLineStyle,binding.standardLineStyle);
 }
 assert.equal(result.wholeSolidV5Ready,false);
 assert.equal(result.realTextbookOriginalAccepted,false);
});
