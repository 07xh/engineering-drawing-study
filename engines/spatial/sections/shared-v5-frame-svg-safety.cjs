'use strict';
/**
 * Common coordinate and attribute serializers for the EXISTING spatial V5
 * SVG frame consumers. Does not infer mathematical validity or stroke styles.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function formatFrameNumber(n,errorMessage='unsafe SVG coordinate'){
 if(!finite(n)||Math.abs(n)>1e9)throw new RangeError(errorMessage);
 return String(Number(n.toFixed(6)));
}
function escapeFrameAttribute(s){
 return String(s).replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'
 })[c]);
}
module.exports={formatFrameNumber,escapeFrameAttribute};
