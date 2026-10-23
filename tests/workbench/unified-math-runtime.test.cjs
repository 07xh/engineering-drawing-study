'use strict';
/**
 * 09 cross-layer contract tests, independent of public page styling. Reuse the
 * existing verified M3 solvers as oracles; never use a textbook answer image.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {
 RUNTIME_VERSION,runUnifiedMath,verifiedLiveIntentTimeline,
 verifiedPolygonIntentTimeline
}=require('../../integration/unified-math-runtime.cjs');
const {validateConstructionIntentDAG}=
 require('../../core/contracts/construction-intent.js');
const {validateSolveResult}=require('../../core/contracts/solve-result.js');
const P=(x,y)=>({x,y});
const P3=(x,y,z)=>({x,y,z});
const sheet={origin:P(360,220),scale:8};
const seg=(x1,y1,x2,y2)=>({a:P(x1,y1),b:P(x2,y2)});
const cases=[
 ['segments',{first:seg(-20,0,20,0),second:seg(0,-20,0,20),
  filletRadius:10,branchId:'s++',direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'}],
 ['circles',{first:{center:P(0,0),radius:5},
  second:{center:P(20,0),radius:5},filletRadius:10,
  firstMode:'external',secondMode:'external',branchId:'center-1',
  direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'}],
 ['segment-circle',{segment:seg(-15,0,15,0),
  circle:{center:P(0,5),radius:8},filletRadius:3,side:1,
  branchId:'candidate-1',direction:'ccw',lineTravel:'forward',
  knownCircleTravel:'cw'}],
 ['point-projection',{knownViews:{V:[15,12],H:[15,10]},
  sheetTransform:{origin:P(100,100),scale:2}}]
];
for(const [kind,input] of cases){
 test('M0-M4 unified public computation: '+kind,()=>{
  const before=JSON.stringify(input);
  const plan=runUnifiedMath({kind,input,sheet,revision:41});
  assert.equal(plan.status,'ready');
  assert.equal(plan.runtime.schema,RUNTIME_VERSION);
  assert.equal(plan.runtime.kind,kind);
  assert.equal(plan.runtime.revision,41);
  assert.equal(plan.runtime.math,'specialist-recomputed');
  assert.equal(plan.runtime.construction,'construction-intent-dag-validated');
  assert.equal(plan.runtime.animation,'existing-v5-ready');
  assert.equal(plan.runtime.imageProvenanceVerified,false);
  assert.equal(plan.runtime.realExerciseAccepted,false);
  assert.equal(plan.canonicalVerified,true);
  assert.equal(validateConstructionIntentDAG(plan.constructionIntents).ok,true);
  assert.equal(JSON.stringify(input),before);
  const old=verifiedLiveIntentTimeline(kind,input,sheet,41);
  assert.deepEqual(plan.steps,old.steps);
  assert.deepEqual(plan.timing,old.timing);
  assert.equal(plan.selectedBranchId,old.selectedBranchId);
 });
}
test('M3 planar polygon uses same runtime envelope and same canonical M4/V5',()=>{
 const input={unit:'mm',center:P(0,0),radiusMm:25,sideCount:6,
  firstVertexAngleDeg:90,direction:'ccw',revision:12,sourceConfirmed:true};
 const direct=verifiedPolygonIntentTimeline(input,sheet);
 const unified=runUnifiedMath({kind:'inscribed-regular-polygon',input,sheet,revision:12});
 assert.equal(direct.status,'ready');
 assert.equal(direct.runtime.animation,'existing-v5-ready');
 assert.equal(unified.solverResult.status,'unique');
 assert.equal(validateSolveResult(unified.solverResult).ok,true);
 assert.equal(validateConstructionIntentDAG(unified.constructionIntents).ok,true);
 assert.deepEqual(direct.steps,unified.steps);
 assert.deepEqual(direct.timing,unified.timing);
});
test('M5 revision, fake proof and unchosen source branches fail closed',()=>{
 const [kind,fixture]=cases[0];
 const noBranch={...fixture};delete noBranch.branchId;
 const blocked=runUnifiedMath({kind,input:noBranch,sheet,revision:8});
 assert.notEqual(blocked.status,'ready');
 assert.equal(blocked.runtime.animation,'blocked');
 assert.ok(!blocked.constructionIntents?.length);
 assert.throws(()=>runUnifiedMath({kind,input:{...fixture,
  revision:7},sheet,revision:8}),/stale/);
 for(const property of ['proof','result','steps','timing','mathematicallyVerified']){
  assert.throws(()=>runUnifiedMath({kind,input:{...fixture,[property]:true},
   sheet,revision:8}),/caller-supplied/);
 }
 assert.throws(()=>runUnifiedMath({kind:'new-solver',input:fixture,sheet,revision:8}),
  /unsupported/);
 assert.throws(()=>runUnifiedMath({kind,input:fixture,sheet,revision:-1}),/revision/);
 const noConfirmation={unit:'mm',center:P(0,0),radiusMm:20,sideCount:3,
  firstVertexAngleDeg:0,direction:'cw',revision:8,sourceConfirmed:false};
 const polygon=runUnifiedMath({kind:'inscribed-regular-polygon',
  input:noConfirmation,sheet,revision:8});
 assert.equal(polygon.runtime.animation,'blocked');
 assert.equal(polygon.mathematicallyVerified,false);
 assert.throws(()=>verifiedPolygonIntentTimeline({...noConfirmation,revision:9},sheet)
  &&runUnifiedMath({kind:'inscribed-regular-polygon',input:noConfirmation,
   sheet,revision:9}),/stale/);
});
test('M2/M3 3D section shares runtime but never gains fabricated V5 or visibility',()=>{
 const input={kind:'rectangular-prism',
  solid:{min:P3(0,0,0),max:P3(10,10,10)},
  plane:{point:P3(0,0,12),normal:P3(1,1,1)},
  frame:'model-mm-3d',unit:'mm'};
 const result=runUnifiedMath({kind:'spatial-section',input,revision:19});
 assert.equal(result.status,'geometry-only');
 assert.equal(result.runtime.math,'scoped-geometry-only');
 assert.equal(result.runtime.construction,'not-available');
 assert.equal(result.runtime.animation,'not-available');
 assert.equal(result.geometryVerifiedWithinSpecialistScope,true);
 assert.equal(result.mathematicallyVerified,false);
 assert.equal(result.solveResult.proofOfGlobalUniqueness,false);
 assert.equal(result.solveResult.visibilityVerified,false);
 assert.equal(validateSolveResult(result.solveResult).ok,true);
 assert.deepEqual(result.constructionIntents,[]);
 assert.deepEqual(result.steps,[]);
 assert.equal(result.timing,null);
 const miss=runUnifiedMath({kind:'spatial-section',
  input:{...input,plane:{point:P3(0,0,40),normal:P3(0,0,1)}},
  revision:20});
 assert.equal(miss.status,'blocked');
 assert.equal(miss.runtime.math,'not-approved');
 assert.throws(()=>runUnifiedMath({kind:'spatial-section',input:{
  ...input,verified:true},revision:19}),/caller-supplied/);
 assert.throws(()=>runUnifiedMath({kind:'spatial-section',input:{
  ...input,unit:'px'},revision:19}),/model-mm/);
});
test('public 02/03/polygon workbenches enter through ONE runtime gate',()=>{
 const root=path.resolve(__dirname,'../..');
 for(const p of ['labs/circle-fillet-live-entry.cjs',
  'labs/point-projection-live-entry.cjs','labs/polygon-live-entry.cjs']){
  const source=fs.readFileSync(path.join(root,p),'utf8');
  assert.match(source,/require\('\.\.\/integration\/unified-math-runtime\.cjs'\)/);
 }
});
