'use strict';
/**
 * Repeatable QA over self-generated RGBA engineering primitives.
 * The report does NOT measure real scan/photo quality, browser OCR accuracy,
 * or end-to-end verified math success.
 */
const {scenarios}=require('../tests/recognition/synthetic-quality-scenes.cjs');
const {evaluateRecognitionProposals:evaluate}=
 require('../recognition/recognition-quality-metrics.cjs');
const {detectLineCandidates:detectLines}=
 require('../recognition/local-line-candidates.cjs');
const {detectCurveCandidates:detectCurves}=
 require('../recognition/local-curve-candidates.cjs');
const {normalizeNativeDetections}=
 require('../recognition/browser-native-dimension-ocr.cjs');
function runSyntheticRecognitionQuality(){
 const rows=[];
 for(const s of scenarios()){
  let raw;
  if(s.detector==='line'){
   raw=detectLines(s.image,{minLength:35,maxCandidates:16});
  }else{
   raw=detectCurves(s.image,{minRadius:15,minArcDegrees:75,maxCandidates:16});
  }
  const predictions=raw.map(p=>({...p,
   coordinateSpace:'original-image-px'}));
  const stats=evaluate({
   image:{width:s.image.width,height:s.image.height},
   truth:s.truth,predictions
  },{lineTolerancePx:10,circleTolerancePx:6,radiusTolerancePx:5});
  rows.push({
   scene:s.id,source:'self-generated-rgba-not-real-photography',
   observedPredictions:predictions.length,
   truthCount:s.truth.length,
   metrics:stats.micro,byKind:stats.byKind,
   unmatchedTruth:stats.unmatchedTruth,
   unmatchedPredictions:stats.unmatchedPredictions,
   qualityIsNotMathProof:true
  });
 }
 // OCR transcription baseline tests our strict parser / bbox normalization
 // with a deterministic fake detector output, NOT a live TextDetector engine.
 const textImage={width:360,height:220};
 const native=[
  {rawValue:'R12',boundingBox:{x:10,y:20,width:45,height:18}},
  {rawValue:'Φ20',boundingBox:{x:180,y:20,width:50,height:18}},
  {rawValue:'M10',boundingBox:{x:100,y:140,width:55,height:18}}
 ];
 const predictions=normalizeNativeDetections(native,textImage,textImage).map(x=>({
  id:x.id,kind:'dimension',coordinateSpace:'original-image-px',
  bbox:x.bbox,text:x.sourceText
 }));
 const truth=[
  {id:'radius_annotation',kind:'dimension',coordinateSpace:'original-image-px',
   bbox:[10,20,45,18],text:'R12'},
  {id:'diameter_annotation',kind:'dimension',coordinateSpace:'original-image-px',
   bbox:[180,20,50,18],text:'Φ20'}
 ];
 const stats=evaluate({image:textImage,truth,predictions});
 rows.push({
  scene:'synthetic-injected-OCR-transcript',
  source:'fake-TextDetector-tokens-parser-only',
  observedPredictions:predictions.length,truthCount:truth.length,
  metrics:stats.micro,byKind:stats.byKind,
  unmatchedTruth:stats.unmatchedTruth,
  unmatchedPredictions:stats.unmatchedPredictions,
  qualityIsNotMathProof:true
 });
 return {schema:'draftai-synthetic-recognition-quality/1',
  realPhotoCount:0,liveOcrEngineRuns:0,rows,
  disclosure:'Only self-generated drawings and injected OCR tokens; no real-photo accuracy claim'};
}
if(require.main===module)process.stdout.write(JSON.stringify(
 runSyntheticRecognitionQuality(),null,2)+'\n');
module.exports={runSyntheticRecognitionQuality};
