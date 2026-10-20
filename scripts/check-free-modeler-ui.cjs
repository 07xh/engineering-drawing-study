'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Free=require('../labs/free-geometry-core.js'),Sheet=require('../labs/free-geometry-sheet.js'),Spatial=require('../labs/free-geometry-spatial-svg.js');
const html=fs.readFileSync('labs/free-modeler.html','utf8'),ui=fs.readFileSync('labs/free-modeler-ui.js','utf8');
for(const p of ['dof-lab-geometry.js','dof-lab-spatial-svg.js','free-geometry-core.js','free-geometry-sheet.js','free-geometry-spatial-svg.js','dof-lab-three-bundle.js','free-modeler-ui.js'])
 assert(html.includes('src="'+p+'"'),p+' must be loaded');
for(const id of ['freeSheet','freeSpace','freeThree','freeDegrees','freeCounts','freePointForm','freeEdgeForm','freePointName','freeX','freeY','freeZ','freeSavePoint','freeNewPoint','freeDeletePoint','freePointList','freeEdgeA','freeEdgeB','freeAddEdge','freeEdgeList','freeUndo','freeClear','freeShowGuides','freeStatus','freeViewerStatus','freeTurnLeft','freeTurnRight','freeZoomIn','freeZoomOut','freeResetView','freeMathNote'])
 assert(html.includes('id="'+id+'"'),'page missing '+id);
const elements=new Map();
class Node{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.events={};this._value='';this.textContent='';this.innerHTML='';this.checked=false;this.disabled=false;this.hidden=false;this.attributes={};this.className='';this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x)}}
 set id(value){this._id=value;elements.set(value,this)}
 get id(){return this._id}
 set value(value){this._value=String(value)}
 get value(){return this._value}
 append(...nodes){this.children.push(...nodes);if(this.tagName==='select'&&this.children.length===nodes.length&&nodes.length)this._value=nodes[0].value}
 replaceChildren(...nodes){this.children=[...nodes];if(this.tagName==='select')this._value=this.children[0]?.value||''}
 addEventListener(type,fn){this.events[type]=fn}
 getAttribute(k){return this.attributes[k]||null}
 setAttribute(k,v){this.attributes[k]=String(v)}
 setPointerCapture(){}
}
const $=id=>{if(!elements.has(id)){const n=new Node();n.id=id}return elements.get(id)};
for(const id of [...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]))$(id);
for(const key of ['freeX','freeY','freeZ'])$(key).value={freeX:'25',freeY:'20',freeZ:'35'}[key];
$('freeShowGuides').checked=true;
const nudges=[...html.matchAll(/data-nudge="([^"]+)"/g)].map(x=>{const n=new Node('button');n.attributes['data-nudge']=x[1];return n});
const document={getElementById:$,createElement:tag=>new Node(tag),querySelectorAll:query=>query==='[data-nudge]'?nudges:[]};
const window={DrawingFreeGeometry:Free,DrawingFreeSheet:Sheet,DrawingFreeSpatial:Spatial};
vm.runInNewContext(ui,{window,document},{filename:'labs/free-modeler-ui.js'});
const controller=window.DrawingFreeModelerController,submit=id=>$(id).events.submit({preventDefault(){}});
assert.equal($('freeDegrees').textContent,'0');
assert.equal(controller.getState().points.length,0);
assert($('freeSheet').innerHTML.includes('空白图纸'));
assert($('freeSheet').innerHTML.includes('45°'));
submit('freePointForm');
assert.equal(controller.getState().points[0].id,'A');
assert.equal($('freeDegrees').textContent,'3');
assert.equal(($('freeSheet').innerHTML.match(/data-point=/g)||[]).length,3);
$('freeNewPoint').events.click();
$('freePointName').value='B';$('freeX').value='55';$('freeY').value='25';$('freeZ').value='36';
submit('freePointForm');
assert.equal($('freeDegrees').textContent,'6');
assert.equal(controller.getState().points.length,2);
$('freeEdgeA').value='A';$('freeEdgeB').value='B';
submit('freeEdgeForm');
assert.equal(controller.getState().edges.length,1);
assert.equal($('freeDegrees').textContent,'6','drawing an edge must not create hidden rigidity constraints');
assert($('freeSpace').innerHTML.includes('data-segment="A-B"'));
assert($('freeSheet').innerHTML.includes('data-segment="A-B"'));
controller.select('A');
$('freePointName').value='C';$('freeX').value='30';$('freeY').value='20';$('freeZ').value='35';
submit('freePointForm');
assert.equal(controller.getState().edges[0].a,'C');
assert(!controller.getState().points.some(p=>p.id==='A'));
controller.select('C');nudges.find(n=>n.getAttribute('data-nudge')==='z:5').events.click();
assert.equal(controller.getState().points.find(p=>p.id==='C').z,40);
$('freeUndo').events.click();
assert.equal(controller.getState().points.find(p=>p.id==='C').z,35);
controller.select('C');
$('freeDeletePoint').events.click();
assert.equal(controller.getState().points.length,1);
assert.equal(controller.getState().edges.length,0,'deleting a point also removes attached edges');
$('freeUndo').events.click();
assert.equal(controller.getState().points.length,2);
assert.equal(controller.getState().edges.length,1);
$('freeShowGuides').checked=false;$('freeShowGuides').events.change();
assert(!$('freeSheet').innerHTML.includes('data-kind="depth-HM"'));
controller.select('C');$('freeShowGuides').checked=true;$('freeShowGuides').events.change();
assert($('freeSheet').innerHTML.includes('data-kind="depth-HM"'));
$('freeClear').events.click();
assert.equal(controller.getState().points.length,0);
assert.equal($('freeDegrees').textContent,'0');
$('freeUndo').events.click();
assert.equal(controller.getState().points.length,2);
assert.equal($('freeDegrees').textContent,'6');
$('freeNewPoint').events.click();$('freePointName').value='<script>';
submit('freePointForm');
assert.equal(controller.getState().points.length,2);
assert($('freeStatus').textContent.includes('点名'));
assert($('freeViewerStatus').textContent.includes('SVG'),'WebGL missing must not prevent editing');
controller.apply({type:'add-point',id:'D',x:10,y:60,z:70});
assert.equal($('freeDegrees').textContent,'9');
assert.equal($('freeAddFace').disabled,false);
$('freeFaceA').value='C';$('freeFaceB').value='B';$('freeFaceC').value='D';
submit('freeFaceForm');
assert.equal(controller.getState().faces.length,1);
assert.equal(controller.getState().edges.length,3);
assert($('freeSheet').innerHTML.includes('class="free-sheet-face"'));
assert($('freeSpace').innerHTML.includes('class="free-space-face"'));
assert.equal($('freeDegrees').textContent,'9');
$('freeUndo').events.click();
assert.equal(controller.getState().faces.length,0);
assert.equal(controller.getState().edges.length,1,'undo restores previous boundary-edge set');
$('freeFaceA').value='C';$('freeFaceB').value='B';$('freeFaceC').value='D';
submit('freeFaceForm');
assert.equal(controller.getState().faces.length,1);
$('freeFaceList').children[0].children[1].children[0].events.click();
assert.equal(controller.getState().faces.length,0,'user should be able to delete an individual face');
assert.equal($('freeDegrees').textContent,'9');

console.log('PASS: free modeler real DOM workflow, 3D/three-view sync, edge lifecycle, renaming, nudging, undo and invalid input');
