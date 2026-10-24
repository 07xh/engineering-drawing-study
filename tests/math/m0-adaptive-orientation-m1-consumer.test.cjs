'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {orientation2DAdaptive:adaptive}=
 require('../../core/numeric/orientation2d-adaptive.cjs');
const {orientation2D:exact}=
 require('../../core/numeric/orientation2d-exact.cjs');
const {analyzeSegmentTopology:segment}=
 require('../../core/geometry/segment-topology2d.cjs');
const sign=(a,b,c)=>adaptive(a,b,c).sign;
test('ordinary Float64 turns have a cached fast result with exact sign scope only',()=>{
 const a=adaptive([0,0],[6,0],[0,3]);
 assert.equal(a.sign,1);
 assert.equal(a.method,'float64-filtered');
 assert.equal(a.exactForBinary64Inputs,true);
 assert.ok(Object.isFrozen(a));
 assert.equal(adaptive([0,0],[0,3],[6,0]).sign,-1);
 assert.equal(adaptive([0,0],[6,0],[3,0]).sign,0);
 assert.equal(adaptive([0,0],[6,0],[3,0]).method,'exact-dyadic-fallback');
 assert.equal(Object.hasOwn(a,'proofOfIntersection'),false);
});
test('catastrophic 2^52 cancellation never becomes false collinearity',()=>{
 const n=2**52,a=[0,0],b=[n,n-1],c=[n-1,n-2];
 assert.equal((b[0]*c[1]-b[1]*c[0]),0);
 const actual=adaptive(a,b,c);
 assert.equal(actual.sign,-1);
 assert.equal(actual.method,'exact-dyadic-fallback');
 assert.equal(sign(a,c,b),1);
});
test('subnormal and overflow coordinate combinations use exact dyadic fallback',()=>{
 const m=Number.MIN_VALUE;
 const a=adaptive([0,0],[m,0],[0,m]);
 assert.equal(a.sign,1);assert.equal(a.method,'exact-dyadic-fallback');
 const b=adaptive([1e308,0],[-1e308,1],[0,3]);
 assert.equal(b.sign,-1);assert.equal(b.method,'exact-dyadic-fallback');
 assert.equal(sign([0,0],[2,2],[4,4]),0);
});
test('2048 deterministic varied real Float64 triples match independent exact binary64 oracle',()=>{
 let seed=0x523812fa;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 const sample=()=>{const n=next();return ((n%1000000)-500000)/Math.pow(2,(next()%25));};
 let fast=0,slow=0;
 for(let i=0;i<2048;i++){
  const a=[sample(),sample()],b=[sample(),sample()],c=[sample(),sample()];
  const r=adaptive(a,b,c);
  assert.equal(r.sign,exact(a,b,c).sign,'sample '+i);
  if(r.method==='float64-filtered')fast++;else slow++;
 }
 assert.ok(fast>500,'ordinary geometric cases should avoid unconditional BigInt');
 assert.ok(fast+slow===2048);
});
test('M1 unchanged proper/endpoint/collinear decisions with adaptive fast and slow cases',()=>{
 const s=(a,b)=>({frame:'model-mm-2d',unit:'mm',
  from:{x:a[0],y:a[1]},to:{x:b[0],y:b[1]}});
 assert.equal(segment({first:s([0,0],[6,6]),second:s([0,6],[6,0])}).relation,'proper-crossing');
 assert.equal(segment({first:s([0,0],[2,0]),second:s([2,0],[3,1])}).relation,'endpoint-touch');
 assert.equal(segment({first:s([0,0],[8,8]),second:s([4,4],[9,9])}).relation,'collinear-overlap');
 const m=Number.MIN_VALUE;
 assert.equal(segment({first:s([0,0],[m,m]),second:s([0,m],[m,0])}).relation,'proper-crossing');
});
test('source snapshot rejects malformed inputs and never re-reads getter-backed coordinate',()=>{
 for(const p of [null,[,1],[0,,],[0,Infinity],[NaN,0],[],{},new Float64Array([0,0])])
  assert.throws(()=>adaptive(p,[1,0],[0,1]),TypeError);
 const a=[0,0];let reads=0;
 Object.defineProperty(a,0,{get(){reads++;return reads===1?0:1e308;}});
 assert.equal(adaptive(a,[2,0],[0,2]).sign,1);
 assert.equal(reads,1);
});
