'use strict';
/**
 * Explicit local dimension OCR review UI. Never assumes OCR accuracy or edits
 * any math value. OCR runs only on demand, when TextDetector is supported.
 */
const {detectBrowserDimensionCandidates}=
 require('../recognition/browser-native-dimension-ocr.cjs');
const {rankDimensionLinks}=
 require('../recognition/dimension-notation-candidates.cjs');
const SVG='http://www.w3.org/2000/svg';
function attachLocalNativeOcr({
 image,photoInput,photoClear,run,clear,overlay,status,selector,associate,
 sourceField,fieldReview,getCurves=()=>[],recognize=detectBrowserDimensionCandidates
}){
 let epoch=0,candidates=[];
 const item=(value,label)=>{
  const opt=document.createElement('option');
  opt.value=value;opt.textContent=label;return opt;
 };
 function reset(){
  epoch++;candidates=[];overlay.replaceChildren();overlay.hidden=true;
  selector.replaceChildren(item('','尚无 R/Φ 文字候选'));
  run.disabled=false;associate.disabled=true;
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
 }
 function describeSelected(){
  const dim=candidates.find(x=>x.id===selector.value);
  if(!dim)return;
  let nearby=[];
  try{
   nearby=rankDimensionLinks(dim,getCurves(),
    {width:image.naturalWidth,height:image.naturalHeight});
  }catch(_){nearby=[];}
  status.textContent='OCR 候选 '+dim.sourceText+
   ' → 提议半径 '+dim.proposedRadiusValue+
   '（'+(dim.unitHint==='mm-explicit'?'含 mm 字样':'图纸单位尚未核实')+
   '）；可能相关的圆/弧：'+(nearby.length?
    nearby.map(x=>x.geometryCandidateId).join('、'):'暂无线索')+
   '。OCR 不会填入毫米尺寸，必须人工复核。';
 }
 photoInput.addEventListener('change',reset);
 photoClear.addEventListener('click',reset);
 image.addEventListener('load',reset);
 image.addEventListener('error',reset);
 clear.addEventListener('click',reset);
 selector.addEventListener('change',describeSelected);
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
 return Object.freeze({reset,get count(){return candidates.length}});
}
module.exports={attachLocalNativeOcr};
