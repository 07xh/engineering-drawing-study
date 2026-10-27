'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync('labs/c1-reviewed-dxf-live.html','utf8');
const js=fs.readFileSync('labs/c1-reviewed-dxf-live-entry.cjs','utf8');
const build=fs.readFileSync('scripts/build-static.cjs','utf8');
test('actual local-only DXF given review page is wired to official site with one existing V5 consumer',()=>{
 new vm.Script(js,{filename:'c1-reviewed-dxf-live-entry.cjs'});
 // The math/workbench shard intentionally runs without node_modules:
 // never introduce a jsdom/linkedom requirement for a proof-gate test.
 const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
 for(const id of ['givenFile','previewFile','sourcePreview','sourcePoints',
  'sourcePairs','applyPairs','reviewCheck','compile','sheetPreview',
  'animation','status','candidate','proof','v5Status','play','pause','prev','next'])
  assert.equal(ids.filter(x=>x===id).length,1,id);
 assert.equal((html.match(/type="file"/g)||[]).length,2,
  'only local GIVEN JSON and original-source picture input are accepted');
 assert.match(html,/id="givenFile"[^>]*accept="\.json,application\/json"/);
 assert.match(html,/id="previewFile"[^>]*accept="image\/png,image\/jpeg,image\/webp"/);
 assert.match(html,/id="sourcePairs"/);
 assert.match(html,/<button id="applyPairs"[^>]*disabled/);
 assert.match(html,/<input id="reviewCheck"[^>]*disabled/);
 assert.match(html,/<button id="compile"[^>]*disabled/);
 assert.match(html,/c1-reviewed-dxf-live-bundle\.js/);
 assert.match(build,/labs\/c1-reviewed-dxf-live\.html/);
 assert.match(build,/labs\/c1-reviewed-dxf-live-entry\.cjs/);
 assert.match(build,/labs\/c1-reviewed-dxf-live-bundle\.js/);
 assert.match(fs.readFileSync('labs/solid-third-view-live.html','utf8'),
  /c1-reviewed-dxf-live\.html/);
 assert.match(js,/reconstructC1FromDxfGiven/);
 assert.match(js,/compileReviewedC1DxfGivenToSoleV5/);
 assert.match(js,/withEditedReviewedSourcePairs/);
 assert.match(js,/listGivenSourceProjectionIndices/);
 assert.match(js,/stringifyReviewedSourcePairs/);
 assert.match(js,/sourcePairs'\)\.addEventListener\('input'/);
 assert.match(js,/invalidateDerived\(\)/);
 assert.match(js,/\bURL\.revokeObjectURL\(previewObjectUrl\)/);
 assert.match(js,/\bURL\.createObjectURL\(file\)/);
 assert.match(js,/Motion\.updateSvg/);
 assert.match(js,/sheetPreview'\)\.innerHTML=result\.solution\.threeViewSvgSheet\.sheetSvg/);
 assert.doesNotMatch(js,/\bfetch\(|\blocalStorage\.|\bsessionStorage\.|XMLHttpRequest/);
 assert.doesNotMatch(js,/referenceStrokes|referencePacket|referenceStrokes\.json/);
});
test('only safe local original given selection is accepted; invalid and answer-bearing objects stay rejected',()=>{
 const {validateGivenPacket}=require(
  '../../workbench/c1-authenticated-dxf-to-reviewed-v5.cjs');
 assert.throws(()=>validateGivenPacket({
  schema:'draftai-c1-isolated-dxf-answer-strokes/1',
  sourceSha256:'a'.repeat(64),convertedDxfSha256:'b'.repeat(64),
  referenceStrokes:[],view:'W'
 }),/unsigned current original DXF/);
});
