'use strict';
/**
 * 08 / R0: one manually reviewed source circle and R/Φ text -> a
 * PROVISIONAL uniform mm-per-pixel scale. OCR text cannot supply consent.
 * Neither the drawing's metric calibration nor geometry is independently
 * proved by this arithmetic.
 */
const {validateDraft}=require('../recognition/problem-draft.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function inputs({draft,expectedRevision,circleId,editedCircle,
 dimensionKind,reviewedValueMm}={}){
 const d=validateDraft(draft);
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision!==d.revision)
  throw new RangeError('stale raster scale source revision');
 if(typeof circleId!=='string'||!circleId)
  throw new TypeError('explicit source circle ID required');
 const source=d.candidates.find(c=>c.id===circleId);
 if(!source||source.kind!=='circle'||source.geometry?.frame!=='drawing-px')
  throw new TypeError('scale requires a selected complete circle, not an arc or line');
 if(!obj(editedCircle)||Object.keys(editedCircle).sort().join(',')!=='center,radiusPx'||
    !obj(editedCircle.center)||Object.keys(editedCircle.center).sort().join(',')!=='x,y')
  throw new TypeError('explicit edited source circle center/radius required');
 const {center,radiusPx}=editedCircle;
 if(!finite(center.x)||!finite(center.y)||!finite(radiusPx)||radiusPx<=0||
    center.x-radiusPx<0||center.y-radiusPx<0||
    center.x+radiusPx>d.image.width||center.y+radiusPx>d.image.height)
  throw new RangeError('corrected calibration circle must be fully inside original photo');
 if(!['radius','diameter'].includes(dimensionKind)||
    !finite(reviewedValueMm)||reviewedValueMm<=0)
  throw new TypeError('explicit positive user-reviewed R or Φ millimetre value required');
 const radiusMm=dimensionKind==='diameter'?reviewedValueMm/2:reviewedValueMm;
 const mmPerPx=radiusMm/radiusPx;
 if(!finite(mmPerPx)||mmPerPx<=1e-12||mmPerPx>=1e6)
  throw new RangeError('metric scale out of supported finite calibration range');
 return {draftRevision:d.revision,circleId,
  correctedCircle:{center:{x:center.x,y:center.y},radiusPx},
  dimensionKind,reviewedValueMm,radiusMm,mmPerPx};
}
function proposeCircleScale(input){
 const p=inputs(input);
 return Object.freeze({
  ...p,
  sourceFrame:'original-image-px',
  unit:'mm/pixel',
  status:'needs-human-review',
  sourceGeometryVerified:false,metricCalibrationMathematicallyProven:false,
  ocrAccuracyProven:false,globallyUnique:null
 });
}
function acceptCircleScale({proposal,confirmed,...input}={}){
 if(confirmed!==true)
  throw new TypeError('separate explicit scale association approval required');
 if(!obj(proposal)||proposal.status!=='needs-human-review')
  throw new TypeError('current unconfirmed scale suggestion required');
 const current=proposeCircleScale(input);
 if(proposal.draftRevision!==current.draftRevision||
    proposal.circleId!==current.circleId||
    proposal.dimensionKind!==current.dimensionKind||
    proposal.reviewedValueMm!==current.reviewedValueMm||
    proposal.mmPerPx!==current.mmPerPx||
    proposal.correctedCircle?.radiusPx!==current.correctedCircle.radiusPx||
    proposal.correctedCircle?.center?.x!==current.correctedCircle.center.x||
    proposal.correctedCircle?.center?.y!==current.correctedCircle.center.y)
  throw new RangeError('stale source, corrected circle or mm value invalidates calibration proposal');
 return Object.freeze({
  ...current,
  status:'user-reviewed-suggestion',
  userReviewed:true,
  sourceGeometryVerified:false,
  metricCalibrationMathematicallyProven:false,
  ocrAccuracyProven:false,
  globallyUnique:null
 });
}
module.exports={proposeCircleScale,acceptCircleScale};
