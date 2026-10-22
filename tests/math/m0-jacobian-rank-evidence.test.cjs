'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {diagnoseJacobian:rank}=require('../../core/numeric/jacobian-rank-evidence.cjs');
const diagnose=(rows,rest={})=>rank({rows,normalized:true,...rest});

test('orthonormal 2x2 Jacobian has full column rank without global proof',()=>{
  const r=diagnose([[1,0],[0,1]]);
  assert.equal(r.rankEstimate,2);
  assert.equal(r.localDegreesEstimate,0);
  assert.equal(r.status,'full-column-rank');
  assert.equal(r.globallyUnique,null);
  assert.equal(r.proofOfGlobalUniqueness,false);
  assert.equal(r.proofOfExistence,false);
});

test('zero Jacobian reports a singular local linearization, not a solution',()=>{
  const r=diagnose([[0,0],[0,0]]);
  assert.equal(r.rankEstimate,0);
  assert.equal(r.localDegreesEstimate,2);
  assert.equal(r.status,'rank-deficient');
  assert.equal(r.solutionCount,null);
});

test('underdetermined rectangular Jacobian includes free columns',()=>{
  const r=diagnose([[1,0,0],[0,1,0]]);
  assert.equal(r.rankEstimate,2);
  assert.equal(r.localDegreesEstimate,1);
  assert.equal(r.status,'rank-deficient');
});

test('near singular configuration is sensitive to explicit rank threshold',()=>{
  const mat=[[1,0],[0,1e-9]];
  assert.equal(diagnose(mat,{relativeThreshold:1e-11}).rankEstimate,2);
  assert.equal(diagnose(mat,{relativeThreshold:1e-7}).rankEstimate,1);
  assert.equal(diagnose(mat,{relativeThreshold:1e-9}).status,'undetermined');
});

test('large/small uniform scaling does not change relative singular ratios',()=>{
  const a=diagnose([[1,0],[0,1e-6]]);
  const b=diagnose([[1e-180,0],[0,1e-186]]);
  const c=diagnose([[1e180,0],[0,1e174]]);
  for(const x of [b,c]){
    assert.equal(x.rankEstimate,a.rankEstimate);
    assert.ok(Math.abs(x.singularRatios[1]-a.singularRatios[1])<1e-14);
  }
});

test('Jacobi column orthogonalization resolves nearly dependent rows',()=>{
  const r=diagnose([[1,1],[1,1+1e-8]],{relativeThreshold:1e-10});
  assert.equal(r.converged,true);
  assert.equal(r.rankEstimate,2);
  assert.ok(r.singularRatios[1]>1e-9&&r.singularRatios[1]<1e-8);
});

test('rotation of a fixed singular spectrum leaves ratios invariant',()=>{
  const c=Math.SQRT1_2,s=Math.SQRT1_2;
  const base=diagnose([[3,0],[0,1]]);
  const rotated=diagnose([[3*c,-s],[3*s,c]]);
  assert.ok(Math.abs(rotated.singularRatios[1]-base.singularRatios[1])<1e-12);
});

test('dependent constraints remain rank deficient',()=>{
  const r=diagnose([[1,2],[2,4],[3,6]]);
  assert.equal(r.converged,true);
  assert.equal(r.rankEstimate,1);
  assert.equal(r.localDegreesEstimate,1);
});

test('finite but extreme matrices return finite ratios, not overflow',()=>{
  const r=diagnose([[1e250,0],[0,1e240]],{relativeThreshold:1e-12});
  assert.equal(r.rankEstimate,2);
  assert.equal(r.singularRatios[0],1);
  assert.ok(Number.isFinite(r.singularRatios[1]));
});

test('caller must explicitly normalize row units: no silent mm/pixel mixture',()=>{
  assert.throws(()=>rank({rows:[[1]]}),/normalized/);
  assert.throws(()=>rank({rows:[[1]],normalized:'true'}),/normalized/);
});

test('non-finite, ragged, empty and oversized Jacobians fail closed',()=>{
  for(const rows of [[],[[]],[[1,2],[1]],[[NaN]],[[Infinity]],Array(65).fill([1])])
    assert.throws(()=>diagnose(rows));
});

test('invalid tolerance and sweep bounds are rejected',()=>{
  for(const relativeThreshold of [0,-1,NaN,Infinity,1e-16,1])
    assert.throws(()=>diagnose([[1]],{relativeThreshold}));
  for(const maxSweeps of [0,101,1.5,NaN])
    assert.throws(()=>diagnose([[1]],{maxSweeps}));
});
