'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {prepareBlindTrial,runBlindTrial,inspectReferenceAfterSolve}=
 require('../../workbench/m5-blind-original-trial.cjs');
const SHA='1234567890abcdef'.repeat(4);
const isolated={
 schema:'draftai-cad-source-isolation/1',status:'reviewed',
 source_sha256:SHA,review_sha256:'2'.repeat(64),
 given_layers:['KNOWN_CAD'],reference_layers:['ANSWER_CAD'],unknown_layers:[],
 reviewer:'reviewer1',evidence:'independently visually reviewed layer separation',
 m3_accepted:false,v5_accepted:false
};
const given={unit:'mm',frame:'model-mm-3d',
 geometry:{kind:'point',x:12,y:4,z:7},
 taskId:'SyntheticContractExample'};
const make=()=>prepareBlindTrial({caseId:'ExampleNoOriginal',sourceSha256:SHA,
 isolation:isolated,knownConditions:given});
const undetermined=()=>({id:'ScopedAnswer',status:'undetermined',
 scope:'input-contract-only',solutions:[],solutionCount:null,
 degrees:null,localDegrees:null,rank:null,globallyUnique:null,
 maxResidual:null,proofLevel:'none',diagnostics:[]});
test('two-phase blind protocol passes only known conditions to specialist, keeps reference separate',()=>{
 const trial=make();
 assert.equal(trial.referenceExposedToSolver,false);
 assert.equal(trial.realExerciseAccepted,false);
 assert.ok(Object.isFrozen(trial.givens));
 let captured;
 const run=runBlindTrial(trial,input=>{
  captured=JSON.stringify(input);
  assert.equal(input.frame,'model-mm-3d');
  assert.equal(input.unit,'mm');
  assert.equal(Object.hasOwn(input,'reference'),false);
  assert.equal(Object.hasOwn(input,'answers'),false);
  assert.equal(Object.isFrozen(input.geometry),true);
  return undetermined();
 });
 assert.deepEqual(JSON.parse(captured),given);
 assert.equal(run.modelResultStructurallyValid,true);
 assert.equal(run.realExerciseAccepted,false);
 assert.equal(run.v5Verified,false);
 const reference={point:{x:12,y:4,z:7},privateAnswer:true};
 const comparison=inspectReferenceAfterSolve(trial,run,{
  sourceSha256:SHA,reference,
  compare:(computed,truth)=>{
   assert.equal(truth.privateAnswer,true);
   assert.equal(computed.status,'undetermined');
   return {status:'undetermined',maxResidualMm:10,toleranceMm:0.001};
  }
 });
 assert.equal(comparison.independentReferenceCompared,true);
 assert.equal(comparison.status,'undetermined');
 assert.equal(comparison.realExerciseAccepted,false);
 assert.equal(comparison.completeDrawingVerified,false);
 assert.ok(Object.isFrozen(comparison));
});
test('no answer layer can enter source givens, including nested attempts',()=>{
 for(const attack of [
  {...given,answer:{x:12}},
  {...given,geometry:{...given.geometry,reference:{answer:1}}},
  {...given,geometry:{...given.geometry,verified:true}},
  {...given,geometry:{...given.geometry,x:Infinity}},
  {...given,geometry:{...given.geometry,objects:()=>{}}},
  {...given,sourceReference:undefined}
 ]){
  assert.throws(()=>prepareBlindTrial({caseId:'BlockedExample',
    sourceSha256:SHA,isolation:isolated,knownConditions:attack}));
 }
});
test('stale source, unknown layers and reference role confusion block blind trial',()=>{
 for(const review of [
  {...isolated,source_sha256:'f'.repeat(64)},
  {...isolated,unknown_layers:['Unknown']},
  {...isolated,status:'blocked'},
  {...isolated,reference_layers:['KNOWN_CAD']},
  {...isolated,given_layers:[]},
  {...isolated,m3_accepted:true},
  {...isolated,v5_accepted:true},
  {...isolated,reviewer:''}
 ])assert.throws(()=>prepareBlindTrial({
  caseId:'BlockedSource',sourceSha256:SHA,
  isolation:review,knownConditions:given
 }));
 assert.throws(()=>prepareBlindTrial({caseId:'Bad',
  sourceSha256:'abc',isolation:isolated,knownConditions:given}));
});
test('unreviewed, forged, mutated or non-SolveResult outputs cannot be compared',()=>{
 const trial=make();
 assert.throws(()=>runBlindTrial(trial,()=>({verified:true})),/SolveResult/);
 assert.throws(()=>runBlindTrial({...trial,givens:{...trial.givens,unit:'px'}},
  undetermined),/trusted blind/);
 const run=runBlindTrial(trial,undetermined);
 assert.throws(()=>inspectReferenceAfterSolve(trial,run,{
  sourceSha256:'f'.repeat(64),reference:{point:1},
  compare:()=>({status:'pass',maxResidualMm:0,toleranceMm:0.001})
 }),/stale/);
 assert.throws(()=>inspectReferenceAfterSolve(trial,run,{
  sourceSha256:SHA,reference:{point:1},
  compare:()=>({status:'pass',maxResidualMm:2,toleranceMm:0.001})
 }),/exceeds/);
 assert.throws(()=>inspectReferenceAfterSolve(trial,{
  ...run,result:{...run.result,status:'unique'},
 },{sourceSha256:SHA,reference:{point:1},compare:()=>({status:'pass',maxResidualMm:0,toleranceMm:1})}),/stale/);
});
