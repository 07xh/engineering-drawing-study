'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const {reviewC2BoxFields}=require('../../project/c2-reviewed-preflight.cjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const boxes={
 'v8-c2-a-x0':'0','v8-c2-a-y0':'0','v8-c2-a-z0':'0',
 'v8-c2-a-x1':'30','v8-c2-a-y1':'20','v8-c2-a-z1':'10',
 'v8-c2-b-x0':'10','v8-c2-b-y0':'0','v8-c2-b-z0':'0',
 'v8-c2-b-x1':'40','v8-c2-b-y1':'10','v8-c2-b-z1':'5'
};
test('V8.7 C2 preflight checks exact missing, nonfinite and reversed bounds before canonical geometry submission',()=>{
 assert.equal(reviewC2BoxFields({}).fieldId,'v8-c2-a-x0');
 assert.equal(reviewC2BoxFields(boxes).ready,true);
 assert.equal(reviewC2BoxFields({...boxes,'v8-c2-b-y1':''}).fieldId,'v8-c2-b-y1');
 assert.equal(reviewC2BoxFields({...boxes,'v8-c2-b-x0':'Infinity'}).ready,false);
 assert.equal(reviewC2BoxFields({...boxes,'v8-c2-a-x1':'100001'}).ready,false);
 const reversed=reviewC2BoxFields({...boxes,'v8-c2-a-z1':'0'});
 assert.equal(reversed.fieldId,'v8-c2-a-z1');
 assert.match(reversed.message,/最大 Z/);
 assert.equal(reviewC2BoxFields(boxes,{occupied:true}).ready,false);
 assert.equal(reviewC2BoxFields(boxes,{occupied:true}).fieldId,null);
});

test('V8.7 C2 real DOM: repair first invalid field and require human acknowledgement, never overwrite saved objects',async()=>{
 const {document,window}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const create=document.createElement.bind(document);
 function adapt(el){
  if(!el||el.nodeType!==1)return el;
  for(const name of ['disabled','hidden','checked'])Object.defineProperty(el,name,{
   configurable:true,get(){return this.hasAttribute(name)},
   set(value){if(value)this.setAttribute(name,'');else this.removeAttribute(name)}
  });
  if(['INPUT','SELECT','OPTION','TEXTAREA'].includes(el.tagName))
   Object.defineProperty(el,'value',{configurable:true,
    get(){
     if(Object.hasOwn(this,'__v8Value'))return this.__v8Value;
     if(this.tagName==='SELECT'){
      const selected=this.querySelector('option[selected]')||this.querySelector('option');
      return selected?selected.value:'';
     }
     return this.getAttribute('value')??'';
    },set(value){this.__v8Value=String(value)}
   });
  return el;
 }
 for(const el of document.querySelectorAll('*'))adapt(el);
 Object.defineProperty(document,'createElement',{configurable:true,value:tag=>adapt(create(tag))});
 const prev={document:global.document,window:global.window};
 global.document=document;global.window=window;
 global.requestAnimationFrame=cb=>setImmediate(()=>cb(performance.now()));
 global.cancelAnimationFrame=clearImmediate;
 const $=id=>document.getElementById(id),fire=(id,type)=>
  $(id).dispatchEvent(new window.Event(type,{bubbles:true}));
 try{
  require('../../project/unified-workbench-entry.cjs');
  for(let i=0;i<12&&!$('v7-review').textContent.includes('尚未提交');i++)await tick();
  $('v7-task').value='composition';fire('v7-task','change');
  for(let i=0;i<8;i++)await tick();
  assert.equal(document.querySelector('fieldset[data-v7-task="composition"]').hidden,false);
  assert.equal($('v8-c2-ack').disabled,true);
  assert.equal($('v8-c2-build').disabled,true);
  assert.equal($('v8-c2-locate').dataset.target,'v8-c2-a-x0');
  assert.equal($('v8-c2-a-x0').getAttribute('aria-invalid'),'true');
  for(const [id,value]of Object.entries(boxes)){$(id).value=value;fire(id,'input');}
  assert.equal($('v8-c2-preflight').dataset.state,'ready');
  assert.equal($('v8-c2-locate').hidden,true);
  assert.equal($('v8-c2-a-x0').hasAttribute('aria-invalid'),false);
  assert.equal($('v8-c2-ack').disabled,false);
  assert.equal($('v8-c2-build').disabled,true);
  $('v8-c2-b-x1').value='10';fire('v8-c2-b-x1','input');
  assert.equal($('v8-c2-locate').dataset.target,'v8-c2-b-x1');
  assert.equal($('v8-c2-ack').disabled,true);
  $('v8-c2-b-x1').value='40';fire('v8-c2-b-x1','input');
  assert.equal($('v8-c2-preflight').dataset.state,'ready');
  $('v8-c2-ack').checked=true;fire('v8-c2-ack','change');
  assert.equal($('v8-c2-build').disabled,false);
  fire('v8-c2-build','click');
  for(let i=0;i<12;i++)await tick();
  assert.match($('v8-c2-status').textContent,/两形体已保存/,$('v7-save').textContent);
  assert.equal($('v8-c2-ack').checked,false);
  assert.equal($('v8-c2-ack').disabled,true,'cannot confirm over existing solids');
  assert.equal($('v8-c2-build').disabled,true);
  assert.match($('v8-c2-preflight').textContent,/已有对象或约束/);
  assert.equal($('v8-result-status').dataset.state,'partial','C2 cannot become certified answer');
 }finally{
  global.document=prev.document;global.window=prev.window;
  delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
 }
});
