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
module.exports={fingerprintLocalPhoto};
