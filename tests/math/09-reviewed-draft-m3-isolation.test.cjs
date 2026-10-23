'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {newDraft,reviewCandidate}=require('../../recognition/problem-draft.cjs');
const {isolateReviewedDraft}=require('../../workbench/reviewed-draft-m3-isolation.cjs');
const image={width:400,height:300,byteLength:8000,mediaType:'image/png'};
function source(){
 let d=newDraft({image,candidates:[{id:'line_1',kind:'segment',method:'manual',
  confidence:1,reviewStatus:'unconfirmed',bbox:{x:10,y:10,width:100,height:2},
  geometry:{frame:'drawing-px',from:{x:10,y:11},to:{x:110,y:11}}}]});
 d=reviewCandidate(d,{id:'line_1',expectedRevision:d.revision,decision:'confirmed'});
 return d;
}
function accepted(d,scale=.2){
 return {status:'dimension-attached-to-existing-draft',draft:d,
  geometryAndDimensionReviewed:true,scaleRelativeDifference:0,
  dimensionId:'ocr_1',selectedPathId:'path_1',sourceTargetId:'line_1',
  calibration:{reviewedBy:'user',mmPerPx:scale,revision:d.revision,
   originPx:{x:0,y:0},yAxis:'up'}};
}
test('versioned draft becomes millimetre input and scale binds its digest',()=>{
 const d=source(),a=isolateReviewedDraft(accepted(d),{expectedRevision:d.revision,currentDraft:d});
 assert.equal(a.status,'reviewed-conditions-isolated');
 assert.deepEqual(a.solverInput.conditions[0].geometry.start,[2,-2.2]);
 const b=isolateReviewedDraft(accepted(d,.3),{expectedRevision:d.revision,currentDraft:d});
 assert.equal(b.status,'reviewed-conditions-isolated');
 assert.notEqual(a.sourceBinding,b.sourceBinding);
 assert.notEqual(a.solverInputHash,b.solverInputHash);
});
test('revision, scale witness and unreviewed candidate fail closed',()=>{
 const d=source(),a=accepted(d);
 assert.equal(isolateReviewedDraft(a,{expectedRevision:d.revision+1,currentDraft:d}).status,'not-verified');
 assert.equal(isolateReviewedDraft({...a,calibration:{...a.calibration,reviewedBy:null}},
  {expectedRevision:d.revision,currentDraft:d}).status,'not-verified');
 assert.equal(isolateReviewedDraft(a,{expectedRevision:d.revision,currentDraft:{...d,revision:d.revision+1}}).status,'not-verified');
});
