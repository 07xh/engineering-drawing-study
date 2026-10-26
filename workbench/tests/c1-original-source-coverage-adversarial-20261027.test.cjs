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
