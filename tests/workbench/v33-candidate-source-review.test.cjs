'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {locateCandidate}=require('../../recognition/source-candidate-link.cjs');
const {createFieldReview}=require('../../recognition/image-field-review.cjs');
const {defaultValues,defaultChoices}=
 require('../../labs/auto-fillet-form.cjs');
const {createConfirmedFilletSession}=
 require('../../workbench/v31-fillet-session.cjs');
const fs=require('node:fs');
const img=(width,height)=>({width,height});
const candidate=(kind='line',id='line_1')=>({
 id,kind,coordinateSpace:'image-px',bbox:[10,20,50,4],
 confidence:.7,method:'binary-hough-candidate/0.1',
 center:{x:100,y:90},radius:20
});
test('candidate source bounding boxes map exactly to original photo pixels, never mm',()=>{
 const a=locateCandidate(candidate(),img(640,480),img(1280,960));
 assert.equal(a.id,'line_1');assert.equal(a.kind,'line');
 assert.deepEqual([...a.bbox],[20,40,100,8]);
 assert.equal(a.coordinateSpace,'original-image-px');
 assert.equal(a.displayOnly,true);assert.equal(a.confirmed,false);
 assert.equal(a.sourceMethod,'binary-hough-candidate/0.1');
 assert.equal(a.unit,undefined);
 const b=locateCandidate(candidate('arc','curve_1'),img(640,480),img(1280,960));
 assert.equal(b.kind,'arc');
 assert.deepEqual([...b.bbox],[20,40,100,8]);
});
test('source candidate associations cannot be synthesized from invalid / off-image data',()=>{
 for(const sample of [
  {...candidate(),coordinateSpace:'mm'},
  {...candidate(),id:'bad<script'},
  {...candidate(),kind:'solution'},
  {...candidate(),bbox:[630,20,50,4]},
  {...candidate(),bbox:[10,20,0,4]},
  {...candidate(),bbox:[NaN,20,50,4]},
  {...candidate(),bbox:[10,20,Infinity,4]}
 ])assert.throws(()=>locateCandidate(sample,img(640,480),img(1280,960)));
 assert.throws(()=>locateCandidate(candidate(),img(0,480),img(1280,960)));
 assert.throws(()=>locateCandidate(candidate(),img(640,480),img(12000,960)));
});
test('linking candidate only marks original-image source and cannot certify current value',()=>{
 const state=createFieldReview();
 assert.equal(state.setImage(1280,960),true);
 const s=locateCandidate(candidate(),img(640,480),img(1280,960));
 state.mark('a1x',s.bbox,s.id);
 assert.equal(state.progress().marked,1);
 assert.equal(state.progress().confirmed,0);
 assert.equal(state.accept(),false);
 assert.equal(state.review(defaultValues('two-segments'),
  defaultChoices('two-segments'),0).status,'needs-confirmation');
 assert.deepEqual(state.boxes()[0].bbox,[20,40,100,8]);
 assert.equal(state.boxes()[0].detectorCandidateId,'line_1');
 assert.throws(()=>state.mark('a1y',s.bbox,'malicious'));
});
test('after explicit numeric and final approvals, source candidate preserves provenance only',()=>{
 const state=createFieldReview(),values=defaultValues('two-segments');
 state.setImage(1280,960);
 for(const id of state.required()){
  const proposal=locateCandidate(candidate(id==='filletRadius'?'circle':'line',
   id==='filletRadius'?'curve_1':'line_1'),img(640,480),img(1280,960));
  state.mark(id,proposal.bbox,proposal.id);
  state.confirm(id,values[id]);
 }
 assert.equal(state.accept(),true);
 const result=state.review(values,defaultChoices('two-segments'),8);
 assert.equal(result.status,'ready-for-math');
 assert.equal(result.input.problem.unit,'mm');
 assert.equal(result.fieldSources.filletRadius.detectorCandidateId,'curve_1');
 assert.equal(result.fieldSources.a1x.detectorCandidateId,'line_1');
 assert.equal(result.fieldSources.a1x.confidence,0);
 assert.equal(result.input.problem.proof,undefined);
 const session=createConfirmedFilletSession(result.input,{now:0});
 assert.equal(session.snapshot(0).status,'ready');
 values.filletRadius=4;
 state.edited('filletRadius');
 assert.equal(state.review(values,defaultChoices('two-segments'),9).input,null);
 assert.equal(state.progress().accepted,false);
});
test('UI keeps candidate selection and final mm confirmation in distinct controls',()=>{
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const lineUi=fs.readFileSync('labs/local-line-candidates-ui.cjs','utf8');
 const curveUi=fs.readFileSync('labs/local-curve-candidates-ui.cjs','utf8');
 const fieldUi=fs.readFileSync('labs/image-field-review-ui.cjs','utf8');
 for(const id of ['sourceCandidate','associateCandidate','candidateStatus'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(entry,/markCandidate\(candidate\)/);
 assert.match(entry,/onCandidates:items=>receivedCandidates/);
 assert.match(lineUi,/mapLeaderCandidate/);
 assert.match(curveUi,/locateCandidate/);
 assert.match(fieldUi,/state\.mark\(fieldSelect\.value,candidate\.bbox,candidate\.id\)/);
 assert.match(fieldUi,/请再次确认当前毫米数值/);
 assert.doesNotMatch(lineUi,/session\.replace|solveFiniteFillet/);
 assert.doesNotMatch(curveUi,/session\.replace|solveFiniteFillet/);
});
