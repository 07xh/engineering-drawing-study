'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {newDraft,reviewCandidate,draftReadiness}=require('../../recognition/problem-draft.cjs');
const {normalizeNativeDetections}=require('../../recognition/browser-native-dimension-ocr.cjs');
const {proposeDimensionPaths}=require('../../recognition/reviewed-dimension-path.cjs');
const {makeDimensionConstraint:attach,prepareSpecialistInput:preflight}=
 require('../../recognition/reviewed-path-dimension-draft.cjs');
const image={width:600,height:400,byteLength:8000,mediaType:'image/png'};
const picture={width:image.width,height:image.height};
const ocr=normalizeNativeDetections([{rawValue:'R8',
 boundingBox:{x:40,y:35,width:60,height:25}}],picture,picture)[0];
const coord=(a,b)=>[
 Math.min(a.x,b.x),Math.min(a.y,b.y),
 Math.max(1,Math.abs(b.x-a.x)),Math.max(1,Math.abs(b.y-a.y))];
const rawLine=(id,a,b)=>({id,kind:'line',
 coordinateSpace:'original-image-px',from:a,to:b,bbox:coord(a,b),
 confirmed:false});
const l1=rawLine('line_1',{x:100,y:250},{x:200,y:250});
const l2=rawLine('line_2',{x:100,y:280},{x:250,y:280});
const leader=rawLine('line_3',{x:100,y:50},{x:170,y:120});
const rawCircle={id:'curve_1',kind:'circle',
 coordinateSpace:'original-image-px',bbox:[165,110,80,80],confirmed:false};
const other={id:'curve_2',kind:'circle',
 coordinateSpace:'original-image-px',bbox:[175,110,80,80],confirmed:false};
const arrow={shaftCandidateId:'line_3',endpoint:'to',
 coordinateSpace:'original-image-px',arrowheadVerified:false,
 requiresHumanReview:true,heuristicScore:.72};
const rect=b=>({x:b[0],y:b[1],width:b[2],height:b[3]});
const pixelLine=x=>({id:x.id,kind:'segment',method:'detector',confidence:.7,
 bbox:rect(x.bbox),reviewStatus:'confirmed',reviewedBy:'user',
 geometry:{frame:'drawing-px',from:{...x.from},to:{...x.to}}});
const pixelCircle=(kind='circle',status='confirmed')=>({
 id:'curve_1',kind,method:'detector',confidence:.6,
 reviewStatus:status,reviewedBy:status==='confirmed'?'user':undefined,
 bbox:rect(rawCircle.bbox),geometry:{frame:'drawing-px',
 center:{x:205,y:150},radiusPx:40,
 ...(kind==='arc'?{startRad:.2,endRad:1.8,direction:'cw'}:{})}
});
function sampleDraft({targetStatus='confirmed',addUnconfirmed=false,kind='circle'}={}){
 return newDraft({image,candidates:[
  pixelLine(l1),pixelLine(l2),pixelLine(leader),
  pixelCircle(kind,targetStatus),
  ...(addUnconfirmed?[{id:'line_4',kind:'segment',method:'detector',
   reviewStatus:'unconfirmed',confidence:.5,
   bbox:{x:70,y:340,width:100,height:1},geometry:{frame:'drawing-px',
    from:{x:70,y:340},to:{x:170,y:340}}}]:[])
 ]});
}
const association=(draft,extra={})=>{
 const curves=[rawCircle,other];
 const paths=proposeDimensionPaths({dimension:ocr,image:picture,
  lines:[leader],curves,arrows:[arrow]});
 const path=paths.proposals.find(p=>p.pathKind==='straight'&&
  p.curveCandidateId==='curve_1');
 assert.ok(path,'genuine OCR->leader->circle hypothesis required');
 return {dimension:ocr,lines:[leader],curves,arrows:[arrow],image:picture,
  selectedPathId:path.id,sourceEpoch:7,currentSourceEpoch:7,
  revision:draft.revision,expectedRevision:draft.revision,
  reviewedTextValueMm:8,unitsConfirmed:true,textConfirmed:true,
  pathConfirmed:true,curveConfirmed:true,arrowReviewed:true,
  finalAccepted:true,answerMark:'contains-answers',...extra};
};
const scale=(a=20,b=30)=>({first:{sourceId:'line_1',
 knownLengthMm:a,confirmed:true},second:{sourceId:'line_2',
 knownLengthMm:b,confirmed:true},originPx:{x:0,y:0},yAxis:'up'});
const request=(d,more={})=>({
 draft:d,expectedRevision:d.revision,association:association(d),
 sourceEpoch:7,currentSourceEpoch:7,calibration:scale(),
 selectedAlternativesReviewed:true,editedGeometryReviewed:true,
 calibrationReviewed:true,targetKindConfirmed:true,...more
});
test('08 competing OCR→line→circle paths preserve ambiguity without writing a constraint',()=>{
 const d=sampleDraft();
 const answer=attach(request(d,{selectedAlternativesReviewed:false}));
 assert.equal(answer.status,'ambiguous-associations-require-user-review');
 assert.ok(answer.alternativePaths.some(x=>x.curveId==='curve_2'));
 assert.equal(answer.draft,null);
 assert.equal(answer.solverReady,false);
 assert.equal(answer.globallyUnique,null);
 assert.equal(d.candidates.length,4);
});
test('08 two independently checked source rulers and manually chosen R8 circle become EXISTING ProblemDraft dimension',()=>{
 const d=sampleDraft(),out=attach(request(d));
 assert.equal(out.status,'dimension-attached-to-existing-draft');
 assert.equal(out.draft.revision,1);
 assert.equal(out.dimensionId,'ocr_1');
 assert.equal(out.sourceTargetId,'curve_1');
 assert.equal(out.calibration.mmPerPx,.2);
 assert.equal(out.calibration.revision,1);
 assert.equal(out.scaleRelativeDifference,0);
 assert.ok(Math.abs(out.dimensionalResidualMm)<1e-10);
 const dim=out.draft.candidates.find(c=>c.id==='ocr_1');
 assert.equal(dim.reviewStatus,'confirmed');
 assert.equal(dim.reviewedBy,'user');
 assert.equal(dim.method,'ocr');
 assert.equal(dim.kind,'dimension');
 assert.deepEqual(dim.dimension,{kind:'radius',rawText:'R8',value:8,
  unit:'mm',refs:['curve_1']});
 assert.equal(out.readiness.status,'candidate-reviewed');
 assert.equal(out.solverReady,false);
 assert.equal(out.constructionIntentReady,false);
 assert.equal(out.metricScaleGloballyProven,false);
 assert.equal(out.answerMark,'contains-answers');
 assert.equal(out.blindExerciseAccepted,false);
 assert.equal(out.globallyUnique,null);
 assert.equal(d.candidates.find(c=>c.kind==='dimension'),undefined);
});
test('09 known inconsistent baseline ratios cannot be averaged or treated as calibrated mm',()=>{
 const d=sampleDraft(),out=attach(request(d,{calibration:scale(20,35)}));
 assert.equal(out.status,'inconsistent-calibration-review-required');
 assert.equal(out.draft,null);
 assert.ok(out.ratioDifference>.03);
 assert.equal(out.solverReady,false);
});
test('09 OCR/leader radius vs existing confirmed circle pixel radius must agree with source mm scale',()=>{
 const d=sampleDraft();
 const changed=association(d,{reviewedTextValueMm:12});
 const out=attach(request(d,{association:changed}));
 assert.equal(out.status,'dimension-scale-conflict');
 assert.ok(Math.abs(out.residualMm)>out.toleranceMm);
 assert.equal(out.draft,null);
});
test('09 target arc cannot masquerade as whole circle or M3 ready input',()=>{
 const d=sampleDraft({kind:'arc'});
 const arcs=[{...rawCircle,kind:'arc'},other];
 const a=association(d,{curves:arcs});
 // The explicit reviewed path ID remains tied to curve_1, but it MUST be
 // rebuilt against an arc proposal. Re-select a real arc-target hypothesis.
 const proposal=proposeDimensionPaths({dimension:ocr,image:picture,
  lines:[leader],curves:arcs,arrows:[arrow]});
 const id=proposal.proposals.find(x=>x.pathKind==='straight'&&
  x.curveCandidateId==='curve_1').id;
 const out=attach(request(d,{association:{...a,selectedPathId:id}}));
 assert.equal(out.status,'partial-arc-requires-specialist-review');
 assert.equal(out.draft,null);
 assert.equal(out.constructionIntentReady,false);
});
test('09 stale draft/source epoch and unconfirmed target/leader invalidate dimension attachment',()=>{
 const d=sampleDraft();
 for(const patch of [
  {sourceEpoch:6},
  {currentSourceEpoch:8},
  {expectedRevision:1},
  {association:association(d,{reviewedTextValueMm:NaN})},
  {editedGeometryReviewed:false},
  {calibrationReviewed:false},
  {targetKindConfirmed:false},
  {calibration:{...scale(),second:{...scale().second,confirmed:false}}},
  {calibration:{...scale(),second:{...scale().first}}},
  {calibration:{...scale(),yAxis:'automatic'}},
 ]){
  assert.throws(()=>attach(request(d,patch)));
 }
 assert.throws(()=>attach(request(sampleDraft({targetStatus:'unconfirmed'}))));
 const original=d.candidates.find(c=>c.id==='line_3');
 const patched=reviewCandidate(d,{id:'line_3',expectedRevision:0,
  decision:'confirmed',patch:{geometry:{frame:'drawing-px',
   from:{x:100,y:50},to:{x:190,y:130}}}});
 assert.notDeepEqual(patched.candidates.find(c=>c.id==='line_3').geometry,
  original.geometry);
 assert.throws(()=>attach(request(patched)),/reviewed leader/);
});
test('09 M3 input gate uses ONLY existing normalizeProblem and rejects the forged/stale handoff',()=>{
 const d=sampleDraft(),out=attach(request(d));
 const args={kind:'segment-circle',sourceIds:{segment:'line_1',
  circle:'curve_1'},filletRadiusMm:2,options:{side:1},
  expectedRevision:out.draft.revision,currentDraft:out.draft};
 const result=preflight(out,args);
 assert.equal(result.status,'reviewed-specialist-input-ready');
 assert.equal(result.problem.kind,'segment-circle');
 assert.equal(result.problem.unit,'mm');
 assert.equal(result.problem.geometry.circle.radius,8);
 assert.equal(result.problem.geometry.segment.a.x,20);
 assert.equal(result.problem.geometry.segment.a.y,-50);
 assert.equal(result.solverExecuted,false);
 assert.equal(result.v5Triggered,false);
 assert.equal(result.globallyUnique,null);
 assert.equal(result.blindExerciseAccepted,false);
 assert.throws(()=>preflight({...out},args),/current reviewed/);
 assert.throws(()=>preflight(out,{...args,currentDraft:d}));
 assert.throws(()=>preflight(out,{...args,expectedRevision:999}));
 assert.throws(()=>preflight(out,{...args,options:{side:2}}));
 assert.throws(()=>preflight(out,{...args,sourceIds:{
  segment:'line_1',circle:'line_2'}}));
});
test('09 incomplete other ProblemDraft candidates leave M3 gate blocked even after an OCR dimension is reviewed',()=>{
 const d=sampleDraft({addUnconfirmed:true}),out=attach(request(d));
 assert.equal(out.status,'dimension-attached-to-existing-draft');
 assert.equal(out.readiness.status,'needs-confirmation');
 assert.equal(out.solverReady,false);
 assert.throws(()=>preflight(out,{kind:'segment-circle',
  sourceIds:{segment:'line_1',circle:'curve_1'},
  filletRadiusMm:2,options:{side:1},
  expectedRevision:out.draft.revision,currentDraft:out.draft
 }),/unconfirmed|ambiguous/);
});
test('09 adapter does not create a second M3 solver, animation player, OCR provider or network client',()=>{
 const fs=require('node:fs');const code=fs.readFileSync(
  'recognition/reviewed-path-dimension-draft.cjs','utf8');
 for(const n of ['reviewDimensionPath','proposeDimensionPaths',
  'reviewCandidate','suggestMillimetresPerImagePixel',
  'compareReviewedRulers','prepareConfirmedFillet'])
  assert.match(code,new RegExp(n));
 assert.doesNotMatch(code,/compileTimeline|createPlayer|runConfirmedSvgFillet|new TextDetector|fetch\(|XMLHttpRequest|localStorage|WebSocket/);
});
