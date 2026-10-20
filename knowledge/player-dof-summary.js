/* UI-facing progression summary. Compares consecutive verified local models only. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./nonlinear-step-trace.js'):root.DrawingNonlinearStepTrace);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingPlayerDofSummary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(engine){
'use strict';
function summarize(currentRequest,previousRequest){
 if(!engine||typeof engine.analyze!=='function')throw Error('缺少逐步自由度分析引擎');
 if(!currentRequest)return {available:false,reason:'当前步骤缺少经过核验的构型'};
 const current=engine.analyze(currentRequest);
 if(!current.atProvidedConfiguration)return {available:false,reason:'当前构型未满足全部约束，不能将局部自由度显示为有效结论'};
 let previous=null,removed=null;
 if(previousRequest){
  previous=engine.analyze(previousRequest);
  const keys=a=>Object.keys(a||{}).sort().join('|');
  if(keys(previousRequest.points)!==keys(currentRequest.points))throw Error('相邻步骤的目标点集合不同，无法直接比较自由度');
  if(!previous.atProvidedConfiguration)return {available:false,reason:'前一步构型未满足全部约束，无法作可靠比较'};
  removed=previous.finalDegrees-current.finalDegrees;
  if(removed<0)throw Error('自由度在相邻步骤增加，需核对是否删除约束或修改目标模型');
 }
 const label=removed===null?'初始局部自由度':removed===0?'本步未减少局部自由度':'本步减少 '+removed+' 个局部自由度';
 return {available:true,currentDegrees:current.finalDegrees,previousDegrees:previous?.finalDegrees??null,
  removedDegrees:removed,label,scope:current.scope,trace:current};
}
return {summarize};
});
