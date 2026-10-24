'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {attachPrivatePhotoCaseExport:wire}=
 require('../../labs/private-photo-exercise-export.cjs');
const fs=require('node:fs');
function setup(digest=async()=>new Uint8Array(32).fill(0xab).buffer){
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const {document,window}=parseHTML(html);
 const get=id=>document.getElementById(id);
 const input=get('problemPhoto'),image=get('photoPreview');
 const blobs=[],released=[];
 const urls={createObjectURL(blob){blobs.push(blob);return 'blob:only-local-'+blobs.length},
  revokeObjectURL(url){released.push(url)}};
 let generation=7,evidence=null;
 let candidates={lines:[],curves:[],arrows:[],ocr:[]},
  live={ready:false,input:null};
 Object.defineProperty(image,'naturalWidth',{configurable:true,value:600});
 Object.defineProperty(image,'naturalHeight',{configurable:true,value:400});
 const file={type:'image/png',size:4,
  arrayBuffer:async()=>new Uint8Array([5,6,7,8]).buffer};
 Object.defineProperty(input,'files',{configurable:true,value:[file]});
 const app=wire({
  fileInput:input,photoClear:get('clearPhoto'),image,
  role:get('privatePhotoCaseRole'),
  accepted:get('privatePhotoCaseAccept'),
  button:get('privatePhotoCaseSave'),
  status:get('privatePhotoCaseStatus'),
  getEvidence:()=>evidence,getGeneration:()=>generation,
  getCandidates:()=>candidates,
  getCurrentLive:()=>live,
  subtle:{digest},urls,dom:document
 });
 return {document,window,get,input,file,urls,blobs,released,app,
  setGeneration:n=>{generation=n},setEvidence:v=>{evidence=v},
  setCandidates:v=>{candidates=v},setLive:v=>{live=v},
  setImageDimensions:(width,height)=>{
   Object.defineProperty(image,'naturalWidth',{configurable:true,value:width});
   Object.defineProperty(image,'naturalHeight',{configurable:true,value:height});
  }};
}
test('09 real HTML opt-in exports one local SHA-256 dossier, not a photo or blind certificate',async()=>{
 const s=setup();
 assert.ok(s.get('privatePhotoCaseDetails'));
 await s.app.save();
 assert.equal(s.blobs.length,0);
 assert.match(s.get('privatePhotoCaseStatus').textContent,/请先/);
 s.get('privatePhotoCaseAccept').checked=true;
 await s.app.save();
 assert.equal(s.blobs.length,1);
 const json=JSON.parse(await s.blobs[0].text());
 assert.equal(json.schema,'draftai-private-photo-case/1');
 assert.equal(json.source.sha256,'ab'.repeat(32));
 assert.equal(json.byteReviewBinding.schema,'draftai-private-photo-byte-review-binding/1');
 assert.equal(json.byteReviewBinding.originalPhotoSha256,'ab'.repeat(32));
 assert.equal(json.byteReviewBinding.photoOriginIndependentlyAuthenticated,false);
 assert.equal(json.status,'candidates-captured');
 assert.equal(json.acceptedTextbookProblemCount,0);
 assert.equal(json.independentBlindTestPassed,false);
 assert.equal(json.source.filenameIncluded,false);
 assert.equal(json.source.photoBytesIncluded,false);
 assert.equal(json.math,null);
 assert.equal(s.get('privatePhotoCaseAccept').checked,false);
 assert.match(s.get('privatePhotoCaseStatus').textContent,/盲测通过数仍为 0/);
});
test('09 source photo swap mid-hash aborts private export and never saves stale proof',async()=>{
 let finish;
 const s=setup(()=>new Promise(resolve=>{finish=resolve}));
 s.get('privatePhotoCaseAccept').checked=true;
 const promise=s.app.save();
 await Promise.resolve(); // Allow file.arrayBuffer() to resolve and enter WebCrypto.
 assert.equal(typeof finish,'function');
 s.input.dispatchEvent(new s.window.Event('change',{bubbles:true}));
 finish(new Uint8Array(32).fill(0xcd).buffer);
 await promise;
 assert.equal(s.blobs.length,0);
 assert.equal(s.get('privatePhotoCaseAccept').checked,false);
 assert.match(s.get('privatePhotoCaseStatus').textContent,/未生成/);
});
test('09 tampered candidate generation during hash rejects output even when file identity stays unchanged',async()=>{
 let finish;
 const s=setup(()=>new Promise(resolve=>{finish=resolve}));
 s.get('privatePhotoCaseAccept').checked=true;
 const promise=s.app.save();await Promise.resolve();
 assert.equal(typeof finish,'function');s.setGeneration(8);
 finish(new Uint8Array(32).fill(0xef).buffer);
 await promise;
 assert.equal(s.blobs.length,0);
 assert.match(s.get('privatePhotoCaseStatus').textContent,/核验|版本|更改/);
});
test('09 existing workbench exports CURRENT review, actual OCR and true V5 math session, not synthetic answer playback',()=>{
 const code=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 assert.match(code,/attachPrivatePhotoCaseExport\(/);
 assert.match(code,/getEvidence:\(\)=>dimensionDraftUi\?\.getEvidenceSnapshot/);
 assert.match(code,/ocr:nativeOcrUi\?\.getCurrentCandidates/);
 assert.match(code,/getCurrentLive:/);
 assert.match(code,/session\.canRender\(session\.revision\)/);
 const output=fs.readFileSync('labs/private-photo-exercise-export.cjs','utf8');
 assert.match(output,/fingerprintLocalPhoto/);
 assert.match(output,/getEvidence\(\)/);
 assert.match(output,/fileInput\.files\?\.\[0\]!==file/);
 assert.doesNotMatch(output,/fetch\(|XMLHttpRequest|localStorage|sendBeacon/);
});

test('09 candidate list mutation while original photo SHA runs invalidates export without changing generation',async()=>{
 let finish;
 const s=setup(()=>new Promise(resolve=>{finish=resolve}));
 s.get('privatePhotoCaseAccept').checked=true;
 const promise=s.app.save();await Promise.resolve();
 assert.equal(typeof finish,'function');
 s.setCandidates({lines:[{id:'line_NEW',geometry:{from:[1,2],to:[3,4]}}],
  curves:[],arrows:[],ocr:[]});
 finish(new Uint8Array(32).fill(0xac).buffer);
 await promise;
 assert.equal(s.blobs.length,0);
 assert.match(s.get('privatePhotoCaseStatus').textContent,/未生成/);
});
test('09 source answer-mark role change during SHA hashing invalidates private proof',async()=>{
 let finish;
 const s=setup(()=>new Promise(resolve=>{finish=resolve}));
 s.get('privatePhotoCaseAccept').checked=true;
 const promise=s.app.save();await Promise.resolve();
 assert.equal(typeof finish,'function');
 s.get('privatePhotoCaseRole').value='answer-marked-reference';
 finish(new Uint8Array(32).fill(0xad).buffer);
 await promise;
 assert.equal(s.blobs.length,0);
});
test('09 preview dimensions changing after source snapshot invalidate export, even for same file',async()=>{
 let finish;
 const s=setup(()=>new Promise(resolve=>{finish=resolve}));
 s.get('privatePhotoCaseAccept').checked=true;
 const promise=s.app.save();await Promise.resolve();
 s.setImageDimensions(601,400);
 finish(new Uint8Array(32).fill(0xae).buffer);
 await promise;
 assert.equal(s.blobs.length,0);
});
test('09 math session mutation during second SHA record binding cannot produce mixed-version evidence',async()=>{
 const waiting=[];
 const s=setup(()=>new Promise(resolve=>waiting.push(resolve)));
 s.get('privatePhotoCaseAccept').checked=true;
 const promise=s.app.save();
 for(let i=0;i<10&&waiting.length<1;i++)await Promise.resolve();
 assert.equal(waiting.length,1);
 waiting[0](new Uint8Array(32).fill(0xaf).buffer);
 for(let i=0;i<12&&waiting.length<2;i++)await Promise.resolve();
 assert.equal(waiting.length,2,'second hash must be the complete record binding');
 s.setLive({ready:true,input:{problem:{kind:'segment-circle',revision:99}}});
 waiting[1](new Uint8Array(32).fill(0xbf).buffer);
 await promise;
 assert.equal(s.blobs.length,0);
 assert.match(s.get('privatePhotoCaseStatus').textContent,/未生成/);
});
