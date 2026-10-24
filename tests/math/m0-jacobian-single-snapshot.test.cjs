'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {diagnoseJacobian}=require('../../core/numeric/jacobian-rank-evidence.cjs');
const run=rows=>diagnoseJacobian({rows,normalized:true});
test('M0 Jacobian first-row getter is read once before any rank calculation',()=>{
 const rows=[[1,0],[0,1]];let reads=0;
 Object.defineProperty(rows,0,{
  configurable:true,get(){return ++reads===1?[1,0]:[Infinity,0];}
 });
 const result=run(rows);
 assert.equal(reads,1);
 assert.equal(result.status,'full-column-rank');
 assert.equal(result.rankEstimate,2);
 assert.equal(result.proofOfExistence,false);
 assert.equal(result.proofOfGlobalUniqueness,false);
});
test('M0 rank numerical coefficient getter does not mutate after validation',()=>{
 const rows=[[1,0],[0,1]];let reads=0;
 Object.defineProperty(rows[1],1,{
  configurable:true,get(){return ++reads===1?1:Infinity;}
 });
 const result=run(rows);
 assert.equal(reads,1);
 assert.equal(result.status,'full-column-rank');
 assert.equal(result.rankEstimate,2);
});
test('M0 first-read invalid value cannot hide behind later finite coefficient',()=>{
 const rows=[[1,0],[0,1]];let reads=0;
 Object.defineProperty(rows[0],0,{
  configurable:true,get(){return ++reads===1?Infinity:1;}
 });
 assert.throws(()=>run(rows),TypeError);
 assert.equal(reads,1);
});
test('M0 later row getter is read once, source can change after snapshot',()=>{
 const rows=[[1,0],[0,1]];let reads=0;
 Object.defineProperty(rows,1,{
  configurable:true,get(){return ++reads===1?[0,1]:[0,NaN];}
 });
 const result=run(rows);
 assert.equal(reads,1);
 assert.deepEqual(result.singularRatios,[1,1]);
 assert.equal(result.rankEstimate,2);
});
test('M0 sparse or prototype-inherited matrix coefficients cannot fake a zero Jacobian',()=>{
 const matrix=[[0,0],[0,0]];
 delete matrix[0][1];Object.setPrototypeOf(matrix[0],{1:0});
 assert.throws(()=>run(matrix),/present|finite/);
 const rows=[[0,0],[0,0]];
 delete rows[1];Object.setPrototypeOf(rows,{1:[0,0]});
 assert.throws(()=>run(rows),/rectangular/);
});
test('M0 numeric rank remains local-only on near-tangent and rank-deficient inputs',()=>{
 const near=run([[1,1],[1,1+1e-8]]);
 assert.equal(near.rankEstimate,2);
 assert.equal(near.globallyUnique,null);
 assert.equal(near.solutionCount,null);
 assert.equal(near.proofOfExistence,false);
 const rank1=run([[1,2],[2,4],[3,6]]);
 assert.equal(rank1.rankEstimate,1);
 assert.equal(rank1.proofOfGlobalUniqueness,false);
});
test('M0 matrix underflow remains undetermined rather than inventing rank',()=>{
 const r=run([[1e308,0],[0,1e-308]]);
 assert.equal(r.status,'undetermined');
 assert.equal(r.numericUnderflowDetected,true);
 assert.equal(r.converged,false);
 assert.equal(r.conditionEstimate,null);
});
