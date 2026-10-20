(function(){'use strict';
const model=window.PointConstruction,engine=window.DrawingConstraints,$=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
if(!model||!engine){$('status').textContent='缺少构图计算模块，请检查资源加载。';return}
let stage=0;
function create(tag,attrs,text,board){
 const node=document.createElementNS(ns,tag);
 for(const [k,v] of Object.entries(attrs||{}))node.setAttribute(k,String(v));
 if(text!==undefined)node.textContent=text;
 board.append(node);return node;
}
function paint(shapes){
 const board=$('constructionBoard');board.replaceChildren();
 create('rect',{x:0,y:0,width:920,height:620,fill:'#fff'},undefined,board);
 for(const s of shapes){
  if(s.kind==='panel'){
   const [x,y,w,h]=s.rect;
   create('rect',{x,y,width:w,height:h,fill:'#f5faf6',stroke:'#cee1d4',rx:10},undefined,board);
   create('text',{x:x+12,y:y+20,'font-size':16,'font-weight':600,fill:'#346448'},s.label,board);
  }else if(['axis','guide','transfer45'].includes(s.kind)){
   const [x1,y1,x2,y2]=s.xy;
   const guide=s.kind!=='axis';
   create('line',{x1,y1,x2,y2,stroke:guide?'#bd8536':'#9ab5a3','stroke-width':guide?2:1.5,...(guide?{'stroke-dasharray':'7 5'}:{})},undefined,board);
  }else if(s.kind==='point'){
   const color={green:'#287552',blue:'#2873b8',red:'#b64d39'}[s.color]||'#287552';
   create('circle',{cx:s.at[0],cy:s.at[1],r:5,fill:color},undefined,board);
   create('text',{x:s.at[0]+8,y:s.at[1]-7,'font-size':15,'font-weight':600,fill:color},s.label,board);
  }
 }
}
function params(){return {x:Number($('x').value),y:Number($('y').value),z:Number($('z').value)}}
function render(){
 const data=params(),wrong=$('contradiction').checked;
 for(const coord of ['x','y','z'])$(coord+'Value').textContent=String(data[coord]);
 const frame=model.frame(data,stage,wrong),result=model.report(engine,data,wrong&&stage===4);
 paint(frame.shapes);
 $('counter').textContent=(stage+1)+' / '+model.names.length;
 $('statusTitle').textContent=frame.title;$('status').textContent=frame.why;
 $('prev').disabled=stage===0;$('next').disabled=stage===model.names.length-1;
 const chk=$('checkResult');chk.classList.toggle('bad',result.inconsistent);
 if(stage<4)chk.textContent='前两幅投影已经确定一个空间点（自由度 '+result.knownDOF+'）。继续逐步构造后才会显示第三投影的完整复核结果。';
 else chk.textContent=(result.inconsistent?'检测到矛盾：':'计算检查通过：')+result.summary+' 当前已知 V/H 的自由度为 '+result.knownDOF+'；加入 W 后'+(result.inconsistent?'为无解，不能当成“0自由度”。':'仍为 '+result.fullDOF+'，属于一致的冗余信息。');
}
$('prev').onclick=()=>{stage=Math.max(0,stage-1);render()};
$('next').onclick=()=>{stage=Math.min(stage+1,model.names.length-1);render()};
$('restart').onclick=()=>{stage=0;render()};
for(const id of ['x','y','z','contradiction'])$(id).addEventListener('input',render);
render();
})();