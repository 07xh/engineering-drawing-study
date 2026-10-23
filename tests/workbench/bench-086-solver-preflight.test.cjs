'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Bridge=require('../../workbench/verified-plan-v5-bridge.cjs');
const {loadCatalog,buildReport}=require('../../scripts/report-bench-086.cjs');
const {SAMPLES,SHEET,REVISION,inspectPlayback,runPreflight,asMarkdown}=
 require('../../benchmark/solver-preflight-086.cjs');

test('#380 three actual G1 solver families plus first-angle point produce verified V5 actions',()=>{
 const report=runPreflight();
 assert.equal(report.format,'draftai-bench086-solver-preflight/1');
 assert.equal(report.syntheticCases,4);
 assert.equal(report.failed,0,JSON.stringify(report.cases,null,2));
 assert.equal(report.passed,4);
 assert.equal(report.candidateOriginalExercisesSolved,0);
 assert.equal(report.originalBookPagesIndexedByThisTool,0);
 for(const row of report.cases){
  assert.equal(row.passed,true,row.id+': '+row.faults.join(','));
  assert.ok(row.stepCount>=4,row.id);
  assert.ok(row.mathEvidence,row.id);
 }
 const output=asMarkdown(report);
 assert.match(output,/仅原创结构化题/);
 assert.match(output,/原书习题端到端通过新增数：0/);
 assert.doesNotMatch(output,/86\/86|100%|全书已解/);
});

test('#380 omitted selected branches and contradictory known projections cannot be counted as solved',()=>{
 for(const sample of SAMPLES.filter(s=>s.family!=='point-projection')){
  const missing={...sample.input};
  delete missing.branchId;
  const playback=Bridge.filletTimeline(sample.family,missing,SHEET,REVISION);
  assert.equal(playback.status,'not-verified',sample.family);
  assert.equal(playback.mathematicallyVerified,false,sample.family);
  assert.equal(inspectPlayback(sample,playback).passed,false,sample.family);
 }
 const projection=SAMPLES.find(s=>s.family==='point-projection');
 const conflict=Bridge.pointTimeline({knownViews:{V:[15,12],H:[16,10]}},REVISION);
 assert.equal(conflict.status,'not-verified');
 assert.equal(inspectPlayback(projection,conflict).passed,false);
});

test('#380 independent report rejects changed revision, missing output and invalid dependency',()=>{
 const sample=SAMPLES[0];
 const p=Bridge.filletTimeline(sample.family,sample.input,SHEET,REVISION);
 assert.equal(inspectPlayback(sample,p).passed,true);
 assert.ok(inspectPlayback(sample,p,REVISION+1).faults.includes('stale-revision'));
 const last=p.steps.length-1;
 const noArc={...p,steps:p.steps.map((s,i)=>
  i===last?{...s,actions:[]}:s)};
 assert.equal(inspectPlayback(sample,noArc).passed,false);
 assert.ok(inspectPlayback(sample,noArc).faults.includes('missing-final-drawn-geometry'));
 const forward={...p,steps:p.steps.map((s,i)=>
  i===0?{...s,dependsOn:['future-step']}:s)};
 assert.ok(inspectPlayback(sample,forward).faults.includes('invalid-dag-dependency'));
});

test('#380 changing paper scale never changes actual specialized mathematics',()=>{
 const sample=SAMPLES.find(s=>s.family==='circles');
 const a=Bridge.filletTimeline(sample.family,sample.input,SHEET,REVISION);
 const b=Bridge.filletTimeline(sample.family,sample.input,
  {origin:{x:120,y:180},scale:16},REVISION);
 assert.equal(inspectPlayback(sample,a).passed,true);
 assert.equal(inspectPlayback(sample,b).passed,true);
 assert.deepEqual(a.originalLesson.result,b.originalLesson.result);
 assert.deepEqual(a.steps.map(s=>s.id),b.steps.map(s=>s.id));
});

test('#380 preflight is not exercise-book success: original catalog remains unchanged',()=>{
 const book=buildReport(loadCatalog());
 assert.equal(book.pagesIndexed,1);
 assert.equal(book.originalExercises,1);
 assert.equal(book.solved,0);
 assert.equal(book.fullBookSolvedRate,null);
 const sample=runPreflight();
 assert.equal(sample.candidateOriginalExercisesSolved,0);
 assert.equal(sample.scope,'synthetic-only-not-original-exercise-coverage');
});
