'use strict';
/**
 * Optional browser-native OCR review for a LOCAL reference image.
 * Candidate selection never writes model-mm fields or bypasses strict
 * per-field source review. The raw photo never leaves this browser.
 */
const {detectBrowserDimensionCandidates}=require('../recognition/browser-native-dimension-ocr.cjs');
function attachLocalDimensionReview({
 image,photoInput,photoClear,kind,run,clear,candidateSelect,
 reviewedValue,accept,stage,status,fieldReview,
 getValues,getRevision,detectImpl=detectBrowserDimensionCandidates,
 dom=document
}){
 for(const element of [image,photoInput,photoClear,kind,run,clear,candidateSelect,
  reviewedValue,accept,stage,status,fieldReview])
  if(!element)throw new TypeError('native dimension review controls missing');
 if(typeof getValues!=='function'||typeof getRevision!=='function'||
  typeof detectImpl!=='function')throw new TypeError('current reviewed field values required');
 let epoch=0,candidates=[],pending=false;
 const opt=(value,label)=>{
  const node=dom.createElement('option');
  node.value=value;node.textContent=label;return node;
 };
 const reset=()=>{
  epoch++;pending=false;candidates=[];
  candidateSelect.replaceChildren(opt('','请先在本地检测 R/Φ 文字'));
  candidateSelect.value='';
  reviewedValue.value='';accept.checked=false;
  stage.disabled=true;
  status.textContent='候选文字未确认；仅支持当前浏览器原生 OCR，所有尺寸仍需人工核对。';
 };
 const current=()=>candidates.find(c=>c.id===candidateSelect.value);
 const refresh=()=>{
  const c=current();
  accept.checked=false;stage.disabled=!c;
  reviewedValue.value=c?String(c.numericValue):'';
 };
 photoInput.addEventListener('change',reset);
 photoClear.addEventListener('click',reset);
 image.addEventListener('load',reset);
 image.addEventListener('error',reset);
 clear.addEventListener('click',reset);
 kind.addEventListener('change',reset);
 candidateSelect.addEventListener('change',refresh);
 reviewedValue.addEventListener('input',()=>{accept.checked=false;});
 run.addEventListener('click',async()=>{
  reset();
  if(image.hidden||!image.complete||!image.naturalWidth||!image.naturalHeight){
   status.textContent='先选择并加载有效的本地原题图片。';return;
  }
  const ticket=epoch;pending=true;run.disabled=true;
  status.textContent='正在调用当前浏览器的本机 OCR；没有上传图片。';
  try{
   const result=await detectImpl(image);
   if(ticket!==epoch)return; // clear, new file or new kind invalidates pending OCR
   if(!result||result.status!=='ok'){
    status.textContent=result?.status==='unsupported'
      ?'当前浏览器不支持原生 TextDetector；可继续使用手工来源框选与数值确认。'
      :'本地图像文字检测不可用；请手动核对尺寸，不能自动推断答案。';
    return;
   }
   if(!Array.isArray(result.candidates)||result.candidates.length>150)
    throw new TypeError('unbounded OCR candidate collection');
   candidates=result.candidates;
   candidateSelect.replaceChildren(opt('','选择一项待核对的 R/Φ'));
   for(const c of candidates){
    if(typeof c?.id!=='string'||typeof c.sourceText!=='string'||
       c.sourceText.length>80||!['radius','diameter'].includes(c.dimensionKind))
      throw new TypeError('malformed OCR dimension suggestion');
    candidateSelect.append(opt(c.id,c.sourceText+' · '+c.id+' · 未经核验'));
   }
   status.textContent=candidates.length
    ?'发现 '+candidates.length+' 项本地 R/Φ 文字候选。选择候选及右侧当前字段，核对并修正毫米尺寸，再勾选确认；候选没有数学证明。'
    :'未发现明确的 R/Φ 标注，可能是漏检；请使用手工字段确认。';
  }catch(_){
   if(ticket===epoch){
    reset();
    status.textContent='无法安全处理本机 OCR 候选；请改用手动核对。';
   }
  }finally{
   if(ticket===epoch){pending=false;run.disabled=false;}
  }
 });
 stage.addEventListener('click',()=>{
  const c=current();
  if(pending||!c){status.textContent='先检测并选择有效的文字候选。';return;}
  const number=reviewedValue.value.trim()===''?NaN:reviewedValue.valueAsNumber;
  try{
   const fieldValue=getValues()[fieldReview.currentField()];
   const evidence=fieldReview.confirmNotation({
    candidate:c,reviewedTextValueMm:number,currentModelValueMm:fieldValue,
    accepted:accept.checked,revision:getRevision()
   });
   accept.checked=false;
   status.textContent='已人工核对 '+evidence.sourceText+' → '+evidence.field+
    '；仅此一项被确认。其他条件仍需逐项框选、核对，再点击“确认全部条件并解题”。';
  }catch(error){
   accept.checked=false;
   status.textContent='未接受文字候选：'+(error instanceof Error?error.message:'输入无效');
  }
 });
 reset();
 return Object.freeze({
  release(){reset();run.disabled=false;},
  get count(){return candidates.length;}
 });
}
module.exports={attachLocalDimensionReview};
