/* Resolve an explicitly sourced target point against its construction dependencies.
 * Only supported two-object intersections are computed; provenance alone is not a proof.
 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./geometry-dependency-graph.js'):root.DrawingDependencyGraph,typeof module==='object'&&module.exports?require('./constraint-analysis.js'):root.DrawingConstraintAnalysis,typeof module==='object'&&module.exports?require('./intersection-candidate-filter.js'):root.DrawingCandidateFilter);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingConstructionVerifier=api;})(typeof globalThis!=='undefined'?globalThis:this,function(graph,analysis,candidateFilter){
'use strict';
function verify(steps,targetId,geometry,criteria){
 if(criteria!==undefined&&!Array.isArray(criteria))throw Error('附加筛选条件必须为数组');
 if(!graph||!analysis)throw Error('缺少依赖图或约束计算模块');
 const g=graph.build(steps),target=g.nodes.find(n=>n.id===targetId);
 if(!target)throw Error('目标对象不存在');
 if(target.kind!=='point')throw Error('目前只支持目标点定位');
 if(!geometry||typeof geometry!=='object')throw Error('缺少已核验几何参数');
 if(target.dependsOn.length!==2)return {targetId,status:'unsupported',reason:'目前仅能核验两个几何约束交会',dependencies:target.dependsOn};
 const conditions=[];
 for(const id of target.dependsOn){
  const node=g.nodes.find(n=>n.id===id);
  const value=Object.prototype.hasOwnProperty.call(geometry,id)?geometry[id]:null;
  if(!node||!['line','circle','auxiliary'].includes(node.kind)||!value||!['line','circle'].includes(value.type))return {targetId,status:'unsupported',reason:'依赖对象缺少明确的二维直线或圆参数',dependencies:target.dependsOn};
  conditions.push(value);
 }
 const calculation=analysis.analyze({scope:'point-2d-intersection',conditions});
 const originalStatus=calculation.status;
 let selected={status:originalStatus,solutionCount:calculation.solutionCount,solutions:calculation.details.solutions};
 if(criteria&&criteria.length){
  if(!candidateFilter)throw Error('缺少交点筛选模块');
  if(originalStatus==='coincident')return {targetId,status:'unsupported',reason:'重合几何对象有连续多解，不能使用离散候选点筛选',dependencies:target.dependsOn};
  selected=candidateFilter.filter({solutions:calculation.details.solutions},criteria);
 }
 return {targetId,status:selected.status,degrees:selected.status==='none'?null:calculation.degrees,solutionCount:selected.solutionCount,
  solutions:selected.solutions,originalStatus,criteriaApplied:!!(criteria&&criteria.length),dependencies:target.dependsOn,provenance:g.ancestors(targetId)};
}
return {verify};
});
