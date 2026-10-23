'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {solve}=require('../../core/adapters/legacy-solvers.js');
const {validateSolveResult}=require('../../core/contracts/solve-result.js');
const p=id=>({id,kind:'point',space:'drawing-2d',unit:'mm',data:{x:900,y:-900}});
const fixed=(id,point,axis,value)=>({
 id,scope:'multi-point-2d-linear',type:'fixed',source:'given',
 targetIds:[point],data:{point,axis,value}
});
const pair=(id,type,a,b)=>({
 id,scope:'multi-point-2d-linear',type,source:'given',
 targetIds:[a,b],data:{a,b}
});
const run=(geometry,constraints,options={})=>solve({
 scope:'multi-point-2d-linear',geometry,constraints,
 sourceRevision:18,featureScaleMm:20,absoluteToleranceMm:1e-6,
 ...options
});
test('existing shared solve API dispatches typed M2 to real coordinate solver',()=>{
 const constraints=[pair('ab','coincident','A','B'),
  fixed('ax','A','x',7),fixed('by','B','y',-6)];
 const result=run([p('A'),p('B')],constraints);
 assert.equal(validateSolveResult(result).ok,true);
 assert.equal(result.status,'unique');
 assert.equal(result.scope,'multi-point-2d-linear');
 assert.equal(result.mathEvidenceScope,'m2/planar-linear-coordinate-equalities');
 assert.equal(result.solverId,'core-m2-planar-affine');
 assert.equal(result.globallyUnique,true);
 assert.equal(result.sourceRevision,18);
 assert.equal(result.sourceConfirmed,false);
 assert.equal(result.readyForV5,false);
 assert.deepEqual(result.computedGeometry.map(x=>x.data),
  [{x:7,y:-6},{x:7,y:-6}]);
 assert.equal(result.maxResidual,0);
});
test('typed shared solve preserves mathematically meaningful DOF and contradiction',()=>{
 const uncertain=run([p('A'),p('B')],[
  pair('ab','horizontal','A','B'),fixed('ax','A','x',1)]);
 assert.equal(uncertain.status,'continuous');
 assert.equal(uncertain.degrees,2);
 assert.equal(uncertain.globallyUnique,false);
 assert.deepEqual(uncertain.computedGeometry,[]);
 const none=run([p('A')],[
  fixed('x1','A','x',0),fixed('x2','A','x',12)]);
 assert.equal(none.status,'none');
 assert.equal(none.globallyUnique,null);
 assert.deepEqual(none.solutions,[]);
});
test('typed shared solve does not accept an injected proof flag or arbitrary source revision',()=>{
 const geometry=[p('A')],constraints=[
  fixed('x','A','x',1),fixed('y','A','y',2)];
 assert.throws(()=>run(geometry,constraints,{verified:true}),/unrecognized/);
 assert.throws(()=>run(geometry,constraints,{sourceRevision:-1}),/sourceRevision/);
 assert.throws(()=>run(geometry,constraints,{absoluteToleranceMm:0,relativeTolerance:0}),/tolerance/);
});
test('old request without typed geometry keeps the legacy independent solver path',()=>{
 const conditions=[fixed('ax','A','x',7),fixed('ay','A','y',9)];
 const old=solve({scope:'multi-point-2d-linear',points:['A'],constraints:conditions});
 assert.equal(old.solverId,'legacy-multi-point');
 assert.equal(old.status,'unique');
 assert.deepEqual(old.solutions,[],'legacy count-only path must not fabricate coordinates');
 assert.equal(old.computedGeometry,undefined);
 assert.equal(validateSolveResult(old).ok,true);
});
