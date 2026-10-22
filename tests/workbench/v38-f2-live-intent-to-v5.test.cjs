'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {confirmedFilletTimeline:solve}=
 require('../../workbench/v31-confirmed-fillet-v5.cjs');
const {createConfirmedFilletSession:createSession}=
 require('../../workbench/v31-fillet-session.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const P=(x,y)=>({x,y});
const seg=(x1,y1,x2,y2)=>({a:P(x1,y1),b:P(x2,y2)});
const sheet={origin:P(350,220),scale:5};
const cases=[
 {kind:'two-segments',geometry:{first:seg(-10,0,10,0),
  second:seg(0,-10,0,10)},r:3,selection:{branchId:'s++',direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'}},
 {kind:'two-circles',geometry:{first:{center:P(0,0),radius:5},
  second:{center:P(20,0),radius:5}},r:10,
  options:{firstMode:'external',secondMode:'external'},
  selection:{branchId:'center-1',direction:'cw',
   knownFirstTravel:'ccw',knownSecondTravel:'ccw'}},
 {kind:'segment-circle',geometry:{segment:seg(-15,0,15,0),
  circle:{center:P(0,5),radius:8}},r:3,options:{side:1},
  selection:{branchId:'candidate-1',direction:'ccw',
   lineTravel:'forward',knownCircleTravel:'cw'}}
];
function input(c,revision=5,s=sheet){
 return {problem:{kind:c.kind,unit:'mm',revision,
  filletRadius:c.r,geometry:structuredClone(c.geometry),
  ...(c.options?{options:structuredClone(c.options)}:{})},
  selection:structuredClone(c.selection),sheet:s};
}
for(const c of cases){
 test('F2 live '+c.kind+' uses actual intent output and same V5 timeline',()=>{
  const data=input(c),before=JSON.stringify(data),r=solve(data);
  assert.equal(r.status,'ready');
  assert.equal(r.mathematicallyVerified,true);
  assert.equal(r.revision,5);
  assert.equal(r.intentSchema,'draftai-r1-intent-projection/0.1');
  assert.equal(r.constructionIntentPrototype.length,r.steps.length);
  assert.equal(r.typedMathEvidence.g1Verified,true);
  for(const [i,intent] of r.constructionIntentPrototype.entries()){
   assert.equal(intent.sourceRevision,r.revision);
   assert.equal(intent.branchId,r.selectedBranchId);
   assert.deepEqual(intent.dependsOn,r.steps[i].dependsOn);
   assert.deepEqual(intent.outputEntityIds,r.steps[i].actions.map(a=>a.id));
   assert.deepEqual(intent.inputEntityIds,[]);
   assert.ok(intent.evidenceSource);
  }
  assert.equal(Timeline.frame(r.timing,r.timing.totalMs).done,true);
  const last=r.steps.at(-1).actions[0];
  assert.equal(last.kind,'arc');
  assert.match(Motion.actionShapeAttrs(last,1).d,/ A /);
  assert.equal(JSON.stringify(data),before,'solver must not mutate confirmed input');
 });
 test('F2 '+c.kind+' without selected branch or directed travel has no intents or V5 answer',()=>{
  const noBranch=input(c);delete noBranch.selection.branchId;
  const a=solve(noBranch);
  assert.notEqual(a.status,'ready');
  assert.deepEqual(a.steps,[]);
  assert.equal(a.constructionIntentPrototype,undefined);
  const noDir=input(c);delete noDir.selection.direction;
  const b=solve(noDir);
  assert.notEqual(b.status,'ready');
  assert.deepEqual(b.steps,[]);
 });
}
test('current real user session changes invalidate old intent and old V5 revision',()=>{
 const initial=input(cases[0]);
 const session=createSession(initial,{now:0});
 const first=session.snapshot(0);
 assert.equal(first.ready,true);
 assert.equal(first.plan.constructionIntentPrototype[0].sourceRevision,5);
 session.play(10);
 const edited=input({...cases[0],r:4},5);
 const newer=session.replace(edited,{expectedRevision:5,now:20});
 assert.equal(newer.ready,true);
 assert.equal(newer.revision,6);
 assert.equal(session.canRender(5),false);
 assert.equal(newer.plan.constructionIntentPrototype[0].sourceRevision,6);
 assert.notDeepEqual(newer.plan.typedMathEvidence.center,first.plan.typedMathEvidence.center);
 const noBranch=input(cases[0],5);delete noBranch.selection.branchId;
 const blocked=session.replace(noBranch,{expectedRevision:6,now:30});
 assert.equal(blocked.ready,false);
 assert.deepEqual(blocked.plan.steps,[]);
 assert.equal(session.canRender(6),false);
});
test('changed paper scale reprojects V5 and preserves mathematical result and selected intent branch',()=>{
 const a=solve(input(cases[1],3,sheet));
 const b=solve(input(cases[1],3,{origin:P(100,100),scale:9}));
 assert.equal(a.status,'ready');
 assert.equal(b.status,'ready');
 assert.deepEqual(a.typedMathEvidence,b.typedMathEvidence);
 assert.deepEqual(a.constructionIntentPrototype,b.constructionIntentPrototype);
 assert.notDeepEqual(a.steps.at(-1).actions[0].geometry.center,
  b.steps.at(-1).actions[0].geometry.center);
});
