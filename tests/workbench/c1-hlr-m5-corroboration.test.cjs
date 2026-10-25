'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {corroborateC1HlrWithM5}=require('../../workbench/c1-hlr-m5-corroboration.cjs');
const hint={schema:'draftai-c1-hlr-candidate-evidence/1',status:'unverified-cad-candidates',revision:10,v5Ready:false,
 candidates:[{view:'V',sourceEdgeId:'edge-A',hlrClass:'visible',officialLineStyle:'undetermined',v5Ready:false}]};
const m5={revision:10,segments:[{view:'V',sourceEdgeId:'edge-A',sourceParameterRange:[0,1],openInteriorVisibility:'visible'}]};
test('CAD agrees with positive M5 open-ray proof but cannot sign V5',()=>{
 const r=corroborateC1HlrWithM5({hlrEvidence:hint,m5Evidence:m5});
 assert.equal(r.findings[0].m5Status,'corroborated-open-interior');
 assert.equal(r.findings[0].officialLineStyle,'undetermined');
 assert.equal(r.constructionIntentSigned,false);assert.equal(r.v5Ready,false);
});
test('CAD and M5 disagree: flag conflict without upgrading hidden or visible line',()=>{
 const r=corroborateC1HlrWithM5({hlrEvidence:hint,m5Evidence:{...m5,
 segments:[{...m5.segments[0],openInteriorVisibility:'hidden'}]}});
 assert.equal(r.findings[0].m5Status,'conflict');assert.equal(r.v5Ready,false);
});
test('unknown ray or missing source is insufficient; mismatched revisions fail closed',()=>{
 for(const segments of [[],[{...m5.segments[0],openInteriorVisibility:'undetermined'}]]){
  const r=corroborateC1HlrWithM5({hlrEvidence:hint,m5Evidence:{...m5,segments}});
  assert.equal(r.findings[0].m5Status,'insufficient');
 }
 assert.throws(()=>corroborateC1HlrWithM5({hlrEvidence:hint,m5Evidence:{...m5,revision:11}}),/same-revision/);
});
