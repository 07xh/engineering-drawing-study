'use strict';
/**
 * V3.4 08-C3: explicitly reviewed R/diameter text hypothesis -> existing
 * per-field original-image mark and current confirmed MODEL-mm value.
 *
 * Never trusts OCR value as verified geometry, never infers a field from
 * proximity, and never makes a global uniqueness or G1 claim.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const object=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const size=i=>object(i)&&Number.isSafeInteger(i.width)&&Number.isSafeInteger(i.height)&&
 i.width>=24&&i.height>=24&&i.width<=10000&&i.height<=10000;
const box=(b,i)=>Array.isArray(b)&&b.length===4&&b.every(finite)&&
 b[0]>=0&&b[1]>=0&&b[2]>0&&b[3]>0&&
 b[0]+b[2]<=i.width&&b[1]+b[3]<=i.height;
function validateOcrDimension(candidate,image){
 if(!size(image)||!object(candidate)||
  !/^ocr_[a-z0-9_-]{1,50}$/i.test(candidate.id||'')||
  candidate.kind!=='dimension'||
  !['radius','diameter'].includes(candidate.dimensionKind)||
  candidate.coordinateSpace!=='original-image-px'||
  candidate.confirmed!==false||
  candidate.requiresHumanReview!==true||
  candidate.mathematicalProof!==false||
  !box(candidate.bbox,image)||
  typeof candidate.sourceText!=='string'||candidate.sourceText.length>80||
  !finite(candidate.numericValue)||candidate.numericValue<=0||
  !finite(candidate.recognitionScore)||candidate.recognitionScore<0||
  candidate.recognitionScore>1)
  throw new TypeError('untrusted OCR dimension candidate must include bounded original-image evidence');
 return {id:candidate.id,sourceText:candidate.sourceText,
  dimensionKind:candidate.dimensionKind,confidence:candidate.recognitionScore,
  bbox:[...candidate.bbox]};
}
/**
 * Must be called only from an explicit user review action with separately
 * confirmed numbers; "accepted" is a UI assertion, not authentication.
 */
function stageReviewedImageDimension({fieldReview,candidate,field,reviewedTextValueMm,
 currentModelValueMm,accepted,revision}={}){
 if(!fieldReview||typeof fieldReview.mark!=='function'||
    typeof fieldReview.confirm!=='function'||typeof fieldReview.required!=='function')
  throw new TypeError('existing field review controller required');
 const image=fieldReview.image,evidence=validateOcrDimension(candidate,image);
 if(accepted!==true||!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('explicit user review and current nonnegative revision required');
 if(!fieldReview.required().includes(field)||!['r1','r2','filletRadius'].includes(field))
  throw new TypeError('text dimension cannot imply the chosen mathematical field');
 if(field==='filletRadius'&&evidence.dimensionKind!=='radius')
  throw new TypeError('diameter cannot be assigned to a target connecting radius');
 if(!finite(reviewedTextValueMm)||reviewedTextValueMm<=0||
    !finite(currentModelValueMm)||currentModelValueMm<=0)
  throw new RangeError('separate confirmed positive millimetre text and field values required');
 const expectedRadius=evidence.dimensionKind==='diameter'?
  reviewedTextValueMm/2:reviewedTextValueMm;
 const tolerance=1e-3+1e-3*Math.abs(currentModelValueMm);
 if(!finite(expectedRadius)||Math.abs(currentModelValueMm-expectedRadius)>tolerance)
  throw new RangeError('reviewed R/diameter contradicts current mm field');
 // All validations happen before mutating the existing per-field review.
 // Field marking is NOT final acceptance: all other fields must still be
 // individually reviewed and state.accept() called independently.
 fieldReview.mark(field,evidence.bbox);
 fieldReview.confirm(field,currentModelValueMm);
 return Object.freeze({
  sourceId:evidence.id,sourceText:evidence.sourceText,
  field,revision,recognizedKind:evidence.dimensionKind,
  reviewedTextValueMm,currentModelValueMm,
  bbox:Object.freeze([...evidence.bbox]),
  sourceConfidence:evidence.confidence,
  unit:'mm',userReviewed:true,finalFieldSetAccepted:false,
  ocrAccuracyProven:false,geometryLinkProven:false,
  mathematicalProof:false,globallyUnique:null
 });
}
module.exports={validateOcrDimension,stageReviewedImageDimension};
