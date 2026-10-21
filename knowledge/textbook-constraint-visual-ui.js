/* Interactive SVG overlay for source-reviewed 2D point constraints.
 * All toggles act only on the illustrative feasible locus; textbook frame and
 * verified DOF readout remain unchanged.
 */
(function(){'use strict';
const model=window.TextbookConstraintVisual,$=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
let snapshot=null,activeKey='',disabled=new Set(),selectedLabel=null,overlay=null;
function el(tag,attrs,parent,text){
 const node=document.createElementNS(ns,tag);
 for(const [k,v] of Object.entries(attrs||{}))node.setAttribute(k,String(v));
 if(text!==undefined)node.textContent=text;
 parent.append(node);return node;
}
function removeOverlay(){
 if(overlay&&typeof overlay.remove==='function')overlay.remove();
 else if(overlay?.parentNode&&typeof overlay.parentNode.removeChild==='function')overlay.parentNode.removeChild(overlay);
 overlay=null;
}
function arrow(group,from,to){
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
 if(length<3)return;
 const ux=dx/length,uy=dy/length;
 el('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,stroke:'#166d96','stroke-width':3.5,'stroke-linecap':'round'},group);
 const a={x:to.x-11*ux-5*uy,y:to.y-11*uy+5*ux};
 const b={x:to.x-11*ux+5*uy,y:to.y-11*uy-5*ux};
 el('polygon',{points:`${to.x},${to.y} ${a.x},${a.y} ${b.x},${b.y}`,fill:'#166d96'},group);
}
function draw(report){
 removeOverlay();
 if(!$('bookExampleConstraintVisible').checked)return;
 const board=$('bookExampleSvg');
 overlay=el('g',{class:'book-constraint-overlay','aria-hidden':'true','pointer-events':'none'},board);
 const primitives=model.visuals(report);
 for(const part of primitives){
  if(part.type==='region'){
   const b=part.bounds;
   el('rect',{x:b.x,y:b.y,width:b.w,height:b.h,rx:9,fill:'#c4def0','fill-opacity':.22,stroke:'#8bb5d0','stroke-dasharray':'8 7'},overlay);
   const x=b.x+b.w/2,y=b.y+b.h/2;
   arrow(overlay,{x,y},{x:x+43,y:y-26});arrow(overlay,{x,y},{x:x-43,y:y+26});
   arrow(overlay,{x,y},{x:x-43,y:y-26});arrow(overlay,{x,y},{x:x+43,y:y+26});
  }else if(part.type==='guide'||part.type==='locus'){
   const [a,b]=part.ends;
   el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,
    stroke:part.type==='locus'?'#166d96':'#6194ba','stroke-width':part.type==='locus'?4:2,
    'stroke-opacity':part.type==='locus'?.95:.68,
    ...(part.type==='guide'?{'stroke-dasharray':'7 5'}:{})},overlay);
   if(part.type==='locus'){
    const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2},l=Math.hypot(b.x-a.x,b.y-a.y);
    if(l>20){
     const dx=(b.x-a.x)/l,dy=(b.y-a.y)/l,d=Math.min(63,l*.28);
     arrow(overlay,center,{x:center.x+dx*d,y:center.y+dy*d});
     arrow(overlay,center,{x:center.x-dx*d,y:center.y-dy*d});
    }
   }
  }else if(part.type==='solution'){
   el('circle',{cx:part.x,cy:part.y,r:15,fill:'#dceaf5','fill-opacity':.6,stroke:'#176e9e','stroke-width':3},overlay);
   el('circle',{cx:part.x,cy:part.y,r:4,fill:'#176e9e'},overlay);
  }else if(part.type==='conflict'){
   el('text',{x:part.bounds.x+8,y:part.bounds.y+23,fill:'#a34b30','font-size':17,'font-weight':700},overlay,'无公共可行位置');
  }
 }
}
function refresh(){
 if(!snapshot)return;
 const report=model.analyze(snapshot,[...disabled]);
 const options=$('bookExampleConstraintOptions');
 options.replaceChildren();
 for(const condition of report.conditions){
  const label=document.createElement('label');
  label.className='book-constraint-choice'+(selectedLabel&&condition.shapes.includes(selectedLabel)?' is-linked':'');
  const control=document.createElement('input');control.type='checkbox';control.checked=condition.enabled;
  control.setAttribute('aria-label','参与约束计算：'+condition.name);
  control.addEventListener('change',()=>{
   if(control.checked)disabled.delete(condition.id);else disabled.add(condition.id);
   refresh();
  });
  const copy=document.createElement('span');
  copy.textContent=condition.name;
  const state=document.createElement('small');
  state.textContent=condition.enabled?
   condition.status==='independent'?'独立条件':condition.status==='redundant'?'重复条件':'条件冲突':'已暂时取消';
  label.append(control,copy,state);options.append(label);
 }
 const summary=$('bookExampleConstraintDegrees');
 summary.textContent=report.degrees===null?'无可行位置':report.degrees+' 个';
 $('bookExampleConstraintState').textContent=report.status==='plane'?'纸面位置尚未限制，可沿两个独立方向移动':
  report.status==='line'?'仍可沿蓝色定位线移动':
  report.status==='fixed'?'约束交会后位置唯一（蓝色圆环）':'约束发生冲突，无法定位';
 const linked=report.conditions.find(c=>selectedLabel&&c.shapes.includes(selectedLabel));
 $('bookExampleConstraintLinked').textContent=linked?
  '当前选中的点线对应条件：'+linked.name+'。'+linked.hint:
  '蓝色叠加层显示局部可行位置；点击题图中的定位线可以查看它对应的条件。';
 $('bookExampleConstraintScope').textContent=report.model.scope;
 $('bookExampleConstraintExperiment').hidden=disabled.size===0;
 draw(report);
}
function show(example,stage,adapted,shapeLabel=null){
 const next=model?.stageModel(example,stage,adapted)||null;
 if(!next){clear();return}
 const key=next.exampleId+':'+next.stage;
 if(key!==activeKey){activeKey=key;disabled=new Set()}
 snapshot=next;selectedLabel=shapeLabel;
 $('bookExampleConstraintPanel').hidden=false;
 refresh();
}
function clear(){
 snapshot=null;activeKey='';disabled=new Set();selectedLabel=null;removeOverlay();
 $('bookExampleConstraintPanel').hidden=true;
}
$('bookExampleConstraintVisible').addEventListener('change',()=>{if(snapshot)refresh()});
window.TextbookConstraintVisualUI={show,clear};
})();
