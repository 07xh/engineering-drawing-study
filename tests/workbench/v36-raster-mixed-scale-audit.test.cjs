'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {candidateDraftFromRaster}=
 require('../../recognition/raster-primitive-draft.cjs');
const {compareLineCircleMetricEvidence:compare}=
 require('../../labs/manual-raster-mixed-scale-audit.cjs');
const image={width:160,height:160,mediaType:'image/png',byteLength:2048};
const analysis={width:160,height:160};
const line={id:'line_1',kind:'line',coordinateSpace:'image-px',
 bbox:[10,20,80,1],from:{x:10,y:20},to:{x:90,y:20},
 confidence:.8,method:'binary-hough-candidate/0.1'};
const circle={id:'curve_1',kind:'circle',coordinateSpace:'image-px',
 bbox:[40,60,40,40],center:{x:60,y:80},radius:20,
 confidence:.77,method:'connected-ink-circlefit-candidate/0.1'};
function draft(){return candidateDraftFromRaster({
 image,analysis,lines:[line],curves:[circle]
}).draft;}
const edits={line:{from:{x:10,y:20},to:{x:90,y:20}},
 circle:{center:{x:60,y:80},radiusPx:20}};
function request(d=draft(),patch={}){
 return {
  draft:d,expectedRevision:d.revision,lineId:'line_1',circleId:'curve_1',
  editedLine:edits.line,editedCircle:edits.circle,
  knownLengthMm:40,dimensionKind:'diameter',reviewedValueMm:20,
  lineConfirmed:true,circleConfirmed:true,...patch
 };
}
test('same original image: 80px→40mm line and Φ20/20px circle independently agree',()=>{
 const result=compare(request());
 assert.equal(result.status,'not-inconsistent-under-heuristic');
 assert.equal(result.lineMmPerPx,0.5);
 assert.equal(result.circleMmPerPx,0.5);
 assert.equal(result.relativeDifference,0);
 assert.equal(result.mayReuseCurrentScaleSuggestion,true);
 assert.equal(result.globallyUniformScaleProven,false);
 assert.equal(result.mathematicalProof,false);
 assert.equal(result.globallyUnique,null);
 assert.equal(result.approvedModelGeometry,false);
});
test('same mm radius supplied as R10 instead of Φ20 has same diagnostic',()=>{
 const result=compare(request(draft(),{dimensionKind:'radius',reviewedValueMm:10}));
 assert.equal(result.relativeDifference,0);
 assert.equal(result.circleMmPerPx,0.5);
});
test('independently measured R11 contradicts 40mm line: never average or claim uniformity',()=>{
 const result=compare(request(draft(),{dimensionKind:'radius',reviewedValueMm:11}));
 assert.ok(result.relativeDifference>.03);
 assert.equal(result.status,'inconsistent-review-required');
 assert.equal(result.mayReuseCurrentScaleSuggestion,false);
 assert.equal(result.globallyUniformScaleProven,false);
 assert.equal(result.mathematicalProof,false);
});
test('small mismatch below heuristic is not proof of camera perspective correction',()=>{
 const result=compare(request(draft(),{reviewedValueMm:20.1}));
 assert.ok(result.relativeDifference>0&&result.relativeDifference<.03);
 assert.equal(result.mayReuseCurrentScaleSuggestion,true);
 assert.equal(result.perspectiveCorrectionPerformed,false);
 assert.equal(result.mathematicalProof,false);
});
test('missing separate explicit line or circle association approval blocks any comparison',()=>{
 const d=draft();
 for(const patch of [{lineConfirmed:false},{circleConfirmed:false},
  {lineConfirmed:undefined},{circleConfirmed:undefined},
  {expectedRevision:d.revision+1},
  {lineId:'curve_1',circleId:'line_1'},
  {lineId:'line_1',circleId:'line_1'},
  {lineId:'unknown'},
  {circleId:'unknown'}])
  assert.throws(()=>compare(request(d,patch)),undefined,JSON.stringify(patch));
});
test('cropped circle, wrong unit values, very short known ruler and unbounded lines rejected',()=>{
 const d=draft();
 for(const patch of [
  {editedCircle:{center:{x:8,y:80},radiusPx:20}},
  {editedCircle:{center:{x:60,y:80},radiusPx:-1}},
  {editedCircle:{center:{x:60,y:80},radiusPx:Infinity}},
  {editedLine:{from:{x:10,y:20},to:{x:14,y:20}}},
  {editedLine:{from:{x:10,y:20},to:{x:180,y:20}}},
  {editedLine:{from:{x:10,y:20},to:{x:10,y:20}}},
  {knownLengthMm:0},{knownLengthMm:NaN},{knownLengthMm:'40'},
  {reviewedValueMm:0},{reviewedValueMm:Infinity},
  {dimensionKind:'unknown'},
  {editedCircle:{center:{x:60,y:80,z:1},radiusPx:20}}
 ])
  assert.throws(()=>compare(request(d,patch)),undefined,JSON.stringify(patch));
});
test('changed draft or unrelated edited geometry needs renewed original-photo comparison',()=>{
 const d=draft();
 const before=compare(request(d));
 assert.equal(before.sourceRevision,d.revision);
 const {reviewCandidate}=require('../../recognition/problem-draft.cjs');
 const revised=reviewCandidate(d,{id:'line_1',expectedRevision:d.revision,decision:'rejected'});
 assert.throws(()=>compare(request(revised,{expectedRevision:d.revision})),/current draft revision/);
 // The geometry is not auto-promoted to mathematical proof even when edited.
 const correction=compare(request(d,{
  editedCircle:{center:{x:62,y:80},radiusPx:20}
 }));
 assert.equal(correction.globallyUniformScaleProven,false);
});
test('crosscheck only makes bounded local diagnostic; no raw image upload or solving',()=>{
 const src=fs.readFileSync('labs/manual-raster-mixed-scale-audit.cjs','utf8');
 assert.doesNotMatch(src,/(fetch\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|eval\()/);
 assert.doesNotMatch(src,/solveFiniteFillet|confirmedFilletTimeline|session\.replace/);
 assert.match(src,/sourceRevision:d\.revision/);
});
