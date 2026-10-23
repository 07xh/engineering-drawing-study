'use strict';
/**
 * Bridge the EXISTING versioned ProblemDraft to #477's reviewed M3 isolation.
 * A scale is accepted only from the witnessed two-ruler adapter result.
 * This is an input evidence gate, never a solver or a uniqueness proof.
 */
const {validateDraft}=require('../recognition/problem-draft.cjs');
const {isolateReviewedProblem}=require('./reviewed-problem-math-isolation.cjs');
const finite=Number.isFinite;
function isolateReviewedDraft(attached,{expectedRevision,currentDraft}={}){
 try{
  if(attached?.status!=='dimension-attached-to-existing-draft'||
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
  if(!origin||!finite(origin.x)||!finite(origin.y)||
     !['up','down'].includes(attached.calibration.yAxis))
   return {status:'not-verified',reason:'invalid reviewed coordinate frame'};
  const map=p=>[(p.x-origin.x)*scale,
   (p.y-origin.y)*scale*(attached.calibration.yAxis==='up'?-1:1)];
  const entities=[];
  for(const c of d.candidates){
   if(c.reviewStatus==='rejected')continue;
   if(c.reviewStatus!=='confirmed')
    return {status:'not-verified',reason:'unreviewed candidate'};
   if(c.kind==='segment')
    entities.push({id:c.id,role:'known-condition',reviewed:true,
     unitVerified:'mm',geometry:{type:'line',start:map(c.geometry.from),end:map(c.geometry.to)}});
   else if(c.kind==='circle')
    entities.push({id:c.id,role:'known-condition',reviewed:true,
     unitVerified:'mm',geometry:{type:'circle',center:map(c.geometry.center),
      radius:c.geometry.radiusPx*scale}});
   else if(c.kind==='dimension'){
    if(c.dimension?.unit!=='mm'||!['radius','diameter','length'].includes(c.dimension.kind))
     return {status:'not-verified',reason:'unsupported dimension'};
    // Dimensions remain in the existing typed ProblemDraft/M3 contract.
    // The isolation digest includes their reviewed content, not a fake geometric entity.
   }else return {status:'not-verified',reason:'unsupported candidate kind'};
  }
  const isolated=isolateReviewedProblem({sourceRevision:d.revision,entities});
  if(isolated.status!=='reviewed-conditions-isolated')return isolated;
  const {createHash}=require('node:crypto');
  const sourceBinding=createHash('sha256').update(JSON.stringify({
   draft:d,calibration:attached.calibration,dimensionId:attached.dimensionId,
   selectedPathId:attached.selectedPathId,sourceTargetId:attached.sourceTargetId
  })).digest('hex');
  return {...isolated,sourceBinding,reviewedScaleMmPerPx:scale,
   dimensionId:attached.dimensionId};
 }catch(error){
  return {status:'not-verified',reason:'invalid reviewed draft or frame'};
 }
}
module.exports={isolateReviewedDraft};
