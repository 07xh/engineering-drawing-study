'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {suggestMillimetresPerImagePixel:suggest}=
 require('../../labs/manual-raster-scale-calibration.cjs');
const {compareReviewedRulers:compare}=
 require('../../labs/manual-raster-ruler-crosscheck.cjs');
const img={width:1000,height:800};
const a=(mm=50)=>suggest({image:img,sourceId:'line1',explicitlyReviewed:true,
 from:{x:100,y:100},to:{x:200,y:100},knownLengthMm:mm});
const b=(mm=80)=>suggest({image:img,sourceId:'line2',explicitlyReviewed:true,
 from:{x:100,y:300},to:{x:260,y:300},knownLengthMm:mm});
test('two independent manually reviewed ruler lengths yield identical local scale',()=>{
 const result=compare(a(),b());
 assert.equal(result.relativeDifference,0);
 assert.equal(result.status,'not-inconsistent-under-heuristic');
 assert.equal(result.mayReusePrimarySuggestion,true);
 assert.deepEqual(result.sourceIds,['line1','line2']);
 assert.equal(result.globallyUniformScaleProven,false);
 assert.equal(result.perspectiveCorrectionPerformed,false);
 assert.equal(result.independentMathProof,false);
});
test('nonuniform synthetic photo scale is flagged and must invalidate the primary proposal',()=>{
 const result=compare(a(),b(100));
 assert.equal(result.status,'inconsistent-review-required');
 assert.equal(result.mayReusePrimarySuggestion,false);
 assert.ok(result.relativeDifference>result.heuristicThreshold);
 assert.equal(result.heuristicThreshold,.03);
});
test('small mismatch below heuristic threshold is not claimed to prove uniformity',()=>{
 const result=compare(a(),b(82));
 assert.equal(result.mayReusePrimarySuggestion,true);
 assert.ok(result.relativeDifference>0&&result.relativeDifference<.03);
 assert.equal(result.globallyUniformScaleProven,false);
});
test('same source, incomplete provenance and manipulated mm rates must be rejected',()=>{
 assert.throws(()=>compare(a(),a()),/distinct/);
 assert.throws(()=>compare(a(),null),/distinct/);
 assert.throws(()=>compare(a(),{...b(),mmPerPx:-1}),/distinct/);
 assert.throws(()=>compare({...a(),verifiedDrawingScale:true},b()),/distinct/);
 assert.throws(()=>compare({...a(),calibrationFrame:'mm'},b()),/distinct/);
});
test('raster solver UI offers explicit second calibration and prevents stale scale use',()=>{
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const ui=fs.readFileSync('labs/local-raster-geometry-review-ui.cjs','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 for(const id of ['rasterCrossSource','rasterCrossLength','rasterCrossReviewed',
  'rasterCrossCalculate','rasterCrossStatus'])
  assert.match(html,new RegExp('id="'+id+'"'));
 for(const prop of ['crossSource','crossLength','crossReviewed',
  'crossCalculate','crossStatus'])
  assert.match(entry,new RegExp(prop+':\\$\\('));
 assert.match(ui,/compareReviewedRulers\(a,b\)/);
 assert.match(ui,/if\(!comparison\.mayReusePrimarySuggestion\)/);
 assert.match(ui,/derivedScale=null;mmPerPx\.value=''/);
 assert.match(ui,/1e-10\*Math\.max\(1,a\.mmPerPx\)/);
 assert.match(ui,/partial second-ruler crosscheck controls/);
 assert.match(ui,/second ruler requires first-ruler scale assistant/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|localStorage|solveFiniteFillet/);
});
