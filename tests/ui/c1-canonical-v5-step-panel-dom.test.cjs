'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createRequire}=require('node:module');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const entry=path.resolve('labs/c1-reviewed-dxf-live-entry.cjs');
const givenPacket=()=>({
 schema:'draftai-c1-authenticated-dxf-reviewed-given/1',
 sourceSha256:'a'.repeat(64),convertedDxfSha256:'b'.repeat(64),
 views:{V:[{u:0,v:0},{u:2,v:2},{u:4,v:7},{u:6,v:5}],
  H:[{u:0,v:0},{u:2,v:1},{u:4,v:3},{u:6,v:6}]},
 givenOriginalHandleEndpoints:{
  V:[0,1,2,3].map(i=>({handle:'V'+i,endpoint:'point'})),
  H:[0,1,2,3].map(i=>({handle:'H'+i,endpoint:'point'}))
 },
 missingView:'W',assumedScope:'all-extreme-vertices-of-one-closed-convex-opaque-solid',
 humanSelectedFullExtremeVertexSet:true,
 originalSourceCompletenessIndependentlyProved:false,
 sourceImageRecognitionVerified:false,
 referenceWasNotExportedAsSolverInput:true,
 sourceIsNotYetConfirmedForProduction:true,textbookBlindSolveAccepted:false
});
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
 // LinkeDOM intentionally exposes select.value as getter-only; model the
 // native writable HTMLSelectElement.value for this real event/DOM test.
 const jump=document.getElementById('v5StepJump');
 Object.defineProperty(jump,'value',{configurable:true,
  get(){return this.__selectedV5Step??
   this.querySelector('option')?.getAttribute('value')??'';},
  set(value){this.__selectedV5Step=String(value);}
 });
 const scene={document,window,require:createRequire(entry),
  URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},
  performance:{now:()=>0},requestAnimationFrame:()=>0,
  cancelAnimationFrame:()=>{},console};
 vm.runInNewContext(
  fs.readFileSync(entry,'utf8')+
  '\n;this.__setCurrent=(r,p)=>{current=r;revision=r.solution.revision;rawGiven=p;given=p;renderOriginalPaper();};'+
  '\n;this.__draw=()=>drawV5();',
  scene,{filename:entry});
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
  // A final SVG exists in the solver result but MUST NEVER enter frame zero.
  threeViewSvgSheet:{sheetSvg:'<svg data-forbidden-final-answer="true"><line x1="1" y1="2" x2="3" y2="4"/></svg>'},
  certifiedPhysicalLineBindings:[],intents:[{id:'point0',source:{
   solver:'real-math',proofScope:'source-3d-point'}},
   {id:'line1',source:{solver:'real-m5',proofScope:'closed-single-convex'}}]
 }},givenPacket());
 scene.__draw();
 assert.equal($('sheetPreview').querySelector('svg').getAttribute('data-c1-paper-mode'),'given');
 assert.equal($('sheetPreview').querySelectorAll('line,path,polyline,polygon').length,0);
 assert.equal($('animation').querySelectorAll('[data-source-point-only]').length,8);
 assert.equal($('animation').querySelectorAll('[data-c1-unanswered-view="W"]').length,1);
 assert.equal($('animation').querySelectorAll('[data-action-id]').length,0);
 assert.equal(document.querySelectorAll('[data-forbidden-final-answer]').length,0);
 // An injected answer-bearing original-paper node must fail closed.
 const malicious=document.createElementNS('http://www.w3.org/2000/svg','line');
 $('sheetPreview').querySelector('svg').append(malicious);
 assert.throws(()=>scene.__draw(),/unmodified original GIVEN paper and blank target/);
 malicious.remove();scene.__draw();
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
 assert.equal($('animation').querySelectorAll('[data-source-point-only]').length,8);
 assert.equal(document.querySelectorAll('[data-forbidden-final-answer]').length,0);
 assert.equal($('v5StepJump').value,'1');
 $('reviewCheck').dispatchEvent(new window.Event('change'));
 assert.equal($('v5StepJump').disabled,true);
 assert.equal($('v5StepActions').children.length,0);
 assert.equal($('animation').children.length,0);
});
