'use strict';
/**
 * Read only current browser API presence for on-device QA troubleshooting.
 * No UA, device ID, personal files, account tokens, image data or network.
 * API presence is not execution proof; especially native TextDetector.
 */
function inspectLocalQaCapabilities(runtime,doc){
 const env=runtime||{};
 const documentApi=doc||env.document;
 const available=name=>typeof env[name]==='function';
 let canvas2D=false;
 try{
  if(typeof documentApi?.createElement==='function'){
   const canvas=documentApi.createElement('canvas');
   canvas2D=!!canvas&&typeof canvas.getContext==='function'&&
    !!canvas.getContext('2d');
  }
 }catch(_){canvas2D=false;}
 const cryptoDigest=typeof env.crypto?.subtle?.digest==='function';
 const filePreview=typeof env.URL?.createObjectURL==='function'&&
  typeof env.URL?.revokeObjectURL==='function';
 const api=Object.freeze({
  secureContext:env.isSecureContext===true,
  canvas2D,
  pointerEvents:available('PointerEvent'),
  localObjectUrl:filePreview,
  sha256WebCrypto:cryptoDigest,
  nativeTextDetectorPresent:available('TextDetector')
 });
 return Object.freeze({
  schema:'draftai-local-browser-qa-capabilities/1',
  source:'local-browser-api-presence-only',
  api,
  localPhotoQaUsable:api.canvas2D&&api.localObjectUrl&&api.pointerEvents,
  originalPhotoHashUsable:api.sha256WebCrypto&&api.secureContext,
  ocrStatus:api.nativeTextDetectorPresent?
   'API-present-execution-unverified':'API-absent-OCR-not-evaluated',
  noImageOpenedOrUploaded:true,
  noDeviceIdentifiersCollected:true,
  notDeviceOrOCRCertification:true
 });
}
module.exports={inspectLocalQaCapabilities};
