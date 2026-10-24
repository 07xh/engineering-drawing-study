'use strict';
// Production entry DOM interaction smoke; exercises actual homepage bindings
// with storage intentionally unavailable, not a mocked or duplicate solver.
const test=require('node:test');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('V7 real homepage DOM: stage→human confirm→M3→one V5 and 2D/3D selection',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 // LinkeDOM is intentionally lightweight: emulate standard browser form setters
 // so this tests the actual production event bindings, not its DOM omissions.
 const nativeCreate=document.createElement.bind(document);
 const adapt=el=>{
  if(!el||el.nodeType!==1)return el;
  for(const name of ['disabled','hidden','checked']){
   Object.defineProperty(el,name,{configurable:true,
    get(){return this.hasAttribute(name);},
    set(v){if(v)this.setAttribute(name,'');else this.removeAttribute(name);}});
  }
  if(['INPUT','SELECT','OPTION','TEXTAREA'].includes(el.tagName)){
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.hasOwn(this,'__v7Value'))return this.__v7Value;
     if(this.tagName==='SELECT'){
      const option=this.querySelector('option[selected]')||this.querySelector('option');
      return option?option.value:'';
     }
     return this.getAttribute('value')??'';
    },
    set(v){this.__v7Value=String(v);}});
  }
  return el;
 };
 for(const el of document.querySelectorAll('*'))adapt(el);
 Object.defineProperty(document,'createElement',{configurable:true,
  value:tag=>adapt(nativeCreate(tag))});
 const original={document:global.document,window:global.window};
 global.document=document;global.window=window;
 global.requestAnimationFrame=cb=>setImmediate(()=>cb(performance.now()));
 global.cancelAnimationFrame=clearImmediate;
 const $=id=>document.getElementById(id);
 const click=id=>$(id).dispatchEvent(new window.Event('click',{bubbles:true}));
 try{
  require('../../project/unified-workbench-entry.cjs');
  for(let i=0;i<12&&!$('v7-review').textContent.includes('尚未提交');i++)await tick();
  assert.match($('v7-review').textContent,/尚未提交/, $('v7-save').textContent);
  assert.match(document.querySelector('#recent .next-home-empty-title').textContent,/本机存储暂不可用/);
  assert.equal(document.querySelector('#recent .next-home-continue-button').getAttribute('href'),'#project-workbench');
  for(const id of ['v7-cal-px1','v7-cal-mm1','v7-cal-px2','v7-cal-mm2',
    'v7-cal-rotation','v7-cal-apply','v7-cal-clear','v7-cal-status'])
    assert.ok($(id),'missing calibration control '+id);
  click('v7-cal-apply');await tick();await tick();
  assert.match($('v7-save').textContent,/请先保存原始图片/,
    'image-free measurements cannot be misrepresented as reviewed source');
  for(const id of ['v7-photo-box','v7-photo-marks','v7-photo-segment',
    'v7-photo-clear','v7-photo-point-status'])assert.ok($(id));
  assert.ok($('v7-photo-box').hidden);
  click('v7-photo-clear');await tick();
  assert.match($('v7-photo-point-status').textContent,/0\/2 个端点/);
  for(const id of ['v7-candidate-id','v7-candidate-stage',
    'v7-source-link','v7-candidate-accept','v7-candidate-reject',
    'v7-candidate-locate','v7-candidate-status'])
    assert.ok($(id),'source-to-ProblemDraft UI missing '+id);
  click('v7-candidate-stage');await tick();await tick();
  assert.match($('v7-save').textContent,/已保存的本机原图/,
   'without a stored image a photo candidate must fail closed');
  assert.equal($('v7-source-link').querySelectorAll('option').length,1);
  assert.match($('v7-proof').textContent,/未计算/);
  click('v7-solve');await tick();await tick();
  assert.match($('v7-proof').textContent,/未计算/,'unconfirmed click cannot forge a result');
  click('v7-stage');await tick();await tick();
  assert.match($('v7-review').textContent,/待确认/);
  assert.match($('v7-proof').textContent,/未计算/);
  click('v7-confirm');await tick();await tick();
  assert.match($('v7-review').textContent,/已人工确认/);
  click('v7-solve');await tick();await tick();
  assert.match($('v7-proof').textContent,/M3.*ConstructionIntent.*V5/);
  assert.ok($('v7-step-list').querySelector('button'));
  assert.ok($('v7-sheet').querySelector('circle'));
  // Move the exact V5 clock to completion: reveal mathematically derived W.
  $('v7-seek').value='1000';
  $('v7-seek').dispatchEvent(new window.Event('input',{bubbles:true}));
  const w=$('v7-sheet').querySelector('[aria-label="选择 W 投影点"]');
  assert.ok(w,'third projection comes from verified solver geometry');
  assert.equal(w.getAttribute('data-geometry-id'),'Point1');
  assert.equal(w.getAttribute('data-geometry-view'),'W');
  w.dispatchEvent(new window.Event('click',{bubbles:true}));
  assert.match($('v7-selection').textContent,/Point1/);
  assert.equal($('v7-3d').querySelectorAll('circle').length,1);
  $('v7-yaw').value='40';
  $('v7-yaw').dispatchEvent(new window.Event('input',{bubbles:true}));
  assert.match($('v7-selection').textContent,/Point1/);
  // A changed condition is a candidate again; V5 may not continue.
  $('v7-x').value='23';
  click('v7-stage');await tick();await tick();
  assert.match($('v7-proof').textContent,/未计算/);
  assert.equal($('v7-step-list').querySelectorAll('button').length,0);
  // Same page, same project: change task, re-confirm, reuse canonical V5.
  $('v7-task').value='planar';
  $('v7-task').dispatchEvent(new window.Event('change',{bubbles:true}));
  await tick();await tick();
  assert.equal(document.querySelector('fieldset[data-v7-task=planar]').hidden,false);
  click('v7-stage-other');await tick();await tick();
  assert.match($('v7-review').textContent,/待确认/);
  click('v7-confirm-other');await tick();await tick();
  click('v7-solve-other');await tick();await tick();
  assert.match($('v7-proof').textContent,/已验证的二维圆弧连接/,$('v7-save').textContent);
  assert.ok($('v7-step-list').querySelector('button'));
  $('v7-seek').value='1000';
  $('v7-seek').dispatchEvent(new window.Event('input',{bubbles:true}));
  assert.ok($('v7-sheet').querySelector('path[aria-label="选择已验证圆弧 Fillet1"]'));
  assert.ok($('v7-sheet').querySelector('[data-geometry-id="Given1"]'),
   'given segment must come from same multi-object Geometry Scene');
  assert.ok($('v7-sheet').querySelector('[data-geometry-id="Given2"]'));
  assert.equal($('v7-sheet').querySelector('[data-geometry-id="Fillet1"]')
   .getAttribute('data-geometry-view'),'drawing');
  const sourceLine=$('v7-sheet').querySelector('[data-geometry-id="Given1"]');
  sourceLine.dispatchEvent(new window.Event('click',{bubbles:true}));
  assert.match($('v7-selection').textContent,/Given1/);
  assert.ok($('v7-step-list').querySelector('button'));
  assert.equal($('v7-3d').hidden,false,'spatial panel may be hidden as a group');
  // New spatial task revokes the verified planar timeline, but can use the
  // parity-audited scoped ConstructionStep preview on the same V5 controls.
  $('v7-task').value='exploration';
  $('v7-task').dispatchEvent(new window.Event('change',{bubbles:true}));
  await tick();await tick();
  assert.match($('v7-proof').textContent,/未计算/);
  click('v7-stage-other');await tick();await tick();
  click('v7-confirm-other');await tick();await tick();
  click('v7-solve-other');await tick();await tick();
  assert.match($('v7-proof').textContent,/限定证据/,$('v7-save').textContent);
  assert.ok($('v7-step-list').querySelectorAll('button').length>0);
  assert.equal($('v7-play').disabled,false,'scoped V5 preview can play');
  assert.equal($('v7-sheet').getAttribute('viewBox'),'0 0 960 680');
  assert.equal($('v7-sheet').querySelectorAll('[data-geometry-id="Section1"]').length,0,
   'computed section awaits the actual V5 step clock');
  $('v7-seek').value='1000';
  $('v7-seek').dispatchEvent(new window.Event('input',{bubbles:true}));
  assert.ok($('v7-sheet').querySelector('[aria-label="选择 Solid1 的 V 表达"]'));
  assert.ok($('v7-3d').querySelector('[aria-label="选择 Solid1 的 3D 表达"]'));
  assert.equal($('v7-sheet').querySelectorAll('[data-geometry-id="Solid1"][data-geometry-view="V"]').length,12);
  assert.equal($('v7-3d').querySelectorAll('[data-geometry-id="Solid1"][data-visibility="undetermined"]').length,12);
  assert.equal($('v7-sheet').querySelectorAll('[data-geometry-id="Solid1"][data-visibility="undetermined"]').length,36);
  const section3D=$('v7-3d').querySelectorAll('[data-geometry-id="Section1"]');
  const sectionSheet=$('v7-sheet').querySelectorAll('[data-geometry-id="Section1"]');
  const sectionV=$('v7-sheet').querySelector('[data-geometry-id="Section1"][data-geometry-view="V"]');
  assert.ok(sectionV,'audited intersection is in shared V/H/W scene');
  sectionV.dispatchEvent(new window.Event('click',{bubbles:true}));
  assert.match($('v7-selection').textContent,/Section1/);
  const selectedV=$('v7-sheet').querySelector('[data-geometry-id="Section1"][data-geometry-view="V"]');
  const selectedW=$('v7-sheet').querySelector('[data-geometry-id="Section1"][data-geometry-view="W"]');
  assert.ok(selectedV&&selectedW,'both views must redraw after selecting the M3 object');
  assert.equal(selectedV.getAttribute('stroke'),'#ef6730','V must be selected');
  assert.equal(selectedW.getAttribute('stroke'),selectedV.getAttribute('stroke'),
    'the same Geometry ID must be highlighted in W without math recalculation');
  assert.ok(section3D.length>=3&&section3D.length<=6,
   'actual M3 verified section polygon is visible as bounded straight edges');
  assert.equal(sectionSheet.length,section3D.length*3,
   'one spatial section projects into all three first-angle views');
  assert.ok([...section3D,...sectionSheet].every(el=>
   el.getAttribute('data-visibility')==='undetermined'),
   'limited specialist proof never certifies hidden-line styles');
  assert.equal($('v7-play').disabled,false,
   'a scoped math geometry preview is not a fully verified engineering answer');
  assert.match($('v7-proof').textContent,/不能导出已验证答案/);
  $('v7-guides').checked=false;
  $('v7-guides').dispatchEvent(new window.Event('change',{bubbles:true}));
  assert.ok($('v7-sheet').querySelectorAll('[data-geometry-id="Section1"]').length>0,
   'turning off guides does not erase known result segments');
  $('v7-guides').checked=true;
  $('v7-guides').dispatchEvent(new window.Event('change',{bubbles:true}));
  // Same original homepage, one local project, two independently confirmed
  // manual geometry inputs and NO implied solved math or V5 entitlement.
  $('v7-task').value='composition';
  $('v7-task').dispatchEvent(new window.Event('change',{bubbles:true}));
  await tick();await tick();
  assert.equal(document.querySelector('fieldset[data-v7-task=composition]').hidden,false);
  $('v7-c-id').value='PointA';$('v7-c-kind').value='point3d';
  click('v7-c-stage');await tick();await tick();
  click('v7-c-confirm');await tick();await tick();
  click('v7-c-new');await tick();
  $('v7-c-id').value='CircleB';$('v7-c-kind').value='circle';
  click('v7-c-stage');await tick();await tick();
  click('v7-c-confirm');await tick();await tick();
  click('v7-c-render');await tick();await tick();
  assert.match($('v7-proof').textContent,/手工输入的几何/,$('v7-save').textContent);
  assert.equal($('v7-step-list').querySelectorAll('button').length,0);
  assert.equal($('v7-play').disabled,true);
  assert.equal($('v7-sheet').querySelectorAll('[data-geometry-id="PointA"]').length,3);
  assert.ok($('v7-sheet').querySelector('[data-geometry-id="CircleB"]'));
  assert.equal($('v7-3d').querySelectorAll('[data-geometry-id="PointA"]').length,1);
  $('v7-c-radius').value='12';
  $('v7-c-radius').dispatchEvent(new window.Event('input',{bubbles:true}));
  await tick();await tick();
  assert.match($('v7-proof').textContent,/未计算/);
  assert.equal($('v7-sheet').querySelectorAll('[data-geometry-id="CircleB"]').length,0);
  // Reuse the same project editor for ordered 2D and 3D curves, not a new page.
  click('v7-c-remove');await tick();await tick();
  click('v7-c-new');$('v7-c-id').value='Curve2';
  $('v7-c-kind').value='polyline2d';
  $('v7-c-points').value='0,0\n10,0\n10,10';
  $('v7-c-closed').checked=false;
  click('v7-c-stage');await tick();await tick();
  click('v7-c-confirm');await tick();await tick();
  click('v7-c-new');$('v7-c-id').value='Curve3';
  $('v7-c-kind').value='polyline3d';
  $('v7-c-points').value='0,0,0\n10,0,0\n10,10,6';
  $('v7-c-closed').checked=true;
  click('v7-c-stage');await tick();await tick();
  click('v7-c-confirm');await tick();await tick();
  click('v7-c-render');await tick();await tick();
  assert.match($('v7-proof').textContent,/手工输入的几何/,$('v7-save').textContent);
  assert.equal($('v7-sheet').querySelectorAll('[data-geometry-id="Curve2"]').length,2);
  assert.equal($('v7-sheet').querySelectorAll('[data-geometry-id="Curve3"]').length,9);
  assert.equal($('v7-3d').querySelectorAll('[data-geometry-id="Curve3"]').length,3);
  assert.equal($('v7-step-list').querySelectorAll('button').length,0);
  assert.equal($('v7-play').disabled,true);
  // A new relation across two confirmed points reuses the same existing
  // project, revision and scene; M2 reports only source consistency.
  for(const [id,x,y] of [['PointR1','0','0'],['PointR2','3','4']]){
   click('v7-c-new');$('v7-c-id').value=id;
   $('v7-c-kind').value='point2d';
   $('v7-c-ax').value=x;$('v7-c-ay').value=y;
   click('v7-c-stage');await tick();await tick();
   click('v7-c-confirm');await tick();await tick();
  }
  for(const id of ['v7-r-id','v7-r-list','v7-r-a','v7-r-b',
   'v7-r-kind','v7-r-distance','v7-r-stage','v7-r-confirm',
   'v7-r-remove','v7-r-status'])assert.ok($(id),id);
  $('v7-r-id').value='DistancePQ';$('v7-r-kind').value='distance';
  $('v7-r-a').value='PointR1';$('v7-r-b').value='PointR2';
  $('v7-r-distance').value='5';
  click('v7-r-stage');await tick();await tick();
  click('v7-c-render');await tick();await tick();
  assert.match($('v7-save').textContent,/待人工确认/,
    'pending relation cannot become verified residual evidence');
  click('v7-r-confirm');await tick();await tick();
  click('v7-c-render');await tick();await tick();
  assert.match($('v7-proof').textContent,/M2 关系一致性：consistent/);
  assert.equal($('v7-play').disabled,true);
  $('v7-r-distance').value='8';
  $('v7-r-distance').dispatchEvent(new window.Event('input',{bubbles:true}));
  await tick();await tick();
  assert.match($('v7-proof').textContent,/未计算/);
  assert.equal($('v7-step-list').querySelectorAll('button').length,0);
  click('v7-r-stage');await tick();await tick();
  click('v7-r-confirm');await tick();await tick();
  click('v7-c-render');await tick();await tick();
  assert.match($('v7-proof').textContent,/M2 关系一致性：inconsistent/);
  assert.equal($('v7-play').disabled,true);


 }finally{
  global.document=original.document;global.window=original.window;
  delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
 }
});
