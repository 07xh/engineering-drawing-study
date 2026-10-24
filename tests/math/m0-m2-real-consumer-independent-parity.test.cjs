'use strict';
/**
 * M0 acceptance: REAL M2 / scoped M3 consumers versus an independently
 * implemented symbolic DSU equality solver, plus direct analytic 3D oracle.
 *
 * A sampled configuration failing residuals is NOT by itself global
 * nonexistence; a local Jacobian rank zero-DOF is NOT global uniqueness.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {analyzeLinearPointConstraints:local}=
 require('../../core/constraints/linear-point-local-evidence.cjs');
const {solveLinearPointSystem:analytic}=
 require('../../core/constraints/linear-point-global-solver.cjs');
const {solveAffinePointConstraints:affine3D}=
 require('../../core/constraints/affine-point-unknown-solver.cjs');
const P=(id,x=0,y=0)=>({
 id,kind:'point',space:'drawing-2d',unit:'mm',data:{x,y}
});
const F=(id,point,axis,value)=>({
 id,scope:'multi-point-2d-linear',type:'fixed',targetIds:[point],
 data:{point,axis,value},source:'given'
});
const R=(id,type,a,b)=>({
 id,scope:'multi-point-2d-linear',type,targetIds:[a,b],
 data:{a,b},source:'given'
});
function both(geometry,constraints,scale=10,tol=1e-6){
 const input={geometry,constraints,sourceRevision:18,
  featureScaleMm:scale,absoluteToleranceMm:tol};
 return {measured:local(input),truth:analytic(input)};
}
function boundedEvidence(m){
 assert.equal(m.proofOfExistence,false);
 assert.equal(m.proofOfGlobalUniqueness,false);
 assert.equal(m.proofOfNonexistence,false);
 assert.equal(m.globallyUnique,null);
}
test('real M2 consumer agrees with independent DSU rank/DOF on 3 scales of TWO-point anchors',()=>{
 for(const scale of [1e-6,1,1e6]){
  const g=[P('A',0,0),P('B',3*scale,5*scale)];
  const cs=[
   F('Ax','A','x',0),F('Ay','A','y',0),
   F('Bx','B','x',3*scale),F('By','B','y',5*scale)
  ];
  const {measured,truth}=both(g,cs,scale);
  assert.equal(measured.status,'local-numeric-evidence');
  assert.equal(truth.status,'unique');
  assert.equal(measured.rankEstimate,truth.independentRank);
  assert.equal(measured.localDegreesEstimate,truth.degrees);
  assert.equal(measured.rankEstimate,4);
  assert.equal(measured.atProvidedConfiguration,true);
  boundedEvidence(measured);
  assert.equal(truth.sourceImageProven,false);
  assert.equal(truth.readyForV5,false);
 }
});
test('dependent point-coincidence constraints have independent rank despite duplicated equations',()=>{
 const g=[P('A',2,3),P('B',2,3)];
 const cs=[
  R('join','coincident','A','B'),F('xA','A','x',2),F('yA','A','y',3)
 ];
 for(const order of [false,true]){
  const {measured,truth}=both(order?[...g].reverse():g,
    order?[...cs].reverse():cs);
  assert.equal(truth.status,'unique');
  assert.equal(measured.rankEstimate,truth.independentRank);
  assert.equal(measured.localDegreesEstimate,truth.degrees);
  assert.equal(measured.rankEstimate,4);
  boundedEvidence(measured);
 }
});
test('unanchored co-projected pair has two continuous degrees, no fake unique point',()=>{
 const {measured,truth}=both(
  [P('A',2,3),P('B',2,3)],[R('join','coincident','A','B')]
 );
 assert.equal(truth.status,'continuous');
 assert.equal(truth.solveResult.globallyUnique,false);
 assert.equal(truth.solveResult.solutionCount,null);
 assert.equal(measured.rankEstimate,truth.independentRank);
 assert.equal(measured.localDegreesEstimate,truth.degrees);
 assert.equal(measured.rankEstimate,2);
 assert.equal(measured.localDegreesEstimate,2);
 boundedEvidence(measured);
});
test('duplicate fixed-x equation cannot add rank or erase a free y',()=>{
 const {measured,truth}=both([P('A',7,2)],
  [F('x1','A','x',7),F('x2','A','x',7)]);
 assert.equal(truth.status,'continuous');
 assert.equal(measured.rankEstimate,1);
 assert.equal(truth.independentRank,1);
 assert.equal(measured.localDegreesEstimate,1);
 assert.equal(measured.atProvidedConfiguration,true);
 boundedEvidence(measured);
});
test('sampled residual conflict is not a local proof of global impossibility',()=>{
 const g=[P('A',0,0)];
 const cs=[F('x1','A','x',0),F('x2','A','x',3)];
 const {measured,truth}=both(g,cs);
 assert.equal(measured.status,'configuration-residual-failed');
 assert.equal(measured.atProvidedConfiguration,false);
 boundedEvidence(measured);
 // Independent *analytic equality-class* oracle CAN prove the
 // contradictory anchors impossible, unlike local sampled residual.
 assert.equal(truth.status,'none');
 assert.equal(truth.solveResult.solutionCount,0);
 assert.equal(truth.readyForV5,false);
});
test('distinct near-equal anchors are not numerically promoted to exact equality',()=>{
 const {measured,truth}=both([P('A',0,0)],
  [F('x1','A','x',0),F('x2','A','x',1e-8)],10,1e-6);
 assert.equal(measured.atProvidedConfiguration,true);
 assert.equal(measured.proofOfGlobalUniqueness,false);
 assert.equal(truth.status,'undetermined');
 assert.equal(truth.solveResult.proofLevel,'none');
});
test('large-origin versus tiny mm resolution is rejected by M2 numeric consumer',()=>{
 const g=[P('A',1e12,0)],cs=[F('x','A','x',1e12)];
 assert.throws(()=>both(g,cs,10,1e-8),/resolution/);
 const truth=analytic({geometry:g,constraints:cs,sourceRevision:18,
  featureScaleMm:10,absoluteToleranceMm:1e-8});
 assert.equal(truth.status,'undetermined');
 assert.equal(truth.readyForV5,false);
});
test('real M3 affine 3D consumers use same M0 rank evidence but not V5 authority',()=>{
 const result=affine3D({frame:'model-mm-3d',unit:'mm',revision:18,
  points:[{id:'A'},{id:'B'}],constraints:[
   {id:'anchor',kind:'fixed',point:'A',at:{x:5,y:-2,z:8}},
   {id:'translate',kind:'offset',from:'A',to:'B',delta:{x:3,y:4,z:1}}
  ]});
 assert.equal(result.status,'unique');
 assert.equal(result.rank,6);
 assert.equal(result.rankEvidence.rankEstimate,6);
 assert.equal(result.rankEvidence.converged,true);
 assert.deepEqual(result.geometry.find(p=>p.id==='B').data,{x:8,y:2,z:9});
 assert.equal(result.sourceProblemConfirmed,false);
 assert.equal(result.v5Ready,false);
 assert.equal(result.fullEngineeringDrawingVerified,false);
});
