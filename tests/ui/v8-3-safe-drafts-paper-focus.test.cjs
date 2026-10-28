'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const tick=()=>new Promise(r=>setImmediate(r));
test('V8.3 reviewed forms never leak measurements, C2 protects drafts and 2D paper can expand',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const native=document.createElement.bind(document);
 function adapt(el){
  if(!el||el.nodeType!==1)return el;
  for(const name of ['disabled','hidden','checked'])
   Object.defineProperty(el,name,{
    configurable:true,get(){return this.hasAttribute(name)},
    set(v){v?this.setAttribute(name,''):this.removeAttribute(name)}
   });
  if(['INPUT','SELECT','OPTION','TEXTAREA'].includes(el.tagName))
   Object.defineProperty(el,'value',{
    configurable:true,get(){
     if(Object.hasOwn(this,'_v83'))return this._v83;
     if(this.tagName==='SELECT')return (this.querySelector('option[selected]')||
      this.querySelector('option'))?.value||'';
     return this.getAttribute('value')??'';
    },set(v){this._v83=String(v)}
   });
  return el;
 }
 for(const el of document.querySelectorAll('*'))adapt(el);
 Object.defineProperty(document,'createElement',{configurable:true,value:t=>adapt(native(t))});
 const previous={document:global.document,window:global.window};
 global.document=document;global.window=window;
 global.requestAnimationFrame=cb=>setImmediate(()=>cb(performance.now()));
 global.cancelAnimationFrame=clearImmediate;
 const $=id=>document.getElementById(id);
 const fire=(id,type)=>$(id).dispatchEvent(new window.Event(type,{bubbles:true}));
 const settle=async()=>{for(let i=0;i<8;i++)await tick()};
 try{
  require('../../project/unified-workbench-entry.cjs');
  await settle();
  assert.equal($('v8-paper-focus').getAttribute('aria-pressed'),'false');
  fire('v8-paper-focus','click');
  assert.equal($('v8-paper-focus').getAttribute('aria-pressed'),'true');
  assert.ok(document.querySelector('.v7-layout').classList.contains('v8-paper-focus'));
  fire('v8-paper-focus','click');
  assert.equal($('v8-paper-focus').textContent,'放大图纸');
  const css=readFileSync(join(__dirname,'../../project/workbench-ui.css'),'utf8');
  assert.match(css,/\.v7-workspace \[hidden\]\{display:none!important\}/);
  assert.match(css,/\.v7-layout\.v8-paper-focus \.v7-paper/);
  // EMPTY C3 cannot be accepted, even if a user ticks the final checkbox.
  $('v7-task').value='c3-intersection';fire('v7-task','change');await settle();
  assert.equal($('v8-review-ack').disabled,true);
  assert.equal($('v8-review-run').disabled,true);
  const c3={zRadius:10,zX:1,zY:2,zMin:-12,zMax:12,
   yRadius:6,yX:3,yZ:4,yMin:-10,yMax:10};
  for(const [key,n] of Object.entries(c3)){
   $('v8-c3-'+key).value=String(n);fire('v8-c3-'+key,'input');
  }
  $('v8-c3-axes').checked=true;fire('v8-c3-axes','change');
  assert.equal($('v8-review-run').disabled,true,'caps still unreviewed');
  $('v8-c3-caps').checked=true;fire('v8-c3-caps','change');
  $('v8-review-ack').checked=true;fire('v8-review-ack','change');
  assert.equal($('v8-review-run').disabled,false);
  assert.match($('v8-review-summary').textContent,/轴心 \(x,y\)=\(1,2\)/);
  assert.match($('v8-review-summary').textContent,/端盖 z=\[-12,12\]/);
  assert.match($('v8-review-summary').textContent,/轴心 \(x,z\)=\(3,4\)/);
  assert.match($('v8-review-summary').textContent,/端盖 y=\[-10,10\]/);
  // New project: no stale values or checked C3/C1 topology from old task.
  fire('v7-new','click');await settle();
  $('v7-task').value='c3-intersection';fire('v7-task','change');await settle();
  assert.equal($('v8-c3-zRadius').value,'');
  assert.equal($('v8-c3-yRadius').value,'');
  assert.equal($('v8-c3-axes').checked,false);
  assert.equal($('v8-c3-caps').checked,false);
  assert.equal($('v8-review-ack').disabled,true);
  $('v8-c1-vertices').value='V000,0,0,0,0';
  $('v8-c1-topology').checked=true;
  fire('v7-new','click');await settle();
  $('v7-task').value='c1-third-view';fire('v7-task','change');await settle();
  assert.equal($('v8-c1-vertices').value,'');
  assert.equal($('v8-c1-topology').checked,false);
  assert.equal($('v8-review-run').disabled,true);
  $('v8-c1-vertices').value='V000,0,0,0,0';fire('v8-c1-vertices','input');
  $('v8-c1-topology').checked=true;fire('v8-c1-topology','change');
  assert.equal($('v8-review-ack').disabled,true,'one vertex cannot fake eight');
  assert.match($('v8-review-summary').textContent,/已输入 1\/8 行/);
  // A partially typed C2 geometry cannot be discarded by switching task.
  fire('v7-new','click');await settle();
  $('v7-task').value='composition';fire('v7-task','change');await settle();
  $('v8-c2-a-x0').value='19';fire('v8-c2-a-x0','input');
  $('v7-task').value='projection';fire('v7-task','change');await settle();
  assert.equal($('v7-task').value,'composition');
  assert.equal($('v8-c2-a-x0').value,'19');
  assert.match($('v7-save').textContent,/尚未保存的条件修改/);
  // The guarded C2 input is not a second solver or a certified answer.
  assert.equal($('v8-c2-build').disabled,true);
 }finally{
  global.document=previous.document;global.window=previous.window;
  delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
 }
});
