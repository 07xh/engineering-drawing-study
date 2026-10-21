'use strict';
const {object,finite,report}=require('./common.js');
const statuses=['unique','multiple','continuous','coincident','none','unsupported','undetermined'];
const levels=['linear-algebra','analytic','local-first-order','none'];
function validateSolveResult(r){
 const errors=[];
 if(!object(r))return report(['SolveResult 必须是对象']);
 if(!statuses.includes(r.status))errors.push('SolveResult.status 不支持');
 if(typeof r.scope!=='string'||!r.scope)errors.push('SolveResult.scope 无效');
 if(!Array.isArray(r.solutions)||r.solutions.some(x=>!object(x)||Object.values(x).some(v=>typeof v!=='number'||!finite(v))))errors.push('SolveResult.solutions 无效');
 if(r.solutionCount!==null&&(!Number.isInteger(r.solutionCount)||r.solutionCount<0))errors.push('SolveResult.solutionCount 无效');
 if(r.degrees!==null&&(!Number.isInteger(r.degrees)||r.degrees<0))errors.push('SolveResult.degrees 无效');
 if(r.localDegrees!==null&&(!Number.isInteger(r.localDegrees)||r.localDegrees<0))errors.push('SolveResult.localDegrees 无效');
 if(r.rank!==null&&(!Number.isInteger(r.rank)||r.rank<0))errors.push('SolveResult.rank 无效');
 if(r.globallyUnique!==null&&typeof r.globallyUnique!=='boolean')errors.push('SolveResult.globallyUnique 无效');
 if(r.maxResidual!==null&&(!finite(r.maxResidual)||r.maxResidual<0))errors.push('SolveResult.maxResidual 无效');
 if(!levels.includes(r.proofLevel))errors.push('SolveResult.proofLevel 无效');
 if(!Array.isArray(r.diagnostics))errors.push('SolveResult.diagnostics 必须为数组');
 if(r.status==='unique'&&r.solutionCount!==1)errors.push('唯一解必须计数为1');
 if(r.status==='none'&&r.solutionCount!==0)errors.push('无解必须计数为0');
 if(r.status==='multiple'&&!(r.solutionCount>=2))errors.push('离散多解必须至少2个');
 if(['continuous','coincident','undetermined','unsupported'].includes(r.status)&&r.solutionCount!==null)errors.push('未枚举或连续解不可报告确定解数量');
 if(r.proofLevel==='local-first-order'&&(r.status!=='undetermined'||r.globallyUnique!==null||r.degrees!==null))errors.push('局部一阶结果不能声称全局解或精确自由度');
 if(r.status==='unique'&&r.globallyUnique!==true)errors.push('唯一解必须注明全局唯一');
 if(r.solutions.length && r.solutionCount!==null && r.solutions.length>r.solutionCount)errors.push('候选解数量超过解总数');
 return report(errors);
}
module.exports={statuses,levels,validateSolveResult};
