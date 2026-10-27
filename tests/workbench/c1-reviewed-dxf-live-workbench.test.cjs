'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
const html=fs.readFileSync('labs/c1-reviewed-dxf-live.html','utf8');
const js=fs.readFileSync('labs/c1-reviewed-dxf-live-entry.cjs','utf8');
const build=fs.readFileSync('scripts/build-static.cjs','utf8');
test('actual local-only DXF given review page is wired to official site with one existing V5 consumer',()=>{
 new vm.Script(js,{filename:'c1-reviewed-dxf-live-entry.cjs'});
 const {document}=parseHTML(html);
 for(const id of ['givenFile','reviewCheck','compile','sheetPreview',
  'animation','status','candidate','proof','v5Status','play','pause','prev','next'])
  assert.equal(document.querySelectorAll('#'+id).length,1,id);
 assert.equal(document.querySelectorAll('input[type=file]').length,1,
  'browser accepts ONLY a local GIVEN JSON, never a reference answer');
 assert.equal(document.getElementById('compile').hasAttribute('disabled'),true);
 assert.equal(document.getElementById('reviewCheck').hasAttribute('disabled'),true);
 assert.match(html,/c1-reviewed-dxf-live-bundle\.js/);
 assert.match(build,/labs\/c1-reviewed-dxf-live\.html/);
 assert.match(build,/labs\/c1-reviewed-dxf-live-entry\.cjs/);
 assert.match(build,/labs\/c1-reviewed-dxf-live-bundle\.js/);
 assert.match(fs.readFileSync('labs/solid-third-view-live.html','utf8'),
  /c1-reviewed-dxf-live\.html/);
 assert.match(js,/reconstructC1FromDxfGiven/);
 assert.match(js,/compileReviewedC1DxfGivenToSoleV5/);
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
