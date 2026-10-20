/* Step-level trace for verified linear constraints on one 3D point.
 * Does not infer textbook conditions from a drawing or generalize to solids.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingConstraintTrace=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function analyzeSteps(steps,engine){
 if(!Array.isArray(steps))throw Error('步骤必须为数组');
 if(!engine||typeof engine.analyze!=='function')throw Error('缺少空间点约束计算引擎');
 const conditions=[],history=[];
 for(const step of steps){
  if(!step||typeof step.id!=='string'||!Array.isArray(step.constraints))throw Error('步骤缺少编号或约束清单');
  const before=engine.analyze(conditions).result;
  const added=step.constraints;
  const calculation=engine.analyze([...conditions,...added]);
  const result=calculation.result;
  const newSteps=calculation.steps.slice(conditions.length);
  const independent=newSteps.filter(x=>x.status==='independent').length;
  const redundant=newSteps.filter(x=>x.status==='redundant').length;
  const contradictory=newSteps.some(x=>x.status==='contradiction');
  history.push({stepId:step.id,before:before.degrees,after:result.degrees,
   independent, redundant,contradictory,status:contradictory?'contradiction':independent?'independent':redundant?'redundant':'unchanged',
   details:newSteps,summary:contradictory?'约束矛盾，当前无解。':added.length===0?'本步未增加目标空间点的约束，自由度不变。':'目标空间点自由度 '+before.degrees+' → '+result.degrees+'。'});
  conditions.push(...added);
 }
 return {scope:'single-3d-point-linear',history,final:engine.analyze(conditions).result};
}
return {analyzeSteps};
});
