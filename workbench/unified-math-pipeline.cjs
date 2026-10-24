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
const {assertM3ToV5Consistency,assertConeM3ToV5Consistency}=require('./m3-v5-consistency-gate.cjs');
const {classifyConePlane}=require('../engines/spatial/sections/cone-plane-classifier.cjs');
const {coneSpatialV5Preview}=require('./cone-spatial-v5-preview.cjs');
const {solveVerifiedSectionEvidence}=
 require('../engines/spatial/sections/verified-section-evidence.cjs');
const {validateSolveResult}=require('../core/contracts/solve-result.js');
const {solveAffinePointConstraints}=require('../core/constraints/affine-point-unknown-solver.cjs');
const {solveNonlinearPointCandidates}=require('../core/constraints/nonlinear-point-candidates.cjs');
const {buildScopedSpatialSectionV5Preview}=require('./spatial-section-v5-parity.cjs');
const {deriveScopedSectionVisibility}=require('./spatial-section-visibility-evidence.cjs');
const {bindScopedSectionEvidenceToV5}=
 require('./spatial-section-evidence-v5-binding.cjs');
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
function evaluateScopedSpatialSection({input,revision,sheet,visibilityReview}){
 if(sheet!==undefined&&sheet!==null)
  throw new TypeError('spatial 3D proof cannot accept a 2D sheet conversion');
 if(!input||typeof input!=='object'||Array.isArray(input)||
    !SPATIAL_KINDS.has(input.kind))
  throw new TypeError('unsupported scoped 3D section');
 const evidence=solveVerifiedSectionEvidence(input); // trusted M3 re-solve
 const checked=validateSolveResult(evidence);
 if(!checked.ok)throw new TypeError('invalid canonical M2 spatial evidence');
 const qualified=evidence.geometryVerifiedWithinSpecialistScope===true;
 const constructionPreview=qualified?
  buildScopedSpatialSectionV5Preview({input,evidence,revision}):null;
 const visibilityEvidence=qualified?
  deriveScopedSectionVisibility({input,evidence,revision,review:visibilityReview}):null;
 const sectionEvidenceV5Bindings=constructionPreview&&visibilityEvidence?
  bindScopedSectionEvidenceToV5({preview:constructionPreview,
   visibilityEvidence,revision}):null;
 if(qualified&&(evidence.globallyUnique!==null||
    evidence.sourceProblemConfirmed!==false||
    evidence.visibilityVerified!==false||
    evidence.proofOfGlobalUniqueness!==false))
  throw new TypeError('scoped proof cannot certify a full spatial answer');
 return Object.freeze({
  status:qualified?'geometry-only':'not-verified',
  kind:'spatial-section',specialistKind:input.kind,revision,
  solveResult:evidence,mathematicallyVerified:false,
  // Only independently audited polygon perimeter edges; never full
  // visibility, retained solid, global SolveResult or V5 authorization.
  sectionPerimeterGeometry:qualified?(evidence.sectionPerimeterGeometry??null):null,
  sectionConstructionPreview:constructionPreview,
  // Open interiors are not a full hidden-line drawing or endpoint proof.
  sectionVisibilityEvidence:visibilityEvidence,
  // Links trusted M3 open-edge scope to existing ConstructionStep/V5 IDs.
  // This is an annotation, NOT a canonical ConstructionIntent or line style.
  sectionEvidenceV5Bindings,
  geometryVerifiedWithinSpecialistScope:qualified,
  verifiedVisibility:false,sourceProblemConfirmed:false,
  constructionIntents:[],steps:[],timing:null,
  unifiedMathPipeline:qualified?'m3-scoped-evidence-only/1':'m3-blocked/1',
  // Explicit acceptance boundary: mathematical scoped geometry != drawable
  // 3D/2D projection, original-image provenance or real-exercise success.
  v5Ready:false,realExerciseAccepted:false
 });
}

/**
 * Official typed M3 boundary for the already-supported finite-cone branches.
 * The 04 analytic solver chooses the actual cut; source-backed Spatial Intent
 * and the ONE V5 player are reused. 3D visibility and textbook-answer proof
 * remain explicitly unverified. Never accept caller-provided solve evidence.
 */
function evaluateConePlaneSection({input,revision,sheet}){
 if(sheet!==undefined&&sheet!==null)
  throw new TypeError('3D cone uses verified first-angle layout, not an injected 2D sheet');
 const allowed=['kind','cone','plane','sourceConfirmed','samples','requestedKind',
  'retainedHalfspace','observerDirections'];
 if(!input||typeof input!=='object'||Array.isArray(input)||
    Object.keys(input).some(k=>!allowed.includes(k))||
    input.kind!=='cone-plane')
  throw new TypeError('trusted cone-plane parameters required, not caller proof');
 const blocked=(status,reason,classification=null)=>Object.freeze({
  status,reason,kind:'cone-plane-section',revision,sectionClassification:classification,
  mathematicallyVerified:status==='none',
  geometryVerifiedWithinSpecialistScope:status==='none',
  verifiedVisibility:false,sourceProblemConfirmed:false,
  spatialConstructionIntent:null,canonicalSpatialIntentVerified:false,
  steps:[],timing:null,player:null,v5Ready:false,
  v5ProjectionPreviewReady:false,realExerciseAccepted:false,
  unifiedMathPipeline:'m3-spatial-cone-classification/1'
 });
 if(input.sourceConfirmed!==true)
  return blocked('not-verified','cone and cutting plane need confirmed model-mm parameters');
 const samples=input.samples===undefined?64:input.samples;
 const classification=classifyConePlane(input.cone,input.plane,{samples});
 if(classification.status==='none')
  return blocked('none',classification.reason,classification);
 if(classification.status!=='ready')
  return blocked('not-verified',classification.reason,classification);
 const requestedKind=input.requestedKind??'auto';
 if(!['auto','full-ellipse','clipped-ellipse'].includes(requestedKind))
  throw new TypeError('unsupported section routing request');
 if(requestedKind!=='auto'&&requestedKind!==classification.kind)
  return blocked('not-verified','所选截线类型与实际数学分类不一致，请切换自动判断',classification);
 const proofOptions={kind:classification.kind,sourceConfirmed:true,
  revision,samples,presentationMode:'split-sheet',provenGuideDag:true};
 if(input.retainedHalfspace!==undefined)
  proofOptions.retainedHalfspace=input.retainedHalfspace;
 if(input.observerDirections!==undefined)
  proofOptions.observerDirections=input.observerDirections;
 const preview=coneSpatialV5Preview(input.cone,input.plane,proofOptions);
 if(preview.status!=='preview-only')
  throw new RangeError('classified cone cut disagrees with trusted V5 source');
 assertConeM3ToV5Consistency({preview,revision});
 return Object.freeze({...preview,kind:'cone-plane-section',
  sectionClassification:classification,
  spatialConstructionIntent:preview.spatialIntent,
  canonicalSpatialIntentVerified:true,
  unifiedMathPipeline:'m3-spatial-intent-single-v5-preview/1',
  sourceProblemConfirmed:false,v5Ready:false,realExerciseAccepted:false
 });
}
function evaluateUnifiedMath({kind,input,sheet,revision=0,visibilityReview}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current input revision required');
 if(input?.revision!==undefined&&input.revision!==revision)
  throw new RangeError('stale specialist input revision');
 if(visibilityReview!==undefined&&kind!=='spatial-section')
  throw new TypeError('spatial view rays are only for scoped section evidence');
 if(kind==='point-constraint-system'){
  if(sheet!==undefined&&sheet!==null)
   throw new TypeError('nonlinear model-mm constraints cannot consume sheet pixels');
  if(!input||typeof input!=='object'||Array.isArray(input))
   throw new TypeError('reviewed model-mm unknown point problem required');
  const {revision:inputRevision,...source}=input;
  const evidence=solveNonlinearPointCandidates({...source,revision});
  return Object.freeze({...evidence,
   unifiedMathPipeline:'m3-seeded-nonlinear-candidates-no-v5/1'});
 }
 if(kind==='affine-point-system'){
  if(sheet!==undefined&&sheet!==null)
   throw new TypeError('affine point constraints use model-mm, never sheet pixels');
  if(!input||typeof input!=='object'||Array.isArray(input))
   throw new TypeError('model-mm affine point problem required');
  const {revision:inputRevision,...givens}=input;
  const result=solveAffinePointConstraints({...givens,revision});
  return Object.freeze({...result,kind:'affine-point-system',
   unifiedMathPipeline:'m3-scoped-affine-unknowns-no-v5/1'});
 }
 if(kind==='spatial-section')
  return evaluateScopedSpatialSection({input,revision,sheet,visibilityReview});
 if(kind==='cone-plane-section')
  return evaluateConePlaneSection({input,revision,sheet});
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
