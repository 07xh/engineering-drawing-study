'use strict';
/** #377 F1 / #372 M4: independent cross-kind real solver -> proof-backed
 * timeline audit. Does not assert ConstructionIntent has been implemented.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const Bridge=require('../../workbench/verified-plan-v5-bridge.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');

const sheet={origin:{x:360,y:220},scale:8};
const cases=[
 ['segments',{first:{a:{x:-20,y:0},b:{x:20,y:0}},
  second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10,
  branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'}],
 ['circles',{first:{center:{x:0,y:0},radius:5},
  second:{center:{x:20,y:0},radius:5},filletRadius:10,
  firstMode:'external',secondMode:'external',branchId:'center-1',
  direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'}],
 ['segment-circle',{segment:{a:{x:-15,y:0},b:{x:15,y:0}},
  circle:{center:{x:0,y:5},radius:8},filletRadius:3,side:1,
  branchId:'candidate-1',direction:'ccw',lineTravel:'forward',
  knownCircleTravel:'cw'}]
];
test('F1 each existing real specialist preserves verified branch, revision and DAG dependencies',()=>{
 for(const [kind,input] of cases){
  const p=Bridge.filletTimeline(kind,input,sheet,17);
  assert.equal(p.status,'ready',kind);
  assert.equal(p.mathematicallyVerified,true,kind);
  assert.equal(p.revision,17,kind);
  assert.equal(p.selectedBranchId,input.branchId,kind);
  assert.ok(p.steps.length>0&&p.timing.totalMs>0,kind);
  const prior=new Set();
  for(const step of p.steps){
   assert.ok(step.id&&Array.isArray(step.dependsOn),kind);
   for(const dependency of step.dependsOn)
    assert.ok(prior.has(dependency),kind+' forward or missing dependency '+dependency);
   assert.ok(step.actions.length>0,kind);
   prior.add(step.id);
  }
  assert.equal(Timeline.frame(p.timing,p.timing.totalMs).done,true,kind);
 }
});
test('F1 unselected branches fail closed for every real specialist',()=>{
 for(const [kind,input] of cases){
  const incomplete={...input};
  delete incomplete.branchId;
  const p=Bridge.filletTimeline(kind,incomplete,sheet,18);
  assert.equal(p.status,'not-verified',kind);
  assert.equal(p.mathematicallyVerified,false,kind);
  assert.deepEqual(p.steps,[],kind);
 }
});
test('F1 proof-backed timeline is display-scale independent for all three solvers',()=>{
 for(const [kind,input] of cases){
  const a=Bridge.filletTimeline(kind,input,sheet,19);
  const b=Bridge.filletTimeline(kind,input,{origin:{x:100,y:150},scale:16},19);
  assert.equal(a.status,'ready',kind);
  assert.equal(b.status,'ready',kind);
  assert.deepEqual(a.steps.map(s=>s.id),b.steps.map(s=>s.id),kind);
  assert.deepEqual(a.originalLesson.result,b.originalLesson.result,kind);
  assert.equal(a.selectedBranchId,b.selectedBranchId,kind);
 }
});
