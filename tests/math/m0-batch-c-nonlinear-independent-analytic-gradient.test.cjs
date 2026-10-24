'use strict';
/** Independent analytic calculus oracle for existing REAL seeded M3 distance
 * candidates, M0 normalization and M0 Jacobi rank. No new solver or V5.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {solveNonlinearPointCandidates:solve}=
 require('../../core/constraints/nonlinear-point-candidates.cjs');
const {normalizeLocalSystem:normalize}=
 require('../../core/numeric/dimensionless-jacobian.cjs');
const {diagnoseJacobian:rank}=
 require('../../core/numeric/jacobian-rank-evidence.cjs');
const fixed=(id,point,x,y)=>({id,kind:'fixed',point,at:{x,y}});
const dist=(id,a,b,r)=>({id,kind:'distance',a,b,value:r});
const seed=(id,offset,y)=>({id,coordinates:{
 A:{x:offset,y:0},B:{x:offset+8*offset.scale,y:0},P:{x:offset+4*offset.scale,y}
}});
function input(scale,ys,extra=[]){
 const A={x:0,y:0},B={x:8*scale,y:0};
 const seeds=ys.map((y,i)=>({id:'Root'+(i+1),coordinates:{
  A,B,P:{x:4*scale,y}}}));
 return {frame:'model-mm-2d',unit:'mm',revision:25,
  points:[{id:'A'},{id:'B'},{id:'P'}],
  constraints:[fixed('FixA','A',0,0),fixed('FixB','B',8*scale,0),
   dist('CircleA','A','P',5*scale),dist('CircleB','B','P',5*scale),...extra],
  seeds};
}
function analyticDistanceRow(center,point,anchorIndex){
 const dx=point.x-center.x,dy=point.y-center.y,
  length=Math.hypot(dx,dy);
 if(length===0)throw new RangeError('zero distance has undefined derivative');
 const ux=dx/length,uy=dy/length;
 const row=[0,0,0,0,ux,uy];
 row[anchorIndex]=-ux;row[anchorIndex+1]=-uy;
 return row;
}
function analyticRows(scale,y){
 const A={x:0,y:0},B={x:8*scale,y:0},P={x:4*scale,y};
 const basis=Array.from({length:4},(_,i)=>Array.from({length:6},(_,j)=>Number(i===j)));
 return [...basis,analyticDistanceRow(A,P,0),analyticDistanceRow(B,P,2)];
}
test('real M3 upper/lower two-circle candidates match independent algebraic roots and ANALYTIC M0 rank',()=>{
 for(const scale of [.5,1,4]){
  const result=solve(input(scale,[3*scale,-3*scale]));
  assert.equal(result.status,'distinct-local-candidates');
  assert.equal(result.localCandidates.length,2);
  assert.equal(result.analyticSubgraphEvidence.subgraphs.length,1);
  const graph=result.analyticSubgraphEvidence.subgraphs[0];
  assert.equal(graph.proof.status,'two-separated-roots');
  assert.equal(graph.proof.branchCount,2);
  assert.equal(graph.completeFullConstraintGraphVerified,false);
  for(const candidate of result.localCandidates){
   const p=candidate.points.P;
   const expected=3*scale*Math.sign(p.y);
   assert.ok(Math.abs(p.x-4*scale)<1e-8);
   assert.ok(Math.abs(p.y-expected)<1e-8);
   // Algebraic independent circle identity:
   // x = (d^2+r1^2-r2^2)/(2d), y^2 = r^2-x^2.
   const radius=5*scale;
   assert.ok(Math.abs((p.x*p.x+p.y*p.y)-radius*radius)<1e-7);
   assert.ok(Math.abs(((p.x-8*scale)**2+p.y*p.y)-radius*radius)<1e-7);
   const rows=analyticRows(scale,expected);
   const dx=rows[4][4],dy=rows[4][5],ex=rows[5][4],ey=rows[5][5];
   assert.ok(Math.abs((dx*ey-dy*ex)-24/25*Math.sign(expected))<1e-13);
   const dimensionless=normalize({
    variables:['ax','ay','bx','by','px','py'].map(id=>({id,unit:'mm',scale})),
    constraints:rows.map((row,i)=>({
     id:'Eq'+i,unit:'mm',scale,residual:0,
     absoluteTolerance:1e-8,
     derivatives:row.map(value=>({value,unit:'mm/mm'}))
    }))
   });
   assert.deepEqual(dimensionless.normalizedJacobian,rows);
   assert.equal(dimensionless.atProvidedConfiguration,true);
   const independent=rank({rows:dimensionless.normalizedJacobian,normalized:true});
   assert.equal(independent.rankEstimate,6);
   assert.equal(independent.status,'full-column-rank');
   assert.equal(candidate.rank,independent.rankEstimate);
   assert.equal(candidate.localDegreesEstimate,0);
   assert.ok(candidate.maxScaledResidual<=result.toleranceScaled);
  }
  assert.equal(result.solveResult.status,'undetermined');
  assert.equal(result.solveResult.globallyUnique,null);
  assert.equal(result.globalBranchEnumerationComplete,false);
  assert.equal(result.v5Ready,false);
 }
});
test('reverse seed order never changes independent root set or grants global uniqueness',()=>{
 const positive=solve(input(1,[3,-3]));
 const negative=solve(input(1,[-3,3]));
 const normalizePoints=r=>r.localCandidates.map(c=>c.points.P.y).sort((a,b)=>a-b);
 assert.deepEqual(normalizePoints(negative),normalizePoints(positive));
 assert.equal(negative.solveResult.globallyUnique,null);
 assert.equal(negative.globalBranchEnumerationComplete,false);
});
