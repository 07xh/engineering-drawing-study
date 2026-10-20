(function(){'use strict';
const model=window.PaperGeometry,$=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
if(!model||typeof model.regular!=='function'){$('paperAudit').textContent='原创几何模型暂时无法加载，请刷新。';return}
let mode='divide',stage=0;
const group=['divide','polygon','dimension'];
const colors={given:'#24704f',axis:'#688b78',aux:'#bd852d',found:'#2479b8',check:'#82998a',point:'#24704f'};
function svg(tag,attrs,text){
 const e=document.createElementNS(ns,tag);
 for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,String(v));
 if(text!==undefined)e.textContent=text;
 $('paperBoard').append(e);return e;
}
function drawItem(item){
 const color=colors[item.role]||'#52735d';
 if(item.kind==='line'){
  svg('line',{x1:item.x1,y1:item.y1,x2:item.x2,y2:item.y2,stroke:color,'stroke-width':item.role==='found'?3:2,
   'stroke-linecap':'round',...(item.role==='aux'||item.role==='check'?{'stroke-dasharray':item.role==='check'?'3 5':'7 5'}:{})});
 }else if(item.kind==='circle'){
  svg('circle',{cx:item.cx,cy:item.cy,r:item.r,fill:'none',stroke:color,'stroke-width':2.6,
   ...(item.role==='aux'?{'stroke-dasharray':'7 5'}:{})});
 }else if(item.kind==='point'){
  svg('circle',{cx:item.x,cy:item.y,r:item.role==='found'?5:4,fill:color});
  if(item.name)svg('text',{x:item.x+6,y:item.y-7,'font-size':11,fill:color},item.name);
 }
}
function argument(){
 if(mode==='divide')return Number($('divisionCount').value);
 if(mode==='polygon')return Number($('polygonSides').value);
 return {dx:Number($('dimensionX').value),dy:Number($('dimensionY').value)};
}
function view(){
 const result=model.regular(mode,argument(),stage);
 const canvas=$('paperBoard');canvas.replaceChildren();
 svg('rect',{x:0,y:0,width:680,height:360,fill:'#fff'});
 result.shapes.forEach(drawItem);
 $('paperCounter').textContent=(stage+1)+' / 5';
 $('paperTitle').textContent=result.title;
 $('paperWhy').textContent=result.why;
 $('paperDegree').textContent=result.dof;
 $('paperValid').textContent=result.result.valid?'通过':'失败';
 $('paperError').textContent=result.result.maxError.toExponential(1);
 $('paperScope').textContent=result.dofScope;
 $('paperPrev').disabled=stage===0;$('paperNext').disabled=stage===4;
 $('paperAudit').textContent=result.result.valid
 ?'当前原创数值模型检查通过。第'+(stage+1)+'帧的线条逐步展示，不表示教材原题已被完整核实。'
 :'几何条件未通过检查，暂停使用此演示并检查参数。';
 $('divisionValue').textContent=$('divisionCount').value;
 $('dimensionXValue').textContent=$('dimensionX').value;
 $('dimensionYValue').textContent=$('dimensionY').value;
}
function setMode(next){
 if(!group.includes(next))return;
 mode=next;stage=0;
 for(const m of group) $('mode'+m[0].toUpperCase()+m.slice(1)).setAttribute('aria-pressed',String(mode===m));
 $('divideFields').hidden=mode!=='divide';$('polygonFields').hidden=mode!=='polygon';
 $('dimensionXFields').hidden=mode!=='dimension';$('dimensionYFields').hidden=mode!=='dimension';
 view();
}
for(const m of group)$('mode'+m[0].toUpperCase()+m.slice(1)).addEventListener('click',()=>setMode(m));
$('paperPrev').addEventListener('click',()=>{stage=Math.max(0,stage-1);view()});
$('paperNext').addEventListener('click',()=>{stage=Math.min(4,stage+1);view()});
$('paperRestart').addEventListener('click',()=>{stage=0;view()});
for(const field of ['divisionCount','polygonSides','dimensionX','dimensionY'])$(field).addEventListener('input',()=>{stage=0;view()});
setMode('divide');
})();