'use strict';
// Independent geometry-equation oracles for reusable planar drawing patterns.
// These are mathematical fixtures, not claims of blind textbook acceptance.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {solveLinearPointSystem:solve}=require('../../core/constraints/linear-point-global-solver.cjs');
const point=id=>({id,kind:'point',space:'drawing-2d',unit:'mm',data:{x:999,y:-999}});
const fix=(id,p,axis,value)=>({id,scope:'multi-point-2d-linear',type:'fixed',source:'given',targetIds:[p],data:{point:p,axis,value}});
const relation=(id,type,a,b)=>({id,scope:'multi-point-2d-linear',type,source:'given',targetIds:[a,b],data:{a,b}});
function run(ids,cs){return solve({geometry:ids.map(point),constraints:cs,sourceRevision:1,featureScaleMm:40,absoluteToleranceMm:1e-6});}
function coords(result){return Object.fromEntries(result.solvedGeometry.map(p=>[p.id,p.data]));}
function assertEquations(result,cs){
 const p=coords(result);
 for(const c of cs){
  const d=c.data;
  if(c.type==='fixed')assert.equal(p[d.point][d.axis],d.value);
  if(c.type==='horizontal')assert.equal(p[d.a].y,p[d.b].y);
  if(c.type==='vertical')assert.equal(p[d.a].x,p[d.b].x);
  if(c.type==='coincident')assert.deepEqual(p[d.a],p[d.b]);
 }
}
test('M2 independent rectangle corners: four-point orthogonal projection equations',()=>{
 const cs=[
  fix('ax','A','x',0),fix('ay','A','y',0),
  fix('bx','B','x',40),fix('dy','D','y',20),
  relation('ab','horizontal','A','B'),
  relation('bc','vertical','B','C'),
  relation('cd','horizontal','C','D'),
  relation('da','vertical','D','A')
 ];
 const r=run(['D','B','A','C'],cs);
 assert.equal(r.status,'unique');assert.equal(r.independentRank,8);
 assert.deepEqual(coords(r),{A:{x:0,y:0},B:{x:40,y:0},C:{x:40,y:20},D:{x:0,y:20}});
 assertEquations(r,cs);
 assert.equal(r.readyForV5,false);
});
test('M2 three-view alignment graph: independent anchors propagate only shared coordinates',()=>{
 const cs=[
  fix('vx','V','x',12),fix('vy','V','y',30),
  fix('hy','H','y',-8),fix('wx','W','x',-16),
  relation('vh','vertical','V','H'),
  relation('vw','horizontal','V','W')
 ];
 const r=run(['W','V','H'],cs);
 assert.equal(r.status,'unique');assert.equal(r.independentRank,6);
 assert.deepEqual(coords(r),{H:{x:12,y:-8},V:{x:12,y:30},W:{x:-16,y:30}});
 assertEquations(r,cs);
});
test('M2 rectangle with unspecified width has a continuous family, never a fabricated answer',()=>{
 const cs=[
  fix('ax','A','x',0),fix('ay','A','y',0),
  fix('dy','D','y',20),
  relation('ab','horizontal','A','B'),relation('bc','vertical','B','C'),
  relation('cd','horizontal','C','D'),relation('da','vertical','D','A')
 ];
 const r=run(['A','B','C','D'],cs);
 assert.equal(r.status,'continuous');assert.equal(r.degrees,1);
 assert.equal(r.solveResult.globallyUnique,false);
 assert.deepEqual(r.solvedGeometry,[]);
});
test('M2 degenerate zero-width rectangle: equalities may be consistent without nondegenerate topology proof',()=>{
 const cs=[
  fix('ax','A','x',0),fix('ay','A','y',0),
  fix('bx','B','x',0),fix('dy','D','y',20),
  relation('ab','horizontal','A','B'),relation('bc','vertical','B','C'),
  relation('cd','horizontal','C','D'),relation('da','vertical','D','A')
 ];
 const r=run(['A','B','C','D'],cs);
 assert.equal(r.status,'unique');assertEquations(r,cs);
 assert.equal(coords(r).A.x,coords(r).B.x);
 assert.equal(r.readyForV5,false,'coordinate uniqueness does not certify a valid rectangle topology');
});
test('M2 contradictory horizontal and fixed ordinate is provably impossible',()=>{
 const cs=[fix('ay','A','y',0),fix('by','B','y',5),relation('ab','horizontal','A','B')];
 const r=run(['A','B'],cs);
 assert.equal(r.status,'none');assert.equal(r.solveResult.solutionCount,0);
 assert.deepEqual(r.solvedGeometry,[]);
});
test('M2 two disjoint anchored components with one unanchored ordinate remain underconstrained',()=>{
 const cs=[fix('ax','A','x',0),fix('ay','A','y',0),
  fix('bx','B','x',15),relation('ab','horizontal','A','B'),
  fix('cx','C','x',25)];
 const r=run(['A','B','C'],cs);
 assert.equal(r.status,'continuous');assert.equal(r.degrees,1);
 assert.deepEqual(r.solvedGeometry,[]);
});
