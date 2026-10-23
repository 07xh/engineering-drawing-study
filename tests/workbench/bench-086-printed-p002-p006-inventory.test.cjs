'use strict';
/**
 * #380 first real printed-page inventory from privately inspected source.
 * The source is answer-marked: these records are NOT blind inputs, math
 * solver results, CAD outputs or V5 acceptance claims.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadCatalog,buildReport}=require('../../scripts/report-bench-086.cjs');
const {validateEntry,makeId}=require('../../benchmark/exercise-coverage.cjs');

const expectedByPage=new Map([[2,3],[3,7],[4,7],[5,6],[6,5],[86,1]]);

test('real-book inventory preserves printed page/question IDs and never counts image parts twice',()=>{
 const entries=loadCatalog();
 const actual=new Map();
 for(const raw of entries){
  const item=validateEntry(raw);
  actual.set(item.printedPage,(actual.get(item.printedPage)||0)+1);
  assert.equal(item.id,makeId(raw));
  assert.equal(item.kind,'original-exercise');
  assert.equal(item.result,'unreviewed');
  assert.equal(item.textbookChapter,null,'book chapter mapping not yet independently verified');
  assert.equal(item.solver,null,'no solver capability inferred from a drawing');
  assert.equal(item.blindTest,false);
  assert.equal(item.answerHidden,false);
  assert.deepEqual(Object.values(item.stages),Array(5).fill('untested'));
  assert.deepEqual(item.evidenceRefs,{});
  assert.ok(Object.keys(raw).every(k=>!/(answer|image|scan|photo|referenceGeometry|svg|originalText)/i.test(k)),
   'source or answer payload leaked into metadata');
 }
 assert.deepEqual([...actual.entries()].sort((a,b)=>a[0]-b[0]),[...expectedByPage.entries()]);
 assert.equal(entries.length,29);
 const ids=new Set(entries.map(e=>makeId(e)));
 assert.ok(ids.has('BENCH-086-P006-Q1-6-2'),'real circle-inscribed triangle indexed');
 assert.ok(ids.has('BENCH-086-P004-Q1-4-1-3'),'nested original subquestion preserved');
 assert.ok(ids.has('BENCH-086-P086-Q12-4'),'assembly figure is a single exercise');
 for(let i=1;i<=8;i++)assert.ok(!ids.has('BENCH-086-P086-Q12-4-'+i));
});

test('real-book statistics remain incomplete even after first six printed pages are cataloged',()=>{
 const result=buildReport(loadCatalog());
 assert.equal(result.bookPages,86);
 assert.equal(result.pagesIndexed,6);
 assert.equal(result.pagesNotIndexed,80);
 assert.equal(result.originalExercises,29);
 assert.equal(result.solved,0);
 assert.equal(result.pending,29);
 assert.equal(result.safeHandling,0);
 assert.equal(result.inventoryComplete,false);
 assert.equal(result.fullBookSolvedRate,null);
});

test('no original problems inherit pass status from independent synthetic solver preflights',()=>{
 const synthetic=require('../../benchmark/solver-preflight-086.cjs').runPreflight();
 assert.equal(synthetic.scope,'synthetic-only-not-original-exercise-coverage');
 assert.equal(synthetic.candidateOriginalExercisesSolved,0);
 assert.equal(buildReport(loadCatalog()).solved,0);
});
