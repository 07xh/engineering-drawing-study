'use strict';
const {object,identifier,finite,report,noDuplicateIds,finiteTree}=require('./common.js');
const actions=['point','line','circle','arc','dimension','text'];
const between=(v,min,max)=>finite(v)&&v>=min&&v<=max;
function validAction(a){
 if(!object(a)||!actions.includes(a.kind)||!object(a.geometry)||!finiteTree(a.geometry))return false;
 const g=a.geometry;
 if(a.style!==undefined&&!['given','auxiliary','axis','result','mark'].includes(a.style))return false;
 const pair=[g.x,g.y].every(finite);
 const segment=[g.x1,g.y1,g.x2,g.y2].every(finite);
 if(a.kind==='point')return pair&&(a.label===undefined||typeof a.label==='string'&&a.label.length<=80);
 if(a.kind==='line')return segment;
 if(a.kind==='circle')return [g.cx,g.cy,g.r].every(finite)&&g.r>0;
 if(a.kind==='arc'){
  // Legacy drawing-action renderer accepts increasing SVG angles in degrees.
  // Do not permit a counterclockwise flag which that renderer would ignore.
  const span=g.endAngle-g.startAngle;
  return [g.cx,g.cy,g.r,g.startAngle,g.endAngle].every(finite)&&g.r>0&&
   span>0&&span<=360&&(g.direction===undefined||g.direction==='clockwise');
 }
 if(a.kind==='dimension')return segment&&typeof a.text==='string'&&a.text.length<=80&&
   (g.offset===undefined||between(g.offset,-1000,1000)&&Math.hypot(g.x2-g.x1,g.y2-g.y1)>0);
 return pair&&typeof a.text==='string'&&a.text.length<=120;
}
function validateConstructionStep(step){
 const errors=[];
 if(!object(step))return report(['ConstructionStep 必须是对象']);
 if(!identifier(step.id))errors.push('ConstructionStep.id 无效');
 if(typeof step.explanation!=='string'||!step.explanation.trim())errors.push('ConstructionStep.explanation 无效');
 if(!Array.isArray(step.actions)||step.actions.some(a=>!validAction(a)))errors.push('ConstructionStep.actions 无效');
 for(const name of ['dependsOn','constraintIds','targetIds']){
  if(step[name]!==undefined&&(!Array.isArray(step[name])||!step[name].every(identifier)||!noDuplicateIds(step[name])))errors.push('ConstructionStep.'+name+' 无效');
 }
 if(step.reason!==undefined&&typeof step.reason!=='string')errors.push('ConstructionStep.reason 无效');
 if(step.solveResultRef!==undefined&&!identifier(step.solveResultRef))errors.push('ConstructionStep.solveResultRef 无效');
 if(step.checks!==undefined&&!Array.isArray(step.checks))errors.push('ConstructionStep.checks 无效');
 return report(errors);
}
module.exports={actions,validAction,validateConstructionStep};
