'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project,VIEWS}=require('../../core/projection/conventions.js');
const {unresolvedC1PhysicalSourceRemainders:remainders}=
 require('../../workbench/c1-three-view-svg-sheet.cjs');
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
 assert(result.certifiedPhysicalLineActionCount>0,
  'at least one actual original source physical edge must become a formal V5 action');
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

test('real C1 V/H/W source partitions show only unsigned parameter remainders',()=>{
 const result=compileReviewedSolidVertexV5({input:input(),
  sheetTransform:{origin:{x:300,y:250},scale:5}});
 let positiveSigned=0;
 for(const view of VIEWS){
  const sources=result.scopedEdgePreviews.filter(line=>
   line.view===view&&!line.projectionCollapsedToPoint&&
   line.renderedAsPhysicalSourceCandidate);
  const signed=result.certifiedPhysicalLineBindings.filter(x=>x.view===view);
  const pending=remainders(sources,result.certifiedPhysicalLineBindings,view);
  positiveSigned+=signed.length;
  for(const source of sources){
   const spans=[
    ...signed.filter(x=>x.sourceEdgeId===source.sourceEdgeId)
     .map(x=>x.originalParameterRange),
    ...pending.filter(x=>x.sourceEdgeId===source.sourceEdgeId)
     .map(x=>x.originalParameterRange)
   ].sort((a,b)=>a[0]-b[0]);
   let cursor=0;
   for(const [a,b] of spans){
    assert.equal(a,cursor,'signed and unsigned original 3D spans must meet exactly');
    assert(b>a,'all original source spans must have positive parameter length');
    cursor=b;
   }
   assert.equal(cursor,1,'all original physical source [0,1] must be accounted for');
  }
  if(view===result.thirdViewDrawing.view){
   assert.deepEqual(result.thirdViewDrawing.unresolvedPhysicalEdges.map(x=>
    [x.sourceEdgeId,x.originalParameterRange]),pending.map(x=>
    [x.sourceEdgeId,x.originalParameterRange]));
   assert.equal(result.thirdViewDrawing.pendingPhysicalEdgeProofs.length,pending.length);
  }
 }
 assert(positiveSigned>0,'exercise actual independently signed M5 physical strokes');
});

test('canonical missing-view official V5 inventory includes both hull and M5 physical actions',()=>{
 const result=compileReviewedSolidVertexV5({input:input(),
  sheetTransform:{origin:{x:300,y:250},scale:5}});
 const view=result.thirdViewDrawing.view,
  hull=result.certifiedVisibleContourLineBindings.filter(x=>x.view===view),
  physical=result.certifiedPhysicalLineBindings.filter(x=>x.view===view),
  official=result.thirdViewDrawing.drawingLayers.officialV5StrokeActionIds;
 assert(physical.length>0,'real skewed source must have physical V5 actions');
 assert.deepEqual(official,[...hull.map(x=>x.actionId),
  ...physical.map(x=>x.actionId)]);
 assert.equal(new Set(official).size,official.length);
 assert(result.thirdViewDrawing.unresolvedPhysicalEdges.every(x=>
  x.standardLineStyle==='undetermined'&&x.v5ActionId===null));
});
