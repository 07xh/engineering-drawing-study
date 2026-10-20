'use strict';
const assert=require('node:assert/strict');
const G=require('../labs/dof-lab-geometry.js'),Visibility=require('../labs/dof-lab-visibility.js'),Sheet=require('../labs/dof-lab-sheet.js');
const views=['V','H','W'];
for(const modelId of ['cuboid','triangular-prism','pyramid']){
 const model=G.preset(modelId),classified=Visibility.analyze(model);
 for(const view of views){
  assert(classified[view].length>0,modelId+' '+view+' must contain edges');
  for(const part of classified[view]){
   assert(['boolean'].includes(typeof part.hidden));
   assert(part.from&&part.to);
   assert(Number.isFinite(part.from.x)&&Number.isFinite(part.from.y));
   assert(Number.isFinite(part.to.x)&&Number.isFinite(part.to.y));
   assert(part.startT>=0&&part.endT<=1&&part.endT>part.startT);
  }
  assert(classified[view].some(e=>!e.hidden),modelId+' '+view+' must have visible edges');
 }
 const markup=Sheet.markup(model,{x:35,y:22,z:51});
 assert(markup.includes('sheet-edge-visible'),modelId);
 assert(markup.includes('class="sheet-miter"'),modelId);
 assert(markup.includes('凸多面体的虚实线'),modelId);
}
const cube=G.preset('cuboid');
for(const view of views){
 const all=Visibility.edgeSegments(cube,view);
 assert(all.some(e=>e.hidden),view+' must have occluded rear edges');
 assert(all.some(e=>!e.hidden),view+' must have visible nearer edges');
 assert.equal(all.length,8,view+' cube has 8 non-view-aligned projected edge segments');
}
const V=Visibility.edgeSegments(cube,'V');
const find=(a,b)=>V.find(e=>e.a===a&&e.b===b);
assert.equal(find('A','B').hidden,false,'front Y=10 edge is visible from negative Y');
assert.equal(find('C','D').hidden,true,'back Y=48 edge is hidden from negative Y');
const H=Visibility.edgeSegments(cube,'H');
assert.equal(H.find(e=>e.a==='E'&&e.b==='F').hidden,false,'top Z=56 edge visible from H');
assert.equal(H.find(e=>e.a==='A'&&e.b==='B').hidden,true,'bottom Z=10 edge hidden from H');
const W=Visibility.edgeSegments(cube,'W');
const pair=(list,a,b)=>list.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a));
assert.equal(pair(W,'A','D').hidden,false,'left X=10 edge visible from W');
assert.equal(W.find(e=>e.a==='B'&&e.b==='C').hidden,true,'right X=65 edge hidden from W');
const html=Sheet.markup(cube,{x:35,y:22,z:51},{showHiddenEdges:true});
assert(html.includes('sheet-edge-hidden'));
assert(html.indexOf('sheet-edge-hidden')<html.indexOf('sheet-edge-visible'),'hidden must be painted before solid outline');
const hiddenOff=Sheet.markup(cube,{x:35,y:22,z:51},{showHiddenEdges:false});
assert(!hiddenOff.includes('sheet-edge-hidden'));
assert(hiddenOff.includes('sheet-edge-visible'));
assert.equal(Visibility.projection({x:1,y:2,z:3},'W').depth,-1);
assert.throws(()=>Visibility.projection({x:1,y:2,z:3},'Q'),/不支持/);
console.log('PASS: three orthographic views classify front/back faces and paint solid above dashed occluded edges');
