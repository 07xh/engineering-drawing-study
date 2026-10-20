/* 将原创几何演示直接嵌入知识卡片；绝不操作教材原题作图层。 */
(function(){'use strict';
const data=window.KnowledgeVisual,engine=window.DrawingConstraints;
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
let entry=null,stage=0;
function elt(tag,attrs,parent,value){
 const node=document.createElementNS(ns,tag);
 for(const [k,v] of Object.entries(attrs||{}))node.setAttribute(k,String(v));
 if(value!==undefined)node.textContent=value;
 parent.append(node);return node;
}
function render(){
 if(!entry||!data||!engine)return;
 const picture=data.svgShapes(entry.id,entry.chapter,stage),board=$('visualBoard');
 const showGuides=$('visualShowGuides').checked;
 board.replaceChildren();board.setAttribute('viewBox','0 0 970 650');
 elt('rect',{width:970,height:650,fill:'#fff'},board);
 for(const shape of picture.shapes){
  if(!showGuides&&['guide','construction','aux-circle','transfer45'].includes(shape.kind))continue;
  if(shape.kind==='panel'){
   const [x,y,w,h]=shape.rect;
   elt('rect',{x,y,width:w,height:h,rx:12,fill:shape.active?'#f3faf5':'#f9faf9',stroke:'#d6e7dc','stroke-width':1.2},board);
   elt('text',{x:x+13,y:y+21,'font-size':16,'font-weight':600,fill:'#416a55'},board,shape.label);
   if(!shape.active)elt('text',{x:x+52,y:y+h/2,'font-size':14,fill:'#8b9f91'},board,'后续步骤显示');
   continue;
  }
  if(['line','guide','construction','axis','transfer45'].includes(shape.kind)){
   const [x1,y1,x2,y2]=shape.xy;
   const auxiliary=shape.kind==='guide'||shape.kind==='construction';
   const base=shape.kind==='axis'||shape.kind==='transfer45';
   const attrs={x1,y1,x2,y2,stroke:auxiliary?'#c0832d':base?'#96a9a0':'#277453','stroke-width':auxiliary?2.2:base?1.8:2.8,'stroke-linecap':'round'};
   if(auxiliary||shape.kind==='transfer45')attrs['stroke-dasharray']='7 5';
   elt('line',attrs,board);
   continue;
  }
  if(shape.kind==='circle'||shape.kind==='aux-circle'){
   const auxiliary=shape.kind==='aux-circle';
   elt('circle',{cx:shape.cx,cy:shape.cy,r:shape.r,stroke:auxiliary?'#bd8b3c':'#277453','stroke-width':auxiliary?2:3,fill:'none',...(auxiliary?{'stroke-dasharray':'6 5'}:{})},board);continue}
  if(shape.kind==='point'){
   const [x,y]=shape.xy;
   elt('circle',{cx:x,cy:y,r:4.2,fill:'#277453'},board);
   elt('text',{x:x+7,y:y-8,'font-size':12,fill:'#265845'},board,shape.name);
  }
 }
 const st=data.stages()[stage],report=data.analyze(engine,entry.id,entry.chapter,stage);
 const guides=picture.shapes.filter(s=>['guide','construction','aux-circle','transfer45'].includes(s.kind));
 const explanations=[...new Set(guides.map(s=>s.label).filter(Boolean))];
 $('visualGeometryWhy').textContent=!showGuides?'辅助线当前已隐藏。开启“显示辅助线”后，可以对照图形查看各条定位与投影关系。':explanations.length?'本阶段可见的辅助几何：'+explanations.join('；')+'。这些线帮助对应投影关系，不单独证明整题唯一解。':'本阶段尚无辅助几何线；先观察已知投影面及形体位置。';
 $('visualTitle').textContent=picture.name+' · '+st.title;
 $('visualExplanation').textContent=st.why;
 $('visualDegree').textContent=report.degree===null?'无解或冲突条件':'代表点剩余 '+report.degree+' 个自由度';
 $('visualDetail').textContent=report.scope+' '+report.summary;
 $('visualStepCounter').textContent=(stage+1)+' / '+data.stages().length;
 $('visualPrev').disabled=stage===0;$('visualNext').disabled=stage===3;
 const actions=$('visualConstraintSteps');actions.replaceChildren();
 for(const [i,step] of report.steps.entries()){
  const li=document.createElement('li');
  const label=['正面 V 投影','水平 H 投影','侧面 W 投影'][i];
  li.textContent=label+'：'+step.explanation;
  actions.append(li);
 }
}
function show(id){
 const record=window.DrawingKnowledge&&window.DrawingKnowledge.get(id);
 if(!record||record.contentStatus!=='page-reviewed'||!record.visualMode||data.modeFor(id,record.chapter)!==record.visualMode){entry=null;$('visualLesson').hidden=true;return}
 entry=record;stage=0;
 $('visualLesson').hidden=false;
 $('visualSourceNote').textContent='本模型依据第二章已核对的投影概念重新设计，仅演示单个代表点的约束过程；不是教材原图、整题的自由度证明或出版社标准解。';
 render();
}
function goTo(next){if(!entry)return;stage=Math.max(0,Math.min(3,Math.trunc(next)));render()}
function forward(){goTo(stage+1)}
function back(){goTo(stage-1)}
function reset(){goTo(0)}
$('visualNext').addEventListener('click',forward);
$('visualPrev').addEventListener('click',back);
$('visualReset').addEventListener('click',reset);
$('visualShowGuides').addEventListener('change',render);
window.KnowledgeVisualUI={show,render,forward,back,goTo,getStage:()=>stage,getEntryId:()=>entry?.id||null};
})();
