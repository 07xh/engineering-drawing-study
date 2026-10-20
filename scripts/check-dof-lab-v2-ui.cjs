'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../labs/constraint-engine.js'),G=require('../labs/dof-lab-geometry.js');
const S=require('../labs/dof-lab-sheet.js'),State=require('../labs/dof-lab-state.js'),Spatial=require('../labs/dof-lab-spatial-svg.js');
const html=fs.readFileSync('labs/dof-lab-v2.html','utf8');
const ui=fs.readFileSync('labs/dof-lab-v2-ui.js','utf8');
for(const file of ['constraint-engine.js','dof-lab-geometry.js','dof-lab-sheet.js','dof-lab-state.js','dof-lab-spatial-svg.js','dof-lab-v2-ui.js'])
 assert(html.includes('src="'+file+'"'),file+' must load');
for(const id of ['solid','selectedVertex','space','sheet','conditionForm','conditionType','conditionInputs','saveCondition','cancelEdit','undo','clear','conditionList','degrees','rank','status','dofResult','analysis','scope','trialX','trialY','trialZ','showGuides','showWireframe','showLabels','pointCoordinates','uiStatus'])
 assert(html.includes('id="'+id+'"'),id+' missing in interactive page');
assert(html.includes('同一张工程图纸')&&html.includes('45°'));
const elements=new Map();
class Node{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.events={};this.attributes={};this.textContent='';this._value='';this.innerHTML='';this.checked=false;this.hidden=false;this.disabled=false;
  this.classes=new Set();this.classList={toggle:(key,on)=>{if(on===undefined)on=!this.classes.has(key);on?this.classes.add(key):this.classes.delete(key)},
   add:key=>this.classes.add(key),remove:key=>this.classes.delete(key)};}
 set id(x){this._id=x;elements.set(x,this)}
 get id(){return this._id}
 set value(x){this._value=String(x)}
 get value(){return this._value}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=[...nodes]}
 addEventListener(type,fn){this.events[type]=fn}
 setAttribute(k,v){this.attributes[k]=v}
 insertAdjacentHTML(position,html){this.innerHTML+=html}
 focus(){}
 setPointerCapture(){}
}
function $(id){if(!elements.has(id)){const n=new Node();n.id=id;}return elements.get(id)}
for(const id of [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]))$(id);
$('showGuides').checked=true;$('showWireframe').checked=true;
const document={getElementById:$,createElement:tag=>new Node(tag)};
const win={DrawingConstraints:E,DrawingLabGeometry:G,DrawingLabSheet:S,DrawingLabState:State,DrawingLabSpatialPreview:Spatial};
vm.runInNewContext(ui,{window:win,document},{filename:'labs/dof-lab-v2-ui.js'});
assert.equal($('degrees').textContent,'3');
assert.equal(win.DrawingLabV2Controller.getState().conditions.length,0);
assert($('sheet').innerHTML.includes('class="sheet-miter"'));
assert($('sheet').innerHTML.includes('正视图 V'));
assert($('sheet').innerHTML.includes('俯视图 H'));
assert($('sheet').innerHTML.includes('左视图 W'));
const submit=()=>$('conditionForm').events.submit({preventDefault(){}});
submit(); // default H projection (35,22).
assert.equal($('degrees').textContent,'1');
assert.equal(win.DrawingLabV2Controller.getState().conditions.length,1);
assert.equal(($('sheet').innerHTML.match(/data-target-view=/g)||[]).length,3);
$('conditionType').value='plane';$('conditionType').events.change();
assert.equal($('field-offset').value,'51');
submit();
assert.equal($('degrees').textContent,'0');
assert($('pointCoordinates').textContent.includes('35，22，51'));
const steps=$('conditionList').children;
assert.equal(steps.length,2);
const edit=steps[0].children[1].children[1];
edit.events.click();assert.equal($('saveCondition').textContent,'保存修改');
$('field-u').value='39';submit();assert.equal($('degrees').textContent,'0');
assert(win.DrawingLabV2Controller.getState().conditions[0].condition.value[0]===39);
$('undo').events.click();assert.equal(win.DrawingLabV2Controller.getState().conditions[0].condition.value[0],35);
win.DrawingLabV2Controller.apply({type:'add',condition:{type:'coordinate',axis:'z',value:6}});
assert.equal($('degrees').textContent,'无解');
assert(!$('sheet').innerHTML.includes('data-target-view='),'no false projected solution on conflict');
assert($('sheet').innerHTML.includes('约束冲突'));
$('undo').events.click();assert.equal($('degrees').textContent,'0');
$('clear').events.click();assert.equal($('degrees').textContent,'3');
assert.equal(win.DrawingLabV2Controller.getState().conditions.length,0);
$('solid').value='pyramid';$('solid').events.change();assert.equal(win.DrawingLabV2Controller.getState().modelId,'pyramid');
$('field-offset').value=''; // this field is still plane from last choice.
submit();assert.match($('uiStatus').textContent,/必须填写有效数字/);
assert.equal(win.DrawingLabV2Controller.getState().conditions.length,0);
console.log('PASS: actual V2 experiment page renders both views, edits constraints, rejects invalid input, handles conflict and undo');
