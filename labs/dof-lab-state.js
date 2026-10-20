/* Experiment-only constraint state; this is NOT a textbook answer engine. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./constraint-engine.js'):root.DrawingConstraints,typeof module==='object'&&module.exports?require('./dof-lab-geometry.js'):root.DrawingLabGeometry);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingLabState=api;})(typeof globalThis!=='undefined'?globalThis:this,function(E,G){
'use strict';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const clone=x=>JSON.parse(JSON.stringify(x));
function create(){
 return {modelId:'cuboid',trial:{x:35,y:22,z:51},conditions:[]};
}
function validCondition(c){
 if(!c||typeof c!=='object')throw Error('约束数据无效');
 if(!['coordinate','projection','plane','line'].includes(c.type))throw Error('此阶段仅支持点的线性约束');
 E.equations(c);return true;
}
function normalize(state){
 if(!state||!G.pointValid(state.trial)||!G.PRESETS[state.modelId]||!Array.isArray(state.conditions)||state.conditions.length>30)throw Error('实验状态无效');
 for(const item of state.conditions)if(!item||typeof item.enabled!=='boolean'||!item.condition)throw Error('约束项目无效');
 for(const item of state.conditions)validCondition(item.condition);
 return state;
}
function apply(state,action){
 normalize(state);
 if(!action||typeof action!=='object')throw Error('操作无效');
 const next=clone(state);
 if(action.type==='set-model'){G.preset(action.value);next.modelId=action.value}
 else if(action.type==='set-trial'){
  if(!G.pointValid(action.value))throw Error('试探点坐标无效');
  next.trial={...action.value};
 }else if(action.type==='add'){
  validCondition(action.condition);
  if(next.conditions.length>=30)throw Error('最多保存30条约束');
  next.conditions.push({enabled:true,condition:clone(action.condition)});
 }else if(action.type==='edit'||action.type==='remove'||action.type==='toggle'){
  const i=action.index;
  if(!Number.isInteger(i)||i<0||i>=next.conditions.length)throw Error('未知约束行');
  if(action.type==='edit'){validCondition(action.condition);next.conditions[i].condition=clone(action.condition)}
  else if(action.type==='remove')next.conditions.splice(i,1);
  else next.conditions[i].enabled=!next.conditions[i].enabled;
 }else if(action.type==='clear')next.conditions=[];
 else throw Error('未知实验操作');
 return normalize(next);
}
function compute(state){
 normalize(state);
 const active=state.conditions.filter(item=>item.enabled).map(item=>item.condition);
 const analysis=E.analyze(active);
 const point=G.candidate(state.trial,analysis);
 return {state,analysis,point,active,model:G.preset(state.modelId),
  scope:'仅分析一个自由空间点 P 的线性位置自由度；立体是固定参考模型，不代表整个刚体的6个自由度。'};
}
function name(c){
 if(c.type==='coordinate')return '固定 '+c.axis+' = '+c.value;
 if(c.type==='projection')return '已知 '+c.plane+' 面投影 ('+c.value.join('，')+')';
 if(c.type==='plane')return '点在平面 '+c.normal.x+'x + '+c.normal.y+'y + '+c.normal.z+'z = '+c.offset;
 if(c.type==='line')return '点在已知空间直线上';
 return '未知约束';
}
return {create,apply,compute,name,validCondition,normalize};
});
