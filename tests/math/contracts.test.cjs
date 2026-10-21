'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../../core/contracts');
const {adaptLegacyProblem,adaptLegacyModel}=require('../../core/adapters');
const legacy=require('../../knowledge/problem-schema.js');
const G=require('../../labs/dof-lab-geometry.js');
const problem={id:'example-2-2',title:'第三投影',type:'point-projection',
 status:'steps-verified',source:{book:'已核实的教学教材',page:34},givens:[],
 renderMode:'manual-steps',steps:[{id:'step-1',explanation:'绘制等高联系线',actions:[]}]};
test('legacy metadata remains source-safe and valid after adaptation',()=>{
 assert.equal(legacy.validate(problem).ok,true);
 const converted=adaptLegacyProblem(problem);
 assert.equal(C.validateProblem(converted).ok,true);
 assert.equal(converted.schemaVersion,C.SCHEMA_VERSION);
 assert.equal(converted.status,problem.status);
 assert.deepEqual(converted.steps,problem.steps);
 assert.deepEqual(converted.geometry,[]);
 assert.deepEqual(converted.constraints,[]);
 assert.equal(problem.schemaVersion,undefined,'adapter must not mutate caller');
});
test('solution/source gate cannot be bypassed',()=>{
 assert.equal(C.validateProblem({...problem,status:'solution-verified'}).ok,false);
 assert.equal(C.validateProblem({...problem,status:'source-pending',renderMode:'geometry-engine'}).ok,false);
 assert.equal(C.validateProblem({...problem,schemaVersion:'999.0.0'}).ok,false);
});
test('geometry contract rejects nonfinite points and invalid mesh topology',()=>{
 const p={id:'A',kind:'point',space:'model-3d',unit:'mm',data:{x:10,y:20,z:30}};
 assert.equal(C.validateGeometry(p).ok,true);
 assert.equal(C.validateGeometry({...p,data:{...p.data,z:Infinity}}).ok,false);
 const mesh=adaptLegacyModel(G.preset('cuboid'));
 assert.equal(C.validateGeometry(mesh).ok,true);
 assert.equal(C.validateGeometry({...mesh,data:{...mesh.data,edges:[['A','UNKNOWN']]}}).ok,false);
});
test('constraint types and independent local/global result semantics',()=>{
 const c={id:'c1',scope:'point-3d-linear',targetIds:['P'],type:'projection',
   data:{plane:'H',value:[20,30]},source:'given'};
 assert.equal(C.validateConstraint(c).ok,true);
 assert.equal(C.validateConstraint({...c,data:{plane:'H',value:[20,NaN]}}).ok,false);
 assert.equal(C.validateConstraint({...c,scope:'point-2d-linear'}).ok,false);
 const local={scope:'multi-point-2d-local-jacobian',status:'undetermined',solutions:[],
   solutionCount:null,degrees:null,localDegrees:1,rank:1,
   globallyUnique:null,maxResidual:0,proofLevel:'local-first-order',diagnostics:[],solverId:'legacy'};
 assert.equal(C.validateSolveResult(local).ok,true);
 assert.equal(C.validateSolveResult({...local,status:'unique',solutionCount:1,globallyUnique:true}).ok,false);
});
test('steps preserve legacy renderer shape with extra optional proof links',()=>{
 const step={id:'step-2',explanation:'利用已知点构造辅助线',actions:[],
  dependsOn:['step-1'],constraintIds:['c1'],targetIds:['P'],
  reason:'来自经过审阅的给定条件',checks:[],solveResultRef:'r1'};
 assert.equal(C.validateConstructionStep(step).ok,true);
 assert.equal(C.validateConstructionStep({...step,actions:[{kind:'point',geometry:{x:NaN,y:1}}]}).ok,false);
});
