'use strict';
// UI-only human input preflight. Never grants solver, M5 or V5 certification.
// Final submission still uses the canonical C2 geometry builder.
const {buildReviewedC2Boxes}=require('./c2-reviewed-two-boxes.cjs');
const axes=['x','y','z'];
const letters=['a','b'];
function reviewC2BoxFields(fields,{occupied=false}={}){
 if(occupied)return {ready:false,fieldId:null,
  message:'当前项目已有对象或约束。请展开高级编辑器，或新建空的 C2 项目；不能覆盖已确认的几何。'};
 const boxes=[];
 for(const letter of letters){
  const title=letter.toUpperCase(),min=[],max=[];
  for(const bound of ['min','max']){
   for(let i=0;i<3;i++){
    const axis=axes[i],id='v8-c2-'+letter+'-'+axis+(bound==='min'?'0':'1');
    const raw=fields?.[id];
    const value=typeof raw==='string'?raw.trim():'';
    if(value===''||!Number.isFinite(Number(value))||Math.abs(Number(value))>100000)
     return {ready:false,fieldId:id,
      message:'形体 '+title+' 的'+(bound==='min'?'最小':'最大')+' '+axis.toUpperCase()+
       '：请填写 ±100000 mm 内的有效数值。'};
    (bound==='min'?min:max).push(Number(value));
   }
  }
  for(let i=0;i<3;i++)if(min[i]>=max[i])
   return {ready:false,fieldId:'v8-c2-'+letter+'-'+axes[i]+'1',
    message:'形体 '+title+' 的最大 '+axes[i].toUpperCase()+
     ' 必须大于最小 '+axes[i].toUpperCase()+'（mm）。'};
  boxes.push({min,max});
 }
 try{buildReviewedC2Boxes(boxes);}
 catch(error){return {ready:false,fieldId:'v8-c2-a-x0',
  message:'形体几何尚未通过检查：'+error.message};}
 return {ready:true,fieldId:null,
  message:'两组尺寸格式与长方体边界有效。仍需对照原题确认位置、接触关系及单位；不是标准答案。'};
}
module.exports={reviewC2BoxFields};
