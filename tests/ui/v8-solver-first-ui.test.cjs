'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');
const {enhancePage}=require('../../ui-next/enhance-page.cjs');
const {newProject}=require('../../project/project-coordinator.cjs');
const {hasTaskInputs,forkTaskProject}=require('../../project/task-switch-guard.cjs');
const root=path.resolve(__dirname,'../..');
test('V8 home is solver-first with one main heading and no duplicate marketing hero',()=>{
 const {document}=parseHTML('<main>'+homeHTML()+'</main>');
 assert.equal(document.querySelectorAll('#project-workbench').length,1);
 assert.equal(document.querySelectorAll('#ai').length,1);
 assert.equal(document.querySelectorAll('.next-home-hero').length,1);
 assert.ok(!document.querySelector('.v8-optional-illustration').hasAttribute('open'));
 assert.ok(document.querySelector('#project-workbench').compareDocumentPosition(document.querySelector('.v8-optional-illustration'))&4);
 assert.equal(document.querySelectorAll('#v7-title').length,1);
 for(const id of ['v7-image-input','v7-task','v7-stage','v7-confirm','v7-solve','v7-sheet','v7-3d','v7-play','recent','knowledge','tools'])
  assert.equal(document.querySelectorAll('#'+id).length,1,id);
});
test('Specialist explanation and manual source tools are opt-in, not deleted',()=>{
 const {document}=parseHTML('<main>'+homeHTML()+'</main>');
 const courses=document.getElementById('v7-course-entry');
 const source=document.querySelector('.v8-source-advanced');
 assert.equal(courses.tagName,'SECTION');
 const specialist=courses.querySelector('.v8-course-disclosure');
 assert.equal(specialist.tagName,'DETAILS');
 assert.equal(source.tagName,'DETAILS');
 assert.ok(!specialist.hasAttribute('open')&&!source.hasAttribute('open'));
 for(const id of ['v7-candidate-stage','v7-source-link','v7-cal-apply','v7-cal-status'])
  assert.ok(source.querySelector('#'+id),id);
 assert.ok(!source.contains(document.getElementById('v7-image-status')));
});
test('Navigation routes to the real project, not one special fillet solver',()=>{
 const input=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const html=enhancePage(input,{page:'index.html',preview:false});
 const {document}=parseHTML(html);
 const anchors=[...document.querySelectorAll('.next-sidebar nav a')];
 assert.deepEqual(anchors.map(x=>x.textContent.trim()),['工作台','我的项目','题型工具','帮助']);
 assert.equal(document.querySelector('.next-sidebar .next-start').getAttribute('href'),'index.html#project-workbench');
 assert.equal(anchors[0].getAttribute('href'),'index.html');
 assert.ok(!anchors.some(a=>a.textContent.includes('AI 解题')));
});
test('Task switch guards all meaningful existing input types',()=>{
 const p=newProject({id:'TestPrevious',task:'projection'});
 assert.equal(hasTaskInputs(p),false);
 p.conditions.push({id:'P',confirmed:false});
 assert.equal(hasTaskInputs(p),true);
 p.conditions=[];p.objects.push({id:'EdgeA'});
 assert.equal(hasTaskInputs(p),true);
 p.objects=[];p.relations.push({id:'RelA'});
 assert.equal(hasTaskInputs(p),true);
 p.relations=[];p.affineProblem={confirmed:false};
 assert.equal(hasTaskInputs(p),true);
});
test('Switch forks distinct project and reuses only source image, never old proof',()=>{
 const p=newProject({id:'OldProject',task:'projection'});
 p.source.imageId='OriginalImage';p.source.rotationDeg=90;
 p.source.calibration={confirmedBy:'SomeInput'};
 p.conditions.push({id:'coords',confirmed:true});
 const next=forkTaskProject(p,'planar','NewProject');
 assert.equal(next.id,'NewProject');
 assert.equal(next.task,'planar');
 assert.equal(next.source.imageId,'OriginalImage');
 assert.equal(next.source.rotationDeg,90);
 assert.equal(next.source.calibration,null);
 assert.deepEqual(next.conditions,[]);
 assert.deepEqual(next.objects,[]);
 assert.deepEqual(next.relations,[]);
 assert.equal(next.affineProblem,null);
 assert.equal(next.view.mode,'2d');
 assert.equal(p.conditions.length,1);
 assert.equal(p.source.calibration.confirmedBy,'SomeInput');
});
