'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('labs/method-library.js','utf8');
new vm.Script(src,{filename:'labs/method-library.js'});
const ctx={};vm.runInNewContext(src,ctx);
const lib=ctx.DrawingMethodLibrary;
assert(lib&&typeof lib.get==='function','method library must export get()');
const sections={'2-6':6,'2-7':6,'2-8':8,'2-9':8};
const ids=Object.entries(sections).flatMap(([section,n])=>Array.from({length:n},(_,i)=>section+'-'+(i+1)));
assert.deepEqual([...lib.ids].sort(),ids.sort(),'method reference should cover exactly the 28 exercises');
for(const id of ids){
 const item=lib.get(id);
 assert(item&&item.id===id,'missing method for '+id);
 assert(item.status==='research-reference'&&item.sourceVerified===false&&item.solutionVerified===false,'method must never impersonate checked solution for '+id);
 assert(typeof item.premise==='string'&&item.premise.length>=15,'missing applicability requirements '+id);
 assert(typeof item.note==='string'&&item.note.length>=12,'missing source caution '+id);
 assert(item.disclaimer.includes(id)&&item.disclaimer.includes('不是教材'),'must label research reference, not answer');
 assert(item.steps.length>=3,'method too shallow '+id);
 for(const step of item.steps){
  for(const key of ['action','reason','freedom'])assert(typeof step[key]==='string'&&step[key].length>=12,'missing '+key+' for '+id);
  assert(!('lines' in step||'dots' in step||'circles' in step),'unverified solutions must not contain drawing geometry');
 }
 assert(item.references.length>=1,'missing traceable references '+id);
 for(const ref of item.references){
  const uri=new URL(ref.url);
  assert(uri.protocol==='https:','only HTTPS sources allowed: '+id);
  assert(ref.name.length>5,'missing link description '+id);
 }
}
assert(lib.get('2-7-5').note.includes('30 mm'),'must preserve exercise distance requirement');
assert(lib.get('2-8-4').premise.includes('棱台'),'must distinguish frustum from prism');
assert(lib.get('2-9-3').title.includes('素线'),'must distinguish cone methods');
assert(lib.get('2-9-4').title.includes('辅助圆'),'must distinguish auxiliary circle method');
assert(lib.get('2-9-7').premise.includes('不能直接判为球面'),'unverified circles must not be mislabeled');
const html=fs.readFileSync('labs/chapter-drawing.html','utf8');
const drawing=fs.readFileSync('labs/chapter-drawing.js','utf8');
const build=fs.readFileSync('scripts/build-static.cjs','utf8');
for(const id of ['methodTitle','methodPremise','methodDisclaimer','methodNote','methodPrev','methodNext','methodAll','methodProgress','methodSteps','methodSources'])assert(html.includes('id="'+id+'"'),'missing method UI '+id);
assert(html.indexOf('src="method-library.js"')<html.indexOf('src="chapter-drawing.js"'),'method data must load before drawing UI');
assert(drawing.includes('renderMethod();'),'method panel must update on selection');
assert(drawing.includes('methodCount=1;renderMethod();'),'new exercise must start at first step');
assert(drawing.includes("a.rel='noopener noreferrer'"),'external references must be safely linked');
assert(drawing.includes("stepsEl.replaceChildren();sourcesEl.replaceChildren()"),'old question method DOM must reset');
assert(!drawing.includes('lineFocus').toString().includes('NOOP_DO_NOT_CHECK'),'no-op placeholder');
assert(build.includes("'labs/method-library.js'"),'static build must publish research method library');
console.log('PASS 28 method mappings, step reasons, degree-of-freedom notes, external references, isolated UI and static publishing');
