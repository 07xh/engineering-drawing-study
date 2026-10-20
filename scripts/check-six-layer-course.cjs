'use strict';
/* Six-stage course must cover every TOC and reviewed entry without inflating verification status. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const book=require('../knowledge/knowledge-data.js');
const deep=require('../knowledge/lesson-depth.js');
const examples=require('../knowledge/textbook-examples.js');
const course=require('../knowledge/six-layer-course.js');
assert.equal(book.entries.length,110,'all textbook catalog entries must remain');
assert.equal(book.entries.filter(x=>x.contentStatus==='page-reviewed').length,54);
assert.equal(book.entries.filter(x=>x.contentStatus==='toc-only').length,56);
assert.equal(course.guideIds.length,39,'must cover all 36 later chapter sections and three appendices');
const later=book.sections.filter(x=>/^ch(0[4-9]|1[0-2])-/.test(x.id)||x.id.startsWith('appendix-'));
assert.equal(later.length,39);
for(const section of later)assert(course.guideIds.includes(section.id),'missing original later-section guide: '+section.id);
const labels=['提出问题','基础概念','原理推导','教材例题','自由度分析','结果检查'];
assert.deepEqual(course.names,labels);
let verified=0,pending=0,linked=0,deepCount=0;
for(const record of book.entries){
 const result=course.forEntry(record.id);
 assert(result&&result.id===record.id,'six layers missing '+record.id);
 assert.equal(result.levels.length,6,'stage count '+record.id);
 assert.deepEqual(result.levels.map(x=>x.name),labels,'sequence changed '+record.id);
 assert.equal(result.status,record.contentStatus,'source status must not be elevated');
 assert.equal(result.verified,record.contentStatus==='page-reviewed');
 for(const level of result.levels){
  assert(typeof level.id==='string'&&typeof level.headline==='string'&&level.headline.length>5,'missing stage heading '+record.id);
  assert(typeof level.text==='string'&&level.text.length>12,'missing educational content '+record.id+' '+level.id);
  assert(Array.isArray(level.details),'invalid stage details');
  for(const detail of level.details){
   assert(typeof detail.title==='string'&&typeof detail.body==='string'&&detail.body.length>=8);
  }
 }
 const sourceLinks=examples.forTopic(record.id);
 assert.deepEqual(result.levels[3].examples||[],sourceLinks.map(x=>x.id));
 if(record.contentStatus==='toc-only'){
  pending++;
  assert.equal(sourceLinks.length,0,'catalog-only content must never map verified textbook example');
  assert.match(result.sourceNote,/目录和页码|原创导学|未完成/);
  assert.match(result.levels[3].text,/尚无|未经|未/,'no invented exercise');
  assert(!JSON.stringify(result.levels).includes('原书题解：'),'unverified section got solution');
 }else{
  verified++;
  assert(record.summary&&record.law,'verified lesson lost basics');
  if(deep.get(record.id)){
   deepCount++;
   assert(result.levels[2].details.length>=3,'deep derivation must remain '+record.id);
  }
 }
 if(sourceLinks.length)linked++;
}
assert.equal(verified,54);assert.equal(pending,56);assert.equal(deepCount,28);
assert(linked>=2,'textbook geometry example should be attached to source-reviewed entries');
const html=fs.readFileSync('knowledge/index.html','utf8');
const app=fs.readFileSync('knowledge/knowledge-app.js','utf8');
const css=fs.readFileSync('knowledge/knowledge-ui.css','utf8');
const build=fs.readFileSync('scripts/build-static.cjs','utf8');
for(const id of ['sixLayerCourse','sixLayerNav','sixLayerPrev','sixLayerNext','sixLayerHeadline',
 'sixLayerText','sixLayerDetails','sixLayerSource','sixLayerExampleSlot','sixLayerGuidance']){
 assert(html.includes('id="'+id+'"'),'missing UI '+id);
}
assert(html.includes('src="six-layer-course.js"'),'course library not loaded');
assert(html.indexOf('src="textbook-examples.js"')<html.indexOf('src="six-layer-course.js"'),'textbook example module needs to load before six-stage renderer');
assert(html.indexOf('src="six-layer-course.js"')<html.indexOf('src="knowledge-app.js"'),'stage data needs to load before UI');
assert(app.includes("mountSixLayerExample()"),'verified textbook player not moved into fourth layer');
assert(app.includes('showSixLayer(item.id);'),'all knowledge entries must render six layers');
assert(app.includes("layer===3&&hasExample"),'unreviewed exercises must remain hidden');
assert(app.includes("$('verifiedLessonContent').hidden=true"),'duplicated legacy panels must not overwhelm lessons');
assert(app.includes('renderSixLayer()'),'six-stage navigation must be interactive');
assert(css.includes('.six-layer-nav'),'course navigation has no styling');
assert(build.includes("'knowledge/six-layer-course.js'"),'course asset not packaged for deployment');
console.log('PASS six-layer learning: 110 entries, 54 reviewed, 56 directory guides, 39 later/appendix guides, 28 deeper lessons, '+linked+' textbook-linked topics');
