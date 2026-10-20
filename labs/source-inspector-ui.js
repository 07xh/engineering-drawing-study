/* 只检查、高亮已录入的已知点线。此图层与真实解答、画笔相互隔离。 */
(function(){
 'use strict';
 const model=window.ChapterSourceInspector,$=id=>document.getElementById(id);
 const panel=$('inspectPanel'),layer=$('sourceHighlight');
 if(!model||!panel||!layer)return;
 const ns='http://www.w3.org/2000/svg';
 let source=null,items=[],selected=-1;
 const type=$('inspectType'),count=$('inspectCount'),explain=$('inspectExplain');
 function node(tag,attrs){
  const e=document.createElementNS(ns,tag);
  for(const [k,v]of Object.entries(attrs||{}))e.setAttribute(k,String(v));
  layer.append(e);return e;
 }
 function filtered(){
  return items.filter(x=>type.value==='all'||x.kind===type.value);
 }
 function highlight(item){
  layer.replaceChildren();
  if(!item)return;
  const x=item.geometry,common={stroke:'#196fb4','stroke-width':5,fill:'none','pointer-events':'none'};
  if(['given','axis','transfer','thin'].includes(item.kind)){
   node('line',{x1:x[0],y1:x[1],x2:x[2],y2:x[3],...common});
   for(const [cx,cy] of [[x[0],x[1]],[x[2],x[3]]])node('circle',{cx,cy,r:5,fill:'#fff',stroke:'#196fb4','stroke-width':2});
  }else if(item.kind==='circle')node('circle',{cx:x[0],cy:x[1],r:x[2],...common});
  else node('circle',{cx:x[0],cy:x[1],r:9,...common});
 }
 function render(){
  const view=filtered(),item=selected>=0?view[selected]:null;
  highlight(item);
  count.textContent=item?'正在核对 '+(selected+1)+' / '+view.length+' 项':'尚未选中线条 · 共 '+view.length+' 项';
  explain.textContent=item?model.explain(item,source):'第一帧始终保留全部已录入的原题已知几何。点击下一项，只会在原有线条上增加蓝色核对高亮，不补画缺失的线。';
  $('inspectPrev').disabled=selected<0;
  $('inspectNext').disabled=view.length===0||selected>=view.length-1;
  $('inspectReset').disabled=selected<0;
 }
 function open(id){
  source=window.VerifiedExerciseGeometry?.get(id)||null;
  items=model.collect(source);selected=-1;type.value='all';
  const summary=model.summary(source),parts=Object.entries(summary.count).map(([k,n])=>model.kinds[k].label+' '+n);
  $('inspectSummary').textContent='本题目前录入 '+summary.total+' 个图形对象（'+(parts.join('、')||'尚无可核实图形')+'）。'+
   (summary.complete?'图形登记为完整；不代表答案经过校核。':'原题仍为部分复刻，必须对照扫描原图复核。');
  render();
 }
 type.addEventListener('change',()=>{selected=-1;render()});
 $('inspectPrev').addEventListener('click',()=>{selected=Math.max(-1,selected-1);render()});
 $('inspectNext').addEventListener('click',()=>{selected=Math.min(filtered().length-1,selected+1);render()});
 $('inspectReset').addEventListener('click',()=>{selected=-1;render()});
 $('question').addEventListener('change',()=>open($('question').value));
 open($('question').value);
 window.ChapterSourceInspectorUI={open,render};
})();