'use strict';
/* Adapter only: mathematical engines in labs/ and knowledge/ remain authoritative. */
const {toLegacyConditions}=require('./legacy-constraints.js');
const facade=require('../../knowledge/constraint-analysis.js');
const multi=require('../../knowledge/multi-point-constraints.js');
const local=require('../../knowledge/nonlinear-local-dof.js');
const spatial=require('../../labs/constraint-engine.js');
const planar=require('../../knowledge/planar-point-constraints.js');
const {validateSolveResult}=require('../contracts/solve-result.js');
const {object}=require('../contracts/common.js');
function packageResult(fields){
 const out={status:'undetermined',scope:'',solutions:[],solutionCount:null,degrees:null,
  localDegrees:null,rank:null,globallyUnique:null,maxResidual:null,proofLevel:'none',
  diagnostics:[],solverId:'',...fields};
 const checked=validateSolveResult(out);
 if(!checked.ok)throw Error('求解器结果不符合统一契约：'+checked.errors.join('；'));
 return out;
}
function normalizedLinearResidual(equations,particular){
 if(!Array.isArray(particular)||!Array.isArray(equations))return null;
 return Math.max(0,...equations.map(row=>
  Math.abs(row.a.reduce((sum,v,i)=>sum+v*particular[i],0)-row.b)/Math.max(1,Math.hypot(...row.a))));
}
function intersectionResidual(constraints,solutions){
 if(!solutions.length)return null;
 return Math.max(0,...solutions.flatMap(p=>constraints.map(c=>{
  if(c.type==='line')return Math.abs(c.a*p.x+c.b*p.y-c.offset)/Math.hypot(c.a,c.b);
  if(c.type==='circle')return Math.abs(Math.hypot(p.x-c.x,p.y-c.y)-c.r);
  throw Error('未知交会对象');
 })));
}
function solve(request){
 if(!object(request)||typeof request.scope!=='string')throw Error('必须提供求解范围');
 const scope=request.scope;
 if(!['point-3d-linear','point-2d-linear','point-2d-intersection','multi-point-2d-linear','multi-point-2d-local-jacobian'].includes(scope))
  return packageResult({status:'unsupported',scope,solverId:'none',diagnostics:['当前阶段尚无该题型的可信数学求解器']});
 const conditions=toLegacyConditions(request.constraints,scope);
 if(scope==='point-3d-linear'||scope==='point-2d-linear'){
  const r=facade.analyze({scope,conditions});
  const detail=r.details.result,unique=r.status==='unique';
  const particular=detail.particular;
  const equations=scope==='point-3d-linear'
   ?conditions.flatMap(c=>spatial.equations(c))
   :conditions.map(c=>planar.equation(c));
  return packageResult({scope,status:r.status,solutionCount:r.solutionCount,degrees:r.degrees,
   rank:detail.rank,globallyUnique:unique,
   solutions:unique?[scope==='point-3d-linear'?{x:particular[0],y:particular[1],z:particular[2]}:{x:particular[0],y:particular[1]}]:[],
   maxResidual:unique?normalizedLinearResidual(equations,particular):null,
   proofLevel:'linear-algebra',solverId:scope==='point-3d-linear'?'legacy-constraint-engine':'legacy-planar-point',
   diagnostics:[]});
 }
 if(scope==='point-2d-intersection'){
  const r=facade.analyze({scope,conditions}),solutions=r.details.solutions.map(p=>({...p}));
  return packageResult({scope,status:r.status,solutions,solutionCount:r.solutionCount,
   degrees:r.degrees,globallyUnique:r.status==='unique',rank:null,
   maxResidual:intersectionResidual(conditions,solutions),proofLevel:'analytic',
   solverId:'legacy-planar-intersections',diagnostics:r.status==='coincident'?['重合对象存在连续多解，不可挑选任意一个为唯一解']:[]});
 }
 if(scope==='multi-point-2d-linear'){
  if(!Array.isArray(request.points))throw Error('多点线性求解必须有点编号数组');
  const r=multi.analyze({points:[...request.points],constraints:conditions});
  return packageResult({scope,status:r.status,solutionCount:r.solutionCount,degrees:r.degrees,rank:r.rank,
   globallyUnique:r.status==='unique',proofLevel:'linear-algebra',solverId:'legacy-multi-point',
   diagnostics:r.status==='unique'?['当前旧求解器只证明解数量，未输出各点坐标；禁止推测坐标']:[]});
 }
 if(!object(request.points))throw Error('局部一阶自由度分析必须提供已知构型点表');
 const r=local.analyze({points:request.points,constraints:conditions});
 return packageResult({scope,status:'undetermined',solutionCount:null,degrees:null,
  localDegrees:r.localDegrees,rank:r.rank,globallyUnique:null,maxResidual:r.maxResidual,
  atProvidedConfiguration:r.atProvidedConfiguration,proofLevel:'local-first-order',
  solverId:'legacy-nonlinear-local-dof',
  diagnostics:[r.warning,...(r.atProvidedConfiguration?[]:['输入构型未满足全部条件，不代表已证明方程组无解'])]});
}
module.exports={solve};
