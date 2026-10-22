'use strict';
/**
 * Conservative manual prefill decision, NOT automated OCR acceptance.
 * A user's explicit click (and unit acknowledgement when omitted in text)
 * may populate the editable field; existing review/G1 guards stay mandatory.
 */
const {parseNotation}=require('./dimension-notation-candidates.cjs');
const RADIUS_FIELDS=new Set(['filletRadius','r1','r2']);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function chooseOcrRadiusPrefill(candidate,field,{unitAcknowledged=false}={}){
 const reject=reason=>({status:'blocked',reason,field:null,value:null});
 if(!RADIUS_FIELDS.has(field))
  return reject('OCR R/Φ labels can only suggest radius fields');
 if(!candidate||candidate.confirmed!==false||
  candidate.coordinateSpace!=='original-image-px'||
  !/^ocr_[0-9]+$/.test(candidate.id||''))
  return reject('untrusted OCR candidate missing original image provenance');
 const parsed=parseNotation(candidate.sourceText);
 if(!parsed||!['radius','diameter'].includes(parsed.dimensionKind)||
  parsed.dimensionKind!==candidate.dimensionKind||
  !finite(candidate.proposedRadiusValue)||
  Math.abs(candidate.proposedRadiusValue-parsed.proposedRadiusValue)>1e-9)
  return reject('OCR candidate differs from strict dimension interpretation');
 if(parsed.unitHint==='drawing-unit-unconfirmed'&&unitAcknowledged!==true)
  return reject('engineering drawing units must be explicitly acknowledged');
 const value=parsed.proposedRadiusValue;
 if(!(value>0&&value<=100000))
  return reject('invalid positive bounded metric radius');
 return {status:'ready-to-prefill',field,value,
  sourceId:candidate.id,
  note:'proposed value only; user must verify, confirm field and final geometry'};
}
module.exports={chooseOcrRadiusPrefill};
