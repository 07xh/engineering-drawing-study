'use strict';
/* Constraints are drawn from source-reviewed adapter models; toggles never rewrite book frames. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Examples=require('../knowledge/textbook-examples.js');
const Geometry=require('../knowledge/textbook-example-geometry.js');
const Adapter=require('../knowledge/textbook-action-adapter.js');
const Core=require('../knowledge/textbook-constraint-visual.js');
const Planar=require('../knowledge/planar-point-constraints.js');
const degrees={'example-1-1':[1,1,1,0,0],'example-2-2':[2,1,1,0,0],'example-2-3':[2,2,1,0,0]};
let seen=0;
for(const example of Examples.all){
 const adapted=Adapter.adapt(example,Geometry);
 assert.equal(adapted.steps.length,5);
 for(let stage=0;stage<5;stage++){
  const configured=Core.stageModel(example,stage,adapted);
  assert(configured,'reviewed example without a constraint visualization: '+example.id+' / '+stage);
  const report=Core.analyze(configured);
  assert.equal(report.degrees,degrees[example.id][stage], 'wrong degree for '+example.id+'/'+stage);
  assert.equal(report.sourceDegrees,report.degrees);
  const aliases=adapted.steps[stage].localDofAnalysis.constraints;
  assert.equal(configured.conditions.length,aliases.length,'must not invent new textbook constraints');
  assert.equal(report.conditions.length,aliases.length);
  assert(report.conditions.every(c=>c.status==='independent'),'source geometry has an unexpected redundant or conflicting condition');
  const primitives=Core.visuals(report),types=primitives.map(p=>p.type);
  if(report.degrees===2){
   assert(types.includes('region'),'unrestricted point must show a plane region');
   assert(!types.includes('solution'),'undetermined point must not leak the result');
  }else if(report.degrees===1){
   assert(types.includes('locus'),'one free direction needs a movable line');
   assert(!types.includes('solution'),'one free direction must not display a unique intersection');
  }else{
   assert(types.includes('solution'),'two independent paper conditions should determine the point');
   const solution=primitives.find(p=>p.type==='solution');
   assert(Math.hypot(solution.x-configured.target.x,solution.y-configured.target.y)<1e-7);
  }
  for(const p of primitives.filter(x=>x.ends)){
   for(const pt of p.ends){
    const b=configured.bounds;
    assert(pt.x>=b.x-1e-7&&pt.x<=b.x+b.w+1e-7&&pt.y>=b.y-1e-7&&pt.y<=b.y+b.h+1e-7,
     'line should be clipped to the correct book projection area');
   }
  }
  if(report.conditions.length===2){
   for(const condition of report.conditions){
    const demo=Core.analyze(configured,[condition.id]);
    assert.equal(demo.degrees,1,'temporarily removing one independent line must leave one free direction');
    assert.equal(demo.sourceDegrees,0,'experimental checkbox must not rewrite canonical analysis');
   }
   assert.equal(Core.analyze(configured,configured.conditions.map(c=>c.id)).degrees,2);
  }
  seen++;
 }
}
const dummy=Adapter.adapt(Examples.get('example-2-2'),Geometry);
assert.equal(Core.stageModel({...Examples.get('example-2-2'),sourceStatus:'partial'},3,dummy),null);
assert.equal(Core.stageModel({id:'made-up',sourceStatus:'page-figure-reviewed'},2,dummy),null);
const invalid=Adapter.adapt(Examples.get('example-1-1'),Geometry);
invalid.steps[3].localDofAnalysis.points.Q1.x+=100;
assert.throws(()=>Core.stageModel(Examples.get('example-1-1'),3,invalid),/不满足约束/);
const hit=Core.clipLine({type:'coordinate',axis:'x',value:580},{x:430,y:40,w:345,h:145});
assert(hit&&Math.abs(hit[0].x-580)<1e-7&&Math.abs(hit[1].x-580)<1e-7);
assert.equal(Core.clipLine({type:'coordinate',axis:'x',value:900},{x:430,y:40,w:345,h:145}),null);
const html=fs.readFileSync('knowledge/index.html','utf8');
const builder=fs.readFileSync('scripts/build-static.cjs','utf8');
const app=fs.readFileSync('knowledge/textbook-example-ui.js','utf8');
for(const id of ['bookExampleConstraintPanel','bookExampleConstraintOptions','bookExampleConstraintDegrees',
 'bookExampleConstraintState','bookExampleConstraintVisible','bookExampleConstraintLinked',
 'bookExampleConstraintExperiment','bookExampleConstraintScope']){
 assert(html.includes('id="'+id+'"'),'missing interactive constraint UI '+id);
}
for(const p of ['planar-point-constraints.js','textbook-constraint-visual.js','textbook-constraint-visual-ui.js']){
 assert(html.includes('src="'+p+'"'),'missing browser dependency '+p);
 assert(builder.includes("'knowledge/"+p+"'"),'missing production asset '+p);
}
assert(html.indexOf('src="planar-point-constraints.js"')<html.indexOf('src="textbook-constraint-visual.js"'));
assert(html.indexOf('src="textbook-constraint-visual-ui.js"')<html.indexOf('src="textbook-example-ui.js"'));
assert(app.includes('TextbookConstraintVisualUI.show(current,index,problem,selected?.label||null)'),'book step changes must redraw locus overlay');
assert(app.includes('TextbookConstraintVisualUI?.clear()'),'missing safe cleanup on unreviewed topic');

class Node{
 constructor(tag=''){this.tag=tag;this.children=[];this.attributes={};this.handlers={};this.textContent='';this.hidden=false;this.checked=true;this.disabled=false;this.parentNode=null;}
 append(...items){for(const item of items){item.parentNode=this;this.children.push(item)}}
 replaceChildren(){for(const child of this.children)child.parentNode=null;this.children=[]}
 setAttribute(k,v){this.attributes[k]=String(v)}
 addEventListener(k,fn){this.handlers[k]=fn}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null}}
}
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new Node(id));return nodes.get(id)};
const document={getElementById:get,createElement:tag=>new Node(tag),createElementNS:(ns,tag)=>new Node(tag)};
const window={TextbookConstraintVisual:Core};
get('bookExampleConstraintVisible').checked=true;
vm.runInNewContext(fs.readFileSync('knowledge/textbook-constraint-visual-ui.js','utf8'),{document,window});
const ui=window.TextbookConstraintVisualUI;
const ex=Examples.get('example-2-2'),steps=Adapter.adapt(ex,Geometry);
ui.show(ex,0,steps,'a');
assert.equal(get('bookExampleConstraintDegrees').textContent,'2 个');
assert.equal(get('bookExampleConstraintPanel').hidden,false);
assert(get('bookExampleSvg').children.some(x=>x.attributes.class==='book-constraint-overlay'),'must draw feasible region');
ui.show(ex,1,steps,'a′ 的等高联系线');
assert.equal(get('bookExampleConstraintDegrees').textContent,'1 个');
assert.equal(get('bookExampleConstraintOptions').children.length,1);
assert.match(get('bookExampleConstraintLinked').textContent,/高度一致|等高/);
ui.show(ex,3,steps,'W面深度定位线');
assert.equal(get('bookExampleConstraintDegrees').textContent,'0 个');
assert.equal(get('bookExampleConstraintOptions').children.length,2);
const firstOption=get('bookExampleConstraintOptions').children[0].children[0];
firstOption.checked=false;firstOption.handlers.change();
assert.equal(get('bookExampleConstraintDegrees').textContent,'1 个');
assert.equal(get('bookExampleConstraintExperiment').hidden,false);
assert(get('bookExampleSvg').children.some(x=>x.attributes.class==='book-constraint-overlay'),'switch must recompute line locus');
ui.show(ex,3,steps,'W面深度定位线');
assert.equal(get('bookExampleConstraintDegrees').textContent,'1 个','toggle should persist within a stage');
ui.show(ex,4,steps);
assert.equal(get('bookExampleConstraintDegrees').textContent,'0 个','new stage restores canonical source constraints');
assert.equal(get('bookExampleConstraintExperiment').hidden,true);
get('bookExampleConstraintVisible').checked=false;get('bookExampleConstraintVisible').handlers.change();
assert.equal(get('bookExampleSvg').children.some(x=>x.attributes.class==='book-constraint-overlay'),false,
 'hiding overlay must not clear original drawing shapes');
ui.clear();
assert.equal(get('bookExampleConstraintPanel').hidden,true);
console.log('PASS '+seen+' verified textbook steps with canonical DOF, feasible plane/line/point, condition toggles, SVG clipping and UI state');
