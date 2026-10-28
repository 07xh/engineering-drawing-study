'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const tick=()=>new Promise(r=>setImmediate(r));
test('C2 visible generated face intersection previews carry true 3D source, never official V5',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const create=document.createElement.bind(document);
 function adapt(el){
  if(!el||el.nodeType!==1)return el;
  for(const name of ['hidden','disabled','checked'])Object.defineProperty(el,name,{
   configurable:true,get(){return this.hasAttribute(name)},
   set(v){v?this.setAttribute(name,''):this.removeAttribute(name)}});
  if(['INPUT','SELECT','OPTION','TEXTAREA'].includes(el.tagName))
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.hasOwn(this,'_testVal'))return this._testVal;
     if(this.tagName==='SELECT')return (this.querySelector('option[selected]')||
      this.querySelector('option'))?.value||'';
     return this.getAttribute('value')??'';
    },set(v){this._testVal=String(v)}});
  return el;
 }
 for(const el of document.querySelectorAll('*'))adapt(el);
 Object.defineProperty(document,'createElement',{configurable:true,value:t=>adapt(create(t))});
 const old={document:global.document,window:global.window};
 global.document=document;global.window=window;
 global.requestAnimationFrame=cb=>setImmediate(()=>cb(performance.now()));
 global.cancelAnimationFrame=clearImmediate;
 const $=id=>document.getElementById(id);
 const fire=(id,type)=>$(id).dispatchEvent(new window.Event(type,{bubbles:true}));
 const settle=async(n=10)=>{for(let i=0;i<n;i++)await tick()};
 const all=()=>[...$('v7-sheet').querySelectorAll('[data-c2-generated-source-id]')];
 const rays=()=>[...$('v7-sheet').querySelectorAll('[data-c2-m5-paper-line-id]')];
 const loops=()=>[...$('v7-sheet').querySelectorAll('[data-c2-region-boundary-id]')];
 const gaps=()=>[...$('v7-sheet').querySelectorAll('[data-c2-region-m5-gap-piece]')];
 const supported=()=>[...$('v7-sheet').querySelectorAll('[data-c2-region-m5-ray-piece]')];
 try{
  require('../../project/unified-workbench-entry.cjs');await settle();
  $('v7-task').value='composition';fire('v7-task','change');await settle();
  for(const [letter,values] of Object.entries({
   a:[0,0,0,10,10,10],b:[5,5,5,15,15,15]
  })){
   ['x0','y0','z0','x1','y1','z1'].forEach((p,i)=>{
    const id='v8-c2-'+letter+'-'+p;
    $(id).value=String(values[i]);fire(id,'input');
   });
  }
  $('v8-c2-ack').checked=true;fire('v8-c2-ack','change');
  assert.equal($('v8-c2-build').disabled,false);
  fire('v8-c2-build','click');await settle(20);
  assert.match($('v7-proof').textContent,/两原始面交汇生成新棱 6 段/,$('v7-save').textContent);
  assert.match($('v7-proof').textContent,/三维来源端点/);
  assert.match($('v7-proof').textContent,/精确八象限局部端点签收/);
  assert.match($('v7-proof').textContent,/V\/H\/W 投影区域精确边界/);
  assert.match($('v7-proof').textContent,/简单闭合回路 3 个/);
  assert.match($('v7-proof').textContent,/独立 M0–M5 全局纸面来源线段/);
  assert.match($('v7-proof').textContent,/闭合投影边界中已有完整三维物理来源覆盖/);
  assert.match($('v7-proof').textContent,/来源与局部无遮挡\/遮挡射线同时得到核对的/);
  assert.match($('v7-proof').textContent,/来源缺口/);
  assert.match($('v7-proof').textContent,/精确未证明子段/);
  assert.match($('v7-proof').textContent,/蓝\/橙\/灰点线仅为局部射线证据/);
  assert.equal($('v7-play').disabled,true,'only V5 can sign official strokes');
  $('v7-guides').checked=true;fire('v7-guides','change');await settle();
  const strokes=all(),region=loops(),rayShapes=rays(),positive=supported();
  const missing=gaps();
  assert.ok(missing.length>0,'real exact unproven source subspans must be drawn');
  assert.ok(missing.every(x=>
   x.getAttribute('stroke-dasharray')==='1 4 1 8'&&
   x.getAttribute('data-visibility')==='undetermined'&&
   x.getAttribute('data-c2-geometry-status')===
     'original-or-generated-3d-source-or-ray-unproven'&&
   !!x.getAttribute('data-c2-region-m5-gap-reason')));
  assert.ok(positive.length>0,'3D matched proven boundary subspans');
  assert.ok(positive.every(x=>
   x.getAttribute('stroke-dasharray')==='2 5'&&
   x.getAttribute('data-visibility')==='undetermined'&&
   x.getAttribute('data-c2-geometry-status')===
    'source-key-matched-open-ray-only'));
  assert.ok(region.every(x=>
   ['true','false'].includes(x.getAttribute('data-c2-region-m5-local-ray-full'))));
  assert.ok(rayShapes.length>0,'original and generated paper M5 candidates');
  assert.ok(rayShapes.every(x=>
   x.getAttribute('stroke-dasharray')==='1 7'&&
   x.getAttribute('data-visibility')==='undetermined'&&
   x.getAttribute('data-c2-geometry-status')===
    'all-opaque-open-ray-only-not-official-style'));
  assert.equal(new Set(rayShapes.map(x=>
   x.getAttribute('data-c2-m5-paper-view'))).size,3);
  assert.ok(region.length>0,'all real first-angle projected occupancy boundaries');
  assert.equal(new Set(region.map(x=>
   x.getAttribute('data-c2-region-view'))).size,3);
  assert.ok(region.every(x=>
   x.getAttribute('data-c2-geometry-status')==='exact-2d-occupancy-only'&&
   x.getAttribute('data-visibility')==='undetermined'&&
   x.getAttribute('stroke-dasharray')==='8 3 2 3'));
  assert.ok(region.every(x=>[
   'full-original-or-generated-3d-physical-source','3d-source-interval-gap'
  ].includes(x.getAttribute('data-c2-region-source-coverage'))));
  assert.ok(region.filter(x=>
   x.getAttribute('data-c2-region-source-coverage')===
    'full-original-or-generated-3d-physical-source').every(x=>
     x.getAttribute('data-c2-region-source-classes')!==''));
  const sourceBoundKeys=new Set(region.map(x=>
   x.getAttribute('data-c2-region-view')+':'+
   x.getAttribute('data-c2-region-boundary-id')));
  assert.equal(sourceBoundKeys.size,region.length);
  assert.equal(strokes.length,12,
   'six real 3D generated lines have two non-collapsed views each');
  assert.equal(new Set(strokes.map(x=>x.getAttribute('data-c2-generated-source-id'))).size,6);
  assert.ok(strokes.every(x=>x.getAttribute('stroke-dasharray')==='2 6'));
  assert.ok(strokes.every(x=>x.getAttribute('data-visibility')==='undetermined'));
  assert.ok(strokes.every(x=>
   x.getAttribute('data-c2-geometry-status')==='boolean-feature-preview-only'));
  $('v7-guides').checked=false;fire('v7-guides','change');await settle();
  assert.equal(all().length,0,'source candidate overlays are user-controlled');
  assert.equal(loops().length,0,'2D region loops are not official model strokes');
  assert.equal(rays().length,0,'source M5 candidates must respect guide toggle');
  assert.equal(gaps().length,0,'unproven exact M5 gaps must respect guide toggle');
  assert.equal(supported().length,0,'boundary-ray joint proof must respect guide toggle');
  $('v7-guides').checked=true;fire('v7-guides','change');await settle();
  assert.equal(all().length,12);
  assert.equal(loops().length,region.length);
  assert.equal(rays().length,rayShapes.length);
  assert.equal(supported().length,positive.length);
  assert.equal(gaps().length,missing.length);
  // An edited unsaved input can never keep the previous math/overlay.
  $('v8-c2-b-x0').value='7';fire('v8-c2-b-x0','input');await settle();
  assert.equal(all().length,0);
  assert.equal(loops().length,0);
  assert.equal(rays().length,0);
  assert.equal(supported().length,0);
  assert.equal(gaps().length,0);
  assert.equal($('v7-play').disabled,true);
  assert.match($('v7-proof').textContent,/未计算/);
  assert.equal($('v8-c2-build').disabled,true);
 }finally{
  global.document=old.document;global.window=old.window;
  delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
 }
});
