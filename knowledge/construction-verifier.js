/* Resolve an explicitly sourced target point against its construction dependencies.
 * Only supported two-object intersections are computed; provenance alone is not a proof.
 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./geometry-dependency-graph.js'):root.DrawingDependencyGraph,typeof module==='object'&&module.exports?require('./constraint-analysis.js'):root.DrawingConstraintAnalysis);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingConstructionVerifier=api;})(typeof globalThis!=='undefined'?globalThis:this,function(graph,analysis){
'use strict';
function verify(steps,targetId,geometry){
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
 return {targetId,status:calculation.status,degrees:calculation.degrees,solutionCount:calculation.solutionCount,
  solutions:calculation.details.solutions,dependencies:target.dependsOn,provenance:g.ancestors(targetId)};
}
return {verify};
});
