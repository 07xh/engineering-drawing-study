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
  for(const id of controls)assert.ok(after.getElementById(id).closest('.next-context'),page+' '+id);
  assert.ok(after.getElementById('learningMode').closest('[data-next-panel="steps"]'),page);
 }
});

test('V6.5 homepage puts accurate arc construction next to entry actions',()=>{
 const {after:document}=enhance('index.html');
 const dashboard=document.querySelector('.next-home-workbench');
 assert.ok(dashboard,'new homepage workbench must be the first screen');
 assert.ok(dashboard.querySelector('.next-home-drawing'),'large drawing region missing');
 const svg=dashboard.querySelector('.next-home-paper svg');
 assert.ok(svg,'one-sheet preview missing');
 assert.equal(dashboard.querySelectorAll('.next-home-paper svg').length,1,'views must stay on one sheet');
 const labels=svg.textContent;
 for(const label of ['R40','T₁','T₂','O'])
  assert.ok(labels.includes(label),'required fillet construction label missing: '+label);
 assert.ok(dashboard.querySelector('.next-home-workflow'),'right-side quick actions missing');
 for(const dest of ['labs/cone-cut-live.html','labs/circle-fillet-live.html','labs/point-projection-live.html'])
  assert.ok(document.querySelector('a[href="'+dest+'"]'),'real solver route missing: '+dest);
 assert.ok(document.querySelector('.next-home-more-tools>summary'),'secondary tool list must be collapsible');
 assert.ok(document.querySelector('meta[name="draftai-ui-release"][content="v6.6-home-20261023"]'),'verifiable homepage release marker missing');
 assert.match(dashboard.textContent,/非上传题目答案/,'hero must identify geometry drawing as an example');
 assert.match(dashboard.textContent,/自动识别尚未开放/,'unsupported AI recognition must remain clearly indicated');
 assert.ok(document.querySelector('.next-home-workbench').compareDocumentPosition(document.querySelector('#tools')) & 4,'drawing workspace must precede tool list');
});

test('V6.4 home reflects reference-two structure and original topic hierarchy without fake records',()=>{
 const {after:document}=enhance('index.html');
 const first=document.querySelector('.next-home-v64');
 assert.ok(first?.querySelector('.next-home-intro-block'),'hero has intro + large paper');
 assert.ok(first.querySelector('.next-home-intro-copy h1'),'clear primary action');
 assert.ok(first.querySelector('.next-home-intro-sheet [data-construction-example="right-angle-fillet"]'),'independently checked fillet drawing retained');
 assert.ok(first.querySelector('.next-home-workflow #recent'),'recent history location');
 assert.ok(first.querySelector('.next-home-workflow #knowledge'),'my problems location');
 assert.match(document.querySelector('#recent').textContent,/暂无可恢复的解题记录/);
 assert.match(document.querySelector('#knowledge').textContent,/题库尚未接入/);
 assert.doesNotMatch(document.querySelector('#recent').textContent,/2024|上次编辑：/,'do not invent personal history');
 const categories=[...document.querySelectorAll('.next-home-category-grid>a')];
 assert.deepEqual(categories.map(x=>x.querySelector('strong').textContent.trim()),['平面作图','三视图与投影','截交与相贯','组合体作图']);
 for(const href of ['labs/circle-fillet-live.html','labs/point-projection-live.html','labs/cone-cut-live.html','labs/composite-geometry.html'])
  assert.ok(categories.some(a=>a.getAttribute('href')===href),'actual category tool '+href);
 const nav=document.querySelector('.next-sidebar');
 assert.ok(nav.querySelector('a[href="index.html#plane"]'),'plane task is direct');
 assert.ok(nav.querySelector('a[href="index.html#projection"]'),'projection task is direct');
 assert.ok(nav.querySelector('a[href="index.html#section"]'),'section task is direct');
 assert.ok(nav.querySelector('a[href="index.html#recent"]'),'history anchor is real');
 for(const id of ['plane','projection','section','recent','knowledge','tools'])assert.ok(document.getElementById(id),'no dead anchor '+id);
 assert.ok(document.querySelector('.next-home-more-tools:not([open])'),'all labs can stay collapsed');
});
test('homepage R40 fillet obeys exact radius and two orthogonal tangencies',()=>{
 const {after:document}=enhance('index.html');
 const sheet=document.querySelector('[data-construction-example="right-angle-fillet"]');
 assert.ok(sheet,'the hero must show the new fillet instead of the old cone');
 const svg=sheet.querySelector('svg');
 assert.ok(svg);
 const arc=svg.querySelector('[data-fillet-arc="true"]');
 const m=/^M(\d+) (\d+) A(\d+) (\d+) 0 0 0 (\d+) (\d+)$/.exec(arc.getAttribute('d'));
 assert.ok(m,'fillet must be a true circular quarter arc, not decorative Bezier');
 const [x1,y1,rx,ry,x2,y2]=m.slice(1).map(Number);
 assert.equal(rx,ry,'a fillet arc must be circular');
 const scale=Number(arc.getAttribute('data-px-per-mm'));
 assert.equal(rx/scale,40,'the displayed R40 dimension must match the radius');
 const center=svg.querySelector('[data-fillet-center="true"]');
 const cx=+center.getAttribute('cx'),cy=+center.getAttribute('cy');
 const t1=svg.querySelector('[data-tangent="t1"]'),t2=svg.querySelector('[data-tangent="t2"]');
 assert.equal(+t1.getAttribute('cx'),x1);
 assert.equal(+t1.getAttribute('cy'),y1);
 assert.equal(+t2.getAttribute('cx'),x2);
 assert.equal(+t2.getAttribute('cy'),y2);
 assert.equal(x1,cx,'horizontal-line tangency radius must be vertical');
 assert.equal(y1,cy+rx);
 assert.equal(x2,cx+rx,'vertical-line tangency radius must be horizontal');
 assert.equal(y2,cy);
 const horizontal=/^M(\d+) (\d+)H(\d+)$/.exec(svg.querySelector('[data-horizontal-line]').getAttribute('d'));
 const vertical=/^M(\d+) (\d+)V(\d+)$/.exec(svg.querySelector('[data-vertical-line]').getAttribute('d'));
 assert.ok(horizontal&&vertical,'both true-line sections must exist');
 assert.equal(+horizontal[2],y1);
 assert.equal(+horizontal[3],x1,'horizontal line must end at T1');
 assert.equal(+vertical[1],x2);
 assert.equal(+vertical[2],y2,'vertical line must start at T2');
 assert.equal(svg.querySelectorAll('[data-fillet-arc]').length,1,'one real fillet');
 assert.equal(svg.querySelectorAll('[data-construction-guides] [data-radius-to-t1], [data-construction-guides] [data-radius-to-t2]').length,2);
 assert.match(sheet.querySelector('.next-home-paper-caption').textContent,/非上传题目答案/);
 assert.ok(document.querySelector('.next-home-example[href="labs/circle-fillet-live.html"]'));
 assert.ok(!document.querySelector('[data-projection-example="right-circular-cone"]'),'old repeated cone must be replaced');
});

test('V6.6 enlarged homepage SVG keeps the verified R40 construction fully visible',()=>{
 const {after:document}=enhance('index.html');
 const hero=document.querySelector('.next-home-v64');
 const sheet=hero.querySelector('[data-construction-example="right-angle-fillet"]');
 assert.ok(sheet,'hero drawing remains linked to actual fillet example');
 const svg=sheet.querySelector('svg');
 const [minX,minY,width,height]=svg.getAttribute('viewBox').trim().split(' ').filter(Boolean).map(Number);
 assert.ok(width>0&&height>0);
 assert.ok(width<=550&&height<=400,'SVG viewBox must tightly frame construction');
 assert.ok(minX<=290 && minY<=123,'known horizontal/vertical segments remain visible');
 const arc=svg.querySelector('[data-fillet-arc="true"]');
 assert.ok(arc,'no artistic replacement of the verified arc');
 for(const [x,y] of [[512,440],[672,280],[512,280],[672,123],[290,440],[465,474]]){
  assert.ok(x>=minX&&x<=minX+width&&y>=minY&&y<=minY+height,
   'key geometry or dimension label must remain inside clipped sheet');
 }
 assert.ok(hero.querySelectorAll('.next-home-strengths svg').length===3,'three feature icons replace verbose space');
 assert.ok(document.querySelector('.next-home-workflow #recent'),'keep genuine recent-task card');
 assert.ok(document.querySelector('.next-home-workflow #knowledge'),'keep honest my-problems card');
 assert.equal(hero.querySelectorAll('.next-home-intro-sheet [data-next-illustration]').length,1,
  'exactly one paper view');
 const css=fs.readFileSync(path.join(root,'ui-next/ui-next.css'),'utf8');
 assert.ok(css.includes('V6.6 | Homepage paper-first hero'));
 assert.ok(css.includes('grid-template-columns:minmax(0,.81fr) minmax(0,1.19fr)'));
 assert.ok(css.includes('aspect-ratio:525 / 387'));
 assert.ok(css.includes('align-items:start'));
 assert.ok(css.includes('@media(min-width:641px) and (max-width:790px)'));

});

test('start page offers actual solver entries and honest knowledge boundaries',()=>{
 const {after}=enhance('index.html');
 assert.ok(after.querySelector('.next-home-hero'),'new task-oriented home');
 assert.match(after.querySelector('#knowledge').textContent,/题库.*尚未接入/);
 assert.ok(after.querySelector('a[href="labs/auto-fillet-live.html"]'));
 // V7 adds local-only image and .daiproject inputs, never a network upload form.
 assert.equal(after.querySelectorAll('form').length,0);
 assert.equal(after.querySelectorAll('#project-workbench input[type=file]').length,2);
 assert.ok(after.getElementById('v7-photo'));
 assert.ok(after.getElementById('v7-confirm'));
 assert.ok(after.getElementById('v7-solve'));
 assert.doesNotMatch(after.body.textContent,/已保存 · 示例|题库已接入|任意题图一键解答/);
 for(const page of pages.filter(x=>x.startsWith('labs/')))assert.ok(after.querySelector('a[href="'+page+'"]'),page+' discoverable');
 assert.ok(after.querySelector('[data-next-illustration]'));
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
 assert.equal(links.length,19,'all existing published special-purpose tools remain reachable');
 assert.equal(new Set(links).size,19,'tool entries should not repeat');
 const my=document.querySelector('#knowledge');
 assert.ok(my?.closest('.next-home-workflow'),'My Problems should be a compact card beside paper');
 assert.match(my.textContent,/题库尚未接入/,'no fictional persistent history');
 const sidebar=[...document.querySelectorAll('.next-sidebar nav a')].map(a=>a.textContent.trim());
 assert.deepEqual(sidebar,['首页','AI 解题','平面作图','三视图与投影','截交与相贯','我的题目','历史记录','更多工具','帮助与协议']);
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
  const side=[...document.querySelectorAll('.next-sidebar nav a')];
  assert.equal(side.length,9,page+' compact task navigation');
  for(const link of side){
   assert.ok(link.getAttribute('aria-label'),page+' accessible label');
   assert.ok(link.getAttribute('data-ui-tip'),page+' long-press tooltip');
   assert.ok(link.querySelector('svg'),page+' genuine visible icon');
  }
  assert.ok(document.querySelector('.next-sidebar .next-start svg'),page+' launch icon');
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
