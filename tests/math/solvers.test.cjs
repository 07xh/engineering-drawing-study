'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {solve}=require('../../core/adapters');
const oldFacade=require('../../knowledge/constraint-analysis.js');
const {validateSolveResult}=require('../../core/contracts');
let sequence=0;
function c(scope,type,data,targets=['P']){return {id:'c'+(++sequence),scope,type,data,targetIds:targets,source:'given'};}
const near=(a,b)=>Math.abs(a-b)<1e-8;
test('spatial V/H projections uniquely recover exact x,y,z',()=>{
 const scope='point-3d-linear';
 const cs=[c(scope,'projection',{plane:'V',value:[20,40]}),c(scope,'projection',{plane:'H',value:[20,30]})];
 const result=solve({scope,constraints:cs});
 assert.equal(result.status,'unique');assert.equal(result.degrees,0);
 assert.equal(result.solutionCount,1);assert.deepEqual(result.solutions,[{x:20,y:30,z:40}]);
 assert(near(result.maxResidual,0));assert.equal(validateSolveResult(result).ok,true);
 const before=oldFacade.analyze({scope,conditions:cs.map(x=>({type:x.type,...x.data}))});
 assert.deepEqual(result.status,before.status);assert.equal(result.degrees,before.degrees);
});
test('single-point rank stays 1 for redundant constraints and reports contradictions',()=>{
 const scope='point-3d-linear';
 const same=solve({scope,constraints:[c(scope,'coordinate',{axis:'x',value:3}),c(scope,'coordinate',{axis:'x',value:3})]});
 assert.equal(same.status,'continuous');assert.equal(same.degrees,2);assert.equal(same.rank,1);
 const none=solve({scope,constraints:[c(scope,'coordinate',{axis:'x',value:3}),c(scope,'coordinate',{axis:'x',value:4})]});
 assert.equal(none.status,'none');assert.equal(none.degrees,null);assert.equal(none.solutionCount,0);
});
test('planar linear constraints and target isolation',()=>{
 const scope='point-2d-linear';
 const a=solve({scope,constraints:[c(scope,'coordinate',{axis:'x',value:3}),c(scope,'coordinate',{axis:'y',value:4})]});
 assert.equal(a.status,'unique');assert.deepEqual(a.solutions,[{x:3,y:4}]);
 assert.throws(()=>solve({scope,constraints:[c(scope,'coordinate',{axis:'x',value:3},['A']),c(scope,'coordinate',{axis:'y',value:4},['B'])]}));
});
test('line circle intersection returns 0, 1 or 2 candidates with small residuals',()=>{
 const scope='point-2d-intersection';
 for(const [offset,status,count] of [[6,'none',0],[5,'unique',1],[0,'multiple',2]]){
  const r=solve({scope,constraints:[c(scope,'line',{a:0,b:1,offset}),c(scope,'circle',{x:0,y:0,r:5})]});
  assert.equal(r.status,status);assert.equal(r.solutionCount,count);
  if(count){assert(r.maxResidual<1e-8);assert.equal(r.solutions.length,count);}
 }
});
test('coincident circles are continuous, not an arbitrary point',()=>{
 const scope='point-2d-intersection';
 const p={x:0,y:0,r:4},r=solve({scope,constraints:[c(scope,'circle',p),c(scope,'circle',p)]});
 assert.equal(r.status,'coincident');assert.equal(r.solutionCount,null);
 assert.equal(r.globallyUnique,false);assert.deepEqual(r.solutions,[]);
});
test('multi-point linear adapter does not invent coordinates',()=>{
 const scope='multi-point-2d-linear';
 const cs=[
  c(scope,'fixed',{point:'A',axis:'x',value:1},['A']),
  c(scope,'fixed',{point:'A',axis:'y',value:2},['A']),
  c(scope,'coincident',{a:'A',b:'B'},['A','B'])
 ];
 const r=solve({scope,points:['A','B'],constraints:cs});
 assert.equal(r.status,'unique');assert.equal(r.degrees,0);
 assert.equal(r.solutionCount,1);assert.deepEqual(r.solutions,[]);
 assert.match(r.diagnostics.join(' '),/未输出各点坐标/);
});
test('local Jacobian does not claim global existence or uniqueness',()=>{
 const scope='multi-point-2d-local-jacobian',points={A:{x:0,y:0},B:{x:3,y:4}};
 for(const [distance,satisfied] of [[5,true],[6,false]]){
  const r=solve({scope,points,constraints:[c(scope,'distance',{a:'A',b:'B',value:distance},['A','B'])]});
  assert.equal(r.status,'undetermined');assert.equal(r.localDegrees,3);
  assert.equal(r.degrees,null);assert.equal(r.globallyUnique,null);
  assert.equal(r.solutionCount,null);assert.equal(r.atProvidedConfiguration,satisfied);
  assert.equal(r.proofLevel,'local-first-order');
 }
});
test('unsupported scope is explicitly unsupported',()=>{
 const r=solve({scope:'cylinder-intersection',constraints:[]});
 assert.equal(r.status,'unsupported');assert.equal(r.solutionCount,null);
});
