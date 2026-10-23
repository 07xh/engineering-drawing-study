'use strict';
/**
 * Image-local scale consistency guard. Two independent human-reviewed
 * statements (finite line length and complete-circle R/Φ) are checked
 * against corrected primitives in the SAME current ProblemDraft.
 * Similarity is NOT proof of a uniform drawing scale or camera geometry.
 */
const {validateDraft}=require('../recognition/problem-draft.cjs');
const {suggestMillimetresPerImagePixel}=
 require('./manual-raster-scale-calibration.cjs');
const {proposeCircleScale,acceptCircleScale}=
 require('./local-raster-circle-scale.cjs');
const {checkPixelGeometry}=require('./local-raster-fillet-import.cjs');
function compareLineCircleMetricEvidence({
 draft,expectedRevision,lineId,circleId,editedLine,editedCircle,
 knownLengthMm,dimensionKind,reviewedValueMm,
 lineConfirmed,circleConfirmed
}={}){
 const d=validateDraft(draft);
 if(!Number.isSafeInteger(expectedRevision)||d.revision!==expectedRevision)
  throw new RangeError('same-photo calibration comparison requires current draft revision');
 if(typeof lineId!=='string'||typeof circleId!=='string'||
  lineId===circleId)
  throw new TypeError('two distinct selected source primitives required');
 const segment=d.candidates.find(c=>c.id===lineId);
 const circle=d.candidates.find(c=>c.id===circleId);
 if(segment?.kind!=='segment'||circle?.kind!=='circle')
  throw new TypeError('reviewed finite line and full circle required');
 if(lineConfirmed!==true||circleConfirmed!==true)
  throw new TypeError('both known dimensions and source associations need separate human confirmation');
 const line=checkPixelGeometry(segment,editedLine);
 const ruler=suggestMillimetresPerImagePixel({
  from:line.from,to:line.to,knownLengthMm,image:d.image,
  sourceId:lineId,explicitlyReviewed:true
 });
 const circleInput={draft:d,expectedRevision:d.revision,circleId,
  editedCircle,dimensionKind,reviewedValueMm};
 const proposal=proposeCircleScale(circleInput);
 const reviewed=acceptCircleScale({
  ...circleInput,proposal,confirmed:true
 });
 const mean=(ruler.mmPerPx+reviewed.mmPerPx)/2;
 const relativeDifference=Math.abs(ruler.mmPerPx-reviewed.mmPerPx)/mean;
 if(!Number.isFinite(relativeDifference))throw new RangeError('unusable scale ratio');
 const threshold=0.03; // diagnostic heuristic, not a manufacturing tolerance
 const agreement=relativeDifference<=threshold;
 return Object.freeze({
  schema:'draftai-raster-mixed-scale-audit/1',
  status:agreement?'not-inconsistent-under-heuristic':'inconsistent-review-required',
  sourceRevision:d.revision,
  lineId,circleId,
  lineMmPerPx:ruler.mmPerPx,circleMmPerPx:reviewed.mmPerPx,
  relativeDifference,heuristicThreshold:threshold,
  mayReuseCurrentScaleSuggestion:agreement,
  approvedModelGeometry:false,
  globallyUniformScaleProven:false,
  perspectiveCorrectionPerformed:false,
  mathematicalProof:false,
  globallyUnique:null
 });
}
module.exports={compareLineCircleMetricEvidence};
