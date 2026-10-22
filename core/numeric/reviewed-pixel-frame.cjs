'use strict';
/**
 * M0 opt-in boundary: original image pixels -> 2D model millimetres.
 * Explicit, human-reviewed scale and origins are preconditions, NOT proofs.
 * Does not replace image QA/calibration, dewarp perspective, or solve geometry.
 */
const FRAME='original-image-px';
const TARGET='model-mm-2d';
const MIN_SCALE=1e-9,MAX_SCALE=1e6;
const contexts=new WeakMap();
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const identifier=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(v);
const revision=v=>Number.isSafeInteger(v)&&v>=0;
function pair(v,name){
 if(!record(v)||!Object.hasOwn(v,'x')||!Object.hasOwn(v,'y')||
    !finite(v.x)||!finite(v.y))throw new TypeError(name+' requires finite x/y');
 return {x:v.x,y:v.y};
}
function imageInfo(image){
 if(!record(image)||!identifier(image.id)||!revision(image.revision)||
    !Number.isSafeInteger(image.width)||!Number.isSafeInteger(image.height)||
    image.width<24||image.height<24||image.width>10000||image.height>10000)
  throw new TypeError('original image id, revision and supported pixel dimensions required');
 return {id:image.id,revision:image.revision,width:image.width,height:image.height};
}
function inside(p,image){
 if(p.x<0||p.y<0||p.x>image.width||p.y>image.height)
  throw new RangeError('point outside original image pixel bounds');
}
function createReviewedPixelFrame({image,scale,origin,approved}={}){
 const source=imageInfo(image);
 if(approved!==true)throw new TypeError('explicit frame approval required');
 if(!record(scale)||scale.frame!==FRAME||
    scale.unit!=='mm/original-image-px'||scale.reviewed!==true||
    !identifier(scale.sourceId)||!identifier(scale.imageId)||
    !revision(scale.revision)||scale.imageId!==source.id||
    scale.revision!==source.revision||!finite(scale.mmPerPx)||
    scale.mmPerPx<MIN_SCALE||scale.mmPerPx>MAX_SCALE)
  throw new TypeError('current human-reviewed image-bound mm/pixel scale required');
 if(!record(origin)||origin.reviewed!==true||
    !['up','down'].includes(origin.modelYDirection))
  throw new TypeError('reviewed pixel/model origins and explicit model Y direction required');
 const pixel=pair(origin.pixel,'pixel origin');
 const modelMm=pair(origin.modelMm,'model mm origin');
 inside(pixel,source);
 const saved=Object.freeze({image:Object.freeze(source),mmPerPx:scale.mmPerPx,
  pixelOrigin:Object.freeze(pixel),modelOrigin:Object.freeze(modelMm),
  modelYDirection:origin.modelYDirection,scaleSourceId:scale.sourceId});
 const context=Object.freeze({schema:'draftai-reviewed-pixel-frame/1',
  sourceFrame:FRAME,targetFrame:TARGET,modelUnit:'mm',
  imageId:source.id,imageRevision:source.revision,
  scaleSourceId:scale.sourceId,status:'user-reviewed-provisional',
  uniformScaleProven:false,perspectiveCorrectionPerformed:false,
  geometricAccuracyProven:false});
 contexts.set(context,saved);
 return context;
}
function axisCoordinate(pixel,anchorPx,anchorMm,scale,direction){
 const deltaPx=pixel-anchorPx;
 const deltaMm=(deltaPx*scale)*direction;
 if(!finite(deltaPx)||!finite(deltaMm)||deltaPx!==0&&deltaMm===0)
  throw new RangeError('pixel displacement cannot be represented in mm');
 const mm=anchorMm+deltaMm;
 if(!finite(mm))throw new RangeError('model coordinate overflow');
 // Deliberately conservative floating resolution diagnostic; not an interval proof.
 // A large model-space origin can erase sub-mm displacements even with a good scale.
 const resolution=(2*Number.EPSILON)*Math.max(Math.abs(anchorMm),Math.abs(mm));
 if(deltaMm!==0 && (mm===anchorMm||Math.abs(deltaMm)<=resolution))
  throw new RangeError('model coordinate precision is insufficient');
 return mm;
}
function toModelMillimetres(context,{imageId,revision:currentRevision,frame,point}={}){
 const saved=contexts.get(context);
 if(!saved)throw new TypeError('createReviewedPixelFrame context required');
 if(imageId!==saved.image.id||!revision(currentRevision)||
    currentRevision!==saved.image.revision)
  throw new RangeError('stale or wrong-image calibration context');
 if(frame!==FRAME)throw new TypeError('point must be labeled original-image-px');
 const p=pair(point,'image pixel point');
 inside(p,saved.image);
 const x=axisCoordinate(p.x,saved.pixelOrigin.x,saved.modelOrigin.x,saved.mmPerPx,1);
 const y=axisCoordinate(p.y,saved.pixelOrigin.y,saved.modelOrigin.y,saved.mmPerPx,
  saved.modelYDirection==='up'?-1:1);
 return Object.freeze({x,y,unit:'mm',frame:TARGET,
  sourceImageId:saved.image.id,sourceRevision:saved.image.revision,
  calibrationStatus:'user-reviewed-provisional',
  geometricAccuracyProven:false});
}
module.exports={createReviewedPixelFrame,toModelMillimetres};
