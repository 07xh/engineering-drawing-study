'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parseHTML}=require('linkedom');
const {homeHTML}=require('../../ui-next/home.cjs');

test('V8.6 C2 exposes reviewed two-box solver and hides only optional object editors',()=>{
 const {document}=parseHTML('<html><body>'+homeHTML()+'</body></html>');
 const scope=document.querySelector('fieldset[data-v7-task="composition"]');
 assert.ok(scope,'C2 uses the original unified project task');
 const advanced=scope.querySelector('.v8-c2-advanced');
 assert.ok(advanced,'secondary object, relation and unknown-point editors are grouped');
 assert.equal(advanced.hasAttribute('open'),false,'ordinary C2 task begins with short form');
 assert.equal(advanced.querySelector('summary')?.textContent.includes('单个对象'),true);
 for(const id of ['v8-c2-a-x0','v8-c2-a-x1','v8-c2-b-z0','v8-c2-b-z1','v8-c2-ack','v8-c2-build','v8-c2-status']){
  const el=document.getElementById(id);
  assert.ok(scope.contains(el),id+' remains inside C2 task');
  assert.equal(advanced.contains(el),false,id+' must remain immediately available');
 }
 for(const id of ['v7-c-objects','v7-c-stage','v7-c-confirm','v7-c-render','v7-r-stage','v7-u-solve']){
  const el=document.getElementById(id);
  assert.ok(advanced.contains(el),id+' is kept, not deleted or duplicated');
  assert.equal(document.querySelectorAll('#'+id).length,1);
 }
 assert.ok(advanced.querySelector('.v7-unknowns'),'original unknown-point editor is preserved');
 const input=document.getElementById('v7-c-ax');
 input.value='12.5';
 advanced.setAttribute('open','');
 advanced.removeAttribute('open');
 assert.equal(input.value,'12.5','collapsing must not overwrite in-progress typed data');
});

test('V8.6 C2 dimensions respond to panel width, not only viewport width',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../../project/workbench-ui.css'),'utf8');
 assert.match(css,/\.v8-c2-entry\{[^}]*container-type:inline-size/);
 assert.match(css,/\.v8-c2-grid\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/@container\s*\(min-width:600px\)/);
 assert.match(css,/\.v8-c2-advanced>summary\{[^}]*min-height:48px/);
});
