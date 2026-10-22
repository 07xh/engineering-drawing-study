'use strict';
/**
 * Standalone export contract for the opt-in five-crosshair local touch check.
 * Do NOT add original photo bytes, OCR results, filenames, hashes, UA,
 * device identifiers, IP/location or the session's manual annotations.
 */
const VERSION='draftai-photo-touch-diagnostic/1';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function buildTouchDiagnosticReport(snapshot){
 if(!snapshot||snapshot.status!=='complete'||
  snapshot.index!==5||snapshot.total!==5||
  !Array.isArray(snapshot.errors)||snapshot.errors.length!==5||
  snapshot.errors.some(x=>!finite(x)||x<0||x>15000))
  throw new TypeError('five completed human taps required');
 const samples=snapshot.errors.map(x=>Number(x.toFixed(2)));
 const mean=Number((samples.reduce((s,x)=>s+x,0)/5).toFixed(2));
 const max=Number(Math.max(...samples).toFixed(2));
 if(!finite(snapshot.meanErrorPx)||!finite(snapshot.maxErrorPx)||
  Math.abs(snapshot.meanErrorPx-mean)>0.011||
  Math.abs(snapshot.maxErrorPx-max)>0.011||
  snapshot.isDeviceCertification!==false)
  throw new TypeError('inconsistent or overclaimed touch diagnostic');
 return Object.freeze({
  schema:VERSION,
  source:'human-tap-five-point-local-only',
  sampleCount:5,
  deviationsInOriginalImagePx:samples,
  meanDeviationPx:mean,maxDeviationPx:max,
  includesImageBytes:false,
  includesFileFingerprint:false,
  includesOriginalImageDimensions:false,
  deviceAccuracyCertified:false,
  caveat:'Includes human tapping and browser rendering variation; not a touch hardware precision measurement'
 });
}
module.exports={buildTouchDiagnosticReport};
