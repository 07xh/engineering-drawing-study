/* 自由几何建模 UI。仅编辑用户自己的点/线段，没有隐式长度约束。 */
(function(){'use strict';
const Free=window.DrawingFreeGeometry,Sheet=window.DrawingFreeSheet,Spatial=window.DrawingFreeSpatial;
const $=id=>document.getElementById(id);
if(!Free||!Sheet||!Spatial){$('freeStatus').textContent='自由建模组件加载不完整';return}
let state=Free.create(),history=[],selectedPoint=null,editingId=null;
let viewer=null,yaw=.72,pitch=.52,zoom=1,drag=null;
const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n};
function number(id){
 const raw=$(id).value.trim();if(!raw)throw Error('请填写全部三维坐标');
 const value=Number(raw);if(!Number.isFinite(value))throw Error('空间坐标必须是有限数字');
 return value;
}
function selected(){return state.points.find(p=>p.id===selectedPoint)||null}
function emptyForm(){
 selectedPoint=null;editingId=null;$('freePointName').value='';
 $('freeX').value=String(25+Math.min(40,state.points.length*12));
 $('freeY').value='20';$('freeZ').value='35';$('freeSavePoint').textContent='添加空间点';
 render();
}
function choose(id){
 const p=state.points.find(q=>q.id===id);if(!p)return;
 selectedPoint=id;editingId=id;$('freePointName').value=p.id;
 for(const axis of ['x','y','z'])$('free'+axis.toUpperCase()).value=String(p[axis]);
 $('freeSavePoint').textContent='保存点的修改';render();
}
function mutate(action,preferred){
 const next=Free.apply(state,action);
 history.push({state,selectedPoint});if(history.length>70)history.shift();
 state=next;
 if(preferred!==undefined)selectedPoint=preferred;
 if(selectedPoint&&!state.points.some(p=>p.id===selectedPoint))selectedPoint=null;
 render();
}
function button(label,fn){
 const b=el('button',label);b.type='button';b.addEventListener('click',fn);return b;
}
function edgeSelections(){
 const a=$('freeEdgeA'),b=$('freeEdgeB'),keepA=a.value,keepB=b.value;
 for(const select of [a,b]){
  select.replaceChildren();
  for(const p of state.points){const opt=el('option',p.id);opt.value=p.id;select.append(opt)}
 }
 a.value=state.points.some(p=>p.id===keepA)?keepA:(selectedPoint||state.points[0]?.id||'');
 b.value=state.points.some(p=>p.id===keepB)?keepB:(state.points.find(p=>p.id!==a.value)?.id||a.value);
 $('freeAddEdge').disabled=state.points.length<2;
}
function render(){
 const summary=Free.summary(state),model=Free.asModel(state);
 $('freeDegrees').textContent=String(summary.unconstrainedDegrees);
 $('freeCounts').textContent=summary.points+' 点 · '+summary.segments+' 线段';
 $('freeMathNote').textContent=summary.note;
 $('freeDeletePoint').disabled=!selected();
 const list=$('freePointList');list.replaceChildren();
 if(!summary.points)list.append(el('li','空白场景：先创建第一个空间点。'));
 for(const p of state.points){
  const row=el('li');if(p.id===selectedPoint)row.className='current';
  const chooseButton=button(p.id+' · ('+[p.x,p.y,p.z].join('，')+')',()=>choose(p.id));
  const actions=el('div');actions.className='actions';
  actions.append(button('删除',()=>{
   try{mutate({type:'remove-point',id:p.id});if(editingId===p.id)emptyForm();$('freeStatus').textContent='点 '+p.id+' 及关联线段已删除。'}
   catch(error){$('freeStatus').textContent=error.message}
  }));
  row.append(chooseButton,actions);list.append(row);
 }
 const edges=$('freeEdgeList');edges.replaceChildren();
 if(!summary.segments)edges.append(el('li','还没有线段。请先添加两个点。'));
 for(const edge of state.edges){
  const row=el('li');row.append(el('span',edge.a+' — '+edge.b));
  const actions=el('div');actions.className='actions';
  actions.append(button('删除',()=>{try{mutate({type:'remove-edge',a:edge.a,b:edge.b});$('freeStatus').textContent='线段已删除。'}catch(error){$('freeStatus').textContent=error.message}}));
  row.append(actions);edges.append(row);
 }
 edgeSelections();
 $('freeSheet').innerHTML=Sheet.markup(state,{selectedPoint,showGuides:$('freeShowGuides').checked});
 if(viewer)viewer.update(model,{kind:'none',degrees:null,example:null,directions:[]},{selectedVertex:selectedPoint});
 else $('freeSpace').innerHTML=Spatial.markup(state,{selectedPoint,yaw,pitch,zoom});
 $('freeUndo').disabled=!history.length;$('freeClear').disabled=!summary.points;
}
$('freePointForm').addEventListener('submit',event=>{
 event.preventDefault();
 try{
  const name=$('freePointName').value.trim(),coords={x:number('freeX'),y:number('freeY'),z:number('freeZ')};
  if(editingId&&state.points.some(p=>p.id===editingId)){
   const id=name||editingId;
   mutate({type:'edit-point',id:editingId,newId:id,...coords},id);
   editingId=id;$('freeStatus').textContent='空间点已修改，三维图与三视图同步更新。';
  }else{
   mutate({type:'add-point',id:name||undefined,...coords});
   choose(state.points[state.points.length-1].id);
   $('freeStatus').textContent='空间点已添加，三面投影已生成。';
  }
 }catch(error){$('freeStatus').textContent='无法保存空间点：'+error.message}
});
$('freeNewPoint').addEventListener('click',emptyForm);
$('freeDeletePoint').addEventListener('click',()=>{
 if(!selectedPoint)return;
 const id=selectedPoint;
 try{mutate({type:'remove-point',id},null);emptyForm();$('freeStatus').textContent='已删除点 '+id+' 及其关联线段。'}
 catch(error){$('freeStatus').textContent=error.message}
});
$('freeEdgeForm').addEventListener('submit',event=>{
 event.preventDefault();
 try{mutate({type:'add-edge',a:$('freeEdgeA').value,b:$('freeEdgeB').value});$('freeStatus').textContent='线段已建立；未施加固定长度约束。'}
 catch(error){$('freeStatus').textContent='线段未添加：'+error.message}
});
$('freeUndo').addEventListener('click',()=>{
 if(!history.length)return;
 const prior=history.pop();state=prior.state;selectedPoint=prior.selectedPoint;
 if(selectedPoint&&state.points.some(p=>p.id===selectedPoint))choose(selectedPoint);
 else emptyForm();
 $('freeStatus').textContent='已撤销上一步几何编辑。';
});
$('freeClear').addEventListener('click',()=>{
 try{mutate({type:'clear'},null);emptyForm();$('freeStatus').textContent='已清空几何图形，可以从零创建。'}
 catch(error){$('freeStatus').textContent=error.message}
});
$('freeShowGuides').addEventListener('change',render);
function selectFromSvg(event){
 const target=event.target.closest?.('[data-point]');
 if(!target)return;
 const id=target.getAttribute('data-point');if(id)choose(id);
}
for(const id of ['freeSpace','freeSheet']){
 $(id).addEventListener('click',selectFromSvg);
 $(id).addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){selectFromSvg(event);event.preventDefault?.()}
 });
}
for(const control of document.querySelectorAll('[data-nudge]')){
 control.addEventListener('click',()=>{
  const p=selected();if(!p){$('freeStatus').textContent='请先选中一个空间点。';return}
  const [axis,raw]=control.getAttribute('data-nudge').split(':');
  if(!['x','y','z'].includes(axis))return;
  const delta=Number(raw);
  try{
   const newCoords={x:p.x,y:p.y,z:p.z};newCoords[axis]+=delta;
   mutate({type:'edit-point',id:p.id,newId:p.id,...newCoords},p.id);
   choose(p.id);$('freeStatus').textContent='已移动 '+p.id+'，三面投影同时更新。';
  }catch(error){$('freeStatus').textContent=error.message}
 });
}
const svg=$('freeSpace');
svg.addEventListener('pointerdown',event=>{
 if(viewer||event.button!==undefined&&event.button!==0)return;
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,yaw,pitch};
 svg.setPointerCapture?.(event.pointerId);svg.classList.add('dragging');
});
svg.addEventListener('pointermove',event=>{
 if(!drag||event.pointerId!==drag.id)return;
 yaw=drag.yaw+(event.clientX-drag.x)*.009;
 pitch=Math.max(-1.3,Math.min(1.3,drag.pitch+(event.clientY-drag.y)*.008));render();
});
function endDrag(event){if(drag&&drag.id===event.pointerId){drag=null;svg.classList.remove('dragging')}}
svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
$('freeTurnLeft').addEventListener('click',()=>{if(viewer)viewer.turn(-.2);else{yaw-=.2;render()}});
$('freeTurnRight').addEventListener('click',()=>{if(viewer)viewer.turn(.2);else{yaw+=.2;render()}});
$('freeZoomIn').addEventListener('click',()=>{if(viewer)viewer.zoom(1.15);else{zoom=Math.min(2.5,zoom*1.15);render()}});
$('freeZoomOut').addEventListener('click',()=>{if(viewer)viewer.zoom(1/1.15);else{zoom=Math.max(.5,zoom/1.15);render()}});
$('freeResetView').addEventListener('click',()=>{if(viewer)viewer.resetCamera();else{yaw=.72;pitch=.52;zoom=1;render()}});
try{
 viewer=window.DrawingLabThreeViewer?.mount($('freeThree'),id=>choose(id))||null;
 if(viewer){
  $('freeThree').hidden=false;$('freeSpace').hidden=true;
  $('freeViewerStatus').textContent='Three.js 模式：可旋转缩放，也可点击顶点选中。';
 }else $('freeViewerStatus').textContent='当前使用轻量 SVG 三维观察器。';
}catch(error){viewer=null;$('freeViewerStatus').textContent='WebGL 不可用，已启用 SVG 三维观察器。';}
render();
window.DrawingFreeModelerController={
 getState:()=>JSON.parse(JSON.stringify(state)),
 apply:action=>mutate(action),
 select:choose,
 reset:emptyForm
};
})();
