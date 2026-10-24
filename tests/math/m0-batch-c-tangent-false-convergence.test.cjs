'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {solveNonlinearPointCandidates:solve}=
 require('../../core/constraints/nonlinear-point-candidates.cjs');
const {classifyTwoCircleLoci:classify}=
 require('../../core/constraints/two-circle-branch-evidence.cjs');
const {checkResidual}=require('../../core/numeric/residual-evidence.cjs');
const {diagnoseJacobian}=require('../../core/numeric/jacobian-rank-evidence.cjs');
const P=(x,y)=>({x,y});
function run(radius,y,extra=[]){
 const constraints=[
  {id:'AnchorA',kind:'fixed',point:'A',at:P(0,0)},
  {id:'AnchorB',kind:'fixed',point:'B',at:P(8,0)},
  {id:'LocusA',kind:'distance',a:'A',b:'P',value:radius},
  {id:'LocusB',kind:'distance',a:'B',b:'P',value:radius},...extra
 ];
 return solve({frame:'model-mm-2d',unit:'mm',revision:25,
  points:['A','B','P'].map(id=>({id})),constraints,
  seeds:[{id:'ReviewedGuess',coordinates:{A:P(0,0),B:P(8,0),P:P(4,y)}}]
 });
}
function circles(radius){
 return classify({revision:25,first:{id:'LocusA',center:P(0,0),radiusMm:radius},
  second:{id:'LocusB',center:P(8,0),radiusMm:radius}});
}
test('two exactly tangent distance loci have rank-deficient analytic gradients, no complete branch proof',()=>{
 const c=circles(4);
 assert.equal(c.status,'undetermined');
 assert.equal(c.exhaustiveAlgebraicTopologyWithinTwoLoci,false);
 const rows=[[1,0,0,0,0,0],[0,1,0,0,0,0],[0,0,1,0,0,0],
  [0,0,0,1,0,0],[-1,0,0,0,1,0],[0,0,1,0,-1,0]];
 const j=diagnoseJacobian({rows,normalized:true});
 assert.equal(j.rankEstimate,5);
 assert.equal(j.localDegreesEstimate,1);
 assert.equal(j.proofOfExistence,false);
 assert.equal(j.proofOfGlobalUniqueness,false);
 const actual=run(4,0);
 assert.equal(actual.localCandidates.length,1);
 assert.equal(actual.localCandidates[0].rank,5);
 assert.equal(actual.solveResult.status,'undetermined');
 assert.equal(actual.v5Ready,false);
});
test('NEAR tangent: low residual at midpoint is not evidence of a complete root or correct branch count',()=>{
 const radius=4+1e-10;
 const geometricY=Math.sqrt(radius*radius-16);
 assert.ok(geometricY>1e-5);
 const c=circles(radius);
 assert.equal(c.status,'undetermined');
 assert.equal(c.exhaustiveAlgebraicTopologyWithinTwoLoci,false);
 const actual=run(radius,0);
 assert.equal(actual.localCandidates.length,1);
 const p=actual.localCandidates[0].points.P;
 assert.equal(p.y,0);
 assert.ok(Math.abs(p.y-geometricY)>1e-5);
 assert.equal(actual.localCandidates[0].rank,5);
 assert.equal(actual.globalBranchEnumerationComplete,false);
 assert.equal(actual.solveResult.solutionCount,null);
 assert.equal(actual.solveResult.globallyUnique,null);
 const local=checkResidual({residual:4-radius,absoluteTolerance:1e-6,
  relativeTolerance:0,characteristicScale:4,unit:'mm'});
 assert.equal(local.status,'within-tolerance');
 assert.equal(local.proofOfExistence,false);
 assert.equal(local.proofOfUniqueness,false);
});
test('analytic two-circle subgraph roots never certify an inconsistent additional M3 constraint',()=>{
 const result=run(5,3,[{id:'WrongY',kind:'axis',point:'P',axis:'y',value:0}]);
 assert.equal(result.analyticSubgraphEvidence.subgraphs.length,1);
 const witness=result.analyticSubgraphEvidence.subgraphs[0];
 assert.equal(witness.proof.status,'two-separated-roots');
 assert.equal(witness.proof.branchCount,2);
 assert.equal(witness.completeFullConstraintGraphVerified,false);
 assert.equal(result.solveResult.status,'undetermined');
 assert.equal(result.geometry.length,0);
 assert.equal(result.constructionIntents.length,0);
 assert.equal(result.v5Ready,false);
});
test('numerical rank threshold sensitivity and extreme-scale cancellation remain scoped',()=>{
 const threshold=1e-10;
 const r=diagnoseJacobian({
  rows:[[1,0],[0,threshold]],normalized:true,relativeThreshold:threshold
 });
 assert.equal(r.status,'undetermined');
 assert.equal(r.thresholdSensitive,true);
 assert.equal(r.proofOfGlobalUniqueness,false);
 const huge=diagnoseJacobian({rows:[[1e308,0],[0,1e-308]],normalized:true});
 assert.equal(huge.status,'undetermined');
 assert.equal(huge.numericUnderflowDetected,true);
 assert.equal(huge.proofOfExistence,false);
});
