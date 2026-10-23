'use strict';
/**
 * M2 -> M3 boundary: only reviewed problem conditions may enter the solver.
 * A reference answer is a separate post-solve comparison artifact.
 */
const crypto=require('node:crypto');
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)
 ?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const digest=x=>crypto.createHash('sha256').update(stable(x)).digest('hex');
function isolateReviewedProblem(input){
 if(!input||typeof input!=='object'||!Array.isArray(input.entities))
  return {status:'not-verified',reason:'entities missing'};
 const allowed=input.entities.filter(e=>e&&e.role==='known-condition');
 const forbidden=input.entities.filter(e=>e&&e.role!=='known-condition');
 if(!allowed.length)return {status:'not-verified',reason:'no reviewed known conditions'};
 if(allowed.some(e=>e.reviewed!==true||typeof e.id!=='string'||!e.id||
   !e.geometry||typeof e.geometry!=='object'||!e.unitVerified))
  return {status:'not-verified',reason:'unreviewed geometry or units'};
 if(new Set(allowed.map(e=>e.id)).size!==allowed.length)
  return {status:'not-verified',reason:'duplicate condition ids'};
 const conditions=allowed.map(e=>({id:e.id,geometry:structuredClone(e.geometry),unit:e.unitVerified}));
 const solverInput={conditions,sourceRevision:input.sourceRevision};
 return {status:'reviewed-conditions-isolated',solverInput,
  solverInputHash:digest(solverInput),
  excludedEntityCount:forbidden.length,
  answerReferencePermittedInSolver:false};
}
function verifySolverIsolation(before,after){
 if(before?.status!=='reviewed-conditions-isolated'||after?.status!=='reviewed-conditions-isolated')
  return {status:'not-verified'};
 return {status:before.solverInputHash===after.solverInputHash?'answer-independent':'not-verified',
  identicalSolverInput:before.solverInputHash===after.solverInputHash};
}
module.exports={isolateReviewedProblem,verifySolverIsolation};
