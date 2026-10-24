'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {newDraft}=require('../../recognition/problem-draft.cjs');
const {normalizeNativeDetections}=require('../../recognition/browser-native-dimension-ocr.cjs');
const {proposeDimensionPaths}=require('../../recognition/reviewed-dimension-path.cjs');
const {makeDimensionConstraint:attach}=
 require('../../recognition/reviewed-path-dimension-draft.cjs');
const {isolateReviewedDraft:isolate}=
 require('../../workbench/reviewed-draft-m3-isolation.cjs');
const {prepareConfirmedFillet}=require('../../integration/v31-confirmed-svg-fillet-v5.cjs');
const image={width:600,height:400,byteLength:8000,mediaType:'image/png'};
const bounds={width:600,height:400};
const ocr=normalizeNativeDetections([{rawValue:'R8',
 boundingBox:{x:40,y:35,width:60,height:25}}],bounds,bounds)[0];
function raw(id,a,b){
 return {id,kind:'line',coordinateSpace:'original-image-px',
  from:a,to:b,bbox:[Math.min(a.x,b.x),Math.min(a.y,b.y),
   Math.max(1,Math.abs(b.x-a.x)),Math.max(1,Math.abs(b.y-a.y))],
  confirmed:false};
}
const a=raw('line_1',{x:100,y:250},{x:200,y:250});
const b=raw('line_2',{x:100,y:280},{x:250,y:280});
const leader=raw('line_3',{x:100,y:50},{x:170,y:120});
const target={id:'curve_1',kind:'circle',
 coordinateSpace:'original-image-px',bbox:[165,110,80,80],confirmed:false};
const other={...target,id:'curve_2',bbox:[175,110,80,80]};
const arrow={shaftCandidateId:'line_3',endpoint:'to',
 coordinateSpace:'original-image-px',arrowheadVerified:false,
 requiresHumanReview:true,heuristicScore:.72};
const line=r=>({
 id:r.id,kind:'segment',method:'detector',confidence:.7,
 reviewStatus:'confirmed',reviewedBy:'user',
 bbox:{x:r.bbox[0],y:r.bbox[1],width:r.bbox[2],height:r.bbox[3]},
 geometry:{frame:'drawing-px',from:r.from,to:r.to}
});
function draft(extra=[]){
 return newDraft({image,candidates:[line(a),line(b),line(leader),
  {id:'curve_1',kind:'circle',method:'detector',confidence:.6,
   reviewStatus:'confirmed',reviewedBy:'user',
   bbox:{x:165,y:110,width:80,height:80},
   geometry:{frame:'drawing-px',center:{x:205,y:150},radiusPx:40}},
  ...extra]});
}
function reviewed({originPx={x:0,y:0},yAxis='up',
 draftInput=draft()}={}){
 const proposed=proposeDimensionPaths({
  dimension:ocr,lines:[leader],curves:[target,other],
  arrows:[arrow],image:bounds});
 const selected=proposed.proposals.find(p=>p.pathKind==='straight'&&
  p.curveCandidateId==='curve_1');
 assert.ok(selected,'must recompute a real reviewed association');
 const req={dimension:ocr,lines:[leader],curves:[target,other],
  arrows:[arrow],image:bounds,selectedPathId:selected.id,
  sourceEpoch:7,currentSourceEpoch:7,revision:draftInput.revision,
  expectedRevision:draftInput.revision,reviewedTextValueMm:8,
  unitsConfirmed:true,textConfirmed:true,pathConfirmed:true,
  curveConfirmed:true,arrowReviewed:true,finalAccepted:true,
  answerMark:'contains-answers'};
 const attached=attach({
  draft:draftInput,expectedRevision:draftInput.revision,
  association:req,sourceEpoch:7,currentSourceEpoch:7,
  calibration:{
   first:{sourceId:'line_1',knownLengthMm:20,confirmed:true},
   second:{sourceId:'line_2',knownLengthMm:30,confirmed:true},
   originPx,yAxis},
  selectedAlternativesReviewed:true,editedGeometryReviewed:true,
  calibrationReviewed:true,targetKindConfirmed:true
 });
 assert.equal(attached.status,'dimension-attached-to-existing-draft');
 return attached;
}
const iso=attached=>isolate(attached,{
 expectedRevision:attached.draft.revision,currentDraft:attached.draft});
const conditions=r=>Object.fromEntries(r.solverInput.conditions.map(x=>[x.id,x.geometry]));
function compareM3(attached,c){
 const prepared=prepareConfirmedFillet({
  draft:attached.draft,expectedRevision:attached.draft.revision,
  calibration:attached.calibration,
  kind:'segment-circle',sourceIds:{segment:'line_1',circle:'curve_1'},
  filletRadiusMm:2,options:{side:1}
 });
 assert.equal(prepared.problem.unit,'mm');
 assert.deepEqual(prepared.problem.geometry.segment.a,
  {x:c.line_1.start[0],y:c.line_1.start[1]});
 assert.deepEqual(prepared.problem.geometry.segment.b,
  {x:c.line_1.end[0],y:c.line_1.end[1]});
 assert.deepEqual(prepared.problem.geometry.circle.center,
  {x:c.curve_1.center[0],y:c.curve_1.center[1]});
 assert.equal(prepared.problem.geometry.circle.radius,c.curve_1.radius);
 assert.equal(prepared.provenance.metricCalibrationMathematicallyProven,false);
}
test('REAL two-ruler photo witness → M0 pixel→mm → existing M3 input agrees with analytic oracle',()=>{
 const attached=reviewed(),r=iso(attached);
 assert.equal(r.status,'reviewed-conditions-isolated');
 assert.equal(r.m0MetricFrameStatus,'user-reviewed-provisional');
 assert.equal(r.imageSourceIndependentlyAuthenticated,false);
 assert.equal(r.globallyUniformScaleProven,false);
 assert.equal(r.solverInput.sourceRevision,attached.draft.revision);
 assert.equal(r.answerReferencePermittedInSolver,false);
 assert.deepEqual(conditions(r).line_1,
  {type:'line',start:[20,-50],end:[40,-50]});
 assert.deepEqual(conditions(r).curve_1,
  {type:'circle',center:[41,-30],radius:8});
 compareM3(attached,conditions(r));
});
test('shifted reviewed original pixel origin and downward model Y agree with M3',()=>{
 const attached=reviewed({originPx:{x:100,y:100},yAxis:'down'}),r=iso(attached);
 assert.equal(r.status,'reviewed-conditions-isolated');
 assert.deepEqual(conditions(r).line_1,
  {type:'line',start:[0,30],end:[20,30]});
 assert.deepEqual(conditions(r).curve_1,
  {type:'circle',center:[21,10],radius:8});
 compareM3(attached,conditions(r));
});
test('witnessed confirmed drawing point outside actual image bounds cannot become model mm',()=>{
 const extra={id:'line_4',kind:'segment',method:'manual',
  confidence:1,reviewStatus:'confirmed',reviewedBy:'user',
  bbox:{x:20,y:330,width:100,height:1},
  geometry:{frame:'drawing-px',
   from:{x:50,y:330},to:{x:650,y:330}}};
 const attached=reviewed({draftInput:draft([extra])});
 assert.equal(iso(attached).status,'not-verified');
 assert.equal(iso(attached).solverInput,undefined);
});
test('reviewed but out-of-photo origin cannot be used by original-image M0 calibration',()=>{
 const attached=reviewed({originPx:{x:-100,y:0}});
 assert.equal(iso(attached).status,'not-verified');
});
test('nonidentity drawing-to-original homography cannot masquerade as pixel mm',()=>{
 const changed={...draft(),sourceToDrawing:[2,0,0,0,2,0,0,0,1]};
 assert.throws(()=>reviewed({draftInput:changed}),/original image|identity/);
});
test('stale draft source revision and copied reviewed witness remain unauthorized',()=>{
 const a=reviewed();
 assert.equal(isolate(a,{expectedRevision:a.draft.revision+1,
  currentDraft:a.draft}).status,'not-verified');
 assert.equal(iso({...a}).status,'not-verified');
});
test('native photo M3 entry really imports existing M0 pixel frame, not another coordinate kernel',()=>{
 const fs=require('node:fs');
 const src=fs.readFileSync('workbench/reviewed-draft-m3-isolation.cjs','utf8');
 assert.match(src,/createReviewedPixelFrame/);
 assert.match(src,/toModelMillimetres/);
 assert.doesNotMatch(src,/const map=p=>\[\(p\.x-origin\.x\)\*scale/);
});
