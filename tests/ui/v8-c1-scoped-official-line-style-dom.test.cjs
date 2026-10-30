'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const {project}=require('../../core/projection/conventions.js');
const {IDS}=require('../../project/c1-reviewed-input.cjs');
const tick=()=>new Promise(r=>setImmediate(r));
test('C1 signed oblique solid: real DOM V5 draws authenticated hidden sources dashed',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const make=document.createElement.bind(document);
 const adapt=el=>{
  if(!el||el.nodeType!==1)return el;
  for(const name of ['disabled','checked','hidden'])
   Object.defineProperty(el,name,{configurable:true,
    get(){return this.hasAttribute(name)},
    set(v){v?this.setAttribute(name,''):this.removeAttribute(name)}});
  if(['INPUT','SELECT','OPTION','TEXTAREA'].includes(el.tagName))
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.hasOwn(this,'_c1'))return this._c1;
     if(this.tagName==='SELECT')return (this.querySelector('option[selected]')||
      this.querySelector('option'))?.value||'';
     return this.getAttribute('value')??'';
    },set(v){this._c1=String(v)}});
  return el;
 };
 for(const el of document.querySelectorAll('*'))adapt(el);
 Object.defineProperty(document,'createElement',{configurable:true,value:t=>adapt(make(t))});
 const old={document:global.document,window:global.window};
 global.document=document;global.window=window;
 global.requestAnimationFrame=cb=>setImmediate(()=>cb(performance.now()));
 global.cancelAnimationFrame=clearImmediate;
 const $=id=>document.getElementById(id);
 const fire=(id,event)=>$(id).dispatchEvent(new window.Event(event,{bubbles:true}));
 const settle=async(n=10)=>{for(let i=0;i<n;i++)await tick()};
 try{
  require('../../project/unified-workbench-entry.cjs');await settle();
  $('v7-task').value='c1-third-view';fire('v7-task','change');await settle();
  const xyz={
   V000:{x:0,y:0,z:0},V100:{x:4,y:1,z:0},
   V110:{x:3,y:4,z:0},V010:{x:-1,y:3,z:0},
   V001:{x:1,y:-1,z:5},V101:{x:5,y:0,z:5},
   V111:{x:4,y:3,z:5},V011:{x:0,y:2,z:5}
  };
  $('v8-c1-vertices').value=IDS.map(id=>{
   const views=project(xyz[id]);
   return [id,views.V.u,views.V.v,views.H.u,views.H.v].join(',');
  }).join('\n');
  fire('v8-c1-vertices','input');
  $('v8-c1-topology').checked=true;fire('v8-c1-topology','change');
  $('v8-review-ack').checked=true;fire('v8-review-ack','change');
  assert.equal($('v8-review-run').disabled,false);
  fire('v8-review-run','click');await settle(18);
  assert.match($('v7-proof').textContent,/当前人工确认的单个闭合凸体三视图来源棱线已全部证明/,$('v7-save').textContent);
  assert.equal($('v8-result-status').dataset.state,'partial',
   'scoped single-convex solution is not textbook OCR blind verified');
  assert.equal($('v7-play').disabled,false);
  // At t=0 the missing W view must be empty, even though the unified
  // Geometry Scene already knows its final 3D geometry. Only GIVEN V/H
  // projections may be rendered; signed V5 strokes start with zero ink.
  assert.ok($('v7-sheet').querySelector('[data-geometry-view="V"]'));
  assert.ok($('v7-sheet').querySelector('[data-geometry-view="H"]'));
  assert.equal($('v7-sheet').querySelector('[data-geometry-view="W"]'),null,
   'C1 final W projection leaked from Scene before V5 construction');
  assert.equal($('v7-sheet').querySelector('[data-v5-scope="signed-convex-source"]'),null);
  $('v7-seek').value='1000';fire('v7-seek','input');await settle();
  const signed=[...$('v7-sheet').querySelectorAll('[data-v5-scope="signed-convex-source"]')];
  assert.ok(signed.length>0,'canonical V5 certified strokes must actually render');
  const hidden=signed.filter(x=>x.getAttribute('data-engineering-line-style')==='certified-hidden');
  const visible=signed.filter(x=>x.getAttribute('data-engineering-line-style')==='certified-visible');
  assert.ok(hidden.length>0,'positive M5 hidden physical creases must render');
  assert.ok(visible.length>0,'visible original hull strokes must render');
  assert.ok(hidden.every(x=>x.getAttribute('stroke-dasharray')==='6 3'));
  assert.ok(visible.every(x=>x.getAttribute('stroke-dasharray')==='none'));
  assert.ok(hidden.every(x=>Number(x.getAttribute('stroke-width'))<3));
  // Real C1 ConstructionStep consumer must draw a physical -45-degree
  // H->W depth transfer, not a horizontal H->M line mislabeled as 45°.
  // This is source-computed per vertex and is not an official edge stroke.
  const guides=[...$('v7-sheet').querySelectorAll(
   'line[data-v5-scope="reviewed-point-guide"]')];
  const diagonal=guides.filter(n=>{
   const dx=Number(n.getAttribute('x2'))-Number(n.getAttribute('x1'));
   const dy=Number(n.getAttribute('y2'))-Number(n.getAttribute('y1'));
   return Math.abs(dx)>1e-8&&Math.abs(dx+dy)<1e-8;
  });
  assert.ok(diagonal.length>0,'C1 point DAG must draw real 45-degree depth guides');
  assert.ok(diagonal.some(n=>
   Number(n.getAttribute('x2'))<Number(n.getAttribute('x1'))),
   'negative model depth must transfer to the left, not mirror W');
  $('v7-seek').value='0';fire('v7-seek','input');await settle();
  assert.equal($('v7-sheet').querySelector('[data-geometry-view="W"]'),null,
   'rewinding must not restore a static answer projection');
  assert.equal($('v7-sheet').querySelector('[data-v5-scope="signed-convex-source"]'),null,
   'rewinding must remove all signed V5 ink');
  // A new form edit invalidates all signed line actions and old source proof.
  $('v8-c1-vertices').value+=' ';
  fire('v8-c1-vertices','input');await settle();
  assert.equal($('v7-play').disabled,true);
  assert.equal($('v7-sheet').querySelector('[data-v5-scope="signed-convex-source"]'),null);
 }finally{
  global.document=old.document;global.window=old.window;
  delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
 }
});
