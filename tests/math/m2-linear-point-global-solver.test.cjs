'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {solveLinearPointSystem:solve}=
 require('../../core/constraints/linear-point-global-solver.cjs');
const {validateSolveResult}=require('../../core/contracts/solve-result.js');
const legacy=require('../../knowledge/multi-point-constraints.js');
const pt=(id,x=999,y=999)=>({
 id,kind:'point',space:'drawing-2d',unit:'mm',data:{x,y}
});
const fixed=(id,point,axis,value)=>({
 id,scope:'multi-point-2d-linear',type:'fixed',
 targetIds:[point],source:'given',data:{point,axis,value}
});
const pair=(id,type,a,b)=>({
 id,scope:'multi-point-2d-linear',type,targetIds:[a,b],
 source:'given',data:{a,b}
});
const run=(geometry,constraints,opts={})=>solve({geometry,constraints,
 sourceRevision:23,featureScaleMm:10,absoluteToleranceMm:1e-6,...opts});
const valid=result=>assert.deepEqual(validateSolveResult(result.solveResult).errors,[]);
function independentOld(points,constraints){
 const c=constraints.map(x=>({type:x.type,...x.data}));
 return legacy.analyze({points,constraints:c});
}
test('M2 true shared solve: 2D point coordinates come only from constraint equations',()=>{
 const geometry=[pt('B',-900,300),pt('A',900,-300)];
 const constraints=[
  fixed('ax','A','x',0),fixed('ay','A','y',0),
  fixed('bx','B','x',30),fixed('by','B','y',20)
 ];
 const before=JSON.stringify({geometry,constraints});
 const r=run(geometry,constraints);
 assert.equal(r.status,'unique');valid(r);
 assert.equal(r.solveResult.status,'unique');
 assert.equal(r.solveResult.globallyUnique,true);
 assert.equal(r.solveResult.solutionCount,1);
 assert.equal(r.independentRank,4);assert.equal(r.degrees,0);
 assert.equal(r.solveResult.proofLevel,'analytic');
 assert.equal(r.solveResult.maxResidual,0);
 assert.deepEqual(r.solvedGeometry.map(p=>[p.id,p.data]),[
  ['A',{x:0,y:0}],['B',{x:30,y:20}]]);
 assert.equal(JSON.stringify({geometry,constraints}),before);
 assert.equal(r.readyForV5,false);
 assert.equal(r.sourceConfirmed,false);
});
test('M2 arbitrary multi-point equality graph propagates anchors without static answers',()=>{
 const geometry=[pt('C'),pt('B'),pt('A')];
 const constraints=[
  pair('AB','coincident','A','B'),pair('BC','horizontal','B','C'),
  pair('AC','vertical','A','C'),
  fixed('ax','A','x',13),fixed('ay','A','y',-7)
 ];
 const r=run(geometry,constraints);
 assert.equal(r.status,'unique');valid(r);
 assert.equal(r.independentRank,6);
 assert.deepEqual(r.solvedGeometry.map(p=>p.data),
  Array.from({length:3},()=>({x:13,y:-7})));
});
test('M2 unanchored translation freedom is continuous and not global unique',()=>{
 const geom=[pt('A'),pt('B')],constraints=[
  pair('AB','coincident','A','B'),fixed('ax','A','x',0)
 ];
 const r=run(geom,constraints);
 valid(r);assert.equal(r.status,'continuous');
 assert.equal(r.solveResult.globallyUnique,false);
 assert.equal(r.solveResult.solutionCount,null);
 assert.equal(r.degrees,1);assert.equal(r.independentRank,3);
 assert.deepEqual(r.solvedGeometry,[]);
});
test('M2 redundant equalities and anchors do not falsely increase independent rank',()=>{
 const geom=[pt('A'),pt('B')],constraints=[
  pair('AB','horizontal','A','B'),pair('BA','horizontal','B','A'),
  fixed('a1','A','x',1),fixed('a2','A','x',1)
 ];
 const r=run(geom,constraints);
 assert.equal(r.status,'continuous');assert.equal(r.independentRank,2);
 assert.equal(r.degrees,2);valid(r);
});
test('M2 independently proves widely contradictory anchored equality group has no solution',()=>{
 const geom=[pt('A'),pt('B')],constraints=[
  pair('AB','coincident','A','B'),
  fixed('ax','A','x',0),fixed('bx','B','x',3),
  fixed('ay','A','y',7),fixed('by','B','y',7)
 ];
 const r=run(geom,constraints);
 assert.equal(r.status,'none');assert.equal(r.solveResult.solutionCount,0);
 assert.equal(r.solveResult.globallyUnique,null);valid(r);
 assert.deepEqual(r.solvedGeometry,[]);
});
test('M2 near-equal but DISTINCT anchors do not become false exact unique proof',()=>{
 const r=run([pt('A')],[
  fixed('a','A','x',0),fixed('b','A','x',1e-8),fixed('y','A','y',2)
 ]);
 assert.equal(r.status,'undetermined');assert.equal(r.solveResult.proofLevel,'none');
 assert.equal(r.solveResult.globallyUnique,null);valid(r);
});
test('M2 translation near float-resolution threshold fails closed',()=>{
 const r=run([pt('A')],[
  fixed('x','A','x',1e12),fixed('y','A','y',0)
 ],{absoluteToleranceMm:1e-8});
 assert.equal(r.status,'undetermined');
 assert.equal(r.solvedGeometry.length,0);
});
test('M2 large origin with real 10mm conflicting anchors still rules out equality',()=>{
 const r=run([pt('A')],[
  fixed('x1','A','x',1e12),fixed('x2','A','x',1e12+10)
 ],{absoluteToleranceMm:0.01});
 assert.equal(r.status,'none');valid(r);
});
test('M2 full rank and DOF agree with independent old affine oracle on exact classes',()=>{
 const cases=[
  {geom:[pt('A')],cs:[fixed('ax','A','x',4),fixed('ay','A','y',6)]},
  {geom:[pt('A'),pt('B')],cs:[pair('h','horizontal','A','B')]},
  {geom:[pt('A'),pt('B')],cs:[
   pair('c','coincident','A','B'),fixed('ax','A','x',5),
   fixed('ay','A','y',-5)]},
  {geom:[pt('A'),pt('B'),pt('C')],cs:[
   pair('ab','coincident','A','B'),pair('bc','vertical','B','C'),
   fixed('ax','A','x',2)]}
 ];
 for(const c of cases){
  const r=run(c.geom,c.cs),old=independentOld(c.geom.map(p=>p.id),c.cs);
  assert.equal(r.independentRank,old.rank);
  assert.equal(r.degrees,old.degrees);
  assert.equal(r.status,old.status);
  valid(r);
 }
});
test('M2 permutation invariance and typed finite model-mm boundaries',()=>{
 const geometry=[pt('B'),pt('A')],constraints=[
  pair('ab','coincident','A','B'),fixed('x','A','x',3),
  fixed('y','B','y',5)
 ];
 const a=run(geometry,constraints);
 const b=run([...geometry].reverse(),[...constraints].reverse());
 assert.deepEqual(a.solvedGeometry,b.solvedGeometry);
 assert.deepEqual(a.solveResult.solutions,b.solveResult.solutions);
 assert.throws(()=>run([{...pt('A'),unit:'px'}],[fixed('x','A','x',0)]),/model-mm|unit/);
 assert.throws(()=>run([pt('A')],[{...fixed('x','A','x',0),
  scope:'multi-point-2d-local-jacobian'}]),/only typed/);
 assert.throws(()=>run(Array.from({length:33},(_,i)=>pt('P'+i)),
  [fixed('x','P0','x',0)]),/bounded/);
 assert.throws(()=>run([pt('A')],[fixed('x','A','x',0)],
  {sourceRevision:-1}),/revision/);
 assert.throws(()=>run([pt('A')],[fixed('x','A','x',0)],
  {featureScaleMm:0}),/characteristicScale/);
});
