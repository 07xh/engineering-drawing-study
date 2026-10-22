'use strict';
/**
 * 08 V3.4 - optional device-native OCR of a local browser image.
 *
 * Uses ONLY the browser's own TextDetector when available; no CDN, keys,
 * uploads, scripts, network requests, persistent storage, or fake OCR.
 * Its outputs remain UNSIGNED candidates, never metric geometry or a solution.
 */
const {parseTextCandidates}=require('./dimension-notation-candidates.cjs');

function validImage(image){
 const w=image?.naturalWidth,h=image?.naturalHeight;
 return Number.isSafeInteger(w)&&Number.isSafeInteger(h)&&
  w>=24&&h>=24&&w<=10000&&h<=10000&&w*h<=50000000;
}
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function normalizeNativeDetections(found,analysis,original){
 if(!Array.isArray(found))throw new TypeError('OCR returned non-array detections');
 if(found.length>150)throw new RangeError('OCR returned too many detections');
 if(!analysis||!original||
  ![analysis.width,analysis.height,original.width,original.height].every(
   x=>Number.isSafeInteger(x)&&x>=24&&x<=10000))
  throw new RangeError('invalid original or analysis dimensions');
 const sx=original.width/analysis.width,sy=original.height/analysis.height;
 const tokens=[];
 for(const item of found){
  const box=item?.boundingBox,raw=item?.rawValue;
  if(typeof raw!=='string'||raw.length>80||!box||
    ![box.x,box.y,box.width,box.height].every(finite))continue;
  const x=Math.max(0,box.x),y=Math.max(0,box.y);
  const right=Math.min(analysis.width,box.x+box.width);
  const bottom=Math.min(analysis.height,box.y+box.height);
  if(x>=right||y>=bottom)continue;
  const token={id:'ocr_'+(tokens.length+1),text:raw,
   bbox:[x*sx,y*sy,(right-x)*sx,(bottom-y)*sy],
   // Shape Detection API does not supply a calibrated OCR probability.
   confidence:0};
  tokens.push(token);
 }
 return parseTextCandidates(tokens,original);
}
async function detectBrowserDimensionCandidates(image,{
 TextDetectorCtor=typeof TextDetector==='function'?TextDetector:null,
 canvasFactory=()=>document.createElement('canvas'),
 maxEdge=1280
}={}){
 if(!validImage(image))
  return {status:'invalid-image',candidates:[],reason:'invalid local image dimensions'};
 if(typeof TextDetectorCtor!=='function')
  return {status:'unsupported',candidates:[],
   reason:'this browser does not provide native TextDetector'};
 if(!Number.isSafeInteger(maxEdge)||maxEdge<256||maxEdge>1536)
  throw new RangeError('invalid bounded OCR analysis dimension');
 const iw=image.naturalWidth,ih=image.naturalHeight;
 const scale=Math.min(1,maxEdge/Math.max(iw,ih));
 const w=Math.max(24,Math.floor(iw*scale));
 const h=Math.max(24,Math.floor(ih*scale));
 if(w*h>1600000)return {status:'invalid-image',candidates:[],
  reason:'OCR analysis exceeds the pixel budget'};
 try{
  const canvas=canvasFactory();
  if(!canvas||typeof canvas.getContext!=='function')
   throw new TypeError('local canvas unavailable');
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw new TypeError('Canvas 2D unavailable');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
  ctx.drawImage(image,0,0,w,h);
  const detector=new TextDetectorCtor();
  if(!detector||typeof detector.detect!=='function')
   throw new TypeError('native TextDetector implementation invalid');
  const detected=await detector.detect(canvas);
  return {status:'ok',
   candidates:normalizeNativeDetections(detected,{width:w,height:h},
    {width:iw,height:ih}),
   reason:'native local text proposals; each dimension must be reviewed'};
 }catch(error){
  return {status:'error',candidates:[],
   reason:error instanceof Error?error.message:'native OCR failed'};
 }
}
module.exports={validImage,normalizeNativeDetections,detectBrowserDimensionCandidates};
