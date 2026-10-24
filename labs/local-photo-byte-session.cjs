'use strict';
/**
 * Ephemeral, browser-local SHA-256 of CURRENT selected original image bytes.
 * Reuses the same WebCrypto original-photo hasher as optional export.
 * No file names, image bytes or hash are sent over the network.
 */
const {fingerprintLocalPhoto}=
 require('../recognition/local-photo-fingerprint.cjs');
function attachLocalPhotoByteSession({
 fileInput,photoClear,image,status=null,retry=null,
 subtle=typeof crypto==='object'?crypto.subtle:null
}={}){
 if(!fileInput||!photoClear||!image||
    typeof fileInput.addEventListener!=='function'||
    typeof photoClear.addEventListener!=='function')
  throw new TypeError('current local photo controls required');
 let epoch=0,record=null,busy=false;
 function setStatus(message,kind){
  if(status){
   status.textContent=message;
   if(typeof status.setAttribute==='function')
    status.setAttribute('data-photo-byte-status',kind);
  }
  if(retry)retry.disabled=busy||!fileInput.files?.[0];
 }
 const invalidate=()=>{
  epoch++;record=null;busy=false;
  setStatus('当前原图字节校验已失效。请选择原图或重新校验。','invalid');
 };
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
 function updateReadiness(){
  if(busy)return;
  if(!record){
   setStatus('尚未完成原图 SHA-256 校验，不能将该图片用于 M3 来源审核。','invalid');
  }else if(snapshot()){
   setStatus('原图字节 SHA-256 已在本机计算，尺寸已读取。继续人工核对双比例尺及数学条件；照片真实性尚未独立证明。','ready');
  }else{
   setStatus('原图已完成字节校验，正在等待正确的图片尺寸；暂不可进行 M3 审核。','waiting-image');
  }
 }
 async function hashCurrent(){
  invalidate();
  const current=epoch,file=fileInput.files?.[0];
  if(!file){setStatus('请选择原题图片后，在本机校验来源字节。','no-photo');return null;}
  busy=true;
  setStatus('正在本机计算当前原题文件的 SHA-256；尚不可进入 M3 来源审核。','hashing');
  try{
   const sha256=await fingerprintLocalPhoto(file,subtle);
   if(current!==epoch||fileInput.files?.[0]!==file)return null;
   record={file,epoch:current,sha256};
   busy=false;
   updateReadiness();
   return snapshot();
  }catch(_error){
   if(current!==epoch)return null;
   record=null;busy=false;
   setStatus('当前文件 SHA-256 校验失败（例如浏览器安全环境不可用）；请检查原图并点击重新校验。','failed');
   return null;
  }
 }
 fileInput.addEventListener('change',()=>{void hashCurrent();});
 photoClear.addEventListener('click',invalidate);
 if(image&&typeof image.addEventListener==='function'){
  image.addEventListener('load',updateReadiness);
  image.addEventListener('error',()=>{
   invalidate();
   setStatus('原图无法正确解码显示，禁止继续 M3 审核。','failed');
  });
 }
 if(retry){
  if(typeof retry.addEventListener!=='function')
   throw new TypeError('SHA-256 retry control must be interactive');
  retry.addEventListener('click',()=>{void hashCurrent();});
 }
 setStatus('请选择原题图片后，在本机校验来源字节。','no-photo');
 return Object.freeze({snapshot,hashCurrent,invalidate});
}
module.exports={attachLocalPhotoByteSession};
