'use strict';
/**
 * Replayable, user-authored QA annotations -> editable, still UNCONFIRMED R0
 * ProblemDraft. This adapter transfers ORIGINAL PHOTO PIXELS only.
 * No recognition quality metric, source image hash, OCR text or arrow is
 * allowed to become model-mm geometry or a solver-verified constraint.
 */
const {validateAnnotationPack}=require('../recognition/photo-annotation-replay.cjs');
const {newDraft}=require('../recognition/problem-draft.cjs');
const {checkImage}=require('../recognition/page-transforms.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function boxForLine(from,to,image){
 const x=Math.min(from.x,to.x),y=Math.min(from.y,to.y);
 const maxX=Math.max(from.x,to.x),maxY=Math.max(from.y,to.y);
 const pad=2;
 const left=Math.max(0,x-pad),top=Math.max(0,y-pad);
 const right=Math.min(image.width,maxX+pad),bottom=Math.min(image.height,maxY+pad);
 if(right<=left||bottom<=top)throw new RangeError('manual segment source bbox is degenerate');
 return {x:left,y:top,width:right-left,height:bottom-top};
}
function photoTruthToReviewedDraft({pack,image,sha256}={}){
 const meta=checkImage(image);
 // Strictly enforce SAME source file and intrinsic image dimensions.
 // Never infer equality from filenames or width/height alone.
 const annotations=validateAnnotationPack(pack,{image:meta,sha256});
 const candidates=[],unsupportedIds=[];
 for(const label of annotations){
  const id='qa_'+label.id;
  let bbox,geometry,kind;
  if(label.kind==='line'){
   kind='segment';
   bbox=boxForLine(label.from,label.to,meta);
   geometry={frame:'drawing-px',
    from:{x:label.from.x,y:label.from.y},
    to:{x:label.to.x,y:label.to.y}};
  }else if(label.kind==='circle'){
   kind='circle';
   const {x,y}=label.center,r=label.radius;
   if(!finite(r)||r<=0||x-r<0||y-r<0||
    x+r>meta.width||y+r>meta.height)
    throw new RangeError('cropped or unbounded full circle cannot enter R0 source review');
   bbox={x:x-r,y:y-r,width:2*r,height:2*r};
   geometry={frame:'drawing-px',center:{x,y},radiusPx:r};
  }else{
   // Partial arcs cannot masquerade as full circles. Raw OCR labels
   // lack verified dimension references and units, and arrows are not R0
   // source primitives. The user can inspect them in the QA view.
   unsupportedIds.push(label.id);continue;
  }
  candidates.push({
   id,kind,bbox,geometry,
   reviewStatus:'unconfirmed',method:'manual',confidence:0
  });
 }
 if(candidates.length<1)throw new RangeError('no full line or circle annotations suitable for R0 review');
 if(candidates.length>40)throw new RangeError('R0 review requires at most 40 manual primitives');
 const draft=newDraft({image:meta,candidates});
 return {
  status:'needs-human-geometry-and-mm-review',
  draft,unsupportedIds,
  importedIds:candidates.map(c=>c.id),
  sameOriginalPhotoFingerprintChecked:true,
  sourceMethod:'user-drawn-original-image-px',
  originalImageHashRetained:false,
  sourceUnits:'original-image-px',
  modelUnits:null,
  geometryVerified:false,sourceScaleMathematicallyProven:false,
  solverReady:false,globallyUnique:null,
  requiresIndependentMmCalibration:true,
  requiresSourceSelection:true,
  requiresG1BranchAndTravelVerification:true
 };
}
module.exports={photoTruthToReviewedDraft};
