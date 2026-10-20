'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const js=fs.readFileSync('knowledge/knowledge-data.js','utf8');
new vm.Script(js,{filename:'knowledge/knowledge-data.js'});
new vm.Script(fs.readFileSync('knowledge/knowledge-app.js','utf8'),{filename:'knowledge/knowledge-app.js'});
const context={};
vm.runInNewContext(js,context);
const library=context.DrawingKnowledge;
assert(library&&typeof library.get==='function'&&typeof library.find==='function','knowledge library exports missing');
assert(library.chapters.length===6,'six textbook units expected');
assert(library.entries.length>=30,'knowledge cards missing');
assert(new Set(library.entries.map(e=>e.id)).size===library.entries.length,'duplicate knowledge IDs');
const printed=new Set(),pageMapping={31:1,32:3,33:2};
const allowed=new Set(['views','point','line','plane','polyhedra','curved']);
const ranges={'2-6':6,'2-7':6,'2-8':8,'2-9':8};
for(const x of library.entries){
 assert(x.id&&x.title.length>=4,'unnamed knowledge card');
 assert(allowed.has(x.chapter),'unknown knowledge unit '+x.id);
 assert(x.sourceType==='uploaded-textbook-summary'&&x.verifiedSolution===false,'source disclaimer invalid '+x.id);
 for(const field of ['summary','law','understanding','mistake'])assert(typeof x[field]==='string'&&x[field].length>=15,'missing '+field+' in '+x.id);
 assert(x.steps.length>=3,'incomplete progressive steps '+x.id);
 for(const s of x.steps)assert(typeof s==='string'&&s.length>=8,'empty step '+x.id);
 assert(x.pages.length===x.pdfPages.length&&x.pages.length>=1,'missing page mapping '+x.id);
 for(let i=0;i<x.pages.length;i++){
  const printedPage=x.pages[i],pdf=x.pdfPages[i];
  assert(Number.isInteger(printedPage)&&printedPage>=31&&printedPage<=53,'invalid book page '+x.id);
  assert(pdf===(pageMapping[printedPage]||printedPage-30),'incorrect PDF page number '+x.id);
  printed.add(printedPage);
 }
 for(const ex of x.practice){
  const bits=ex.split('-'),chapter=bits.slice(0,2).join('-');
  assert(Number.isInteger(+bits[2])&&+bits[2]>=1&&+bits[2]<=ranges[chapter],'invalid exercise '+ex);
 }
}
for(const [exerciseChapter,total] of Object.entries(ranges)){for(let n=1;n<=total;n++){const id=exerciseChapter+'-'+n;assert(library.entries.some(x=>x.practice.includes(id)),'no knowledge linked for '+id)}}
assert(printed.size===23,'every page of the provided 23-page scan must be indexed');
assert(library.source.pdfPages===23,'scan page count mismatch');
assert(library.find('圆锥').length>=2,'Chinese full text search broken');
assert(library.find('2-9-3').some(x=>x.id==='cone-generator'),'exercise references must be searchable');
assert(library.find('','point').every(x=>x.chapter==='point'),'category filtering broken');
const html=fs.readFileSync('knowledge/index.html','utf8');
for(const id of ['knowledgeSearch','chapterSelect','progressSelect','resetFilters','knowledgeCards','knowledgeDetail','detailSteps','detailExercises','stepPrev','stepNext','stepAll','markRead','exerciseFilterStatus'])assert(html.includes('id="'+id+'"'),'missing knowledge UI control '+id);
assert(html.includes('src="knowledge-data.js"')&&html.includes('src="knowledge-app.js"'),'knowledge data and UI must be loaded');
const app=fs.readFileSync('knowledge/knowledge-app.js','utf8');
assert(app.includes('localStorage')&&app.includes('drawing-knowledge-read-v1'),'local learning records missing');
assert(app.includes("new URLSearchParams(location.search).get('exercise')"),'exercise-specific study link missing');
assert(app.includes('replaceChildren()'),'safe DOM element rendering missing');
assert(app.includes('textContent'),'use textContent for uploaded-source summaries');
const home=fs.readFileSync('index.html','utf8');
const catalogue=fs.readFileSync('labs/chapter-26-29.html','utf8');
const drawingHtml=fs.readFileSync('labs/chapter-drawing.html','utf8');
const drawingJs=fs.readFileSync('labs/chapter-drawing.js','utf8');
assert(home.includes('href="knowledge/index.html"'),'home knowledge entry missing');
assert(catalogue.includes('knowledge/index.html?exercise='),'exercise index knowledge entry missing');
assert(drawingHtml.includes('id="drawingKnowledgeLink"'),'exercise drawing knowledge entry missing');
assert(drawingJs.includes('drawingKnowledgeLink')&&drawingJs.includes('encodeURIComponent(current)'),'exercise link not synced with selection');
const build=fs.readFileSync('scripts/build-static.cjs','utf8');
for(const p of ['knowledge/index.html','knowledge/knowledge-data.js','knowledge/knowledge-app.js'])assert(build.includes("'"+p+"'"),'static deployment missing '+p);
console.log('PASS scanned textbook 23 pages, '+library.entries.length+' summarized concepts, six units, source citations, search, linked learning and safe static build');
