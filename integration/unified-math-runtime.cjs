'use strict';
/**
 * DraftAI M0–M5 execution boundary (#372). ONE dispatch entry for trusted
 * existing M3 specialists; no new numeric kernel, SolveResult, Intent schema,
 * DAG compiler or V5 player.
 *
 * A successful scoped 3D section is NOT a finished construction or verified
 * visibility. A caller's verified/proof/steps flags never enter this boundary.
 */
const {verifiedLiveIntentTimeline:runLive}=
 require('../workbench/verified-live-intent-v1.cjs');
const {verifiedPolygonIntentTimeline:runPolygon}=
 require('../workbench/verified-polygon-intent-v1.cjs');
const {solveVerifiedSectionEvidence:runSection}=
 require('../engines/spatial/sections/verified-section-evidence.cjs');
const {validateSolveResult}=require('../core/contracts/solve-result.js');
const {validateConstructionIntentDAG,CONSTRUCTION_INTENT_VERSION}=
 require('../core/contracts/construction-intent.js');

const RUNTIME_VERSION='draftai-math-runtime/1.0.0';
const LIVE_KINDS=Object.freeze(['segments','circles','segment-circle','point-projection']);
const SECTION_KINDS=Object.freeze([
 'rectangular-prism','rectangular-pyramid','cylinder-lateral','sphere-surface'
]);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validRevision=x=>Number.isSafeInteger(x)&&x>=0;
const injected=new Set([
 'verified','mathematicallyVerified','canonicalVerified','proof','solveResult',
 'result','intents','constructionIntents','steps','timing','timeline'
]);
const stages=(kind,revision,math,construction,animation,detail)=>Object.freeze({
 schema:RUNTIME_VERSION,kind,revision,math,construction,animation,
 // This entry does not verify an uploaded image, source page or production UI.
 imageProvenanceVerified:false,realExerciseAccepted:false,
 detail
});
function checkRequest(request){
 if(!record(request)||Object.keys(request).some(k=>
    !['kind','input','sheet','revision'].includes(k)))
  throw new TypeError('canonical unified math request required');
 if(!validRevision(request.revision)||!record(request.input))
  throw new TypeError('explicit current nonnegative revision and structured input required');
 if(Object.keys(request.input).some(k=>injected.has(k)))
  throw new TypeError('caller-supplied proof, result or drawing steps are forbidden');
 if(request.input.revision!==undefined&&request.input.revision!==request.revision)
  throw new RangeError('stale source revision');
}
function verifiedAnimation(kind,plan,revision){
 if(plan.status!=='ready'){
  if(plan.mathematicallyVerified===true||
     (Array.isArray(plan.steps)&&plan.steps.length))
   throw new TypeError('unready plan cannot carry mathematically verified drawing steps');
  return {...plan,runtime:stages(kind,revision,'not-approved','blocked','blocked',
   plan.reason||'specialist proof or branch choice unavailable')};
 }
 const intents=plan.constructionIntents;
 if(plan.mathematicallyVerified!==true||plan.canonicalVerified!==true||
    plan.revision!==revision||!Array.isArray(intents)||
    !Array.isArray(plan.steps)||!plan.steps.length||!plan.timing||
    !Array.isArray(plan.timing.steps)||plan.timing.steps.length!==plan.steps.length)
  throw new TypeError('unified Math -> Intent -> DAG -> V5 boundary incomplete');
 const checked=validateConstructionIntentDAG(intents);
 if(!checked.ok)throw new TypeError('canonical DAG rejected: '+checked.errors.join('; '));
 if(intents.some((intent,index)=>
   intent.schema!==CONSTRUCTION_INTENT_VERSION||
   intent.source.revision!==revision||intent.source.unit!=='mm'||
   intent.id!==plan.steps[index]?.id))
  throw new TypeError('unified revision, unit or construction-step parity mismatch');
 if(kind==='inscribed-regular-polygon'){
  const result=plan.solverResult;
  const verdict=validateSolveResult(result);
  if(!verdict.ok||result.status!=='unique'||result.globallyUnique!==true||
    result.proofLevel!=='analytic')
   throw new TypeError('polygon canonical M3 result has no selected analytic proof');
 }else {
  const prior=plan.originalLesson;
  if(prior?.proof?.verified!==true||prior.readiness!=='ready'||
     prior.revision!==revision||prior.result?.unit!=='mm')
   throw new TypeError('02/03 specialist source proof or revision unavailable');
 }
 return {...plan,runtime:stages(kind,revision,'specialist-recomputed',
  'construction-intent-dag-validated','existing-v5-ready',
  'Structured parameters only; original image/real exercise remains unverified')};
}
function scopedSection(input,revision){
 if(!SECTION_KINDS.includes(input.kind))
  throw new TypeError('unsupported spatial specialist kind');
 // The trusted dispatcher RECOMPUTES geometry; never import a caller result.
 const evidence=runSection(input);
 const check=validateSolveResult(evidence);
 if(!check.ok)throw new TypeError('specialist evidence breaks shared SolveResult contract');
 const ok=evidence.geometryVerifiedWithinSpecialistScope===true;
 if(ok&&(evidence.sourceProblemConfirmed!==false||
    evidence.visibilityVerified!==false||evidence.globallyUnique!==null))
  throw new TypeError('specialist proof overclaimed a complete 3D drawing');
 return {
  status:ok?'geometry-only':'blocked',revision,kind:'spatial-section',
  specialistKind:input.kind,unit:ok?'mm':null,
  solveResult:evidence,mathematicallyVerified:false,
  geometryVerifiedWithinSpecialistScope:ok,
  constructionIntents:[],steps:[],timing:null,
  runtime:stages('spatial-section',revision,
   ok?'scoped-geometry-only':'not-approved',
   'not-available','not-available',
   'No verified 3D->first-angle Intent/V5 or visibility; not an end-to-end solved exercise')
 };
}
function runUnifiedMath(request){
 checkRequest(request);
 const {kind,input,sheet,revision}=request;
 if(kind==='spatial-section')return scopedSection(input,revision);
 if(kind==='inscribed-regular-polygon'){
  if(input.revision!==revision)throw new RangeError('polygon input revision required');
  return verifiedAnimation(kind,runPolygon(input,sheet),revision);
 }
 if(LIVE_KINDS.includes(kind))
  return verifiedAnimation(kind,runLive(kind,input,sheet,revision),revision);
 throw new TypeError('unsupported unified math specialist kind');
}
// Preserve the existing public call sites while moving their real execution
// through the SAME version, provenance, revision and M4 evidence gate.
function verifiedLiveIntentTimeline(kind,input,sheet,revision=0){
 return runUnifiedMath({kind,input,sheet,revision});
}
function verifiedPolygonIntentTimeline(input,sheet){
 return runUnifiedMath({kind:'inscribed-regular-polygon',input,
  sheet,revision:input?.revision});
}
module.exports={RUNTIME_VERSION,LIVE_KINDS,SECTION_KINDS,runUnifiedMath,
 verifiedLiveIntentTimeline,verifiedPolygonIntentTimeline};
