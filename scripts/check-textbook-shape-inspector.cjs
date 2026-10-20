'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Examples=require('../knowledge/textbook-examples.js');
const Geometry=require('../knowledge/textbook-example-geometry.js');
const Inspector=require('../knowledge/textbook-shape-inspector.js');
const read=p=>fs.readFileSync(p,'utf8');
let shapeCount=0;
for(const example of Examples.all){
 for(let stage=0;stage<example.order.length;stage++){
  const frame=Geometry.frame(example.id,stage);
  for(const shape of frame.shapes){
   const info=Inspector.explain(example.id,shape);
   assert(info,'Missing explanation: '+example.id+' step '+stage+' '+shape.label);
   for(const property of ['name','role','reason','effect']){
    assert(typeof info[property]==='string'&&info[property].length>=4,
     'Empty '+property+' for '+example.id+' '+shape.label);
   }
   shapeCount++;
  }
 }
}
assert.equal(Inspector.explain('unknown-example',{label:'AB',type:'line'}),null);
assert.equal(Inspector.explain('example-1-1',{label:'made up',type:'line'}),null);
const parallel=Inspector.explain('example-1-1',{type:'line',label:'过 3 作平行线'});
assert.match(parallel.effect,/相交/);
assert.match(Inspector.explain('example-2-2',{type:'line',label:'45°深度转移'}).effect,/不/);
assert.match(Inspector.explain('example-2-3',{type:'line',label:'同高联系线'}).effect,/深度/);
assert.match(Inspector.explain('example-1-1',{type:'point',label:'Q3'}).reason,/3\/7/);
const html=read('knowledge/index.html'),ui=read('knowledge/textbook-example-ui.js'),build=read('scripts/build-static.cjs');
for(const id of ['bookExampleShapeInspector','bookExampleShapeSelect','bookExampleShapeName','bookExampleShapeRole',
 'bookExampleShapeReason','bookExampleShapeEffect'])assert(html.includes('id="'+id+'"'),id+' missing');
assert(html.indexOf('src="textbook-shape-inspector.js"')<html.indexOf('src="textbook-example-ui.js"'),
 'inspector must load before UI');
assert(build.includes("'knowledge/textbook-shape-inspector.js'"),'inspector not built');
assert(ui.includes('function bindHit(node,item,key)'), 'clickable geometry not connected');
assert(ui.includes("node.addEventListener('keydown',event=>"),'shape inspection lacks keyboard activation');
class Node{
 constructor(){this.children=[];this.attributes={};this.handlers={};this.hidden=false;this.checked=true;this.disabled=false;this.textContent='';this.value='';}
 replaceChildren(){this.children=[]}
 append(...nodes){this.children.push(...nodes)}
 setAttribute(k,v){this.attributes[k]=String(v)}
 getAttribute(k){return this.attributes[k]}
 addEventListener(t,fn){this.handlers[t]=fn}
 click(){assert(this.handlers.click,'click missing');this.handlers.click()}
 querySelectorAll(selector){if(selector==='[data-inspect-key]')return this.children.filter(x=>x.attributes['data-inspect-key']);return []}
 focus(){this.focused=true}
}
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id)};
const document={getElementById:get,createElementNS:()=>new Node(),createElement:()=>new Node()};
const window={TextbookExamples:Examples,TextbookExampleGeometry:Geometry,TextbookShapeInspector:Inspector,
 TextbookActionAdapter:require('../knowledge/textbook-action-adapter.js'),
 DrawingPlayerDofSummary:require('../knowledge/player-dof-summary.js')};
get('bookExampleShowAux').checked=true;get('bookExampleHighlight').checked=true;
vm.runInNewContext(ui,{document,window});
window.TextbookExampleUI.show('ch02-point-projection');
assert.match(get('bookExampleShapeReason').textContent,/高度|深度|参考/);
assert.equal(get('bookExampleSvg').attributes.role,'group');
assert(get('bookExampleSvg').children.some(x=>x.attributes['data-hit']==='true'),'SVG lacks touch hit targets');
const firstKey=get('bookExampleShapeSelect').children[0].value;
assert(firstKey,'selector must contain visible shapes');
const initial=get('bookExampleSvg').children.find(x=>x.attributes['data-inspect-key']===firstKey);
assert(initial&&initial.handlers.click&&initial.handlers.keydown&&initial.attributes.tabindex==='0',
 'shape must have pointer and keyboard handlers');
get('bookExampleNext').click();get('bookExampleNext').click();
const hit=get('bookExampleSvg').children.find(x=>x.attributes['data-inspect-key']?.includes('45°深度转移'));
assert(hit,'45-degree helper must be selectable at step 3');
hit.click();
assert.match(get('bookExampleShapeName').textContent,/45°/);
assert.match(get('bookExampleShapeEffect').textContent,/不/);
assert.equal(get('bookExampleSvg').children.filter(x=>x.attributes['data-hit']==='true').length,
 get('bookExampleShapeSelect').children.length,'every choice must be in the drawing');
const beforeDof=get('bookExampleComputedDofValue').textContent;
get('bookExampleHighlight').checked=false;get('bookExampleHighlight').handlers.change();
assert.equal(get('bookExampleComputedDofValue').textContent,beforeDof,
 'inspection/highlight cannot change constraint results');
assert.match(get('bookExampleShapeName').textContent,/45°/,'selection lost on highlight toggle');
get('bookExampleShowAux').checked=false;get('bookExampleShowAux').handlers.change();
assert(!get('bookExampleShapeSelect').children.some(x=>x.textContent.includes('45° 深度转移')),
 'hidden helper must not remain selectable');
const visibleHit=get('bookExampleSvg').children.find(x=>x.attributes['data-hit']==='true');
let prevented=false;
visibleHit.handlers.keydown({key:'Enter',preventDefault(){prevented=true}});
assert(prevented,'Enter key must activate inspection');
assert.equal(get('bookExampleShapeSelect').value,visibleHit.attributes['data-inspect-key']);
window.TextbookExampleUI.show('unverified-topic');
assert.equal(get('textbookExample').hidden,true);
console.log('PASS '+shapeCount+' textbook geometry instances covered by source-scoped explanations; SVG pointer/keyboard/select/hide/state tests');
