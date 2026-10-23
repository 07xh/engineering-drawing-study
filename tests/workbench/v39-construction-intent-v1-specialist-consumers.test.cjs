'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {verifiedConstructionIntentV1:run}=
 require('../../workbench/verified-construction-intent-v1.cjs');
const {CONSTRUCTION_INTENT_VERSION:VERSION,
 validateConstructionIntentDAG}=require('../../core/contracts/construction-intent.js');
const {filletTimeline,pointTimeline}=
 require('../../workbench/verified-plan-v5-bridge.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const P=(x,y)=>({x,y});
const seg=(x1,y1,x2,y2)=>({a:P(x1,y1),b:P(x2,y2)});
const fillets=[
 ['segments',{first:seg(-20,0,20,0),second:seg(0,-20,0,20),
  filletRadius:10,branchId:'s++',direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'}],
 ['circles',{first:{center:P(0,0),radius:5},
  second:{center:P(20,0),radius:5},filletRadius:10,
  firstMode:'external',secondMode:'external',branchId:'center-1',
  direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'}],
 ['segment-circle',{segment:seg(-15,0,15,0),
  circle:{center:P(0,5),radius:8},filletRadius:3,side:1,
  branchId:'candidate-1',direction:'ccw',lineTravel:'forward',
  knownCircleTravel:'cw'}]
];
const paper={origin:P(360,220),scale:8};
for(const [kind,base] of fillets){
 test('02 '+kind+' computes versioned intent DAG and identical current V5 from real solver',()=>{
  const input=structuredClone(base),start=JSON.stringify(input);
  const result=run(kind,input,paper,6);
  const original=filletTimeline(kind,input,paper,6);
  assert.equal(result.status,'ready');
  assert.equal(result.schema,VERSION);
  assert.equal(result.intents.length,original.steps.length);
  assert.equal(result.mathematicallyVerified,true);
  assert.equal(validateConstructionIntentDAG(result.intents).ok,true);
  assert.deepEqual(result.steps,original.steps);
  assert.deepEqual(result.timing,original.timing);
  assert.ok(result.intents.every(x=>x.source.revision===6&&
   x.source.branchId===input.branchId&&
   x.source.proofScope==='selected-directed-fillet'&&
   x.source.proofLevel==='selected-directed-g1'));
  assert.equal(JSON.stringify(input),start);
  assert.equal(Timeline.frame(result.timing,result.timing.totalMs).done,true);
  const finalOp=result.intents.at(-1).operations[0];
  assert.equal(finalOp.kind,'directed-arc');
  assert.equal(finalOp.coordinateSpace,'model-mm');
  const arc=result.steps.at(-1).actions[0];
  assert.match(Motion.actionShapeAttrs(arc,1).d,/ A /);
 });
 test('02 '+kind+' refuses absent branch or G1 direction instead of drawing',()=>{
  const missing={...structuredClone(base)};
  delete missing.branchId;
  const a=run(kind,missing,paper,7);
  assert.equal(a.status,'not-verified');
  assert.deepEqual(a.intents,[]);assert.deepEqual(a.steps,[]);
  const noDirection=structuredClone(base);delete noDirection.direction;
  const b=run(kind,noDirection,paper,8);
  assert.equal(b.status,'not-verified');
  assert.deepEqual(b.steps,[]);
 });
 test('02 '+kind+' sheet scale changes pixels, never solver-math intent coordinates',()=>{
  const data=structuredClone(base);
  const a=run(kind,data,paper,9);
  const b=run(kind,data,{origin:P(90,120),scale:19},9);
  assert.equal(a.status,'ready');assert.equal(b.status,'ready');
  assert.deepEqual(a.intents,b.intents);
  assert.notDeepEqual(a.steps.at(-1).actions[0].geometry.center,
   b.steps.at(-1).actions[0].geometry.center);
 });
}
test('03 proven 3D point yields four explicit first-angle guide intents through same V5',()=>{
 const input={knownPoint:{x:15,y:10,z:12},
  sheetTransform:{origin:P(360,175),scale:4}};
 const r=run('point-projection',input,null,11);
 const old=pointTimeline(input,11);
 assert.equal(r.status,'ready');
 assert.equal(r.intents.length,4);
 assert.deepEqual(r.steps,old.steps);assert.deepEqual(r.timing,old.timing);
 assert.ok(r.intents.every(i=>i.source.status==='unique'&&
  i.source.proofScope==='single-point-first-angle'&&
  i.operations[0].coordinateSpace==='sheet-px'));
 assert.equal(r.selectedBranchId,null);
 assert.equal(validateConstructionIntentDAG(r.intents).ok,true);
});
test('03 two reviewed views derive real missing sheet point and 45-degree guides',()=>{
 const input={knownViews:{V:[15,12],H:[15,10]},
  sheetTransform:{origin:P(100,100),scale:2}};
 const a=run('point-projection',input,null,12),old=pointTimeline(input,12);
 assert.equal(a.status,'ready');
 assert.equal(a.intents.length,5);
 assert.deepEqual(a.steps,old.steps);
 assert.deepEqual(a.timing,old.timing);
 const last=a.intents.at(-1);
 assert.equal(last.id,'third-view');
 assert.deepEqual(last.dependsOn,['guide_4']);
 assert.deepEqual(last.operations[0],{id:'result-W',kind:'point',
  coordinateSpace:'sheet-px',geometry:{at:old.originalLesson.sheet.W}});
 assert.equal(validateConstructionIntentDAG(a.intents).ok,true);
});
test('03 contradictory views and underdetermined single view produce no V5',()=>{
 for(const input of [
  {knownViews:{V:[15,12]}},
  {knownViews:{V:[15,12],H:[20,10]}}
 ]){
  const result=run('point-projection',input,null,13);
  assert.equal(result.status,'not-verified');
  assert.equal(result.mathematicallyVerified,false);
  assert.deepEqual(result.steps,[]);
 }
});
test('stale revision/invalid frame/candidate cannot silently manufacture a canonical intent',()=>{
 const input=structuredClone(fillets[0][1]);
 assert.throws(()=>run('segments',input,paper,-1),/revision/);
 assert.throws(()=>run('segments',input,{origin:P(0,0),scale:0},1),/sheet/);
 assert.throws(()=>run('made-up',input,paper,1),/unsupported/);
 const first=run('segments',input,paper,4);
 const second=run('segments',input,paper,5);
 assert.equal(first.intents[0].source.revision,4);
 assert.equal(second.intents[0].source.revision,5);
});
