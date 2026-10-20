/* Synthetic geometry only: no access to original textbook exercise solution layers. */
(function(){'use strict';
const geo=window.TangencyConstraint,$=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
if(!geo){$('resultSummary').textContent='模型加载失败，请刷新页面。';return}
let stage=0;
function node(svg,type,attrs,text){
 const obj=document.createElementNS(ns,type);
 for(const [k,v] of Object.entries(attrs||{}))obj.setAttribute(k,String(v));
 if(text!==undefined)obj.textContent=text;svg.append(obj);return obj;
}
function draw(){
 const r=+$('tangentRadius').value,side=$('tangentSide').value;
 let picture;try{picture=geo.frame(r,side,stage)}catch(err){$('resultSummary').textContent=err.message;return}
 const board=$('tangentBoard');board.replaceChildren();
 node(board,'rect',{x:0,y:0,width:650,height:315,fill:'#fff'});
 const colors={known:'#367f5b',auxiliary:'#c58c32',solution:'#2475b6',selected:'#2475b6',candidate:'#a2a7a3'};
 for(const it of picture.items){
  const color=colors[it.style]||'#777';
  if(it.kind==='circle'){
   node(board,'circle',{cx:it.cx,cy:it.cy,r:it.r,fill:'none',stroke:color,'stroke-width':it.style==='solution'?3.8:2.4,
    ...(it.style==='auxiliary'?{'stroke-dasharray':'7 6'}:{})});
  }else if(it.kind==='line'){
   node(board,'line',{x1:it.x1,y1:it.y1,x2:it.x2,y2:it.y2,stroke:color,'stroke-width':it.style==='known'?3:2,
    ...(it.style==='auxiliary'?{'stroke-dasharray':'7 6'}:{})});
  }else if(it.kind==='point'){
   node(board,'circle',{cx:it.x,cy:it.y,r:it.style==='selected'?6:4.5,fill:color});
   if(it.label)node(board,'text',{x:it.x+8,y:it.y-7,'font-size':12,fill:color},it.label);
  }
 }
 $('radiusValue').textContent=String(r);
 $('stepTitle').textContent=picture.title;
 $('stepExplain').textContent=picture.reason;
 $('tangentCounter').textContent=(stage+1)+' / 5';
 $('tangentPrev').disabled=stage===0;
 $('tangentNext').disabled=stage===4;
 for(const degree of [2,1,0])$('degree'+degree).classList.toggle('active',picture.dof===degree);
 const m=picture.geometry;
 $('resultSummary').textContent='当前连续自由度：'+picture.dof+'；圆心候选：'+(stage>=3?m.discreteSolutions+' 个':'尚未完成交会')+
 (stage===4?'。数值复核：圆心到直线等于 r、到已知圆心等于 R+r、两个切点均满足距离关系。误差 < 0.00000001。':
 '。在最后一步将核对圆心和两个切点的距离关系。');
}
$('tangentPrev').addEventListener('click',()=>{stage=Math.max(stage-1,0);draw()});
$('tangentNext').addEventListener('click',()=>{stage=Math.min(stage+1,4);draw()});
$('tangentRestart').addEventListener('click',()=>{stage=0;draw()});
for(const name of ['tangentRadius','tangentSide'])$(name).addEventListener('input',draw);
draw();
})();