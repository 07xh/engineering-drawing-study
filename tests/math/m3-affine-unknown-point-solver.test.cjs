'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const {solveAffinePointConstraints}=
 require('../../core/constraints/affine-point-unknown-solver.cjs');
const {validateSolveResult}=require('../../core/contracts/solve-result.js');
const pt=id=>({id});
const fixed=(id,point,at)=>({id,kind:'fixed',point,at});
const offset=(id,from,to,delta)=>({id,kind:'offset',from,to,delta});
const midpoint=(id,mid,a,b)=>({id,kind:'midpoint',mid,a,b});
function solve(frame,points,constraints,revision=8){
 return evaluateUnifiedMath({kind:'affine-point-system',revision,
  input:{frame,unit:'mm',points:points.map(pt),constraints}});
}
test('M3 shared solver computes a uniquely determined 2D three-point system, not V5',()=>{
 const result=solve('model-mm-2d',['A','B','Mid'],[
  fixed('Anchor','A',{x:2,y:3}),
  offset('Delta','A','B',{x:4,y:5}),
  midpoint('Center','Mid','A','B')]);
 assert.equal(result.status,'unique');
 assert.equal(result.solveResult.status,'unique');
 assert.equal(result.solveResult.proofLevel,'linear-algebra');
 assert.equal(result.solveResult.globallyUnique,true);
 assert.equal(result.solveResult.degrees,0);
 assert.equal(result.rank,6);
 assert.equal(result.equationCount,6);
 assert.equal(result.variableCount,6);
 assert.equal(result.rankEvidence.rankEstimate,6);
 assert.deepEqual(result.geometry.map(p=>p.data),[
  {x:2,y:3},{x:6,y:8},{x:4,y:5.5}]);
 assert.equal(result.mathematicallyVerifiedWithinAffineScope,true);
 assert.equal(result.sourceProblemConfirmed,false);
 assert.equal(result.v5Ready,false);
 assert.deepEqual(result.constructionIntents,[]);
 assert.deepEqual(result.constructionSteps,[]);
 assert.equal(result.unifiedMathPipeline,'m3-scoped-affine-unknowns-no-v5/1');
 assert.equal(validateSolveResult(result.solveResult).ok,true);
 assert.ok(result.residualMm<=result.toleranceMm);
 assert.equal(Object.isFrozen(result.geometry[0].data),true);
});
test('M3 solver handles arbitrary known/unknown 3D point anchors, coincident and offsets',()=>{
 const outcome=solve('model-mm-3d',['A','B','C'],[
  fixed('FixA','A',{x:5,y:-2,z:8}),
  {id:'Same',kind:'coincident',a:'A',b:'B'},
  offset('Move','B','C',{x:1,y:2,z:-4})],21);
 assert.equal(outcome.status,'unique');
 assert.equal(outcome.revision,21);
 assert.equal(outcome.equationCount,9);
 assert.equal(outcome.rank,9);
 assert.deepEqual(outcome.geometry.find(x=>x.id==='C').data,
  {x:6,y:0,z:4});
});
test('unanchored and partly constrained point groups have a continuum of solutions, not arbitrary coordinates',()=>{
 const onlyCoincident=solve('model-mm-2d',['A','B'],[
  {id:'Same',kind:'coincident',a:'A',b:'B'}]);
 assert.equal(onlyCoincident.status,'continuous');
 assert.equal(onlyCoincident.rank,2);
 assert.equal(onlyCoincident.nullity,2);
 assert.equal(onlyCoincident.solveResult.solutionCount,null);
 assert.equal(onlyCoincident.solveResult.degrees,2);
 assert.equal(onlyCoincident.solveResult.globallyUnique,false);
 assert.deepEqual(onlyCoincident.geometry,[]);
 assert.deepEqual(onlyCoincident.solveResult.solutions,[]);
 assert.equal(onlyCoincident.mathematicallyVerifiedWithinAffineScope,false);
 const empty=solve('model-mm-2d',['Unconstrained'],[]);
 assert.equal(empty.status,'continuous');
 assert.equal(empty.rank,0);
 assert.equal(empty.nullity,2);
 assert.deepEqual(empty.geometry,[]);
});
test('inconsistent equations return canonical no-solution, without guessed points or V5',()=>{
 const impossible=solve('model-mm-2d',['A'],[
  fixed('FixedA','A',{x:0,y:0}),
  {id:'Impossible',kind:'axis',point:'A',axis:'x',value:5}
 ]);
 assert.equal(impossible.status,'none');
 assert.equal(impossible.solveResult.solutionCount,0);
 assert.equal(impossible.solveResult.globallyUnique,false);
 assert.deepEqual(impossible.solveResult.solutions,[]);
 assert.deepEqual(impossible.geometry,[]);
 assert.equal(impossible.solveResult.maxResidual,null);
 assert.equal(impossible.v5Ready,false);
 assert.equal(validateSolveResult(impossible.solveResult).ok,true);
});
test('independent equations for each axis can determine a point without a hardcoded example',()=>{
 const a=solve('model-mm-3d',['PointQ'],[
  {id:'X',kind:'axis',point:'PointQ',axis:'x',value:12.25},
  {id:'Y',kind:'axis',point:'PointQ',axis:'y',value:-9},
  {id:'Z',kind:'axis',point:'PointQ',axis:'z',value:3.75}
 ]);
 assert.equal(a.status,'unique');
 assert.deepEqual(a.geometry[0].data,{x:12.25,y:-9,z:3.75});
});
test('refuse unknown-point nonlinear distances/angles, image pixels and forged proof',()=>{
 const givens={frame:'model-mm-2d',unit:'mm',revision:2,
  points:[pt('A'),pt('B')],constraints:[
   {id:'Length',kind:'distance',a:'A',b:'B',value:10}]};
 assert.throws(()=>solveAffinePointConstraints(givens),/non-affine/);
 assert.throws(()=>solveAffinePointConstraints({...givens,
  constraints:[],verified:true}),/unexpected proof/);
 assert.throws(()=>solveAffinePointConstraints({...givens,
  constraints:[],frame:'drawing-px'}),/model-mm/);
 assert.throws(()=>solveAffinePointConstraints({...givens,
  constraints:[],unit:'px'}),/model-mm/);
 assert.throws(()=>evaluateUnifiedMath({kind:'affine-point-system',revision:3,
  input:{...givens,revision:2,constraints:[]}}),/stale/);
 assert.throws(()=>evaluateUnifiedMath({kind:'affine-point-system',revision:2,
  input:{...givens,constraints:[]},sheet:{origin:{x:0,y:0},scale:3}}),
  /sheet pixels/);
});
test('reject duplicate or unknown identities, source injection, bad axes and nonfinite mm',()=>{
 const base={frame:'model-mm-3d',unit:'mm',revision:2,points:[pt('A'),pt('B')],
  constraints:[]};
 for(const candidate of [
  {...base,points:[pt('A'),pt('A')]},
  {...base,constraints:[fixed('a','Lost',{x:0,y:0,z:0})]},
  {...base,constraints:[fixed('a','A',{x:0,y:0,z:Infinity})]},
  {...base,constraints:[fixed('a','A',{x:0,y:0})]},
  {...base,constraints:[fixed('a','A',{x:0,y:0,z:0,answer:1})]},
  {...base,constraints:[{id:'Co',kind:'coincident',a:'A',b:'A'}]},
  {...base,constraints:[{id:'Axis',kind:'axis',point:'A',axis:'w',value:1}]},
  {...base,constraints:[{id:'Fake',kind:'axis',point:'A',axis:'x',value:0,verified:true}]},
  {...base,constraints:[{id:'M',kind:'midpoint',mid:'A',a:'A',b:'B'}]},
  {...base,constraints:[{id:'D',kind:'offset',from:'A',to:'B',delta:{x:0,y:0,z:1e300}}]}
 ]) assert.throws(()=>solveAffinePointConstraints(candidate));
});
