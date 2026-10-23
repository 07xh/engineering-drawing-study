'use strict';
/**
 * Only local, in-browser reference-image preview. No OCR, no network,
 * no FileReader extraction, no persisted storage and no image upload.
 */
const SUPPORTED=Object.freeze(['image/jpeg','image/png','image/webp']);
const LIMIT=10*1024*1024;
function checkLocalImage(file){
 if(!file||typeof file!=='object')return {ok:false,reason:'请选择一张本地图片'};
 if(!SUPPORTED.includes(file.type))return {ok:false,
  reason:'仅支持 JPG、PNG 或 WebP 图片；不接受 SVG'};
 if(!Number.isSafeInteger(file.size)||file.size<1||file.size>LIMIT)
  return {ok:false,reason:'图片必须小于或等于 10 MB，且不能为空'};
 return {ok:true,reason:'图片只在当前浏览器中显示，不发送到服务器'};
}
function attachLocalImagePreview({input,image,status,clear,urls=URL,host=window}){
 for(const [name,node] of Object.entries({input,image,status,clear}))
  if(!node||typeof node.addEventListener!=='function')
   throw new TypeError('missing local preview control: '+name);
 if(!urls||typeof urls.createObjectURL!=='function'||
    typeof urls.revokeObjectURL!=='function')
  throw new TypeError('local blob URL operations required');
 let active=null;
 function release(){
  if(active!==null){urls.revokeObjectURL(active);active=null;}
  image.removeAttribute('src');image.hidden=true;
 }
 function show(){
  release();
  const file=input.files?.[0];
  const report=checkLocalImage(file);
  if(!report.ok){status.textContent=report.reason;return report;}
  try{active=urls.createObjectURL(file);}
  catch(_){status.textContent='无法打开图片，请重新选择';return {ok:false,reason:status.textContent};}
  image.src=active;image.hidden=false;
  status.textContent=report.reason+'；请在下方手动确认尺寸（AI 识图尚未上线）。';
  return report;
 }
 function reset(){release();input.value='';status.textContent='未选择原题图片；本地预览不会上传文件。';}
 input.addEventListener('change',show);
 clear.addEventListener('click',reset);
 if(host&&typeof host.addEventListener==='function')host.addEventListener('pagehide',release);
 return Object.freeze({show,reset,release});
}
module.exports={SUPPORTED,LIMIT,checkLocalImage,attachLocalImagePreview};
