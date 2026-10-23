'use strict';
/** Manual image-region association and explicit per-dimension confirmation UI. */
const {createFieldReview}=require('../recognition/image-field-review.cjs');
const {stageReviewedImageDimension}=
 require('../recognition/reviewed-image-dimension-field.cjs');
const {kinds}=require('./auto-fillet-form.cjs');
const SVG='http://www.w3.org/2000/svg';
function attachImageFieldReview({
 image,photoInput,photoClear,mode,overlay,fieldSelect,
 confirmButton,acceptButton,status,values,onUpdate
}){
 const state=createFieldReview();
 const option=(id,name)=>{
  const o=document.createElement('option');o.value=id;o.textContent=name;return o;
 };
 function render(){
  const p=state.progress();
  overlay.replaceChildren();
  const info=state.image;
  if(info&&mode.checked){
   for(const box of state.boxes()){
    const node=document.createElementNS(SVG,'rect');
    for(const [k,v] of Object.entries({
     x:box.bbox[0],y:box.bbox[1],width:box.bbox[2],height:box.bbox[3],
     fill:box.confirmed?'rgba(47,137,85,.15)':'rgba(187,137,42,.12)',
     stroke:box.confirmed?'#237044':'#b17b24','stroke-width':2,
     'data-field-source':box.field
    }))node.setAttribute(k,String(v));
    overlay.append(node);
   }
  }
  overlay.hidden=!info||!mode.checked;
  confirmButton.disabled=!mode.checked||!info;
  acceptButton.disabled=!mode.checked||!info;
  status.textContent=!mode.checked
   ?'普通手动输入模式：图上的框选标记不参与求解。'
   :!info?'请先打开有效图片，再框选每个几何条件的来源。'
    :'已框选 '+p.marked+'/'+p.total+'，已逐项确认 '+p.confirmed+
      '/'+p.total+'；'+(p.accepted?'已完成最终确认。':
       '完成逐项确认后，请点击“确认全部条件并解题”。')+
      ' 标记仅是人工来源定位，并非 AI 自动识图。';
 }
 function setKind(kind){
  state.setKind(kind);
  fieldSelect.replaceChildren();
  const labels=[...kinds[kind].fields,['filletRadius','连接圆弧半径']];
  for(const [id,label] of labels)fieldSelect.append(option(id,label));
  render();
 }
 function resetImage(){
  state.setImage(null,null);
  overlay.removeAttribute('viewBox');render();onUpdate();
 }
 photoInput.addEventListener('change',resetImage);
 photoClear.addEventListener('click',resetImage);
 image.addEventListener('load',()=>{
  const ok=state.setImage(image.naturalWidth,image.naturalHeight);
  if(ok)overlay.setAttribute('viewBox',
   '0 0 '+image.naturalWidth+' '+image.naturalHeight);
  render();onUpdate();
 });
 image.addEventListener('error',resetImage);
 mode.addEventListener('change',()=>{render();onUpdate();});
 fieldSelect.addEventListener('change',render);
 let drag=null;
 const xy=event=>{
  const bounds=overlay.getBoundingClientRect();
  const info=state.image;
  if(!info||bounds.width<=0||bounds.height<=0)return null;
  return {x:Math.min(info.width,Math.max(0,
   (event.clientX-bounds.left)*info.width/bounds.width)),
   y:Math.min(info.height,Math.max(0,
   (event.clientY-bounds.top)*info.height/bounds.height))};
 };
 overlay.addEventListener('pointerdown',event=>{
  if(!mode.checked||!state.image||event.button>0)return;
  drag=xy(event);
  if(drag)overlay.setPointerCapture?.(event.pointerId);
 });
 overlay.addEventListener('pointerup',event=>{
  if(!drag)return;
  const end=xy(event),from=drag;drag=null;
  if(!end)return;
  const bbox=[Math.min(from.x,end.x),Math.min(from.y,end.y),
   Math.abs(from.x-end.x),Math.abs(from.y-end.y)];
  if(bbox[2]<2||bbox[3]<2){
   status.textContent='请在图片上拖出有宽度和高度的来源区域。';return;
  }
  try{state.mark(fieldSelect.value,bbox);}
  catch(e){status.textContent=e.message;return;}
  render();onUpdate();
 });
 overlay.addEventListener('pointercancel',()=>{drag=null;});
 confirmButton.addEventListener('click',()=>{
  const field=fieldSelect.value;
  try{state.confirm(field,values()[field]);}
  catch(e){status.textContent=e.message;return;}
  render();onUpdate();
 });
 acceptButton.addEventListener('click',()=>{
  if(!state.accept()){
   render();status.textContent+=' 请先框选并分别确认所有必需条件。';return;
  }
  render();onUpdate();
 });
 render();
 return Object.freeze({
  setKind,edited(field){state.edited(field);render();},
  confirmNotation({candidate,reviewedTextValueMm,currentModelValueMm,accepted,revision}){
   if(!mode.checked||!state.image)
    throw new RangeError('Enable strict review and load an original image first');
   const evidence=stageReviewedImageDimension({
    fieldReview:state,candidate,field:fieldSelect.value,
    reviewedTextValueMm,currentModelValueMm,accepted,revision
   });
   // Re-enter the OCR candidate ID ONLY as untrusted image provenance;
   // this does not confer OCR or metric certainty.
   if(/^ocr_[0-9]+$/.test(evidence.sourceId)){
    state.mark(fieldSelect.value,evidence.bbox,evidence.sourceId);
    state.confirm(fieldSelect.value,currentModelValueMm);
   }
   render();onUpdate();
   return evidence;
  },
  markCandidate(candidate){
   if(!mode.checked||!state.image)
    return {ok:false,reason:'请先打开图片并开启严格核对模式'};
   if(!candidate||candidate.coordinateSpace!=='original-image-px')
    return {ok:false,reason:'候选图像来源无效'};
   try{state.mark(fieldSelect.value,candidate.bbox,candidate.id);}
   catch(error){return {ok:false,reason:error.message};}
   render();onUpdate();
   return {ok:true,reason:'已关联来源区域；请再次确认当前毫米数值'};
  },
  isEnabled(){return mode.checked;},
  reviewedInput(kind,numbers,selection,revision){
   if(kind!==state.kind)return {status:'needs-confirmation',input:null};
   return state.review(numbers,selection,revision);
  },
  progress:state.progress
 });
}
module.exports={attachImageFieldReview};
