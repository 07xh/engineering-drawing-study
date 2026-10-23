'use strict';
/**
 * Existing browser-native dimension candidates -> explicitly reviewed
 * cone BASE radius input. This bridges recognition to a field, NOT to a
 * verified cone, Plane, SolveResult, 3D SpatialIntent or V5 itself.
 * The user must verify numerical text, mm units and the exact dimension
 * leader/geometry association. No automatic answer/blind-test certification.
 */
const {validateOcrDimension}=
 require('./reviewed-image-dimension-field.cjs');
const {parseNotation}=
 require('./dimension-notation-candidates.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function reviewConeBaseRadiusCandidate({
 candidate,image,sourceEpoch,currentSourceEpoch,
 reviewedTextValueMm,unitsConfirmed=false,baseCircleLinkConfirmed=false,
 userAccepted=false,answerMark='unknown'
}={}){
 if(!Number.isSafeInteger(sourceEpoch)||sourceEpoch<0||
    sourceEpoch!==currentSourceEpoch)
  throw new RangeError('stale image evidence cannot change cone conditions');
 if(!['unknown','contains-answers','no-visible-answers'].includes(answerMark))
  throw new TypeError('explicit review of answer markings required');
 if(unitsConfirmed!==true||baseCircleLinkConfirmed!==true||userAccepted!==true)
  throw new TypeError('mm units, cone base-circle link, and reviewed value must be accepted independently');
 const evidence=validateOcrDimension(candidate,image);
 const parsed=parseNotation(evidence.sourceText);
 if(!parsed||parsed.dimensionKind!==evidence.dimensionKind||
    !finite(candidate.proposedRadiusValue)||
    Math.abs(candidate.proposedRadiusValue-parsed.proposedRadiusValue)>1e-8)
  throw new TypeError('OCR proposal conflicts with the existing strict R/diameter parser');
 if(!finite(reviewedTextValueMm)||reviewedTextValueMm<=0||
    reviewedTextValueMm>100000)
  throw new RangeError('positive bounded manually reviewed text value in mm required');
 const radiusMm=evidence.dimensionKind==='diameter'?
   reviewedTextValueMm/2:reviewedTextValueMm;
 if(!finite(radiusMm)||radiusMm<=0)
  throw new RangeError('finite cone base radius required');
 return Object.freeze({
  status:'editable-mm-field-proposal',field:'coneRadius',radiusMm,
  sourceCandidateId:evidence.id,
  sourceText:evidence.sourceText,
  imageEpoch:sourceEpoch,
  originalImageBox:Object.freeze([...evidence.bbox]),
  dimensionKind:evidence.dimensionKind,
  units:'mm',
  reviewedTextValueMm,
  association:'user-confirmed-cone-base-circle',
  sourceReviewConfirmed:true,
  imageRecognizedGeometry:false,
  coneHeightVerified:false,
  sectionPlaneVerified:false,
  entireProblemReviewed:false,
  independentAnswerIsolationVerified:false,
  answerMark,
  sourceContainsMarkedAnswer:answerMark==='contains-answers',
  blindExercisePassed:false,
  mathematicalProof:false,
  solveTriggered:false,
  v5Triggered:false
 });
}
module.exports={reviewConeBaseRadiusCandidate};
