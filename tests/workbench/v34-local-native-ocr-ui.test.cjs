'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {attachLocalNativeOcr:attach}=
 require('../../labs/local-native-ocr-ui.cjs');
function control(){
 const listeners={};
 return {
  listeners,children:[],value:'',disabled:false,hidden:true,textContent:'',
  naturalWidth:1200,naturalHeight:800,
  addEventListener(name,fn){listeners[name]=fn},
  replaceChildren(...nodes){this.children=[...nodes]},
  append(node){this.children.push(node)},
  setAttribute(){},
  async fire(name){return listeners[name]?.()}
 };
}
const dimension=()=>({
 id:'ocr_1',sourceText:'R12',kind:'dimension',
 dimensionKind:'radius',numericValue:12,proposedRadiusValue:12,
 bbox:[100,200,70,24],coordinateSpace:'original-image-px',
 unitHint:'drawing-unit-unconfirmed',confirmed:false
});
function setup({recognize=async()=>({status:'ok',candidates:[dimension()]})}={}){
 const nodes={image:control(),photoInput:control(),photoClear:control(),
  run:control(),clear:control(),overlay:control(),status:control(),
  selector:control(),associate:control(),sourceField:control()};
 const linked=[];nodes.sourceField.value='filletRadius';
 const original=global.document;
 global.document={
  createElement(name){assert.equal(name,'option');return {value:'',textContent:''}},
  createElementNS(){return {attrs:{},setAttribute(k,v){this.attrs[k]=v}}}
 };
 const fieldReview={markCandidate(c){
  linked.push(c);return {ok:true,reason:'review source linked'};
 }};
 const api=attach({...nodes,fieldReview,
  getCurves:()=>[{id:'curve_1',kind:'circle',
   coordinateSpace:'original-image-px',bbox:[90,180,200,180]}],
  recognize});
 return {nodes,linked,api,restore(){global.document=original}};
}
test('OCR recognition displays local untrusted annotation and requires explicit association',async()=>{
 const ctx=setup();
 try{
  const {nodes,linked,api}=ctx;
  assert.equal(api.count,0);
  await nodes.run.fire('click');
  assert.equal(api.count,1);
  assert.equal(linked.length,0);
  assert.equal(nodes.overlay.hidden,false);
  assert.equal(nodes.selector.children.length,2);
  nodes.selector.value='ocr_1';
  await nodes.selector.fire('change');
  assert.match(nodes.status.textContent,/curve_1/);
  await nodes.associate.fire('click');
  assert.equal(linked.length,1);
  assert.equal(linked[0].bbox[0],100);
  assert.equal(linked[0].confirmed,false);
  assert.match(nodes.status.textContent,/不会自动修改/);
 }finally{ctx.restore();}
});
test('non-radius fields reject suggestions and clearing photo destroys stale OCR',async()=>{
 const ctx=setup();
 try{
  const {nodes,linked,api}=ctx;
  await nodes.run.fire('click');nodes.selector.value='ocr_1';
  nodes.sourceField.value='a1x';
  await nodes.associate.fire('click');
  assert.equal(linked.length,0);
  assert.match(nodes.status.textContent,/只能关联到半径字段/);
  await nodes.photoClear.fire('click');
  assert.equal(api.count,0);
  assert.equal(nodes.overlay.hidden,true);
 }finally{ctx.restore();}
});
test('async OCR from an old photo is discarded when photo changes while running',async()=>{
 let resolve;
 const ctx=setup({recognize:()=>new Promise(r=>{resolve=r})});
 try{
  const pending=ctx.nodes.run.fire('click');
  await ctx.nodes.photoInput.fire('change');
  resolve({status:'ok',candidates:[dimension()]});
  await pending;
  assert.equal(ctx.api.count,0);
  assert.equal(ctx.nodes.overlay.hidden,true);
  assert.equal(ctx.linked.length,0);
 }finally{ctx.restore();}
});
test('unsupported TextDetector produces explicit fallback without geometry guesses',async()=>{
 const ctx=setup({recognize:async()=>({status:'unsupported',candidates:[]})});
 try{
  await ctx.nodes.run.fire('click');
  assert.equal(ctx.api.count,0);
  assert.match(ctx.nodes.status.textContent,/不支持原生 TextDetector/);
  assert.equal(ctx.nodes.associate.disabled,true);
 }finally{ctx.restore();}
});
test('public UI preserves manual review; OCR is never fed directly to SolveResult',()=>{
 const fs=require('node:fs');
 const source=fs.readFileSync('labs/local-native-ocr-ui.cjs','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 for(const id of ['detectOcr','clearOcr','nativeOcrOverlay',
  'ocrDimensionSelect','associateOcr','nativeOcrStatus'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(entry,/attachLocalNativeOcr/);
 assert.match(source,/fieldReview\.markCandidate\(dim\)/);
 assert.match(source,/epoch!==thisEpoch/);
 assert.doesNotMatch(source,/session\.replace|solveFiniteFillet|localStorage|XMLHttpRequest/);
});
