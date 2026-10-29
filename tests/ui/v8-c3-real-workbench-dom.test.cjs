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
  assert.match($('v7-proof').textContent,/独立 M5\/实体布尔射线交叉核验 \d+ 个正长度解析开区间/);
  assert.match($('v7-proof').textContent,/V\/H\/W 均无数学矛盾/);
  assert.match($('v7-proof').textContent,/端点与正式线型仍未签收/);
  assert.match($('v7-proof').textContent,/W 视图内部解析切换点 \d+ 个/);
  assert.match($('v7-proof').textContent,/已独立核验点位严格体积射线 \d+ 个/);
  assert.match($('v7-proof').textContent,/仍未签收曲线端点、投影重合和标准线型/);
  assert.match($('v7-proof').textContent,/W 三维镜像曲线\/实体退出边界联合证明：\d+ 段后方曲线/);
  assert.match($('v7-proof').textContent,/W 相贯曲线全部来源投影重合排查：\d+ 条原始三维解析分支/);
  assert.match($('v7-proof').textContent,/不同符号曲线开区间不会投影重合/);
  assert.match($('v7-proof').textContent,/W 相贯曲线对完整有限实体的正向深度证明：\d+ 个原始来源开区间/);
  assert.match($('v7-proof').textContent,/前侧全局无遮挡、后侧存在严格实体体积遮挡/);
  assert.match($('v7-proof').textContent,/W 视图同轴心闭合临界点：\d+ 个真实三维正则点/);
  assert.match($('v7-proof').textContent,/投影二阶折返点和对完整实体的前方无遮挡/);
  assert.match($('v7-proof').textContent,/闭合端点与国标线型尚未签收/);
  assert.match($('v7-proof').textContent,/严格体积射线恰好到达前方曲线的真实三维来源/);
  assert.match($('v7-proof').textContent,/W 视图真实有限圆柱前方体积退出深度：解析遮挡开单元 \d+ 个/);
  assert.match($('v7-proof').textContent,/解析无体积遮挡开单元 \d+ 个/);
  assert.match($('v7-proof').textContent,/不是已签署工程线型/);
  assert.match($('v7-proof').textContent,/W 全部原始圆柱轮廓线交点：已复查 \d+ 个事件/);
  assert.match($('v7-proof').textContent,/把端盖\/镜像来源开区间进一步分为 \d+ 段/);
  assert.match($('v7-proof').textContent,/闭合接点和全实体可见性未签收/);
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
  // Each exact source-bounded M5 2D open interval can select its ORIGINAL
  // analytic 3D branch; this never signs its GB line style or V5 actions.
  assert.ok(rayCurves.every(x=>
   x.getAttribute('data-geometry-id')?.startsWith('C3Branch3D')&&
   !!x.getAttribute('data-source-feature-key')&&
   x.getAttribute('data-source-feature-selected')==='false'&&
   x.getAttribute('tabindex')==='0'));
  const first=rayCurves[0],key=first.getAttribute('data-source-feature-key'),
   originalId=first.getAttribute('data-geometry-id');
  const samePhysical=[...$('v7-3d').querySelectorAll('[data-source-feature-key]')]
   .filter(x=>x.getAttribute('data-geometry-id')===originalId);
  assert.ok(samePhysical.some(x=>x.getAttribute('data-source-feature-key')===key));
  first.dispatchEvent(new window.Event('click',{bubbles:true}));
  assert.match($('v7-selection').textContent,/空间相贯曲线来源/);
  assert.match($('v7-selection').textContent,/不代表虚实线已认证/);
  assert.equal($('v7-selection').getAttribute('aria-live'),'polite');
  assert.equal($('v7-play').disabled,false);
  assert.ok([...$('v7-3d').querySelectorAll('[data-source-feature-selected="true"]')]
   .some(x=>x.getAttribute('data-geometry-id')===originalId&&
    x.getAttribute('data-source-feature-key')===key));
  assert.ok([...$('v7-sheet').querySelectorAll('[data-c3-open-ray-branch-id]')]
   .filter(x=>x.getAttribute('data-source-feature-key')===key).every(x=>
    x.getAttribute('data-source-feature-selected')==='true'));
  assert.ok([...$('v7-sheet').querySelectorAll('[data-c3-open-ray-branch-id]')]
   .every(x=>x.getAttribute('data-visibility')==='undetermined'&&
    x.getAttribute('stroke-dasharray')==='1 6'));
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
  assert.equal($('v8-c3-axes').checked,false,
   'a changed cylinder radius revokes the previous axis/size declaration');
  assert.equal($('v8-c3-caps').checked,false,
   'a changed cylinder radius revokes the previous finite-solid declaration');
  assert.equal($('v8-review-run').disabled,true,
   'an edited C3 solid cannot be reconfirmed using stale human checkmarks');
  $('v8-c3-axes').checked=true;fire('v8-c3-axes','change');
  assert.equal($('v8-review-run').disabled,true,'cap review is still missing');
  $('v8-c3-caps').checked=true;fire('v8-c3-caps','change');
  assert.equal($('v8-review-run').disabled,false,'only fresh declarations enable C3 solve');
  $('v8-c3-solid-op').value='union';fire('v8-c3-solid-op','change');
  assert.equal($('v8-c3-axes').checked,true,
   'changing selected Boolean operation does not change the underlying cylinder axes');
  assert.equal($('v8-c3-caps').checked,true);
  assert.match($('v8-review-summary').textContent,/并集/);
  $('v7-task').value='projection';fire('v7-task','change');
  await tick();await tick();
  assert.equal($('v7-task').value,'c3-intersection','unsaved C3 edit blocks task switching');
 }finally{
  global.document=prev.document;global.window=prev.window;
  delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
 }
});
