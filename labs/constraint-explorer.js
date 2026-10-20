/* 统一视图控制器：只管理条件与求解，原有 #space/#sheet 是唯一绘图区域 */
(function(){
'use strict';
const engine=window.DrawingConstraints,$=id=>document.getElementById(id);
if(!engine||!$('constraintExplorer'))return;
const state={H:true,P:false,Z:false};
const plane={type:'plane',normal:{x:-.3,y:-.4,z:1},offset:10};
const names={H:'已知水平投影 k（固定 x、y）',P:'K 位于平面 ABC',Z:'已知高度 z'};
function update(){
 const x=+$('kx').value,y=+$('ky').value,z=+$('freeHeight').value;
 const conditions=[];
 if(state.H)conditions.push({type:'projection',plane:'H',value:[x,y]});
 if(state.P)conditions.push(plane);
 if(state.Z)conditions.push({type:'coordinate',axis:'z',value:z});
 const a=engine.analyze(conditions),r=a.result;
 let point=null;
 if(!r.inconsistent){
  if(r.degrees===0)point={x:r.particular[0],y:r.particular[1],z:r.particular[2]};
  else if(state.P&&state.Z)point={x:(z-10-.4*y)/.3,y,z};
  else if(state.P)point={x,y,z:10+.3*x+.4*y};
  else point={x,y,z};
 }
 window.ConstraintExplorerState={flags:{...state},analysis:a,point};
 for(const key of ['H','P','Z'])$('constraint'+key).checked=state[key];
 $('explorerDof').textContent=r.inconsistent?'无解：约束互相矛盾':'剩余 '+r.degrees+' 个自由度';
 $('explorerLocus').textContent=a.summary;
 const steps=$('explorerSteps');steps.replaceChildren();
 let i=0;
 for(const key of ['H','P','Z']){
  if(!state[key])continue;
  const s=a.steps[i++],p=document.createElement('p');p.className='step';
  p.textContent=names[key]+'：'+(s.status==='redundant'?'重复条件':s.status==='contradiction'?'矛盾条件':'独立约束')+'；'+s.explanation;steps.append(p);
 }
 if(!i)steps.textContent='无约束：点可在三维空间内移动。';
 $('explorerStrategy').textContent=r.inconsistent?'当前条件无解。请检查高度是否等于平面在 (x,y) 处的高度 '+(10+.3*x+.4*y).toFixed(2)+'。':state.H&&state.P?'由 k 确定 x、y，再沿水平投射线与 ABC 平面相交求出 z；用联系线绘制正面和侧面投影。':state.P&&state.Z?'定高平面与 ABC 的交集是一条直线；沿交线寻找满足其他条件的点。':state.H?'k 确定 x、y，沿竖直投射线寻找 K；仍需高度或平面从属条件。':state.P?'K 可在 ABC 平面内移动；选择平面内辅助线求相应投影。':state.Z?'高度固定，K 可在水平面内移动；仍需确定水平位置。':'自由点有三个位置自由度，先添加已知投影或平面条件。';
 window.renderUnifiedConstraintLab?.();
}
window.updateConstraintExplorer=update;
for(const key of ['H','P','Z'])$('constraint'+key).addEventListener('change',e=>{state[key]=e.target.checked;update()});
for(const id of ['kx','ky','freeHeight'])$(id).addEventListener('input',update);
$('constraintAll').onclick=()=>{state.H=true;state.P=true;state.Z=false;update()};
$('constraintNone').onclick=()=>{state.H=false;state.P=false;state.Z=false;update()};
$('constraintReset').onclick=()=>{state.H=true;state.P=false;state.Z=false;update()};
update();
})();
