'use strict';
/** Browser-local raster proposal review. A picker, not an AI proof engine. */
const {candidateDraftFromRaster}=
 require('../recognition/raster-primitive-draft.cjs');
const {shapeKeys,prepareReviewedRasterImport}=
 require('./local-raster-fillet-import.cjs');
const {suggestMillimetresPerImagePixel}=
 require('./manual-raster-scale-calibration.cjs');

function attachLocalRasterReview({
 image,photoInput,photoClear,kind,first,second,preview,edits,
 originX,originY,mmPerPx,yAxis,filletRadiusMm,lineSide,
 scaleSource,scaleLength,scaleReviewed,scaleCalculate,scaleStatus,
 accepted,apply,status,onApply,dom=document
}){
 for(const node of [image,photoInput,photoClear,kind,first,second,preview,
  edits,originX,originY,mmPerPx,yAxis,filletRadiusMm,lineSide,
  scaleSource,scaleLength,scaleReviewed,scaleCalculate,scaleStatus,
  accepted,apply,status])
  if(!node)throw new TypeError('incomplete local raster review UI controls');
 if(typeof onApply!=='function')throw new TypeError('current workbench hook required');
 const SVG='http://www.w3.org/2000/svg';
 const parts={line:null,curve:null};
 let draft=null,controls={},generation=0,derivedScale=null;
 const option=(value,label)=>{
  const node=dom.createElement('option');node.value=value;node.textContent=label;
  return node;
 };
 const changed=()=>{accepted.checked=false;};
 function invalidateDerivedScale(){
  if(derivedScale){
   mmPerPx.value='';
   derivedScale=null;
   scaleStatus.textContent='已编辑标注线段或已知尺寸，旧的建议比例已失效；请重新校准。';
  }
  scaleReviewed.checked=false;
  changed();
 }
 function updateScaleSources(){
  const selected=scaleSource.value;
  scaleSource.replaceChildren(option('','请选择已核对真实长度的完整线段'));
  for(const id of [first.value,second.value]){
   if(controls[id]?.['from.x']&&controls[id]?.['to.x']){
    const item=draft?.candidates.find(x=>x.id===id);
    if(item?.kind==='segment')scaleSource.append(
     option(id,'有限线段 '+id+'（端点需与真实尺寸对应）'));
   }
  }
  if([...scaleSource.options].some(x=>x.value===selected))scaleSource.value=selected;
  else scaleSource.value='';
 }
 function reset(){
  invalidateDerivedScale();
  scaleSource.value='';scaleLength.value='';
  generation++;parts.line=null;parts.curve=null;draft=null;
  preview.replaceChildren();edits.replaceChildren();
  updateSelectors();
  status.textContent='本地照片尚无可审核图元。先检测直线与圆；尺寸比例必须由用户确认。';
  changed();
 }
 function previewShapes(){
  preview.replaceChildren();
  if(!draft)return;
  preview.setAttribute('viewBox','0 0 '+draft.image.width+' '+draft.image.height);
  for(const c of draft.candidates){
   if(c.kind==='arc')continue; // A limited arc is not a full-circle source.
   const g=c.geometry;
   const node=dom.createElementNS(SVG,c.kind==='segment'?'line':'circle');
   const attrs=c.kind==='segment'
    ?{x1:g.from.x,y1:g.from.y,x2:g.to.x,y2:g.to.y}
    :{cx:g.center.x,cy:g.center.y,r:g.radiusPx,fill:'none'};
   for(const [key,value] of Object.entries(attrs))
    node.setAttribute(key,String(value));
   node.setAttribute('stroke','#24805f');
   node.setAttribute('stroke-width','2');
   node.setAttribute('data-unconfirmed-primitive',c.id);
   preview.append(node);
  }
 }
 const fieldDefinitions=source=>source.kind==='segment'
  ?[['from.x','起点 X',source.geometry.from.x],
    ['from.y','起点 Y',source.geometry.from.y],
    ['to.x','终点 X',source.geometry.to.x],
    ['to.y','终点 Y',source.geometry.to.y]]
  :[['center.x','圆心 X',source.geometry.center.x],
    ['center.y','圆心 Y',source.geometry.center.y],
    ['radiusPx','半径（像素）',source.geometry.radiusPx]];
 function drawEdits(){
  invalidateDerivedScale();
  edits.replaceChildren();controls={};
  for(const id of [first.value,second.value]){
   const candidate=draft?.candidates.find(c=>c.id===id);
   if(!candidate||controls[id])continue;
   const container=dom.createElement('div');
   container.className='raster-edit-group';
   const heading=dom.createElement('strong');
   heading.textContent=candidate.id+' · '+(candidate.kind==='segment'?'线段':'整圆')+
    ' · 原图像素（可修改）';
   container.append(heading);
   const mapping={};
   for(const [key,name,value] of fieldDefinitions(candidate)){
    const label=dom.createElement('label');label.textContent=name;
    const input=dom.createElement('input');
    input.type='number';input.step='any';input.value=String(value);
    input.inputMode='decimal';
    input.addEventListener('input',invalidateDerivedScale);
    label.append(input);container.append(label);mapping[key]=input;
   }
   controls[id]=mapping;edits.append(container);
  }
  updateScaleSources();
  changed();
 }
 function updateSelectors(){
  lineSide.disabled=kind.value!=='segment-circle';
  lineSide.value='';
  changed();
  const requirements=shapeKeys[kind.value]||{};
  for(const [index,element] of [first,second].entries()){
   const name=Object.keys(requirements)[index],needed=requirements[name];
   element.replaceChildren(option('','选择'+(index?'第二':'第一')+'个源图元'));
   for(const c of draft?.candidates||[])
    if(c.kind===needed)
     element.append(option(c.id,c.id+' · '+(needed==='segment'?'有限线段':'整圆')+
      '（检测建议，未审核）'));
   element.value='';
  }
  drawEdits();
 }
 function renderDraft(){
  const line=parts.line,curve=parts.curve;
  const a=line?.raw.length?line:curve;
  draft=null;
  if(!a||!a.analysis){updateSelectors();previewShapes();return;}
  const b=line?.raw.length&&curve?.raw.length?curve:null;
  if(b&&(b.analysis.width!==a.analysis.width||
     b.analysis.height!==a.analysis.height||
     b.original.width!==a.original.width||
     b.original.height!==a.original.height)){
   updateSelectors();previewShapes();
   status.textContent='两次检测使用不同图像大小，请重新检测相同原题。';
   return;
  }
  const file=photoInput.files?.[0];
  const meta={width:image.naturalWidth,height:image.naturalHeight,
   byteLength:file?.size,mediaType:file?.type};
  try{
   const result=candidateDraftFromRaster({
    image:meta,analysis:a.analysis,
    lines:line?.raw||[],curves:curve?.raw||[]
   });
   draft=result.draft;
   updateSelectors();previewShapes();
   status.textContent='得到 '+draft.candidates.length+' 个本地图元候选（'+
    draft.candidates.filter(c=>c.kind==='arc').length+
    ' 个局部圆弧不能作为整圆导入）。请选择两个源图元、修正像素几何并核对毫米比例。';
  }catch(error){
   updateSelectors();previewShapes();
   status.textContent='尚不能构建可核对的几何草稿：'+
    (error instanceof Error?error.message:'无效像素图元');
  }
 }
 function update(group,rawInfo){
  if(!['line','curve'].includes(group))throw new TypeError('unknown detector source');
  if(!rawInfo||!Array.isArray(rawInfo.raw)||!rawInfo.raw.length)
   parts[group]=null;
  else parts[group]=rawInfo;
  changed();renderDraft();
 }
 scaleSource.addEventListener('change',invalidateDerivedScale);
 scaleLength.addEventListener('input',invalidateDerivedScale);
 scaleReviewed.addEventListener('change',changed);
 mmPerPx.addEventListener('input',()=>{
  derivedScale=null;
  scaleStatus.textContent='已手动更改毫米／像素比例，请重新确认所有相关条件。';
 });
 scaleCalculate.addEventListener('click',()=>{
  try{
   if(!draft)throw new RangeError('请先检测和选择需要校准的原题图元');
   const id=scaleSource.value;
   const source=draft.candidates.find(item=>item.id===id);
   const inputs=controls[id];
   if(source?.kind!=='segment'||!inputs)
    throw new TypeError('只能使用两项已选源图元中的有限线段');
   const num=key=>value(inputs[key]);
   const suggestion=suggestMillimetresPerImagePixel({
    from:{x:num('from.x'),y:num('from.y')},
    to:{x:num('to.x'),y:num('to.y')},
    knownLengthMm:value(scaleLength),image:draft.image,
    sourceId:id,explicitlyReviewed:scaleReviewed.checked
   });
   mmPerPx.value=String(suggestion.mmPerPx);
   derivedScale={sourceId:id,mmPerPx:suggestion.mmPerPx};
   changed();
   scaleStatus.textContent='建议比例 '+suggestion.mmPerPx.toPrecision(8)+
    ' mm/像素（原图基线 '+suggestion.pixelLength.toFixed(2)+
    ' 像素，人工核对长度 '+suggestion.knownLengthMm+
    ' mm）。这不是透视校正或完整数学验证；仍须审核所有条件。';
  }catch(error){
   invalidateDerivedScale();
   scaleStatus.textContent='比例校准失败：'+
    (error instanceof Error?error.message:'请输入有效已知长度');
  }
 });
 for(const el of [first,second])el.addEventListener('change',drawEdits);
 kind.addEventListener('change',updateSelectors);
 for(const el of [originX,originY,mmPerPx,yAxis,filletRadiusMm,lineSide]){
  el.addEventListener('input',changed);el.addEventListener('change',changed);
 }
 photoInput.addEventListener('change',reset);
 photoClear.addEventListener('click',reset);
 image.addEventListener('error',reset);
 image.addEventListener('load',reset);
 function value(input){
  return input.value.trim()===''?NaN:input.valueAsNumber;
 }
 apply.addEventListener('click',()=>{
  try{
   if(!draft)throw new RangeError('no validated raster ProblemDraft');
   const selected=[first.value,second.value],corrected={};
   for(const id of selected){
    const inputs=controls[id];
    if(!inputs)throw new TypeError('choose two eligible source shapes');
    const obj={};
    for(const [path,input] of Object.entries(inputs)){
     const n=value(input);
     if(path.includes('.')){
      const [head,key]=path.split('.');
      if(!obj[head])obj[head]={};
      obj[head][key]=n;
     }else obj[path]=n;
    }
    corrected[id]=obj;
   }
   const result=prepareReviewedRasterImport({
    draft,expectedRevision:draft.revision,kind:kind.value,
    firstId:selected[0],secondId:selected[1],edits:corrected,
    originX:value(originX),originY:value(originY),
    mmPerPx:value(mmPerPx),yAxis:yAxis.value,
    filletRadiusMm:value(filletRadiusMm),
    lineSide:kind.value==='segment-circle'?Number(lineSide.value):undefined,
    accepted:accepted.checked
   });
   onApply(result);changed();
   status.textContent='已把人工确认的图元与比例转换成毫米条件。'+
    '照片像素拟合不是数学证明；还须核对全部条件、分支及 G1 行进方向。';
  }catch(error){
   changed();
   status.textContent='拒绝导入：'+(error instanceof Error?error.message:'核对无效');
  }
 });
 reset();
 return Object.freeze({
  update,reset,release:reset,markFormEdited:changed,
  get draft(){return draft;},get generation(){return generation}
 });
}
module.exports={attachLocalRasterReview};
