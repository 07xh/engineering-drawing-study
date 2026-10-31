'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createRequire}=require('node:module');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const entry=path.resolve('labs/c1-reviewed-dxf-live-entry.cjs');
test('real C1 browser DOM shows sole V5 step, signed source and action-aligned navigation, then invalidates',()=>{
 const {document,window}=parseHTML(
  fs.readFileSync('labs/c1-reviewed-dxf-live.html','utf8'));
 for(const el of document.querySelectorAll('input,button,select')){
  for(const prop of ['disabled','checked','hidden']){
   Object.defineProperty(el,prop,{configurable:true,
    get(){return this.hasAttribute(prop);},
    set(value){value?this.setAttribute(prop,''):this.removeAttribute(prop);}
   });
  }
 }
 const scene=vm.runInNewContext(
  fs.readFileSync(entry,'utf8')+
  '\n;this.__setCurrent=(r)=>{current=r;revision=r.solution.revision;};'+
  '\n;this.__draw=()=>drawV5();',
  {document,window,require:createRequire(entry),
   URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},
   performance:{now:()=>0},requestAnimationFrame:()=>0,
   cancelAnimationFrame:()=>{},console},{filename:entry});
 const $=id=>document.getElementById(id);
 assert.equal($('v5StepJump').disabled,true);
 assert.equal($('v5StepActions').children.length,0);
 const visible='gb-t-4457.4-continuous-wide-visible-outline';
 const steps=[
  {id:'point0',dependsOn:[],title:'从 GIVEN 投影求第一个点',
   explanation:'同一原始三维点的两面投影约束已核对。',
   actions:[{id:'point_a',kind:'point',geometry:{center:{x:5,y:8},radius:4}}]},
  {id:'line1',dependsOn:['point0'],title:'原始实体棱线 W 视图',
   explanation:'从同源三维端点和 M5 正向证明取得。',
   actions:[{id:'edge_a',kind:'line',geometry:{
    from:{x:5,y:8},to:{x:45,y:48}}}]}
 ];
 const timeline=Timeline.compileTimeline(steps);
 const player=Timeline.createPlayer(timeline,{revision:8});
 scene.__setCurrent({solution:{revision:8,singleOriginalV5Player:true,steps,timeline,player,
  certifiedVisibleContourLineBindings:[{actionId:'edge_a',revision:8,
   sourceEdgeId:'Real::A|D',view:'W',standardLineStyle:visible,
   signedFormalLineV5:true}],
  certifiedPhysicalLineBindings:[],intents:[{id:'point0',source:{
   solver:'real-math',proofScope:'source-3d-point'}},
   {id:'line1',source:{solver:'real-m5',proofScope:'closed-single-convex'}}]
 }});
 scene.__draw();
 assert.equal($('v5StepJump').disabled,false);
 assert.match($('v5StepTitle').textContent,/第 1 \/ 2 步/);
 assert.equal($('v5StepExplanation').textContent,steps[0].explanation);
 assert.equal($('v5StepActions').querySelectorAll('[data-proof="signed"]').length,0);
 $('v5StepJump').value='1';
 $('v5StepJump').dispatchEvent(new window.Event('change'));
 assert.match($('v5StepTitle').textContent,/第 2 \/ 2 步/);
 assert.match($('v5StepActions').textContent,/Real::A\|D/);
 assert.match($('v5StepActions').textContent,/已签收 可见粗实线/);
 // Draw a non-zero part of the genuine source-bound action, not a copied
 // SVG or a fabricated duration/step list.
 player.seekMs(timeline.steps[1].startMs+200,0);
 scene.__draw();
 const line=$('animation').querySelector('[data-action-id="edge_a"]');
 assert.ok(line);
 assert.equal(line.getAttribute('data-official-line-style'),'visible');
 assert.equal(line.getAttribute('data-original-source-id'),'Real::A|D');
 assert.equal($('v5StepJump').value,'1');
 $('reviewCheck').dispatchEvent(new window.Event('change'));
 assert.equal($('v5StepJump').disabled,true);
 assert.equal($('v5StepActions').children.length,0);
 assert.equal($('animation').children.length,0);
});
