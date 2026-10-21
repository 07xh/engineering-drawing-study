'use strict';
// Mechanical revision gate; not a proof that any supplied result is truthful.
const {validateProblem}=require('../contracts/problem.js');
function consumeStep(problem,stepId,{inputRevision,resultRevision}={}){
 const check=validateProblem(problem);
 if(!check.ok)return {status:'invalid',showComputedPoint:false,reasons:check.errors};
 if(!Number.isSafeInteger(inputRevision)||inputRevision<0||
    !Number.isSafeInteger(resultRevision)||resultRevision<0||
    inputRevision!==resultRevision)
  return {status:'stale',showComputedPoint:false,reasons:['输入修订后必须清空旧结果并重新调用可信求解器']};
 const step=problem.steps.find(s=>s.id===stepId);
 if(!step)return {status:'unknown-step',showComputedPoint:false,reasons:['步骤不存在']};
 if(!step.solveResultRef)return {status:'unproven',showComputedPoint:false,reasons:['步骤没有数学结果引用']};
 const result=problem.solveResults.find(r=>r.id===step.solveResultRef);
 if(result.status==='unique'&&result.solutions.length===1&&
   ['linear-algebra','analytic'].includes(result.proofLevel))
  return {status:'computed-candidate',showComputedPoint:true,reasons:[
   '只允许展示当前输入下可信求解器生成的候选点；格式校验不证明来源或自然语言解释正确',
   '教材标准答案还需要独立的原图、步骤与答案审核']};
 if(result.status==='multiple')return {status:'branch-choice-required',showComputedPoint:false,reasons:['不得将多个候选点默认为唯一解']};
 if(result.status==='none')return {status:'inconsistent',showComputedPoint:false,reasons:['约束已判定无解']};
 return {status:'unproven',showComputedPoint:false,reasons:['未有可显示的独立可信点坐标或缺少全局求解证明']};
}
module.exports={consumeStep};
