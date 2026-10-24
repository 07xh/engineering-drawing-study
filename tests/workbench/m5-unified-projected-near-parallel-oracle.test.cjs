'use strict';
/** Independent M1 sign oracle for M5 model-mm paper event graph ambiguity.
 * Test cases are topology invariants, not pre-certified engineering styles. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditNearParallelPaperSources:classify}=
 require('../../workbench/m5-unified-projected-feature-events.cjs');
const {analyzeSegmentTopology}=require('../../core/geometry/segment-topology2d.cjs');
const p=(u,v)=>({u,v});
const edge=(a,b)=>({from2D:p(...a),to2D:p(...b)});
const relation=(a,b)=>classify(a,b).relation;
const e=(a,b)=>({frame:'model-mm-2d',unit:'mm',
 from:{x:a[0],y:a[1]},to:{x:b[0],y:b[1]}});
test('real interior crossing with 1e-13 near-parallel slopes must not vanish as parallel',()=>{
 const a=edge([0,0],[1e8,1e8]);
 const b=edge([0,1e-5],[1e8,1e8-1e-5]);
 const det=(a.to2D.u-a.from2D.u)*(b.to2D.v-b.from2D.v)-
  (a.to2D.v-a.from2D.v)*(b.to2D.u-b.from2D.u);
 const len=Math.hypot(1e8,1e8);
 assert.ok(Math.abs(det)<1e-10*len*len,
  'old M5 Float64 threshold would label real crossing as parallel');
 assert.equal(relation(a,b),'proper-crossing');
 assert.equal(relation(edge([1e8,1e8],[0,0]),b),'proper-crossing');
 assert.equal(relation(b,a),'proper-crossing');
});
test('distinct offset but nearly coincident projected lines are NEVER duplicate strokes',()=>{
 const a=edge([0,0],[1e8,1e8]);
 const b=edge([0,0.00001],[1e8,1e8+0.00001]);
 assert.equal(relation(a,b),'disjoint');
 assert.equal(relation(b,a),'disjoint');
});
test('genuine exactly collinear overlap, reversal, T junction, endpoint join and disjoint are distinguished',()=>{
 const main=edge([0,0],[10,10]);
 assert.equal(relation(main,edge([2,2],[8,8])),'collinear-overlap');
 assert.equal(relation(main,edge([8,8],[2,2])),'collinear-overlap');
 const shared=edge([10,10],[20,20]);
 assert.equal(relation(main,shared),'endpoint-touch');
 assert.deepEqual(classify(main,shared).intersectionPoint,{x:10,y:10});
 assert.equal(relation(main,edge([5,5],[5,8])),'endpoint-touch');
 assert.equal(relation(main,edge([0,2],[10,12])),'disjoint');
 assert.equal(relation(main,edge([0,10],[10,0])),'proper-crossing');
});
test('exact independent integer cross-product oracle and translation/scale covariance',()=>{
 const cases=[
  {a:[[0,0],[10,10]],b:[[0,10],[10,0]],expected:'proper-crossing'},
  {a:[[0,0],[10,0]],b:[[10,0],[12,9]],expected:'endpoint-touch'},
  {a:[[0,0],[10,0]],b:[[3,0],[8,0]],expected:'collinear-overlap'},
  {a:[[0,0],[10,0]],b:[[0,3],[10,3]],expected:'disjoint'}];
 for(const tc of cases){
  const cross=(a,b,c)=>BigInt(b[0]-a[0])*BigInt(c[1]-a[1])-
   BigInt(b[1]-a[1])*BigInt(c[0]-a[0]);
  if(tc.expected==='proper-crossing'){
   assert.ok(cross(...tc.a,tc.b[0])*cross(...tc.a,tc.b[1])<0n);
   assert.ok(cross(...tc.b,tc.a[0])*cross(...tc.b,tc.a[1])<0n);
  }
  for(const k of [1,4,64]){
   const tr=x=>[x[0]*k+256,x[1]*k-512];
   const [a0,a1]=tc.a.map(tr),[b0,b1]=tc.b.map(tr);
   assert.equal(relation(edge(a0,a1),edge(b0,b1)),tc.expected);
   assert.equal(analyzeSegmentTopology({first:e(a0,a1),
    second:e(b0,b1)}).relation,tc.expected);
  }
 }
});
test('M1 model unit and degenerate paper segments still reject rather than infer V5',()=>{
 const source=edge([0,0],[4,4]);
 assert.throws(()=>classify(source,edge([2,2],[2,2])),/degenerate/);
 assert.throws(()=>classify(source,edge([2,NaN],[5,5])),/finite/);
});
