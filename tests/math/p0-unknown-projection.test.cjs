'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../../core/contracts');
const A=require('../../core/adapters');
const P=require('../../core/projection/conventions.js');

const unknown=()=>({id:'P',kind:'point',space:'model-3d',unit:'mm'});
const projection=(id,plane,value)=>({id,scope:'point-3d-linear',type:'projection',
 targetIds:['P'],data:{plane,value},source:'given'});
const H=()=>projection('h','H',[15,10]);
const V=()=>projection('v','V',[15,12]);
const W=()=>projection('w','W',[10,12]);
const problem=(constraints=[H(),V()])=>({
 schemaVersion:C.SCHEMA_VERSION,id:'pre-solve-03',title:'Synthetic unknown A',
 type:'point-projection',source:{kind:'generated',generatorId:'DA03'},
 status:'source-verified',givens:[],unknowns:[unknown()],geometry:[],
 constraints,solveResults:[],steps:[],renderMode:'constraint-engine'
});

test('P0 unknown point is declared without any coordinates or fake known geometry',()=>{
 const p=problem();
 assert.deepEqual(C.validateProblem(p),{ok:true,errors:[]});
 assert.equal(p.geometry.length,0);
 assert.equal(Object.hasOwn(p.unknowns[0],'data'),false);
});

test('unknown may not smuggle a fabricated point, solution or undeclared attributes',()=>{
 for(const inserted of [
  {data:{x:0,y:0,z:0}}, {x:0}, {solution:{x:15,y:10,z:12}},
  {space:'drawing-2d',data:{x:0,y:0}}, {unit:'pixels'}
 ])assert.equal(C.validateProblem({...problem(),
  unknowns:[{...unknown(),...inserted}]}).ok,false,JSON.stringify(inserted));
});

test('duplicate pending ids, known geometry collisions and missing target refs are rejected',()=>{
 const p=problem();
 assert.equal(C.validateProblem({...p,unknowns:[unknown(),unknown()]}).ok,false);
 assert.equal(C.validateProblem({...p,geometry:[{id:'P',kind:'point',
  space:'model-3d',unit:'mm',data:{x:15,y:10,z:12}}]}).ok,false);
 assert.equal(C.validateProblem({...p,unknowns:[]}).ok,false);
 assert.equal(C.validateProblem({...p,unknowns:{id:'P'}}).ok,false);
});

test('all three independent pairs of known projections produce real xyz coordinates',()=>{
 for(const selected of [[V(),H()],[V(),W()],[H(),W()]]){
  const p=problem(selected),out=A.solvePendingPoint(p,'P');
  assert.equal(out.status,'unique');
  assert.deepEqual(out.candidateGeometry.data,{x:15,y:10,z:12});
  assert.equal(out.result.solutionCount,1);
  assert.equal(out.result.globallyUnique,true);
  assert.equal(out.result.scope,'point-3d-linear');
  assert.deepEqual(p.unknowns,[unknown()]);
  assert.deepEqual(p.geometry,[]);
  const final=A.completePendingPoint(p,'P');
  assert.equal(C.validateProblem(final.problem).ok,true);
  assert.deepEqual(final.problem.unknowns,[]);
  assert.deepEqual(final.problem.geometry[0].data,{x:15,y:10,z:12});
  assert.equal(final.problem.solveResults.length,1);
  assert.notStrictEqual(final.problem,p);
 }
});

test('one view and no constraints remain underdetermined, never materialize guessed coords',()=>{
 for(const constraints of [[],[H()]]){
  const p=problem(constraints),out=A.solvePendingPoint(p,'P');
  assert.equal(out.status,'continuous');
  assert.equal(out.candidateGeometry,null);
  assert.throws(()=>A.completePendingPoint(p,'P'),/尚无经过数学验证的唯一解/);
 }
});

test('contradictory V/H x coordinates return none and remain without any Geometry',()=>{
 const p=problem([V(),projection('badH','H',[16,10])]);
 assert.equal(C.validateProblem(p).ok,true);
 const out=A.solvePendingPoint(p,'P');
 assert.equal(out.status,'none');
 assert.equal(out.candidateGeometry,null);
 assert.throws(()=>A.completePendingPoint(p,'P'));
 assert.equal(p.geometry.length,0);
});

test('a three-dimensional pending point cannot be fed a two-dimensional constraint',()=>{
 const p=problem([{id:'bad',scope:'point-2d-linear',type:'coordinate',
  targetIds:['P'],data:{axis:'x',value:15},source:'given'}]);
 assert.equal(C.validateProblem(p).ok,true);
 assert.throws(()=>A.solvePendingPoint(p,'P'),/维度不一致/);
});

test('solve gate refuses unknown target not in Problem, or duplicate result id',()=>{
 const p=problem();
 assert.throws(()=>A.solvePendingPoint(p,'Other'));
 assert.throws(()=>A.solvePendingPoint({...p,solveResults:[{
  ...A.solvePendingPoint(p,'P').result
 }]},'P'),/编号重复/);
});

test('P0: 1e12 model coordinate with 10mm conflicting V/H x must not align',()=>{
 const views={V:{u:1e12,v:12},H:{u:1e12+10,v:10},W:{u:10,v:12}};
 assert.equal(P.aligned(views).sameX,false);
 assert.equal(P.aligned(views).sameHeight,true);
 assert.equal(P.aligned(views).sameDepth,true);
 const solution=A.solve({scope:'point-3d-linear',constraints:[
  projection('v','V',[1e12,12]),projection('h','H',[1e12+10,10])]});
 assert.equal(solution.status,'none');
});

test('projection comparison tolerance has absolute unit semantics, not relative magnitude',()=>{
 const views=P.project({x:10,y:20,z:30});
 assert.deepEqual(P.aligned(views),{sameX:true,sameHeight:true,sameDepth:true});
 assert.equal(P.aligned({...views,H:{u:10+2e-8,v:20}}).sameX,false);
 assert.equal(P.aligned({...views,H:{u:10+2e-8,v:20}},1e-7).sameX,true);
 assert.throws(()=>P.aligned(views,-1));
});

test('P1: extreme finite coordinates and scales cannot silently yield Infinity pixels',()=>{
 const p={x:1e308,y:1e308,z:1e308};
 const config={origin:{x:5,y:5},scale:10};
 assert.throws(()=>P.sheetPoint(p,config),/溢出/);
 assert.throws(()=>P.toSheet('H',{u:1e308,v:2},config),/溢出/);
 assert.throws(()=>P.fromSheet('V',{x:-1e308,y:0},
  {origin:{x:1e308,y:0},scale:1}),/溢出/);
});

test('negative/zero model coordinates retain first-angle inverse mapping',()=>{
 const origin={x:100,y:100},scale=2;
 const point={x:-15,y:0,z:-12};
 for(const name of P.VIEWS){
  const projected=P.project(point)[name];
  assert.deepEqual(P.fromSheet(name,P.toSheet(name,projected,{origin,scale}),
    {origin,scale}),projected);
 }
});
