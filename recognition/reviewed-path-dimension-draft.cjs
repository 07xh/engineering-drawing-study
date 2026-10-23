'use strict';
/**
 * 08 → M2 existing contract bridge, NOT a solver or a second constraint type.
 *
 * Explicitly reviewed text -> finite leader -> curve association becomes an
 * existing ProblemDraft radius/diameter candidate with refs=[curveId].
 * Conversion requires a current user-reviewed original-image full circle,
 * TWO independently reviewed source line rulers, a consistent bounded
 * mm/original-pixel scale, and checked dimension-vs-circle residual.
 *
 * A pixel proximity score or one OCR detection can never select a geometry,
 * prove global uniqueness, or launch M3/ConstructionIntent/V5. Partial arcs
 * remain reviewable evidence, but cannot be used as a full-circle source.
 */
const {validateDraft,reviewCandidate,draftReadiness}=
 require('./problem-draft.cjs');
const {proposeDimensionPaths,reviewDimensionPath}=
 require('./reviewed-dimension-path.cjs');
const {suggestMillimetresPerImagePixel}=
 require('../labs/manual-raster-scale-calibration.cjs');
const {compareReviewedRulers}=
 require('../labs/manual-raster-ruler-crosscheck.cjs');
const {prepareConfirmedFillet}=
 require('../integration/v31-confirmed-svg-fillet-v5.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const witnessed=new WeakSet();
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,y)=>Number.isSafeInteger(x)&&Number.isSafeInteger(y)&&x===y;
const bboxClose=(x,b)=>Array.isArray(b)&&b.length===4&&
 [x.x,x.y,x.width,x.height].every((v,i)=>finite(v)&&
 Math.abs(v-b[i])<=Math.max(1e-6,Math.abs(b[i])*1e-7));
function confirmRuler(entry,d,image){
 if(!object(entry)||Object.keys(entry).sort().join(',')!==
  'confirmed,knownLengthMm,sourceId'||entry.confirmed!==true)
  throw new TypeError('exact independently reviewed ruler with source ID required');
 const source=d.candidates.find(c=>c.id===entry.sourceId);
 if(source?.kind!=='segment'||source.reviewStatus!=='confirmed'||
   source.geometry?.frame!=='drawing-px')
  throw new TypeError('ruler must be a confirmed source ProblemDraft segment');
 return suggestMillimetresPerImagePixel({
  from:source.geometry.from,to:source.geometry.to,
  image,sourceId:source.id,knownLengthMm:entry.knownLengthMm,
  explicitlyReviewed:true
 });
}
function makeDimensionConstraint({
 draft,expectedRevision,association,sourceEpoch,currentSourceEpoch,
 calibration,selectedAlternativesReviewed=false,
 editedGeometryReviewed=false,calibrationReviewed=false,
 targetKindConfirmed=false
}={}){
 const d=validateDraft(draft);
 if(!exact(expectedRevision,d.revision))
  throw new RangeError('stale ProblemDraft revision');
 if(!object(association)||!object(calibration)||
    !exact(sourceEpoch,currentSourceEpoch)||
    !exact(association.sourceEpoch,sourceEpoch)||
    !exact(association.currentSourceEpoch,currentSourceEpoch)||
    !exact(association.revision,d.revision)||
    !exact(association.expectedRevision,d.revision))
  throw new RangeError('stale image/path/review source revision');
 if(association.image?.width!==d.image.width||
    association.image?.height!==d.image.height||
    d.sourceToDrawing.join(',')!=='1,0,0,0,1,0,0,0,1')
  throw new TypeError('original image and identity drawing-px frames must agree');
 // Never rely on a client-supplied "approved" association snapshot.
 const ranked=proposeDimensionPaths(association);
 const review=reviewDimensionPath(association);
 const selected=ranked.proposals.find(p=>p.id===review.selectedPathId);
 if(!selected)throw new TypeError('selected association not in current proposals');
 const alternatives=ranked.proposals.filter(p=>p.id!==review.selectedPathId)
  .map(p=>({id:p.id,curveId:p.curveCandidateId,pathKind:p.pathKind}));
 if(alternatives.length&&selectedAlternativesReviewed!==true)
  return Object.freeze({
   status:'ambiguous-associations-require-user-review',
   alternativePaths:alternatives,selectedPathId:review.selectedPathId,
   draft:null,calibration:null,preparedProblem:null,
   solverReady:false,constructionIntentReady:false,
   globallyUnique:null,blindExerciseAccepted:false
  });
 if(editedGeometryReviewed!==true||calibrationReviewed!==true||
    targetKindConfirmed!==true)
  throw new TypeError('confirmed source geometry, target kind, and independent scale review required');
 const target=d.candidates.find(c=>c.id===review.curveCandidateId);
 if(!target||target.kind!==review.curveKind||
    target.reviewStatus!=='confirmed'||target.geometry?.frame!=='drawing-px'||
    !bboxClose(target.bbox,review.curveImageBox))
  throw new TypeError('target source geometry must be user-confirmed in this same ProblemDraft');
 // A source arc is NOT an entire circle, and cannot be promoted into the
 // current M3 finite-fillet circle input without a separate arc contract.
 if(target.kind==='arc')return Object.freeze({
  status:'partial-arc-requires-specialist-review',
  targetId:target.id,selectedPathId:review.selectedPathId,
  alternativePaths:alternatives,
  draft:null,calibration:null,preparedProblem:null,
  solverReady:false,constructionIntentReady:false,
  globallyUnique:null,blindExerciseAccepted:false
 });
 for(const id of review.leaderCandidateIds){
  const raw=association.lines.find(x=>x.id===id);
  const checked=d.candidates.find(x=>x.id===id);
  const g=checked?.geometry;
  const same=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=1e-6;
  if(!raw||checked?.kind!=='segment'||
     checked.reviewStatus!=='confirmed'||g?.frame!=='drawing-px'||
     !bboxClose(checked.bbox,raw.bbox)||
     !['from','to'].every(k=>same(g[k]?.x,raw[k]?.x)&&
      same(g[k]?.y,raw[k]?.y)))
   throw new TypeError('reviewed leader must match current confirmed ProblemDraft segment');
 }
 const {first,second,originPx,yAxis}=calibration;
 if(!object(first)||!object(second)||first.sourceId===second.sourceId)
  throw new TypeError('two distinct human-confirmed source ruler segments required');
 if(!object(originPx)||!finite(originPx.x)||!finite(originPx.y)||
    !['up','down'].includes(yAxis))
  throw new TypeError('explicit drawing-px origin and Y orientation required');
 const rulerA=confirmRuler(first,d,d.image),rulerB=confirmRuler(second,d,d.image);
 const agreement=compareReviewedRulers(rulerA,rulerB);
 if(agreement.mayReusePrimarySuggestion!==true)
  return Object.freeze({
   status:'inconsistent-calibration-review-required',
   ratioDifference:agreement.relativeDifference,
   sourceIds:agreement.sourceIds,
   draft:null,calibration:null,preparedProblem:null,
   solverReady:false,constructionIntentReady:false,
   globallyUnique:null,blindExerciseAccepted:false
  });
 const mmPerPx=rulerA.mmPerPx;
 const expectedRadiusMm=target.geometry.radiusPx*mmPerPx;
 const residualMm=expectedRadiusMm-review.proposedRadiusMm;
 const toleranceMm=1e-3+review.proposedRadiusMm*.005; // 0.5% heuristic
 if(!finite(expectedRadiusMm)||!finite(residualMm)||
    Math.abs(residualMm)>toleranceMm)
  return Object.freeze({
   status:'dimension-scale-conflict',residualMm,toleranceMm,
   draft:null,calibration:null,preparedProblem:null,
   solverReady:false,constructionIntentReady:false,
   globallyUnique:null,blindExerciseAccepted:false
  });
 const id=association.dimension.id;
 if(d.candidates.some(c=>c.id===id)||d.candidates.length>=512)
  throw new TypeError('duplicate dimension ID or exhausted ProblemDraft capacity');
 const imageBox=review.originalImageBox;
 const draftWithUnconfirmed=validateDraft({...d,candidates:[
  ...d.candidates,{
   id,kind:'dimension',reviewStatus:'unconfirmed',method:'ocr',
   confidence:association.dimension.recognitionScore,
   bbox:{x:imageBox[0],y:imageBox[1],width:imageBox[2],height:imageBox[3]},
   geometry:null,dimension:{
    kind:review.dimensionKind,rawText:association.dimension.sourceText,
    value:review.reviewedTextValueMm,unit:'mm',refs:[target.id]
   }
  }
 ]});
 const output=reviewCandidate(draftWithUnconfirmed,{
  id,expectedRevision:draftWithUnconfirmed.revision,decision:'confirmed'
 });
 const metric={frame:'drawing-px',originPx:{x:originPx.x,y:originPx.y},
  mmPerPx,yAxis,reviewedBy:'user',revision:output.revision};
 const result=Object.freeze({
  status:'dimension-attached-to-existing-draft',
  draft:output,calibration:Object.freeze(metric),
  readiness:draftReadiness(output),
  dimensionId:id,sourceTargetId:target.id,
  selectedPathId:review.selectedPathId,
  alternativePaths:alternatives,
  dimensionalResidualMm:residualMm,
  scaleRelativeDifference:agreement.relativeDifference,
  sourceEvidenceOnly:true,metricScaleGloballyProven:false,
  geometryAndDimensionReviewed:true,
  solverReady:false,constructionIntentReady:false,
  globallyUnique:null,answerMark:review.answerMark,
  answerIsolationVerified:false,blindExerciseAccepted:false
 });
 witnessed.add(result);
 return result;
}
/**
 * The ONLY optional next step uses the existing M3 input preflight; no
 * synthetic SolveResult, silent branch choice, or V5 player is created.
 * Other unconfirmed candidates and unresolved dimensions block this gate.
 */
function prepareSpecialistInput(attached,{
 kind,sourceIds,filletRadiusMm,options={},expectedRevision,currentDraft
}={}){
 if(!object(attached)||!witnessed.has(attached)||
    attached.status!=='dimension-attached-to-existing-draft'||
    attached.solverReady!==false||!attached.draft||
    !exact(expectedRevision,attached.draft.revision)||
    !currentDraft||!exact(currentDraft.revision,expectedRevision)||
    JSON.stringify(validateDraft(currentDraft))!==
     JSON.stringify(validateDraft(attached.draft)))
  throw new TypeError('current reviewed ProblemDraft dimension required');
 // The actual R0 M3 gate verifies ALL selected source geometries, remaining
 // dimension-to-mm residuals, explicit side/mode and the full input contract.
 const prepared=prepareConfirmedFillet({
  draft:attached.draft,expectedRevision,
  calibration:attached.calibration,kind,sourceIds,
  filletRadiusMm,options
 });
 return Object.freeze({
  status:'reviewed-specialist-input-ready',
  problem:prepared.problem,
  sourceProvenance:prepared.provenance,
  // A typed model input is NOT a mathematical solution. The existing M3 and
  // ConstructionIntent/V5 path must execute with its own branch checks.
  solverExecuted:false,constructionIntentReady:false,v5Triggered:false,
  globallyUnique:null,
  answerIsolationVerified:false,blindExerciseAccepted:false
 });
}
module.exports={makeDimensionConstraint,prepareSpecialistInput};
