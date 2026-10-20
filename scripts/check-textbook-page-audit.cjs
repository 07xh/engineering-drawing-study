'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const book=require('../knowledge/knowledge-data.js');
const audit=require('../knowledge/textbook-page-audit.js');
assert.equal(audit.pageCount,292,'user scan page count must be 292');
assert.equal(audit.pages.length,292);
const keys=new Set(audit.pages.map(x=>x.pdfPage));assert.equal(keys.size,292);
assert.equal(audit.pages.filter(x=>x.part==='front').length,6);
assert.equal(audit.pages.filter(x=>x.part==='body').length,284);
assert.equal(audit.pages.filter(x=>x.part==='back').length,2);
assert.equal(audit.get(7).printedPage,1);
assert.equal(audit.get(290).printedPage,284);
assert.equal(audit.get(0),null);assert.equal(audit.get(293),null);
assert.equal(audit.summary().indexed,292);
assert.equal(audit.summary().visuallySampled,30);
assert.equal(audit.summary().fullyReviewed,0,
 'orientation samples may never count as fully reviewed pages');
for(const page of audit.pages){
 assert(page.scanIndexed);
 assert.equal(page.extractedTextAvailable,false,
  'scanned PDF must not be represented as searchable text');
 if(page.fullyPageReviewed){
  assert(page.evidence&&page.evidence.text&&page.evidence.figures&&page.evidence.examples&&page.evidence.steps);
 }
 if(page.visualSample)assert.equal(page.fullyPageReviewed,false);
}
for(const section of book.sections){
 const pages=audit.forSection(section.id);
 assert.equal(pages.length,section.endPage-section.startPage+1,'broken printed-page mapping '+section.id);
 assert.equal(pages[0].printedPage,section.startPage);
 assert.equal(pages.at(-1).printedPage,section.endPage);
 for(const entry of pages){assert.equal(entry.sectionId,section.id);assert.equal(entry.chapter,section.chapter);}
}
for(const note of audit.figureSourceNotes){
 const page=audit.get(note.pdfPage);
 assert.equal(page.printedPage,note.printedPage);
 assert.equal(page.chapter,note.chapter);
 assert(page.visualSample,'figure note points at uninspected page');
 assert.equal(note.status,'visual-sampled');
}
const html=fs.readFileSync('knowledge/page-audit.html','utf8');
const ui=fs.readFileSync('knowledge/textbook-page-audit-ui.js','utf8');
const build=fs.readFileSync('scripts/build-static.cjs','utf8');
for(const asset of ['knowledge/page-audit.html','knowledge/textbook-page-audit.js','knowledge/textbook-page-audit-ui.js']){
 assert(build.includes("'"+asset+"'"),'missing public audit asset '+asset);
}
for(const id of ['auditPages','auditChapter','auditCount','auditSampled','auditReviewed','auditWaiting']){
 assert(html.includes('id="'+id+'"'),'dashboard element missing '+id);
}
assert(html.includes('src="textbook-page-audit.js"'));
assert(ui.includes('data.pages'),'dashboard not connected to full PDF page ledger');
assert(!html.includes('<iframe'),'do not embed source PDF');
console.log('PASS 292-page scan register, 30 honest overview samples, 53 sections + 3 appendices mapped, zero false full-page verifications');
