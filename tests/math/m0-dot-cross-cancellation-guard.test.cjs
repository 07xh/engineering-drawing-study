'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../../core/numeric/euclidean-kernel.cjs');
test('shared M0 dot never mistakes catastrophic binary64 cancellation for zero',()=>{
 const ε=2**-53;
 // Exact represented-value dot: 1 + epsilon - 1 = epsilon.
 // Old left-to-right IEEE-754 accumulator: 1+epsilon rounds 1 => 0.
 assert.equal(1+ε-1,0);
 assert.equal(m.dot([1,1,1],[1,ε,-1]),0);
 const plus=m.certifyDotSign([1,1,1],[1,ε,-1]);
 const minus=m.certifyDotSign([1,1,1],[-1,-ε,1]);
 assert.equal(plus.rounded,0);assert.equal(plus.sign,1);
 assert.equal(minus.rounded,0);assert.equal(minus.sign,-1);
 assert.equal(plus.method,'exact-dyadic-fallback');
 assert.equal(plus.signMatchesRounded,false);
 assert.equal(plus.officialLineStyleVerified,false);
 assert.equal(plus.v5Ready,false);
 assert.equal(minus.signMatchesRounded,false);
 assert.equal(m.dot([1,1,1],[1,-1,0]),0);
 assert.equal(m.dot([1,1,1],[-1,1,0]),0);
});
test('M0 cross3 cannot fabricate a collinear plane normal out of 2^52 large coordinates',()=>{
 const n=2**52,a=[n,n-1,0],b=[n-1,n-2,0];
 assert.equal(a[0]*b[1]-a[1]*b[0],0);
 const exact=BigInt(n)*BigInt(n-2)-BigInt(n-1)*BigInt(n-1);
 assert.equal(exact,-1n);
 assert.equal(m.cross3(a,b)[2],0);
 const evidence=m.certifyCross3Signs(a,b);
 assert.equal(evidence[2].rounded,0);
 assert.equal(evidence[2].sign,-1);
 assert.equal(evidence[2].signMatchesRounded,false);
 assert.equal(m.certifyCross3Signs(b,a)[2].sign,1);
 assert.deepEqual(m.cross3([2,0,0],[0,3,0]),[0,0,6]);
});
test('M0 input vectors cannot mutate between validation and geometry use',()=>{
 let reads=0;
 const x=[4,5,6];
 Object.defineProperty(x,0,{
  get(){reads++;return reads===1?4:Infinity;}
 });
 assert.deepEqual(m.vector(x,3),[4,5,6]);
 assert.equal(reads,1);
 reads=0;
 assert.equal(m.dot(x,[0,1,0]),5);
 assert.equal(reads,1);
 const y=[0,2,3];
 let n=0;
 Object.defineProperty(y,1,{get(){return ++n===1?2:Infinity;}});
 assert.deepEqual(m.cross3([1,0,0],y),[0,-3,2]);
 assert.equal(n,1);
});
test('M0 independently checked orthogonal/perpendicular and near-singular cancellation cases',()=>{
 for(let n=1;n<100;n++){
  assert.equal(m.dot([n,n],[n,-n]),0);
  const c=m.cross3([n,0,0],[0,n,0]);
  assert.deepEqual(c,[0,0,n*n]);
 }
 const ε=2**-52;
 assert.ok(m.dot([1,1,1],[1,ε,-1+ε])>0);
});
test('M0 still rejects nonfinite, multiplication underflow and genuine 3D dimension errors',()=>{
 assert.throws(()=>m.dot([1e-200,0],[1e-200,0]),/underflow/);
 assert.throws(()=>m.cross3([1e308,0,0],[0,1e308,0]),RangeError);
 assert.throws(()=>m.dot([1,,3],[1,2,3]),TypeError);
 assert.throws(()=>m.vector([1,2,3,4],3),TypeError);
});
