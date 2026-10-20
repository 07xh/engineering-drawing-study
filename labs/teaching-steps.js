/* 教材步进：只控制统一约束引擎，不另建图形与求解逻辑。 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
if(!$('teachingSteps')||!window.setConstraintExplorerFlags)return;
let order='H',stage=0;
const stages={
 H:[
 ['观察自由点','空间点的 x、y、z 都可变化，剩余 3 个自由度。'],
 ['给定水平投影 k','水平投影确定 x、y，K 只能沿水平投射线改变高度，剩余 1 个自由度。'],
 ['加入平面 ABC','水平投射线与 ABC 平面相交，确定唯一 K，剩余 0 个自由度。'],
 ['完成辅助作图','利用平面内辅助直线与三面联系线检查 K 的正面、侧面投影。']
 ],
 P:[
 ['观察自由点','空间点的 x、y、z 都可变化，剩余 3 个自由度。'],
 ['给定平面 ABC','平面方程限制一个独立方向，K 在平面上仍可移动，剩余 2 个自由度。'],
 ['加入水平投影 k','水平投射线与 ABC 平面相交，确定唯一 K，剩余 0 个自由度。'],
 ['完成辅助作图','利用平面内辅助直线与三面联系线检查 K 的正面、侧面投影。']
 ]
};
function render(){
 const flags=stage===0?{}:stage===1?{[order]:true}:{H:true,P:true};
 window.setConstraintExplorerFlags(flags);
 // 沿用原实验室的辅助直线绘制逻辑；只有第 4 步展示。
 $('orderH').click(); // 恢复默认旧步骤，再同步实际顺序
 if(order==='P')$('orderP').click();
 if(stage===3){$('next').click();$('next').click()}
 const item=stages[order][stage],r=window.ConstraintExplorerState.analysis.result;
 $('teachingStepTitle').textContent='第 '+(stage+1)+' / 4 步：'+item[0];
 $('teachingStepExplanation').textContent=item[1]+' 当前引擎结果：'+(r.inconsistent?'无解':r.degrees+' 个自由度')+'。';
 $('teachingBack').disabled=stage===0;
 $('teachingNext').disabled=stage===3;
 $('teachingOrderH').setAttribute('aria-pressed',String(order==='H'));
 $('teachingOrderP').setAttribute('aria-pressed',String(order==='P'));
 $('teachingStepNumber').value=String(stage);
 $('teachingStepNumber').setAttribute('aria-valuetext',item[0]);
}
$('teachingOrderH').onclick=()=>{order='H';stage=0;render()};
$('teachingOrderP').onclick=()=>{order='P';stage=0;render()};
$('teachingBack').onclick=()=>{stage=Math.max(0,stage-1);render()};
$('teachingNext').onclick=()=>{stage=Math.min(3,stage+1);render()};
$('teachingRestart').onclick=()=>{stage=0;render()};
$('teachingStepNumber').onchange=e=>{stage=Math.max(0,Math.min(3,+e.target.value||0));render()};
for(const id of ['constraintH','constraintP','constraintZ'])$(id).addEventListener('change',()=>{$('teachingStepExplanation').textContent='已手动调整条件；下方图形以当前自由探索条件为准。点击“重新开始”恢复教材演示。'});
render();
})();
