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

const DIAGNOSIS=Object.freeze({
 'offset-side':'有符号偏移方向与当前选定分支不一致；请重新判断原线段的法向侧，不直接给出正确符号。',
 'offset-distance':'偏移距离不符合连接半径条件；请检查自己输入的毫米值。',
 'offset-geometry':'线段笔迹未满足所选对象的实际平行偏移关系；请核对原线段和所画线的位置、端点。',
 'compass-center':'圆规辅助圆的圆心未与对应已知对象同心；请检查圆规中心位置。',
 'compass-radius':'圆规辅助圆半径未满足对应圆的相切距离关系；请检查自己输入的半径。',
 'duplicate':'同一对象的有效辅助轨迹已提交过；请撤销重复构造。',
 'tool-mismatch':'当前对象选择与尺规工具种类不匹配；请检查要画的是偏移直线还是同心辅助圆。',
 'ungradeable':'本项几何条件不具备有效数值证明，先核对题给轮廓和分支。',
 'source-mismatch':'学生标记的位置与所选原始对象不一致；请检查对象 1 / 2 的选择。',
 'duplicate-contact':'同一原始对象的有效切点已标记过；请撤销重复切点。',
 'off-contact':'当前切点未满足该对象与连接圆弧的接触位置容差；请检查自己的切点位置。'
});
function diagnosisText(evidence){
 if(!Array.isArray(evidence?.diagnostics))return '';
 // Only fixed, non-answer-bearing messages are allowed into the UI.
 // No raw submitted coordinates, hidden radii, expected signs or G1 targets.
 const messages=[];
 for(const row of evidence.diagnostics){
  if(!row||!Number.isInteger(row.index)||row.index<0||row.index>=64||
     !Object.hasOwn(SOURCE,row.sourceId)||!Object.hasOwn(DIAGNOSIS,row.code))
   continue;
  const t=SOURCE[row.sourceId]+'第 '+(row.index+1)+' 笔：'+DIAGNOSIS[row.code];
  if(!messages.includes(t))messages.push(t);
  if(messages.length===3)break;
 }
 return messages.length?' 具体检查：'+messages.join(' '):'';
}
function arcErrorText(evidence){
 const c=evidence?.checks;
 if(!c||typeof c!=='object')return '';
 const list=[];
 // Prefer the most diagnostically useful proven failing predicates.
 for(const [field,advice] of [
  ['enoughSamples','笔迹采样点不足，无法证明是连续圆弧；请连续绘制，而不是只点两个端点。'],
  ['traversalDirectionValid','画弧过程中出现逆向回退；请核对自己选择的旋转方向。'],
  ['endpointsWithinTolerance','弧的起点或终点没有与两处真实接触位置对齐。'],
  ['radiusWithinTolerance','弧线弯曲半径未满足连接半径约束，请检查笔迹曲率。'],
  ['sampleSpacingValid','相邻笔迹点跨度太大，不能证明连续的有向圆弧。'],
  ['nondegenerate','笔迹没有形成可验证的非退化连接曲线。'],
  ['sweepWithinTolerance','整段绘制扫角与当前选择的有向连接关系不一致。']
 ]){
  if(c[field]===false)list.push(advice);
  if(list.length===3)break;
 }
 return list.length?' 具体检查：'+list.join(' '):'';
}
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
   (remaining.length?' 请自行构造'+remaining.join('、')+' 对应的辅助轨迹。':'')+
   (extra?' 检测到 '+extra+' 条额外、重复或不符合当前分支的构造；请核对并撤销多余笔迹。':'')+
   ' 核对源对象、偏移侧、距离或圆规半径；系统不会替你填写数值。'+
   diagnosisText(evidence);
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
    ' 已知有限圆弧的切点必须在实际给定角度范围内；不直接展示正确切点。'+
    diagnosisText(evidence)};
 }
 if(id==='directed-arc'){
  if(['not-verified','invalid-branch'].includes(item.status))
   return {state:'blocked',
    detail:'需先明确有效分支、连接弧方向和原轮廓走向，并由引擎核实有向 G1，才能评价手绘弧。'};
  if(item.status==='incomplete')return {state:'pending',
   detail:'尚未提交完整手绘弧。请自己绘制从一处切点向另一处连续延伸的圆弧；本项只检验单条弧。'};
  if(item.status==='incorrect')return {state:'review',
   detail:'当前手绘弧未同时通过起终点、半径、连续采样及指定旋向核验；请检查自己的笔迹并修改。'+
    arcErrorText(evidence)};
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
