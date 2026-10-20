'use strict';
const assert=require('node:assert/strict');
const E=require('../knowledge/textbook-examples.js'),G=require('../knowledge/textbook-example-geometry.js'),A=require('../knowledge/textbook-action-adapter.js'),T=require('../knowledge/nonlinear-step-trace.js'),fs=require('node:fs');
for(const id of ['example-1-1','example-2-2']){
 const example=E.get(id),problem=A.adapt(example,G);
 assert.equal(problem.steps.length,5);
 for(let i=0;i<5;i++){
  const frame=G.frame(id,i);
  assert.equal(problem.steps[i].actions.length,new Set(frame.shapes.map(s=>JSON.stringify(s.type==='line'?[s.type,s.a,s.b]:[s.type,s.p]))).size);
  assert(Number.isFinite(frame.proof.maxResidual));
  assert(frame.proof.maxResidual<1e-7,'proof residual '+id+' step '+i);
 }
}
const p=A.adapt(E.get('example-2-2'),G);
assert.deepEqual(p.steps.map(s=>T.analyze(s.localDofAnalysis).finalDegrees),[2,1,1,0,0]);
assert.deepEqual(p.steps.map(s=>s.localDofExplanation.addedConstraint),[null,'等高联系线：固定 a″ 的纵坐标',null,'深度定位线：固定 a″ 的横向位置',null]);
assert.equal(G.frame('example-1-1',4).proof.sevenSegments,true);
assert.equal(G.frame('example-1-1',4).proof.sixParallelLines,true);
assert.equal(G.frame('example-2-2',4).proof.heightAligned,true);
assert.equal(G.frame('example-2-2',4).proof.depthAligned,true);
const html=fs.readFileSync('knowledge/drawing-player.html','utf8');
assert(html.includes('id="constraintReason"'));
console.log('PASS: animation frames, geometric residuals, and stepwise DOF/explanation mapping');
