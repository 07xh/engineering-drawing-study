'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const {fingerprintLocalPhoto}=
 require('../../recognition/local-photo-fingerprint.cjs');
const {makePrivatePhotoCase}=
 require('../../benchmark/private-photo-exercise-dossier.cjs');
const {bindPrivatePhotoCase:bind,verifyPrivatePhotoCase:verify,
 hashCaseRecord}=require('../../benchmark/private-photo-byte-review-binding.cjs');
function photo(bytes){
 const arr=new Uint8Array(bytes);
 return {type:'image/png',size:arr.byteLength,
  async arrayBuffer(){return arr.slice().buffer;}};
}
const candidates=()=>({lines:[],curves:[],arrows:[],ocr:[]});
async function pack(file,overrides={}){
 const sha=await fingerprintLocalPhoto(file,webcrypto.subtle);
 const bare=makePrivatePhotoCase({photoSha256:sha,
  image:{width:600,height:400},sourceRole:'unknown',
  detectorCandidates:candidates(),detectorGeneration:2});
 return bind({...bare,...overrides},webcrypto.subtle);
}
test('real SHA-256 rehash of ORIGINAL local bytes and reviewed record succeeds with no text/image export',async()=>{
 const file=photo([137,80,78,71,20,25,30,35]);
 const record=await pack(file);
 assert.equal(record.byteReviewBinding.schema,'draftai-private-photo-byte-review-binding/1');
 assert.match(record.source.sha256,/^[a-f0-9]{64}$/);
 assert.match(record.byteReviewBinding.digest,/^[a-f0-9]{64}$/);
 assert.notEqual(record.byteReviewBinding.digest,record.source.sha256);
 assert.equal(record.source.photoBytesIncluded,false);
 assert.equal(record.source.filenameIncluded,false);
 assert.equal(record.byteReviewBinding.photoOriginIndependentlyAuthenticated,false);
 const r=await verify(file,record,webcrypto.subtle);
 assert.equal(r.status,'reproducible-local-file-review-binding');
 assert.equal(r.sourceBytesMatch,true);
 assert.equal(r.reviewRecordUnchanged,true);
 assert.equal(r.constructionAndV5Certified,false);
});
test('independent byte rehash rejects another photo of identical type and length',async()=>{
 const initial=photo([1,2,3,4]),altered=photo([1,2,3,5]);
 const record=await pack(initial);
 assert.equal((await verify(altered,record,webcrypto.subtle)).status,'not-verified');
});
test('record status and decoded review, dimensions or math bytes cannot be silently edited offline',async()=>{
 const file=photo([1,2,3,4,5]);
 const original=await pack(file);
 for(const change of [
  x=>x.status='m3-solved-requires-branch-and-g1',
  x=>x.detection.generation++,
  x=>x.source.image.width=601,
  x=>x.source.role='answer-marked-reference',
  x=>x.review={draftRevision:7,calibration:{mmPerPx:.2}},
  x=>x.math={typedInput:{kind:'segment-circle',revision:7}},
  x=>x.independentBlindTestPassed=true
 ]){
  const r=structuredClone(original);change(r);
  assert.equal((await verify(file,r,webcrypto.subtle)).status,'not-verified');
 }
});
test('changing a recorded review revision is detected even with a caller-modified binding field',async()=>{
 const file=photo([1,2,3,4,5,6]);
 const record=await pack(file,{review:{draftRevision:5,selectedPathId:'manual-1'}});
 assert.equal((await verify(file,record,webcrypto.subtle)).status,'reproducible-local-file-review-binding');
 for(const value of [4,6]){
  const bad=structuredClone(record);
  bad.review.draftRevision=value;
  bad.byteReviewBinding.draftRevision=value;
  assert.equal((await verify(file,bad,webcrypto.subtle)).status,'not-verified');
 }
});
test('record fingerprint is domain separated from original photo bytes and full JSON, is deterministic for unchanged fields',async()=>{
 const file=photo([5,6,7,8]);
 const record=await pack(file);
 const {byteReviewBinding,...bare}=record;
 const recomputed=await hashCaseRecord(bare,webcrypto.subtle);
 assert.equal(recomputed,byteReviewBinding.digest);
 const recomputedAgain=await hashCaseRecord(bare,webcrypto.subtle);
 assert.equal(recomputedAgain,recomputed);
 assert.notEqual(recomputed,bare.source.sha256);
});
test('forged digest format, absent crypto, invalid metadata and missing photo bytes fail closed',async()=>{
 const file=photo([0,1,2]);
 const r=await pack(file);
 for(const tamper of [x=>x.byteReviewBinding.digest='ab',
  x=>x.byteReviewBinding.algorithm='SHA-1',
  x=>x.byteReviewBinding.photoOriginIndependentlyAuthenticated=true,
  x=>x.source.sha256='ff'.repeat(32)]){
  const copy=structuredClone(r);tamper(copy);
  assert.equal((await verify(file,copy,webcrypto.subtle)).status,'not-verified');
 }
 assert.equal((await verify(null,r,webcrypto.subtle)).status,'not-verified');
 assert.equal((await verify(file,r,null)).status,'not-verified');
 await assert.rejects(bind({...r,byteReviewBinding:r.byteReviewBinding},webcrypto.subtle),
  /unbound/);
});
