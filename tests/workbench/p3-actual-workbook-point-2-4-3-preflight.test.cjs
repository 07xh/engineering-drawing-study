'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {REAL_POINT_CANDIDATE:exercise}=
 require('../../benchmark/p3-original-point-2-4-3.cjs');
const {verifiedConstructionIntentV1:run}=
 require('../../workbench/verified-construction-intent-v1.cjs');
const {pointTimeline}=
 require('../../workbench/verified-plan-v5-bridge.cjs');
const {validateConstructionIntentDAG}=
 require('../../core/contracts/construction-intent.js');
const {project}=require('../../core/projection/conventions.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const transform={origin:{x:360,y:175},scale:4};
const revision=13;
function pointOf(given){return {x:given.x,y:given.y,z:given.z};}
function assertOriginalPathParity(given){
 const input={knownPoint:pointOf(given),sheetTransform:transform};
 const modern=run('point-projection',input,null,revision);
 const legacy=pointTimeline(input,revision);
 assert.equal(modern.status,'ready');
 assert.equal(modern.mathematicallyVerified,true);
 assert.equal(modern.revision,revision);
 assert.equal(modern.intents.length,4);
 assert.equal(modern.steps.length,4);
 assert.equal(validateConstructionIntentDAG(modern.intents).ok,true);
 assert.deepEqual(modern.steps,legacy.steps);
 assert.deepEqual(modern.timing,legacy.timing);
 assert.ok(modern.intents.every(x=>
  x.source.status==='unique'&&
  x.source.unit==='mm'&&
  x.source.revision===revision&&
  x.source.proofScope==='single-point-first-angle'));
 assert.equal(Timeline.frame(modern.timing,modern.timing.totalMs).done,true);
 return modern;
}
test('#410 original-book 2-4-3 only inspected/derived givens: no blind-pass or user-confirmation claim',()=>{
 assert.equal(exercise.printedPage,13);
 assert.equal(exercise.pdfPage,14);
 assert.equal(exercise.questionLabel,'2-4-3');
 assert.equal(exercise.sourceOriginalQuestionConfirmed,false);\n assert.equal(exercise.sourceUnitConfirmed,false);\n assert.equal(exercise.solverUnitAssumption,'mm');
 assert.equal(exercise.blindTest,false);
 assert.equal(exercise.answerHidden,false);
 assert.equal(exercise.bookSolved,false);
 assert.equal(exercise.sourceScanCommittedToRepo,false);
 assert.equal(exercise.reviewStatus,'pending-independent-source-confirmation');
});
test('#410 2-4-3 A actual XYZ givens recompute true M3 point solution and same canonical Intent -> V5',()=>{
 const a=exercise.givens.find(x=>x.label==='A');
 assert.deepEqual(pointOf(a),{x:15,y:27,z:30});
 assert.deepEqual(project(pointOf(a)),{
  V:{u:15,v:30},H:{u:15,v:27},W:{u:27,v:30}
 });
 assertOriginalPathParity(a);
});
test('#410 2-4-3 B has zero-depth Y and still yields verified model/first-angle V5',()=>{
 const b=exercise.givens.find(x=>x.label==='B');
 assert.deepEqual(pointOf(b),{x:30,y:0,z:23});
 assert.deepEqual(project(pointOf(b)),{
  V:{u:30,v:23},H:{u:30,v:0},W:{u:0,v:23}
 });
 assertOriginalPathParity(b);
});
test('#410 source-value changes require re-solving; playback revision cannot silently recycle old evidence',()=>{
 const a=exercise.givens[0];
 const original=assertOriginalPathParity(a);
 const revised={...a,z:a.z+1};
 const changed=assertOriginalPathParity(revised);
 assert.notDeepEqual(project(pointOf(a)),project(pointOf(revised)));
 assert.notDeepEqual(original.steps,changed.steps);
 const revInput={knownPoint:pointOf(revised),sheetTransform:transform};
 const newVersion=run('point-projection',revInput,null,revision+1);
 assert.equal(newVersion.status,'ready');
 assert.ok(newVersion.intents.every(i=>i.source.revision===revision+1));
 assert.notEqual(newVersion.intents[0].source.revision,original.intents[0].source.revision);
});
test('#410 insufficient/unreliable original givens never graduate to a legitimate V5 solve',()=>{
 const data=[{x:15,y:27},{x:15,y:27,z:NaN}];
 for(const knownPoint of data)
  assert.throws(()=>run('point-projection',{knownPoint,sheetTransform:transform},
   null,revision));
 const oneView=run('point-projection',{knownViews:{V:[15,30]},
  sheetTransform:transform},null,revision);
 assert.equal(oneView.status,'not-verified');
 assert.deepEqual(oneView.intents,[]);
 assert.deepEqual(oneView.steps,[]);
 assert.equal(oneView.mathematicallyVerified,false);
});
