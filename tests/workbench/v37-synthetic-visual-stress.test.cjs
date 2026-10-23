'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {perturb}=require('../recognition/synthetic-image-stress.cjs');
const {scenarios}=require('../recognition/synthetic-quality-scenes.cjs');
const {runStressRecognitionReport:run}=
 require('../../scripts/report-recognition-stress.cjs');
test('four deterministic scan-like perturbations do not alter original source pixels',()=>{
 const first=scenarios()[0].image;
 const original=Buffer.from(first.data);
 for(const kind of ['low-contrast','paper-gradient','speckle','ink-gaps']){
  const a=perturb(first,kind),b=perturb(first,kind);
  assert.notEqual(a.data,first.data);
  assert.deepEqual(a.data,b.data);
  assert.deepEqual({width:a.width,height:a.height},
   {width:first.width,height:first.height});
 }
 assert.deepEqual(Buffer.from(first.data),original);
});
test('stress report invokes the actual line and curve detectors on each generated frame',()=>{
 const report=run();
 assert.equal(report.realPhotoCount,0);
 assert.equal(report.browserOcrRuns,0);
 assert.deepEqual(report.variantNames,['baseline','low-contrast',
  'paper-gradient','speckle','ink-gaps']);
 assert.equal(report.comparisons.length,4*5);
 assert.ok(report.comparisons.some(x=>x.scenario==='synthetic-partial-circular-arc'));
 assert.ok(report.comparisons.every(x=>x.independentGeometryProof===false));
 assert.ok(report.comparisons.every(x=>x.labelsAreOriginalUnchangedPixels===true));
});
test('baseline is self-consistent, and known simple shapes remain detectable',()=>{
 const report=run();
 const baseline=report.comparisons.filter(c=>c.variant==='baseline');
 assert.equal(baseline.length,4);
 for(const row of baseline){
  assert.deepEqual(row.observed,row.baseline);
  assert.equal(row.deltaRecall,row.baseline.recall===null?null:0);
 }
 for(const row of baseline.filter(x=>x.baseline.recall!==null)){
  assert.equal(row.baseline.recall,1,JSON.stringify(row));
 }
});
test('degraded detector performance is reported with exact scenario and missing IDs',()=>{
 const report=run();
 const recomputed=report.comparisons.filter(x=>
  x.deltaRecall!==null&&x.deltaRecall<0||x.additionalFalsePositives>0);
 assert.equal(report.degradations.length,recomputed.length);
 for(const issue of report.degradations){
  assert.ok(report.variantNames.includes(issue.variant));
  assert.ok(issue.scenario.startsWith('synthetic-'));
  assert.ok(Array.isArray(issue.missing));
  assert.ok(issue.lostRecall===null||issue.lostRecall>=0);
 }
});
test('stress tests never claim a real photo set, private assets or math proof',()=>{
 const fs=require('node:fs');
 const reporter=fs.readFileSync('scripts/report-recognition-stress.cjs','utf8');
 const fixture=fs.readFileSync('tests/recognition/synthetic-image-stress.cjs','utf8');
 assert.match(reporter,/detectLineCandidates/);
 assert.match(reporter,/detectCurveCandidates/);
 assert.match(reporter,/evaluateRecognitionProposals/);
 assert.doesNotMatch(reporter,/\bfetch\s*\(|\bXMLHttpRequest\s*\(|\blocalStorage\s*\./);
 assert.doesNotMatch(fixture,/\breadFileSync\s*\(|\bfetch\s*\(|\blocalStorage\s*\./);
 assert.doesNotMatch(reporter,/solveFiniteFillet|session\.replace/);
 assert.match(reporter,/realPhotoCount:0/);
});
