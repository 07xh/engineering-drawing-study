'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {reviewConeBaseRadiusCandidate:review}=
 require('../../recognition/reviewed-cone-image-radius.cjs');
const {normalizeNativeDetections}=
 require('../../recognition/browser-native-dimension-ocr.cjs');
const image={width:1000,height:600};
const token=(s)=>normalizeNativeDetections([{
 rawValue:s,boundingBox:{x:50,y:80,width:90,height:28}
}],{width:1000,height:600},image)[0];
function opts(candidate=token('Φ20'),extra={}){
 return {candidate,image,sourceEpoch:3,currentSourceEpoch:3,
  reviewedTextValueMm:candidate.numericValue,unitsConfirmed:true,
  baseCircleLinkConfirmed:true,userAccepted:true,answerMark:'unknown',...extra};
}
test('08 existing native OCR Φ diameter becomes explicitly reviewed editable base-radius ONLY',()=>{
 const c=token('Φ20');
 const result=review(opts(c));
 assert.equal(result.status,'editable-mm-field-proposal');
 assert.equal(result.field,'coneRadius');
 assert.equal(result.radiusMm,10);
 assert.equal(result.dimensionKind,'diameter');
 assert.equal(result.sourceText,'Φ20');
 assert.equal(result.imageEpoch,3);
 assert.equal(result.units,'mm');
 assert.equal(result.association,'user-confirmed-cone-base-circle');
 assert.equal(result.mathSource,undefined);
 for(const key of ['imageRecognizedGeometry','coneHeightVerified',
  'sectionPlaneVerified','entireProblemReviewed',
  'independentAnswerIsolationVerified','blindExercisePassed',
  'mathematicalProof','solveTriggered','v5Triggered'])
  assert.equal(result[key],false,key);
 assert.equal(Object.isFrozen(result),true);
 assert.equal(Object.isFrozen(result.originalImageBox),true);
});
test('08 R radius and reviewed OCR correction remain editable, never pre-confirm all geometry',()=>{
 const r=review(opts(token('R8'),{reviewedTextValueMm:7.5,
  answerMark:'contains-answers'}));
 assert.equal(r.radiusMm,7.5);
 assert.equal(r.sourceText,'R8');
 assert.equal(r.sourceContainsMarkedAnswer,true);
 assert.equal(r.blindExercisePassed,false);
 const withMm=review(opts(token('Ø16 mm'),{reviewedTextValueMm:16,
  answerMark:'no-visible-answers'}));
 assert.equal(withMm.radiusMm,8);
 assert.equal(withMm.independentAnswerIsolationVerified,false);
});
test('09 source epoch, review, unit and circle association are independent fail-closed gates',()=>{
 const c=token('R8');
 for(const patch of [
  {sourceEpoch:2},{currentSourceEpoch:4},
  {unitsConfirmed:false},{baseCircleLinkConfirmed:false},
  {userAccepted:false},{reviewedTextValueMm:0},
  {reviewedTextValueMm:-1},{reviewedTextValueMm:NaN},
  {reviewedTextValueMm:100001},{answerMark:'blind-certified'},
  {candidate:{...c,confirmed:true}},
  {candidate:{...c,requiresHumanReview:false}},
  {candidate:{...c,mathematicalProof:true}},
  {candidate:{...c,coordinateSpace:'sheet-px'}},
  {candidate:{...c,sourceText:'R1000'}}
 ]){
  assert.throws(()=>review(opts(c,patch)));
 }
});
test('09 duplicate/free-form/non-R text or forged OCR value never becomes model mm',()=>{
 const c=token('R5');
 assert.throws(()=>review(opts({...c,proposedRadiusValue:500})));
 assert.throws(()=>review(opts({...c,id:'other_1'})));
 assert.throws(()=>review(opts({...c,bbox:[100,50,1000,80]})));
 assert.throws(()=>review(opts(c,{candidate:null})),/untrusted/);
 const unknown=normalizeNativeDetections([{
  rawValue:'M12',boundingBox:{x:0,y:0,width:40,height:20}
 }],{width:1000,height:600},image);
 assert.equal(unknown.length,0);
});
test('09 cone OCR bridge adds no separate solver, web upload, player or private workbook fixture',()=>{
 const s=require('node:fs').readFileSync('recognition/reviewed-cone-image-radius.cjs','utf8');
 assert.match(s,/reviewed-image-dimension-field/);
 assert.match(s,/dimension-notation-candidates/);
 assert.doesNotMatch(s,/fetch\s*\(|XMLHttpRequest|localStorage|sendBeacon|new\s+WebSocket/);
 assert.doesNotMatch(s,/coneSpatialV5Preview|compileTimeline|createPlayer|solveFinite/);
});
