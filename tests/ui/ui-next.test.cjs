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
  assert.equal(after.querySelectorAll('.next-task-nav').length,1,page);
  assert.ok(after.querySelector('.next-skip'),page+' skip link');
  assert.ok(after.querySelector('main.next-main'),page+' main landmark');
  assert.equal(after.querySelectorAll('[id]').length,new Set([...after.querySelectorAll('[id]')].map(x=>x.id)).size,page+' all IDs unique');
  for(const a of after.querySelectorAll('.next-topbar a,.next-sidebar a')){
   const href=a.getAttribute('href');
   assert.ok(fs.existsSync(path.resolve(root,path.dirname(page),href.split('#')[0])),page+' route '+href);
  }
 }
});
test('preview has isolated output and production uses the same unified UI',()=>{
 assert.match(buildSource,/--ui-preview/);
 assert.match(buildSource,/dist-ui-next/);
 assert.match(buildSource,/if\s*\(uiPreview \|\| uiRelease\)/);
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
  for(const id of controls)assert.ok(after.getElementById(id).closest(['drawControls','studentMathFeedback'].includes(id)?'.next-canvas':'.next-context'),page+' '+id);
  assert.ok(after.getElementById('learningMode').closest('[data-next-panel="steps"]'),page);
 }
});

test('homepage puts the existing solver first and lists real tools',()=>{
 const {after:document}=enhance('index.html');
 assert.ok(document.querySelector('#project-workbench #v7-sheet'));
 assert.ok(document.querySelector('#project-workbench #v7-projects'));
 assert.ok(document.querySelector('#project-workbench #v7-confirm'));
 assert.ok(document.querySelector('#project-workbench #v7-solve'));
 assert.equal(document.querySelectorAll('form').length,0);
 for(const page of pages.filter(x=>x.startsWith('labs/')))assert.ok(document.querySelector('a[href="'+page+'"]'),page+' discoverable');
 assert.doesNotMatch(document.body.textContent,/题库已接入|任意题图一键解答/);
 const categories=[...document.querySelectorAll('.next-home-category-grid>a')];
 assert.deepEqual(categories.map(x=>x.querySelector('strong').textContent.trim()),['平面作图','三视图与投影','截交与相贯','组合体作图']);
 for(const id of ['plane','projection','section','recent','knowledge','tools'])assert.ok(document.getElementById(id),'no dead anchor '+id);
});

test('V6.2 preserves full-size drawing and source contracts in seven workbenches',()=>{
 const cases=[
  ['labs/auto-fillet-live.html','paper','play'],
  ['labs/point-projection-live.html','paperSvg','next'],
  ['labs/circle-fillet-live.html','diagram','next'],
  ['labs/cone-cut-live.html','coneSvg','conePlay'],
  ['labs/cylinder-cut-live.html','board','play'],
  ['labs/prism-cut-live.html','board','play'],
  ['labs/polygon-live.html','polygonSvg','polygonPlay']
 ];
 for(const [page,figure,play] of cases){
  const {after}=enhance(page),layout=after.querySelector('.next-workspace');
  assert.ok(layout,page+' must use single drawing-first layout');
  assert.equal(layout.getAttribute('data-next-side'),'none',page+' conditions should not consume drawing space initially');
  assert.ok(after.getElementById(figure).closest('.next-canvas'),page+' drawing stays first');
  assert.ok(after.getElementById(play).closest('.next-playback'),page+' playback is immediately below paper');
  assert.ok(after.querySelector('[data-next-open-panel="conditions"]'),page+' conditions remain discoverable');
  assert.ok(after.querySelector('[data-next-open-panel="steps"]'),page+' steps remain discoverable');
  assert.ok(after.querySelector('[data-next-close-panel]'),page+' panels must be closable');
  assert.ok(after.querySelector('[data-next-panel="conditions"]'),page+' actual conditions preserved');
  assert.ok(after.querySelector('[data-next-panel="steps"]'),page+' step list preserved');
 }
});
test('V6.2 changing panels does not overwrite values or break mobile-friendly drawing state',()=>{
 const {after:document}=enhance('labs/auto-fillet-live.html');
 const control=document.getElementById('vectorFilletRadius');
 const before=control.value;
 const solver=document.getElementById('play');
 solver.disabled=true;
 require('../../ui-next/ui-next.js').initUI(document);
 const layout=document.querySelector('.next-workspace');
 assert.equal(layout.dataset.nextSide,'none');
 document.querySelector('[data-next-open-panel="conditions"]').click();
 assert.equal(layout.dataset.nextSide,'conditions');
 assert.equal(document.querySelector('[data-next-open-panel="conditions"]').getAttribute('aria-expanded'),'true');
 assert.equal(document.querySelector('[data-next-panel="conditions"]').hidden,false);
 document.querySelector('[data-next-open-panel="steps"]').click();
 assert.equal(layout.dataset.nextSide,'steps');
 assert.equal(document.querySelector('[data-next-panel="conditions"]').hidden,true);
 document.querySelector('[data-next-close-panel]').click();
 assert.equal(layout.dataset.nextSide,'none');
 assert.equal(document.querySelector('[data-next-open-panel="steps"]').getAttribute('aria-expanded'),'false');
 assert.equal(control.value,before);
 assert.equal(solver.disabled,true,'layout must not bypass disabled solver/playback controls');
});
test('V6.2 CSS keeps the paper large while preserving its aspect ratio and safe zoom',()=>{
 const css=fs.readFileSync(path.join(root,'ui-next/ui-next.css'),'utf8');
 assert.match(css,/V6\.2: final drawing-first layout/);
 assert.match(css,/data-next-side="none"/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/object-fit:contain/);
 assert.match(css,/max-height:min\(73dvh,780px\)/);
 assert.match(css,/width:calc\(100% \* var\(--next-zoom,1\)\)/);
 assert.match(css,/@media\(max-width:850px\)/);
});


test('V6.2 home groups all accessible tools without large empty My Problems block',()=>{
 const {after:document}=enhance('index.html');
 const groups=[...document.querySelectorAll('.next-home-tool-group')];
 assert.equal(groups.length,3,'core geometry, projections, auxiliary tools need explicit groups');
 const links=[...document.querySelectorAll('.next-home-tool-group a[href^="labs/"]')].map(a=>a.getAttribute('href'));
 // The newest source-private C1 review tool is an additional REAL tool,
 // not a duplicate of the old fixed 8-vertex long-box demonstration.
 assert.equal(links.length,22,'all published special-purpose tools, including signed-only C2 Cut, remain reachable');
 assert.equal(new Set(links).size,22,'tool entries should not repeat');
 assert(links.includes('labs/c2-native-cut-review.html'),
  'real native Cut partial certified V5 preview is visible from the enhanced homepage');
 assert(links.includes('labs/c1-reviewed-dxf-live.html'),
  'new original DXF reviewed C1 source lab must be accessible from home');
 const navigation=[...document.querySelectorAll('.next-task-nav a')].map(a=>a.textContent.trim());
 assert.deepEqual(navigation,['解题','工具']);
});
test('help page uses practical guidance while retaining accurate AI and data boundaries',()=>{
 const {after:document}=enhance('public-use.html');
 assert.match(document.querySelector('main h1').textContent,/帮助与用户协议/);
 assert.ok(document.querySelector('main details'),'long technical disclosures must be optional');
 assert.match(document.querySelector('main').textContent,/尚未向公众开放/);
 assert.match(document.querySelector('main').textContent,/个人资料/);
});

test('V6.3 compact navigation keeps every task reachable and all favicons blue',()=>{
 for(const page of ['index.html','labs/auto-fillet-live.html','labs/cone-cut-live.html','labs/cylinder-cut-live.html']){
  const {after:document}=enhance(page);
  const root=page.includes('/')?'../':'';
  const favicon=document.querySelector('link[rel="icon"][type="image/svg+xml"]');
  assert.equal(favicon?.getAttribute('href'),root+'favicon.svg',page+' must reference shared blue icon');
  const links=[...document.querySelectorAll('.next-task-nav a')];
  assert.deepEqual(links.map(link=>link.textContent.trim()),['解题','工具']);
  assert.equal(links[0].getAttribute('href'),page==='index.html'?'#project-workbench':root+'index.html#project-workbench');
  assert.equal(links[1].getAttribute('href'),page==='index.html'?'#tools':root+'index.html#tools');
 }
 const svg=fs.readFileSync(path.join(root,'favicon.svg'),'utf8');
 assert.match(svg,/#0871f5/);
 assert.doesNotMatch(svg,/#266f4a/);
});
test('V6.3 wide desktop shows editable conditions + paper + steps without touching solver state',()=>{
 const {after:document}=enhance('labs/auto-fillet-live.html');
 const previousMatchMedia=document.defaultView.matchMedia;
 document.defaultView.matchMedia=()=>({matches:true});
 const r=document.querySelector('.next-workspace');
 const condition=document.querySelector('[data-next-panel="conditions"]');
 const step=document.querySelector('[data-next-panel="steps"]');
 const input=document.getElementById('vectorFilletRadius');input.value='19.75';
 const play=document.getElementById('play');play.disabled=true;
 require('../../ui-next/ui-next.js').initUI(document);
 assert.equal(r.dataset.nextSide,'both');
 assert.equal(r.dataset.nextConditions,'open');
 assert.equal(r.dataset.nextSteps,'open');
 assert.equal(condition.hidden,false);
 assert.equal(step.hidden,false);
 const toggleCondition=document.querySelector('[data-next-open-panel="conditions"]');
 const toggleSteps=document.querySelector('[data-next-open-panel="steps"]');
 toggleCondition.click();
 assert.equal(r.dataset.nextConditions,'closed');
 assert.equal(condition.hidden,true);
 toggleCondition.click();
 assert.equal(r.dataset.nextConditions,'open');
 assert.equal(condition.hidden,false);
 toggleSteps.click();
 assert.equal(r.dataset.nextSteps,'closed');
 toggleSteps.click();
 assert.equal(r.dataset.nextSteps,'open');
 assert.equal(step.hidden,false);
 document.querySelector('[data-next-close-panel]').click();
 assert.equal(r.dataset.nextSide,'none');
 assert.equal(input.value,'19.75');
 assert.equal(play.disabled,true);
 if(previousMatchMedia===undefined)delete document.defaultView.matchMedia;
 else document.defaultView.matchMedia=previousMatchMedia;
});
test('V6.3 sheet remains proportional with wide grid rails and short icon controls',()=>{
 const css=fs.readFileSync(path.join(root,'ui-next/ui-next.css'),'utf8');
 assert.match(css,/V6\.3 \| Compact tool rail/);
 assert.match(css,/grid-template-columns:clamp\(184px,15\.4vw,216px\) minmax\(0,1fr\) clamp\(185px,15\.2vw,212px\)/);
 assert.match(css,/object-fit:contain/);
 assert.match(css,/\.next-context\s*\{\s*display:contents!important/);
 assert.match(css,/@media\(max-width:1159px\)/);
 const {after:document}=enhance('labs/point-projection-live.html');
 for(const key of ['fit','in','out']){
  const control=document.querySelector('[data-next-zoom="'+key+'"]');
  assert.ok(control.querySelector('svg'),'zoom '+key+' is an icon');
  assert.ok(control.getAttribute('aria-label'),'zoom '+key+' has accessible name');
 }
 assert.ok(document.querySelector('[data-next-focus] svg'));
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

test('drawing controls are beside the drawing without cloning app-owned controls',()=>{
 for(const page of ['labs/point-projection-live.html','labs/circle-fillet-live.html']){
  const {after}=enhance(page);
  const controls=after.getElementById('drawControls');
  assert.ok(controls.closest('.next-canvas'),page+' drawing controls stay near canvas');
  for(const id of ['undoDraw','redoDraw','clearDraw','checkDraw'])
   assert.equal(after.querySelectorAll('#'+id).length,1,page+' '+id+' remains unique');
  assert.ok(controls.hasAttribute('hidden'));
 }
});

test('fillet drawing shortcuts select the original tool with one click',()=>{
 const {after:document}=enhance('labs/circle-fillet-live.html');
 require('../../ui-next/ui-next.js').initUI(document);
 const tool=document.getElementById('drawTool');let changes=0;
 let value='line';Object.defineProperty(tool,'value',{configurable:true,get:()=>value,set:v=>{value=v}});
 tool.addEventListener('change',()=>changes++);
 const button=document.querySelector('[data-next-draw-tool="arc"]');
 assert.ok(button,'arc shortcut is available by the drawing');
 button.click();
 assert.equal(tool.value,'arc');
 assert.equal(changes,1);
 assert.equal(button.getAttribute('aria-pressed'),'true');
 assert.equal(document.querySelectorAll('#drawTool').length,1);
});

test('V8 task chooser labels remain concise and never promise unsupported C1/C3 answers',()=>{
 const {after:document}=enhance('index.html');
 const task=document.getElementById('v7-task');
 assert.ok(task);
 const options=[...task.querySelectorAll('option')];
 assert.equal(options.length,6,'all original task types are preserved');
 const c1=options.find(x=>x.value==='c1-third-view').textContent;
 const c3=options.find(x=>x.value==='c3-intersection').textContent;
 assert.match(c1,/补第三视图.*单个凸体/);
 assert.doesNotMatch(c1,/长方体/,'certified convex solids are not limited to boxes');
 assert.match(c3,/相贯线.*部分结果/,'full intersection curve is not signed off');
 assert.equal(options.find(x=>x.value==='composition').textContent,'C2 组合体 · 已知形体');
});

test('drawing shortcuts refuse unavailable app tools and recover when available',async()=>{
 const {after:document}=enhance('labs/circle-fillet-live.html');
 const tool=document.getElementById('drawTool');
 let value='line';Object.defineProperty(tool,'value',{configurable:true,get:()=>value,set:v=>{value=v}});
 const option=tool.querySelector('option[value="arc"]');
 option.setAttribute('disabled','');
 require('../../ui-next/ui-next.js').initUI(document);
 const button=document.querySelector('[data-next-draw-tool="arc"]');
 assert.equal(button.disabled,true,'disabled native option must disable its shortcut');
 assert.equal(button.getAttribute('aria-pressed'),'false');
 let changes=0;tool.addEventListener('change',()=>changes++);
 button.click();
 assert.equal(value,'line','disabled shortcut cannot change the native select');
 assert.equal(changes,0,'disabled shortcut cannot request a geometry action');
 option.removeAttribute('disabled');
 document.getElementById('modeSelect').dispatchEvent(new document.defaultView.Event('change',{bubbles:true}));
 await Promise.resolve();
 assert.equal(button.disabled,false,'app mode change re-enables valid shortcut');
 button.click();
 assert.equal(value,'arc');
 assert.equal(changes,1);
 assert.equal(button.getAttribute('aria-pressed'),'true');
});

test('drawing shortcuts follow app mode changes and disabled state',async()=>{
 const {after:document}=enhance('labs/circle-fillet-live.html');
 const tool=document.getElementById('drawTool');let value='line';
 Object.defineProperty(tool,'value',{configurable:true,get:()=>value,set:v=>{value=v}});
 require('../../ui-next/ui-next.js').initUI(document);
 const learning=document.getElementById('learningMode');
 learning.addEventListener('change',()=>{tool.disabled=false;tool.value='tangent'});
 tool.disabled=true;
 learning.dispatchEvent(new document.defaultView.Event('change',{bubbles:true}));
 await Promise.resolve();
 assert.equal(document.querySelector('[data-next-draw-tool=tangent]').getAttribute('aria-pressed'),'true');
 assert.equal(document.querySelector('[data-next-draw-tool=tangent]').disabled,false);
});
