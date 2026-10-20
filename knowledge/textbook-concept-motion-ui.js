/* Browser-only source-labelled original concept visualizer, not a textbook solution player. */
(function(){'use strict';
const geometry=window.TextbookConceptMotion,source=window.TextbookPageAudit;
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const palette={given:'#2e6c52',axis:'#8ea49a',auxiliary:'#c4883c',result:'#226f9a',
 hidden:'#9fa8a2',cut:'#b95652',cutout:'#ffffff',hatch:'#c0832f'};
let current=null,step=0;
function svg(tag,attrs,holder,value){
 const node=document.createElementNS(ns,tag);
 for(const [key,v] of Object.entries(attrs||{}))node.setAttribute(key,String(v));
 if(value!==undefined)node.textContent=value;
 holder.append(node);return node;
}
function draw(){
 const frame=geometry.frame(current,step),board=$('sixLayerConceptSvg');board.replaceChildren();
 svg('rect',{x:0,y:0,width:650,height:380,fill:'#fff'},board);
 for(const sh of frame.shapes){
  const col=palette[sh.kind]||palette.given;
  if(sh.type==='line')svg('line',{x1:sh.a.x,y1:sh.a.y,x2:sh.b.x,y2:sh.b.y,
   stroke:col,'stroke-width':sh.kind==='result'?3.5:sh.kind==='hatch'?1.4:2.2,
   ...(sh.kind==='axis'||sh.kind==='hidden'?{'stroke-dasharray':'6 6'}:{})},board);
  if(sh.type==='rect')svg('rect',{x:sh.x,y:sh.y,width:sh.w,height:sh.h,
   fill:sh.kind==='cutout'?'white':'none',stroke:col,'stroke-width':sh.kind==='cutout'?3:2.5},board);
  if(sh.type==='poly')svg('polygon',{points:sh.points.map(p=>p.x+','+p.y).join(' '),stroke:col,'stroke-width':2.5,
   fill:col,'fill-opacity':.06},board);
  if(sh.type==='text')svg('text',{x:sh.x,y:sh.y,fill:'#405e50','font-size':16,'font-weight':600},board,sh.label);
 }
 board.setAttribute('role','img');board.setAttribute('aria-label',frame.title+'，第'+(step+1)+'步：'+frame.action);
 $('sixLayerConceptCounter').textContent=(step+1)+' / '+frame.steps+' 步';
 $('sixLayerConceptAction').textContent=frame.action;
 $('sixLayerConceptScope').textContent='演示性质：'+frame.scope;
 $('sixLayerConceptPrev').disabled=step===0;
 $('sixLayerConceptNext').disabled=step===frame.steps-1;
 const verified=source?.get(frame.page);
 $('sixLayerConceptSource').textContent='主题来源：教材印刷第'+frame.printedPage+'页 / PDF第'+frame.page+
  '页'+(verified?.visualSample?' · 已初步查看相应扫描页面':'')+'；并非已核验原书例题。';
}
function show(id,layer){
 const slot=$('sixLayerConceptSlot');
 if(!geometry?.definition(id)||(layer!==1&&layer!==2)){
  if(slot)slot.hidden=true;return
 }
 if(id!==current){current=id;step=0}
 slot.hidden=false;draw();
}
$('sixLayerConceptPrev').addEventListener('click',()=>{if(current&&step>0){step--;draw()}});
$('sixLayerConceptNext').addEventListener('click',()=>{if(current&&step<geometry.definition(current).steps.length-1){step++;draw()}});
window.TextbookConceptMotionUI={show};
})();
