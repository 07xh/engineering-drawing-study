'use strict';
/**
 * DA-07 V5: explanatory prose attached ONLY to actions in an already-built
 * R1/02 solver-driven motion timeline. Never solve geometry or disclose a
 * future result's proof. This is deliberately separate from drawing/grading.
 */
const NAMES=Object.freeze({line:'辅助直线',circle:'辅助圆',point:'定位点',arc:'有向连接圆弧'});
const pct=x=>Math.max(0,Math.min(100,Math.round(x*100)));
const fallback=(status,text)=>Object.freeze({
 status,title:text,why:'',basis:'',check:'',step:0,action:0,
 totalActions:0,percent:0,canClaimFinal:false
});
function at({motion,reasons,frame,revision,mode='full'}={}){
 if(mode!=='full')return fallback('hidden','逐步提示和自主作图不显示完整解题过程');
 if(!motion||motion.status!=='ready'||motion.revision!==revision||
    !frame||frame.invalid||frame.revision!==revision||
    !Array.isArray(motion.steps)||!Array.isArray(motion.timeline?.steps)||
    motion.steps.length!==motion.timeline.steps.length||
    !Number.isInteger(frame.activeStepIndex)||
    frame.activeStepIndex<0||frame.activeStepIndex>=motion.steps.length)
  return fallback('unverified','没有与当前条件一致的有效绘图帧');
 const proof=motion.verified===true;
 const reasonsReady=proof&&reasons?.status==='ready'&&reasons.revision===revision&&
  reasons.kind===motion.kind&&
  reasons.steps?.length===motion.steps.length&&
  reasons.steps.every((s,i)=>s.id===motion.steps[i].id);
 if(proof&&!reasonsReady)
  return fallback('blocked','数学证明与正在播放的笔迹不一致，暂停讲解');
 const index=frame.activeStepIndex;
 const step=motion.steps[index];
 const timelineStep=motion.timeline.steps[index];
 if(step.id!==timelineStep.id||!Array.isArray(step.actions)||
    timelineStep.actions.length!==Math.max(1,step.actions.length)||
    !step.actions.every((action,j)=>action.id===timelineStep.actions[j].id))
  return fallback('blocked','笔迹步骤与真实动作的对应关系不成立');
 const completed=!!frame.done;
 if(completed&&index!==motion.steps.length-1)
  return fallback('blocked','不完整的时间轴不能报告最终完成');
 if(!step.actions.length)return Object.freeze({
  status:completed?'complete':'no-action',
  title:'当前没有可验证的新笔迹',why:'只展示求解器已有的辅助几何，不猜测最终连接弧。',
  basis:'没有新的数学绘图动作。',check:'不存在经过验证的最终连接弧。',
  step:index+1,action:0,totalActions:0,percent:completed?100:0,canClaimFinal:false
 });
 const selectedIndex=step.actions.findIndex(action=>{
  const f=frame.actionFractions?.[action.id];return typeof f==='number'&&f<1;
 });
 const j=selectedIndex<0?step.actions.length-1:selectedIndex;
 const action=step.actions[j];
 const fraction=frame.actionFractions?.[action.id];
 if(!Number.isFinite(fraction)||fraction<0||fraction>1||!Object.hasOwn(NAMES,action.kind))
  return fallback('blocked','笔迹进度不属于有效数学动作');
 if(action.kind==='arc'&&(!proof||!reasonsReady||
    index!==motion.steps.length-1))
  return fallback('blocked','没有有效最终圆弧证明，不能生成结果讲解');
 const finished=completed&&proof&&action.kind==='arc';
 const detail=reasonsReady?reasons.steps[index]:null;
 let shape=NAMES[action.kind];
 if(action.kind==='circle'&&motion.kind==='circles'&&index===0)
  shape='第 '+(j+1)+' 条圆心辅助圆轨迹';
 else if(action.kind==='circle'&&motion.kind==='segment-circle')
  shape='已知圆心的同心辅助圆';
 else if(action.kind==='line'&&motion.kind==='segments'&&index<2)
  shape='第 '+(index+1)+' 条半径偏移辅助线';
 else if(action.kind==='line'&&motion.kind==='segment-circle'&&index===0)
  shape='有限线段的半径偏移线';
 else if(action.kind==='point'&&((motion.kind==='circles'&&index===2)||
   (motion.kind==='segment-circle'&&index===3)||
   (motion.kind==='segments'&&index===3)))
  shape='第 '+(j+1)+' 个切点';
 const stepText=detail?.why||(
  action.kind==='circle'?'此轨迹由真实候选求解器给出，表示连接圆心可能满足的半径距离关系。':
  action.kind==='line'?'沿原始轮廓的指定距离作辅助直线；延长线不能自动当作有限轮廓。':
  action.kind==='point'?'只标记求解器给出的候选位置；候选点不等于唯一答案。':
  '连接圆弧须满足实际选择的候选分支、有限轮廓和有向 G1。'
 );
 const scope='正在显示第 '+(index+1)+' / '+motion.steps.length+
  ' 步的第 '+(j+1)+' / '+step.actions.length+' 笔';
 const checked=finished?detail.evidence:
  action.kind==='arc'?'当前有向连接弧仍在描绘；完整结果步骤结束前不公布 G1 残差或最终验收结论。':
  '当前只有本笔进度，不把辅助线、候选圆心或已画笔数当成最终 G1 证明。';
 return Object.freeze({
  status:finished?'complete':selectedIndex<0?'stage-finished':'drawing',
  title:shape+(completed?' · 绘制完成':fraction<=0?' · 尚未下笔':' · 绘制中'),
  why:stepText,
  basis:detail?.basis||scope+'；使用求解器的真实 '+NAMES[action.kind]+' 动作。',
  check:checked,
  step:index+1,action:j+1,totalActions:step.actions.length,
  percent:completed?100:pct(fraction),canClaimFinal:finished
 });
}
module.exports={at};
