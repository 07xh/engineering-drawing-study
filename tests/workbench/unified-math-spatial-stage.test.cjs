'use strict';
/**
 * M5 proof-scope invariants for the single M3 unified math pipeline.
 * These are computed from explicit synthetic millimetre inputs, not DWG
 * answer shapes or a user-provided verified result.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluateUnifiedMath:run}=
 require('../../workbench/unified-math-pipeline.cjs');
const {validateSolveResult}=require('../../core/contracts/solve-result.js');
const p=(x,y,z)=>({x,y,z});
const plane=(point,normal)=>({point,normal});
const input=(kind,solid,pl,extras={})=>({
 kind,solid,plane:pl,frame:'model-mm-3d',unit:'mm',...extras
});
const cut=(data,revision=5)=>run({kind:'spatial-section',input:data,revision});
const fixtures=[
 input('rectangular-prism',{min:p(0,0,0),max:p(10,10,10)},
  plane(p(0,0,12),p(1,1,1))),
 input('rectangular-pyramid',{
  base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)},
  plane(p(0,0,15),p(1,1,1))),
 input('cylinder-lateral',{baseCenter:p(0,0,0),radiusMm:5,heightMm:30},
  plane(p(0,0,15),p(1,0,1)),{samples:24}),
 input('sphere-surface',{center:p(0,0,0),radiusMm:5,modelUnit:'mm'},
  {...plane(p(0,0,3),p(0,0,1)),modelUnit:'mm'},{samples:32})
];
for(const example of fixtures){
 test('unified 03–06 M3 source/partial evidence, no invented V5: '+example.kind,()=>{
  const before=JSON.stringify(example);
  const response=cut(example);
  assert.equal(response.status,'geometry-only');
  assert.equal(response.specialistKind,example.kind);
  assert.equal(response.revision,5);
  assert.equal(response.unifiedMathPipeline,'m3-scoped-evidence-only/1');
  assert.equal(response.geometryVerifiedWithinSpecialistScope,true);
  assert.equal(response.mathematicallyVerified,false);
  assert.equal(response.verifiedVisibility,false);
  assert.equal(response.sourceProblemConfirmed,false);
  assert.equal(response.v5Ready,false);
  assert.equal(response.realExerciseAccepted,false);
  assert.deepEqual(response.constructionIntents,[]);
  assert.deepEqual(response.steps,[]);
  assert.equal(response.timing,null);
  assert.equal(validateSolveResult(response.solveResult).ok,true);
  assert.equal(response.solveResult.status,'undetermined');
  assert.equal(response.solveResult.globallyUnique,null);
  assert.equal(response.solveResult.proofOfGlobalUniqueness,false);
  assert.equal(response.solveResult.visibilityVerified,false);
  assert.equal(response.solveResult.sourceProblemConfirmed,false);
  assert.equal(JSON.stringify(example),before);
  assert.equal(Object.isFrozen(response),true);
 });
}
test('unified pipeline blocks a no-intersection or clipped 3D section',()=>{
 const prism=fixtures[0];
 const absent=cut({...prism,plane:plane(p(0,0,40),p(0,0,1))},12);
 assert.equal(absent.status,'not-verified');
 assert.equal(absent.geometryVerifiedWithinSpecialistScope,false);
 assert.equal(absent.v5Ready,false);
 assert.equal(absent.solveResult.maxResidual,null);
 assert.deepEqual(absent.steps,[]);
});
test('unified spatial entry fails closed on fake source, units, revision and injected evidence',()=>{
 const prism=fixtures[0];
 for(const field of ['verified','result','solveResult','constructionIntents']){
  assert.throws(()=>cut({...prism,[field]:{verified:true}}));
 }
 assert.throws(()=>cut({...prism,unit:'px'}),/model-mm/);
 assert.throws(()=>run({kind:'spatial-section',input:prism,
  revision:10,sheet:{origin:{x:0,y:0},scale:3}}),/cannot accept/);
 assert.throws(()=>cut({...prism,kind:'unknown-solid'}),/unsupported/);
 assert.throws(()=>run({kind:'spatial-section',
  input:{...prism,revision:8},revision:9}),/stale/);
 assert.throws(()=>run({kind:'spatial-section',input:prism,revision:-1}),/revision/);
});
test('single 02/03/07 runtime accepts no extra proof from input revisions',()=>{
 const given={knownViews:{V:[15,12],H:[15,10]},
  sheetTransform:{origin:{x:100,y:100},scale:2}};
 const ready=run({kind:'point-projection',input:given,revision:3});
 assert.equal(ready.status,'ready');
 assert.equal(ready.unifiedMathPipeline,'m3-canonical-intent-v5/1');
 assert.equal(ready.canonicalVerified,true);
 assert.throws(()=>run({kind:'point-projection',input:{...given,revision:2},
  revision:3}),/stale/);
});
