'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('C3 finite cylinder input, user review and canonical local V5 in same page',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const orig=document.createElement.bind(document);
 function adapt(el){
  if(!el||el.nodeType!==1)return el;
  for(const name of ['disabled','checked','hidden'])Object.defineProperty(el,name,{
   configurable:true,get(){return this.hasAttribute(name)},
   set(v){v?this.setAttribute(name,''):this.removeAttribute(name)}
  });
  if(['INPUT','SELECT','OPTION','TEXTAREA'].includes(el.tagName))
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.hasOwn(this,'_c3'))return this._c3;
     if(this.tagName==='SELECT')return (this.querySelector('option[selected]')||
      this.querySelector('option'))?.value||'';
     return this.getAttribute('value')??'';
    },set(v){this._c3=String(v)}
   });
  return el;
 }
 for(const e of document.querySelectorAll('*'))adapt(e);
 Object.defineProperty(document,'createElement',{configurable:true,value:t=>adapt(orig(t))});
 const prev={document:global.document,window:global.window};
 global.document=document;global.window=window;
 global.requestAnimationFrame=cb=>setImmediate(()=>cb(performance.now()));
 global.cancelAnimationFrame=clearImmediate;
 const $=id=>document.getElementById(id);
 const fire=(id,event)=>$(id).dispatchEvent(new window.Event(event,{bubbles:true}));
 try{
  require('../../project/unified-workbench-entry.cjs');
  for(let i=0;i<12&&!$('v7-review').textContent.includes('尚未提交');i++)await tick();
  $('v7-task').value='c3-intersection';fire('v7-task','change');
  for(let i=0;i<7;i++)await tick();
  const fieldset=document.querySelector('fieldset[data-v7-task="c3-intersection"]');
  assert.equal(fieldset.hidden,false);
  assert.equal($('v8-c3-zRadius').value,'','do not invent textbook inputs');
  const data={zRadius:10,zX:0,zY:0,zMin:-12,zMax:12,
   yRadius:6,yX:0,yZ:0,yMin:-12,yMax:12};
  for(const [key,value] of Object.entries(data)){
   $('v8-c3-'+key).value=String(value);fire('v8-c3-'+key,'input');
  }
  $('v8-c3-axes').checked=true;fire('v8-c3-axes','change');
  $('v8-c3-caps').checked=true;fire('v8-c3-caps','change');
  $('v8-c3-solid-op').value='intersection';
  fire('v8-c3-solid-op','change');
  assert.match($('v8-review-summary').textContent,/交集/);
  $('v8-review-ack').checked=true;fire('v8-review-ack','change');
  assert.equal($('v8-review-run').disabled,false);
  fire('v8-review-run','click');
  for(let i=0;i<20;i++)await tick();
  assert.match($('v7-proof').textContent,/C3 真实有限圆柱解析分支/,$('v7-save').textContent);
  assert.match($('v7-proof').textContent,/布尔体积射线区间/);
  assert.match($('v7-proof').textContent,/intersection/);
  assert.match($('v7-proof').textContent,/三视图曲线已绑定严格体积射线的解析开区间/);
  $('v7-guides').checked=true;fire('v7-guides','change');
  assert.equal($('v8-result-status').dataset.state,'partial');
  assert.equal($('v7-play').disabled,false);
  assert.ok($('v7-step-list').querySelector('button'));
  assert.ok($('v7-sheet').querySelector('[data-geometry-id]'));
  const rayCurves=[...$('v7-sheet').querySelectorAll('[data-c3-open-ray-branch-id]')];
  assert.ok(rayCurves.length>=12,'at least four M3 branches in three views');
  assert.equal(new Set(rayCurves.map(x=>x.getAttribute('data-c3-open-ray-view'))).size,3);
  assert.ok(rayCurves.every(x=>x.tagName.toLowerCase()==='path'&&
   x.getAttribute('d').startsWith('M ')&&
   x.getAttribute('stroke-dasharray')==='1 6'&&
   x.getAttribute('data-visibility')==='undetermined'));
  assert.ok(rayCurves.every(x=>
   ['strict-interior-ray-clear','opaque-interior-ahead'].includes(
    x.getAttribute('data-c3-open-ray-class'))));
  // Selecting one original source feature must visibly highlight the same
  // stable key across V/H/W projections, not merely set data attributes.
  const sourceNodes=[...$('v7-sheet').querySelectorAll('[data-source-feature-key]')];
  const groups=new Map();
  for(const node of sourceNodes){
   const key=node.getAttribute('data-source-feature-key');
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(node);
  }
  const linked=[...groups.entries()].find(([,nodes])=>
   new Set(nodes.map(n=>n.getAttribute('data-geometry-view'))).size>=2);
  assert.ok(linked,'one original source feature must exist in multiple projections');
  const [sourceKey,sourceViews]=linked;
  sourceViews[0].dispatchEvent(new window.Event('click',{bubbles:true}));
  await tick();await tick();
  const selectedViews=[...$('v7-sheet').querySelectorAll('[data-source-feature-key]')]
   .filter(n=>n.getAttribute('data-source-feature-key')===sourceKey);
  assert.ok(selectedViews.length>=sourceViews.length);
  assert.ok(selectedViews.every(n=>
   n.getAttribute('data-source-feature-selected')==='true'),
   'the exact source feature selection must propagate to all projected views');
  assert.ok(selectedViews.every(n=>Number(n.getAttribute('stroke-width'))>=3.8),
   'the selected source strokes must be visually emphasized');
  assert.ok([...$('v7-sheet').querySelectorAll('[data-source-feature-key]')]
   .filter(n=>n.getAttribute('data-source-feature-key')!==sourceKey)
   .every(n=>n.getAttribute('data-source-feature-selected')!=='true'),
   'selection must not leak to another source feature');
  $('v7-guides').checked=false;fire('v7-guides','change');await tick();
  assert.equal($('v7-sheet').querySelector('[data-c3-open-ray-branch-id]'),null);
  $('v7-guides').checked=true;fire('v7-guides','change');await tick();
  assert.equal($('v7-sheet').querySelectorAll('[data-c3-open-ray-branch-id]').length,
   rayCurves.length);
  assert.equal($('v8-review-ack').checked,false);
  $('v8-c3-yRadius').value='7';fire('v8-c3-yRadius','input');
  await tick();await tick();
  assert.match($('v7-proof').textContent,/未计算/);
  assert.equal($('v7-sheet').querySelector('[data-c3-open-ray-branch-id]'),null);
  assert.equal($('v7-play').disabled,true);
  assert.equal($('v8-review-run').disabled,true);
  $('v7-task').value='projection';fire('v7-task','change');
  await tick();await tick();
  assert.equal($('v7-task').value,'c3-intersection','unsaved C3 edit blocks task switching');
 }finally{
  global.document=prev.document;global.window=prev.window;
  delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
 }
});
