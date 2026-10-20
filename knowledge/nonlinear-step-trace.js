/* Trace incremental LOCAL Jacobian ranks at a supplied planar configuration.
 * A violated constraint is not automatically a globally inconsistent system.
 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./nonlinear-local-dof.js'):root.DrawingNonlinearDOF);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingNonlinearStepTrace=api;})(typeof globalThis!=='undefined'?globalThis:this,function(engine){
'use strict';
function analyze({points,constraints,tolerance}={}){
 if(!engine||typeof engine.analyze!=='function')throw Error('局部自由度分析引擎未加载');
 if(!Array.isArray(constraints))throw Error('约束必须是数组');
 const steps=[];let previous=engine.analyze({points,constraints:[],tolerance});
 for(let i=0;i<constraints.length;i++){
  const current=engine.analyze({points,constraints:constraints.slice(0,i+1),tolerance});
  const delta=previous.localDegrees-current.localDegrees;
  const status=current.atProvidedConfiguration?'satisfied':'violated-at-configuration';
  steps.push({index:i+1,constraint:constraints[i],rank:current.rank,localDegrees:current.localDegrees,
   removedLocalDegrees:delta,classification:delta>0?'locally-independent':'locally-redundant',
   status,maxResidual:current.maxResidual});
  previous=current;
 }
 return {scope:'multi-point-2d-local-step-trace',initialDegrees:Object.keys(points||{}).length*2,
  finalDegrees:previous.localDegrees,atProvidedConfiguration:previous.atProvidedConfiguration,steps,
  warning:'分类仅针对给定构型的一阶雅可比秩。未满足约束仅表示该构型不符合条件；冗余不等于全局逻辑冗余，奇异构型可能误导。'};
}
return {analyze};
});
