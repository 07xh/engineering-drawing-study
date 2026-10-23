'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {isolateReviewedProblem:run,verifySolverIsolation:compare}=require('../../workbench/reviewed-problem-math-isolation.cjs');
const known={id:'line-1',role:'known-condition',reviewed:true,unitVerified:'mm',
 geometry:{type:'line',start:[0,0],end:[10,0]}};
test('answer/reference mutation cannot affect solver input',()=>{
 const a=run({sourceRevision:7,entities:[known,{id:'answer',role:'reference-answer',geometry:{x:2}}]});
 const b=run({sourceRevision:7,entities:[known,{id:'answer',role:'reference-answer',geometry:{x:999}}]});
 assert.equal(a.status,'reviewed-conditions-isolated');
 assert.equal(a.solverInput.conditions.length,1);
 assert.equal(compare(a,b).status,'answer-independent');
 assert.equal(a.answerReferencePermittedInSolver,false);
});
test('unreviewed conditions and missing units fail closed',()=>{
 assert.equal(run({entities:[{...known,reviewed:false}]}).status,'not-verified');
 assert.equal(run({entities:[{...known,unitVerified:null}]}).status,'not-verified');
});
test('changed known geometry invalidates math input digest',()=>{
 const a=run({sourceRevision:7,entities:[known]});
 const b=run({sourceRevision:7,entities:[{...known,geometry:{type:'line',start:[0,0],end:[11,0]}}]});
 assert.equal(compare(a,b).status,'not-verified');
});
