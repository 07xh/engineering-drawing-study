'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const {parseHTML}=require('linkedom');const {homeHTML}=require('../../ui-next/home.cjs');
test('project actions are reachable without crowding the main project selector',()=>{
 const {document}=parseHTML('<main>'+homeHTML()+'</main>');const menu=document.querySelector('details.v7-project-menu');
 assert.ok(menu);assert.ok(!menu.hasAttribute('open'));assert.ok(menu.querySelector('summary'));
 for(const id of ['v7-export','v7-import','v7-delete'])assert.ok(menu.querySelector('#'+id),id);
 for(const id of ['v7-projects','v7-open','v7-new','v7-storage-warning'])assert.ok(!menu.contains(document.getElementById(id)),id);
});
test('two-view review page uses task language while retaining human review controls',()=>{
 const {document}=parseHTML(fs.readFileSync('labs/c1-reviewed-dxf-live.html','utf8'));
 assert.doesNotMatch(document.querySelector('h1').textContent,/C1|V5|M3|M0/);
 for(const id of ['applyPairs','compile','showGiven','showCandidate','play','pause','prev','next','v5StepTitle','v5StepExplanation'])assert.ok(document.getElementById(id),id);
 assert.match(document.querySelector('main').textContent,/人工|核对/);
});
test('source review actions use task language and keep explicit confirmation',()=>{
 const {document}=parseHTML(fs.readFileSync('labs/auto-fillet-live.html','utf8'));
 for(const id of ['photoByteRetry','dimensionDraftAttach','dimensionDraftPreflight','dimensionDraftApply','privatePhotoCaseSave']){
  const control=document.getElementById(id);assert.ok(control,id);assert.doesNotMatch(control.textContent,/M3|V5|ProblemDraft|SHA-256/,id);
 }
 for(const id of ['dimensionDraftCommit','dimensionDraftM3Accept','confirmSource','acceptSources'])assert.ok(document.getElementById(id),id);
});
test('specialist tools have one discoverable directory instead of a duplicate list in conditions',()=>{
 const {document}=parseHTML('<main>'+homeHTML()+'</main>');
 assert.ok(!document.querySelector('#v7-input-section .v7-advanced'));
 for(const href of ['labs/auto-fillet-live.html','labs/cone-cut-live.html','labs/recognition-qa.html'])assert.ok(document.querySelector('#tools a[href="'+href+'"]'),href);
});
test('circle-connection guidance avoids internal version labels while preserving review controls',()=>{
 const {document}=parseHTML(fs.readFileSync('labs/circle-fillet-live.html','utf8'));
 for(const node of document.querySelectorAll('main > .workspace p.note, main > .workspace p.legend'))assert.doesNotMatch(node.textContent,/\bV5\b|M3|ProblemDraft/);
 for(const id of ['calculate','learningMode','drawTool','checkDraw','filletProof','filletProgress'])assert.ok(document.getElementById(id),id);
});
test('section tool introductions state the task without project or framework descriptions',()=>{
 for(const file of ['cylinder-cut-live','prism-cut-live']){
  const {document}=parseHTML(fs.readFileSync('labs/'+file+'.html','utf8'));const intro=document.querySelector('main p.sub');
  assert.ok(intro,file);assert.doesNotMatch(intro.textContent,/V5|个人研究|真实几何实验/,file);
 }
});
test('default audit status explains its limits without framework names',()=>{
 const {document}=parseHTML(fs.readFileSync('labs/auto-fillet-live.html','utf8'));const status=document.getElementById('privatePhotoCaseStatus');
 assert.doesNotMatch(status.textContent,/M3|V5|ProblemDraft/);assert.match(status.textContent,/独立/);
});
test('storage-unavailable warning does not promise project export',()=>{
 const {document}=parseHTML('<main>'+homeHTML()+'</main>');const warning=document.getElementById('v7-storage-warning');
 assert.match(warning.textContent,/无法保存或导出/);assert.doesNotMatch(warning.textContent,/请导出项目/);
});
test('specialist workspaces identify user tasks without internal architecture labels',()=>{
 for(const file of ['c2-native-cut-review','finite-cylinder-intersection-live','solid-third-view-live','two-point-v5-live']){
  const {document}=parseHTML(fs.readFileSync('labs/'+file+'.html','utf8'));
  for(const heading of document.querySelectorAll('h1,h2'))assert.doesNotMatch(heading.textContent,/V5|Geometry Scene|OpenCascade|OCCT/,file);
 }
});
