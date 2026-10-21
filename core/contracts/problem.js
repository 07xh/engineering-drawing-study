'use strict';
const {object,identifier,report,SCHEMA_VERSION,noDuplicateIds}=require('./common.js');
const {validateGeometry}=require('./geometry.js');
const {validateConstraint}=require('./constraint.js');
const {validateConstructionStep}=require('./construction-step.js');
const {validateSolveResult}=require('./solve-result.js');
const types=['point-projection','line-projection','plane-projection','solid-projection','section','intersection','dimensioning','other','planar-geometry'];
const statuses=['source-pending','source-verified','steps-verified','solution-verified'];
const modes=['manual-steps','constraint-engine','geometry-engine'];
function validateProblem(p){
 const errors=[];
 if(!object(p))return report(['Problem 必须是对象']);
 // Unversioned legacy records are accepted by design.
 if(p.schemaVersion!==undefined&&p.schemaVersion!==SCHEMA_VERSION)errors.push('Problem.schemaVersion 不支持');
 if(!identifier(p.id))errors.push('Problem.id 无效');
 if(typeof p.title!=='string'||!p.title.trim())errors.push('Problem.title 无效');
 if(!types.includes(p.type))errors.push('Problem.type 不支持');
 if(!statuses.includes(p.status))errors.push('Problem.status 不支持');
 if(!object(p.source))errors.push('Problem.source 必须提供明确来源');
 else if(p.source.kind===undefined||p.source.kind==='textbook'){
  if(typeof p.source.book!=='string'||!p.source.book.trim()||!Number.isInteger(p.source.page)||p.source.page<1)
   errors.push('教材来源必须提供名称与有效页码');
 }else if(p.source.kind==='generated'){
  if(!identifier(p.source.generatorId))errors.push('生成题目需要可靠的 generatorId');
 }else if(p.source.kind==='user-input'){
  if(typeof p.source.confirmed!=='boolean')errors.push('用户输入必须明确标记是否确认条件');
  if(p.renderMode!=='manual-steps'&&p.source.confirmed!==true)
   errors.push('未经用户确认的输入不得开启自动求解');
 }else errors.push('Problem.source.kind 不支持');
 if(!Array.isArray(p.givens))errors.push('Problem.givens 必须是数组');
 if(!Array.isArray(p.steps))errors.push('Problem.steps 必须是数组');
 if(p.geometry!==undefined&&!Array.isArray(p.geometry))errors.push('Problem.geometry 必须是数组');
 if(p.constraints!==undefined&&!Array.isArray(p.constraints))errors.push('Problem.constraints 必须是数组');
 if(p.solveResults!==undefined&&!Array.isArray(p.solveResults))errors.push('Problem.solveResults 必须是数组');
 const geometry=Array.isArray(p.geometry)?p.geometry:[],
  constraints=Array.isArray(p.constraints)?p.constraints:[],
  steps=Array.isArray(p.steps)?p.steps:[],
  results=Array.isArray(p.solveResults)?p.solveResults:[];
 for(const g of geometry)errors.push(...validateGeometry(g).errors);
 for(const c of constraints)errors.push(...validateConstraint(c).errors);
 for(const s of steps)errors.push(...validateConstructionStep(s).errors);
 for(const r of results)errors.push(...validateSolveResult(r).errors);
 function uniqueById(values,label){
  const ids=values.map(x=>x?.id);
  if(!noDuplicateIds(ids))errors.push(label+'.id 重复');
  return new Set(ids);
 }
 const geometryIds=uniqueById(geometry,'Geometry');
 const constraintIds=uniqueById(constraints,'Constraint');
 const resultIds=uniqueById(results,'SolveResult');
 uniqueById(steps,'ConstructionStep');
 if(results.some(r=>!identifier(r?.id)))errors.push('被 Problem 引用的 SolveResult 必须含唯一 id');
 for(const c of constraints){
  if(Array.isArray(c?.targetIds))
   for(const id of c.targetIds)if(!geometryIds.has(id))errors.push('Constraint '+c.id+' 引用了不存在的 Geometry '+id);
 }
 const priorSteps=new Set();
 for(const step of steps){
  if(!object(step))continue;
  for(const dep of Array.isArray(step.dependsOn)?step.dependsOn:[]){
   if(!priorSteps.has(dep))errors.push('ConstructionStep '+step.id+' 依赖不存在、未来或自身步骤 '+dep);
  }
  for(const ref of Array.isArray(step.constraintIds)?step.constraintIds:[]){
   if(!constraintIds.has(ref))errors.push('ConstructionStep '+step.id+' 引用了不存在的 Constraint '+ref);
  }
  for(const ref of Array.isArray(step.targetIds)?step.targetIds:[]){
   if(!geometryIds.has(ref))errors.push('ConstructionStep '+step.id+' 引用了不存在的 Geometry '+ref);
  }
  if(step.solveResultRef!==undefined&&!resultIds.has(step.solveResultRef))
   errors.push('ConstructionStep '+step.id+' 引用了不存在的 SolveResult '+step.solveResultRef);
  priorSteps.add(step.id);
 }
 if(!modes.includes(p.renderMode))errors.push('Problem.renderMode 不支持');
 if(p.status==='solution-verified'&&(!p.source?.answerRef||!steps.length))errors.push('已核验答案需答案来源和步骤');
 if(p.status==='source-pending'&&p.renderMode!=='manual-steps')errors.push('未核验题目不得开启自动求解');
 return report(errors);
}
module.exports={types,statuses,modes,validateProblem};
