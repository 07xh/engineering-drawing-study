'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {analyzeLinearPointConstraints:analyze}=
 require('../../core/constraints/linear-point-local-evidence.cjs');
const point=(id,x=0,y=0)=>({id,kind:'point',space:'drawing-2d',unit:'mm',data:{x,y}});
const fixed=(id,p,axis,value)=>({id,scope:'multi-point-2d-linear',
 type:'fixed',targetIds:[p],data:{point:p,axis,value},source:'given'});
const pair=(id,type,a,b)=>({id,scope:'multi-point-2d-linear',
 type,targetIds:[a,b],data:{a,b},source:'given'});
const run=(geometry,constraints,opt={})=>analyze({geometry,constraints,
 sourceRevision:12,featureScaleMm:10,absoluteToleranceMm:1e-6,...opt});
test('M2 real four independent fixed coordinates yield full LOCAL rank, not uniqueness proof',()=>{
 const g=[point('A'),point('B',2,3)];
 const c=[fixed('a1','A','x',0),fixed('a2','A','y',0),
  fixed('b1','B','x',2),fixed('b2','B','y',3)];
 const r=run(g,c);
 assert.equal(r.status,'local-numeric-evidence');
 assert.equal(r.equationCount,4);assert.equal(r.rankEstimate,4);
 assert.equal(r.localDegreesEstimate,0);assert.equal(r.atProvidedConfiguration,true);
 assert.equal(r.globallyUnique,null);assert.equal(r.proofOfGlobalUniqueness,false);
 assert.equal(r.proofOfExistence,false);
 assert.ok(Object.isFrozen(r));assert.ok(Object.isFrozen(r.variableIds));
});
test('M2 duplicate fixed x constraints do not add independent rank',()=>{
 const r=run([point('P')],[fixed('x1','P','x',0),fixed('x2','P','x',0)]);
 assert.equal(r.rankEstimate,1);
 assert.equal(r.localDegreesEstimate,1);
 assert.equal(r.incidence.components.length,1);
});
test('M2 conflicting conditions at supplied configuration are NOT proof of global no-solution',()=>{
 const r=run([point('P')],[fixed('x1','P','x',0),fixed('x2','P','x',1)]);
 assert.equal(r.status,'configuration-residual-failed');
 assert.equal(r.atProvidedConfiguration,false);
 assert.equal(r.proofOfNonexistence,false);
 assert.equal(r.globallyUnique,null);
});
test('M2 genuine coincident constraint contributes two analytic equation rows',()=>{
 const r=run([point('A',0,0),point('B',0,0)],
 [fixed('fx','A','x',0),fixed('fy','A','y',0),pair('ab','coincident','A','B')]);
 assert.equal(r.equationCount,4);
 assert.equal(r.rankEstimate,4);assert.equal(r.localDegreesEstimate,0);
 assert.equal(r.atProvidedConfiguration,true);
 assert.deepEqual(r.incidence.components[0].geometryIds,['A','B']);
});
test('M2 horizontal and vertical constraints differentiate axes',()=>{
 const r=run([point('A',0,0),point('B',0,0)],
  [pair('horizontal','horizontal','A','B'),pair('vertical','vertical','A','B')]);
 assert.equal(r.rankEstimate,2);assert.equal(r.localDegreesEstimate,2);
 assert.equal(r.atProvidedConfiguration,true);
});
test('M2 local residual keeps 10mm model conflict at large absolute coordinate',()=>{
 const r=run([point('A',1e12,0)],
  [fixed('f','A','x',1e12+10)],{absoluteToleranceMm:0.01});
 assert.equal(r.status,'configuration-residual-failed');
 assert.equal(r.proofOfNonexistence,false);
});
test('M2 reject source frame px, unsupported nonlinear constraints and unit mismatch',()=>{
 assert.throws(()=>run([{...point('A'),unit:'unitless'}],[fixed('f','A','x',0)]));
 assert.throws(()=>run([{...point('A'),space:'model-3d'}],[fixed('f','A','x',0)]));
 const nonlinear={id:'d',scope:'multi-point-2d-local-jacobian',
  type:'distance',targetIds:['A','B'],data:{a:'A',b:'B',value:2},source:'given'};
 assert.throws(()=>run([point('A'),point('B')],[nonlinear]),/only analytic/);
});
test('M2 bounded variable count, bad revisions and unresolvable floating precision fail closed',()=>{
 assert.throws(()=>run(Array.from({length:33},(_,i)=>point('P'+i)),[fixed('f','P0','x',0)]),/bounded/);
 assert.throws(()=>run([point('P')],[fixed('f','P','x',0)],{sourceRevision:-1}),/revision/);
 assert.throws(()=>run([point('P',1e12)],[fixed('f','P','x',1e12)],
  {absoluteToleranceMm:1e-8}),/resolution/);
});
test('M2 normalized rank and checked residual are independent of input geometry order',()=>{
 const g=[point('A'),point('B',3,4)];
 const cs=[pair('a','horizontal','A','B'),fixed('b','A','x',0)];
 const a=run(g,cs),b=run([g[1],g[0]],cs);
 assert.equal(a.rankEstimate,b.rankEstimate);assert.equal(a.localDegreesEstimate,b.localDegreesEstimate);
 assert.deepEqual(a.normalizedResiduals,b.normalizedResiduals);
});
