'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {exactCandidateIntervalCoverage:cover}=
 require('../../workbench/c1-ocjs-hidden-sharp-m5-corroboration.cjs');

test('actual M0 original source parameter completely covered by adjacent native hidden intervals',()=>{
 const v=cover([0,1],[[0,0.35],[0.35,0.7],[0.7,1]]);
 assert.equal(v.entireOriginalParameterIntervalCovered,true);
 assert.deepEqual(v.positiveLengthUncoveredIntervals,[]);
 assert.deepEqual(v.positiveLengthCoveredIntervals,[[0,1]]);
 assert.ok(Object.isFrozen(v));
});
test('even an extremely small REAL M4 paper parameter gap never becomes coverage by tolerance',()=>{
 const lo=0.5,hi=0.5+Number.EPSILON;
 const v=cover([0,1],[[0,lo],[hi,1]]);
 assert.equal(v.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(v.positiveLengthUncoveredIntervals,[[lo,hi]]);
 assert.deepEqual(v.positiveLengthCoveredIntervals,[[0,lo],[hi,1]]);
});
test('overlapping, out-of-order real hidden BRep intervals do not create false gaps',()=>{
 const v=cover([0.2,0.8],[[0.5,0.8],[0.1,0.6],[0.5,0.7]]);
 assert.equal(v.entireOriginalParameterIntervalCovered,true);
 assert.deepEqual(v.positiveLengthCoveredIntervals,[[0.2,0.8]]);
});
test('partial native hidden coverage is correctly restricted to canonical original M4 subspan',()=>{
 const v=cover([0.3,0.6],[[0,0.4],[0.5,1]]);
 assert.equal(v.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(v.positiveLengthUncoveredIntervals,[[0.4,0.5]]);
 assert.deepEqual(v.originalParameterRange,[0.3,0.6]);
});
test('hidden native source candidates outside physical interval never prove that interval',()=>{
 const v=cover([0.4,0.6],[[0,0.2],[0.8,1]]);
 assert.equal(v.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(v.positiveLengthUncoveredIntervals,[[0.4,0.6]]);
 assert.deepEqual(v.positiveLengthCoveredIntervals,[]);
});
test('untrusted source parameter ranges are rejected rather than clamped to a false whole edge',()=>{
 for(const invalid of [[-0.0000001,0.8],[0.2,1.1],[0.5,0.5],
   [0.7,0.3],[0,Infinity],[NaN,1]]){
  assert.throws(()=>cover([0,1],[invalid]),/verified finite/);
 }
 assert.throws(()=>cover([0,1.01],[]),/bounded exact/);
 assert.throws(()=>cover([0,0],[]),/bounded exact/);
});
