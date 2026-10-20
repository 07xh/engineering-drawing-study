'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const retired=[
 'content.js','app.js','question-strategies.js','styles.css','labs/v7.html',
 'labs/line-projection.html','labs/line-projection.js','labs/line-workbench-layout.js',
 'lessons/plane-projection.html'
];
const build=read('scripts/build-static.cjs'),home=read('index.html');
for(const p of retired){
 assert(!build.includes("'"+p+"'"),'legacy original-question file still in public build: '+p);
 assert(!fs.existsSync(p),'legacy original-question file still in current source branch: '+p);
}
for(const phrase of ['74 题','74 道','原创练习题','题型训练','第 2 章 · 课堂','旧版实验室','labs/v7.html','question-bank']){
 assert(!home.includes(phrase),'retired mock question/lesson still appears on the front page: '+phrase);
}
assert(home.includes('第三版教材 · 唯一课程体系'),'homepage not linked to correct edition');
assert(home.includes('已提交习题'),'submitted exercise entry missing');
for(let i=1;i<=12;i++)assert(home.includes('?chapter=ch'+String(i).padStart(2,'0')),'missing textbook chapter '+i);
const ctx={};vm.runInNewContext(read('knowledge/knowledge-data.js'),ctx);
const book=ctx.DrawingKnowledge;
assert.equal(book.entries.length,110,'full textbook catalog must be preserved');
assert.equal(book.entries.filter(x=>x.contentStatus==='page-reviewed').length,54);
const lesson={};vm.runInNewContext(read('knowledge/lesson-depth.js'),lesson);
const depth=lesson.TextbookDeepLessons;
assert(depth&&depth.ids.length>=16,'need first wave of longer-than-summary lessons');
for(const id of depth.ids){
 const e=book.get(id),d=depth.get(id);
 assert(e&&e.contentStatus==='page-reviewed','deep lesson is not grounded in verified chapter: '+id);
 assert(d.stages.length>=3,'insufficient reasoning steps '+id);
 for(const field of ['question','logic','example','check','boundary'])
  assert(typeof d[field]==='string'&&d[field].length>=34,'missing in-depth content '+id+'.'+field);
 assert(d.stages.every(s=>Array.from(s).length===3&&s.every(t=>typeof t==='string'&&t.length>=8)),'stage needs condition, explanation, constraints: '+id);
 assert(!d.example.includes('标准答案'),'concept narrative may not present itself as textbook answer');
}
assert(depth.ids.some(id=>id.startsWith('ch01-'))&&depth.ids.some(id=>id.startsWith('ch02-'))&&depth.ids.some(id=>id.startsWith('ch03-')),
 'deep teaching should cover first three textbook chapters');
const kbHTML=read('knowledge/index.html'),kbApp=read('knowledge/knowledge-app.js');
for(const tag of ['deepLesson','deepStages','deepLogic','deepQuestion','deepExample','deepCheck','deepBoundary'])assert(kbHTML.includes('id="'+tag+'"'),'missing teaching panel '+tag);
assert(kbHTML.includes('src="lesson-depth.js"'),'deep lesson library not loaded');
assert(kbApp.includes('function showDepth(item)')&&kbApp.includes('showDepth(item);'),'lesson depth is not wired');
assert(kbApp.includes("item.contentStatus==='page-reviewed'"),'unreviewed chapter should not show a deep lesson');
assert(kbApp.includes("new URLSearchParams(location.search).get('chapter')"),'chapter filter deep links must work');
const sources={};vm.runInNewContext(read('labs/verified-exercises.js'),sources);
const library=sources.VerifiedExerciseGeometry;
assert.equal(library.ids.length,28,'submitted partial-scan exercise count must not change');
for(const id of library.ids)assert.equal(library.get(id).status,'partial','unverified submitted exercise became a verified answer: '+id);
const page=read('labs/chapter-26-29.html');
assert(!page.includes("独立编写的练习提示"),'unverified submitted exercises should not carry mock questions');
assert(page.includes('完整题意与原书投影关系尚未核实'),'must flag incomplete exercise prompts');
for(const path of ['knowledge/index.html','labs/chapter-26-29.html','labs/chapter-drawing.html',
 'labs/source-fidelity.html','labs/analysis.html','labs/constraints.html','labs/point-construction.html']){
 const s=read(path);
 for(const old of ['v7.html','line-projection.html','lessons/plane-projection.html'])
 assert(!s.includes('href="'+old+'"')&&!s.includes('href="../labs/'+old+'"')&&!s.includes('href="../'+old+'"'),
  'published page links to removed quiz/old course: '+path+' -> '+old);
}
console.log('PASS: textbook-only homepage and public build, no old original question files, 28 submitted partial exercises retained, '+depth.ids.length+' deep lessons tied to verified chapters');
