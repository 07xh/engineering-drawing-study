'use strict';
/**
 * Compute detector quality deltas under reproducible pixel perturbations.
 * Does not use camera photos, browser OCR, verified math, or network sources.
 */
const {scenarios}=require('../tests/recognition/synthetic-quality-scenes.cjs');
const {perturb}=require('../tests/recognition/synthetic-image-stress.cjs');
const {detectLineCandidates}=
 require('../recognition/local-line-candidates.cjs');
const {detectCurveCandidates}=
 require('../recognition/local-curve-candidates.cjs');
const {evaluateRecognitionProposals:evaluate}=
 require('../recognition/recognition-quality-metrics.cjs');
const VARIANTS=Object.freeze(['baseline','low-contrast','paper-gradient',
 'speckle','ink-gaps']);
function measure(scene,img){
 const proposals=(scene.detector==='line'?
  detectLineCandidates(img,{minLength:35,maxCandidates:16}):
  detectCurveCandidates(img,{minRadius:15,minArcDegrees:75,maxCandidates:16}))
  .map(c=>({...c,coordinateSpace:'original-image-px'}));
 const report=evaluate({
  image:{width:img.width,height:img.height},
  truth:scene.truth,predictions:proposals
 },{lineTolerancePx:10,circleTolerancePx:6,radiusTolerancePx:5});
 return {tp:report.micro.tp,fp:report.micro.fp,fn:report.micro.fn,
  recall:report.micro.recall,precision:report.micro.precision,
  falsePositiveIds:report.unmatchedPredictions.map(x=>x.id),
  missedTruthIds:report.unmatchedTruth.map(x=>x.id)};
}
function runStressRecognitionReport(){
 const comparisons=[];
 for(const scene of scenarios()){
  const original=measure(scene,scene.image);
  for(const variant of VARIANTS){
   const observed=variant==='baseline'?original:
    measure(scene,perturb(scene.image,variant));
   const deltaRecall=original.recall!==null&&observed.recall!==null?
    Number((observed.recall-original.recall).toFixed(5)):null;
   comparisons.push({
    scenario:scene.id,variant,
    source:'generated-RGBA-no-real-photos',
    baseline:original,observed,
    deltaRecall,
    additionalFalsePositives:Math.max(0,observed.fp-original.fp),
    labelsAreOriginalUnchangedPixels:true,
    independentGeometryProof:false
   });
  }
 }
 const degradations=comparisons.filter(x=>
  (x.deltaRecall!==null&&x.deltaRecall<0)||x.additionalFalsePositives>0)
  .map(x=>({scenario:x.scenario,variant:x.variant,
   lostRecall:x.deltaRecall===null?null:-Math.min(0,x.deltaRecall),
   newFalsePositives:x.additionalFalsePositives,
   missing:x.observed.missedTruthIds}));
 return {
  schema:'draftai-synthetic-visual-stress/1',realPhotoCount:0,
  browserOcrRuns:0,variantNames:[...VARIANTS],comparisons,degradations,
  disclosure:'Synthetic perturbations are diagnostic, never empirical Android photo accuracy'
 };
}
if(require.main===module)
 process.stdout.write(JSON.stringify(runStressRecognitionReport(),null,2)+'\n');
module.exports={runStressRecognitionReport};
