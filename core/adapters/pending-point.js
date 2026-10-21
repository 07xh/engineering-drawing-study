'use strict';
/**
 * Opt-in bridge: a declared unknown is NOT a Geometry point until a trusted
 * independent solver returns a single numerically verified solution.
 * A structurally valid Result/Problem is NOT proof of textbook correctness.
 */
const {validateProblem}=require('../contracts/problem.js');
const {validateGeometry}=require('../contracts/geometry.js');
const {identifier}=require('../contracts/common.js');
const {solve}=require('./legacy-solvers.js');

function solvePendingPoint(problem,targetId,{resultId='result_'+targetId}={}){
 const checked=validateProblem(problem);
 if(!checked.ok)throw Error('预求解 Problem 无效：'+checked.errors.join('；'));
 if(!identifier(targetId)||!identifier(resultId))throw Error('未知点或结果编号无效');
 const pending=problem.unknowns?.find(u=>u.id===targetId);
 if(!pending)throw Error('待求点必须先声明在 Problem.unknowns，禁止使用假坐标');
 if(problem.solveResults?.some(r=>r.id===resultId))throw Error('求解结果编号重复');
 const constraints=(problem.constraints||[]).filter(c=>c.targetIds.includes(targetId));
 if(constraints.some(c=>c.targetIds.length!==1))
  throw Error('该求解桥仅处理单个待求点，不冒充多点联立求解');
 const allowed=pending.space==='model-3d'
  ? ['point-3d-linear'] : ['point-2d-linear','point-2d-intersection'];
 if(constraints.some(c=>!allowed.includes(c.scope)))
  throw Error('约束作用域与待求点维度不一致');
 const scopes=new Set(constraints.map(c=>c.scope));
 if(scopes.size>1)throw Error('混合线性与非线性约束需独立求解器验证');
 const scope=constraints[0]?.scope||allowed[0];
 const result={...solve({scope,constraints}),id:resultId};
 let candidateGeometry=null;
 if(result.status==='unique'&&result.globallyUnique===true&&
    result.solutionCount===1&&result.solutions.length===1&&
    ['linear-algebra','analytic'].includes(result.proofLevel)&&
    Number.isFinite(result.maxResidual)&&result.maxResidual<=1e-8){
  candidateGeometry={id:targetId,kind:'point',space:pending.space,unit:pending.unit,
   data:{...result.solutions[0]}};
  if(!validateGeometry(candidateGeometry).ok)candidateGeometry=null;
 }
 return {targetId,scope,status:result.status,result,candidateGeometry,
  note:'仅来自当前输入的求解器计算；并非经过原书核对的教材标准答案'};
}

function completePendingPoint(problem,targetId,options){
 const current=solvePendingPoint(problem,targetId,options);
 if(!current.candidateGeometry)
  throw Error('未知点尚无经过数学验证的唯一解，禁止填写猜测坐标');
 const next={...problem,unknowns:problem.unknowns.filter(u=>u.id!==targetId),
  geometry:[...(problem.geometry||[]),current.candidateGeometry],
  solveResults:[...(problem.solveResults||[]),current.result]};
 const check=validateProblem(next);
 if(!check.ok)throw Error('求解结果转换失败：'+check.errors.join('；'));
 return {problem:next,solution:current};
}
module.exports={solvePendingPoint,completePendingPoint};
