'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {diagnoseJacobian} = require('../../core/numeric/jacobian-rank-evidence.cjs');
const diagnose = rows => diagnoseJacobian({rows,normalized:true});

test('P2 audit: reject a missing coefficient rather than treating a sparse zero row as zero',()=>{
  const row=[0,0,0]; delete row[1];
  assert.throws(()=>diagnose([row]),/present|finite|rectangular|sparse/i);
});

test('P2 audit: reject a missing row rather than accepting a sparse zero matrix',()=>{
  const rows=[[0,0],[0,0]]; delete rows[1];
  assert.throws(()=>diagnose(rows),/present|finite|rectangular|sparse/i);
});

test('P2 audit: underflowed Jacobi products do not certify a condition number or convergence',()=>{
  const e=1e-200;
  const r=diagnose([[1,e],[0,e]]);
  assert.equal(r.status,'undetermined');
  assert.equal(r.numericUnderflowDetected,true);
  assert.equal(r.converged,false);
  assert.equal(r.conditionEstimate,null);
  assert.equal(r.proofOfExistence,false);
  assert.equal(r.proofOfGlobalUniqueness,false);
  assert.equal(r.globallyUnique,null);
});

test('fully populated zero Jacobian retains the existing local-rank result',()=>{
  const r=diagnose([[0,0],[0,0]]);
  assert.equal(r.status,'rank-deficient');
  assert.equal(r.rankEstimate,0);
  assert.equal(r.localDegreesEstimate,2);
  assert.equal(r.proofOfGlobalUniqueness,false);
});

test('true zero column does not spuriously signal numerical underflow',()=>{
  const r=diagnose([[1,0],[0,0]]);
  assert.equal(r.status,'rank-deficient');
  assert.equal(r.numericUnderflowDetected,false);
  assert.equal(r.converged,true);
});

test('ordinary full-rank Jacobian remains a local-only numerical estimate',()=>{
  const r=diagnose([[1,0],[0,2]]);
  assert.equal(r.status,'full-column-rank');
  assert.equal(r.rankEstimate,2);
  assert.equal(r.numericUnderflowDetected,false);
  assert.equal(r.proofOfExistence,false);
  assert.equal(r.globallyUnique,null);
});
