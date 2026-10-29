'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditC1ExactBinary64PaperAffineWitness:audit}=
 require('../../workbench/c1-exact-binary64-paper-affine.cjs');
const p=(u,v)=>({u,v});
test('exact one-ULP opposite-side transverse residuals retain canonical dyadic magnitude',()=>{
 const r=audit({sourceFrom:p(0,0),sourceTo:p(1,1),
  measuredFrom:p(0.5,0.5000000000000001),
  measuredTo:p(0.5,0.49999999999999994)});
 assert.deepEqual(r.exactBinary64PaperFromCrossProductDyadic,
  {numerator:'-1',exponent2:-53});
 assert.deepEqual(r.exactBinary64PaperToCrossProductDyadic,
  {numerator:'1',exponent2:-54});
 assert.equal(r.originalTopoDSHistoryCertified,false);
 assert.equal(r.signedV5Action,false);
});
test('subnormal cross-axis product never disappears through Number underflow',()=>{
 const m=Number.MIN_VALUE;
 const r=audit({sourceFrom:p(0,0),sourceTo:p(m,0),
  measuredFrom:p(0,m),measuredTo:p(m,0)});
 assert.deepEqual(r.exactBinary64PaperFromCrossProductDyadic,
  {numerator:'-1',exponent2:-2148});
 assert.deepEqual(r.exactBinary64PaperToCrossProductDyadic,
  {numerator:'0',exponent2:0});
});
test('canonical zero is frozen and never a source history certificate',()=>{
 const r=audit({sourceFrom:p(0,0),sourceTo:p(10,2),
  measuredFrom:p(5,1),measuredTo:p(10,2)});
 assert.deepEqual(r.exactBinary64PaperFromCrossProductDyadic,
  {numerator:'0',exponent2:0});
 assert.ok(Object.isFrozen(r.exactBinary64PaperFromCrossProductDyadic));
 assert.equal(r.engineeringLineStyle,'undetermined');
});
