'use strict';
/**
 * Browser-only download adapter. The verified mathematical exporters, not the
 * screen SVG or user-provided source images, produce every saved file.
 */
const {exportVerifiedFilletSvg}=require('../export/verified-fillet-svg.cjs');
const {exportVerifiedFilletStepZip}=require('../export/verified-fillet-step-zip.cjs');

function attachVerifiedFilletDownloads({fullButton,stepsButton,includeGuides,status,
  getCurrent,doc=globalThis.document,urlApi=globalThis.URL,
  BlobCtor=globalThis.Blob}={}){
  if(!fullButton||!stepsButton||!includeGuides||!status||
     typeof getCurrent!=='function'||!doc?.createElement||!doc?.body||
     !urlApi?.createObjectURL||!urlApi?.revokeObjectURL||
     typeof BlobCtor!=='function')
    throw new TypeError('verified SVG export needs browser controls and Blob URL');
  const activeUrls=new Set();
  let enabled=false;
  let disposed=false;
  const clear=()=>{
    for(const value of activeUrls)urlApi.revokeObjectURL(value);
    activeUrls.clear();
  };
  function update(ready){
    enabled=ready===true&&!disposed;
    fullButton.disabled=!enabled;
    stepsButton.disabled=!enabled;
    if(!enabled)status.textContent='条件未经验证或已修改，请重新确认解分支后再导出。';
  }
  function verifiedInput(){
    if(!enabled||disposed)throw new RangeError('current verified construction required');
    const current=getCurrent();
    if(!current||current.ready!==true||!Number.isSafeInteger(current.revision)||
       current.revision<0||!current.input||
       current.input.problem?.revision!==current.revision)
      throw new RangeError('stale or unconfirmed geometry cannot be exported');
    return current;
  }
  function save(data,name,type){
    const blob=new BlobCtor([data],{type});
    const href=urlApi.createObjectURL(blob);
    activeUrls.add(href);
    try{
      const anchor=doc.createElement('a');
      anchor.href=href;anchor.download=name;anchor.rel='noopener';
      doc.body.appendChild(anchor);
      try{anchor.click();}finally{anchor.remove();}
    }catch(error){
      urlApi.revokeObjectURL(href);
      activeUrls.delete(href);
      throw error;
    }
    // Keep URL available for asynchronous Android/desktop download handling.
    if(typeof globalThis.setTimeout==='function')
      globalThis.setTimeout(()=>{
        if(activeUrls.delete(href))urlApi.revokeObjectURL(href);
      },3000);
  }
  function perform(kind){
    try{
      const current=verifiedInput();
      const include=includeGuides.checked===true;
      if(kind==='svg'){
        const file=exportVerifiedFilletSvg(current.input,{
          expectedRevision:current.revision,includeGuides:include});
        save(file.svg,'draftai-r'+file.revision+'-verified.svg',
          'image/svg+xml;charset=utf-8');
        status.textContent='完整 SVG 已发起本地下载（仅所选且验证过的圆弧分支）。';
      }else{
        const archive=exportVerifiedFilletStepZip(current.input,{
          expectedRevision:current.revision,includeGuides:include});
        save(archive.bytes,'draftai-r'+archive.revision+'-steps.zip',
          'application/zip');
        status.textContent='已发起 '+archive.fileCount+' 张步骤 SVG 的单个 ZIP 下载。';
      }
    }catch(error){
      status.textContent='无法导出：'+(error instanceof Error?error.message:'导出失败');
    }
  }
  const saveSvg=()=>perform('svg');
  const saveSteps=()=>perform('zip');
  fullButton.addEventListener('click',saveSvg);
  stepsButton.addEventListener('click',saveSteps);
  const api={update,release(){
    disposed=true;update(false);clear();
    fullButton.removeEventListener?.('click',saveSvg);
    stepsButton.removeEventListener?.('click',saveSteps);
  }};
  update(false);
  return api;
}
module.exports={attachVerifiedFilletDownloads};
