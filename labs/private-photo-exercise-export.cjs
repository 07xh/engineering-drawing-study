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
const {bindPrivatePhotoCase}=
 require('../benchmark/private-photo-byte-review-binding.cjs');
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
  const file=fileInput.files?.[0];
  if(!file||!accepted.checked){
   status.textContent='请先选择原题图片，并确认本地记录的隐私与验收范围。';
   return;
  }
  // Take one coherent complete source/review/math snapshot BEFORE any
  // asynchronous byte digest. Candidate, role, image dimensions and
  // math/V5 session changes are just as invalidating as draft revisions.
  const capturedEpoch=epoch,generation=getGeneration();
  const snapshotNow=()=>({
   image:{width:image.naturalWidth,height:image.naturalHeight},
   sourceRole:role.value,
   evidence:getEvidence(),candidates:getCandidates(),
   live:getCurrentLive()
  });
  const captured=snapshotNow();
  const beforeKey=JSON.stringify(captured);
  const unchanged=()=>epoch===capturedEpoch&&
   fileInput.files?.[0]===file&&getGeneration()===generation&&
   JSON.stringify(snapshotNow())===beforeKey;
  busy=true;button.disabled=true;
  try{
   // Hash the CURRENT original selected file, not raster analysis canvas or
   // a reference solution. Bytes are released after hashing.
   const sha256=await fingerprintLocalPhoto(file,subtle);
   if(!unchanged())
    throw new RangeError('原图、识图候选、审核内容或当前数学会话已更改，请重新生成记录');
   // A real M0/M3 photo review may carry the in-memory SHA-256 from
   // the SAME current user-selected file. A mismatched hash cannot be
   // silently packaged as provenance in the private record.
   if(captured.evidence?.photoByteSha256&&
      captured.evidence.photoByteSha256!==sha256)
    throw new RangeError('原图字节与当前审核数学条件的 SHA-256 来源不一致');
   // Deep-copy only JSON-safe bounded evidence into this local export.
   // No later mutable getter may silently rewrite fields while hashing.
   const values=JSON.parse(beforeKey);
   const evidence=values.evidence,live=values.live;
   const output=makePrivatePhotoCase({
    photoSha256:sha256,image:values.image,
    sourceRole:values.sourceRole,detectorCandidates:values.candidates,
    detectorGeneration:generation,
    reviewedAssociation:evidence?.reviewedAssociation??null,
    acceptedDraft:evidence?.acceptedDraft??null,
    calibration:evidence?.calibration??null,
    preparedProblem:evidence?.preparedProblem??null,
    actualM3:evidence?.actualM3??null,
    liveInput:live?.input??null,
    liveV5Ready:live?.ready===true
   });
   if(!unchanged())
    throw new RangeError('记录生成期间原图、识图条件或数学会话发生变化');
   // Bind the current ORIGINAL photo-byte SHA-256 to every exported
   // source/review/calibration/M3 field in one domain-separated SHA-256.
   // This is re-verifiable LOCAL integrity, not a signature of source truth.
   const bound=await bindPrivatePhotoCase(output,subtle);
   if(!unchanged())
    throw new RangeError('原图、识图候选、审核或数学状态在绑定计算期间变化');
   const json=JSON.stringify(bound,null,2);
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
   status.textContent='仅本机导出逐题证据：'+bound.status+
    '。包含原图 SHA-256 与当前审核记录的可复算绑定，不含照片字节。'+
    ' 无答案独立盲测通过数仍为 0；请勿把本文件公开上传。';
  }catch(err){
   status.textContent='本地记录未生成：'+(err?.message||'来源核验失败');
  }finally{busy=false;button.disabled=false;accepted.checked=false}
 }
 button.addEventListener('click',save);
 return Object.freeze({save,invalidate});
}
module.exports={attachPrivatePhotoCaseExport};
