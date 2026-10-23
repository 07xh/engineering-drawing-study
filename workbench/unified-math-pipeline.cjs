'use strict';
/**
 * The single production M3 -> M4 entry for currently trusted 02/03 families.
 * Reuses existing specialists, independent former-path parity, canonical
 * Intent and ONE V5. No new solver, result schema, geometry inference or
 * separate playback implementation is introduced.
 *
 * Extension rule: a new M3 specialist must recompute proof and emit a
 * canonical Intent; it cannot register raw client steps as a mathematical
 * answer. Source image review remains upstream of this API.
 */
const {filletTimeline,pointTimeline}=require('./verified-plan-v5-bridge.cjs');
const {verifiedConstructionIntentV1}=require('./verified-construction-intent-v1.cjs');
const {verifiedPolygonIntentTimeline}=require('./verified-polygon-intent-v1.cjs');
const {assertM3ToV5Consistency}=require('./m3-v5-consistency-gate.cjs');
const {solveVerifiedSectionEvidence}=
 require('../engines/spatial/sections/verified-section-evidence.cjs');
const {validateSolveResult}=require('../core/contracts/solve-result.js');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const FILLET_KINDS=new Set(['segments','circles','segment-circle']);
const DEFAULT_POINT_SHEET={origin:{x:360,y:175},scale:4};
const SPATIAL_KINDS=new Set([
 'rectangular-prism','rectangular-pyramid','cylinder-lateral','sphere-surface'
]);
/**
 * Run a spatial M3 specialist through the SAME unified request boundary.
 * This returns independently recomputed, limited-scope M2 evidence ONLY.
 * No geometry, visibility, ConstructionIntent, DAG or V5 are fabricated.
 * The true 3D->first-angle->V5 path must separately pass its own proofs.
 */
function evaluateScopedSpatialSection({input,revision,sheet}){
 if(sheet!==undefined&&sheet!==null)
  throw new TypeError('spatial 3D proof cannot accept a 2D sheet conversion');
 if(!input||typeof input!=='object'||Array.isArray(input)||
    !SPATIAL_KINDS.has(input.kind))
  throw new TypeError('unsupported scoped 3D section');
 const evidence=solveVerifiedSectionEvidence(input); // trusted M3 re-solve
 const checked=validateSolveResult(evidence);
 if(!checked.ok)throw new TypeError('invalid canonical M2 spatial evidence');
 const qualified=evidence.geometryVerifiedWithinSpecialistScope===true;
 if(qualified&&(evidence.globallyUnique!==null||
    evidence.sourceProblemConfirmed!==false||
    evidence.visibilityVerified!==false||
    evidence.proofOfGlobalUniqueness!==false))
  throw new TypeError('scoped proof cannot certify a full spatial answer');
 return Object.freeze({
  status:qualified?'geometry-only':'not-verified',
  kind:'spatial-section',specialistKind:input.kind,revision,
  solveResult:evidence,mathematicallyVerified:false,
  geometryVerifiedWithinSpecialistScope:qualified,
  verifiedVisibility:false,sourceProblemConfirmed:false,
  constructionIntents:[],steps:[],timing:null,
  unifiedMathPipeline:qualified?'m3-scoped-evidence-only/1':'m3-blocked/1',
  // Explicit acceptance boundary: mathematical scoped geometry != drawable
  // 3D/2D projection, original-image provenance or real-exercise success.
  v5Ready:false,realExerciseAccepted:false
 });
}

function evaluateUnifiedMath({kind,input,sheet,revision=0}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current input revision required');
 if(input?.revision!==undefined&&input.revision!==revision)
  throw new RangeError('stale specialist input revision');
 if(kind==='spatial-section')
  return evaluateScopedSpatialSection({input,revision,sheet});
 if(kind==='inscribed-polygon'){
  if(input?.revision!==revision)
   throw new RangeError('stale polygon input revision');
  const result=verifiedPolygonIntentTimeline(input,sheet);
  if(result.status!=='ready')return result;
  if(result.mathematicallyVerified!==true||
     result.canonicalVerified!==true||result.revision!==revision)
   throw new RangeError('polygon M3/Intent evidence not ready');
  assertM3ToV5Consistency({
   revision,intents:result.constructionIntents,
   steps:result.steps,timing:result.timing,sheet
  });
  return Object.freeze({...result,unifiedMathPipeline:'m3-canonical-intent-v5/1'});
 }
 if(kind!=='point-projection'&&!FILLET_KINDS.has(kind))
  throw new TypeError('unsupported M3 specialist kind');
 const projection=kind==='point-projection';
 const paper=projection?(input?.sheetTransform||DEFAULT_POINT_SHEET):sheet;
 // Both former and canonical paths recompute the REAL specialist.
 const previous=projection?pointTimeline(input,revision):
  filletTimeline(kind,input,sheet,revision);
 const canonical=verifiedConstructionIntentV1(kind,input,sheet,revision);
 if(previous.status!=='ready'){
  if(canonical.status==='ready')
   throw new RangeError('canonical/legacy readiness disagreement');
  return previous;
 }
 if(canonical.status!=='ready'||canonical.mathematicallyVerified!==true||
    canonical.revision!==revision||
    canonical.selectedBranchId!==(previous.selectedBranchId??null)||
    !same(canonical.steps,previous.steps)||!same(canonical.timing,previous.timing))
  throw new RangeError('canonical intent or original V5 parity unavailable');
 assertM3ToV5Consistency({
  revision,intents:canonical.intents,steps:canonical.steps,
  timing:canonical.timing,sheet:paper
 });
 return Object.freeze({...previous,steps:canonical.steps,timing:canonical.timing,
  constructionIntentSchema:canonical.schema,
  constructionIntents:canonical.intents,canonicalVerified:true,
  unifiedMathPipeline:'m3-canonical-intent-v5/1'});
}
module.exports={evaluateUnifiedMath};
