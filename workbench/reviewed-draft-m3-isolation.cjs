'use strict';
/**
 * Bridge the EXISTING versioned ProblemDraft to #477's reviewed M3 isolation.
 * A scale is accepted only from the witnessed two-ruler adapter result.
 * This is an input evidence gate, never a solver or a uniqueness proof.
 */
const {validateDraft}=require('../recognition/problem-draft.cjs');
const {isWitnessedReviewedDimension}=
 require('../recognition/reviewed-path-dimension-draft.cjs');
const {isolateReviewedProblem}=require('./reviewed-problem-math-isolation.cjs');
const {fingerprint}=require('./reviewed-source-fingerprint.cjs');
const {IDENTITY}=require('../recognition/page-transforms.cjs');
const {createReviewedPixelFrame,toModelMillimetres}=
 require('../core/numeric/reviewed-pixel-frame.cjs');
const finite=Number.isFinite;
function isolateReviewedDraft(attached,{
 expectedRevision,currentDraft,photoSha256=null
}={}){
 try{
  if(!isWitnessedReviewedDimension(attached)||
     attached?.status!=='dimension-attached-to-existing-draft'||
     attached.geometryAndDimensionReviewed!==true||
     attached.calibration?.reviewedBy!=='user'||
     !finite(attached.calibration.mmPerPx)||attached.calibration.mmPerPx<=0||
     !finite(attached.scaleRelativeDifference)||
     attached.scaleRelativeDifference<0||
     !Number.isSafeInteger(expectedRevision)||
     attached.draft?.revision!==expectedRevision||
     currentDraft?.revision!==expectedRevision)
   return {status:'not-verified',reason:'reviewed scale or revision unavailable'};
  const d=validateDraft(attached.draft),current=validateDraft(currentDraft);
  if(JSON.stringify(d)!==JSON.stringify(current)||
     attached.calibration.revision!==expectedRevision)
   return {status:'not-verified',reason:'stale draft or scale'};
  const scale=attached.calibration.mmPerPx,origin=attached.calibration.originPx;
  // Drawing-px is the same as original-image-px ONLY for the witnessed
  // identity homography. Never reinterpret rectified coordinates as source px.
  if(attached.calibration.frame!=='drawing-px'||
     d.sourceToDrawing.some((v,i)=>v!==IDENTITY[i])||
     !origin||!finite(origin.x)||!finite(origin.y)||
     !['up','down'].includes(attached.calibration.yAxis))
   return {status:'not-verified',reason:'invalid reviewed coordinate frame'};
  // This photo digest is checked against actual current local file bytes
  // by the REAL UI's source watcher. Standalone programmatic callers are
  // not an independent source of provenance: no caller proof flags.
  if(photoSha256!==null&&
     (typeof photoSha256!=='string'||!(/^[0-9a-f]{64}$/).test(photoSha256)))
   return {status:'not-verified',reason:'invalid original photo digest'};
  const imageId=photoSha256?
   'sha256-'+photoSha256:
   'draft-'+fingerprint(JSON.stringify({
    image:d.image,revision:d.revision
   }));
  const metric=createReviewedPixelFrame({
   image:{id:imageId,revision:d.revision,
    width:d.image.width,height:d.image.height},
   scale:{frame:'original-image-px',unit:'mm/original-image-px',
    reviewed:true,sourceId:attached.dimensionId,
    imageId,revision:d.revision,mmPerPx:scale},
   origin:{reviewed:true,modelYDirection:attached.calibration.yAxis,
    pixel:origin,modelMm:{x:0,y:0}},
   approved:true
  });
  const map=p=>{
   const converted=toModelMillimetres(metric,{
    imageId,revision:d.revision,frame:'original-image-px',point:p
   });
   return [converted.x,converted.y];
  };
  const entities=[];
  for(const c of d.candidates){
   if(c.reviewStatus==='rejected')continue;
   if(c.reviewStatus!=='confirmed')
    return {status:'not-verified',reason:'unreviewed candidate'};
   if(c.kind==='segment')
    entities.push({id:c.id,role:'known-condition',reviewed:true,
     unitVerified:'mm',geometry:{type:'line',start:map(c.geometry.from),end:map(c.geometry.to)}});
   else if(c.kind==='circle')
   {
    const radius=c.geometry.radiusPx*scale;
    if(!finite(radius)||radius<=0)
     return {status:'not-verified',reason:'unrepresentable circle radius in mm'};
    entities.push({id:c.id,role:'known-condition',reviewed:true,
     unitVerified:'mm',geometry:{type:'circle',center:map(c.geometry.center),
      radius}});
   }
   else if(c.kind==='dimension'){
    if(c.dimension?.unit!=='mm'||!['radius','diameter','length'].includes(c.dimension.kind))
     return {status:'not-verified',reason:'unsupported dimension'};
    // Dimensions remain in the existing typed ProblemDraft/M3 contract.
    // The isolation digest includes their reviewed content, not a fake geometric entity.
   }else return {status:'not-verified',reason:'unsupported candidate kind'};
  }
  const isolated=isolateReviewedProblem({sourceRevision:d.revision,entities});
  if(isolated.status!=='reviewed-conditions-isolated')return isolated;
  const sourceBinding=fingerprint(JSON.stringify({
   draft:d,calibration:attached.calibration,dimensionId:attached.dimensionId,
   selectedPathId:attached.selectedPathId,sourceTargetId:attached.sourceTargetId,
   originalPhotoSha256:photoSha256
  }));
  return {...isolated,sourceBinding,reviewedScaleMmPerPx:scale,
   dimensionId:attached.dimensionId,
   m0MetricFrameStatus:metric.status,
   sourcePhotoByteSha256:photoSha256,
   imageSourceIndependentlyAuthenticated:false,
   globallyUniformScaleProven:false};
 }catch(error){
  return {status:'not-verified',reason:'invalid reviewed draft or frame'};
 }
}
module.exports={isolateReviewedDraft};
