'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {attachVerifiedFilletDownloads}=
 require('../../labs/verified-fillet-export-ui.cjs');
const p=(x,y)=>({x,y}),seg=(a,b,c,d)=>({a:p(a,b),b:p(c,d)});
const fixture=()=>({problem:{kind:'two-segments',unit:'mm',revision:3,
  geometry:{first:seg(-10,0,10,0),second:seg(0,-10,0,10)},filletRadius:3},
 selection:{branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'},
 sheet:{origin:p(350,220),scale:5}});
function button(){
 const handlers=new Map();
 return {disabled:true,addEventListener(name,cb){handlers.set(name,cb);},
  removeEventListener(name){handlers.delete(name);},
  click(){handlers.get('click')?.();}};
}
function harness(getCurrent){
 const fullButton=button(),stepsButton=button(),status={textContent:''},
 includeGuides={checked:true}, downloads=[],objects=new Map(),revoked=[];
 const urlApi={createObjectURL(blob){const ref='blob:draftai-'+(objects.size+1);
   objects.set(ref,blob);return ref;},
  revokeObjectURL(ref){revoked.push(ref);objects.delete(ref);}};
 const doc={body:{appendChild(node){downloads.push(node);}},
  createElement(tag){assert.equal(tag,'a');
   return {download:'',href:'',click(){this.clicked=true;},remove(){this.removed=true;}};}};
 const ui=attachVerifiedFilletDownloads({
  fullButton,stepsButton,status,includeGuides,getCurrent,doc,urlApi});
 return {ui,fullButton,stepsButton,status,includeGuides,downloads,objects,revoked};
}
test('download actions are initially locked and do not forge unconfirmed answers',()=>{
 const h=harness(()=>({ready:false}));assert.equal(h.fullButton.disabled,true);
 assert.equal(h.stepsButton.disabled,true);
 h.fullButton.click();h.stepsButton.click();
 assert.equal(h.downloads.length,0);
 assert.match(h.status.textContent,/无法导出/);
 h.ui.release();
});
test('confirmed geometry saves actual SVG from internal math, never screenshot',async()=>{
 const input=fixture(),h=harness(()=>({ready:true,input,revision:3}));
 h.ui.update(true);h.fullButton.click();
 assert.equal(h.fullButton.disabled,false);
 assert.equal(h.downloads.length,1);
 assert.equal(h.downloads[0].download,'draftai-r3-verified.svg');
 assert.equal(h.downloads[0].clicked,true);
 assert.equal(h.downloads[0].removed,true);
 const blob=h.objects.get(h.downloads[0].href);
 assert.equal(blob.type,'image/svg+xml;charset=utf-8');
 const svg=await blob.text();
 assert.match(svg,/<path d="M [^"]+ A /);
 assert.match(svg,/data-layer="given"/);
 assert.doesNotMatch(svg,/<script|<image\b/i);
 h.ui.release();
});
test('all verified steps produce one ZIP download, not browser-blockable many files',async()=>{
 const input=fixture(),h=harness(()=>({ready:true,input,revision:3}));
 h.ui.update(true);h.stepsButton.click();
 assert.equal(h.downloads.length,1);
 assert.equal(h.downloads[0].download,'draftai-r3-steps.zip');
 const blob=h.objects.get(h.downloads[0].href);
 assert.equal(blob.type,'application/zip');
 const bytes=new Uint8Array(await blob.arrayBuffer());
 assert.equal(new DataView(bytes.buffer).getUint32(0,true),0x04034b50);
 assert.match(h.status.textContent,/张步骤 SVG/);
 h.ui.release();
});
test('stale session revisions and falsely ready inputs still fail at proof gate',()=>{
 const input=fixture();
 const h=harness(()=>({ready:true,input,revision:4}));
 h.ui.update(true);h.fullButton.click();
 assert.equal(h.downloads.length,0);
 assert.match(h.status.textContent,/无法导出/);
 h.ui.release();
 const bad=fixture();bad.selection.firstTravel='reverse';
 const g=harness(()=>({ready:true,input:bad,revision:3}));
 g.ui.update(true);g.stepsButton.click();
 assert.equal(g.downloads.length,0);
 assert.match(g.status.textContent,/无法导出/);
 g.ui.release();
});
test('new invalid edit disables both exporters before an old plan can be reused',()=>{
 const input=fixture(),h=harness(()=>({ready:true,input,revision:3}));
 h.ui.update(true);
 h.ui.update(false);
 assert.equal(h.fullButton.disabled,true);
 assert.equal(h.stepsButton.disabled,true);
 h.stepsButton.click();
 assert.equal(h.downloads.length,0);
 h.ui.release();
});
test('release revokes pending local URLs and removes click handlers',()=>{
 const input=fixture(),h=harness(()=>({ready:true,input,revision:3}));
 h.ui.update(true);h.fullButton.click();
 assert.equal(h.objects.size,1);
 h.ui.release();assert.equal(h.objects.size,0);
 assert.equal(h.revoked.length,1);
 h.stepsButton.click();assert.equal(h.downloads.length,1);
});
