'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Store=require('../../labs/dof-lab-state.js');
const G=require('../../labs/dof-lab-geometry.js');
const Sync=require('../../workbench/dof-synchronized-reveal.cjs');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' != '+b);
const initial=()=>Store.compute(Store.create());
const count=(plan,frame)=>Sync.presentation(plan,frame);
const makeNode=kind=>{
 const attrs={};return {attrs,
  getAttribute(k){return k==='data-kind'?kind:attrs[k]},
  setAttribute(k,v){attrs[k]=String(v)}};
};
test('full 3 DOF: P* remains a feasible SAMPLE in synchronized space + paper',()=>{
 const report=initial(),plan=Sync.build(report,{revision:1});
 assert.equal(report.analysis.result.degrees,3);
 assert.equal(plan.degreeStatus,'sample');assert.equal(plan.degrees,3);
 assert.match(plan.label,/P\*.*(?:不代表|不是)唯一解/);
 assert.equal(plan.steps.length,5);
 assert.equal(plan.guides.length,4);
 assert.equal(plan.timeline.segments.length,5);
 assert.equal(plan.timeline.steps.length,5);
 assert.deepEqual(Object.keys(plan.sheetPoints).sort(),['H','M','V','W']);
 assert.ok(plan.timeline.totalMs>3000);
});
test('known H projection yields one DOF; adding z establishes a UNIQUE point',()=>{
 const withH=Store.apply(Store.create(),{type:'add',
  condition:{type:'projection',plane:'H',value:[15,10]}});
 const p1=Sync.build(Store.compute(withH),{revision:10});
 assert.equal(p1.degrees,1);assert.equal(p1.degreeStatus,'sample');
 const withZ=Store.apply(withH,{type:'add',
  condition:{type:'coordinate',axis:'z',value:12}});
 const result=Store.compute(withZ),p2=Sync.build(result,{revision:11});
 assert.equal(p2.degrees,0);assert.equal(p2.degreeStatus,'unique');
 assert.deepEqual(p2.modelPoint,{x:15,y:10,z:12});
 assert.deepEqual(p2.sheetPoints,G.transfer({x:15,y:10,z:12}).points);
 for(const k of ['sameX','sameHeight','sameDepth','miterOn45'])
  assert.equal(G.transfer(p2.modelPoint).checks[k],true);
});
test('incompatible condition blocks both dimensions and all verified marker playback',()=>{
 let s=Store.apply(Store.create(),{type:'add',
  condition:{type:'coordinate',axis:'x',value:15}});
 s=Store.apply(s,{type:'add',
  condition:{type:'coordinate',axis:'x',value:16}});
 const result=Store.compute(s),p=Sync.build(result,{revision:2});
 assert.equal(result.analysis.result.inconsistent,true);
 assert.equal(p.status,'blocked');assert.equal(p.timeline,null);
 assert.throws(()=>Sync.createPlayer(p),/cannot animate/);
 assert.equal(count(p,null).ready,false);
});
test('V5 media time drives 4 verified sheet guides then one shared 3D/2D point',()=>{
 const p=Sync.build(initial(),{revision:4});
 const player=Sync.createPlayer(p,{speed:1});
 player.play(0);
 let first=count(p,player.snapshot(360));
 close(first.guideFractions[0],.5);
 assert.deepEqual(first.guideFractions.slice(1),[0,0,0]);
 assert.equal(first.targetOpacity,0,'do not disclose target point before guides complete');
 player.seekStep(4,500);
 let pre=count(p,player.snapshot(500));
 assert.deepEqual(pre.guideFractions,[1,1,1,1]);
 assert.equal(pre.targetOpacity,0);
 player.play(500);
 let reveal=count(p,player.snapshot(870));
 close(reveal.targetOpacity,.5);
 assert.equal(reveal.ready,true);
 player.setSpeed(2,870);
 let done=count(p,player.snapshot(1400));
 close(done.targetOpacity,1);
 assert.equal(player.snapshot().done,true);
});
test('invalidated revision can NEVER render a stale 3D or orthographic animation',()=>{
 const p=Sync.build(initial(),{revision:23}),player=Sync.createPlayer(p);
 player.play(0);const frame=player.snapshot(850);
 assert.ok(count(p,frame).guideFractions[0]>0);
 player.invalidate(24,850);
 assert.equal(count(p,player.snapshot()).ready,false);
 const newPoint=Sync.build(initial(),{revision:24});
 assert.equal(count(newPoint,frame).ready,false);
 assert.equal(count(p,null).targetOpacity,0);
});
test('SVG renderer grows existing guide lines and synchronizes all V/H/W markers',()=>{
 const p=Sync.build(initial(),{revision:7});
 const nodes=p.guides.map(g=>makeNode(g.kind));
 const targets=Array.from({length:6},()=>makeNode());
 const paper={querySelectorAll(q){
  if(q==='.sheet-helper-lines line[data-kind]')return nodes;
  if(q==='.sheet-target-projections circle, .sheet-target-projections text')return targets;
  throw Error('unexpected selector '+q);
 }};
 Sync.paintSheet(paper,p,{ready:true,guideFractions:[.5,0,1,1],targetOpacity:.25});
 const a=nodes[0].attrs;
 assert.equal(a.opacity,'1');
 close(Number(a.x2),(p.guides[0].from.x+p.guides[0].to.x)/2);
 assert.equal(nodes[1].attrs.opacity,'0');
 assert.ok(targets.every(n=>n.attrs.opacity==='0.25'));
 const marker=makeNode(),label=makeNode(),calls=[];
 const space={querySelectorAll(q){
  assert.equal(q,'.locus-point, .locus-label');return [marker,label];
 }};
 const viewer={setTargetOpacity(alpha){calls.push(alpha)}};
 Sync.paintSpace(space,viewer,{ready:true,targetOpacity:.25});
 assert.deepEqual(calls,[.25]);
 assert.equal(marker.attrs.opacity,'0.25');
 assert.equal(label.attrs.opacity,'0.25');
 Sync.paintSpace(space,viewer,{ready:false,targetOpacity:0});
 assert.equal(marker.attrs.opacity,'1','full static view restored when animation stops');
});
test('all preset reference polyhedra use same first-angle transfer checks',()=>{
 for(const id of Object.keys(G.PRESETS)){
  let s=Store.apply(Store.create(),{type:'set-model',value:id});
  const p=Sync.build(Store.compute(s),{revision:1});
  assert.equal(p.status,'ready');
  assert.equal(p.degreeStatus,'sample');
  for(const chk of Object.values(G.transfer(p.modelPoint).checks))assert.equal(chk,true);
 }
});
test('wrongly claimed globally unique/sample status is always rejected',()=>{
 const base=initial(),bogus={...base,point:{...base.point,exampleIsUnique:true}};
 assert.equal(Sync.build(bogus).status,'blocked');
 const notFinite={...base,point:{...base.point,example:{x:Infinity,y:1,z:2}}};
 assert.equal(Sync.build(notFinite).status,'blocked');
 assert.throws(()=>Sync.build(base,{revision:-1}));
});
test('public DOF tool gets accessible playback UI and bundled 3D/SVG fallback',()=>{
 const root=path.resolve(__dirname,'../..');
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const html=read('labs/dof-lab-v2.html'),ui=read('labs/dof-lab-v2-ui.js');
 const webgl=read('labs/dof-lab-three-entry.js'),svg=read('labs/dof-lab-spatial-svg.js');
 const build=read('scripts/build-static.cjs');
 for(const id of ['syncPlay','syncRestart','syncSpeed','syncProgress','syncPercent',
  'syncExplanation','syncCaption','syncPrevious','syncNext','syncStep',
  'syncReasonHeading','syncReasonTitle','syncReasonWhy','syncReasonBasis',
  'syncReasonDof','syncReasonCheck','syncReasonEvidence'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
 assert.match(html,/P\*/);
 assert.match(ui,/Sync\.build\(report,\{revision:syncRevision\}\)/);
 assert.match(ui,/haltSync\(\)/);
 assert.match(ui,/syncPlayer\.seekProgress/);
 assert.match(webgl,/window\.DrawingLabSyncV5=SyncV5/);
 assert.match(webgl,/window\.DrawingLabStepReasons=ReasonV5/);
 assert.match(ui,/Reasons\.build\(report,plan\)/);
 assert.match(webgl,/function setTargetOpacity/);
 assert.match(svg,/class="locus-label"/);
 assert.match(build,/dof-lab-three-entry\.js/);
 assert.match(html,/dof-lab-three-bundle\.js/);
 assert.doesNotMatch(ui,/fetch\(|XMLHttpRequest|localStorage/);
});


test('tampered rank, affine proof or fake zero-degree uniqueness never receives a teaching result',()=>{
 const base=initial();
 const badRank={...base,analysis:{...base.analysis,result:{
  ...base.analysis.result,rank:3,degrees:0}},
  point:{...base.point,degrees:0,kind:'point',exampleIsUnique:true}};
 assert.equal(Sync.build(badRank).status,'blocked');
 const fakeParticular={...base,analysis:{...base.analysis,result:{
  ...base.analysis.result,particular:[900,700,500]}}};
 assert.equal(Sync.build(fakeParticular).status,'blocked');
 const activeNotSolved={...base,active:[{type:'coordinate',axis:'x',value:18}]};
 assert.equal(Sync.build(activeNotSolved).status,'blocked');
 // With zero constraints, any finite sample is allowed: don't falsely reject it.
 const unconstrainedSample={...base,point:{...base.point,
  example:{...base.point.example,x:1e7}}};
 assert.equal(Sync.build(unconstrainedSample).degreeStatus,'sample');
});
test('mathematical gate rejects a feasible-line sample that does not satisfy H projection',()=>{
 const withH=Store.apply(Store.create(),{type:'add',
  condition:{type:'projection',plane:'H',value:[15,10]}});
 const valid=Store.compute(withH);
 assert.equal(Sync.build(valid).degreeStatus,'sample');
 const bad={...valid,point:{...valid.point,example:{...valid.point.example,y:14}}};
 assert.equal(Sync.build(bad).status,'blocked','wrong projected depth cannot be animated');
});
test('repeated, redundant constraints preserve unique proof and avoid false conflicts',()=>{
 let state=Store.create();
 state=Store.apply(state,{type:'add',condition:{type:'projection',plane:'V',value:[35,51]}});
 state=Store.apply(state,{type:'add',condition:{type:'projection',plane:'H',value:[35,22]}});
 state=Store.apply(state,{type:'add',condition:{type:'coordinate',axis:'x',value:35}});
 const report=Store.compute(state);
 assert.equal(report.analysis.result.degrees,0);
 const plan=Sync.build(report,{revision:31});
 assert.equal(plan.degreeStatus,'unique');
 assert.deepEqual(plan.modelPoint,{x:35,y:22,z:51});
 const player=Sync.createPlayer(plan,{speed:4});
 player.play(0);assert.equal(Sync.presentation(plan,player.snapshot(9000)).targetOpacity,1);
});

test('V5 discrete stage start keeps the 3D/P-star outcome withheld until explicit completion',()=>{
 const plan=Sync.build(initial(),{revision:45}),clock=Sync.createPlayer(plan);
 const steps=plan.timeline.steps;
 assert.equal(steps.length,5);
 for(let index=0;index<steps.length;index++){
  const shot=clock.seekStep(index,1000+index);
  const visual=Sync.presentation(plan,shot);
  assert.equal(visual.ready,true);
  assert.equal(visual.targetOpacity,0,'no result before the verified final step action');
  assert.deepEqual(visual.guideFractions,steps.slice(0,4).map((_,j)=>j<index?1:0));
  assert.equal(shot.activeStepIndex,index);
 }
 let atEnd=clock.seekStep(5,2000),visual=Sync.presentation(plan,atEnd);
 assert.equal(atEnd.done,true);assert.equal(visual.targetOpacity,1);
 assert.deepEqual(visual.guideFractions,[1,1,1,1]);
 atEnd=clock.seekStep(4,2001);visual=Sync.presentation(plan,atEnd);
 assert.equal(atEnd.done,false);
 assert.equal(visual.targetOpacity,0,'previous step must retract verified target reveal');
});
