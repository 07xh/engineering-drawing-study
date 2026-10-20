'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Examples=require('../knowledge/textbook-examples.js');
const Geometry=require('../knowledge/textbook-example-geometry.js');
const Adapter=require('../knowledge/textbook-action-adapter.js');
const Summary=require('../knowledge/player-dof-summary.js');
const html=fs.readFileSync('knowledge/index.html','utf8');
for(const name of ['textbook-action-adapter.js','nonlinear-local-dof.js','nonlinear-step-trace.js','player-dof-summary.js','textbook-example-ui.js'])
 assert(html.includes('src="'+name+'"'),'missing math dependency '+name);
assert(html.indexOf('player-dof-summary.js')<html.indexOf('textbook-example-ui.js'),'summary engine must load first');
for(const id of ['bookExampleComputedDof','bookExampleComputedDofValue','bookExampleComputedDofLabel','bookExampleConstraintReason'])
 assert(html.includes('id="'+id+'"'));
class Node{
 constructor(){this.children=[];this.attributes={};this.handlers={};this.textContent='';this.hidden=false;this.checked=true;this.disabled=false;}
 replaceChildren(){this.children=[]}
 append(...xs){this.children.push(...xs)}
 setAttribute(k,v){this.attributes[k]=v}
 addEventListener(type,fn){this.handlers[type]=fn}
 click(){assert(this.handlers.click,'click handler missing');this.handlers.click()}
}
const els=new Map();
const get=id=>{if(!els.has(id))els.set(id,new Node());return els.get(id)};
const document={getElementById:get,createElementNS:()=>new Node(),createElement:()=>new Node()};
const window={TextbookExamples:Examples,TextbookExampleGeometry:Geometry,TextbookActionAdapter:Adapter,DrawingPlayerDofSummary:Summary};
const ctx={document,window};
vm.runInNewContext(fs.readFileSync('knowledge/textbook-example-ui.js','utf8'),ctx);
const show=window.TextbookExampleUI.show;
show('ch01-divide-and-polygons');
assert.equal(get('bookExampleComputedDof').hidden,false);
assert.equal(get('bookExampleComputedDofValue').textContent,'1');
assert.match(get('bookExampleConstraintReason').textContent,/AB/);
get('bookExampleNext').click();get('bookExampleNext').click();
assert.equal(get('bookExampleComputedDofValue').textContent,'1');
get('bookExampleNext').click();
assert.equal(get('bookExampleComputedDofValue').textContent,'0');
assert.match(get('bookExampleComputedDofLabel').textContent,/减少 1/);
show('ch02-point-coordinates');
assert.equal(get('bookExampleComputedDofValue').textContent,'2');
get('bookExampleNext').click();
assert.equal(get('bookExampleComputedDofValue').textContent,'1');
get('bookExampleNext').click();get('bookExampleNext').click();
assert.equal(get('bookExampleComputedDofValue').textContent,'0');
assert.equal(get('bookExamplePickerLabel').hidden,false);
assert.equal(get('bookExamplePicker').children.length,2);
get('bookExamplePicker').value='example-2-3';
get('bookExamplePicker').handlers.change();
assert.equal(get('bookExampleComputedDofValue').textContent,'2');
get('bookExampleNext').click();
assert.equal(get('bookExampleComputedDofValue').textContent,'2');
get('bookExampleNext').click();
assert.equal(get('bookExampleComputedDofValue').textContent,'1');
get('bookExampleNext').click();
assert.equal(get('bookExampleComputedDofValue').textContent,'0');
assert.match(get('bookExampleSource').textContent,/图 2-16/);
show('unverified-topic');
assert.equal(get('textbookExample').hidden,true,'unverified topic must not show example');
console.log('PASS: actual inline lesson UI computes source-aligned textbook DOF for both examples');
