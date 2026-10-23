'use strict';
/**
 * M2 -> M3 boundary: only reviewed problem conditions may enter the solver.
 * A reference answer is a separate post-solve comparison artifact.
 */
// Deterministic browser-safe FNV-1a fingerprint; NOT a cryptographic signature.
function fingerprint(str){
 let h=2166136261;
 for(let i=0;i<str.length;i++){
  h^=str.charCodeAt(i);
  h=Math.imul(h,16777619);
 }
 return (h>>>0).toString(16).padStart(8,'0');
}
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)
 ?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const digest=x=>fingerprint(stable(x));
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function finiteTree(x,seen=new Set()){
 if(typeof x==='number')return Number.isFinite(x);
 if(x===null||typeof x==='string'||typeof x==='boolean')return true;
 if(typeof x!=='object'||seen.has(x))return false;
 seen.add(x);
 const ok=(Array.isArray(x)?x:Object.values(x));
 const valid=ok.every(v=>finiteTree(v,seen));
 seen.delete(x);
 return valid;
}
function validGeometry(g){
 if(!object(g)||!finiteTree(g)||typeof g.type!=='string')return false;
 if(g.type==='line'||g.type==='segment'){
  const a=g.start,b=g.end;
  return Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&
   a.every(Number.isFinite)&&b.every(Number.isFinite)&&
   Math.hypot(a[0]-b[0],a[1]-b[1])>0;
 }
 if(g.type==='point')
  return Array.isArray(g.at)&&g.at.length===2&&g.at.every(Number.isFinite);
 if(g.type==='circle')
  return Array.isArray(g.center)&&g.center.length===2&&g.center.every(Number.isFinite)&&
   typeof g.radius==='number'&&Number.isFinite(g.radius)&&g.radius>0;
 return false; // unsupported geometry must be explicitly contracted, never guessed
}
function isolateReviewedProblem(input){
 if(!input||typeof input!=='object'||!Array.isArray(input.entities))
  return {status:'not-verified',reason:'entities missing'};
 if(!Number.isSafeInteger(input.sourceRevision)||input.sourceRevision<0)
  return {status:'not-verified',reason:'invalid source revision'};
 if(input.entities.some(e=>!object(e)||!['known-condition','reference-answer'].includes(e.role)))
  return {status:'not-verified',reason:'unknown or conflicting entity role'};
 const allowed=input.entities.filter(e=>e.role==='known-condition');
 const forbidden=input.entities.filter(e=>e&&e.role!=='known-condition');
 if(!allowed.length)return {status:'not-verified',reason:'no reviewed known conditions'};
 if(allowed.some(e=>e.reviewed!==true||typeof e.id!=='string'||!e.id||
   !validGeometry(e.geometry)||e.unitVerified!=='mm'))
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
