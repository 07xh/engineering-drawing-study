'use strict';
/**
 * Explicit local dimension OCR review UI. Never assumes OCR accuracy or edits
 * any math value. OCR runs only on demand, when TextDetector is supported.
 */
const {detectBrowserDimensionCandidates}=
 require('../recognition/browser-native-dimension-ocr.cjs');
const {rankDimensionLinks}=
 require('../recognition/dimension-notation-candidates.cjs');
const {rankLeaderLineLinks}=
 require('../recognition/dimension-leader-association.cjs');
const {chooseOcrRadiusPrefill}=
 require('../recognition/reviewed-ocr-radius-prefill.cjs');
const SVG='http://www.w3.org/2000/svg';
function attachLocalNativeOcr({
 image,photoInput,photoClear,run,clear,overlay,status,selector,associate,
 sourceField,fieldReview,prefillButton,unitConfirmed,applyPrefill=()=>{},
 getCurves=()=>[],getLines=()=>[],recognize=detectBrowserDimensionCandidates,
 reviewedValue=null,reviewAccept=null,reviewButton=null,
 getValues=()=>({}),getRevision=()=>0
}){
 let epoch=0,candidates=[];
 const hasReview=Boolean(reviewedValue||reviewAccept||reviewButton);
 if(hasReview&&(!reviewedValue||!reviewAccept||!reviewButton||
   typeof fieldReview?.confirmNotation!=='function'||
   typeof getValues!=='function'||typeof getRevision!=='function'))
  throw new TypeError('audited OCR review controls must all be wired');
 const clearReview=()=>{
  if(!hasReview)return;
  reviewAccept.checked=false;reviewButton.disabled=true;reviewedValue.value='';
 };
 const item=(value,label)=>{
  const opt=document.createElement('option');
  opt.value=value;opt.textContent=label;return opt;
 };
 function reset(){
  epoch++;candidates=[];overlay.replaceChildren();overlay.hidden=true;
  selector.replaceChildren(item('','尚无 R/Φ 文字候选'));
  run.disabled=false;associate.disabled=true;prefillButton.disabled=true;
  clearReview();
  status.textContent='浏览器原生文字识别为可选实验功能；原图不上传。识别结果需要人工核对。';
 }
 function drawCandidates(){
  const w=image.naturalWidth,h=image.naturalHeight;
  overlay.replaceChildren();selector.replaceChildren(item('','选择一条待复核尺寸'));
  overlay.setAttribute('viewBox','0 0 '+w+' '+h);
  for(const x of candidates){
   const node=document.createElementNS(SVG,'rect');
   for(const [name,value] of Object.entries({
    x:x.bbox[0],y:x.bbox[1],width:x.bbox[2],height:x.bbox[3],
    fill:'rgba(204,115,33,.08)',stroke:'#c77b30','stroke-width':2,
    'stroke-dasharray':'5 3','data-unconfirmed-ocr':x.id
   }))node.setAttribute(name,String(value));
   overlay.append(node);
   selector.append(item(x.id,
    x.sourceText+' · '+(x.dimensionKind==='diameter'?'直径':'半径')+
    ' '+x.numericValue+'（待确认）'));
  }
  overlay.hidden=candidates.length===0;
  associate.disabled=candidates.length===0;
  prefillButton.disabled=candidates.length===0;
 }
 function describeSelected(){
  const dim=candidates.find(x=>x.id===selector.value);
  clearReview();
  if(!dim)return;
  if(hasReview){reviewedValue.value=String(dim.numericValue);reviewButton.disabled=false;}
  let nearby=[],leaders=[];
  try{
   const dimensions={width:image.naturalWidth,height:image.naturalHeight};
   leaders=rankLeaderLineLinks(dim,getLines(),getCurves(),dimensions);
   nearby=rankDimensionLinks(dim,getCurves(),dimensions);
  }catch(_){nearby=[];leaders=[];}
  const leaderText=leaders.length?
   '可能的尺寸引线（未验证箭头）'+leaders.map(x=>
    x.leaderCandidateId+' → '+x.geometryCandidateId+
    '，端点误差 '+x.totalEndpointErrorPx+'px').join('；')+'。':
   '未找到可靠的尺寸引线候选（不代表图中没有引线）。';
  status.textContent='OCR 候选 '+dim.sourceText+
   ' → 提议半径 '+dim.proposedRadiusValue+
   '（'+(dim.unitHint==='mm-explicit'?'含 mm 字样':'图纸单位尚未核实')+
   '）。'+leaderText+'按区域邻近的备选圆/弧：'+(nearby.length?
    nearby.map(x=>x.geometryCandidateId).join('、'):'暂无线索')+
   '。以上仅供人工核对，不会选择唯一图元或写入数学条件。';
 }
 const changedPhoto=()=>{unitConfirmed.checked=false;reset();};
 photoInput.addEventListener('change',changedPhoto);
 photoClear.addEventListener('click',changedPhoto);
 image.addEventListener('load',changedPhoto);
 image.addEventListener('error',changedPhoto);
 clear.addEventListener('click',changedPhoto);
 selector.addEventListener('change',describeSelected);
 if(hasReview){
  sourceField.addEventListener('change',()=>{reviewAccept.checked=false;});
  reviewedValue.addEventListener('input',()=>{reviewAccept.checked=false;});
  reviewButton.addEventListener('click',()=>{
   const dim=candidates.find(x=>x.id===selector.value);
   if(!dim){status.textContent='请先选择一条待审核的 R/Φ 文字。';return;}
   const value=reviewedValue.value.trim()===''?NaN:reviewedValue.valueAsNumber;
   try{
    const evidence=fieldReview.confirmNotation({
     candidate:dim,reviewedTextValueMm:value,
     currentModelValueMm:getValues()[sourceField.value],
     accepted:reviewAccept.checked,revision:getRevision()
    });
    reviewAccept.checked=false;
    status.textContent='已人工核对 '+evidence.sourceText+' → '+evidence.field+
     ' 的毫米值。还须逐项核对其余条件并执行最终确认；OCR 并非数学证明。';
   }catch(error){
    reviewAccept.checked=false;
    status.textContent='OCR 标注未确认：'+(error instanceof Error?error.message:'输入无效');
   }
  });
 }
 run.addEventListener('click',async()=>{
  reset();
  const thisEpoch=epoch;
  run.disabled=true;
  status.textContent='正在尝试在本地运行浏览器原生文字检测…';
  let output;
  try{output=await recognize(image);}
  catch(error){output={status:'error',candidates:[],
   reason:error instanceof Error?error.message:'local OCR failed'};}
  // A changed source photo must never display stale OCR candidates.
  if(epoch!==thisEpoch)return;
  run.disabled=false;
  if(output.status!=='ok'){
   status.textContent=output.status==='unsupported'
    ?'当前浏览器不支持原生 TextDetector，请继续手动核对尺寸。'
    :'本地文字识别不可用：'+String(output.reason||output.status);
   return;
  }
  const all=Array.isArray(output.candidates)?output.candidates:[];
  candidates=all.filter(x=>x&&x.coordinateSpace==='original-image-px'&&
   x.confirmed===false&&
   (x.dimensionKind==='radius'||x.dimensionKind==='diameter')).slice(0,50);
  drawCandidates();
  status.textContent=candidates.length?
   '本地识别到 '+candidates.length+
   ' 条 R/Φ 尺寸候选。请选择文字检查可能关联的圆弧，再确认实际毫米尺寸。':
   '当前图片未识别到可靠的 R/Φ 标注候选；不代表图纸没有尺寸。';
 });
 prefillButton.addEventListener('click',()=>{
  const dim=candidates.find(x=>x.id===selector.value);
  const outcome=chooseOcrRadiusPrefill(dim,sourceField.value,{
   unitAcknowledged:unitConfirmed.checked
  });
  if(outcome.status!=='ready-to-prefill'){
   status.textContent=outcome.reason;return;
  }
  const linked=fieldReview.markCandidate(dim);
  if(!linked.ok){status.textContent=linked.reason;return;}
  try{applyPrefill(outcome.field,outcome.value);}
  catch(error){status.textContent=error instanceof Error?
   error.message:'cannot prefill radius';return;}
  status.textContent='已预填 OCR 建议半径 '+outcome.value+
   ' mm，但尚未确认其正确性。旧动画已失效，请重新核对数值、'+
   '确认该字段及全部解题条件后再查看数学结果。';
 });
 associate.addEventListener('click',()=>{
  const dim=candidates.find(x=>x.id===selector.value);
  if(!dim){status.textContent='请先选择一条可见的 OCR 尺寸候选。';return;}
  if(!['filletRadius','r1','r2'].includes(sourceField.value)){
   status.textContent='OCR 半径/直径候选只能关联到半径字段；请先选择半径条件。';return;
  }
  const linked=fieldReview.markCandidate(dim);
  status.textContent=linked.ok?
   '已关联 '+dim.sourceText+' 的原图位置到当前半径条件。'+
   '建议检查半径 '+dim.proposedRadiusValue+
   '，但系统不会自动修改输入框；请人工修正并逐项确认。':
   linked.reason;
 });
 reset();
 return Object.freeze({reset,refreshAssociations(){if(selector.value)describeSelected();},
  get count(){return candidates.length}});
}
module.exports={attachLocalNativeOcr};
