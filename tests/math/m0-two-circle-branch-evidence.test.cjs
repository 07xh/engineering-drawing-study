'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {classifyTwoCircleLoci:solve}=
 require('../../core/constraints/two-circle-branch-evidence.cjs');
const C=(id,x,y,radiusMm)=>({id,center:{x,y},radiusMm});
const pair=(a,b)=>solve({first:a,second:b,revision:41});
test('strict two-circle radical-axis classification finds exactly two algebraic branches independent of seed order',()=>{
 const a=C('FixedA',0,0,3),b=C('FixedB',4,0,3);
 const e=pair(a,b);
 assert.equal(e.status,'two-separated-roots');
 assert.equal(e.branchCount,2);
 assert.equal(e.exhaustiveAlgebraicTopologyWithinTwoLoci,true);
 assert.equal(e.globalConstraintSystemVerified,false);
 assert.equal(e.v5Ready,false);
 const ys=e.branches.map(x=>x.pointModelMm.y);
 assert.ok(ys[0]*ys[1]<0);
 assert.ok(ys.every(y=>Math.abs(Math.abs(y)-Math.sqrt(5))<1e-9));
 assert.ok(e.branches.every(x=>x.maxAbsResidualMm<e.boundaryGuardMm));
 const rev=pair(b,a);
 assert.equal(rev.branchCount,2);
 assert.deepEqual(rev.branches.map(x=>x.pointModelMm),e.branches.map(x=>x.pointModelMm));
 assert.ok(Object.isFrozen(e.branches[0].circleResidualsMm));
});
test('generic shifted/rotated centers retain branch count without special graph vertex IDs',()=>{
 const e=pair(C('One',12,7,5),C('Two',16,10,4));
 assert.equal(e.status,'two-separated-roots');
 assert.equal(e.branchCount,2);
 for(const item of e.branches){
  const p=item.pointModelMm;
  assert.ok(Math.abs(Math.hypot(p.x-12,p.y-7)-5)<1e-8);
  assert.ok(Math.abs(Math.hypot(p.x-16,p.y-10)-4)<1e-8);
 }
});
test('strict external and internal separations are no-root cases, not missed seed solutions',()=>{
 for(const e of [
  pair(C('A',0,0,2),C('B',10,0,3)),
  pair(C('A',0,0,8),C('B',1,0,2)),
  pair(C('A',0,0,2),C('B',0,0,3))
 ]){
  assert.equal(e.status,'strictly-disjoint');
  assert.equal(e.branchCount,0);
  assert.equal(e.exhaustiveAlgebraicTopologyWithinTwoLoci,true);
  assert.deepEqual(e.branches,[]);
 }
});
test('identical circles form continuum; coincident root cardinality is never forged to two',()=>{
 const e=pair(C('Left',5,9,3),C('Right',5,9,3));
 assert.equal(e.status,'coincident-continuum');
 assert.equal(e.branchCount,null);
 assert.equal(e.exhaustiveAlgebraicTopologyWithinTwoLoci,true);
 assert.equal(e.v5Ready,false);
});
test('exact and near tangencies, almost coincident centers stay undetermined',()=>{
 for(const e of [
  pair(C('A',0,0,2),C('B',5,0,3)),
  pair(C('A',0,0,5),C('B',2,0,3)),
  pair(C('A',0,0,2),C('B',5+1e-9,0,3)),
  pair(C('A',0,0,2),C('B',5-1e-9,0,3)),
  pair(C('A',0,0,5),C('B',1e-11,0,5)),
 ]){
  assert.equal(e.status,'undetermined');
  assert.equal(e.exhaustiveAlgebraicTopologyWithinTwoLoci,false);
  assert.equal(e.branchCount,null);
  assert.deepEqual(e.branches,[]);
 }
});
test('invalid coordinates, radii, source identity and stale revision are refused',()=>{
 const a=C('A',0,0,3),b=C('B',4,0,3);
 const invalid=[
  {first:a,second:a,revision:1},
  {first:{...a,radiusMm:0},second:b,revision:1},
  {first:{...a,radiusMm:Infinity},second:b,revision:1},
  {first:{...a,center:{x:0,y:0,z:0}},second:b,revision:1},
  {first:{...a,verified:true},second:b,revision:1},
  {first:a,second:{...b,center:{x:1e20,y:0}},revision:1},
  {first:a,second:b,revision:-1},
 ];
 for(const p of invalid)assert.throws(()=>solve(p));
});
