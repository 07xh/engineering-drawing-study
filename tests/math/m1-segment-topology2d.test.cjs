'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {analyzeSegmentTopology:analyze}=require('../../core/geometry/segment-topology2d.cjs');
const seg=(a,b,overrides={})=>({frame:'model-mm-2d',unit:'mm',from:{x:a[0],y:a[1]},to:{x:b[0],y:b[1]},...overrides});
const check=(a,b)=>analyze({first:a,second:b});
test('M1 proper crossing has exact topology without fabricated intersection point',()=>{
 const r=check(seg([0,0],[6,6]),seg([0,6],[6,0]));
 assert.equal(r.relation,'proper-crossing');assert.equal(r.intersects,true);
 assert.equal(r.intersectionPoint,null);assert.equal(r.computesProperCrossingCoordinates,false);
 assert.equal(r.globallyUnique,null);assert.ok(Object.isFrozen(r));
});
test('M1 endpoint touch, T junction and noncontact',()=>{
 assert.deepEqual(check(seg([0,0],[2,0]),seg([2,0],[3,1])).intersectionPoint,{x:2,y:0});
 assert.equal(check(seg([0,0],[4,0]),seg([2,-2],[2,0])).relation,'endpoint-touch');
 assert.equal(check(seg([0,0],[1,0]),seg([2,0],[3,0])).relation,'disjoint');
});
test('M1 non-collinear disjoint lines and subnormal near misses',()=>{
 assert.equal(check(seg([0,0],[1,1]),seg([2,0],[3,1])).relation,'disjoint');
 assert.equal(check(seg([0,0],[4,0]),seg([2,Number.MIN_VALUE],[3,Number.MIN_VALUE])).relation,'disjoint');
});
test('M1 exact collinear partial, coincident, nested, vertical overlaps',()=>{
 const a=seg([0,0],[10,10]),b=seg([5,5],[12,12]);
 const r=check(a,b);assert.equal(r.relation,'collinear-overlap');
 assert.deepEqual(r.overlap,{from:{x:5,y:5},to:{x:10,y:10}});
 assert.equal(check(a,seg([10,10],[0,0])).relation,'coincident');
 assert.equal(check(seg([2,2],[4,4]),a).relation,'collinear-overlap');
 assert.deepEqual(check(seg([2,10],[2,-4]),seg([2,-2],[2,12])).overlap,
  {from:{x:2,y:-2},to:{x:2,y:10}});
});
test('M1 subnormal crossing avoids determinant underflow',()=>{
 const m=Number.MIN_VALUE;
 assert.equal(check(seg([0,0],[m,m]),seg([0,m],[m,0])).relation,'proper-crossing');
});
test('M1 permutation and reversal symmetry on 256 deterministic integer cases',()=>{
 let state=123456789;function rand(){state=(Math.imul(state,1664525)+1013904223)>>>0;return state%51-25;}
 for(let i=0;i<256;i++){
  const a=[rand(),rand()],b=[rand(),rand()],c=[rand(),rand()],d=[rand(),rand()];
  if(a[0]===b[0]&&a[1]===b[1]||c[0]===d[0]&&c[1]===d[1])continue;
  const v=check(seg(a,b),seg(c,d)).relation;
  assert.equal(check(seg(c,d),seg(a,b)).relation,v);
  assert.equal(check(seg(b,a),seg(d,c)).relation,v);
 }
});
test('M1 rejects pixel/missing units, degenerate and nonfinite inputs',()=>{
 const good=seg([0,0],[1,0]);
 for(const bad of [seg([0,0],[1,0],{unit:'px'}),seg([0,0],[1,0],{frame:'original-image-px'}),
  seg([1,1],[1,1]),seg([0,0],[Infinity,2]),seg([0,0],[NaN,0]),
  {...good,from:[0,0]},{...good,to:{x:'1',y:0}},null]){
  assert.throws(()=>check(good,bad));assert.throws(()=>check(bad,good));
 }
});
test('M1 point snapshots do not reread mutable getters',()=>{
 const a=seg([0,0],[2,2]);let n=0;
 Object.defineProperty(a.to,'x',{get(){return ++n===1?2:Infinity;}});
 assert.equal(check(a,seg([0,2],[2,0])).relation,'proper-crossing');assert.equal(n,1);
});
