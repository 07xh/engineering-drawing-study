'use strict';
/**
 * DA-07: bounded explanations of STUDENT-produced geometry only.
 * The R3 composed evaluator is the only authority. Never read a solver's
 * hidden expected center/contact coordinates or suggest the correct values.
 */
const IDS=['auxiliary-loci','chosen-center','contact-points','directed-arc'];
const NAMES=['辅助轨迹','候选圆心','两个切点','有向连接弧'];
const VALID_KINDS=new Set(['circles','segments','segment-circle']);
const SOURCE=Object.freeze({first:'对象 1',second:'对象 2'});
const scoped='只检查学生提交的四类数学构造；不代表整道工程制图习题、所有尺寸或未建模轮廓正确。';
const empty=reason=>Object.freeze({status:'unverified',headline:'还不能生成数学反馈',
 next:reason,details:'',stages:[],verifiedCount:0,scope:scoped});
function explainStage(id,item,evidence){
 if(item.ok){
  const text=id==='auxiliary-loci'?
   '两条学生尺规辅助轨迹分别符合选定分支的几何距离条件；仍不能确定最终 G1。':
   id==='chosen-center'?
   '学生自己点选的圆心在数学容差内，且对应真实候选；尚未验证切点和连接弧。':
   id==='contact-points'?
   '两个学生标记切点分别匹配已知对象并满足当前分支的实际接触约束。':
   '本次手绘圆弧的端点、半径、采样连续性和有向扫角通过独立核验；不代表完整教材题。';
  return {state:'verified',detail:text};
 }
 if(id==='auxiliary-loci'){
  if(item.status==='branch-required'||item.status==='invalid-branch')
   return {state:'blocked',detail:'先自行选定有效的圆心候选分支，才能评价针对该分支的尺规辅助轨迹。'};
  if(item.status==='not-gradeable')return {state:'blocked',
   detail:'当前不存在可用于判分的有限离散圆心分支；不能伪造辅助轨迹答案。'};
  const count=Number.isInteger(evidence?.matchedCount)?evidence.matchedCount:0;
  const extra=Number.isInteger(evidence?.extraCount)?evidence.extraCount:0;
  const remaining=Array.isArray(evidence?.remainingSources)?
   evidence.remainingSources.filter(id=>Object.hasOwn(SOURCE,id)).map(id=>SOURCE[id]):[];
  const text=(count===0?'尚未核验任何学生辅助轨迹。':
   '已核验 '+count+' / 2 条学生辅助轨迹。')+
   (remaining.length?' 请自行构造'+remaining.join('、')+'对应的辅助轨迹。':'')+
   (extra?' 检测到 '+extra+' 条额外、重复或不符合当前分支的构造；请核对并撤销多余笔迹。':'')+
   ' 核对源对象、偏移侧、距离或圆规半径；系统不会替你填写数值。';
  return {state:extra||item.status==='incorrect'?'review':count?'partial':'pending',detail:text};
 }
 if(id==='chosen-center'){
  if(item.status==='incomplete')return {state:'pending',
   detail:'请先观察自己构造的辅助轨迹，再自行在画纸上点选候选圆心；系统不会自动选取坐标。'};
  if(item.status==='branch-required'||item.status==='invalid-branch')
   return {state:'blocked',detail:'先明确选择有效的几何分支，再评价你点选的圆心。'};
  if(item.status==='incorrect')return {state:'review',
   detail:'你点选的圆心位置尚未满足选定分支的毫米容差；请重新依据自己的轨迹判断交点。'};
  return {state:'blocked',detail:'当前圆心数学核验不可用；不能凭视觉位置断言正确。'};
 }
 if(id==='contact-points'){
  if(item.status==='branch-required'||item.status==='invalid-branch')
   return {state:'blocked',detail:'先选定仍有效的候选分支，才能评价两处真实轮廓的切点。'};
  if(item.status==='not-gradeable')
   return {state:'blocked',detail:'有限线段、给定圆弧的接触范围或候选分支尚未通过验证。'};
  const count=Number.isInteger(evidence?.matchedCount)?evidence.matchedCount:0;
  const extra=Number.isInteger(evidence?.extraCount)?evidence.extraCount:0;
  const remaining=Array.isArray(evidence?.remainingSources)?
   evidence.remainingSources.filter(id=>Object.hasOwn(SOURCE,id)).map(id=>SOURCE[id]):[];
  return {state:extra||item.status==='incorrect'?'review':count?'partial':'pending',
   detail:'已核验 '+count+' / 2 处你自行标注的真实切点。'+
    (remaining.length?' 尚缺'+remaining.join('、')+'的切点标记。':'')+
    (extra?' 存在 '+extra+' 个重复、对象不匹配或超出毫米容差的标记；请撤销或重新标记。':'')+
    ' 已知有限圆弧的切点必须在实际给定角度范围内；不直接展示正确切点。'};
 }
 if(id==='directed-arc'){
  if(['not-verified','invalid-branch'].includes(item.status))
   return {state:'blocked',
    detail:'需先明确有效分支、连接弧方向和原轮廓走向，并由引擎核实有向 G1，才能评价手绘弧。'};
  if(item.status==='incomplete')return {state:'pending',
   detail:'尚未提交完整手绘弧。请自己绘制从一处切点向另一处连续延伸的圆弧；本项只检验单条弧。'};
  if(item.status==='incorrect')return {state:'review',
   detail:'当前手绘弧未同时通过起终点、半径、连续采样及指定旋向核验；请检查自己的笔迹并修改。'};
  return {state:'blocked',detail:'当前弧线不具备独立数学验算条件，不能提前宣布有向 G1 正确。'};
 }
 return {state:'blocked',detail:'未知数学步骤，不生成判定。'};
}
function fromProgress(grade,{kind,revision}={}){
 if(!VALID_KINDS.has(kind)||!Number.isSafeInteger(revision)||revision<0||
    !grade||grade.kind!==kind||grade.revision!==revision||
    grade.proofScope!=='four-supported-student-fillet-constructions-only'||
    grade.fullProblemVerified!==false||
    grade.supportedStageCount!==4||
    !Array.isArray(grade.stages)||grade.stages.length!==4||
    !IDS.every((id,i)=>grade.stages[i]?.id===id)||
    !grade.verification||!['auxiliaries','center','contacts','arc'].every(k=>grade.verification[k]))
  return empty('原始四项判分与当前题目不一致；请更新条件后重新绘制。');
 let verifiedCount=0;
 const keys=['auxiliaries','center','contacts','arc'];
 const stages=grade.stages.map((item,i)=>{
  if(typeof item.status!=='string'||typeof item.ok!=='boolean'||
     (item.ok!==(
      i===0?item.status==='correct':
      i===1?item.status==='verified-center':item.status==='correct')))
   return null;
  if(item.ok)verifiedCount++;
  const advice=explainStage(item.id,item,grade.verification[keys[i]]);
  return Object.freeze({id:item.id,name:NAMES[i],status:advice.state,
   verified:item.ok,detail:advice.detail});
 });
 if(stages.some(s=>s===null)||verifiedCount!==grade.verifiedCount||
    !Number.isInteger(verifiedCount)||verifiedCount<0||verifiedCount>4||
    (grade.status==='all-supported-stages-verified')!==(verifiedCount===4))
  return empty('分项核验数量或状态矛盾，请重新数学检查。');
 const first=stages.find(s=>!s.verified);
 const next=first?'建议继续：'+first.name+'。'+first.detail:
  '已核验本页支持的四类学生数学构造；请另行核查完整教材题的尺寸与未建模要求。';
 return Object.freeze({
  status:verifiedCount===4?'supported-complete':'in-progress',
  headline:'学生数学构造已核验 '+verifiedCount+' / 4',
  next,details:stages.map(s=>s.name+'：'+s.detail).join('\n'),
  stages:Object.freeze(stages),verifiedCount,scope:scoped
 });
}
module.exports={fromProgress};
