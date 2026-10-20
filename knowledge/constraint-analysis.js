/* A typed facade for verified constraints. Never guesses geometry or converts multi-solution into uniqueness. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('../labs/constraint-engine.js'):root.DrawingConstraints,typeof module==='object'&&module.exports?require('./planar-point-constraints.js'):root.DrawingPlanarConstraints,typeof module==='object'&&module.exports?require('./planar-intersections.js'):root.DrawingPlanarIntersections);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingConstraintAnalysis=api;})(typeof globalThis!=='undefined'?globalThis:this,function(spatial,planar,intersections){
'use strict';
function analyze(request){
 if(!request||typeof request!=='object')throw Error('缺少约束分析请求');
 if(request.scope==='point-3d-linear'){
  if(!spatial)throw Error('三维约束模块尚未加载');
  const result=spatial.analyze(request.conditions);
  return {scope:request.scope,status:result.result.inconsistent?'none':result.result.degrees===0?'unique':'continuous',degrees:result.result.degrees,solutionCount:result.result.inconsistent?0:result.result.degrees===0?1:null,details:result};
 }
 if(request.scope==='point-2d-linear'){
  if(!planar)throw Error('二维线性约束模块尚未加载');
  const result=planar.analyze(request.conditions);
  return {scope:request.scope,status:result.result.inconsistent?'none':result.result.degrees===0?'unique':'continuous',degrees:result.result.degrees,solutionCount:result.result.inconsistent?0:result.result.degrees===0?1:null,details:result};
 }
 if(request.scope==='point-2d-intersection'){
  if(!intersections)throw Error('二维交会模块尚未加载');
  if(!Array.isArray(request.conditions)||request.conditions.length!==2)throw Error('二维交会必须提供两个约束');
  const result=intersections.intersect(...request.conditions);
  return {scope:request.scope,status:result.status,degrees:result.degrees,solutionCount:result.solutionCount,details:result};
 }
 throw Error('不支持的约束分析范围：'+request.scope);
}
return {analyze};
});
