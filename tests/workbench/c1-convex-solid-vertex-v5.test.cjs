'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project,toSheet}=require('../../core/projection/conventions.js');
const {compileReviewedSolidVertexV5}=
 require('../../workbench/reviewed-solid-vertex-v5.cjs');
const {assertM3ToV5Consistency}=
 require('../../workbench/m3-v5-consistency-gate.cjs');
const M=require('../../workbench/teaching-motion-v5.js');
const sheetTransform={origin:{x:350,y:195},scale:4};
const cuboid=(min={x:0,y:0,z:0},max={x:30,y:15,z:20})=>
 prismMesh({solid:{min,max}});
function given(mesh,pair='VH',revision=9){
 return {geometryId:'ReviewedSolid',confirmedBy:'user',
  topologyConfirmed:true,revision,unit:'mm',
  vertices:Object.entries(mesh.data.points).map(([id,p])=>{
   const projection=project(p);
   return {id,knownViews:Object.fromEntries([...pair].map(v=>[
    v,[projection[v].u,projection[v].v]]))};
  }),edges:mesh.data.edges.map(e=>[...e]),
  faces:mesh.data.faces.map(f=>[...f])};
}
const build=(mesh,pair='VH',revision=9)=>compileReviewedSolidVertexV5({
 input:given(mesh,pair,revision),sheetTransform});
for(const pair of ['VH','VW','HW']){
 test('C1 '+pair+' 8 true proven vertices share ORIGINAL V5 construction timeline',()=>{
  const m=cuboid(),x=build(m,pair);
  assert.equal(x.vertexConstructionCount,8);
  assert.equal(x.certifiedPointConstructionReady,true);
  assert.equal(x.singleOriginalV5Player,true);
  assert.equal(x.wholeSolidV5Ready,false);
  assert.equal(x.officialSolidLineStylesVerified,false);
  assert.equal(x.completeDrawingExportAllowed,false);
  assert.equal(x.sceneResult.provenEdgeCount,12);
  assert.equal(x.vertexBindings.length,8);
  assert.equal(x.vertexBindings.every(b=>b.vertexConstructionVerified),true);
  assert.ok(x.intents.length>=8);
  assert.equal(x.steps.length,x.intents.length);
  assert.equal(new Set(x.steps.map(s=>s.id)).size,x.steps.length);
  assert.equal(new Set(x.steps.flatMap(s=>s.actions.map(a=>a.id))).size,
    x.steps.flatMap(s=>s.actions).length);
  assertM3ToV5Consistency({revision:9,intents:x.intents,steps:x.steps,
   timing:x.timeline,sheet:sheetTransform});
  const missing=['V','H','W'].find(v=>!pair.includes(v));
  for(const b of x.vertexBindings){
   const pos=m.data.points[b.vertexId];
   assert.deepEqual(b.proven3DPoint,pos);
   assert.deepEqual(b.provenThirdSheetPoint,
    toSheet(missing,project(pos)[missing],sheetTransform));
   assert.equal(b.firstAngleMissingView,missing);
   assert.equal(b.correspondingEdgeVisibilityVerified,false);
   const action=x.steps.flatMap(s=>s.actions).find(a=>a.id===b.finalActionId);
   assert.equal(action.kind,'point');
   assert.deepEqual(action.geometry.center,b.provenThirdSheetPoint);
  }
  assert.equal(x.player.canRender(9),true);
  x.player.seekStep(x.steps.length,0);
  const frame=x.player.snapshot(0);
  assert.equal(frame.done,true);
  assert.ok(frame.completedIds.length>0);
  const line=x.steps.flatMap(s=>s.actions).find(a=>a.kind==='line');
  const attrs=M.actionShapeAttrs(line,0.6);
  assert.equal(typeof attrs.x1,'number');
  assert.equal(typeof attrs.x2,'number');
  x.player.invalidate(10,0);
  assert.equal(x.player.canRender(9),false);
 });
}
test('C1 same genuine point V5 supports non-cuboid reviewed convex topology',()=>{
 const mesh={data:{points:{
  A:{x:0,y:0,z:0},B:{x:20,y:0,z:0},
  C:{x:0,y:20,z:0},D:{x:0,y:0,z:24}},
  edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
  faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]}};
 const x=build(mesh,'VW');
 assert.equal(x.vertexConstructionCount,4);
 assert.equal(x.sceneResult.provenFaceCount,4);
 assert.equal(x.wholeSolidV5Ready,false);
});
test('C1 geometry revision changes all point step source revision without replaying old proof',()=>{
 const a=build(cuboid(), 'VH',3);
 const b=build(cuboid({x:0,y:0,z:0},{x:34,y:15,z:22}),'VH',4);
 assert.notDeepEqual(a.vertexBindings[1].proven3DPoint,
  b.vertexBindings[1].proven3DPoint);
 assert.ok(a.intents.every(i=>i.source.revision===3));
 assert.ok(b.intents.every(i=>i.source.revision===4));
 assert.equal(a.player.canRender(4),false);
 assert.equal(b.player.canRender(3),false);
});
test('C1 incomplete mesh, falsified source pair, wrong unit and missing confirmation fail closed',()=>{
 const base=given(cuboid());
 base.vertices[0].knownViews.H[0]+=7;
 assert.throws(()=>compileReviewedSolidVertexV5({input:base,sheetTransform}),
  /unique 3D vertex/);
 const faces=given(cuboid());faces.faces.pop();
 assert.throws(()=>compileReviewedSolidVertexV5({input:faces,sheetTransform}),
  /closed|Euler|edge|boundary/i);
 const p=given(cuboid());p.confirmedBy=null;
 assert.throws(()=>compileReviewedSolidVertexV5({input:p,sheetTransform}),
  /confirmed/);
 const bad=given(cuboid());bad.vertices[0].knownViews.W=[15,10];
 assert.throws(()=>compileReviewedSolidVertexV5({input:bad,sheetTransform}),
  /same source views/);
 const badSheet={origin:{x:0,y:0},scale:Infinity};
 assert.throws(()=>compileReviewedSolidVertexV5({
  input:given(cuboid()),sheetTransform:badSheet}),/finite shared V5/);
});
test('C1 tampered point action cannot pass real M3→Intent→DAG→one V5 parity',()=>{
 const x=build(cuboid());
 const steps=x.steps.map(s=>({...s,actions:s.actions.map(a=>({...a}))}));
 const owner=steps.find(s=>s.actions.some(a=>a.kind==='point'));
 owner.actions[0].geometry={...owner.actions[0].geometry,center:{x:-99,y:99}};
 assert.throws(()=>assertM3ToV5Consistency({revision:9,intents:x.intents,
  steps,timing:x.timeline,sheet:sheetTransform}),/geometry differs/);
});
