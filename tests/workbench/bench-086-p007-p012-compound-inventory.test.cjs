'use strict';
/** Private source was inspected visually. Source scans/answer overlays stay
 * outside Git; these checks validate metadata and prevent answer-derived
 * completion claims for compound planar and 3D view exercises.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeId,validateEntry}=require('../../benchmark/exercise-coverage.cjs');
const {loadCatalog,buildReport}=require('../../scripts/report-bench-086.cjs');
const counts=new Map([[7,4],[8,3],[9,6],[10,4],[11,2],[12,8]]);
const indexed=()=>loadCatalog().map(validateEntry);
test('printed pages 7–12 have 27 real question blocks, not a count of their source drawings',()=>{
 const rows=indexed().filter(x=>counts.has(x.printedPage));
 assert.equal(rows.length,27);
 for(const [page,n] of counts){
  const items=rows.filter(x=>x.printedPage===page);
  assert.equal(items.length,n,'page '+page);
  assert.equal(new Set(items.map(x=>x.id)).size,n,'duplicate printed item page '+page);
  for(const row of items)assert.equal(row.id,makeId(row));
 }
});
test('the two page-11 matching exercises stay compound exercises, not 12 solved parts',()=>{
 const rows=indexed().filter(x=>x.printedPage===11);
 assert.deepEqual(rows.map(x=>x.questionLabel).sort(),['2-2-1','2-2-2']);
 for(const row of rows){
  assert.equal(row.kind,'original-exercise');
  assert.equal(row.result,'unreviewed');
 }
});
test('p7/p8 multi-arc and p12 view completion cannot inherit 02 or 06 advertised solver readiness',()=>{
 const rows=indexed().filter(x=>[7,8,12].includes(x.printedPage));
 assert.equal(rows.length,15);
 for(const row of rows){
  assert.equal(row.solver,null,'specialist unsupported until individually tested: '+row.id);
  assert.equal(row.result,'unreviewed',row.id);
  assert.equal(row.blindTest,false,row.id);
  assert.equal(row.answerHidden,false,row.id);
  assert.deepEqual(Object.values(row.stages),Array(5).fill('untested'),row.id);
  assert.deepEqual(row.evidenceRefs,{},row.id);
 }
});
test('original answer-bearing source never increments a book-wide mathematical coverage rate',()=>{
 const r=buildReport(loadCatalog());
 assert.equal(r.pagesIndexed,12);
 assert.equal(r.pagesNotIndexed,74);
 assert.equal(r.originalExercises,56);
 assert.equal(r.pending,56);
 assert.equal(r.solved,0);
 assert.equal(r.safeHandling,0);
 assert.equal(r.inventoryComplete,false);
 assert.equal(r.fullBookSolvedRate,null);
});
