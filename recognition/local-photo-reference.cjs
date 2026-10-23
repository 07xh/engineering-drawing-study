'use strict';
/**
 * Local-only optional ORIGINAL EXERCISE visual reference.
 * Reuses the project's existing manual condition-confirmation workflow;
 * this module does NOT perform OCR, image recognition or math inference.
 *
 * File bytes never enter module state; the browser owns a short-lived blob:
 * URL until the source is replaced, rejected or the page is closed.
 * The URL is never included in exported metadata / results / benchmark.
 * Neither image metadata nor a user assertion can certify blind-answer
 * isolation or completion of a real workbook exercise.
 */
const TYPES=Object.freeze(['image/png','image/jpeg','image/webp']);
const MAX_BYTES=15*1024*1024,MAX_EDGE=10000,MAX_PIXELS=50000000;
function createLocalPhotoReference(){
 let epoch=0,entry=null;
 function release(){
  if(!entry)return;
  const old=entry;entry=null;
  try{old.urls.revokeObjectURL(old.url);}catch(_error){
   // Release is best effort; no stale image may be displayed or certified.
  }
 }
 function clear(){
  ++epoch;release();
  return epoch;
 }
 function attach(file,urls){
  // Old visual evidence is always invalidated, including on bad replacement.
  clear();
  if(!file||!TYPES.includes(file.type)||
    !Number.isSafeInteger(file.size)||file.size<=0||file.size>MAX_BYTES)
   throw new TypeError('local PNG/JPEG/WebP image of at most 15 MB required');
  if(!urls||typeof urls.createObjectURL!=='function'||
    typeof urls.revokeObjectURL!=='function')
   throw new TypeError('browser-local object URL functions required');
  const url=urls.createObjectURL(file);
  if(typeof url!=='string'||!url.startsWith('blob:')){
   if(typeof url==='string')urls.revokeObjectURL(url);
   throw new TypeError('local blob URL required (no remote image URLs)');
  }
  entry={url,urls,type:file.type,sizeBytes:file.size,valid:false,dimensions:null};
  return Object.freeze({epoch,url});
 }
 function confirmImage(currentEpoch,width,height){
  if(currentEpoch!==epoch||!entry)return false;
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
     width<32||height<32||width>MAX_EDGE||height>MAX_EDGE||
     width*height>MAX_PIXELS){
   clear();
   throw new RangeError('local image dimensions exceed safe reference budget');
  }
  entry.dimensions={width,height};entry.valid=true;
  return true;
 }
 function rejectImage(currentEpoch){
  if(currentEpoch!==epoch||!entry)return false;
  clear();return true;
 }
 function snapshot(){
  return Object.freeze({
   epoch,ready:!!entry?.valid,sourceAttached:!!entry,
   dimensions:entry?.dimensions?Object.freeze({...entry.dimensions}):null,
   type:entry?.type??null,
   // Never persist file name, bytes, object URL, filename hash or annotations.
   imageBytesRetained:false,storedToNetwork:false,
   conditionRecognition:'not-run',
   mathSource:'manual-confirmed-fields-only',
   sourceScope:'local-reference-only',
   answerIsolationVerified:false,blindExerciseAccepted:false,
   solvedOriginalExercise:false
  });
 }
 return Object.freeze({attach,confirmImage,rejectImage,clear,snapshot});
}
module.exports={createLocalPhotoReference,MAX_BYTES,MAX_PIXELS,TYPES};
