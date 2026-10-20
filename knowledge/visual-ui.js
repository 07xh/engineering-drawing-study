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
 board.replaceChildren();board.setAttribute('viewBox','0 0 970 332');
 elt('rect',{width:970,height:332,fill:'#fff'},board);
 for(const shape of picture.shapes){
  if(shape.kind==='panel'){
   const [x,y,w,h]=shape.rect;
   elt('rect',{x,y,width:w,height:h,rx:12,fill:shape.active?'#f3faf5':'#f9faf9',stroke:'#d6e7dc','stroke-width':1.2},board);
   elt('text',{x:x+13,y:55,'font-size':15,'font-weight':600,fill:'#416a55'},board,shape.label);
   if(!shape.active)elt('text',{x:x+52,y:175,'font-size':14,fill:'#8b9f91'},board,'下一步显示');
   continue;
  }
  if(['line','guide','construction'].includes(shape.kind)){
   const [x1,y1,x2,y2]=shape.xy;
   const auxiliary=shape.kind==='guide'||shape.kind==='construction';
   const attrs={x1,y1,x2,y2,stroke:auxiliary?'#bd8b3c':'#277453','stroke-width':auxiliary?2:2.8,'stroke-linecap':'round'};
   if(auxiliary)attrs['stroke-dasharray']='6 5';
   elt('line',attrs,board);continue;
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
 if(!record)return;
 entry=record;stage=0;
 $('visualLesson').hidden=false;
 $('visualSourceNote').textContent='原创教学模型，不是教材第 2-6～2-9 习题原图或标准解；模型和原题作图区数据完全分离。';
 render();
}
function forward(){stage=Math.min(stage+1,3);render()}
function back(){stage=Math.max(stage-1,0);render()}
function reset(){stage=0;render()}
$('visualNext').addEventListener('click',forward);
$('visualPrev').addEventListener('click',back);
$('visualReset').addEventListener('click',reset);
window.KnowledgeVisualUI={show,render,forward,back};
})();
