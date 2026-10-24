'use strict';
/**
 * DOMAIN-SEPARATED local, exported photo-byte / reviewed-record SHA-256.
 * Reuses the single existing browser original-photo byte hasher.
 *
 * Digest equality proves reproducible contents for the current local file,
 * NOT authentic image provenance, measurement correctness, absence of answer
 * marks, a cryptographic signature or permission for M0/M3/V5 signoff.
 */
const {fingerprintLocalPhoto}=
 require('../recognition/local-photo-fingerprint.cjs');
const SCHEMA='draftai-private-photo-byte-review-binding/1';
const CASE='draftai-private-photo-case/1';
const hex=/^[0-9a-f]{64}$/;
const defaultSubtle=()=>typeof crypto==='object'?crypto.subtle:null;
function validateRecord(record){
 if(!record||typeof record!=='object'||Array.isArray(record)||
    record.schema!==CASE||!record.source||!hex.test(record.source.sha256)||
    Object.hasOwn(record,'byteReviewBinding'))
  throw new TypeError('unbound, finite reviewed-photo case record required');
 const json=JSON.stringify(record);
 if(typeof json!=='string'||json.length>280000)
  throw new RangeError('bounded photo review record required');
 return json;
}
function digestHex(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength!==32)
  throw new TypeError('SHA-256 must return 32 bytes');
 return Array.from(new Uint8Array(buffer),
  n=>n.toString(16).padStart(2,'0')).join('');
}
async function hashCaseRecord(record,subtle=defaultSubtle()){
 if(!subtle||typeof subtle.digest!=='function')
  throw new TypeError('secure-context Web Crypto SHA-256 required');
 const json=validateRecord(record);
 const payload=new TextEncoder().encode(SCHEMA+'\n'+json);
 return digestHex(await subtle.digest('SHA-256',payload));
}
function constantHexEqual(a,b){
 if(typeof a!=='string'||typeof b!=='string'||a.length!==64||b.length!==64)
  return false;
 let diff=0;
 for(let i=0;i<64;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}
async function bindPrivatePhotoCase(record,subtle=defaultSubtle()){
 const hash=await hashCaseRecord(record,subtle);
 const draftRevision=record.review?.draftRevision??null;
 return {...record,byteReviewBinding:Object.freeze({
  schema:SCHEMA,algorithm:'SHA-256',digest:hash,
  originalPhotoSha256:record.source.sha256,
  draftRevision,
  // Stable content equality only; neither reviewer, camera nor textbook
  // identities have been independently verified by this calculation.
  currentFileContentReproducible:true,
  photoOriginIndependentlyAuthenticated:false,
  reviewedMeasurementsIndependentlyVerified:false,
  sourceAnswerIsolationVerified:false
 })};
}
async function verifyPrivatePhotoCase(file,record,subtle=defaultSubtle()){
 try{
  if(!record||record.schema!==CASE||
     !record.byteReviewBinding||
     record.byteReviewBinding.schema!==SCHEMA||
     record.byteReviewBinding.algorithm!=='SHA-256'||
     !hex.test(record.byteReviewBinding.digest)||
     !hex.test(record.byteReviewBinding.originalPhotoSha256)||
     record.byteReviewBinding.photoOriginIndependentlyAuthenticated!==false||
     record.byteReviewBinding.reviewedMeasurementsIndependentlyVerified!==false||
     record.byteReviewBinding.sourceAnswerIsolationVerified!==false)
   return {status:'not-verified',reason:'missing or invalid byte-review binding'};
  const {byteReviewBinding:binding,...unbound}=record;
  const photoHash=await fingerprintLocalPhoto(file,subtle);
  if(!constantHexEqual(photoHash,unbound.source?.sha256)||
     !constantHexEqual(photoHash,binding.originalPhotoSha256)||
     binding.draftRevision!==(unbound.review?.draftRevision??null))
   return {status:'not-verified',reason:'source-photo bytes or review revision changed'};
  const actualHash=await hashCaseRecord(unbound,subtle);
  if(!constantHexEqual(actualHash,binding.digest))
   return {status:'not-verified',reason:'review/math/source payload changed'};
  return {status:'reproducible-local-file-review-binding',
   sourceBytesMatch:true,reviewRecordUnchanged:true,
   photoOriginIndependentlyAuthenticated:false,
   reviewedMeasurementsIndependentlyVerified:false,
   sourceAnswerIsolationVerified:false,
   constructionAndV5Certified:false};
 }catch(_error){
  return {status:'not-verified',reason:'file, source binding or crypto unavailable'};
 }
}
module.exports={SCHEMA,hashCaseRecord,bindPrivatePhotoCase,verifyPrivatePhotoCase};
