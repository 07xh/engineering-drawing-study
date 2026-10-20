(function(){'use strict';
const math=window.CompositeGeometry,$=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
if(!math){$('compAudit').textContent='动态几何模型加载失败，请刷新。';return}
const modes=['composite','section','intersection'];
const palette={known:'#287552',found:'#2677b3',axis:'#9daea3',tentative:'#81b59a',
 guide:'#bc8432',transfer:'#be8744',check:'#8a9f8e',section:'#2677b3',
 candidate:'#8c99a0',intersection:'#2677b3',aux:'#bd8737'};
let mode='composite',stage=0;
function elem(tag,atts,txt){
 const node=document.createElementNS(ns,tag);
 for(const [k,v] of Object.entries(atts||{}))node.setAttribute(k,String(v));
 if(txt!==undefined)node.textContent=txt;
 $('compositeBoard').append(node);return node;
}
function draw(s){
 const color=palette[s.style]||'#527362',dash=['guide','axis','tentative','transfer','check','aux'].includes(s.style);
 const base={stroke:color,'stroke-width':s.style==='intersection'?2.4:2,fill:'none',
   ...(dash?{'stroke-dasharray':s.style==='axis'?'3 5':'7 5'}:{})};
 if(s.kind==='panel'){
  const [x,y,w,h]=s.rect;
  elem('rect',{x,y,width:w,height:h,rx:10,fill:'#f7faf7',stroke:'#cddfd2'});
  elem('text',{x:x+12,y:y+19,'font-size':16,'font-weight':700,fill:'#416b53'},s.label);
 }else if(s.kind==='rect')elem('rect',{x:s.x,y:s.y,width:s.w,height:s.h,...base});
 else if(s.kind==='line'){
  const [x1,y1,x2,y2]=s.xy;elem('line',{x1,y1,x2,y2,...base});
 }else if(s.kind==='point'){
  const [x,y]=s.at;elem('circle',{cx:x,cy:y,r:4.2,fill:color,stroke:'#fff','stroke-width':1});
 }else if(s.kind==='circle')elem('circle',{cx:s.center[0],cy:s.center[1],r:s.r,...base});
 else if(s.kind==='polyline')elem('polyline',{points:s.points.map(p=>p.join(',')).join(' '),...base});
}
function params(){
 if(mode==='composite')return{x:+$('compX').value,y:+$('compY').value};
 if(mode==='section')return{h:+$('compHeight').value};
 return{r:+$('compRadius').value};
}
function render(){
 let frame;try{frame=math.frame(mode,params(),stage)}
 catch(err){$('compAudit').textContent='当前数学参数不可用：'+err.message;return}
 const board=$('compositeBoard');board.replaceChildren();elem('rect',{x:0,y:0,width:870,height:590,fill:'#fff'});
 frame.shapes.forEach(draw);
 $('compCounter').textContent=(stage+1)+' / 5';
 $('compStepTitle').textContent=frame.title;
 $('compStepExplain').textContent=frame.why;
 $('compDegree').textContent=String(frame.dof);
 $('compValid').textContent=frame.valid?'通过':'失败';
 $('compError').textContent=frame.error.toExponential(1);
 $('compFreedom').textContent=frame.objectScope;
 $('compAudit').textContent=(frame.valid?'数学模型已验证。':'几何约束未通过，不能认定图形可靠。')+
  ' '+frame.details+' 仅展示原创建模步骤，不包含教材原题完整图及遮挡判定。';
 $('compSource').textContent='资料范围：'+frame.source;
 $('compPrev').disabled=stage===0;$('compNext').disabled=stage===4;
 for(const id of ['compX','compY','compHeight','compRadius'])$(id+'Value').textContent=$(id).value;
}
function switchMode(next){
 if(!modes.includes(next))return;
 mode=next;stage=0;
 for(const m of modes)$('tab'+m[0].toUpperCase()+m.slice(1)).setAttribute('aria-pressed',String(m===mode));
 $('compXField').hidden=mode!=='composite';$('compYField').hidden=mode!=='composite';
 $('compHeightField').hidden=mode!=='section';$('compRadiusField').hidden=mode!=='intersection';
 render();
}
for(const m of modes)$('tab'+m[0].toUpperCase()+m.slice(1)).addEventListener('click',()=>{
 switchMode(m);try{history.replaceState(null,'','?mode='+encodeURIComponent(m))}catch(e){}
});
$('compPrev').addEventListener('click',()=>{stage=Math.max(0,stage-1);render()});
$('compNext').addEventListener('click',()=>{stage=Math.min(4,stage+1);render()});
$('compReset').addEventListener('click',()=>{stage=0;render()});
for(const id of ['compX','compY','compHeight','compRadius'])$(id).addEventListener('input',()=>{stage=0;render()});
const query=new URLSearchParams(location.search).get('mode');
switchMode(modes.includes(query)?query:'composite');
})();