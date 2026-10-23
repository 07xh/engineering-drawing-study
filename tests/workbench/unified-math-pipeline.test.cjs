'use strict';
/**
 * M5 adversarial checks for ONE verified M3->Intent->Step DAG->V5 route:
 * real specialist solves, independent original 02/03 parity, exact mm/px,
 * revision/branch fail-closed, and tamper rejection.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluateUnifiedMath:run}=
 require('../../workbench/unified-math-pipeline.cjs');
const {assertM3ToV5Consistency:gate}=
 require('../../workbench/m3-v5-consistency-gate.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const {validateConstructionIntentDAG}=
 require('../../core/contracts/construction-intent.js');
const P=(x,y)=>({x,y});
const seg=(x,y,a,b)=>({a:P(x,y),b:P(a,b)});
const sheet={origin:P(360,220),scale:8};
const cases=[
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
function assertShared(out,paper,revision){
 assert.equal(out.status,'ready');
 assert.equal(out.unifiedMathPipeline,'m3-canonical-intent-v5/1');
 assert.equal(out.canonicalVerified,true);
 assert.equal(out.mathematicallyVerified,true);
 assert.equal(validateConstructionIntentDAG(out.constructionIntents).ok,true);
 assert.equal(gate({revision,intents:out.constructionIntents,
  steps:out.steps,timing:out.timing,sheet:paper}),true);
 assert.equal(Timeline.frame(out.timing,out.timing.totalMs).done,true);
 const player=Timeline.createPlayer(out.timing,{revision});
 assert.equal(player.canRender(revision),true);
 player.invalidate(revision+1,100);
 assert.equal(player.canRender(revision),false);
}
for(const [kind,fixture] of cases){
 test('unified production 02 route / '+kind+' consumes real M3 proof and canonical Intent',()=>{
  const input=structuredClone(fixture);
  const before=JSON.stringify(input);
  const result=run({kind,input,sheet,revision:19});
  assertShared(result,sheet,19);
  assert.equal(result.selectedBranchId,input.branchId);
  assert.equal(JSON.stringify(input),before);
  for(const intent of result.constructionIntents)
   assert.equal(intent.source.branchId,input.branchId);
 });
 test('unselected '+kind+' branch is not upgraded into a drawable answer',()=>{
  const input=structuredClone(fixture);delete input.branchId;
  const output=run({kind,input,sheet,revision:20});
  assert.notEqual(output.status,'ready');
  assert.deepEqual(output.steps,[]);
 });
}
test('unified 03 first-angle projection, same original 3D math and V5 DAG',()=>{
 const input={knownViews:{V:[15,12],H:[15,10]},
  sheetTransform:{origin:P(100,100),scale:2}};
 const result=run({kind:'point-projection',input,revision:35});
 assertShared(result,input.sheetTransform,35);
 assert.equal(result.selectedBranchId,null);
 assert.equal(result.constructionIntents.at(-1).operations[0].coordinateSpace,'sheet-px');
});
test('unified 03 cannot manufacture unknown point from one view or contradictory views',()=>{
 for(const views of [{V:[15,12]},{V:[15,12],H:[18,10]}]){
  const result=run({kind:'point-projection',input:{knownViews:views},revision:36});
  assert.notEqual(result.status,'ready');
  assert.deepEqual(result.steps,[]);
 }
});
for(const n of [3,6]){
 test('unified 02 inscribed '+n+'-gon follows same M3/Intent/V5 and model-mm perimeter',()=>{
  const input={unit:'mm',center:P(12,-8),radiusMm:30,sideCount:n,
   firstVertexAngleDeg:27,direction:'ccw',revision:24,sourceConfirmed:true};
  const output=run({kind:'inscribed-polygon',input,sheet,revision:24});
  assertShared(output,sheet,24);
  assert.equal(output.constructionIntents.length,1+2*n);
  assert.equal(output.solverResult.status,'unique');
  assert.equal(output.modelEdges.length,n);
  const copy=structuredClone(input);delete copy.firstVertexAngleDeg;
  const undecided=run({kind:'inscribed-polygon',input:copy,sheet,revision:24});
  assert.notEqual(undecided.status,'ready');
  assert.deepEqual(undecided.steps,[]);
 });
}
test('common gate catches V5 coordinate corruption, altered time and stale M3 evidence',()=>{
 const input={unit:'mm',center:P(0,0),radiusMm:25,sideCount:6,
  firstVertexAngleDeg:90,direction:'cw',revision:51,sourceConfirmed:true};
 const result=run({kind:'inscribed-polygon',input,sheet,revision:51});
 const request=r=>({revision:51,intents:r.constructionIntents,
  steps:r.steps,timing:r.timing,sheet});
 const pixel=structuredClone(result);
 pixel.steps.at(-1).actions[0].geometry.from.x+=1;
 assert.throws(()=>gate(request(pixel)),/V5 geometry/);
 const time=structuredClone(result);
 time.timing.segments.at(-1).durationMs+=1;
 assert.throws(()=>gate(request(time)),/timeline/);
 const revision=structuredClone(result);
 revision.constructionIntents[0].source.revision=50;
 assert.throws(()=>gate(request(revision)),/DAG|revision/);
 const source=structuredClone(result);
 source.constructionIntents[1].source.branchId='forged';
 assert.throws(()=>gate(request(source)),/DAG/);
 assert.throws(()=>gate({...request(result),sheet:{origin:P(0,0),scale:4}}),/V5 geometry/);
});
test('pipeline rejects injected math flags, stale revision, unsupported type and unconfirmed input',()=>{
 const src={unit:'mm',center:P(0,0),radiusMm:30,sideCount:3,
  firstVertexAngleDeg:90,direction:'ccw',revision:7,sourceConfirmed:true};
 assert.throws(()=>run({kind:'inscribed-polygon',input:src,sheet,revision:8}),/stale/);
 assert.throws(()=>run({kind:'inscribed-polygon',input:{...src,mathVerified:true},
  sheet,revision:7}),/unknown/);
 assert.throws(()=>run({kind:'random-solver',input:{},sheet,revision:7}),/unsupported/);
 const denied=run({kind:'inscribed-polygon',input:{...src,sourceConfirmed:false},
  sheet,revision:7});
 assert.notEqual(denied.status,'ready');
 assert.deepEqual(denied.steps,[]);
});
