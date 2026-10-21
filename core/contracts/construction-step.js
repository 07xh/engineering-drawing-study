'use strict';
const {object,identifier,report,noDuplicateIds,finiteTree}=require('./common.js');
const actions=['point','line','circle','arc','dimension','text'];
function validateConstructionStep(step){
 const errors=[];
 if(!object(step))return report(['ConstructionStep 必须是对象']);
 if(!identifier(step.id))errors.push('ConstructionStep.id 无效');
 if(typeof step.explanation!=='string'||!step.explanation.trim())errors.push('ConstructionStep.explanation 无效');
 if(!Array.isArray(step.actions)||step.actions.some(a=>!object(a)||!actions.includes(a.kind)||!object(a.geometry)||!finiteTree(a.geometry)))errors.push('ConstructionStep.actions 无效');
 for(const name of ['dependsOn','constraintIds','targetIds']){
  if(step[name]!==undefined&&(!Array.isArray(step[name])||!step[name].every(identifier)||!noDuplicateIds(step[name])))errors.push('ConstructionStep.'+name+' 无效');
 }
 if(step.reason!==undefined&&typeof step.reason!=='string')errors.push('ConstructionStep.reason 无效');
 if(step.solveResultRef!==undefined&&!identifier(step.solveResultRef))errors.push('ConstructionStep.solveResultRef 无效');
 if(step.checks!==undefined&&!Array.isArray(step.checks))errors.push('ConstructionStep.checks 无效');
 return report(errors);
}
module.exports={actions,validateConstructionStep};
