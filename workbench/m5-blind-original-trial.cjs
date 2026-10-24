'use strict';
/*
 * M5: Blind exercise input audit, not a mathematical solver or proof of
 * true original exercise success. Reference data is entirely excluded from
 * runBlindTrial; it appears only in a SECOND, independent comparison phase.
 * This callback boundary is not a sandbox for adversarial code.
 * Actual textbook files and answer data MUST remain private, outside CI.
 */
const {createHash}=require('node:crypto');
const {validateSolveResult}=require('../core/contracts/solve-result.js');
const SHA=/^[0-9a-f]{64}$/;
const ID=/^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const forbidden=/^(?:answer|answers|reference|references|solution|solutions|answerGeometry|answerLayers|referenceLayers|expectedSolution|modelAnswer|expectedAnswer|verified|v5Ready)$/i;
function fail(s){throw new TypeError('M5 blind original: '+s);}
function examine(value,depth=0){
 if(depth>12)fail('source nesting too deep');
 if(value===null||typeof value==='boolean')return;
 if(typeof value==='number'){
  if(!Number.isFinite(value))fail('nonfinite source condition');return;
 }
 if(typeof value==='string'){
  if(value.length>2000)fail('unbounded source string');return;
 }
 if(Array.isArray(value)){
  if(value.length>5000)fail('source list too large');
  for(const x of value)examine(x,depth+1);
  return;
 }
 if(!plain(value))fail('nonplain or executable condition');
 const keys=Object.keys(value);
 if(keys.length>80)fail('too many source fields');
 for(const key of keys){
  if(forbidden.test(key)||['__proto__','constructor','prototype'].includes(key))
   fail('answer/reference data cannot be passed to blind solver: '+key);
  examine(value[key],depth+1);
 }
}
const copy=x=>JSON.parse(JSON.stringify(x));
function freeze(x){
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);
  Object.freeze(x);
 }
 return x;
}
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function prepareBlindTrial({caseId,sourceSha256,isolation,knownConditions}={}){
 if(!ID.test(caseId)||!SHA.test(sourceSha256))
  fail('valid ID and real CAD source SHA-256 required');
 if(!plain(isolation)||isolation.schema!=='draftai-cad-source-isolation/1'||
    isolation.status!=='reviewed'||isolation.source_sha256!==sourceSha256||
    !Array.isArray(isolation.given_layers)||!isolation.given_layers.length||
    !Array.isArray(isolation.reference_layers)||
    !Array.isArray(isolation.unknown_layers)||isolation.unknown_layers.length||
    isolation.given_layers.some(x=>typeof x!=='string'||!x.length)||
    isolation.reference_layers.some(x=>typeof x!=='string'||!x.length)||
    new Set([...isolation.given_layers,...isolation.reference_layers]).size!==
      isolation.given_layers.length+isolation.reference_layers.length||
    isolation.m3_accepted!==false||isolation.v5_accepted!==false||
    typeof isolation.reviewer!=='string'||!isolation.reviewer.trim()||
    typeof isolation.evidence!=='string'||!isolation.evidence.trim())
  fail('CAD given/reference layers lack explicit isolated review');
 if(!plain(knownConditions)||Object.keys(knownConditions).length===0)
  fail('known model conditions required');
 examine(knownConditions);
 const givens=copy(knownConditions);
 if(givens.unit!=='mm'||!['model-mm-2d','model-mm-3d'].includes(givens.frame))
  fail('explicit model-mm source frame and units required');
 if(JSON.stringify(givens).length>200000)fail('unbounded source conditions');
 return freeze({schema:'draftai-m5-blind-original-trial/1',caseId,sourceSha256,
  givensFingerprint:digest(givens),givens,
  givenLayerCount:isolation.given_layers.length,
  referenceLayerCount:isolation.reference_layers.length,
  isolationReviewSha256:isolation.review_sha256??null,
  referenceExposedToSolver:false,realExerciseAccepted:false,
  v5Verified:false});
}
function runBlindTrial(trial,solve){
 if(trial?.schema!=='draftai-m5-blind-original-trial/1'||
    digest(trial.givens)!==trial.givensFingerprint||
    trial.referenceExposedToSolver!==false||typeof solve!=='function')
  fail('trusted blind trial and specialist required');
 const input=freeze(copy(trial.givens));
 const original=digest(input),result=solve(input);
 if(result?.then)fail('asynchronous solver requires a separate process protocol');
 if(digest(input)!==original)fail('solver tried to mutate frozen source data');
 const checked=validateSolveResult(result);
 if(!checked.ok)fail('SolveResult structure invalid: '+checked.errors.join('; '));
 return freeze({schema:'draftai-m5-blind-solver-run/1',caseId:trial.caseId,
  sourceSha256:trial.sourceSha256,givensFingerprint:trial.givensFingerprint,
  result:copy(result),resultFingerprint:digest(result),
  referenceExposedToSolver:false,modelResultStructurallyValid:true,
  realExerciseAccepted:false,v5Verified:false});
}
function inspectReferenceAfterSolve(trial,run,{sourceSha256,reference,compare}={}){
 if(trial?.schema!=='draftai-m5-blind-original-trial/1'||
    run?.schema!=='draftai-m5-blind-solver-run/1'||
    run.caseId!==trial.caseId||run.givensFingerprint!==trial.givensFingerprint||
    run.sourceSha256!==trial.sourceSha256||
    digest(run.result)!==run.resultFingerprint||
    run.referenceExposedToSolver!==false||sourceSha256!==trial.sourceSha256)
  fail('stale, forged or pre-solve comparison');
 if(typeof compare!=='function'||!plain(reference))
  fail('separately supplied independent reference comparison required');
 const outcome=compare(freeze(copy(run.result)),freeze(copy(reference)));
 if(!plain(outcome)||!['pass','fail','undetermined'].includes(outcome.status)||
    !Number.isFinite(outcome.maxResidualMm)||outcome.maxResidualMm<0||
    !Number.isFinite(outcome.toleranceMm)||outcome.toleranceMm<=0)
  fail('comparison needs finite residual/tolerance and outcome');
 if(outcome.status==='pass'&&outcome.maxResidualMm>outcome.toleranceMm)
  fail('claimed pass exceeds residual tolerance');
 return freeze({schema:'draftai-m5-reference-comparison/1',
  caseId:trial.caseId,sourceSha256:trial.sourceSha256,
  resultFingerprint:run.resultFingerprint,status:outcome.status,
  maxResidualMm:outcome.maxResidualMm,toleranceMm:outcome.toleranceMm,
  independentReferenceCompared:true,realExerciseAccepted:false,
  v5Verified:false,completeDrawingVerified:false});
}
module.exports={prepareBlindTrial,runBlindTrial,inspectReferenceAfterSolve};
