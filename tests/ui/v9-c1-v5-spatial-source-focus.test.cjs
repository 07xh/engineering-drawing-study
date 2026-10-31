'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const {deriveGeometryScene}=require('../../core/projection/geometry-scene-views.cjs');
const {project,toSheet}=require('../../core/projection/conventions.js');
const {currentC1V5SpatialSourceFocus:focus}=
 require('../../project/c1-v5-spatial-source-focus.cjs');
const {sourceFeatureKey}=
 require('../../project/geometry-scene-consumer.cjs');
const sheet={origin:{x:360,y:240},scale:4};
const p=(x,y,z)=>({x,y,z});
const source={id:'Original',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{A:p(0,0,0),B:p(10,0,0),
  C:p(0,5,0),D:p(10,5,0)},edges:[
   ['A','B'],['C','D'],['A','C'],['B','D'],['A','D']
  ],faces:[['A','B','D'],['A','D','C']]}
};
const visible='gb-t-4457.4-continuous-wide-visible-outline';
function fixture(){
 const scene=deriveGeometryScene({geometry:[source],revision:11});
 const a=source.data.points.A,b=source.data.points.B;
 const paperA=project(a).V,paperB=project(b).V;
 const from=toSheet('V',paperA,sheet),to=toSheet('V',paperB,sheet);
 const steps=[
  {id:'given',dependsOn:[],title:'原始已知条件',actions:[
   {id:'point0',kind:'point'}]},
  {id:'certified',dependsOn:['given'],title:'当前唯一 V5 原始棱',
   actions:[{id:'ink1',kind:'line',engineeringLineStyle:visible,
    geometry:{from,to}}]}
 ];
 const timeline=Timeline.compileTimeline(steps);
 const player=Timeline.createPlayer(timeline,{revision:11});
 const binding={actionId:'ink1',revision:11,sourceGeometryId:'Original',
  sourceEdgeId:'Original::A|B',view:'V',
  fromModelMm:{...paperA},toModelMm:{...paperB},
  fromSheetPx:{...from},toSheetPx:{...to},
  standardLineStyle:visible,signedFormalLineV5:true,
  completeClosedConvexOuterSilhouetteVerified:true
 };
 const solution={revision:11,singleOriginalV5Player:true,player,steps,timeline,
  intents:[],sceneResult:{scene},
  certifiedVisibleContourLineBindings:[binding],
  certifiedPhysicalLineBindings:[]};
 return {scene,solution,revision:11,frame:player.snapshot(),binding,
  startOfInk:timeline.segments.find(a=>a.id==='ink1').startMs};
}
const run=x=>focus({scene:x.scene,solution:x.solution,revision:x.revision,
 frame:x.frame});
const mutate=f=>{const x=fixture();f(x);return()=>run(x);};
test('frame 0 and unsigned construction guides cannot pre-highlight any future 3D answer',()=>{
 const x=fixture(),r=run(x);
 assert.deepEqual(r.sourceFeatureKeys,[]);
 assert.equal(r.formalV5ActionsCreated,0);
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.displayOnly,true);
 assert.equal(r.globalGeneratedHLRHistoryCertifiedByThisFocus,false);
 x.solution.player.seekStep(1,0);x.frame=x.solution.player.snapshot();
 assert.deepEqual(run(x).sourceFeatureKeys,[],'step title alone cannot reveal source');
});
test('only the actually advancing signed V5 action can focus its exact original 3D source',()=>{
 const x=fixture();
 x.solution.player.seekMs(x.startOfInk+10,0);x.frame=x.solution.player.snapshot();
 const r=run(x),canonical=x.scene.objects[0];
 assert.equal(r.activeStepId,'certified');
 assert.ok(r.originalSourceActions[0].progress>0);
 assert.deepEqual(r.sourceFeatureKeys,[sourceFeatureKey(canonical,{edgeIds:['A','B']})]);
 assert.equal(r.originalSourceActions[0].sourceEdgeId,'Original::A|B');
 assert.equal(r.originalSourceActions[0].certifiedV5ActionIdOnly,true);
});
test('distinct original 3D edges remain distinct when their V-view paper ink overlaps',()=>{
 const x=fixture();
 assert.deepEqual(project(source.data.points.A).V,project(source.data.points.C).V);
 assert.deepEqual(project(source.data.points.B).V,project(source.data.points.D).V);
 x.solution.player.seekMs(x.startOfInk+30,0);x.frame=x.solution.player.snapshot();
 const keys=run(x).sourceFeatureKeys;
 assert.equal(keys.length,1);
 assert.notEqual(keys[0],sourceFeatureKey(x.scene.objects[0],{edgeIds:['C','D']}));
});
test('a source identity from a different scene/revision or missing source edge fails closed',()=>{
 assert.throws(mutate(x=>{x.revision=12;}),/identity/);
 assert.throws(mutate(x=>{x.solution.sceneResult.scene=fixture().scene;}),/identity/);
 assert.throws(mutate(x=>{x.scene={...x.scene,revision:12};}),/identity/);
 const x=fixture();x.solution.player.seekMs(x.startOfInk+10,0);
 x.frame=x.solution.player.snapshot();
 x.binding.sourceEdgeId='Other::A|B';
 assert.throws(()=>run(x),/another geometry/);
 x.binding.sourceEdgeId='Original::A|D';
 x.binding.fromModelMm={u:1,v:0};
 assert.throws(()=>run(x),/contour does not match/);
});
test('forged sheet endpoints, duplicate or unowned signed actions cannot gain a 3D focus',()=>{
 const x=fixture();x.solution.player.seekMs(x.startOfInk+20,0);
 x.frame=x.solution.player.snapshot();x.binding.fromSheetPx.x+=1;
 assert.throws(()=>run(x),/source-paper binding/);
 const y=fixture();y.solution.player.seekMs(y.startOfInk+20,0);
 y.frame=y.solution.player.snapshot();
 y.solution.certifiedPhysicalLineBindings.push({...y.binding});
 assert.throws(()=>run(y),/signed source|duplicate/i);
 const z=fixture();z.solution.player.seekMs(z.startOfInk+20,0);
 z.frame=z.solution.player.snapshot();z.solution.certifiedVisibleContourLineBindings=[];
 assert.throws(()=>run(z),/unbound engineering/i);
});
test('a legitimate signed source partition can highlight only its actual 3D subspan',()=>{
 const x=fixture();x.solution.player.seekMs(x.startOfInk+20,0);
 x.frame=x.solution.player.snapshot();
 const b=x.binding;
 b.originalParameterRange=[0,.5];
 b.real3DFrom=p(0,0,0);b.real3DTo=p(5,0,0);
 b.toModelMm=project(b.real3DTo).V;
 const out=run(x);
 assert.deepEqual(out.originalSourceActions[0].sourceParameterRange,[0,.5]);
 b.real3DTo=p(5,1,0);
 assert.throws(()=>run(x),/not the signed original edge/);
});
test('the existing WebGL/SVG visualizers consume this focus without creating any player',()=>{
 const root=path.resolve(__dirname,'../..');
 const viewer=fs.readFileSync(path.join(root,'project/linked-three-scene-entry.js'),'utf8');
 const controller=fs.readFileSync(path.join(root,'project/unified-workbench-entry.cjs'),'utf8');
 assert.match(viewer,/activeV5SourceFeatures/);
 assert.match(viewer,/stepFocus\?0x00877d/);
 assert.match(controller,/currentC1V5SpatialSourceFocus\(/);
 assert.match(controller,/activeV5SourceFeatures:c1V5Focus\?\.sourceFeatureKeys\|\|\[\]/);
 assert.match(controller,/data-v5-source-focus/);
 assert.doesNotMatch(viewer,/new Timeline|createPlayer\(/);
});

test('a REAL independently reviewed skew-prism M0-M5 signed action locates its original 3D edge in the only V5',()=>{
 const {compileReviewedSolidVertexV5}=
  require('../../workbench/reviewed-solid-vertex-v5.cjs');
 const points={A:p(0,0,0),B:p(4,1,0),C:p(3,4,0),D:p(-1,3,0),
  E:p(1,-1,5),F:p(5,0,5),G:p(4,3,5),H:p(0,2,5)};
 const faces=[['A','D','C','B'],['E','F','G','H'],['A','B','F','E'],
  ['D','H','G','C'],['A','E','H','D'],['B','C','G','F']];
 const edges=[],seen=new Set();
 for(const face of faces)for(let i=0;i<face.length;i++){
  const a=face[i],b=face[(i+1)%face.length],key=[a,b].sort().join('|');
  if(!seen.has(key)){seen.add(key);edges.push([a,b]);}
 }
 const input={geometryId:'C1SourceReality',revision:11,unit:'mm',
  confirmedBy:'user',topologyConfirmed:true,
  vertices:Object.entries(points).map(([id,xyz])=>{
   const V=project(xyz).V,H=project(xyz).H;
   return {id,knownViews:{V:[V.u,V.v],H:[H.u,H.v]}};
  }),edges,faces};
 const solution=compileReviewedSolidVertexV5({input,sheetTransform:sheet});
 const binding=solution.certifiedPhysicalLineBindings[0];
 assert(binding,'requires a real positive M5 source-backed V5 action');
 const timing=solution.timeline.segments.find(t=>t.id===binding.actionId);
 assert(timing);
 solution.player.seekMs(timing.startMs+Math.min(10,timing.durationMs/2),0);
 const scene=solution.sceneResult.scene;
 const actual=focus({scene,solution,revision:11,frame:solution.player.snapshot()});
 assert.equal(actual.originalSourceActions.length,1);
 assert.equal(actual.originalSourceActions[0].actionId,binding.actionId);
 assert.equal(actual.originalSourceActions[0].sourceEdgeId,binding.sourceEdgeId);
 assert.deepEqual(actual.sourceFeatureKeys,[
  sourceFeatureKey(scene.objects.find(o=>o.id===binding.sourceGeometryId),{
   edgeIds:binding.sourceEdgeId.split('::')[1].split('|')
  })
 ]);
 assert.equal(actual.displayOnly,true);
 assert.equal(actual.formalV5ActionsCreated,0);
});
