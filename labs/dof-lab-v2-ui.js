/* 图学课堂自由度实验室2.0：单点线性约束编辑器 + 共用双视图状态。 */
(function(){'use strict';
const Store=window.DrawingLabState,Geom=window.DrawingLabGeometry,Sheet=window.DrawingLabSheet,Spatial=window.DrawingLabSpatialPreview;
const $=id=>document.getElementById(id);
if(!Store||!Geom||!Sheet||!Spatial){$('uiStatus').textContent='实验室脚本未完整加载';return}
let state=Store.create(),history=[],editing=null,selectedVertex='',yaw=.72,pitch=.52,zoom=1,drag=null;
const schemas={
 coordinate:[{id:'axis',label:'坐标轴',kind:'select',values:['x','y','z'],default:'x'},{id:'value',label:'固定值',kind:'number',default:35}],
 projection:[{id:'plane',label:'投影面',kind:'select',values:['H','V','W'],default:'H'},
  {id:'u',label:'第一坐标',kind:'number',default:35},{id:'v',label:'第二坐标',kind:'number',default:22}],
 plane:[{id:'nx',label:'法向量 x',kind:'number',default:0},{id:'ny',label:'法向量 y',kind:'number',default:0},
  {id:'nz',label:'法向量 z',kind:'number',default:1},{id:'offset',label:'方程常数',kind:'number',default:51}],
 line:[{id:'px',label:'经过点 x',kind:'number',default:35},{id:'py',label:'经过点 y',kind:'number',default:22},
  {id:'pz',label:'经过点 z',kind:'number',default:0},{id:'dx',label:'方向 x',kind:'number',default:0},
  {id:'dy',label:'方向 y',kind:'number',default:0},{id:'dz',label:'方向 z',kind:'number',default:1}]
};
const el=(tag,content,cls)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(cls)e.className=cls;return e};
function showFields(type,values={}){
 const box=$('conditionInputs');box.replaceChildren();
 for(const item of schemas[type]){
  const wrapper=el('label',item.label);
  const control=document.createElement(item.kind==='select'?'select':'input');
  control.id='field-'+item.id;
  if(item.kind==='number'){control.type='number';control.step='any';control.required=true;control.value=String(values[item.id]??item.default)}
  else{
   for(const v of item.values){const opt=el('option',v);opt.value=v;control.append(opt)}
   control.value=String(values[item.id]??item.default);
  }
  wrapper.append(control);box.append(wrapper);
 }
}
function fieldsFromCondition(c){
 if(c.type==='coordinate')return {axis:c.axis,value:c.value};
 if(c.type==='projection')return {plane:c.plane,u:c.value[0],v:c.value[1]};
 if(c.type==='plane')return {nx:c.normal.x,ny:c.normal.y,nz:c.normal.z,offset:c.offset};
 if(c.type==='line')return {px:c.point.x,py:c.point.y,pz:c.point.z,dx:c.direction.x,dy:c.direction.y,dz:c.direction.z};
 return {};
}
function readCondition(){
 const type=$('conditionType').value;
 const raw={};
 for(const item of schemas[type]){
  const input=$('field-'+item.id),value=input.value;
  if(item.kind==='number'){
   if(value.trim()===''||!Number.isFinite(Number(value)))throw Error(item.label+'必须填写有效数字');
   raw[item.id]=Number(value);
  }else raw[item.id]=value;
 }
 if(type==='coordinate')return {type,axis:raw.axis,value:raw.value};
 if(type==='projection')return {type,plane:raw.plane,value:[raw.u,raw.v]};
 if(type==='plane')return {type,normal:{x:raw.nx,y:raw.ny,z:raw.nz},offset:raw.offset};
 return {type,point:{x:raw.px,y:raw.py,z:raw.pz},direction:{x:raw.dx,y:raw.dy,z:raw.dz}};
}
function mutate(action){
 const next=Store.apply(state,action);
 history.push(state);if(history.length>50)history.shift();
 state=next;render();
}
function beginEdit(i){
 editing=i;
 const c=state.conditions[i]?.condition;
 if(!c)return;
 $('conditionType').value=c.type;showFields(c.type,fieldsFromCondition(c));
 $('saveCondition').textContent='保存修改';$('cancelEdit').hidden=false;
 $('conditionType').focus();
}
function stopEdit(){
 editing=null;$('conditionType').value='projection';showFields('projection');
 $('saveCondition').textContent='添加条件';$('cancelEdit').hidden=true;
}
function renderFields(){
 const model=Geom.preset(state.modelId);
 const selected=$('selectedVertex'),last=selectedVertex;
 selected.replaceChildren();const empty=el('option','不选中');empty.value='';selected.append(empty);
 for(const id of Object.keys(model.points)){const opt=el('option','顶点 '+id);opt.value=id;selected.append(opt)}
 selectedVertex=Object.hasOwn(model.points,last)?last:'';selected.value=selectedVertex;
}
function button(text,action,disabled=false){
 const b=el('button',text);b.type='button';b.disabled=disabled;b.addEventListener('click',action);return b;
}
function render(){
 const report=Store.compute(state),model=report.model,candidate=report.point;
 $('solid').value=state.modelId;
 const list=$('conditionList');list.replaceChildren();
 if(!state.conditions.length)list.append(el('li','尚未添加任何条件。空间点 P 有 3 个位置自由度。','muted'));
 let activeIndex=0;
 for(const [i,item] of state.conditions.entries()){
  const row=el('li',undefined,'condition'+(item.enabled?'':' off'));
  const title=el('div');title.append(el('strong',(i+1)+'. '+Store.name(item.condition)));
  const description=el('div',item.enabled?(()=>{
   const step=report.analysis.steps[activeIndex++];
   return step.status==='contradiction'?'条件矛盾 · 无解':step.status==='redundant'?'重复或非独立条件 · 自由度不变':step.explanation
  })():'条件已禁用 · 不参加计算','mini');
  title.append(description);
  const controls=el('div',undefined,'actions');
  controls.append(button(item.enabled?'禁用':'启用',()=>{mutate({type:'toggle',index:i});stopEdit()}));
  controls.append(button('编辑',()=>beginEdit(i)));
  controls.append(button('删除',()=>{mutate({type:'remove',index:i});stopEdit()}));
  row.append(title,controls);list.append(row);
 }
 const result=report.analysis.result;
 $('degrees').textContent=result.inconsistent?'无解':String(result.degrees);
 $('status').textContent=result.inconsistent?'约束之间存在矛盾':'剩余自由度';
 $('rank').textContent='独立约束数：'+result.rank;
 $('dofResult').classList.toggle('is-conflict',result.inconsistent);
 $('analysis').textContent=report.analysis.summary;
 $('scope').textContent=report.scope+' '+(result.inconsistent?'当前没有可行空间点，请检查冲突条件。':candidate.warning);
 $('pointCoordinates').textContent=result.inconsistent?'不存在满足全部条件的 P。':(result.degrees?'当前 P* 是可行位置样例：':'确定的空间点 P：')+
  ' ('+['x','y','z'].map(k=>Number(candidate.example[k].toFixed(2))).join('，')+')';
 $('space').innerHTML=Spatial.markup(model,candidate,{yaw,pitch,zoom,selectedVertex});
 $('sheet').innerHTML=result.inconsistent?
  Sheet.markup(model,state.trial,{showTarget:false,showGuides:false,showWireframe:$('showWireframe').checked,showLabels:$('showLabels').checked,selectedVertex}):
  Sheet.markup(model,candidate.example,{showGuides:$('showGuides').checked,showWireframe:$('showWireframe').checked,showLabels:$('showLabels').checked,selectedVertex});
 if(result.inconsistent){
  // The shared sheet must never depict the trial point as a solution to contradictory constraints.
  $('sheet').insertAdjacentHTML('beforeend','<text x="50" y="570" fill="#a44e38" font-size="19">约束冲突：没有可行投影点</text>');
 }
 $('undo').disabled=history.length===0;$('clear').disabled=state.conditions.length===0;
}
$('conditionType').addEventListener('change',()=>showFields($('conditionType').value));
$('conditionForm').addEventListener('submit',event=>{
 event.preventDefault();
 try{
  const condition=readCondition();
  Store.validCondition(condition);
  mutate(editing===null?{type:'add',condition}:{type:'edit',index:editing,condition});
  $('uiStatus').textContent='约束已应用，空间图与单张工程图纸已同步更新。';
  stopEdit();
 }catch(error){$('uiStatus').textContent='条件无效：'+error.message}
});
$('cancelEdit').addEventListener('click',stopEdit);
$('undo').addEventListener('click',()=>{if(!history.length)return;state=history.pop();stopEdit();render()});
$('clear').addEventListener('click',()=>{try{mutate({type:'clear'});stopEdit()}catch(error){$('uiStatus').textContent=error.message}});
$('solid').addEventListener('change',()=>{try{mutate({type:'set-model',value:$('solid').value});renderFields()}catch(error){$('uiStatus').textContent=error.message}});
$('selectedVertex').addEventListener('change',()=>{selectedVertex=$('selectedVertex').value;render()});
for(const id of ['showGuides','showWireframe','showLabels'])$(id).addEventListener('change',render);
for(const id of ['trialX','trialY','trialZ'])$(id).addEventListener('change',()=>{
 try{
  const values=['X','Y','Z'].map(k=>{const v=$('trial'+k).value;if(!v.trim()||!Number.isFinite(Number(v)))throw Error('试探点坐标无效');return Number(v)});
  mutate({type:'set-trial',value:{x:values[0],y:values[1],z:values[2]}});
 }catch(error){$('uiStatus').textContent=error.message}
});
const spatial=$('space');
spatial.addEventListener('pointerdown',event=>{
 if(event.button!==undefined&&event.button!==0)return;
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,yaw,pitch};
 spatial.setPointerCapture?.(event.pointerId);spatial.classList.add('dragging');
});
spatial.addEventListener('pointermove',event=>{
 if(!drag||event.pointerId!==drag.id)return;
 yaw=drag.yaw+(event.clientX-drag.x)*.009;
 pitch=Math.max(-1.27,Math.min(1.27,drag.pitch+(event.clientY-drag.y)*.008));
 render();
});
function endDrag(event){if(drag&&event.pointerId===drag.id){drag=null;spatial.classList.remove('dragging')}}
spatial.addEventListener('pointerup',endDrag);spatial.addEventListener('pointercancel',endDrag);
$('turnLeft').addEventListener('click',()=>{yaw-=.2;render()});
$('turnRight').addEventListener('click',()=>{yaw+=.2;render()});
$('zoomIn').addEventListener('click',()=>{zoom=Math.min(2.5,zoom*1.15);render()});
$('zoomOut').addEventListener('click',()=>{zoom=Math.max(.5,zoom/1.15);render()});
$('resetView').addEventListener('click',()=>{yaw=.72;pitch=.52;zoom=1;render()});
showFields('projection');renderFields();render();
window.DrawingLabV2Controller={getState:()=>JSON.parse(JSON.stringify(state)),apply:action=>{mutate(action);renderFields()},getAnalysis:()=>Store.compute(state).analysis};
})();
