'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {binary64OrderedStepDistance:dist}=
 require('../../core/geometry/binary64-ordered-step-distance.cjs');
test('binary64 exact ULP steps preserve real W B|D drift and the signed-zero numerical boundary',()=>{
 assert.equal(dist(15.461646096066227,15.461646096066229),1n);
 assert.equal(dist(1,1+Number.EPSILON),1n);
 assert.equal(dist(1+2*Number.EPSILON,1),2n);
 assert.equal(dist(-1,-1-Number.EPSILON),1n);
 assert.equal(dist(0,-0),0n);
 assert.equal(dist(0,-Number.MIN_VALUE),1n);
 assert.equal(dist(-Number.MIN_VALUE,Number.MIN_VALUE),2n);
 assert.equal(dist(Number.MIN_VALUE,-Number.MIN_VALUE),2n);
 assert.equal(dist(-2,2),dist(2,-2));
 for(const input of [NaN,Infinity,-Infinity])
  assert.throws(()=>dist(input,0),/finite/);
});
