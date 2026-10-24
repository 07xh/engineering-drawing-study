'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {solveVerifiedSectionEvidence}=
 require('../../engines/spatial/sections/verified-section-evidence.cjs');
const {prismSectionV5Preview}=
 require('../../engines/spatial/sections/rectangular-prism-v5-preview.cjs');
const {pyramidSectionV5Preview}=
 require('../../engines/spatial/sections/rectangular-pyramid-v5-preview.cjs');
const {assertSpatialSectionV5Parity,buildScopedSpatialSectionV5Preview}=
 require('../../workbench/spatial-section-v5-parity.cjs');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const p=(x,y,z)=>({x,y,z});
const inputs=[
 {kind:'rectangular-prism',
  solid:{min:p(0,0,0),max:p(10,12,14)},
  plane:{point:p(0,0,17),normal:p(1,1,1)}},
 {kind:'rectangular-pyramid',
  solid:{base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)},
  plane:{point:p(0,0,15),normal:p(1,1,1)}}
].map(x=>({...x,frame:'model-mm-3d',unit:'mm'}));
const old=(x)=>x.kind==='rectangular-prism'?
 prismSectionV5Preview(x.solid,x.plane):
 pyramidSectionV5Preview(x.solid,x.plane);
for(const input of inputs){
 test('one actual M3 perimeter maps to OLD V5 ConstructionStep DAG without visibility promotion: '+input.kind,()=>{
  const evidence=solveVerifiedSectionEvidence(input);
  const preview=buildScopedSpatialSectionV5Preview({input,evidence,revision:21});
  assert.equal(preview.status,'preview-only');
  assert.equal(preview.revision,21);
  assert.equal(preview.steps.length>0,true);
  assert.equal(preview.mathScope,'independently-audited-finite-polygon-perimeter');
  assert.equal(preview.fullSpatialConstructionIntentVerified,false);
  assert.equal(preview.visibilityVerified,false);
  assert.equal(preview.canPromoteToVerifiedResult,false);
  assert.equal(Object.isFrozen(preview.steps),true);
  assert.equal(Object.isFrozen(preview.steps[0].actions),true);
  const original=old(input);
  assert.deepEqual(preview.steps,original.steps);
  assert.deepEqual(preview.timing,Timeline.compileTimeline(preview.steps));
  const player=Timeline.createPlayer(preview.timing,{revision:21});
  assert.equal(player.canRender(21),true);
  assert.equal(player.canRender(22),false);
  assert.equal(player.seekProgress(1,performance.now()).done,true);
  const pipeline=evaluateUnifiedMath({kind:'spatial-section',input,revision:21});
  assert.deepEqual(pipeline.sectionConstructionPreview,preview);
  assert.equal(pipeline.v5Ready,false);
  assert.equal(pipeline.mathematicallyVerified,false);
  assert.equal(pipeline.verifiedVisibility,false);
  assert.deepEqual(pipeline.steps,[]);
  assert.deepEqual(pipeline.constructionIntents,[]);
  assert.equal(pipeline.timing,null);
 });
 test('shared projection gate rejects spoofed visibility, geometry, missing steps and timing: '+input.kind,()=>{
  const evidence=solveVerifiedSectionEvidence(input);
  const source=old(input);
  const run=plan=>assertSpatialSectionV5Parity({input,evidence,plan,revision:0});
  assert.equal(run(source),true);
  const clone=()=>structuredClone(source);
  const visibility=clone();
  visibility.steps.find(s=>s.role==='result').actions[0].visibility='visible';
  assert.throws(()=>run(visibility),/visibility/);
  const coord=clone();
  coord.stations[0].V.x+=3;
  assert.throws(()=>run(coord),/projection|station/);
  const result=clone();
  result.steps.find(s=>s.role==='result').actions.pop();
  assert.throws(()=>run(result),/missing V\/H\/W/);
  const earlier=clone();
  earlier.steps[0].dependsOn=['future'];
  assert.throws(()=>run(earlier),/ConstructionStep/);
  const timeline=clone();
  timeline.timing.totalMs++;
  assert.throws(()=>run(timeline),/timeline/);
  const wrong=clone();wrong.v5PreviewReady=false;
  assert.throws(()=>run(wrong),/visibility or whole drawing/);
  const fake={...evidence,sourceMethod:'untrusted-caller-result'};
  assert.throws(()=>assertSpatialSectionV5Parity({
   input,evidence:fake,plan:source,revision:0}),/trusted M3/);
 });
}
test('no intersection and analytically sampled surfaces never obtain polygon V5',()=>{
 const prism=inputs[0];
 const missing={...prism,plane:{point:p(0,0,90),normal:p(0,0,1)}};
 const failed=evaluateUnifiedMath({kind:'spatial-section',input:missing,revision:4});
 assert.equal(failed.status,'not-verified');
 assert.equal(failed.sectionConstructionPreview,null);
 assert.equal(failed.v5Ready,false);
 const cylinder={kind:'cylinder-lateral',solid:{
  baseCenter:p(0,0,0),radiusMm:5,heightMm:30
 },plane:{point:p(0,0,15),normal:p(1,0,1)},
 frame:'model-mm-3d',unit:'mm',samples:24};
 const result=evaluateUnifiedMath({kind:'spatial-section',input:cylinder,revision:4});
 assert.equal(result.status,'geometry-only');
 assert.equal(result.sectionConstructionPreview,null,
  'sampled curve must not pretend to be proven straight-edged perimeter');
});
