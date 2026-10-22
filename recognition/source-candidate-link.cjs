'use strict';
/**
 * Adapt untrusted detector pixels to the original image annotation viewport.
 * Does NOT construct a metric geometry point, assert an OCR dimension, or
 * attest a source is correct. User must choose field and confirm its value.
 */
const validSize=x=>x&&Number.isSafeInteger(x.width)&&
 Number.isSafeInteger(x.height)&&x.width>=24&&x.height>=24&&
 x.width<=10000&&x.height<=10000;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function locateCandidate(candidate,analysis,original){
 if(!validSize(analysis)||!validSize(original))
  throw new RangeError('bounded original and analysis image dimensions required');
 if(!candidate||!['line','circle','arc'].includes(candidate.kind)||
   candidate.coordinateSpace!=='image-px'||
   typeof candidate.id!=='string'||!/^((line|curve)_[0-9]+)$/.test(candidate.id)||
   !Array.isArray(candidate.bbox)||candidate.bbox.length!==4||
   !candidate.bbox.every(finite))
  throw new TypeError('untrusted image candidate or malformed pixel bbox');
 const [x,y,w,h]=candidate.bbox;
 if(x<0||y<0||w<=0||h<=0||
   x+w>analysis.width+1e-7||y+h>analysis.height+1e-7)
  throw new RangeError('candidate bbox outside analysis frame');
 const sx=original.width/analysis.width,sy=original.height/analysis.height;
 const left=Math.max(0,Math.min(original.width,x*sx)),
  top=Math.max(0,Math.min(original.height,y*sy));
 const width=Math.min(original.width-left,w*sx),
  height=Math.min(original.height-top,h*sy);
 if(!(width>0&&height>0))throw new RangeError('degenerate mapped bbox');
 return Object.freeze({
  id:candidate.id,kind:candidate.kind,
  coordinateSpace:'original-image-px',
  bbox:Object.freeze([left,top,width,height]),
  sourceMethod:typeof candidate.method==='string'?
   candidate.method.slice(0,70):'untrusted',
  displayOnly:true,confirmed:false
 });
}
module.exports={locateCandidate};
