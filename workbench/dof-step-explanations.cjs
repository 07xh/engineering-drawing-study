'use strict';
/**
 * DA-07 V5 proof-linked PAPER explanations. This is a presentation adapter,
 * not a solver and not a source of fresh coordinates or independent constraints.
 */
const Constraints=require('../labs/constraint-engine.js');
const Geometry=require('../labs/dof-lab-geometry.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const AXES=['x','y','z'];
const FACTS=Object.freeze([
 {id:'VH',title:'V ↔ H：同一空间 x 坐标',
  why:'正面投影与水平投影来自同一个空间点，沿投影联系线对应的 x 坐标必须相同。',
  basis:'第一角投影不变量：V 与 H 的 x 坐标相同。',
  check:'已核对同名 x 坐标（sameX）与真实第一角投影联系线。'},
 {id:'height-VW',title:'V ↔ W：同一高度 z',
  why:'正面与侧面投影反映同一个空间点的高度，水平联系线用于传递 z。',
  basis:'第一角投影不变量：V 与 W 的高度 z 相同。',
  check:'已核对两面高度一致（sameHeight）。'},
 {id:'depth-HM',title:'H → 45°：转移深度 y',
  why:'45° 辅助线只用于把 H 面的深度传递到侧面投影作图位置，并非新的空间限制条件。',
  basis:'第一角展开辅助作图：使用图纸右下角 45° 转移线。',
  check:'已核对深度转移点位于 45° 辅助线（miterOn45）。'},
 {id:'depth-MW',title:'45° → W：完成深度转移',
  why:'从经过检验的转移点作联系线到 W，保证侧面投影使用与 H 相同的深度 y。',
  basis:'第一角投影不变量：H 与 W 的深度 y 相同。',
  check:'已核对 H/W 深度一致（sameDepth）。'}
]);
const blocked=reason=>Object.freeze({status:'blocked',reason,steps:[],degrees:null,rank:null});
function name(condition){
 const c=condition||{};
 if(c.type==='coordinate'&&AXES.includes(c.axis)&&finite(c.value))
  return c.axis+' = '+c.value;
 if(c.type==='projection'&&['H','V','W'].includes(c.plane)&&
    Array.isArray(c.value)&&c.value.length===2&&c.value.every(finite))
  return c.plane+' 面投影';
 if(c.type==='plane')return '点在指定平面上';
 if(c.type==='line')return '点在指定空间直线上';
 return '未识别的约束';
}
function build(report,plan){
 if(plan?.status!=='ready'||!report?.analysis||!Array.isArray(report.active)||
    plan.steps?.length!==5||!AXES.every(axis=>finite(plan.modelPoint?.[axis])))
  return blocked('缺少已验证的五步第一角投影和真实线性约束');
 let verified;
 try{verified=Constraints.analyze(report.active)}
 catch{return blocked('激活条件无法重新验证')}
 const result=verified.result;
 if(result.inconsistent||!Number.isInteger(result.rank)||result.rank<0||
    result.rank>3||plan.degrees!==result.degrees||
    plan.degreeStatus!==(result.degrees===0?'unique':'sample')||
    report.analysis.result?.rank!==result.rank||
    report.analysis.result?.degrees!==result.degrees)
  return blocked('自由度、秩与现有数学证明不一致');
 const projection=Geometry.transfer(plan.modelPoint);
 if(!projection?.checks||!Object.values(projection.checks).every(x=>x===true)||
    projection.guide?.length!==4||
    FACTS.some((f,i)=>plan.guides[i]?.kind!==f.id||
     projection.guide[i]?.kind!==f.id||
     !AXES.slice(0,2).every(axis=>Math.abs(
      plan.guides[i].from[axis]-projection.guide[i].from[axis])<1e-7&&
      Math.abs(plan.guides[i].to[axis]-projection.guide[i].to[axis])<1e-7)))
  return blocked('投影辅助线与求解器的几何结果不一致');
 // A coordinate is fixed only when EVERY nullspace direction has 0 there.
 // Plane/line conditions may fix no individual axis; do not claim otherwise.
 const fixedAxes=AXES.filter((axis,index)=>
  result.directions.every(direction=>Array.isArray(direction)&&
   finite(direction[index])&&Math.abs(direction[index])<=1e-10));
 const current=verified.steps.map((step,index)=>{
  const newlyIndependent=step.status==='independent'?
   step.before-step.after:0;
  return Object.freeze({id:index+1,name:name(report.active[index]),
   kind:step.status,addedRank:newlyIndependent,before:step.before,after:step.after});
 });
 const evidence=current.slice(0,4).map(x=>
  '条件 '+x.id+'（'+x.name+'）：'+
  (x.kind==='redundant'?'冗余，未增加独立约束':
   '新增 '+x.addedRank+' 个独立约束，自由度 '+x.before+' → '+x.after));
 if(current.length>4)evidence.push('其余 '+(current.length-4)+' 项已参与数学求解');
 const total='当前启用 '+current.length+' 项条件，独立约束秩 '+result.rank+
  '；空间点剩余 '+result.degrees+' 个自由度。';
 const axisMessage=fixedAxes.length?
  '当前由条件单独确定的坐标轴：'+fixedAxes.join('、')+'。':
  '当前尚无由条件单独确定的坐标轴。';
 const commonFreedom=total+' '+axisMessage+
  ' 注意：画联系线只是表达投影关系，不新增独立约束，不能据此减少自由度。';
 const steps=FACTS.map((fact,i)=>Object.freeze({
  id:plan.steps[i].id,title:fact.title,why:fact.why,basis:fact.basis,
  freedom:commonFreedom,check:fact.check,
  evidence:evidence.length?evidence.join('；'):'尚无用户约束；显示的只是可行示例 P*。'
 }));
 steps.push(Object.freeze({
  id:plan.steps[4].id,title:result.degrees===0?'显示已确定的空间点 P':'显示一个可行示例位置 P*',
  why:result.degrees===0?
   '实际激活的线性约束秩为 3，经求解与残差复核后，该空间点在当前线性模型内被唯一确定。':
   '实际约束秩不足 3，结果点是从可行集合中选择的一种位置；还能沿剩余自由方向移动。',
  basis:result.degrees===0?
   '来自原始约束的独立秩为 3，而不是因为画完五步就得到唯一解。':
   '自由度 = 3 − 已核验约束秩；辅助线数量不会改变这一结论。',
  freedom:commonFreedom,
  check:'同一空间点的 V/H/W 投影与 45° 深度转移已经全部复核；只在本步完成后显示点。',
  evidence:evidence.length?evidence.join('；'):'尚无用户约束；空间点有 3 个自由度。'
 }));
 return Object.freeze({status:'ready',revision:plan.revision,
  degrees:result.degrees,rank:result.rank,activeCount:current.length,
  fixedAxes:Object.freeze(fixedAxes),steps:Object.freeze(steps),
  label:plan.label});
}
function at(lesson,frame){
 if(lesson?.status!=='ready'||!frame||frame.invalid||frame.revision!==lesson.revision)
  return {ready:false,title:'待开始',why:'',basis:'',freedom:'',check:'',evidence:''};
 const index=frame.done?lesson.steps.length-1:frame.activeStepIndex;
 if(!Number.isInteger(index)||index<0||index>=lesson.steps.length)
  return {ready:false,title:'待开始',why:'',basis:'',freedom:'',check:'',evidence:''};
 const s=lesson.steps[index];
 const last=index===lesson.steps.length-1;
 return {...s,ready:true,index,
  completed:frame.done,
  check:last&&!frame.done?s.check+' 当前仍处于结果步骤，尚未完成目标点显现。':s.check};
}
module.exports={build,at};
