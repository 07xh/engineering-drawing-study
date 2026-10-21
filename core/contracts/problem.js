'use strict';
const {object,identifier,report,SCHEMA_VERSION,noDuplicateIds}=require('./common.js');
const {validateGeometry}=require('./geometry.js');
const {validateConstraint}=require('./constraint.js');
const {validateConstructionStep}=require('./construction-step.js');
const types=['point-projection','line-projection','plane-projection','solid-projection','section','intersection','dimensioning','other','planar-geometry'];
const statuses=['source-pending','source-verified','steps-verified','solution-verified'];
const modes=['manual-steps','constraint-engine','geometry-engine'];
function validateProblem(p){
 const errors=[];
 if(!object(p))return report(['Problem 必须是对象']);
 // Missing version is permitted only for pre-existing problem records.
 if(p.schemaVersion!==undefined&&p.schemaVersion!==SCHEMA_VERSION)errors.push('Problem.schemaVersion 不支持');
 if(!identifier(p.id))errors.push('Problem.id 无效');
 if(typeof p.title!=='string'||!p.title.trim())errors.push('Problem.title 无效');
 if(!types.includes(p.type))errors.push('Problem.type 不支持');
 if(!statuses.includes(p.status))errors.push('Problem.status 不支持');
 if(!object(p.source)||typeof p.source.book!=='string'||!p.source.book.trim()||!Number.isInteger(p.source.page)||p.source.page<1)errors.push('Problem.source 必须提供教材名称和有效页码');
 if(!Array.isArray(p.givens))errors.push('Problem.givens 必须是数组');
 if(!Array.isArray(p.steps))errors.push('Problem.steps 必须是数组');
 else {for(const step of p.steps) errors.push(...validateConstructionStep(step).errors);}
 if(p.geometry!==undefined){
  if(!Array.isArray(p.geometry))errors.push('Problem.geometry 必须是数组');
  else{
   for(const g of p.geometry)errors.push(...validateGeometry(g).errors);
   if(!noDuplicateIds(p.geometry.map(x=>x?.id)))errors.push('Geometry.id 重复');
  }
 }
 if(p.constraints!==undefined){
  if(!Array.isArray(p.constraints))errors.push('Problem.constraints 必须是数组');
  else{
   for(const c of p.constraints)errors.push(...validateConstraint(c).errors);
   if(!noDuplicateIds(p.constraints.map(x=>x?.id)))errors.push('Constraint.id 重复');
  }
 }
 if(!modes.includes(p.renderMode))errors.push('Problem.renderMode 不支持');
 if(p.status==='solution-verified'&&(!p.source?.answerRef||!p.steps?.length))errors.push('已核验答案需答案来源和步骤');
 if(p.status==='source-pending'&&p.renderMode!=='manual-steps')errors.push('未核验题目不得开启自动求解');
 return report(errors);
}
module.exports={types,statuses,modes,validateProblem};
