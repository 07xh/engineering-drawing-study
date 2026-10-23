'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {mount}=require('./helpers/dom-app.cjs');
for(const next of [false,true]){
 test('09 actual fillet browser '+(next?'unified':'legacy')+
 ' UI includes opt-in source path review, with no automatic mathematical promotion',()=>{
  const app=mount('labs/auto-fillet-live.html',{next});
  for(const id of ['dimensionPathReview','ocrPathSelect','ocrPathText',
   'ocrPathUnits','ocrPathLeader','ocrPathCurve','ocrPathArrow',
   'ocrPathAnswers','ocrPathFinal','ocrPathReviewButton','ocrPathStatus'])
   assert.ok(app.get(id));
  assert.equal(app.get('ocrPathSelect').disabled,true);
  assert.equal(app.get('ocrPathReviewButton').disabled,true);
  assert.equal(app.get('ocrPathFinal').checked,false);
  assert.equal(app.get('ocrPathAnswers').value,'unknown');
  const old=app.get('result').textContent;
  app.click('ocrPathReviewButton');
  assert.equal(app.get('result').textContent,old);
  assert.match(app.get('ocrPathStatus').textContent,/尚未人工确认/);
  app.set('geo-filletRadius','0','input');
  assert.equal(app.get('saveVerifiedSvg').disabled,true);
  assert.equal(app.get('result').hidden,true);
  assert.equal(app.get('ocrPathReviewButton').disabled,true);
 });
}
test('09 entry connects only to the existing OCR and curve/line/wing providers',()=>{
 const src=require('node:fs').readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const ui=require('node:fs').readFileSync('labs/local-native-ocr-ui.cjs','utf8');
 assert.match(src,/pathReview:\{/);
 assert.match(src,/getCurves:\(\)=>geometryCandidates\.curve/);
 assert.match(src,/getLines:\(\)=>geometryCandidates\.line/);
 assert.match(src,/getArrowHints:\(\)=>arrowHints/);
 assert.match(ui,/reviewDimensionPath\(/);
 assert.match(ui,/proposeDimensionPaths\(/);
 assert.doesNotMatch(ui,/solveFiniteFillet|compileTimeline|new\s+TextDetector/);
});
