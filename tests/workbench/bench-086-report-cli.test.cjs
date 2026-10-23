'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {loadCatalog,buildReport,formatMarkdown}=
 require('../../scripts/report-bench-086.cjs');

test('twelve indexed printed pages report 56 unsolved exercises without invented book-wide rate',()=>{
 const list=loadCatalog();
 const r=buildReport(list);
 assert.equal(r.format,'draftai-bench086-metadata-progress/1');
 assert.equal(r.bookPages,86);
 assert.equal(r.pagesIndexed,12);
 assert.equal(r.pagesNotIndexed,74);
 assert.equal(r.originalExercises,56);
 assert.equal(r.solved,0);
 assert.equal(r.inventoryComplete,false);
 assert.equal(r.fullBookSolvedRate,null);
 const output=formatMarkdown(r);
 assert.match(output,/全书解题覆盖率：未知/);
 assert.doesNotMatch(output,/100%|定滑轮装配图综合绘制/);
});
test('private catalog loader fails closed on mismatched file page or duplicates',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-bench086-'));
 try{
  const entry={printedPage:86,questionLabel:'12-4',result:'unreviewed'};
  const file=path.join(dir,'printed-p086.json');
  fs.writeFileSync(file,JSON.stringify([entry]));
  assert.equal(buildReport(loadCatalog(dir)).originalExercises,1);
  fs.writeFileSync(file,JSON.stringify([{...entry,printedPage:85}]));
  assert.throws(()=>loadCatalog(dir),/page mismatch/);
  fs.writeFileSync(file,JSON.stringify([entry,entry]));
  assert.throws(()=>loadCatalog(dir),/duplicate exercise id/);
  fs.writeFileSync(file,JSON.stringify({data:[entry]}));
  assert.throws(()=>loadCatalog(dir),/list/);
  fs.writeFileSync(file,JSON.stringify([{...entry,answerImage:'data:foo'}]));
  assert.throws(()=>loadCatalog(dir),/unexpected field/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('synthetic controls do not count toward book coverage and no summary claims full completion',()=>{
 const r=buildReport([{printedPage:2,questionLabel:'1-1',kind:'synthetic-control'},
  {printedPage:6,questionLabel:'1-2',kind:'original-exercise',result:'unsupported'}]);
 assert.equal(r.indexed,2);
 assert.equal(r.pagesIndexed,1);
 assert.equal(r.originalExercises,1);
 assert.equal(r.syntheticControls,1);
 assert.equal(r.safeHandling,1);
 assert.equal(r.solved,0);
 assert.equal(r.fullBookSolvedRate,null);
});
