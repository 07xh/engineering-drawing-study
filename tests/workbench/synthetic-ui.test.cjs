'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Core=require('../../workbench/workbench-core.js');
const fixtures=require('../../workbench/fixture-data.js');
function result(status,extra={}){return {
 status,solutionCount:status==='unique'?1:status==='multiple'?2:status==='none'?0:null,
 globallyUnique:status==='unique'?true:false,degrees:status==='unique'?0:null,
 proofLevel:'analytic',...extra
};}
const verified={referencesValid:true,stepsVerified:true,inputRevisionMatches:true,mathValidated:true,actionGeometryBound:true,resultRefMatches:true};
test('both UI fixtures explicitly synthetic, valid and contain exactly two ordered steps',()=>{
 assert.equal(fixtures.length,2);
 for(const d of fixtures){assert.deepEqual(Core.validateFixture(d),{ok:true,errors:[]});assert.equal(d.scope,'ui-only');assert.equal(d.solveResult,null);assert.equal(d.steps.length,2);}
 assert.match(fixtures[0].title,/V\/H/);
 assert.match(fixtures[1].title,/偏移线/);
});
test('frames are deterministic; hint/draw cannot reveal future auxiliary lines',()=>{
 for(const d of fixtures){
  let state=Core.initialState(d);
  const given=Core.displayed(d,state).map(x=>x.id);
  assert.ok(given.length>0);
  assert.ok(Core.displayed(d,state).every(x=>['given','axis'].includes(x.role)));
  state=Core.transition(d,state,{type:'NEXT'});
  const one=Core.displayed(d,state).map(x=>x.id);
  state=Core.transition(d,state,{type:'NEXT'});
  const two=Core.displayed(d,state).map(x=>x.id);
  assert.ok(one.every(x=>two.includes(x)));
  state=Core.transition(d,state,{type:'PREV'});
  assert.deepEqual(Core.displayed(d,state).map(x=>x.id),one);
  state=Core.transition(d,state,{type:'MODE',value:'hint'});
  state=Core.transition(d,state,{type:'HINT'});
  assert.equal(state.stage,0);
  assert.deepEqual(Core.displayed(d,state).map(x=>x.id),given);
  state=Core.transition(d,state,{type:'MODE',value:'draw'});
  state=Core.transition(d,state,{type:'NEXT'});
  assert.deepEqual(Core.displayed(d,state).map(x=>x.id),given);
 }
});
test('validator rejects dangling, future, self, duplicated and numeric invalid references',()=>{
 const d=fixtures[0];
 const bad=[
  {...d,shapes:[...d.shapes,{...d.shapes[0]}]},
  {...d,shapes:d.shapes.map((x,i)=>i===0?{...x,geometry:{x:Infinity,y:0}}:x)},
  {...d,steps:[d.steps[0],{...d.steps[1],actionIds:['missing']}]},
  {...d,steps:[{...d.steps[0],dependsOn:['guide-vh']},d.steps[1]]},
  {...d,steps:[{...d.steps[0],dependsOn:['observe-vh']},d.steps[1]]},
  {...d,steps:[{...d.steps[0],actionIds:['v-point']},d.steps[1]]},
  {...d,steps:[d.steps[0],{...d.steps[1],id:d.steps[0].id}]},
  {...d,solveResult:{status:'unique',solutions:[{x:1,y:2}]}}
 ];
 for(const p of bad)assert.equal(Core.validateFixture(p).ok,false);
 assert.equal(Core.validateFixture({...d,synthetic:false}).ok,false);
});
test('changing input immediately invalidates old steps, autoplay, draft and result display',()=>{
 const d=fixtures[1];let s=Core.initialState(d);
 s=Core.transition(d,s,{type:'PLAY'});assert.equal(s.playing,true);
 s=Core.transition(d,s,{type:'NEXT'});assert.equal(s.stage,1);
 s=Core.transition(d,s,{type:'INPUT_CHANGED'});
 assert.equal(s.stale,true);assert.equal(s.playing,false);assert.equal(s.stage,0);assert.equal(s.hint,0);
 assert.match(Core.displayStatus(s),/失效/);
 assert.ok(Core.displayed(d,s).every(x=>x.role==='given'||x.role==='axis'));
 assert.equal(Core.transition(d,s,{type:'NEXT'}).stage,0);
 assert.equal(Core.transition(d,s,{type:'PLAY'}).playing,false);
});
test('student drawings are separate and reversible, never added to fixture geometry',()=>{
 const d=fixtures[0];const before=JSON.stringify(d);
 let s=Core.transition(d,Core.initialState(d),{type:'MODE',value:'draw'});
 s=Core.transition(d,s,{type:'DRAW',line:{x1:12,y1:20,x2:111,y2:202}});
 assert.equal(s.drawings.length,1);
 s=Core.transition(d,s,{type:'UNDO'});assert.equal(s.drawings.length,0);assert.equal(s.redo.length,1);
 s=Core.transition(d,s,{type:'REDO'});assert.equal(s.drawings.length,1);
 assert.equal(JSON.stringify(d),before);
 s=Core.transition(d,s,{type:'INPUT_CHANGED'});assert.equal(s.drawings.length,0);
});
test('all unsupported, underdetermined, contradictory and unselected-multiple cases block playback',()=>{
 for(const status of ['none','continuous','coincident','unsupported','undetermined']){
  const gate=Core.solveGate(result(status),verified);assert.equal(gate.playable,false,status);
 }
 let gate=Core.solveGate(result('multiple'),verified);assert.equal(gate.playable,false);
 gate=Core.solveGate(result('multiple'),{...verified,branches:[{id:'left',stepIds:['a']},{id:'right',stepIds:['b']}]});
 assert.equal(gate.playable,false);assert.match(gate.reason,/明确选择/);
 gate=Core.solveGate(result('multiple'),{...verified,branches:[{id:'left',stepIds:['a']},{id:'right',stepIds:['b']}],selectedBranchId:'right'});
 assert.equal(gate.playable,true);assert.match(gate.reason,/不代表全局唯一/);
 gate=Core.solveGate(result('multiple'),{...verified,branches:[{id:'same',stepIds:['a']},{id:'same',stepIds:['b']}],selectedBranchId:'same'});
 assert.equal(gate.playable,false);
});
test('unique requires consistent cardinality, genuine proof and all four verification gates',()=>{
 assert.equal(Core.solveGate(result('unique'),verified).playable,true);
 assert.equal(Core.solveGate(result('unique'),{...verified,stepsVerified:false}).playable,false);
 assert.equal(Core.solveGate(result('unique'),{...verified,inputRevisionMatches:false}).playable,false);
 assert.equal(Core.solveGate(result('unique'),{...verified,actionGeometryBound:false}).playable,false);
 assert.equal(Core.solveGate(result('unique'),{...verified,resultRefMatches:false}).playable,false);
 assert.equal(Core.solveGate(result('unique',{solutionCount:2}),verified).playable,false);
 assert.equal(Core.solveGate(result('unique',{proofLevel:'local-first-order'}),verified).playable,false);
 assert.equal(Core.solveGate(result('unique',{globallyUnique:null}),verified).playable,false);
});
test('synthetic fault probe always hides non-given shapes',()=>{
 const d=fixtures[1];
 for(const status of Core.STATUSES){
  const s=Core.transition(d,Core.initialState(d),{type:'STATUS_PROBE',value:status});
  assert.ok(Core.displayed(d,s).every(x=>x.role==='given'||x.role==='axis'),status);
  assert.equal(s.drawings.length,0);
  assert.equal(Core.transition(d,s,{type:'NEXT'}).stage,0);
  assert.ok(Core.displayStatus(s));
 }
});
test('HTML/CSS show structural workspace, accessible controls and responsive mobile rule',()=>{
 const root=path.resolve(__dirname,'../..');
 const html=fs.readFileSync(path.join(root,'workbench/index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'workbench/workbench.css'),'utf8');
 const ui=fs.readFileSync(path.join(root,'workbench/workbench-ui.js'),'utf8');
 for(const id of ['drawingBoard','fixtureSelect','previous','next','playPause','nextHint','undoDraw','redoDraw','threePane','toggleThree','status','statusProbe','mutateInput']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 for(const mode of ['full','hint','draw'])assert.ok(html.includes('data-mode="'+mode+'"'));
 assert.match(css,/@media\(max-width:767px\)/);
 assert.match(css,/@media\(max-width:430px\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/min-height:44px/);
 assert.match(ui,/pointerdown/);assert.match(ui,/pointermove/);assert.match(ui,/pointerup/);
 assert.match(ui,/pointercancel/);assert.match(ui,/lostpointercapture/);
 assert.match(ui,/data-student-preview/);assert.match(ui,/clearPointerPreview/);
 assert.match(ui,/ArrowLeft/);assert.match(ui,/ArrowRight/);
 assert.match(ui,/createElementNS/);assert.ok(!ui.includes('innerHTML='));
 assert.doesNotMatch(html,/\.\.\/site-ui\.css|https?:\/\/|\.\.\/core\//);
});
