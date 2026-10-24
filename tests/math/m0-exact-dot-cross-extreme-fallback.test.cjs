'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const math=require('../../core/numeric/euclidean-kernel.cjs');
test('exact binary64 dot sign recovers true tiny product after Float64 multiplication underflow',()=>{
 const r=math.certifyDotSign([1e-200,0],[1e-200,0]);
 assert.equal(1e-200*1e-200,0);
 assert.equal(r.rounded,0);
 assert.equal(r.sign,1);
 assert.equal(r.method,'exact-dyadic-fallback');
 assert.equal(r.signMatchesRounded,false);
 assert.equal(r.exactForBinary64Inputs,true);
 assert.equal(r.officialLineStyleVerified,false);
 assert.equal(r.v5Ready,false);
 const neg=math.certifyDotSign([-1e-200,0],[1e-200,0]);
 assert.equal(neg.rounded,0);assert.equal(neg.sign,-1);
 assert.throws(()=>math.dot([1e-200,0],[1e-200,0]),/underflow/);
});
test('exact dot sign handles Float64 overflow AND mathematically exact cancellation',()=>{
 const a=[1e308,1e308],b=[1e308,-1e308];
 const r=math.certifyDotSign(a,b);
 assert.equal(a[0]*b[0],Infinity);
 assert.equal(r.sign,0);
 assert.equal(r.rounded,null);
 assert.equal(r.method,'exact-dyadic-fallback');
 assert.equal(r.signMatchesRounded,false,'a null rounded magnitude is not a rounded zero');
 assert.throws(()=>math.dot(a,b),RangeError);
});
test('cancelled overflowing products with a subnormal-scale residual have exact nonzero sign',()=>{
 const a=[1e308,1e308,1e-308];
 const pos=math.certifyDotSign(a,[1e308,-1e308,1e-308]);
 const neg=math.certifyDotSign(a,[1e308,-1e308,-1e-308]);
 assert.equal(pos.rounded,null);assert.equal(neg.rounded,null);
 assert.equal(pos.sign,1);assert.equal(neg.sign,-1);
 assert.equal(pos.signMatchesRounded,false);
 assert.equal(neg.signMatchesRounded,false);
 const huge=math.certifyDotSign([1e308,1e308],[1e308,1e308]);
 assert.equal(huge.rounded,null);
 assert.equal(huge.sign,1);
});
test('cross3 exact sign recovers overflow, underflow and reversed orientation',()=>{
 const huge=math.certifyCross3Signs([1e308,0,0],[0,1e308,0]);
 assert.deepEqual(huge.map(x=>x.sign),[0,0,1]);
 assert.equal(huge[2].rounded,null);
 assert.equal(huge[2].method,'exact-dyadic-fallback');
 assert.equal(huge[2].signMatchesRounded,false);
 assert.equal(math.certifyCross3Signs([0,1e308,0],[1e308,0,0])[2].sign,-1);
 const tiny=math.certifyCross3Signs([1e-200,0,0],[0,1e-200,0]);
 assert.deepEqual(tiny.map(x=>x.sign),[0,0,1]);
 assert.equal(tiny[2].rounded,0);
 assert.equal(tiny[2].method,'exact-dyadic-fallback');
 assert.equal(tiny[2].v5Ready,false);
 assert.throws(()=>math.cross3([1e308,0,0],[0,1e308,0]),RangeError);
 assert.throws(()=>math.cross3([1e-200,0,0],[0,1e-200,0]),/underflow/);
});
test('safe finite sign predicates preserve Float64 fast filter and cancellation fallback',()=>{
 const fast=math.certifyDotSign([2,0,0],[3,0,0]);
 assert.equal(fast.sign,1);
 // Either filtered or conservative exact fallback is acceptable, but
 // the result remains a valid represented-binary64 sign.
 assert.equal(fast.rounded,6);
 assert.equal(fast.signMatchesRounded,true);
 const cancel=math.certifyDotSign([1,1,1],[1,2**-53,-1]);
 assert.equal(cancel.rounded,0);assert.equal(cancel.sign,1);
 assert.equal(cancel.method,'exact-dyadic-fallback');
 assert.equal(cancel.signMatchesRounded,false);
 const zero=math.certifyDotSign([1,1],[1,-1]);
 assert.equal(zero.rounded,0);assert.equal(zero.sign,0);
 assert.equal(zero.signMatchesRounded,true);
});
test('invalid or accessor-mutated vectors still reject before exact fallback',()=>{
 assert.throws(()=>math.certifyDotSign([Infinity,1],[1,1]),TypeError);
 assert.throws(()=>math.certifyCross3Signs([1,,3],[1,2,3]),TypeError);
 const a=[1e308,1e308];let calls=0;
 Object.defineProperty(a,0,{get(){return ++calls===1?1e308:NaN;}});
 const sign=math.certifyDotSign(a,[1e308,-1e308]);
 assert.equal(calls,1);
 assert.equal(sign.sign,0);
 assert.equal(sign.rounded,null);
});
