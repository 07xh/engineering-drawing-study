'use strict';
// These are desired contract assertions, intentionally red on the audited SHA.
// Do not copy into required CI until the owner fixes or revises the contract.
const test=require('node:test'),assert=require('node:assert/strict');
const {diagnoseJacobian:d}=require(require('node:path').resolve(process.env.DRAFTAI_AUDIT_ROOT||process.cwd(),'core/numeric/jacobian-rank-evidence.cjs'));
test('P2: missing entry in zero row must not become finite zero Jacobian',()=>{
 const row=[0,0,0];delete row[1];
 assert.throws(()=>d({rows:[row],normalized:true}),/finite|rectangular|entry|sparse/i);
});
test('P2: missing zero row must not become a validated rectangular Jacobian',()=>{
 const rows=[[0,0],[0,0]];delete rows[1];
 assert.throws(()=>d({rows,normalized:true}),/finite|rectangular|entry|sparse/i);
});
test('P2: extreme finite off-diagonal needs accurate ratio or undetermined status',()=>{
 const e=1e-200,r=d({rows:[[1,e],[0,e]],normalized:true});
 // A^T A has trace=1+2e^2, determinant=e^2. Thus sigma_min/sigma_max
 // equals e*(1+O(e^2)); at this precision expected ratio is e.
 // Products in A^T A would underflow; this analytic expression does not.
 assert.ok(r.status==='undetermined'||Math.abs(r.singularRatios[1]/e-1)<.01,
  JSON.stringify({ratio:r.singularRatios[1],expected:e,status:r.status,converged:r.converged}));
});

