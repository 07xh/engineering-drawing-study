'use strict';
/**
 * Manual ruler calibration for a *single original-image* finite segment.
 * Cannot infer engineering mm from pixels, OCR, file metadata or the
 * measured stroke alone. Human must independently verify the known length.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>p&&finite(p.x)&&finite(p.y);
function suggestMillimetresPerImagePixel({
 from,to,knownLengthMm,image,sourceId,explicitlyReviewed
}={}){
 if(explicitlyReviewed!==true)
  throw new TypeError('human review of geometry and independent mm length is required');
 if(typeof sourceId!=='string'||!/^[A-Za-z0-9_-]{1,120}$/.test(sourceId))
  throw new TypeError('known segment needs a stable source candidate ID');
 if(!image||!Number.isSafeInteger(image.width)||!Number.isSafeInteger(image.height)||
  image.width<24||image.height<24||image.width>10000||image.height>10000)
  throw new TypeError('finite original image dimensions are required');
 if(!point(from)||!point(to)||[from,to].some(p=>
  p.x<0||p.y<0||p.x>image.width||p.y>image.height))
  throw new RangeError('manual segment endpoints outside the original image');
 const pixelLength=Math.hypot(to.x-from.x,to.y-from.y);
 // Short baselines amplify detection/hand-drawn point error; fail closed.
 if(!finite(pixelLength)||pixelLength<10)
  throw new RangeError('calibration baseline must span at least 10 original pixels');
 if(!finite(knownLengthMm)||knownLengthMm<=0||knownLengthMm>1e6)
  throw new RangeError('independently reviewed known length must be positive mm');
 const mmPerPx=knownLengthMm/pixelLength;
 if(!finite(mmPerPx)||mmPerPx<=0||mmPerPx>1e6||mmPerPx<1e-9)
  throw new RangeError('millimetres-per-original-pixel scale outside numeric limits');
 return Object.freeze({
  schema:'draftai-manual-raster-scale/1',
  status:'human-reviewed-single-baseline-proposal',
  sourceId,knownLengthMm,pixelLength,mmPerPx,
  calibrationFrame:'original-image-px',
  verifiedDrawingScale:false,
  assumesUniformImageScale:true,
  perspectiveAndDistortionNotVerified:true
 });
}
module.exports={suggestMillimetresPerImagePixel};
