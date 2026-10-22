'use strict';
/** Small, local-only UI adapter. Never inserts the raw SVG string as HTML. */
const {checkFile,geometrySummary,prepareLocalVectorImport}=
 require('./local-vector-svg-import.cjs');

function attachLocalVectorReview({file,kind,first,second,mmPerPx,originX,originY,
 yAxis,filletRadiusMm,accepted,apply,status,preview,onApply,dom=document}){
 const SVG='http://www.w3.org/2000/svg';
 for(const item of [file,kind,first,second,mmPerPx,originX,originY,
  yAxis,filletRadiusMm,accepted,apply,status,preview])
  if(!item)throw new TypeError('local vector review controls missing');
 let source='',summary=null,epoch=0,applied=false;
 const labels={
  segment:'线段',circle:'圆'
 };
 const requirements={
  'two-segments':['segment','segment'],
  'segment-circle':['segment','circle'],
  'two-circles':['circle','circle']
 };
 function opt(v,t){
  const o=dom.createElement('option');o.value=v;o.textContent=t;return o;
 }
 function updateSources(){
  const wanted=requirements[kind.value]||[];
  for(const [i,element] of [first,second].entries()){
   element.replaceChildren(opt('','请选择'+(i===0?'第一个':'第二个')+'源图元'));
   for(const c of summary?.shapes||[]){
    if(c.kind===wanted[i])element.append(opt(c.id,
     c.id+' · '+labels[c.kind]+' · '+JSON.stringify(c.geometry)));
   }
   element.value='';
  }
  accepted.checked=false;applied=false;
 }
 function drawOutlines(){
  preview.replaceChildren();
  if(!summary)return;
  preview.setAttribute('viewBox','0 0 '+summary.image.width+' '+summary.image.height);
  for(const c of summary.shapes){
   let element;
   if(c.kind==='segment'){
    element=dom.createElementNS(SVG,'line');
    for(const [k,v] of Object.entries({
      x1:c.geometry.from.x,y1:c.geometry.from.y,
      x2:c.geometry.to.x,y2:c.geometry.to.y}))
      element.setAttribute(k,String(v));
   }else if(c.kind==='circle'){
    element=dom.createElementNS(SVG,'circle');
    for(const [k,v] of Object.entries({
      cx:c.geometry.center.x,cy:c.geometry.center.y,r:c.geometry.radiusPx}))
      element.setAttribute(k,String(v));
    element.setAttribute('fill','none');
   }else continue;
   element.setAttribute('stroke','#237b54');
   element.setAttribute('stroke-width','2');
   preview.append(element);
  }
 }
 function reset(message){
  source='';summary=null;applied=false;accepted.checked=false;
  updateSources();drawOutlines();status.textContent=message;
 }
 file.addEventListener('change',async()=>{
  const ticket=++epoch;
  reset('正在本地检查矢量文件…');
  const selected=file.files?.[0],report=checkFile(selected);
  if(!report.ok){status.textContent=report.reason;return;}
  try{
   const data=await selected.text();
   if(ticket!==epoch)return;
   summary=geometrySummary(data);
   source=data;drawOutlines();updateSources();
   status.textContent='本地提取 '+summary.shapes.length+' 个图元'+
    (summary.hasLabels?'；含未确认尺寸或文字，当前禁止直接导入数学计算':
      '。请选择两个源图元并明确确认毫米比例，其他图元将标记为不采用。');
  }catch(_){if(ticket===epoch)reset('SVG 无法安全解析，可能包含不支持的路径、脚本或坐标');}
 });
 kind.addEventListener('change',updateSources);
 apply.addEventListener('click',()=>{
  try{
   if(!source)throw new TypeError('请先选择有效 SVG');
   const numeric=id=>{
    if(!id.value.trim())throw new TypeError('必须填写真实毫米比例、原点和连接半径');
    return id.valueAsNumber;
   };
   const result=prepareLocalVectorImport({
    source,kind:kind.value,firstId:first.value,secondId:second.value,
    mmPerPx:numeric(mmPerPx),originX:numeric(originX),
    originY:numeric(originY),yAxis:yAxis.value,
    filletRadiusMm:numeric(filletRadiusMm),accepted:accepted.checked
   });
   onApply(result);
   applied=true;accepted.checked=false;
   status.textContent='已根据您确认的图元与毫米比例填入真实数学条件。请重新选择分支、弧方向和轮廓方向；手动修改后来源对应关系需再次核验。';
  }catch(err){
   applied=false;
   status.textContent='未导入：'+(err instanceof Error?err.message:'未知的输入错误');
  }
 });
 return Object.freeze({
  markFormEdited(){
   if(applied){applied=false;status.textContent='数值或作图选项已修改：请核验最新条件；旧 SVG 对应关系不再视为已确认。';}
  },
  release(){epoch++;reset('已清除本地矢量图元。');file.value='';}
 });
}
module.exports={attachLocalVectorReview};
