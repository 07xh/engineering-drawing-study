'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const g=require('../knowledge/textbook-concept-motion.js');
const audit=require('../knowledge/textbook-page-audit.js');
const book=require('../knowledge/knowledge-data.js');
assert.deepEqual(g.ids,['ch01-divide-and-polygons','ch01-drawing-scale','ch04-s01','ch05-s02','ch10-s01']);
let frames=0;
for(const id of g.ids){
 const lesson=book.get(id);assert(lesson,'must refer to real third-edition section');
 assert.equal(lesson.contentStatus,id==='ch01-drawing-scale'?'page-reviewed':'toc-only','concept must preserve actual lesson status');
 const def=g.definition(id),source=audit.get(def.page);
 assert(source&&(source.visualSample||source.detailedInspected),'concept diagram has no page-level source evidence');
 assert.equal(def.page,def.printedPage+6,'PDF to printed page mapping broken');
 assert(Array.isArray(def.steps)&&def.steps.length>=3);
 for(let i=0;i<def.steps.length;i++){
  const frame=g.frame(id,i);
  assert(frame&&frame.shapes.length>=3,'step without rendered geometry');
  assert.equal(frame.page,def.page);
  for(const s of frame.shapes){
   assert(['line','rect','poly','text'].includes(s.type));
   if(s.type==='line')for(const p of [s.a,s.b])assert(Number.isFinite(p.x)&&Number.isFinite(p.y));
   if(s.type==='rect')assert([s.x,s.y,s.w,s.h].every(Number.isFinite));
  }
  frames++;
 }
 assert(g.frame(id,-1)===null);assert(g.frame(id,99)===null);
}
assert.equal(g.frame('not-real',0),null);
const hex=g.frame('ch01-divide-and-polygons',4).shapes.filter(x=>x.type==='line'&&x.kind==='result');
assert.equal(hex.length,6);
for(const edge of hex)assert(Math.abs(Math.hypot(edge.b.x-edge.a.x,edge.b.y-edge.a.y)-120)<1e-7,'regular hexagon edge must equal R');
assert(!g.frame('ch01-divide-and-polygons',0).shapes.some(x=>x.kind==='result'));
assert.equal(g.frame('ch01-drawing-scale',3).shapes.filter(x=>x.type==='text'&&x.label==='20 mm').length,3);
const html=fs.readFileSync('knowledge/index.html','utf8'),app=fs.readFileSync('knowledge/knowledge-app.js','utf8');
const build=fs.readFileSync('scripts/build-static.cjs','utf8');
for(const id of ['sixLayerConceptSlot','sixLayerConceptSvg','sixLayerConceptPrev',
 'sixLayerConceptNext','sixLayerConceptAction','sixLayerConceptScope','sixLayerConceptSource']){
 assert(html.includes('id="'+id+'"'));
}
for(const path of ['knowledge/textbook-concept-motion.js','knowledge/textbook-concept-motion-ui.js'])
 assert(build.includes("'"+path+"'"));
assert(html.indexOf('src="textbook-page-audit.js"')<html.indexOf('src="textbook-concept-motion-ui.js"'));
assert(app.includes('TextbookConceptMotionUI.show(layerData.id,layer)'));
class Node{
 constructor(){this.children=[];this.attributes={};this.handlers={};this.textContent='';this.disabled=false;this.hidden=true;}
 replaceChildren(){this.children=[]}
 append(x){this.children.push(x)}
 setAttribute(k,v){this.attributes[k]=String(v)}
 addEventListener(k,fn){this.handlers[k]=fn}
}
const items=new Map(),get=id=>{if(!items.has(id))items.set(id,new Node());return items.get(id)};
const document={getElementById:get,createElementNS:()=>new Node()};
const window={TextbookConceptMotion:g,TextbookPageAudit:audit};
vm.runInNewContext(fs.readFileSync('knowledge/textbook-concept-motion-ui.js','utf8'),{document,window});
const ui=window.TextbookConceptMotionUI;
ui.show('ch04-s01',1);
assert.equal(get('sixLayerConceptSlot').hidden,false);
assert.equal(get('sixLayerConceptCounter').textContent,'1 / 4 步');
assert(get('sixLayerConceptSvg').children.length>3);
assert.match(get('sixLayerConceptSource').textContent,/初步查看/);
get('sixLayerConceptNext').handlers.click();
assert.equal(get('sixLayerConceptCounter').textContent,'2 / 4 步');
ui.show('ch04-s01',2);
assert.equal(get('sixLayerConceptCounter').textContent,'2 / 4 步','same lesson can resume concept');
ui.show('ch05-s02',1);
assert.equal(get('sixLayerConceptCounter').textContent,'1 / 4 步','new lesson must reset concept');
ui.show('ch05-s02',3);
assert.equal(get('sixLayerConceptSlot').hidden,true,'concept illustrations must not appear as book exercises');
ui.show('nonexistent',1);
assert.equal(get('sixLayerConceptSlot').hidden,true);
console.log('PASS '+frames+' original step frames, accurate source-page disclaimers, source-sampled evidence and course integration');
