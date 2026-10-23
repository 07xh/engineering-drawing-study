'use strict';
/**
 * 09 P3 original-exercise *two-point* preflight, test-only.
 *
 * The existing specialist proves ONE spatial point per canonical DAG. Keep
 * A/B proof trees independent; never invent a common proof result ID.
 * Namespace V5 identifiers only for one sheet playback. The published 03
 * workbench does not yet offer this pair composition; this is not an OCR or
 * production acceptance test.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {REAL_POINT_CANDIDATE:item}=
 require('../../benchmark/p3-original-point-2-4-3.cjs');
const {verifiedConstructionIntentV1:solve}=
 require('../../workbench/verified-construction-intent-v1.cjs');
const {pointTimeline}=require('../../workbench/verified-plan-v5-bridge.cjs');
const {validateConstructionIntentDAG}=
 require('../../core/contracts/construction-intent.js');
const V5=require('../../workbench/teaching-timeline-v5.js');
const sheet=Object.freeze({origin:{x:360,y:175},scale:4});
const xyz=p=>({x:p.x,y:p.y,z:p.z});
const submitted=([a,b])=>[a,b].map((given,i)=>({
 id:i===0?'A':'B',given
}));
function createPreflight(groups,revision){
 if(!Array.isArray(groups)||groups.length!==2||
  !Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('two confirmed points and nonnegative revision required');
 const ids=new Set(),proofGroups=[],combined=[];
 for(const {id,given} of groups){
  if(!['A','B'].includes(id)||ids.has(id)||
    !given||![given.x,given.y,given.z].every(Number.isFinite))
   throw new TypeError('invalid, missing or duplicate given point');
  ids.add(id);
  const input={knownPoint:xyz(given),sheetTransform:sheet};
  // Independent actual M3 re-solving and old-path V5 equality.
  const now=solve('point-projection',input,null,revision);
  const old=pointTimeline(input,revision);
  if(now.status!=='ready'||now.mathematicallyVerified!==true||
     now.revision!==revision||old.status!=='ready'||
     !validateConstructionIntentDAG(now.intents).ok||
     JSON.stringify(now.steps)!==JSON.stringify(old.steps)||
     JSON.stringify(now.timing)!==JSON.stringify(old.timing))
   throw new RangeError('one point has no independently verified V5 proof');
  const stepNames=new Map(now.steps.map(s=>[s.id,id+'-'+s.id]));
  for(const step of now.steps){
   const actions=step.actions.map(a=>({...a,id:id+'-'+a.id}));
   combined.push({...step,id:stepNames.get(step.id),
    dependsOn:step.dependsOn.map(dep=>stepNames.get(dep)),actions});
  }
  proofGroups.push({id,revision,intents:now.intents,proofScope:now.proofScope,
   actionIds:now.steps.flatMap(s=>s.actions.map(a=>id+'-'+a.id))});
 }
 // The existing one-and-only V5 Timeline; never write an alternative player.
 const timing=V5.compileTimeline(combined);
 assert.equal(timing.steps.length,combined.length);
 assert.equal(timing.segments.length,new Set(timing.segments.map(s=>s.id)).size);
 return Object.freeze({revision,proofGroups,steps:combined,timing,
  stage:'test-only-preflight',productionReady:false,
  answerHidden:false,blindTest:false,bookSolved:false});
}
test('one original exercise with two given points constructs one V5 timeline and two proven Intent DAGs',()=>{
 const points=submitted(item.givens);
 const out=createPreflight(points,74);
 assert.equal(item.questionLabel,'2-4-3');
 assert.equal(out.proofGroups.length,2);
 assert.equal(out.steps.length,8);
 assert.equal(out.productionReady,false);
 for(const p of out.proofGroups){
  assert.equal(p.intents.length,4);
  assert.equal(p.revision,74);
  assert.equal(validateConstructionIntentDAG(p.intents).ok,true);
  assert.equal(p.proofScope,'single-point-first-angle');
 }
 assert.ok(out.steps.slice(0,4).every(s=>s.id.startsWith('A-')));
 assert.ok(out.steps.slice(4).every(s=>s.id.startsWith('B-')));
 const names=out.timing.segments.map(s=>s.id);
 assert.equal(new Set(names).size,names.length);
 assert.ok(names.some(s=>s.startsWith('A-')));
 assert.ok(names.some(s=>s.startsWith('B-')));
 assert.equal(V5.frame(out.timing,0).done,false);
 assert.equal(V5.frame(out.timing,out.timing.totalMs).done,true);
 assert.deepEqual(V5.frame(out.timing,out.timing.totalMs).completedIds,names);
});
test('single existing V5 player supports seek/reverse/variable speed and stale-revision invalidation on both points',()=>{
 const out=createPreflight(submitted(item.givens),75);
 const player=V5.createPlayer(out.timing,{speed:1,revision:75});
 assert.equal(player.canRender(75),true);
 player.seekStep(4,1000);
 assert.equal(player.snapshot().activeStepId,'B-'+out.steps[4].id.slice(2));
 player.seekStep(0,1001);
 assert.equal(player.snapshot().activeStepIndex,0);
 player.setSpeed(2,1002);
 assert.equal(player.snapshot().speed,2);
 player.invalidate(76,1003);
 assert.equal(player.canRender(75),false);
 assert.equal(player.canRender(76),false);
 assert.equal(player.snapshot().invalid,true);
 assert.equal(player.snapshot().completedIds.length,0);
 assert.equal(player.play(1004).playing,false);
});
test('two-point question changes only the mathematically affected per-point V5 geometry',()=>{
 const givens=submitted(item.givens);
 const first=createPreflight(givens,80);
 const changed={...givens[1],given:{...givens[1].given,z:givens[1].given.z+5}};
 const second=createPreflight([givens[0],changed],81);
 assert.deepEqual(first.steps.slice(0,4),second.steps.slice(0,4));
 assert.notDeepEqual(first.steps.slice(4),second.steps.slice(4));
 assert.equal(second.proofGroups[0].intents[0].source.revision,81);
 assert.equal(second.proofGroups[1].intents[0].source.revision,81);
 assert.equal(V5.frame(second.timing,second.timing.totalMs).done,true);
});
test('incomplete B, duplicate IDs or contradicted source aborts ALL composite drawing, not just B',()=>{
 const points=submitted(item.givens);
 assert.throws(()=>createPreflight([points[0],{id:'B',given:{x:30,y:0}}],82),TypeError);
 assert.throws(()=>createPreflight([points[0],{id:'A',given:points[1].given}],82),TypeError);
 assert.throws(()=>createPreflight(points,NaN),TypeError);
 assert.throws(()=>createPreflight(points.slice(0,1),82),TypeError);
});
test('no answer-bearing workbook item can be elevated to actual OCR/complete-book acceptance',()=>{
 assert.equal(item.sourceOriginalQuestionConfirmed,false);
 assert.equal(item.sourceUnitConfirmed,false);
 assert.equal(item.blindTest,false);
 assert.equal(item.answerHidden,false);
 assert.equal(item.bookSolved,false);
 const out=createPreflight(submitted(item.givens),83);
 assert.equal(out.productionReady,false);
 assert.equal(out.answerHidden,false);
 assert.equal(out.bookSolved,false);
});
