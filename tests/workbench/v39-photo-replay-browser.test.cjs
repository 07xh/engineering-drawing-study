'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
const {fingerprintLocalPhoto}=require('../../recognition/local-photo-fingerprint.cjs');
const {createPhotoQualitySession}=require('../../recognition/photo-quality-session.cjs');
const {createAnnotationPack}=require('../../recognition/photo-annotation-replay.cjs');
const {scenarios}=require('../recognition/synthetic-quality-scenes.cjs');
function mockFile(content,type='image/png'){
 const data=Buffer.from(content);
 return {size:data.length,type,
  async arrayBuffer(){
   return data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
  }};
}
test('explicit selected original photo file hashes exactly to native SHA-256 and no bytes in result',async()=>{
 const file=mockFile('nonprivate synthetic test image content');
 const actual=await fingerprintLocalPhoto(file,webcrypto.subtle);
 const expected=createHash('sha256').update('nonprivate synthetic test image content').digest('hex');
 assert.equal(actual,expected);
 assert.match(actual,/^[0-9a-f]{64}$/);
 assert.equal(typeof actual,'string');
});
test('unsupported crypto, invalid format or malformed data must fail closed',async()=>{
 const file=mockFile('abc');
 await assert.rejects(()=>fingerprintLocalPhoto(file,null),/Web Crypto/);
 await assert.rejects(()=>fingerprintLocalPhoto(mockFile('abc','image/svg+xml'),
  webcrypto.subtle),/photo/);
 await assert.rejects(()=>fingerprintLocalPhoto({...file,size:1000},
  webcrypto.subtle),/incomplete/);
 await assert.rejects(()=>fingerprintLocalPhoto({...file,arrayBuffer:()=>null},
  webcrypto.subtle));
 await assert.rejects(()=>fingerprintLocalPhoto({...file,size:15*1024*1024+1},
  webcrypto.subtle),/15 MB/);
});
test('same-photo export and re-import reproduce real local detector comparison without file bytes',async()=>{
 const s=scenarios().find(x=>x.truth[0]?.kind==='line'),file=mockFile('same-image-fixture');
 const hash=await fingerprintLocalPhoto(file,webcrypto.subtle);
 const q=createPhotoQualitySession();
 q.loadImage({width:s.image.width,height:s.image.height},s.image);
 q.addAnnotation({kind:'line',from:s.truth[0].from,to:s.truth[0].to});
 const pack=createAnnotationPack(q.snapshot(),hash);
 const before=q.report();
 q.loadImage({width:s.image.width,height:s.image.height},s.image);
 assert.equal(q.restoreAnnotations(q.snapshot().imageVersion,pack,hash),true);
 const after=q.report();
 assert.deepEqual(after.metrics.byKind.line,before.metrics.byKind.line);
 assert.equal(after.imageBytesIncluded,false);
 assert.equal(after.filenameIncluded,false);
});
test('browser exposes manual replay actions only, retaining existing explicit metrics report export',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('labs/recognition-qa.html','utf8');
 const js=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
 const fp=fs.readFileSync('recognition/local-photo-fingerprint.cjs','utf8');
 for(const id of ['qaSaveTruth','qaLoadTruth','qaTruthFile','qaExport'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/fingerprintLocalPhoto\(t\.file\)/);
 assert.match(js,/createAnnotationPack\(t\.snapshot,sha\)/);
 assert.match(js,/session\.restoreAnnotations\(t\.imageVersion,pack,sha\)/);
 assert.match(js,/replayStillCurrent\(t\)/);
 assert.match(js,/downloadJson\(pack,'draftai-photo-annotations\.json'\)/);
 assert.match(js,/download=|a\.download=/);
 assert.match(fp,/subtle\.digest\('SHA-256',bytes\)/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB/);
 assert.doesNotMatch(fp,/\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB/);
});
