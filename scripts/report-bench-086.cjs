'use strict';
/**
 * #380 metadata-only benchmark progress reporter.
 * Reports INDEX progress, never claims full-book solve coverage while
 * remaining printed pages and the full question inventory are unaudited.
 */
const fs=require('node:fs');
const path=require('node:path');
const {MAX_PAGE,validateEntry,summarize}=require('../benchmark/exercise-coverage.cjs');
const ROOT=path.resolve(__dirname,'../benchmark/catalog');
const FILE=/^printed-p(\d{3})\.json$/;

function loadCatalog(directory=ROOT){
 const items=[];
 for(const name of fs.readdirSync(directory).sort()){
  const m=FILE.exec(name);
  if(!m)continue; // no image/answer file ingestion
  const expected=Number(m[1]);
  if(expected<1||expected>MAX_PAGE)throw new RangeError('catalog file printed page out of range: '+name);
  const rows=JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'));
  if(!Array.isArray(rows))throw new TypeError('catalog must contain a list: '+name);
  for(const source of rows){
   const entry=validateEntry(source);
   if(entry.printedPage!==expected)
    throw new TypeError('catalog page mismatch: '+name+' contains '+entry.printedPage);
   items.push(source);
  }
 }
 // Performs cross-file duplicate checks before any result is produced.
 summarize(items);
 return items;
}
function buildReport(rows){
 const summary=summarize(rows);
 const pages=new Set(rows.map(x=>validateEntry(x))
  .filter(x=>x.kind==='original-exercise').map(x=>x.printedPage));
 return Object.freeze({
  format:'draftai-bench086-metadata-progress/1',
  bookPages:MAX_PAGE,
  pagesIndexed:pages.size,
  pagesNotIndexed:MAX_PAGE-pages.size,
  ...summary,
  // No percentage named "full book solved" without a verified exhaustive
  // question inventory. Page indexing also does not imply solve support.
  fullBookSolvedRate:null,
  inventoryComplete:false
 });
}
function formatMarkdown(r){
 return [
  '# DraftAI 86 页配套习题验收进度（元数据）',
  '',
  '- 已登记的印刷页码：'+r.pagesIndexed+'/'+r.bookPages,
  '- 尚未登记页码：'+r.pagesNotIndexed,
  '- 已登记真实习题：'+r.originalExercises+' 题',
  '- 已完整通过盲测、数学、步骤、V5 验收：'+r.solved+' 题',
  '- 已标注未支持/多解/欠约束/待确认：'+r.safeHandling+' 题（不计完整解答）',
  '- 尚未验收的已登记习题：'+r.pending+' 题',
  '- 合成测试记录：'+r.syntheticControls+'（不计真实习题）',
  '',
  '**全书解题覆盖率：未知。** 本报告只统计已登记元数据；尚未逐页完整盘点，不能用印刷页数或测试数推算整本书的实际解题成功率。'
 ].join('\n');
}
if(require.main===module){
 try{
  const opt=process.argv.slice(2);
  if(opt.some(x=>!['--json','--markdown'].includes(x))||opt.includes('--json')&&opt.includes('--markdown'))
   throw new TypeError('usage: node scripts/report-bench-086.cjs [--json|--markdown]');
  const report=buildReport(loadCatalog());
  process.stdout.write(opt.includes('--json')?JSON.stringify(report,null,2)+'\n':formatMarkdown(report)+'\n');
 }catch(error){process.stderr.write('benchmark report refused: '+error.message+'\n');process.exitCode=1;}
}
module.exports={loadCatalog,buildReport,formatMarkdown};
