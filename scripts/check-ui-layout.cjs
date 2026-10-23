'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(file,'utf8');
const pages=[
 'index.html','knowledge/index.html','labs/chapter-26-29.html',
 'labs/chapter-drawing.html','labs/source-fidelity.html','labs/point-construction.html',
 'labs/analysis.html','labs/constraints.html','labs/paper-geometry.html','labs/composite-geometry.html'
];
const css=read('site-ui.css');
assert(css.length>5000,'shared style bundle is unexpectedly empty');
for(const required of ['.site-topbar','.site-more','.knowledge-workspace','.audit-workspace',
 '.site-disclosure','#drawingCanvas','.knowledge-card.is-active','@media(max-width:760px)',
 ':focus-visible','prefers-reduced-motion']){
 assert(css.includes(required),'UI system missing '+required);
}
const uniqueIds=source=>{
 const ids=[...source.matchAll(/\bid=(["'])([^"']+)\1/g)].map(m=>m[2]);
 const counter=new Map();
 for(const id of ids)counter.set(id,(counter.get(id)||0)+1);
 return [...counter].filter(([,n])=>n!==1).map(([id,n])=>id+':'+n);
};
for(const page of pages){
 const html=read(page),dir=path.dirname(page);
 assert(/<body[^>]*class="[^"]*\bui-refresh\b[^"]*"/.test(html),'UI class not enabled '+page);
 assert(html.includes('site-ui.css'),'UI stylesheet missing '+page);
 const expected=page==='index.html'?'href="site-ui.css"':'href="../site-ui.css"';
 assert(html.includes(expected),'UI stylesheet relative route invalid '+page);
 assert.deepEqual(uniqueIds(html),[],'duplicate DOM IDs in '+page);
 if(page==='index.html'){
  assert(html.includes('class="site-nav"')&&html.includes('class="site-more"'),'home should use textbook-only primary nav');
 }else{
  assert(html.includes('class="site-topbar"')&&html.includes('class="site-brand"'),'shared navigation missing '+page);
  assert(html.includes('class="site-nav"')&&html.includes('class="site-more"'),'collapsible cross-page tools missing '+page);
 }
 const nav=html.match(/<nav class="site-nav"[^>]*>([\s\S]*?)<\/nav>/);
 if(page!=='index.html'){
  assert(nav,'missing shared nav '+page);
  for(const match of nav[1].matchAll(/href="([^"]+)"/g)){
   const href=match[1];
   if(href.startsWith('#')||href.startsWith('http:')||href.startsWith('https:'))continue;
   const target=href.split('#')[0].split('?')[0];
   assert(fs.existsSync(path.resolve(dir,target)),'broken shared-nav route '+page+' -> '+href);
  }
 }
}
const drawing=read('labs/chapter-drawing.html');
const requiredDrawing=['board','background','lineFocus','ink','guides','sourceEvidence','sourceHighlight',
 'inspectPanel','exercise261Panel','researchPanel','dofPanel','methodSteps','researchSearch',
 'inspectCopy','drawingToggle','drawingCanvas','drawingAuditLink','revealControls'];
for(const id of requiredDrawing)assert(drawing.includes('id="'+id+'"'),'essential drawing control missing '+id);
const panels=[['inspectPanel','原图逐线核对'],['researchPanel','联网检索'],['dofPanel','自由度与辅助线'],
 ['methodSteps','分步解题思路']];
assert.equal((drawing.match(/class="site-disclosure"/g)||[]).length,4,'progressive disclosure panels incomplete');
for(const [id,label] of panels){
 assert(drawing.includes('id="'+id+'"'),label+' content lost in layout transformation');
}
assert(drawing.includes('<div class="sheet" id="drawingCanvas"><svg id="board"'),'drawing SVG board must not be replaced');
assert(drawing.includes('<section class="inspect-card" id="exercise261Panel"')&&drawing.includes('hidden'),'partial scanned source notice preserved');
assert(drawing.includes('src="verified-solutions.js"')&&drawing.includes('src="../knowledge/solution-gate.js"'),'verified answer gate scripts lost');
const known=read('knowledge/index.html'),knownApp=read('knowledge/knowledge-app.js');
for(const id of ['knowledgeCards','knowledgeDetail','visualLesson','knowledgeSearch','chapterSelect',
 'stepNext','visualNext','detailLaw','detailMistake','markRead'])assert(known.includes('id="'+id+'"'),'knowledge element missing '+id);
assert(known.includes('class="knowledge-workspace"'),'two-column knowledge structure not present');
assert(known.includes('href="#visualLesson"'),'geometry jump not provided');
assert(known.includes('id="deepLesson"'),'deep textbook explanations must appear');
assert(knownApp.includes('filtered()')&&knownApp.includes('KnowledgeVisualUI.show(id)'),'new textbook filtering and diagram binding must remain live');
assert(knownApp.includes("current?.id===item.id?' is-active'"),'selected textbook knowledge state not visible');
const fidelity=read('labs/source-fidelity.html');
assert(fidelity.includes('class="audit-workspace"')&&fidelity.includes('id="detail"'),'audit master-detail view missing');
assert(fidelity.includes('id="list"')&&fidelity.includes('id="detailFindings"'),'audit reports preserved');
for(const file of ['labs/verified-exercises.js','labs/verified-solutions.js','knowledge/solution-gate.js',
 'labs/chapter-drawing.js','labs/source-inspector-ui.js','labs/exercise-261-evidence.js',
 'labs/constraint-engine.js']){
 assert(fs.existsSync(file),'core data or algorithm missing: '+file);
}
assert(read('scripts/build-static.cjs').includes("'site-ui.css'"),'static builder must package shared stylesheet');
console.log('PASS shared UI: '+pages.length+' pages, all nav paths, unique control IDs, preserved drawing/knowledge/audit interactions and published CSS');
