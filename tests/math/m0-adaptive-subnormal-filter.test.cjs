'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {orientation2DAdaptive:adaptive}=
 require('../../core/numeric/orientation2d-adaptive.cjs');
const {orientation2D:exact}=
 require('../../core/numeric/orientation2d-exact.cjs');
test('M0 refuses normal-range filter when nonzero product is subnormal',()=>{
 for(const s of [1e-160,1e-161,1e-170]){
  const a=[0,0],b=[s,0],c=[0,s];
  const observed=adaptive(a,b,c);
  assert.equal(observed.sign,exact(a,b,c).sign);
  assert.equal(observed.sign,1);
  assert.equal(observed.method,'exact-dyadic-fallback');
  assert.equal(adaptive(a,c,b).sign,-1);
 }
});
test('M0 zero from numerical underflow and nonzero subnormal coordinates use exact binary64 sign',()=>{
 const min=Number.MIN_VALUE;
 for(const s of [1e-200,1e-300,min]){
  const a=[0,0],b=[s,0],c=[0,s];
  const result=adaptive(a,b,c);
  assert.equal(result.method,'exact-dyadic-fallback');
  assert.equal(result.sign,exact(a,b,c).sign);
  assert.equal(result.sign,1);
 }
 const s=Number.MIN_VALUE;
 assert.equal(adaptive([0,0],[0,s],[s,0]).sign,-1);
});
test('M0 ordinary noncancelling coordinates remain a fast path with precise sign',()=>{
 for(const a of [[0,0],[1e-5,2e-5],[1e5,-2e5]]){
  const b=[a[0]+5,a[1]],c=[a[0],a[1]+4];
  const f=adaptive(a,b,c);
  assert.equal(f.method,'float64-filtered');
  assert.equal(f.sign,1);
  assert.equal(f.exactForBinary64Inputs,true);
 }
});
test('M0 independent randomized exponents agree with existing exact oracle near underflow boundary',()=>{
 let state=0x42568ced;
 const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
 let fallbacks=0;
 for(let i=0;i<500;i++){
  const exp=-130-(rand()%90);
  const s=10**exp;
  const x=(rand()%1000+1)*s,y=(rand()%1000+1)*s;
  const a=[0,0],b=[x,y],c=[y/2,-x/2];
  const q=adaptive(a,b,c);
  assert.equal(q.sign,exact(a,b,c).sign);
  assert.equal(q.exactForBinary64Inputs,true);
  if(q.method==='exact-dyadic-fallback')fallbacks++;
 }
 assert.ok(fallbacks>100);
});
test('M0 cancellation, true collinearity and local-only scope stay conservative',()=>{
 const n=2**52,a=[0,0],b=[n,n-1],c=[n-1,n-2];
 assert.equal(adaptive(a,b,c).sign,-1);
 assert.equal(adaptive([0,0],[1,1],[2,2]).sign,0);
 const r=adaptive([0,0],[1,0],[0,1]);
 assert.equal(Object.hasOwn(r,'globallyUnique'),false);
 assert.equal(Object.hasOwn(r,'intersectionPoint'),false);
});
