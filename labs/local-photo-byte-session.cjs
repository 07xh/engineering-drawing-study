'use strict';
/**
 * Ephemeral, browser-local SHA-256 of CURRENT selected original image bytes.
 * Reuses the same WebCrypto original-photo hasher as optional export.
 * No file names, image bytes or hash are sent over the network.
 */
const {fingerprintLocalPhoto}=
 require('../recognition/local-photo-fingerprint.cjs');
function attachLocalPhotoByteSession({
 fileInput,photoClear,image,subtle=typeof crypto==='object'?crypto.subtle:null
}={}){
 if(!fileInput||!photoClear||!image||
    typeof fileInput.addEventListener!=='function'||
    typeof photoClear.addEventListener!=='function')
  throw new TypeError('current local photo controls required');
 let epoch=0,record=null;
 const invalidate=()=>{epoch++;record=null;};
 function snapshot(){
  const file=fileInput.files?.[0],r=record,
   width=image.naturalWidth,height=image.naturalHeight;
  if(!r||r.file!==file||!Number.isSafeInteger(width)||
     !Number.isSafeInteger(height)||width<24||height<24||
     width>10000||height>10000||width*height>5e7)
   return null;
  return Object.freeze({sha256:r.sha256,epoch:r.epoch,
   width,height,originalFileBytesRead:true,
   sourceTruthIndependentlyProven:false});
 }
 async function hashCurrent(){
  invalidate();
  const current=epoch,file=fileInput.files?.[0];
  if(!file)return null;
  try{
   const sha256=await fingerprintLocalPhoto(file,subtle);
   if(current!==epoch||fileInput.files?.[0]!==file)return null;
   record={file,epoch:current,sha256};
   return snapshot();
  }catch(_error){
   // Insecure contexts or invalid/changed images cannot authorize an
   // M3 source. The next deliberate user selection retries hashing.
   return null;
  }
 }
 fileInput.addEventListener('change',()=>{void hashCurrent();});
 photoClear.addEventListener('click',invalidate);
 return Object.freeze({snapshot,hashCurrent,invalidate});
}
module.exports={attachLocalPhotoByteSession};
