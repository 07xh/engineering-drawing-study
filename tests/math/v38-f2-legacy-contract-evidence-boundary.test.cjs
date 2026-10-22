'use strict';
/** #372 M2/M4 / #377 F2: existing legacy contract boundaries must not be
 * mistaken for a completed semantic ConstructionIntent or global proof.
 * Regression only; no new competing schema or renderer.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {validateSolveResult}=require('../../core/contracts/solve-result.js');
const {validateConstructionStep}=require('../../core/contracts/construction-step.js');
const result=(changes={})=>({
 status:'undetermined',scope:'local-constraints',solutions:[],
 solutionCount:null,degrees:null,localDegrees:0,rank:2,
 globallyUnique:null,maxResidual:0,proofLevel:'local-first-order',
 diagnostics:[],...changes
});
test('F2 M2 local rank and zero local degrees do not imply global uniqueness',()=>{
 assert.equal(validateSolveResult(result()).ok,true);
 assert.equal(validateSolveResult(result({status:'unique',solutionCount:1,
  degrees:0,globallyUnique:true,solutions:[{x:1}]})).ok,false);
});
test('F2 unknown or unsupported result cannot claim exact count or global uniqueness',()=>{
 for(const status of ['undetermined','unsupported','continuous','coincident']){
  assert.equal(validateSolveResult(result({status,proofLevel:'none',
   localDegrees:null,rank:null})).ok,true,status);
  assert.equal(validateSolveResult(result({status,proofLevel:'none',
   solutionCount:1,globallyUnique:true})).ok,false,status);
 }
});
test('F2 legacy construction action must not silently accept ccw flag in SVG degree representation',()=>{
 const step=(geometry)=>({id:'step-1',explanation:'checked arc',
  actions:[{kind:'arc',geometry}]});
 const arc={cx:0,cy:0,r:10,startAngle:0,endAngle:90};
 assert.equal(validateConstructionStep(step(arc)).ok,true);
 assert.equal(validateConstructionStep(step({...arc,direction:'counterclockwise'})).ok,false);
 assert.equal(validateConstructionStep(step({...arc,startAngle:90,endAngle:0})).ok,false);
});
