'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {makePrivatePhotoCase:pack,sameProblem}=require('../../benchmark/private-photo-exercise-dossier.cjs');
const {newDraft,reviewCandidate}=require('../../recognition/problem-draft.cjs');
const {normalizeNativeDetections}=require('../../recognition/browser-native-dimension-ocr.cjs');
const {proposeDimensionPaths}=require('../../recognition/reviewed-dimension-path.cjs');
const {makeDimensionConstraint:attach,prepareSpecialistInput}=require('../../recognition/reviewed-path-dimension-draft.cjs');
const {solveFiniteFillet}=require('../../engines/constraints-2d/finite-fillet-gate.cjs');
const sha='ab'.repeat(32),size={width:600,height:400};
const ocr=normalizeNativeDetections([{rawValue:'R8',boundingBox:{
 x:145,y:75,width:60,height:25}}],size,size)[0];
const bbox=(a,b)=>[Math.min(a.x,b.x),Math.min(a.y,b.y),
 Math.max(1,Math.abs(a.x-b.x)),Math.max(1,Math.abs(a.y-b.y))];
const line=(id,a,b)=>({id,kind:'line',coordinateSpace:'original-image-px',
 from:a,to:b,bbox:bbox(a,b),confirmed:false});
const segment=line('line_1',{x:225,y:200},{x:375,y:200});
const ruler=line('line_2',{x:10,y:350},{x:110,y:350});
const leader=line('line_3',{x:210,y:95},{x:268,y:145});
const circle={id:'curve_1',kind:'circle',
 coordinateSpace:'original-image-px',bbox:[260,135,80,80],confirmed:false};
const candidateSets={lines:[segment,ruler,leader],curves:[circle],arrows:[],ocr:[ocr]};
const rect=b=>({x:b[0],y:b[1],width:b[2],height:b[3]});
const geoLine=x=>({id:x.id,kind:'segment',confidence:.6,
 method:'detector',reviewStatus:'unconfirmed',bbox:rect(x.bbox),
 geometry:{frame:'drawing-px',from:{...x.from},to:{...x.to}}});
const draft=()=>newDraft({image:{...size,mediaType:'image/png',byteLength:3000},
 candidates:[...candidateSets.lines.map(geoLine),{
  id:'curve_1',kind:'circle',confidence:.7,method:'detector',
  reviewStatus:'unconfirmed',bbox:rect(circle.bbox),
  geometry:{frame:'drawing-px',center:{x:300,y:175},radiusPx:40}
 }]});
function association(){
 const proposed=proposeDimensionPaths({dimension:ocr,image:size,
  lines:[leader],curves:[circle],arrows:[]});
 const selected=proposed.proposals.find(x=>x.pathKind==='straight'&&x.curveCandidateId==='curve_1');
 assert.ok(selected,'existing leader ranking should link this source');
 return {dimension:ocr,lines:[leader],curves:[circle],arrows:[],image:size,
  selectedPathId:selected.id,sourceEpoch:3,currentSourceEpoch:3,
  revision:0,expectedRevision:0,reviewedTextValueMm:8,
  textConfirmed:true,unitsConfirmed:true,pathConfirmed:true,
  curveConfirmed:true,arrowReviewed:false,finalAccepted:true,
  answerMark:'no-visible-answers'};
}
function specimen(){
 let d=draft();
 for(const c of d.candidates)
  d=reviewCandidate(d,{id:c.id,decision:'confirmed',
   expectedRevision:d.revision});
 const review={...association(),revision:d.revision,expectedRevision:d.revision};
 const approved=attach({
  draft:d,expectedRevision:d.revision,association:review,
  sourceEpoch:3,currentSourceEpoch:3,
  selectedAlternativesReviewed:true,editedGeometryReviewed:true,
  calibrationReviewed:true,targetKindConfirmed:true,
  calibration:{
   first:{sourceId:'line_1',knownLengthMm:30,confirmed:true},
   second:{sourceId:'line_2',knownLengthMm:20,confirmed:true},
   originPx:{x:300,y:200},yAxis:'up'
  }
 });
 assert.equal(approved.status,'dimension-attached-to-existing-draft');
 const selected=prepareSpecialistInput(approved,{
  currentDraft:approved.draft,expectedRevision:approved.draft.revision,
  kind:'segment-circle',
  sourceIds:{segment:'line_1',circle:'curve_1'},
  filletRadiusMm:3,options:{side:1}
 });
 const m3=solveFiniteFillet(selected.problem);
 assert.equal(m3.status,'multiple');
 return {review,approved,selected,m3};
}
function opts(parts={}){
 const base={
  photoSha256:sha,image:size,sourceRole:'asserted-unmarked-question',
  detectorCandidates:candidateSets,detectorGeneration:2
 };
 return {...base,...parts};
}
test('09 actual detector-only photo pack preserves original-pixel candidates, without any math/blind claim',()=>{
 const p=pack(opts());
 assert.equal(p.status,'candidates-captured');
 assert.equal(p.detection.candidates.lines.length,3);
 assert.equal(p.detection.candidates.curves.length,1);
 assert.equal(p.detection.candidates.ocr[0].sourceText,'R8');
 assert.equal(p.source.sha256,sha);
 assert.equal(p.source.locallyFingerprintOnly,true);
 assert.equal(p.source.originalNoAnswerIndependentlyVerified,false);
 assert.equal(p.source.photoBytesIncluded,false);
 assert.equal(p.independentBlindTestPassed,false);
 assert.equal(p.acceptedTextbookProblemCount,0);
 assert.equal(p.math,null);
 assert.equal(JSON.stringify(p).includes('private_filename'),false);
});
test('09 actual source-reviewed OCR R8→leader→circle becomes a separate recorded review stage',()=>{
 const {review}=specimen();
 const p=pack(opts({reviewedAssociation:review}));
 assert.equal(p.status,'source-association-reviewed');
 assert.equal(p.review.selectedPathId,review.selectedPathId);
 assert.equal(p.review.dimensionCandidateId,ocr.id);
 assert.deepEqual(p.review.leaderCandidateIds,['line_3']);
 assert.equal(p.independentBlindTestPassed,false);
});
test('09 full existing user-confirmed ProblemDraft, two independent rulers and M3 preserve versioned source',()=>{
 const {review,approved,selected,m3}=specimen();
 const p=pack(opts({reviewedAssociation:review,
  acceptedDraft:approved.draft,calibration:approved.calibration,
  preparedProblem:selected.problem,actualM3:m3
 }));
 assert.equal(p.status,'m3-solved-requires-branch-and-g1');
 assert.equal(p.review.draftRevision,approved.draft.revision);
 assert.equal(p.review.draftReadiness,'candidate-reviewed');
 assert.equal(p.review.draft.candidates.at(-1).dimension.unit,'mm');
 assert.equal(p.math.candidateCount,2);
 assert.equal(p.math.branchIds.length,2);
 assert.equal(p.animation,null);
 assert.equal(p.independentBlindTestPassed,false);
});
test('09 same genuine photo user-approved M3 → explicit branch/G1 → ONE V5 independent parity but still NOT a textbook blind pass',()=>{
 const {review,approved,selected,m3}=specimen();
 const live={problem:{...selected.problem,revision:selected.problem.revision+6},
  selection:{branchId:'candidate-1',direction:'ccw',
   lineTravel:'forward',knownCircleTravel:'cw'},
  sheet:{origin:{x:350,y:220},scale:5}};
 const record=pack(opts({reviewedAssociation:review,
  acceptedDraft:approved.draft,calibration:approved.calibration,
  preparedProblem:selected.problem,actualM3:m3,
  liveInput:live,liveV5Ready:true
 }));
 assert.equal(record.status,'math-construction-v5-parity-verified-not-blind');
 assert.equal(record.math.independentResidualVerified,true);
 assert.equal(record.animation.constructionStepParityVerified,true);
 assert.equal(record.animation.v5FrameVerified,true);
 assert.ok(record.animation.constructionStepCount>=3);
 assert.equal(record.independentBlindTestPassed,false);
 assert.equal(record.acceptedTextbookProblemCount,0);
 const excluded=pack(opts({sourceRole:'answer-marked-reference',
  reviewedAssociation:review,acceptedDraft:approved.draft,
  calibration:approved.calibration,preparedProblem:selected.problem,actualM3:m3,
  liveInput:live,liveV5Ready:true}));
 assert.equal(excluded.status,'answer-marked-excluded-from-blind');
 assert.equal(excluded.independentBlindTestPassed,false);
});
test('09 old source, fake labels, wrong image digest, mutated candidates and forged M3 fail closed',()=>{
 const {review,approved,selected,m3}=specimen();
 for(const change of [
  {photoSha256:'00'}, {image:{width:601,height:400}},
  {detectorCandidates:{...candidateSets,ocr:[]}},
  {detectorCandidates:{...candidateSets,lines:[]}},
  {reviewedAssociation:{...review,currentSourceEpoch:4}},
  {reviewedAssociation:{...review,selectedPathId:'forged'}},
  {acceptedDraft:{...approved.draft,revision:approved.draft.revision+1}},
  {preparedProblem:{...selected.problem,revision:selected.problem.revision+1}},
  {actualM3:{...m3,candidateCount:99}}
 ]){
  assert.throws(()=>pack(opts({
   reviewedAssociation:review,acceptedDraft:approved.draft,
   calibration:approved.calibration,preparedProblem:selected.problem,
   actualM3:m3,...change
  })),undefined,String(Object.keys(change)));
 }
});
test('09 changing typed M3 geometry/fillet radius prevents stale live V5 from being attached',()=>{
 const {review,approved,selected,m3}=specimen();
 const live={problem:{...selected.problem,revision:100,filletRadius:9},
  selection:{branchId:'candidate-1',direction:'ccw',
   lineTravel:'forward',knownCircleTravel:'cw'},
  sheet:{origin:{x:350,y:220},scale:5}};
 assert.equal(sameProblem(selected.problem,live.problem),false);
 assert.throws(()=>pack(opts({reviewedAssociation:review,
  acceptedDraft:approved.draft,calibration:approved.calibration,
  preparedProblem:selected.problem,actualM3:m3,liveInput:live,
  liveV5Ready:true})),/stale/);
});
test('09 unreadable truth cannot be called original-no-answer-independently-verified by client',()=>{
 for(const role of ['independent-blind-pass','certified-no-answer','approved']){
  assert.throws(()=>pack(opts({sourceRole:role})),/source/);
 }
 const p=pack(opts({sourceRole:'asserted-unmarked-question'}));
 assert.equal(p.source.originalNoAnswerIndependentlyVerified,false);
 assert.equal(p.independentBlindTestPassed,false);
 assert.equal(p.sourceCaseClosed,false);
});
test('09 dossier reads existing M3 and independent V5 auditor; never creates another OCR engine/player/network sink',()=>{
 const code=require('node:fs').readFileSync('benchmark/private-photo-exercise-dossier.cjs','utf8');
 for(const x of ['reviewDimensionPath','validateDraft','solveFiniteFillet',
  'auditPhotoFilletMathAndV5'])assert.ok(code.includes(x));
 assert.doesNotMatch(code,/compileTimeline|createPlayer|new TextDetector|fetch\(|XMLHttpRequest|localStorage|new WebSocket/);
});
