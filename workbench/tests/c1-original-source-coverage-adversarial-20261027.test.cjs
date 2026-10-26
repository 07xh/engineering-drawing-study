'use strict';
// Independent adversarial tests for the shared exact original 3D parameter
// coverage consumer. Never certify native OCCT provenance or formal V5 here.
const test=require('node:test');
const assert=require('node:assert/strict');
const {exactCandidateIntervalCoverage:cover}=require('../c1-original-source-interval-coverage.cjs');
const nextDownOne=1-Number.EPSILON/2;
test('exact union of unsorted touching spans covers full source',()=>{
 const input=[[.5,1],[0,.5]];
 const result=cover([0,1],input);
 assert.equal(result.entireOriginalParameterIntervalCovered,true);
 assert.deepEqual(result.positiveLengthCoveredIntervals,[[0,1]]);
 assert.deepEqual(input,[[.5,1],[0,.5]]);
 assert.equal(Object.isFrozen(result.positiveLengthCoveredIntervals),true);
});
test('single ULP tail gap remains positive and unsigned',()=>{
 const result=cover([0,1],[[0,nextDownOne]]);
 assert.equal(result.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(result.positiveLengthUncoveredIntervals,[[nextDownOne,1]]);
});
test('overlap is union coverage only, not generated edge multiplicity proof',()=>{
 const result=cover([0,1],[[0,.75],[.5,1]]);
 assert.equal(result.entireOriginalParameterIntervalCovered,true);
 assert.equal(result.candidateIntervalsExamined,2);
 assert.deepEqual(result.positiveLengthCoveredIntervals,[[0,1]]);
 assert.equal(Object.hasOwn(result,'generatedTopoDSHistoryCertified'),false);
});
test('out-of-window intervals cannot fill source range',()=>{
 const result=cover([.25,.75],[[0,.25],[.75,1]]);
 assert.equal(result.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(result.positiveLengthUncoveredIntervals,[[.25,.75]]);
});
test('partial clipping preserves exact open uncovered boundaries',()=>{
 const result=cover([.25,.75],[[0,.4],[.6,1]]);
 assert.deepEqual(result.positiveLengthCoveredIntervals,[[.25,.4],[.6,.75]]);
 assert.deepEqual(result.positiveLengthUncoveredIntervals,[[.4,.6]]);
});
test('empty evidence does not vacuously cover',()=>{
 const result=cover([0,1],[]);
 assert.equal(result.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(result.positiveLengthUncoveredIntervals,[[0,1]]);
});
test('invalid source and candidate intervals are rejected',()=>{
 for(const range of [[0,0],[-1,1],[0,2],[0,NaN],[0,Infinity]])
  assert.throws(()=>cover(range,[]),TypeError);
 for(const candidate of [[0,0],[-.1,1],[0,1.1],[0,NaN],[0,Infinity]])
  assert.throws(()=>cover([0,1],[candidate]),TypeError);
});
test('bounded interval input rejects more than 512 candidates',()=>{
 assert.throws(()=>cover([0,1],Array.from({length:513},()=>[0,1])),TypeError);
});

test('duplicate exact fragments cannot be mistaken for unique generated topology',()=>{
 const result=cover([0,1],[[0,1],[0,1]]);
 assert.equal(result.entireOriginalParameterIntervalCovered,true);
 assert.equal(result.candidateIntervalsExamined,2);
 assert.deepEqual(result.positiveLengthCoveredIntervals,[[0,1]]);
});
test('a one-ULP internal gap survives two independently valid spans',()=>{
 const left=.5-Number.EPSILON/2;
 const result=cover([0,1],[[0,left],[.5,1]]);
 assert.equal(result.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(result.positiveLengthUncoveredIntervals,[[left,.5]]);
});
test('source subspan without any intersecting witness remains uncovered',()=>{
 const result=cover([.25,.75],[[0,.1],[.9,1]]);
 assert.equal(result.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(result.positiveLengthCoveredIntervals,[]);
 assert.deepEqual(result.positiveLengthUncoveredIntervals,[[.25,.75]]);
});
test('exact 512-candidate input bound is accepted, not automatically certified',()=>{
 const fragments=Array.from({length:512},()=>[0,.25]);
 const result=cover([0,1],fragments);
 assert.equal(result.candidateIntervalsExamined,512);
 assert.equal(result.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(result.positiveLengthUncoveredIntervals,[[.25,1]]);
});

test('non-array and missing candidates fail closed',()=>{
 for(const value of [null,undefined,{},'0-1'])
  assert.throws(()=>cover([0,1],value),TypeError);
});
test('source coverage input never changes across repeated calls',()=>{
 const intervals=[[.5,1],[0,.5],[.25,.75]];
 const before=JSON.stringify(intervals);
 const first=cover([0,1],intervals);
 const second=cover([0,1],intervals);
 assert.equal(JSON.stringify(intervals),before);
 assert.deepEqual(first,second);
});
test('one ULP right boundary cannot be replaced by near-equal evidence',()=>{
 const result=cover([0,1],[[Number.MIN_VALUE,1]]);
 assert.equal(result.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(result.positiveLengthUncoveredIntervals,[[0,Number.MIN_VALUE]]);
});

test('candidate fragments touching only at the target endpoint have no positive overlap',()=>{
 const result=cover([.25,.75],[[0,.25],[.75,1]]);
 assert.equal(result.candidateIntervalsExamined,2);
 assert.deepEqual(result.positiveLengthCoveredIntervals,[]);
 assert.deepEqual(result.positiveLengthUncoveredIntervals,[[.25,.75]]);
});
test('exact middle subrange can be certified without claiming the entire source',()=>{
 const result=cover([.25,.75],[[.25,.5],[.5,.75]]);
 assert.equal(result.entireOriginalParameterIntervalCovered,true);
 assert.deepEqual(result.positiveLengthCoveredIntervals,[[.25,.75]]);
 assert.deepEqual(result.originalParameterRange,[.25,.75]);
});
test('frozen output rejects accidental downstream mutation',()=>{
 const result=cover([0,1],[[0,.5]]);
 assert.equal(Object.isFrozen(result),true);
 assert.equal(Object.isFrozen(result.positiveLengthUncoveredIntervals[0]),true);
 assert.throws(()=>{result.positiveLengthUncoveredIntervals[0][0]=0;},TypeError);
});
