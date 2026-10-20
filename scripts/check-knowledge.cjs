'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync('knowledge/knowledge-data.js','utf8');
new vm.Script(js,{filename:'knowledge/knowledge-data.js'});
new vm.Script(fs.readFileSync('knowledge/knowledge-app.js','utf8'),{filename:'knowledge/knowledge-app.js'});
const ctx={};vm.runInNewContext(js,ctx);
const lib=ctx.DrawingKnowledge,plain=x=>JSON.parse(JSON.stringify(x));
assert(lib&&typeof lib.get==='function'&&typeof lib.find==='function');
assert.equal(lib.chapters.length,13,'12 numbered chapters and appendices expected');
assert.equal(lib.chapters.filter(c=>c.number).length,12,'all 12 printed chapters must exist');
assert.equal(lib.sections.length,56,'53 chapter sections + 3 appendices from TOC');
const catalog=lib.sections.filter(s=>s.chapter!=='appendix');
assert.equal(catalog.length,53);
assert.equal(lib.entries.length,110,'56 TOC entries + 20 Ch1 + 16 Ch2 + 18 Ch3 reviewed lessons');
assert.equal(new Set(lib.entries.map(x=>x.id)).size,110,'duplicated lesson IDs');
const sectionById=Object.fromEntries(lib.sections.map(s=>[s.id,s]));
const source=lib.source;
assert.equal(source.pdfPages,292);
assert.equal(source.tableOfContentsPdfPage,6);
assert.equal(source.pdfOffset,6);
assert.equal(source.printedEnd,284);
assert(source.name.includes('AutoCAD')&&source.name.includes('第3版'));
const starts=[2,27,54,84,97,122,143,169,187,196,208,225];
assert.deepEqual(plain(lib.chapters.filter(c=>c.number).map(c=>c.startPage)),starts,'printed chapter starts differ from uploaded TOC');
const sectionCount=[5,6,6,3,5,6,6,5,2,2,3,4];
assert.deepEqual(plain(lib.chapters.filter(c=>c.number).map(c=>c.sectionCount)),sectionCount);
for(const s of lib.sections){
 assert(s.startPage>=2&&s.endPage<=283&&s.endPage>=s.startPage,'bad printed section range '+s.id);
 assert.equal(s.pdfStartPage,s.startPage+6,'wrong PDF offset '+s.id);
 assert.equal(s.pdfEndPage,s.endPage+6,'wrong PDF end '+s.id);
 assert(lib.chapters.some(c=>c.id===s.chapter),'missing chapter '+s.id);
}
for(let c=1;c<=12;c++){
 const id='ch'+String(c).padStart(2,'0'),items=lib.sections.filter(x=>x.chapter===id);
 assert.equal(items.length,sectionCount[c-1],'wrong section count '+id);
 assert.equal(items[0].startPage,starts[c-1]);
 for(let j=1;j<items.length;j++)assert.equal(items[j-1].endPage+1,items[j].startPage,'noncontiguous chapter section ranges');
}
// Reading order: chapter -> section -> its reviewed notes, never 56 unrelated indexes first.
for(let i=1;i<lib.entries.length;i++){
 const before=lib.sections.findIndex(s=>s.id===lib.entries[i-1].section);
 const after=lib.sections.findIndex(s=>s.id===lib.entries[i].section);
 assert(before<=after,'knowledge list out of textbook reading order');
}
for(const s of lib.sections){
 const group=lib.entries.filter(x=>x.section===s.id);
 assert(group[0]?.id===s.id,'directory section must precede its own verified notes');
}
const oldIds=['view-layout','point-notation','cone-circle','sphere-point','plane-internal-line'];
for(const id of oldIds)assert.equal(lib.get(id),null,'old self-summary unexpectedly survived: '+id);
const outlines=lib.entries.filter(x=>x.contentStatus==='toc-only'),lessons=lib.entries.filter(x=>x.contentStatus==='page-reviewed');
assert.equal(outlines.length,56);
assert.equal(lessons.length,54);
assert.equal(lessons.filter(x=>x.chapter==='ch03').length,18);
assert.equal(lessons.filter(x=>x.chapter==='ch01').length,20);
assert.equal(lessons.filter(x=>x.chapter==='ch02').length,16);
for(const item of outlines){
 assert.equal(item.sourceType,'textbook-third-edition-index');
 assert.equal(item.steps.length,0,'unreviewed chapter pretends to have step-by-step tutorial: '+item.id);
 assert.equal(item.law,'','unreviewed chapter invents rules: '+item.id);
 assert.equal(item.visualMode,null,'unreviewed section gets generic animation: '+item.id);
 assert.equal(item.practice.length,0,'unreviewed section must not link old exercises');
 assert(item.sourceDetails.includes('目录'),'TOC-only label missing');
}
for(const item of lessons){
 assert(['ch01','ch02','ch03'].includes(item.chapter),'reviewed lesson outside inspected Chapters 1/2/3');
 const s=sectionById[item.section];assert(s,'lesson not linked to chapter section '+item.id);
 assert(item.pages[0]>=s.startPage&&item.pages[1]<=s.endPage,'lesson page range wrong '+item.id);
 assert.equal(item.pdfPages[0],item.pages[0]+6);
 assert.equal(item.pdfPages[1],item.pages[1]+6);
 for(const field of ['summary','law','understanding','mistake'])assert(item[field].length>=20,'empty verified lesson component: '+item.id+'.'+field);
 assert(item.steps.length>=3&&item.steps.every(x=>x.length>=10),'fake steps '+item.id);
 assert(item.sourceType==='textbook-third-edition-explained');
 assert(item.practice.length===0,'do not falsely label old 28 exercises as new textbook originals');
 assert(item.verifiedSolution===false,'lesson is not an approved original textbook solution');
}
assert(lib.get('ch01-arc-classification').law.includes('连接弧'));
assert.equal(lib.get('ch01-arc-classification').pages[0],22);
assert.equal(lib.get('ch01-arc-classification').labLink,'../labs/tangent-constraint.html');
assert.equal(lib.get('ch01-circle-tangent-principle').pages[0],15);
assert(lib.entries.filter(x=>x.chapter==='ch01'&&x.contentStatus==='page-reviewed').every(x=>x.visualMode===null),'Chapter 1 must not be mapped to generic 3D point animation');
assert(lib.get('ch02-three-equalities').law.includes('长对正'));
assert(lib.get('ch02-cone').visualMode==='cone');
assert(lib.get('ch10-s01').contentStatus==='toc-only');
assert.equal(lib.get('ch03-cylinder-cylinder').pages[0],64);
assert.equal(lib.get('ch03-cylinder-cylinder').labLink,'../labs/composite-geometry.html?mode=intersection');
assert.equal(lib.get('ch03-polyhedral-section').labLink,'../labs/composite-geometry.html?mode=section');
assert.equal(lib.get('ch04-s01').contentStatus,'toc-only','fourth chapter has not been page-reviewed');
assert(lib.find('建筑施工图').length>=2,'chapter name lookup missing');
assert(lib.find('球面').length>=1);
const html=fs.readFileSync('knowledge/index.html','utf8'),app=fs.readFileSync('knowledge/knowledge-app.js','utf8');
for(const id of ['knowledgeCards','knowledgeDetail','knowledgeSearch','chapterSelect','sectionSelect','coverageSelect',
 'progressSelect','resetFilters','verifiedLessonContent','detailStatusNotice','detailSteps','stepPrev','stepNext','stepAll',
 'markRead','visualLesson','visualBoard','exerciseFilterStatus'])assert(html.includes('id="'+id+'"'),'UI control lost '+id);
assert(html.includes('12 章教材 + 附录'),'12 chapter hero status missing');
assert(app.includes('drawing-textbook-3e-progress-v2'),'new edition requires independent progress key');
assert(!app.includes("drawing-knowledge-read-v1"),'do not silently inherit old completion tracking');
assert(app.includes('window.KnowledgeVisualUI.show(id)'),'retained visual interface missing');
assert(app.includes("item.contentStatus==='page-reviewed'"),'reviewed-only lesson check absent');
assert(app.includes('book.sections'),'section navigation not wired');
assert(app.includes('item.contentStatus===\'toc-only\''),'TOC-only badge missing');
assert(!app.includes('x.practice.includes(exercise)'),'legacy exercise-guessing filter must be removed');
for(const path of ['knowledge/knowledge-data.js','knowledge/visual-model.js']){
 assert(fs.readFileSync(path,'utf8').includes('ch02'),'new lesson mapping not referenced '+path);
}
assert(app.includes('book.sections')&&app.includes('book.chapters'),'viewer must derive chapters dynamically instead of hardcoding lesson IDs');
const build=fs.readFileSync('scripts/build-static.cjs','utf8');
for(const p of ['knowledge/index.html','knowledge/knowledge-data.js','knowledge/knowledge-app.js'])assert(build.includes("'"+p+"'"));
console.log('PASS 12 chapters, 53 sections, 3 appendices, 54 page-reviewed lessons across chapters 1–3, 292-page PDF mapping and protected source scope');
