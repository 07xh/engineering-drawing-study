'use strict';
/**
 * Optional diagnostic comparing TWO independently verified line dimensions
 * from the same original image. Agreement is not proof of a globally uniform
 * metric scale; disagreement must not be silently averaged away.
 */
const valid=r=>r&&r.schema==='draftai-manual-raster-scale/1'&&
 r.status==='human-reviewed-single-baseline-proposal'&&
 r.calibrationFrame==='original-image-px'&&r.verifiedDrawingScale===false&&
 typeof r.sourceId==='string'&&
 typeof r.mmPerPx==='number'&&Number.isFinite(r.mmPerPx)&&r.mmPerPx>0;
function compareReviewedRulers(first,second){
 if(!valid(first)||!valid(second)||first.sourceId===second.sourceId)
  throw new TypeError('distinct independently reviewed original-image segment rulers required');
 const mean=(first.mmPerPx+second.mmPerPx)/2;
 const relativeDifference=Math.abs(first.mmPerPx-second.mmPerPx)/mean;
 if(!Number.isFinite(relativeDifference))
  throw new RangeError('invalid two-ruler scale diagnostic');
 // A 3% agreement is an illustration threshold, NOT a standards tolerance.
 const threshold=0.03;
 const agrees=relativeDifference<=threshold;
 return Object.freeze({
  schema:'draftai-raster-ruler-crosscheck/1',
  status:agrees?'not-inconsistent-under-heuristic':'inconsistent-review-required',
  relativeDifference,heuristicThreshold:threshold,
  sourceIds:Object.freeze([first.sourceId,second.sourceId]),
  mayReusePrimarySuggestion:agrees,
  globallyUniformScaleProven:false,
  perspectiveCorrectionPerformed:false,
  independentMathProof:false
 });
}
module.exports={compareReviewedRulers};
