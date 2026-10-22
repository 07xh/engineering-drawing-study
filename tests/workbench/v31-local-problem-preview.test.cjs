'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {checkLocalImage,attachLocalImagePreview,LIMIT}=
 require('../../labs/local-problem-preview.cjs');
const file=(type='image/png',size=4096)=>({name:'private-note',type,size});
function element(){
 const handlers={},attrs={};
 return {files:[],value:'',src:'',hidden:true,textContent:'',
  handlers,attrs,
  addEventListener:(k,fn)=>{handlers[k]=fn},
  removeAttribute(k){delete this.attrs[k];if(k==='src')this.src=''}
 };
}
test('local image file gate allows bounded JPG/PNG/WebP only',()=>{
 for(const type of ['image/png','image/jpeg','image/webp'])
  assert.equal(checkLocalImage(file(type,LIMIT)).ok,true);
 for(const type of ['image/svg+xml','text/html','application/pdf',''])
  assert.equal(checkLocalImage(file(type)).ok,false);
 for(const size of [0,-1,LIMIT+1,NaN,Infinity])
  assert.equal(checkLocalImage(file('image/png',size)).ok,false);
 assert.equal(checkLocalImage(null).ok,false);
});
test('image blob is local and revoked on replacement, invalid input, reset, page exit',()=>{
 const input=element(),image=element(),status=element(),clear=element(),host=element();
 const revoked=[],created=[],urls={
  createObjectURL(f){const u='blob:local-preview-'+(created.length+1);created.push([u,f]);return u},
  revokeObjectURL(u){revoked.push(u)}
 };
 const api=attachLocalImagePreview({input,image,status,clear,urls,host});
 input.files=[file('image/png')];
 assert.equal(input.handlers.change().ok,true);
 assert.equal(image.src,'blob:local-preview-1');
 assert.equal(image.hidden,false);
 assert.match(status.textContent,/不发送到服务器/);
 input.files=[file('image/jpeg')];
 input.handlers.change();
 assert.deepEqual(revoked,['blob:local-preview-1']);
 assert.equal(image.src,'blob:local-preview-2');
 input.files=[file('image/svg+xml')];
 const rejected=input.handlers.change();
 assert.equal(rejected.ok,false);assert.equal(image.hidden,true);
 assert.deepEqual(revoked,['blob:local-preview-1','blob:local-preview-2']);
 input.files=[file('image/webp')];
 api.show();assert.equal(image.src,'blob:local-preview-3');
 host.handlers.pagehide();
 assert.equal(image.hidden,true);assert.equal(revoked.length,3);
 input.files=[file('image/webp')];
 api.show();
 clear.handlers.click();
 assert.equal(input.value,'');assert.equal(image.hidden,true);
 assert.deepEqual(revoked,['blob:local-preview-1','blob:local-preview-2',
  'blob:local-preview-3','blob:local-preview-4']);
});
test('preview wiring does not read file bytes or send user images to an API',()=>{
 const fs=require('node:fs');
 const source=fs.readFileSync('labs/local-problem-preview.cjs','utf8');
 const ui=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const page=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 assert.match(page,/id="problemPhoto"/);
 assert.match(page,/仅本地参照/);
 assert.match(ui,/attachLocalImagePreview/);
 assert.doesNotMatch(source,/(fetch\(|XMLHttpRequest|FileReader|localStorage|sessionStorage)/);
 assert.match(source,/revokeObjectURL/);
 assert.match(source,/pagehide/);
});
