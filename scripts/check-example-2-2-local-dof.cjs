'use strict';
const assert=require('node:assert/strict');
const A=require('../knowledge/textbook-action-adapter.js'),G=require('../knowledge/textbook-example-geometry.js'),E=require('../knowledge/textbook-examples.js'),T=require('../knowledge/nonlinear-step-trace.js');
const problem=A.adapt(E.get('example-2-2'),G);
assert.deepEqual(problem.steps.map(step=>T.analyze(step.localDofAnalysis).finalDegrees),[2,1,1,0,0]);
assert.ok(problem.steps.every(step=>T.analyze(step.localDofAnalysis).atProvidedConfiguration));
assert.ok(problem.steps.every(step=>step.constraintAnalysis.scope==='point-2d-linear'));
assert.equal(A.adapt(E.get('example-1-1'),G).steps.some(step=>step.localDofAnalysis),false);
console.log('PASS: textbook example 2-2 local DOF steps [2,1,1,0,0] without invented example 1-1 analysis');
