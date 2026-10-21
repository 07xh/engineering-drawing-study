'use strict';
// Independent 00 integration audit. The assertions deliberately enforce
// invariants not covered by the first contract test suite in PR #144.
// This test PR targets the 01 feature branch; it does NOT touch main.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../../core/contracts');
const {toLegacyCondition}=require('../../core/adapters/legacy-constraints.js');

function base(){
 return {id:'audit-1',title:'Synthetic geometry contract audit',
 type:'planar-geometry',status:'source-verified',
 source:{book:'Synthetic fixtures',page:1},
 givens:[],steps:[],renderMode:'manual-steps',
 geometry:[{id:'A',kind:'point',space:'drawing-2d',unit:'mm',data:{x:1,y:2}}],
 constraints:[]};
}
const coordinate=(id='A')=>({
 id:'c1',scope:'point-2d-linear',targetIds:[id],type:'coordinate',
 data:{axis:'x',value:1},source:'given'
});
test('Problem rejects constraints referencing absent geometry IDs',()=>{
 const p=base();p.constraints=[coordinate('MISSING')];
 assert.equal(C.validateProblem(p).ok,false,
  'dangling Constraint.targetIds cannot be accepted');
});
test('Problem rejects steps depending on nonexistent steps/constraints/geometry',()=>{
 const p=base();p.steps=[{
  id:'step-1',explanation:'Try dangling references',actions:[],
  dependsOn:['never-created'],constraintIds:['unknown-constraint'],
  targetIds:['MISSING'],solveResultRef:'absent-result'
 }];
 assert.equal(C.validateProblem(p).ok,false,
  'unresolved step references must fail rather than render silently');
});
test('ConstructionStep rejects empty arc geometry (invalid automatic construction)',()=>{
 assert.equal(C.validateConstructionStep({
  id:'step-1',explanation:'Invalid arc cannot be rendered',
  actions:[{kind:'arc',geometry:{}}]
 }).ok,false,'arc actions must include real center/radius/angles/orientation');
});
test('SolveResult does not permit globallyUnique for multiple solutions',()=>{
 const r={status:'multiple',scope:'point-2d-intersection',
  solutions:[{x:1,y:0},{x:-1,y:0}],solutionCount:2,
  degrees:0,localDegrees:null,rank:null,globallyUnique:true,
  maxResidual:0,proofLevel:'analytic',diagnostics:[],solverId:'test'};
 assert.equal(C.validateSolveResult(r).ok,false,
  'two candidates cannot be globally unique');
});
test('Constraint rejects contradictory type field embedded in data',()=>{
 const c={id:'c1',scope:'point-2d-intersection',targetIds:['A'],
  type:'line',data:{type:'circle',a:0,b:1,offset:0,x:0,y:0,r:2},
  source:'given'};
 assert.equal(C.validateConstraint(c).ok,false,'data.type should not override the outer constraint type');
 const adapted=toLegacyCondition(c,c.scope);
 assert.equal(adapted.type,'line','adapter must not change declared type');
});
test('Constraint rejects incomplete typed data before a solver is called',()=>{
 const c={id:'c1',scope:'point-2d-intersection',targetIds:['A'],
  type:'circle',data:{x:0,y:0},source:'given'};
 assert.equal(C.validateConstraint(c).ok,false,'missing circle radius must be invalid at contract boundary');
});
