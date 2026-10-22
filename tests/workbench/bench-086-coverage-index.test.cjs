'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeId,validateEntry,summarize,STAGES}=require('../../benchmark/exercise-coverage.cjs');

const example=()=>({
 printedPage:12,questionLabel:'2-3-1',textbookChapter:null,
 topic:'synthetic finite tangent',solver:'02',
 kind:'synthetic-control',result:'unreviewed'
});
test('benchmark IDs follow printed page, never PDF offset, and retain question identifiers',()=>{
 assert.equal(makeId(example()),'BENCH-086-P012-Q2-3-1');
 assert.equal(makeId({printedPage:86,localOrdinal:2}),'BENCH-086-P086-QLOCAL-02');
 for(const page of [0,87,3.5,'12',NaN])assert.throws(()=>makeId({printedPage:page,questionLabel:'1-1'}),/printedPage/);
 for(const q of ['12/5','图A', '../scan','1-1?'])assert.throws(()=>makeId({printedPage:1,questionLabel:q}),/question/);
 assert.throws(()=>makeId({printedPage:1}),/localOrdinal/);
});
test('unmapped exercises remain unverified; short metadata only, no book copies',()=>{
 const row=validateEntry({printedPage:1,localOrdinal:1});
 assert.equal(row.result,'unreviewed');
 assert.ok(STAGES.every(k=>row.stages[k]==='untested'));
 assert.equal(row.textbookChapter,null);
 assert.throws(()=>validateEntry({...example(),answer:'secret-reference-answer'}),/unexpected field/);
 assert.throws(()=>validateEntry({...example(),scanBase64:'data:image/png;base64,abc'}),/unexpected field/);
 assert.throws(()=>validateEntry({...example(),topic:'a'.repeat(1000)}),/short metadata/);
 assert.throws(()=>validateEntry({...example(),stages:{fake:'passed'}}),/unknown stage/);
});
test('blind review and independent stage evidence are required before solved status',()=>{
 const base={...example(),kind:'original-exercise',result:'solved'};
 assert.throws(()=>validateEntry(base),/blind/);
 const flags={...base,blindTest:true,answerHidden:true};
 assert.throws(()=>validateEntry(flags),/passed stages/);
 const passed=Object.fromEntries(STAGES.map(k=>[k,'passed']));
 assert.throws(()=>validateEntry({...flags,stages:passed}),/traceable/);
 const evidenceRefs={math:'tests/math/synthetic-math.test.cjs',
  construction:'tests/workbench/synthetic-construction.test.cjs',
  animation:'https://github.com/07xh/engineering-drawing-study/pull/379'};
 const valid=validateEntry({...flags,stages:passed,evidenceRefs});
 assert.equal(valid.result,'solved');
 assert.equal(valid.blindTest,true);
 assert.equal(valid.stages.standards,'passed');
 assert.throws(()=>validateEntry({...flags,stages:{...passed,math:'failed'},evidenceRefs}),/passed stages/);
 assert.throws(()=>validateEntry({...flags,stages:passed,evidenceRefs:{...evidenceRefs,math:'data:image/png;base64,foo'}}),/invalid evidence/);
 assert.throws(()=>validateEntry({...flags,stages:passed,evidenceRefs:{...evidenceRefs,math:'https://malicious.example/test'}}),/invalid evidence/);
 assert.throws(()=>validateEntry({...flags,kind:'synthetic-control',stages:passed,evidenceRefs}),/original blind/);
});
test('unsolved, underdetermined and unsupported cases never inflate solved coverage',()=>{
 const items=[
  {...example(),kind:'original-exercise',result:'unsupported'},
  {...example(),printedPage:13,kind:'original-exercise',result:'multiple'},
  {...example(),printedPage:14,kind:'original-exercise',result:'underdetermined',stages:{math:'failed'}},
  {...example(),printedPage:15,kind:'original-exercise',result:'unreviewed'},
  {...example(),printedPage:16,kind:'synthetic-control',result:'unreviewed'}
 ];
 const s=summarize(items);
 assert.deepEqual(s,{indexed:5,originalExercises:4,syntheticControls:1,solved:0,safeHandling:3,pending:1,failedStages:1});
 assert.throws(()=>summarize([items[0],{...items[0]}]),/duplicate exercise id/);
 assert.throws(()=>summarize({}),/array/);
});
