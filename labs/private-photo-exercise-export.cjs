'use strict';
/**
 * Local-only, explicit download from the CURRENT selected user's question
 * image. Reuses the existing WebCrypto image fingerprint: SHA-256 is a
 * potentially identifying hash and is NOT shared unless the user exports it.
 */
const {fingerprintLocalPhoto}=
 require('../recognition/local-photo-fingerprint.cjs');
const {makePrivatePhotoCase}=
 require('../benchmark/private-photo-exercise-dossier.cjs');
function attachPrivatePhotoCaseExport({
 fileInput,photoClear,image,role,accepted,button,status,
 getEvidence,getCandidates,getGeneration,getCurrentLive,
 subtle=typeof crypto==='object'?crypto.subtle:null,
 urls=URL,dom=document
}={}){
 for(const n of [fileInput,photoClear,image,role,accepted,button,status])
  if(!n||typeof n.addEventListener!=='function')
   throw new TypeError('incomplete private original-question controls');
 for(const cb of [getEvidence,getCandidates,getGeneration,getCurrentLive])
  if(typeof cb!=='function')throw new TypeError('current review and M3 hooks required');
 if(!urls||typeof urls.createObjectURL!=='function'||
  typeof urls.revokeObjectURL!=='function')
  throw new TypeError('local-only download Blob URL API required');
 let epoch=0,busy=false;
 const invalidate=()=>{
  epoch++;
  accepted.checked=false;
  button.disabled=false;
  status.textContent='原图或审核来源已变化：此前的照片指纹与逐题证据不再有效。';
 };
 fileInput.addEventListener('change',invalidate);
 photoClear.addEventListener('click',invalidate);
 async function save(){
  if(busy)return;
  const file=fileInput.files?.[0],currentImage={
   width:image.naturalWidth,height:image.naturalHeight
  };
  if(!file||!accepted.checked){
   status.textContent='请先选择原题图片，并确认本地记录的隐私与验收范围。';
   return;
  }
  const capturedEpoch=epoch,generation=getGeneration();
  const evidenceBefore=getEvidence();
  const beforeKey=JSON.stringify(evidenceBefore);
  busy=true;button.disabled=true;
  try{
   // Hash the CURRENT original selected file, not raster analysis canvas or
   // a reference solution. Bytes are released after hashing.
   const sha256=await fingerprintLocalPhoto(file,subtle);
   if(epoch!==capturedEpoch||fileInput.files?.[0]!==file||
      getGeneration()!==generation||
      JSON.stringify(getEvidence())!==beforeKey)
    throw new RangeError('图片、识图候选或审核版本已更改，请重新生成记录');
   const evidence=getEvidence();
   const candidates=getCandidates();
   const live=getCurrentLive();
   const output=makePrivatePhotoCase({
    photoSha256:sha256,image:currentImage,
    sourceRole:role.value,detectorCandidates:candidates,
    detectorGeneration:generation,
    reviewedAssociation:evidence?.reviewedAssociation??null,
    acceptedDraft:evidence?.acceptedDraft??null,
    calibration:evidence?.calibration??null,
    preparedProblem:evidence?.preparedProblem??null,
    actualM3:evidence?.actualM3??null,
    liveInput:live?.input??null,
    liveV5Ready:live?.ready===true
   });
   if(epoch!==capturedEpoch||fileInput.files?.[0]!==file||
      getGeneration()!==generation||
      JSON.stringify(getEvidence())!==beforeKey)
    throw new RangeError('记录生成期间原题来源发生变化');
   const json=JSON.stringify(output,null,2);
   if(json.length>300000)throw new RangeError('逐题证据超出本地文件大小限制');
   const objectUrl=urls.createObjectURL(new Blob([json],{type:'application/json'}));
   try{
    const link=dom.createElement('a');
    link.download='draftai-private-photo-case-'+sha256.slice(0,12)+'.json';
    link.href=objectUrl;
    link.hidden=true;dom.body.append(link);link.click();link.remove();
   }finally{
    // The browser has started the explicit download; release ephemeral URL.
    setTimeout(()=>urls.revokeObjectURL(objectUrl),0);
   }
   status.textContent='仅本机导出逐题证据：'+output.status+
    '。包含原图 SHA-256、人工候选与毫米条件，不含照片字节。'+
    ' 无答案独立盲测通过数仍为 0；请勿把本文件公开上传。';
  }catch(err){
   status.textContent='本地记录未生成：'+(err?.message||'来源核验失败');
  }finally{busy=false;button.disabled=false;accepted.checked=false}
 }
 button.addEventListener('click',save);
 return Object.freeze({save,invalidate});
}
module.exports={attachPrivatePhotoCaseExport};
