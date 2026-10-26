'use strict';
// Deterministic property-style tests for exact physical source interval union.
// No random state, tolerances, native geometry or release authorization.
const test=require('node:test');
const assert=require('node:assert/strict');
const {exactCandidateIntervalCoverage:cover}=require('../c1-original-source-interval-coverage.cjs');
const points=[0,.125,.25,.375,.5,.625,.75,.875,1];
test('all deterministic contiguous dyadic partitions exactly cover [0,1]',()=>{
 for(let stride=1;stride<=8;stride++){
  const cuts=[0];
  for(let i=stride;i<8;i+=stride)cuts.push(points[i]);
  cuts.push(1);
  const spans=cuts.slice(1).map((to,i)=>[cuts[i],to]);
  const result=cover([0,1],spans);
  assert.equal(result.entireOriginalParameterIntervalCovered,true);
  assert.deepEqual(result.positiveLengthUncoveredIntervals,[]);
  assert.deepEqual(result.positiveLengthCoveredIntervals,[[0,1]]);
  assert.deepEqual(cover([0,1],[...spans].reverse()),result);
 }
});
test('removing each interior partition fragment leaves exactly its hole',()=>{
 const spans=points.slice(1).map((to,i)=>[points[i],to]);
 for(let i=0;i<spans.length;i++){
  const remaining=spans.filter((_,j)=>i!==j);
  const result=cover([0,1],remaining);
  assert.equal(result.entireOriginalParameterIntervalCovered,false);
  assert.deepEqual(result.positiveLengthUncoveredIntervals,[spans[i]]);
 }
});
test('duplicates and arbitrary input order cannot change exact union',()=>{
 const base=[[0,.25],[.25,.5],[.5,.75],[.75,1]];
 const expected=cover([0,1],base);
 for(let shift=0;shift<base.length;shift++){
  const rotated=[...base.slice(shift),...base.slice(0,shift)];
  const doubled=[...rotated,...rotated];
  const actual=cover([0,1],doubled);
  assert.deepEqual(actual.positiveLengthCoveredIntervals,expected.positiveLengthCoveredIntervals);
  assert.deepEqual(actual.positiveLengthUncoveredIntervals,expected.positiveLengthUncoveredIntervals);
  assert.equal(actual.candidateIntervalsExamined,8);
 }
});

test('subrange partitions preserve exact clipping without outside certification',()=>{
 for(let left=1;left<=5;left++){
  const right=left+2;
  const range=[points[left],points[right]];
  const spans=[[0,points[left]],[points[left],points[left+1]],[points[left+1],points[right]],[points[right],1]];
  const result=cover(range,spans);
  assert.equal(result.entireOriginalParameterIntervalCovered,true);
  assert.deepEqual(result.positiveLengthCoveredIntervals,[range]);
  assert.deepEqual(result.originalParameterRange,range);
 }
});
test('missing every dyadic boundary fragment never passes as full coverage',()=>{
 const spans=points.slice(1).map((to,i)=>[points[i],to]);
 for(let i=0;i<spans.length;i++){
  const without=spans.filter((_,j)=>i!==j);
  const withDuplicate=[...without,without[0]];
  const result=cover([0,1],withDuplicate);
  assert.equal(result.entireOriginalParameterIntervalCovered,false);
  assert.deepEqual(result.positiveLengthUncoveredIntervals,[spans[i]]);
 }
});
