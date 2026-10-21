'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../../core/contracts');
const legacyRenderer=require('../../knowledge/drawing-action-renderer.js');
const {toLegacyCondition}=require('../../core/adapters/legacy-constraints.js');
const geometry={id:'P',kind:'point',space:'drawing-2d',unit:'mm',data:{x:3,y:4}};
const constraint={id:'c1',scope:'point-2d-linear',type:'coordinate',targetIds:['P'],data:{axis:'x',value:3},source:'given'};
const step1={id:'step-1',explanation:'给出第一条定位线',actions:[],
 targetIds:['P'],constraintIds:['c1']};
const step2={id:'step-2',explanation:'检验求交得到 P',actions:[],
 dependsOn:['step-1'],solveResultRef:'result1',targetIds:['P']};
const solved={id:'result1',status:'unique',scope:'point-2d-linear',
 solutions:[{x:3,y:4}],solutionCount:1,degrees:0,localDegrees:null,rank:2,
 globallyUnique:true,maxResidual:0,proofLevel:'linear-algebra',
 diagnostics:[],solverId:'test'};
const problem=()=>({id:'synthetic-point',title:'Reference validated example',
 type:'point-projection',status:'source-verified',
 source:{book:'synthetic-only fixture',page:1},
 givens:[],geometry:[geometry],constraints:[constraint],solveResults:[solved],
 steps:[step1,step2],renderMode:'manual-steps'});
test('well-formed entity references and ordered construction steps pass',()=>{
 assert.deepEqual(C.validateProblem(problem()),{ok:true,errors:[]});
});
test('broken references, cycles, duplicate identifiers and malformed arrays fail without throwing',()=>{
 const cases=[
  {...problem(),steps:[step2,step1]},
  {...problem(),steps:[{...step1,dependsOn:['step-1']},step2]},
  {...problem(),steps:[{...step1,dependsOn:42},step2]},
  {...problem(),constraints:[constraint,{...constraint}]},
  {...problem(),geometry:[]},
  {...problem(),steps:[step1,{...step2,solveResultRef:'missing'}]},
  {...problem(),steps:[step1,{...step2,targetIds:['unknown']}]},
  {...problem(),steps:[step1,{...step2,constraintIds:['bad']}]}
 ];
 for(const c of cases){
  const result=C.validateProblem(c);
  assert.equal(result.ok,false,JSON.stringify(c));
 }
});
test('mathematical circle arcs include explicit clockwise/counterclockwise directions',()=>{
 const base={id:'arc1',kind:'arc',space:'drawing-2d',unit:'mm',data:{
  center:{x:2,y:4},radius:8,startAngle:0,endAngle:90,direction:'ccw'}};
 assert.equal(C.validateGeometry(base).ok,true);
 assert.equal(C.validateGeometry({...base,data:{...base.data,startAngle:90,endAngle:0,direction:'cw'}}).ok,true);
 for(const invalid of [
  {radius:0},{direction:'cw'},{endAngle:0},
  {endAngle:400},{radius:-2}
 ])assert.equal(C.validateGeometry({...base,data:{...base.data,...invalid}}).ok,false);
});
test('drawing arc actions stay compatible with proven legacy SVG renderer',()=>{
 const arc={kind:'arc',style:'result',geometry:{cx:10,cy:20,r:9,startAngle:0,endAngle:90}};
 assert.equal(C.validAction(arc),true);
 assert.equal(legacyRenderer.validAction(arc),true);
 const bad={...arc,geometry:{...arc.geometry,r:0}};
 assert.equal(C.validAction(bad),false);
 assert.equal(legacyRenderer.validAction(bad),false);
 assert.equal(C.validAction({...arc,direction:'counterclockwise',geometry:{...arc.geometry,direction:'counterclockwise'}}),false);
});
test('nonlinear constraint point references must match declared targets',()=>{
 const c={id:'c',scope:'multi-point-2d-local-jacobian',type:'distance',
  targetIds:['A','B'],data:{a:'A',b:'B',value:5},source:'given'};
 assert.equal(C.validateConstraint(c).ok,true);
 assert.equal(C.validateConstraint({...c,targetIds:['A','C']}).ok,false);
 assert.equal(C.validateConstraint({...c,data:{...c.data,value:-1}}).ok,false);
});
test('legacy solver condition conversion preserves external discriminator',()=>{
 const result=toLegacyCondition(constraint,'point-2d-linear');
 assert.equal(result.type,'coordinate');
 assert.deepEqual(result,{axis:'x',value:3,type:'coordinate'});
 assert.throws(()=>toLegacyCondition({...constraint,data:{...constraint.data,type:'line'}},'point-2d-linear'));
});
test('unique, multiple, no solutions and local DOF have consistent cardinality',()=>{
 const base={...solved};
 assert.equal(C.validateSolveResult(base).ok,true);
 assert.equal(C.validateSolveResult({...base,status:'multiple',solutionCount:2,globallyUnique:true}).ok,false);
 assert.equal(C.validateSolveResult({...base,status:'none',solutionCount:0,globallyUnique:false}).ok,false);
 const multi={...base,status:'multiple',solutionCount:2,solutions:[{x:1,y:1},{x:2,y:2}],globallyUnique:false};
 assert.equal(C.validateSolveResult(multi).ok,true);
 const local={...base,status:'undetermined',solutionCount:null,solutions:[],
  globallyUnique:null,degrees:null,localDegrees:1,proofLevel:'local-first-order'};
 assert.equal(C.validateSolveResult(local).ok,true);
});
