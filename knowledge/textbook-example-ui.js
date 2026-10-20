/* Only source-verified textbook examples can be shown. Never load copied PDF scans.
 * The synthetic SVG pixel coordinates are deliberately marked as normalization.
 */
(function(){'use strict';
const $=id=>document.getElementById(id);
const source=window.TextbookExamples,geom=window.TextbookExampleGeometry;
let current=null,index=0;
const ns='http://www.w3.org/2000/svg';
function svg(tag,attrs,content){const element=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs||{}))element.setAttribute(k,String(v));if(content!==undefined)element.textContent=content;$('bookExampleSvg').append(element);return element}
const colors={given:'#2b7451',axis:'#758878',auxiliary:'#bc7f2e',mark:'#a36c35',result:'#216faf'};
function draw(frame){
 const board=$('bookExampleSvg');board.replaceChildren();
 svg('rect',{width:820,height:420,fill:'#fff'});
 for(const item of frame.shapes){
  const col=colors[item.style]||'#657567';
  if(item.type==='line'){
   svg('line',{x1:item.a.x,y1:item.a.y,x2:item.b.x,y2:item.b.y,stroke:col,
    'stroke-width':item.style==='result'?3.8:item.style==='given'?3:2,
    'stroke-linecap':'round',
    ...(item.style==='auxiliary'||item.style==='axis'?{'stroke-dasharray':item.style==='axis'?'3 5':'8 5'}:{})});
  }else if(item.type==='point'){
   svg('circle',{cx:item.p.x,cy:item.p.y,r:item.style==='result'?6.5:5.4,fill:col});
   svg('text',{x:item.p.x+8,y:item.p.y-9,'font-size':19,'font-weight':600,fill:col},item.label);
  }
 }
}
function render(){
 if(!current)return;
 const frame=geom.frame(current.id,index),step=current.order[index];
 draw(frame);
 $('bookExampleCounter').textContent='步骤 '+(index+1)+' / '+current.order.length;
 $('bookExampleStageTitle').textContent='课本作图 · '+(index+1)+' / '+current.order.length;
 $('bookExampleAction').textContent='本步按教材做：'+step;
 $('bookExampleReason').textContent='为什么这样作：'+current.why[index];
 $('bookExampleDof').textContent='自由度/确定性：'+current.freedom[index]+'（'+frame.degreeTarget+'）';
 $('bookExampleAudit').textContent=index===4?
 '结果检查：'+current.check+' 数学验证：'+(frame.proof.maxResidual<1e-8?'通过':'未通过')+'。':
 '本步仅展示教材解题顺序对应的已知条件与辅助关系；最终验算在最后一帧显示。';
 $('bookExamplePrev').disabled=index===0;
 $('bookExampleNext').disabled=index===current.order.length-1;
}
function show(topicId){
 const view=$('textbookExample');if(!view)return;
 const matches=source?.forTopic(topicId)||[];
 const example=matches[0]||null;
 view.hidden=!example;current=example;index=0;
 if(!example)return;
 $('bookExampleTitle').textContent=example.number+' · '+example.title;
 $('bookExampleSource').textContent='《工程制图与 AutoCAD》第3版 · 印刷第'+example.printedPage+'页 / PDF第'+example.pdfPage+'页 · '+example.figure;
 $('bookExampleKnown').textContent='课本例题：'+example.known+' 目标：'+example.goal;
 $('bookExampleFidelity').textContent='来源与重绘边界：'+example.fidelity;
 render();
}
$('bookExamplePrev').addEventListener('click',()=>{if(current){index=Math.max(0,index-1);render()}});
$('bookExampleNext').addEventListener('click',()=>{if(current){index=Math.min(current.order.length-1,index+1);render()}});
$('bookExampleReset').addEventListener('click',()=>{if(current){index=0;render()}});
$('bookExampleFinal').addEventListener('click',()=>{if(current){index=current.order.length-1;render()}});
window.TextbookExampleUI={show};
})();