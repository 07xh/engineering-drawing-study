'use strict';
/**
 * Hash original, selected local image bytes only on deliberate user action.
 * The digest may identify identical images; it is NOT anonymization.
 * No network, remote OCR, persistence or photo content in the output.
 */
async function fingerprintLocalPhoto(file,subtle=typeof crypto==='object'?crypto.subtle:null){
 if(!file||typeof file.arrayBuffer!=='function'||
  !['image/jpeg','image/png','image/webp'].includes(file.type)||
  !Number.isSafeInteger(file.size)||file.size<=0||file.size>15*1024*1024)
  throw new TypeError('valid original local photo (<=15 MB) required');
 if(!subtle||typeof subtle.digest!=='function')
  throw new TypeError('secure-context Web Crypto SHA-256 is unavailable');
 const bytes=await file.arrayBuffer();
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==file.size)
  throw new TypeError('original local photo bytes are incomplete');
 const digest=await subtle.digest('SHA-256',bytes);
 const result=Array.from(new Uint8Array(digest),
  value=>value.toString(16).padStart(2,'0')).join('');
 if(!/^[0-9a-f]{64}$/.test(result))
  throw new TypeError('unexpected SHA-256 digest');
 return result;
}
/**
 * Bind comparisons to identical user-labelled geometries, including typed
 * dimension transcription. Only a SHA-256 digest is retained in baseline.
 */
async function fingerprintManualTruth(annotations,subtle=typeof crypto==='object'?crypto.subtle:null){
 if(!Array.isArray(annotations)||annotations.length>100||!subtle||
  typeof subtle.digest!=='function')throw new TypeError('manual annotations and Web Crypto required');
 const json=JSON.stringify(annotations);
 if(typeof json!=='string'||json.length>40000)
  throw new RangeError('manual annotation payload exceeds digest budget');
 const digest=await subtle.digest('SHA-256',new TextEncoder().encode(json));
 const hex=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
 if(!/^[0-9a-f]{64}$/.test(hex))throw new TypeError('invalid annotation fingerprint');
 return hex;
}
module.exports={fingerprintLocalPhoto,fingerprintManualTruth};
