'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {runSyntheticRecognitionQuality:report}=
 require('../../scripts/report-recognition-quality.cjs');
test('actual finite-line Hough detector is measured against generated image ground truth',()=>{
 const out=report();
 const scene=out.rows.find(x=>x.scene==='synthetic-finite-horizontal-line');
 assert.ok(scene);
 assert.ok(scene.observedPredictions>=1,JSON.stringify(scene));
 assert.equal(scene.byKind.line.tp,1,JSON.stringify(scene));
 assert.equal(scene.byKind.line.fn,0);
 assert.equal(scene.qualityIsNotMathProof,true);
});
test('actual raster circle and arc detector proposals are measured separately',()=>{
 const out=report();
 const circle=out.rows.find(x=>x.scene==='synthetic-closed-circle');
 const arc=out.rows.find(x=>x.scene==='synthetic-partial-circular-arc');
 assert.ok(circle&&arc);
 assert.equal(circle.byKind.circle.tp,1,JSON.stringify(circle));
 assert.equal(circle.byKind.circle.fn,0);
 assert.equal(arc.byKind.arc.tp,1,JSON.stringify(arc));
 assert.equal(arc.byKind.arc.fn,0);
});
test('empty synthetic page avoids fabricated line detections',()=>{
 const blank=report().rows.find(x=>x.scene==='synthetic-empty-page');
 assert.equal(blank.truthCount,0);
 assert.equal(blank.observedPredictions,0);
 assert.equal(blank.metrics.precision,null);
 assert.equal(blank.metrics.f1,null);
});
test('OCR text parser quality is labeled injected, not presented as real OCR accuracy',()=>{
 const out=report();
 const scene=out.rows.find(x=>x.scene==='synthetic-injected-OCR-transcript');
 assert.equal(scene.byKind.dimension.tp,2);
 assert.equal(scene.byKind.dimension.fp,0);
 assert.equal(scene.byKind.dimension.fn,0);
 assert.equal(out.liveOcrEngineRuns,0);
 assert.equal(out.realPhotoCount,0);
 assert.match(scene.source,/fake-TextDetector/);
 assert.match(out.disclosure,/no real-photo accuracy claim/);
});
test('report is deterministic and does not read hidden/private image files',()=>{
 const a=report(),b=report();
 assert.deepEqual(a,b);
 const fs=require('node:fs');
 const source=fs.readFileSync('scripts/report-recognition-quality.cjs','utf8');
 const scenes=fs.readFileSync('tests/recognition/synthetic-quality-scenes.cjs','utf8');
 assert.match(source,/detectLineCandidates/);
 assert.match(source,/detectCurveCandidates/);
 assert.match(source,/evaluateRecognitionProposals/);
 assert.doesNotMatch(source,/\bfetch\s*\(|\bXMLHttpRequest\b|localStorage/);
 assert.doesNotMatch(source,/session\.replace|solveFiniteFillet|globallyUnique/);
 assert.doesNotMatch(scenes,/readFileSync|private|https:\/\//);
});
