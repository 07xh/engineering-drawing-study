'use strict';
/**
 * Private, synchronous recognition QA session for a USER-SELECTED image.
 * Never retains the RGBA frame, file name, Blob or file contents after
 * proposal generation. Results are IMAGE PIXELS, not model-mm/SolveResult.
 */
const {detectLineCandidates} = require('./local-line-candidates.cjs');
const {detectCurveCandidates} = require('./local-curve-candidates.cjs');
const {evaluateRecognitionProposals} = require('./recognition-quality-metrics.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const bounded=i=>i&&Number.isSafeInteger(i.width)&&Number.isSafeInteger(i.height)&&
 i.width>=32&&i.height>=32&&i.width<=10000&&i.height<=10000&&
 i.width*i.height<=50000000;
const clone=x=>JSON.parse(JSON.stringify(x));
function createPhotoQualitySession(){
 let original=null,truth=[],predictions=[],rejected=[],revision=0,nextId=0;
 function reset(){
  revision++;original=null;truth=[];predictions=[];rejected=[];
 }
 function loadImage(originalSize,frame){
  // New image invalidates even a previously accepted report immediately,
  // including when the replacement is malformed.
  reset();
  if(!bounded(originalSize)||!frame||!Number.isSafeInteger(frame.width)||
   !Number.isSafeInteger(frame.height)||frame.width<32||frame.height<32||
   frame.width>900||frame.height>900||
   !frame.data||frame.data.length!==frame.width*frame.height*4||
   frame.width*frame.height>810000)
   throw new RangeError('bounded local RGBA analysis frame required');
  const scaleX=originalSize.width/frame.width;
  const scaleY=originalSize.height/frame.height;
  if(!finite(scaleX)||!finite(scaleY)||
   Math.max(scaleX,scaleY)/Math.min(scaleX,scaleY)>1.025)
   throw new RangeError('distorted aspect ratio cannot preserve image-pixel circles');
  const radiusScale=Math.sqrt(scaleX*scaleY);
  const candidateLines=detectLineCandidates(frame,{
   minLength:Math.max(24,Math.floor(Math.min(frame.width,frame.height)*.17)),
   maxCandidates:16
  });
  const candidateCurves=detectCurveCandidates(frame,{
   minRadius:10,minArcDegrees:75,maxCandidates:16
  });
  const transformed=[];
  for(const line of candidateLines)transformed.push({
   id:line.id,kind:'line',coordinateSpace:'original-image-px',
   from:{x:line.from.x*scaleX,y:line.from.y*scaleY},
   to:{x:line.to.x*scaleX,y:line.to.y*scaleY}
  });
  for(const curve of candidateCurves)transformed.push({
   id:curve.id,kind:curve.kind,coordinateSpace:'original-image-px',
   center:{x:curve.center.x*scaleX,y:curve.center.y*scaleY},
   radius:curve.radius*radiusScale,
   ...(curve.kind==='arc'?{coverageDeg:curve.coverageDeg}:{})
  });
  // Reject geometry outside the supported evaluator contract explicitly;
  // record diagnostics instead of laundering invalid candidates as correct.
  const clean=[];
  for(const proposal of transformed){
   try{
    evaluateRecognitionProposals({
     image:originalSize,truth:[],predictions:[proposal]
    });
    clean.push(proposal);
   }catch(err){
    rejected.push({id:proposal.id,kind:proposal.kind,
     reason:'outside-supported-evaluation-domain'});
   }
  }
  // Only numeric annotations/proposals are kept; frame never assigned to state.
  original={width:originalSize.width,height:originalSize.height};
  predictions=clean;
  return snapshot();
 }
 function addAnnotation(value){
  if(!original)throw new Error('load a local photo before annotating');
  if(truth.length>=100)throw new RangeError('too many manual annotations');
  if(!value||typeof value!=='object'||Array.isArray(value))
   throw new TypeError('annotation object expected');
  const id='truth_'+(++nextId);
  const kind=value.kind,base={id,kind,coordinateSpace:'original-image-px'};
  let annotation;
  switch(kind){
   case 'line':
    annotation={...base,from:value.from,to:value.to};break;
   case 'circle':
   case 'arc':
    annotation={...base,center:value.center,radius:value.radius,
     ...(kind==='arc'?{coverageDeg:value.coverageDeg}:{})};break;
   case 'dimension':
    annotation={...base,bbox:value.bbox,text:value.text};break;
   case 'arrow':
    annotation={...base,tip:value.tip};break;
   default:throw new TypeError('unsupported annotation kind');
  }
  // Round-trip through structured clone to avoid prototypes, caller mutation,
  // and unsupported or non-JSON data accepted by the evaluation layer.
  const validated=clone(annotation);
  evaluateRecognitionProposals({
   image:original,truth:[validated],predictions:[]
  });
  truth.push(validated);
  revision++;
  return id;
 }
 function removeAnnotation(id){
  const at=truth.findIndex(x=>x.id===id);
  if(at<0)return false;
  truth.splice(at,1);revision++;return true;
 }
 function clearAnnotations(){truth=[];revision++;}
 function snapshot(){
  return clone({
   revision,ready:!!original,image:original,
   annotations:truth,predictions,
   rejectedPredictions:rejected,
   imageBytesRetained:false
  });
 }
 function report(){
  if(!original)return {status:'no-image',revision};
  if(truth.length===0)
   return {status:'needs-manual-annotations',revision,
    image:clone(original),predictionCount:predictions.length,
    precision:null,recall:null,notRealWorldAccuracy:true};
  return clone({
   schema:'draftai-local-photo-quality-report/1',
   status:'evaluated',revision,
   source:'user-selected-local-image-unverified-rights',
   labelProvenance:'one-user-manually-annotated-not-independently-audited',
   image:original,annotationCount:truth.length,
   candidateCount:predictions.length,
   rejectedPredictions:rejected,
   metrics:evaluateRecognitionProposals({
    image:original,truth,predictions
   }),
   imageBytesIncluded:false,filenameIncluded:false,
   noModelMillimetres:true,notRealWorldAccuracy:true,
   independentReview:false
  });
 }
 return Object.freeze({reset,loadImage,addAnnotation,removeAnnotation,
  clearAnnotations,snapshot,report});
}
module.exports={createPhotoQualitySession};
