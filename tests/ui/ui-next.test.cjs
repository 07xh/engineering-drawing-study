'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {parseHTML}=require('linkedom');
const root=path.resolve(__dirname,'../..');
const buildSource=fs.readFileSync(path.join(root,'scripts/build-static.cjs'),'utf8');
const pages=[...buildSource.split('];',1)[0].matchAll(/'([^']+\.html)'/g)].map(x=>x[1]);
function enhance(page){
 const file=path.join(root,'ui-next/enhance-page.cjs');
 assert.ok(fs.existsSync(file),'build-time UI enhancer must exist');
 const html=fs.readFileSync(path.join(root,page),'utf8');
 return {before:parseHTML(html).document,after:parseHTML(require(file).enhancePage(html,{page})).document};
}
test('all public pages preserve control IDs, values, hidden states and application scripts',()=>{
 for(const page of pages){
  const {before,after}=enhance(page);
  for(const old of before.querySelectorAll('[id]')){
   const matches=[...after.querySelectorAll('[id]')].filter(x=>x.id===old.id);
   assert.equal(matches.length,1,page+' preserves unique '+old.id);
   const next=matches[0];
   assert.equal(next.tagName,old.tagName,page+' element kind '+old.id);
   assert.equal(next.hasAttribute('hidden'),old.hasAttribute('hidden'),page+' hidden '+old.id);
   if(old.matches('input,select,textarea'))assert.equal(next.outerHTML,old.outerHTML,page+' input definition '+old.id);
  }
  for(const script of before.querySelectorAll('script')){
   const candidate=[...after.querySelectorAll('script')].find(x=>script.src?x.getAttribute('src')===script.getAttribute('src'):x.textContent===script.textContent);
   assert.ok(candidate,page+' preserves app script');
   assert.equal(candidate.hasAttribute('defer'),script.hasAttribute('defer'));
  }
  assert.equal(after.querySelectorAll('.next-topbar').length,1,page);
  assert.equal(after.querySelectorAll('.next-sidebar').length,1,page);
  assert.ok(after.querySelector('.next-skip'),page+' skip link');
  assert.ok(after.querySelector('main.next-main'),page+' main landmark');
  assert.equal(after.querySelectorAll('[id]').length,new Set([...after.querySelectorAll('[id]')].map(x=>x.id)).size,page+' all IDs unique');
  for(const a of after.querySelectorAll('.next-topbar a,.next-sidebar a')){
   const href=a.getAttribute('href');
   assert.ok(fs.existsSync(path.resolve(root,path.dirname(page),href.split('#')[0])),page+' route '+href);
  }
 }
});
test('preview has isolated output and default production build remains legacy',()=>{
 assert.match(buildSource,/--ui-preview/);
 assert.match(buildSource,/dist-ui-next/);
 assert.match(buildSource,/if\s*\(uiPreview\)/);
 const {after}=enhance('labs/auto-fillet-live.html');
 assert.equal(after.querySelector('link[href="../ui-next.css"]').getAttribute('rel'),'stylesheet');
 assert.ok(after.querySelector('script[src="../ui-next.js"][defer]'));
});
test('2D workspace groups existing controls into canvas, context and playback without a second solver',()=>{
 const {after}=enhance('labs/auto-fillet-live.html');
 assert.ok(after.querySelector('.next-workspace #paper'));
 for(const id of ['problemPhoto','vectorSvg','kind','fields','branch','direction','travel1','travel2'])
  assert.ok(after.getElementById(id).closest('[data-next-panel="conditions"]'),id+' in conditions');
 for(const id of ['stepList','stepDetail'])assert.ok(after.getElementById(id).closest('[data-next-panel="steps"]'));
 for(const id of ['result','saveVerifiedSvg','saveVerifiedSteps'])assert.ok(after.getElementById(id).closest('[data-next-panel="review"]'));
 for(const id of ['play','prev','next','progress','speed','monochrome'])assert.ok(after.getElementById(id).closest('.next-playback'));
 assert.equal(after.querySelectorAll('[data-next-stage]').length,5);
 assert.ok(after.getElementById('status').closest('.next-status-area'));
 assert.equal(after.querySelectorAll('[data-next-focus]').length,1);
});
test('layout changes preserve entered conditions, validation state and export disablement',()=>{
 const {after:document}=enhance('labs/auto-fillet-live.html');
 const {initUI}=require('../../ui-next/ui-next.js');
 const input=document.getElementById('vectorFilletRadius');input.value='7.125';
 const status=document.getElementById('status');status.textContent='requires-branch';
 const download=document.getElementById('saveVerifiedSvg');download.disabled=true;
 let changed=0;input.addEventListener('change',()=>changed++);input.addEventListener('input',()=>changed++);
 initUI(document);initUI(document);
 const focus=document.querySelector('[data-next-focus]');
 assert.ok(focus,'focus canvas control exists');
 focus.click();assert.ok(document.body.classList.contains('next-focus-canvas'));
 assert.equal(focus.getAttribute('aria-pressed'),'true');
 focus.click();assert.ok(!document.body.classList.contains('next-focus-canvas'));
 const steps=document.querySelector('[data-next-panel-button="steps"]');steps.click();
 assert.equal(document.querySelector('[data-next-panel="steps"]').hidden,false);
 assert.equal(document.querySelector('[data-next-panel="conditions"]').hidden,true);
 document.querySelector('[data-next-panel-button="review"]').click();
 assert.equal(input.value,'7.125');assert.equal(status.textContent,'requires-branch');
 assert.equal(download.disabled,true);assert.equal(changed,0);
});
test('projection and fillet keep learning, drawing and proof controls in the shared workspace',()=>{
 for(const [page,svg,controls] of [
  ['labs/point-projection-live.html','paperSvg',['pairSelect','learningMode','drawControls','hintControls','stepTitle']],
  ['labs/circle-fillet-live.html','diagram',['modeSelect','learningMode','drawControls','hintControls','filletProof','studentMathFeedback']]
 ]){
  const {after}=enhance(page);
  assert.ok(after.getElementById(svg).closest('.next-canvas'),page);
  assert.ok(after.getElementById('fullControls').closest('.next-playback'),page);
  for(const id of controls)assert.ok(after.getElementById(id).closest('.next-context'),page+' '+id);
  assert.ok(after.getElementById('learningMode').closest('[data-next-panel="steps"]'),page);
 }
});
test('start page offers actual solver entries and honest knowledge boundaries',()=>{
 const {after}=enhance('index.html');
 assert.ok(after.querySelector('.next-home-hero'),'new task-oriented home');
 assert.match(after.querySelector('#knowledge').textContent,/题库.*尚未接入/);
 assert.ok(after.querySelector('a[href="labs/auto-fillet-live.html"]'));
 assert.equal(after.querySelectorAll('input[type=file],form').length,0);
 assert.doesNotMatch(after.body.textContent,/已保存 · 示例|题库已接入|任意题图一键解答/);
 for(const page of pages.filter(x=>x.startsWith('labs/')))assert.ok(after.querySelector('a[href="'+page+'"]'),page+' discoverable');
 assert.ok(after.querySelector('[data-next-illustration]'));
});
test('keyboard panel navigation and Escape restore presentation without changing application controls',()=>{
 const {after:document}=enhance('labs/auto-fillet-live.html');
 require('../../ui-next/ui-next.js').initUI(document);
 const tabs=[...document.querySelectorAll('[role=tab]')];
 const event=new document.defaultView.Event('keydown',{bubbles:true,cancelable:true});event.key='ArrowRight';
 tabs[0].dispatchEvent(event);
 assert.equal(tabs[1].getAttribute('aria-selected'),'true');assert.equal(tabs[0].tabIndex,-1);
 document.querySelector('[data-next-focus]').click();
 const escape=new document.defaultView.Event('keydown',{bubbles:true});escape.key='Escape';document.dispatchEvent(escape);
 assert.ok(!document.body.classList.contains('next-focus-canvas'));
});
test('canvas zoom is bounded, reversible and changes presentation only',()=>{
 const {after:document}=enhance('labs/auto-fillet-live.html');
 require('../../ui-next/ui-next.js').initUI(document);
 const canvas=document.querySelector('.next-canvas');
 const increase=document.querySelector('[data-next-zoom="in"]');
 assert.ok(increase,'small screens need a reachable zoom control');
 increase.click();assert.equal(canvas.style.getPropertyValue('--next-zoom'),'1.25');
 for(let i=0;i<20;i++)increase.click();
 assert.equal(canvas.style.getPropertyValue('--next-zoom'),'3');
 assert.equal(document.querySelector('[data-next-zoom="in"]').disabled,true);
 document.querySelector('[data-next-zoom="fit"]').click();
 assert.equal(canvas.style.getPropertyValue('--next-zoom'),'1');
 assert.equal(document.querySelector('[data-next-zoom="out"]').disabled,true);
});
test('recent raster/OCR additions remain discoverable and never bypass review',()=>{
 const {after}=enhance('labs/auto-fillet-live.html');
 for(const id of ['detectOcr','ocrNumericAccept','confirmOcrNumeric','rasterFirst','rasterLineSide','rasterAccept','rasterApply'])
  assert.ok(after.getElementById(id).closest('[data-next-panel=conditions]'),id);
 assert.ok(after.getElementById('rasterDraftPanel').closest('details.next-source-group'),'raster source review gets its own disclosure');
 assert.equal(after.getElementById('rasterLineSide').disabled,true);
 assert.equal(after.getElementById('confirmOcrNumeric').disabled,true);
});
test('explicit playback actions reveal explanations while retaining dedicated canvas focus',()=>{
 for(const page of ['labs/auto-fillet-live.html','labs/point-projection-live.html','labs/circle-fillet-live.html']){
  const {after:document}=enhance(page);
  require('../../ui-next/ui-next.js').initUI(document);
  assert.equal(document.querySelector('[data-next-panel=steps]').hidden,true);
  document.getElementById('next').click();
  assert.equal(document.querySelector('[data-next-panel=steps]').hidden,false,page+' next reveals explanation');
  document.querySelector('[data-next-focus]').click();
  document.getElementById('next').click();
  assert.equal(document.body.classList.contains('next-focus-canvas'),true,page+' does not exit requested canvas focus');
 }
});
