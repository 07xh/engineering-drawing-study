'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditC1ExactBinary64PaperAffineWitness:audit}=
 require('../../workbench/c1-exact-binary64-paper-affine.cjs');
const p=(u,v)=>({u,v});
const check=(a,b,from,to)=>audit({
 sourceFrom:a,sourceTo:b,measuredFrom:from,measuredTo:to
});
test('exact M0 projected source and reversed HLR edge preserve affine incidence',()=>{
 const r=check(p(0,0),p(10,2),p(10,2),p(5,1));
 assert.equal(r.bothNativeEndpointsExactlyOnOriginalBinary64PaperLine,true);
 assert.equal(r.exactBinary64PaperFromSignedCrossProductSign,0);
 assert.equal(r.exactBinary64PaperToSignedCrossProductSign,0);
 assert.equal(r.originalTopoDSHistoryCertified,false);
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.signedV5Action,false);
});
test('one ULP off original projected line has an exact nonzero signed residual',()=>{
 const r=check(p(0,0),p(1,1),p(0.5,0.5000000000000001),
  p(0.5,0.49999999999999994));
 assert.equal(r.exactBinary64PaperFromSignedCrossProductSign,-1);
 assert.equal(r.exactBinary64PaperToSignedCrossProductSign,1);
 assert.equal(r.bothNativeEndpointsExactlyOnOriginalBinary64PaperLine,false);
});
test('cross-axis drift survives floating product underflow',()=>{
 assert.equal(Number.MIN_VALUE*Number.MIN_VALUE,0);
 const r=check(p(0,0),p(Number.MIN_VALUE,0),
  p(0,Number.MIN_VALUE),p(Number.MIN_VALUE,0));
 assert.equal(r.exactBinary64PaperFromSignedCrossProductSign,-1);
 assert.equal(r.exactBinary64PaperToSignedCrossProductSign,0);
});
test('exact affine incidence survives binary64 arithmetic overflow in naive products',()=>{
 const r=check(p(0,0),p(1e308,1e308),
  p(1e308,1e308),p(1e308,0));
 assert.equal(r.exactBinary64PaperFromSignedCrossProductSign,0);
 assert.equal(r.exactBinary64PaperToSignedCrossProductSign,1);
});
test('same paper point from different 3D sources is never TopoDS history proof',()=>{
 const r=check(p(0,0),p(10,0),p(0,0),p(10,0));
 assert.equal(r.bothNativeEndpointsExactlyOnOriginalBinary64PaperLine,true);
 assert.equal(r.originalTopoDSHistoryCertified,false);
 assert.equal(r.original3DEndpointTopologyCertified,false);
 assert.equal(r.globalContinuousVisibilityCertified,false);
 assert.equal(r.signedV5Action,false);
});
test('invalid paper points and collapsed source fail closed',()=>{
 assert.throws(()=>check(p(0,0),p(0,0),p(0,0),p(0,0)),/collapsed/);
 assert.throws(()=>check(p(0,0),p(1,1),p(NaN,0),p(1,1)),/finite/);
 assert.throws(()=>check(p(0,0),p(1,1),p(Infinity,0),p(1,1)),/finite/);
});
