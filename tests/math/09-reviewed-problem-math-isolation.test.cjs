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

test('unknown role and unverified model units are blocked',()=>{
 const input={sourceRevision:7,entities:[known,{id:'mystery',role:'other',geometry:{x:1}}]};
 assert.equal(run(input).status,'not-verified');
 for(const unit of ['px','bogus',true]){
  assert.equal(run({sourceRevision:7,entities:[{...known,unitVerified:unit}]}).status,'not-verified');
 }
});
test('invalid revision, nonfinite coordinates and degenerate geometry fail closed',()=>{
 assert.equal(run({entities:[known]}).status,'not-verified');
 assert.equal(run({sourceRevision:-1,entities:[known]}).status,'not-verified');
 for(const geometry of [
  {type:'line',start:[0,0],end:[0,0]},
  {type:'line',start:[0,0],end:[Infinity,0]},
  {type:'circle',center:[0,0],radius:-1},
  {type:'unsupported',start:[0,0],end:[1,0]}
 ]){
  assert.equal(run({sourceRevision:7,entities:[{...known,geometry}]}).status,'not-verified');
 }
});
test('reviewed point and circle are isolated without accepting reference answers',()=>{
 const input={sourceRevision:9,entities:[
  {...known,id:'p',geometry:{type:'point',at:[1,2]}},
  {...known,id:'c',geometry:{type:'circle',center:[0,0],radius:5}},
  {id:'answer',role:'reference-answer',geometry:{x:999}}
 ]};
 const result=run(input);
 assert.equal(result.status,'reviewed-conditions-isolated');
 assert.equal(result.solverInput.conditions.length,2);
 assert.equal(result.excludedEntityCount,1);
});
