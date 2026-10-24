'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const {solveNonlinearPointCandidates}=
 require('../../core/constraints/nonlinear-point-candidates.cjs');
const {validateSolveResult}=require('../../core/contracts/solve-result.js');
const point=id=>({id});
const fixed=(id,point,x,y)=>({id,kind:'fixed',point,at:{x,y}});
const distance=(id,a,b,value)=>({id,kind:'distance',a,b,value});
const seed=(id,y)=>({id,coordinates:{
 A:{x:0,y:0},B:{x:4,y:0},P:{x:2,y}
}});
const base={
 frame:'model-mm-2d',unit:'mm',revision:10,
 points:['A','B','P'].map(point),
 constraints:[fixed('Origin','A',0,0),fixed('Base','B',4,0),
  distance('RadiusA','A','P',3),distance('RadiusB','B','P',3)],
 seeds:[seed('Upper',2),seed('Lower',-2)]
};
test('same M3 entry finds both observed nonlinear circle-distance branches without certifying exhaustive count',()=>{
 const x=evaluateUnifiedMath({kind:'point-constraint-system',revision:10,
  input:{...base}});
 assert.equal(x.kind,'point-constraint-system');
 assert.equal(x.status,'distinct-local-candidates');
 assert.equal(x.localCandidates.length,2);
 assert.equal(x.rankEvidence,undefined);
 assert.equal(x.solveResult.status,'undetermined');
 assert.equal(x.solveResult.proofLevel,'local-first-order');
 assert.equal(x.solveResult.globallyUnique,null);
 assert.equal(x.solveResult.solutionCount,null);
 assert.equal(x.globalBranchEnumerationComplete,false);
 assert.equal(x.mathematicallyVerified,false);
 assert.equal(x.v5Ready,false);
 assert.deepEqual(x.geometry,[]);
 assert.deepEqual(x.constructionIntents,[]);
 assert.deepEqual(x.constructionSteps,[]);
 assert.equal(x.unifiedMathPipeline,'m3-seeded-nonlinear-candidates-no-v5/1');
 assert.equal(validateSolveResult(x.solveResult).ok,true);
 const candidates=x.localCandidates.map(c=>c.points.P);
 assert.ok(candidates.some(p=>p.y>2&&p.y<2.5));
 assert.ok(candidates.some(p=>p.y< -2&&p.y> -2.5));
 assert.ok(x.localCandidates.every(c=>c.maxScaledResidual<x.toleranceScaled&&
  c.rank===6&&c.localDegreesEstimate===0));
 assert.ok(Object.isFrozen(x.localCandidates[0].points));
});
test('same generic factor engine handles a 2D angle and length constraint without unique proof',()=>{
 const input={frame:'model-mm-2d',unit:'mm',revision:2,
  points:['A','B','P'].map(point),
  constraints:[fixed('AnchorA','A',0,0),fixed('AnchorB','B',4,0),
   distance('Leg','B','P',3),
   {id:'RightAngle',kind:'angle',a:'A',vertex:'B',b:'P',degrees:90}],
  seeds:[seed('Above',3),seed('Below',-3)]};
 const x=solveNonlinearPointCandidates(input);
 assert.equal(x.localCandidates.length,2);
 assert.ok(x.localCandidates.every(c=>c.maxScaledResidual<1e-6));
 assert.equal(x.residualScale,'distance-mm-angle-1mm-per-radian');
 assert.equal(x.solveResult.globallyUnique,null);
});
test('identical seeds do not manufacture multiple geometric branches',()=>{
 const x=solveNonlinearPointCandidates({...base,
  seeds:[seed('Initial1',2),seed('Initial2',2.25)]});
 assert.equal(x.localCandidates.length,1);
 assert.equal(x.status,'local-candidate');
 assert.equal(x.globalBranchEnumerationComplete,false);
});
test('contradictions and degenerate angular starts remain undetermined rather than inventing geometry',()=>{
 const impossible={...base,points:['A','B'].map(point),
  constraints:[fixed('Origin','A',0,0),fixed('Base','B',4,0),
   distance('Contradiction','A','B',3)],
  seeds:[{id:'Starting',coordinates:{A:{x:0,y:0},B:{x:4,y:0}}}]};
 const x=solveNonlinearPointCandidates(impossible);
 assert.equal(x.status,'undetermined');
 assert.equal(x.localCandidates.length,0);
 assert.equal(x.solveResult.status,'undetermined');
 assert.deepEqual(x.geometry,[]);
 const degenerate={...base,
  constraints:[fixed('Origin','A',0,0),fixed('Base','B',4,0),
   {id:'RightAngle',kind:'angle',a:'A',vertex:'B',b:'P',degrees:90}],
  seeds:[{id:'Degenerate',coordinates:{
   A:{x:0,y:0},B:{x:4,y:0},P:{x:4,y:0}}}]};
 const y=solveNonlinearPointCandidates(degenerate);
 assert.equal(y.status,'undetermined');
 assert.equal(y.localCandidates.length,0);
 assert.equal(y.seedReports[0].status,'degenerate-or-numeric-failure');
});
test('missing/repeated IDs, forged V5 approval, nonfinite coordinates, unsupported factors, pixels and old revisions fail closed',()=>{
 const bad=[
  {...base,frame:'drawing-px'},
  {...base,unit:'px'},
  {...base,points:[point('A'),point('A')]},
  {...base,points:[point('A'),point('B'),point('P')],v5Ready:true},
  {...base,constraints:[{id:'Sneak',kind:'distance',a:'A',b:'P',value:3,verified:true}]},
  {...base,constraints:[{id:'Nope',kind:'circle-tangent',a:'A',b:'P'}]},
  {...base,constraints:[distance('D','A','A',3)]},
  {...base,seeds:[{id:'Bad',coordinates:{A:{x:Infinity,y:0},B:{x:4,y:0},P:{x:2,y:2}}}]},
  {...base,seeds:[{id:'Bad',coordinates:{A:{x:0,y:0},B:{x:4,y:0}}}]},
  {...base,constraints:[{id:'BadAngle',kind:'angle',a:'A',vertex:'A',b:'P',degrees:90}]},
  {...base,constraints:[{id:'BadAngle',kind:'angle',a:'A',vertex:'B',b:'P',degrees:180}]}
 ];
 for(const input of bad) assert.throws(()=>solveNonlinearPointCandidates(input));
 assert.throws(()=>evaluateUnifiedMath({kind:'point-constraint-system',revision:11,
  input:base}),/stale/);
 assert.throws(()=>evaluateUnifiedMath({kind:'point-constraint-system',revision:10,
  input:base,sheet:{origin:{x:0,y:0},scale:5}}),/sheet pixels/);
});
