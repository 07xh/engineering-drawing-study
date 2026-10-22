'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const page=require('../../benchmark/catalog/printed-p086.json');
const {makeId,validateEntry,summarize}=require('../../benchmark/exercise-coverage.cjs');

test('printed page 86 is one assembly drafting exercise, not eight source-figure exercises',()=>{
 assert.equal(page.length,1,'assembly source views must not inflate question count');
 const entry=validateEntry(page[0]);
 assert.equal(entry.printedPage,86);
 assert.equal(entry.questionLabel,'12-4');
 assert.equal(entry.id,'BENCH-086-P086-Q12-4');
 assert.equal(entry.kind,'original-exercise');
 assert.equal(entry.result,'unreviewed');
 assert.equal(entry.textbookChapter,null,'chapter mapping requires separate confirmation');
 // 12-4-1 ... 12-4-8 identify figures/parts, NOT eight independent questions.
 const sourceFigureIds=Array.from({length:8},(_,i)=>makeId({printedPage:86,questionLabel:'12-4-'+(i+1)}));
 assert.ok(sourceFigureIds.every(id=>id!==entry.id));
 const report=summarize(page);
 assert.equal(report.indexed,1);
 assert.equal(report.originalExercises,1);
 assert.equal(report.solved,0);
 assert.equal(report.pending,1);
 assert.equal(report.safeHandling,0);
});
test('original page metadata contains no answer fields, binary images or false math evidence',()=>{
 const entry=validateEntry(page[0]);
 assert.equal(entry.answerHidden,false);
 assert.equal(entry.blindTest,false);
 assert.deepEqual(Object.values(entry.stages),Array(5).fill('untested'));
 assert.deepEqual(entry.evidenceRefs,{});
 assert.ok(Object.keys(page[0]).every(key=>!/^(answer|answerText|answerImage|scan|scanBase64|image|imageData|svg|copyrightText)$/i.test(key)));
});
