'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const {attachLocalPhotoByteSession:create}=
 require('../../labs/local-photo-byte-session.cjs');
const {isolateReviewedDraft}=require('../../workbench/reviewed-draft-m3-isolation.cjs');
function emitter(){
 const ev=new Map();
 return {addEventListener(k,fn){
  const v=ev.get(k)||[];v.push(fn);ev.set(k,v);
 },dispatch(k){for(const fn of ev.get(k)||[])fn();}};
}
const file=bytes=>{
 const raw=new Uint8Array(bytes);
 return {type:'image/png',size:raw.length,
  async arrayBuffer(){return raw.slice().buffer;}};
};
const delay=()=>{let resolve;return {
 promise:new Promise(r=>{resolve=r}),resolve:v=>resolve(v)
}};
test('real WebCrypto original byte fingerprint survives current local photo, blocks old content on swap/clear',async()=>{
 const input={...emitter(),files:[file([1,2,3,4])]},
  clear=emitter(),image={naturalWidth:600,naturalHeight:400};
 const session=create({fileInput:input,photoClear:clear,image,
  subtle:webcrypto.subtle});
 const first=await session.hashCurrent();
 assert.match(first.sha256,/^[a-f0-9]{64}$/);
 assert.equal(first.width,600);assert.equal(first.height,400);
 assert.equal(first.sourceTruthIndependentlyProven,false);
 input.files=[file([1,2,3,5])];
 assert.equal(session.snapshot(),null,'different selected file cannot re-use old SHA');
 const second=await session.hashCurrent();
 assert.notEqual(second.sha256,first.sha256);
 assert.notEqual(second.epoch,first.epoch);
 clear.dispatch('click');
 assert.equal(session.snapshot(),null);
});
test('async digest of displaced file cannot overwrite the newer original-file byte witness',async()=>{
 const tasks=[],subtle={digest(alg,bytes){
  const deferred=delay();tasks.push({bytes:new Uint8Array(bytes),...deferred});
  return deferred.promise;
 }};
 const input={...emitter(),files:[file([1,2,3,4])]},
  clear=emitter(),image={naturalWidth:600,naturalHeight:400};
 const session=create({fileInput:input,photoClear:clear,image,subtle});
 const before=session.hashCurrent();
 await Promise.resolve(); // file.arrayBuffer finishes
 assert.equal(tasks.length,1);
 input.files=[file([1,2,3,9])];
 const after=session.hashCurrent();
 await Promise.resolve();
 assert.equal(tasks.length,2);
 tasks[0].resolve(new Uint8Array(32).fill(0xaa).buffer);
 assert.equal(await before,null);
 tasks[1].resolve(new Uint8Array(32).fill(0xbb).buffer);
 assert.equal((await after).sha256,'bb'.repeat(32));
});
test('photo metadata mismatch or unavailable secure cryptography blocks native M3 source readiness',async()=>{
 const input={...emitter(),files:[file([1,2,3,4])]},
  clear=emitter(),image={naturalWidth:600,naturalHeight:400};
 const session=create({fileInput:input,photoClear:clear,image,
  subtle:webcrypto.subtle});
 assert.ok(await session.hashCurrent());
 image.naturalWidth=650;assert.equal(session.snapshot().width,650);
 image.naturalWidth=0;assert.equal(session.snapshot(),null);
 input.files=[file([3,4])];
 const bad=create({fileInput:input,photoClear:clear,image,
  subtle:null});
 assert.equal(await bad.hashCurrent(),null);
 assert.equal(bad.snapshot(),null);
});
test('real UI wires browser file bytes to the M0 photo consumer and M3 without a new math kernel',()=>{
 const fs=require('node:fs');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8'),
  ui=fs.readFileSync('labs/local-reviewed-dimension-draft-ui.cjs','utf8'),
  isolation=fs.readFileSync('workbench/reviewed-draft-m3-isolation.cjs','utf8');
 assert.match(entry,/attachLocalPhotoByteSession/);
 assert.match(entry,/getPhotoIdentity:\(\)=>photoBytes\.snapshot\(\)/);
 assert.match(ui,/photoIdentityKeyOf\(photo\)!==photoIdentityKey/);
 assert.match(ui,/photoSha256:photo\?\.sha256\?\?null/);
 assert.match(isolation,/sha256-.*photoSha256/);
 assert.match(isolation,/sourcePhotoByteSha256:photoSha256/);
});

test('real local photo status progresses through hashing, decoded image readiness and file invalidation',async()=>{
 const input={...emitter(),files:[file([1,2,3,4])]},clear=emitter(),
  image={...emitter(),naturalWidth:600,naturalHeight:400},
  status={textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v}},
  retry={...emitter(),disabled:false};
 const session=create({fileInput:input,photoClear:clear,image,
  status,retry,subtle:webcrypto.subtle});
 assert.equal(status.attrs['data-photo-byte-status'],'no-photo');
 const promise=session.hashCurrent();
 assert.equal(status.attrs['data-photo-byte-status'],'hashing');
 assert.equal(retry.disabled,true);
 await promise;
 assert.equal(status.attrs['data-photo-byte-status'],'ready');
 assert.match(status.textContent,/尚未独立证明/);
 assert.equal(retry.disabled,false);
 image.naturalWidth=0;
 image.dispatch('load');
 assert.equal(status.attrs['data-photo-byte-status'],'waiting-image');
 assert.equal(session.snapshot(),null);
 image.naturalWidth=600;
 image.dispatch('load');
 assert.equal(status.attrs['data-photo-byte-status'],'ready');
 clear.dispatch('click');
 assert.equal(status.attrs['data-photo-byte-status'],'invalid');
 assert.equal(session.snapshot(),null);
});
test('missing secure WebCrypto exposes a concrete local retry path without authorizing M3',async()=>{
 const input={...emitter(),files:[file([1,2,3,4])]},clear=emitter(),
  image={...emitter(),naturalWidth:600,naturalHeight:400},
  status={textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v}},
  retry={...emitter(),disabled:false};
 const session=create({fileInput:input,photoClear:clear,image,
  status,retry,subtle:null});
 assert.equal(await session.hashCurrent(),null);
 assert.equal(status.attrs['data-photo-byte-status'],'failed');
 assert.match(status.textContent,/重新校验/);
 assert.equal(retry.disabled,false);
 retry.dispatch('click');
 await Promise.resolve();await Promise.resolve();
 assert.equal(session.snapshot(),null);
});
test('real HTML photo UX displays SHA-256 progress/status and a working retry control',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 assert.match(html,/id="photoByteStatus".*role="status"/);
 assert.match(html,/id="photoByteRetry"/);
 assert.match(entry,/status:\$\('photoByteStatus'\)/);
 assert.match(entry,/retry:\$\('photoByteRetry'\)/);
});
