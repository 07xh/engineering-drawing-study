'use strict';
/** Browser-local raster proposal review. A picker, not an AI proof engine. */
const {candidateDraftFromRaster}=
 require('../recognition/raster-primitive-draft.cjs');
const {validateDraft}=require('../recognition/problem-draft.cjs');
const {shapeKeys,prepareReviewedRasterImport}=
 require('./local-raster-fillet-import.cjs');
const {suggestMillimetresPerImagePixel}=
 require('./manual-raster-scale-calibration.cjs');
const {compareReviewedRulers}=
 require('./manual-raster-ruler-crosscheck.cjs');
const {proposeCircleScale,acceptCircleScale}=
 require('./local-raster-circle-scale.cjs');

function attachLocalRasterReview({
 image,photoInput,photoClear,kind,first,second,preview,edits,
 originX,originY,mmPerPx,yAxis,filletRadiusMm,lineSide,
 scaleSource,scaleLength,scaleReviewed,scaleCalculate,scaleStatus,
 crossSource,crossLength,crossReviewed,crossCalculate,crossStatus,
 scaleCircle,scaleKind,scaleValue,scaleSuggest,scaleConfirm,scaleUse,circleScaleStatus,
 accepted,apply,status,onApply,dom=document
}){
 for(const node of [image,photoInput,photoClear,kind,first,second,preview,
  edits,originX,originY,mmPerPx,yAxis,filletRadiusMm,lineSide,
  accepted,apply,status])
  if(!node)throw new TypeError('incomplete local raster review UI controls');
 const scaleNodes=[scaleSource,scaleLength,scaleReviewed,scaleCalculate,scaleStatus];
 const hasScaleControls=scaleNodes.every(Boolean);
 if(!hasScaleControls&&scaleNodes.some(Boolean))
  throw new TypeError('partial optional raster scale assistant controls');
 const crossNodes=[crossSource,crossLength,crossReviewed,crossCalculate,crossStatus];
 const hasCrossControls=crossNodes.every(Boolean);
 if(!hasCrossControls&&crossNodes.some(Boolean))
  throw new TypeError('partial second-ruler crosscheck controls');
 if(hasCrossControls&&!hasScaleControls)
  throw new TypeError('second ruler requires first-ruler scale assistant');
 const circleScaleNodes=[scaleCircle,scaleKind,scaleValue,
  scaleSuggest,scaleConfirm,scaleUse,circleScaleStatus];
 const hasCircleScaleControls=circleScaleNodes.every(Boolean);
 if(!hasCircleScaleControls&&circleScaleNodes.some(Boolean))
  throw new TypeError('partial optional R/Φ scale assistant controls');
 if(typeof onApply!=='function')throw new TypeError('current workbench hook required');
 const SVG='http://www.w3.org/2000/svg';
 const parts={line:null,curve:null};
 let draft=null,controls={},generation=0,derivedScale=null,circleScaleProposal=null;
 const option=(value,label)=>{
  const node=dom.createElement('option');node.value=value;node.textContent=label;
  return node;
 };
 const changed=()=>{accepted.checked=false;};
 function invalidateCircleScale(){
  if(!hasCircleScaleControls)return;
  circleScaleProposal=null;
  scaleConfirm.checked=false;
  scaleUse.disabled=true;
 }
 function invalidateDerivedScale(){
  invalidateCircleScale();
  if(hasCrossControls){
   crossStatus.textContent='尚未完成可比较的两条独立比例复核。';
   crossReviewed.checked=false;
  }
  if(derivedScale){
   mmPerPx.value='';
   derivedScale=null;
   if(hasScaleControls)
    scaleStatus.textContent='已更改比例关联条件；旧的毫米／像素建议已失效，请重新核对。';
  }
  if(!hasScaleControls){changed();return;}
  scaleReviewed.checked=false;
  changed();
 }
 function updateCrossSources(){
  if(!hasCrossControls)return;
  const prev=crossSource.value;
  crossSource.replaceChildren(option('','请选择与第一条不同的已知长度线段'));
  const firstSource=scaleSource.value;
  for(const id of [first.value,second.value]){
   if(id!==firstSource&&controls[id]?.['from.x']&&controls[id]?.['to.x'])
    crossSource.append(option(id,'第二条独立线段 '+id));
  }
  crossSource.value=[...crossSource.options].some(x=>x.value===prev)?prev:'';
 }
 function updateScaleSources(){
  if(!hasScaleControls)return;
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
  updateCrossSources();
 }
 function reset(){
  invalidateDerivedScale();
  if(hasScaleControls){scaleSource.value='';scaleLength.value='';}
  invalidateCircleScale();
  if(hasCrossControls){crossSource.value='';crossLength.value='';}
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
  if(hasCircleScaleControls){
   scaleCircle.replaceChildren(option('','先选择真实来源整圆'));
   scaleCircle.value='';
  }
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
  if(hasCircleScaleControls){
   for(const id of [first.value,second.value]){
    const source=draft?.candidates.find(c=>c.id===id&&c.kind==='circle');
    if(source)scaleCircle.append(option(id,source.id+' · 需人工核对的完整圆'));
   }
   invalidateCircleScale();
  }
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
 /**
  * Install an existing QA annotations pack only after the browser has
  * verified original-file SHA256 using Web Crypto and adapter validation.
  * Replaces detector proposals with still-unconfirmed image-pixel geometry.
  */
 function useManualDraft(input,{samePhotoFingerprintChecked=false}={}){
  if(samePhotoFingerprintChecked!==true)
   throw new TypeError('manual draft import requires original photo SHA-256 verification');
  const checked=validateDraft(input);
  const file=photoInput.files?.[0];
  if(!file||image.hidden||
    checked.image.width!==image.naturalWidth||
    checked.image.height!==image.naturalHeight||
    checked.image.byteLength!==file.size||
    checked.image.mediaType!==file.type)
   throw new RangeError('manual draft and current displayed photo differ');
  if(!checked.candidates.length||
   checked.candidates.some(c=>!['segment','circle'].includes(c.kind)||
     c.reviewStatus!=='unconfirmed'||c.method!=='manual'))
   throw new TypeError('manual source geometries must be still unconfirmed finite lines/circles');
  // Mutation only after full validation. Any prior detector proposals are
  // replaced rather than merged with IDs from an unrelated image.
  parts.line=null;parts.curve=null;
  generation++;draft=checked;
  updateSelectors();previewShapes();
  status.textContent='已读取 '+checked.candidates.length+
   ' 个同一原题上的人工线段/整圆草稿，均尚未通过当前解题审核。'+
   '请选择两个源图元、检查像素位置、毫米比例、原点与目标 R；'+
   '明确确认数学分支与行进方向后才可能运行 V5。';
  return Object.freeze({generation,importedCount:checked.candidates.length,
    status:'needs-human-geometry-and-mm-review'});
 }
 function update(group,rawInfo){
  if(!['line','curve'].includes(group))throw new TypeError('unknown detector source');
  if(!rawInfo||!Array.isArray(rawInfo.raw)||!rawInfo.raw.length)
   parts[group]=null;
  else parts[group]=rawInfo;
  changed();renderDraft();
 }
 if(hasScaleControls){
 scaleSource.addEventListener('change',()=>{
  invalidateDerivedScale();updateCrossSources();
 });
 scaleLength.addEventListener('input',invalidateDerivedScale);
 scaleReviewed.addEventListener('change',changed);
 mmPerPx.addEventListener('input',()=>{
  invalidateCircleScale();
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
   invalidateCircleScale();
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

 if(hasCrossControls){
  crossSource.addEventListener('change',()=>{
   crossReviewed.checked=false;crossStatus.textContent='第二条线段已变更，请重新确认。';
   changed();
  });
  crossLength.addEventListener('input',()=>{
   crossReviewed.checked=false;crossStatus.textContent='第二条实际尺寸已变更，请重新确认。';
   changed();
  });
  crossReviewed.addEventListener('change',changed);
  crossCalculate.addEventListener('click',()=>{
   try{
    if(!draft||!derivedScale)throw new RangeError('请先完成人工确认的第一条线段比例校准');
    const aId=derivedScale.sourceId,bId=crossSource.value;
    if(!bId||aId===bId)throw new TypeError('第二条尺寸必须对应不同线段');
    const details=id=>{
     const fields=controls[id],candidate=draft.candidates.find(x=>x.id===id);
     if(!fields||candidate?.kind!=='segment')
      throw new TypeError('仅支持已选择的两个完整有限线段');
     return {from:{x:value(fields['from.x']),y:value(fields['from.y'])},
      to:{x:value(fields['to.x']),y:value(fields['to.y'])}};
    };
    const firstLine=details(aId),secondLine=details(bId);
    const a=suggestMillimetresPerImagePixel({
     ...firstLine,knownLengthMm:value(scaleLength),
     image:draft.image,sourceId:aId,explicitlyReviewed:scaleReviewed.checked
    });
    if(Math.abs(a.mmPerPx-derivedScale.mmPerPx)>
     1e-10*Math.max(1,a.mmPerPx))
     throw new RangeError('第一条基线已变更，请重新校准');
    const b=suggestMillimetresPerImagePixel({
     ...secondLine,knownLengthMm:value(crossLength),
     image:draft.image,sourceId:bId,explicitlyReviewed:crossReviewed.checked
    });
    const comparison=compareReviewedRulers(a,b);
    changed();
    if(!comparison.mayReusePrimarySuggestion){
     derivedScale=null;mmPerPx.value='';
     crossStatus.textContent='两条已核对线段推得的毫米比例不一致（偏差 '+
      (comparison.relativeDifference*100).toFixed(2)+
      '%，诊断阈值 3%）。已清空第一条建议比例；请检查透视、端点、单位及尺寸对应，不得直接使用本次比例。';
     scaleStatus.textContent='双基线不一致；之前建议比例已失效。';
    }else{
     crossStatus.textContent='两条线段建议比例在 3% 诊断范围内（差 '+
      (comparison.relativeDifference*100).toFixed(2)+
      '%）。这不证明全图无透视畸变；仍须人工审核所有数学条件。';
    }
   }catch(error){
    changed();
    crossStatus.textContent='第二基线核对未通过：'+
     (error instanceof Error?error.message:'无效图纸尺寸');
   }
  });
 }
 }

 if(hasCircleScaleControls){
  function circleScaleInput(){
   if(!draft)throw new RangeError('scan image and select a source circle first');
   const circleId=scaleCircle.value;
   const selected=[first.value,second.value];
   const source=draft.candidates.find(c=>c.id===circleId);
   if(!selected.includes(circleId)||source?.kind!=='circle'||!controls[circleId])
    throw new TypeError('scale must link one of the selected complete circles');
   const sourceInputs=controls[circleId];
   return {draft,expectedRevision:draft.revision,circleId,
    editedCircle:{center:{x:value(sourceInputs['center.x']),y:value(sourceInputs['center.y'])},
     radiusPx:value(sourceInputs.radiusPx)},
    dimensionKind:scaleKind.value,reviewedValueMm:value(scaleValue)};
  }
  scaleSuggest.addEventListener('click',()=>{
   invalidateCircleScale();
   try{
    circleScaleProposal=proposeCircleScale(circleScaleInput());
    scaleUse.disabled=false;
    circleScaleStatus.textContent='圆尺寸建议比例 '+circleScaleProposal.mmPerPx.toPrecision(7)+
     ' mm/像素。尚未确认，不能直接作为工程数学证明。';
   }catch(error){
    circleScaleStatus.textContent='圆尺寸校准建议失败：'+
     (error instanceof Error?error.message:'请核对圈选与标注');
   }
  });
  scaleUse.addEventListener('click',()=>{
   try{
    const confirmed=acceptCircleScale({
     proposal:circleScaleProposal,...circleScaleInput(),
     confirmed:scaleConfirm.checked
    });
    invalidateDerivedScale(); // An old line/ruler calibration cannot silently remain active.
    mmPerPx.value=String(confirmed.mmPerPx);
    derivedScale={sourceId:confirmed.circleId,mmPerPx:confirmed.mmPerPx};
    invalidateCircleScale();changed();
    circleScaleStatus.textContent='已人工采用圆 R/Φ 比例建议 '+confirmed.mmPerPx.toPrecision(7)+
     ' mm/像素。仍必须复核全部条件；图像比例未被独立证明。';
   }catch(error){
    invalidateCircleScale();changed();
    circleScaleStatus.textContent='拒绝采用圆尺寸比例：'+
     (error instanceof Error?error.message:'请重新核对');
   }
  });
  for(const control of [scaleCircle,scaleKind,scaleValue]){
   control.addEventListener('input',invalidateDerivedScale);
   control.addEventListener('change',invalidateDerivedScale);
  }
 }
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
  update,useManualDraft,reset,release:reset,markFormEdited:changed,
  get draft(){return draft;},get generation(){return generation}
 });
}
module.exports={attachLocalRasterReview};
