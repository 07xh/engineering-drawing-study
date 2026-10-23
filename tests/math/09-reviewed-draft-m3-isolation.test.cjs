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
test('forged review artifacts cannot authorize a model M3 input',()=>{
 const d=source(),fake=accepted(d);
 const result=isolateReviewedDraft(fake,{expectedRevision:d.revision,currentDraft:d});
 assert.equal(result.status,'not-verified');
 assert.equal(result.solverInput,undefined);
});
test('revision and scale witness spoofing never bypass the original review',()=>{
 const d=source(),fake=accepted(d);
 for(const candidate of [
  {...fake,calibration:{...fake.calibration,mmPerPx:.3}},
  {...fake,calibration:{...fake.calibration,reviewedBy:null}},
  {...fake,draft:{...d,revision:d.revision+1}}
 ]){
  assert.equal(isolateReviewedDraft(candidate,{expectedRevision:d.revision,currentDraft:d}).status,'not-verified');
 }
});
