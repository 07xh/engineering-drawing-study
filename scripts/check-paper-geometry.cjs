'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const text=path=>fs.readFileSync(path,'utf8');
function load(path,key){const ctx={};vm.runInNewContext(text(path),ctx,{filename:path});return ctx[key]}
const core=load('labs/paper-geometry-core.js','PaperGeometry');
const book=load('knowledge/knowledge-data.js','DrawingKnowledge');
assert(core&&typeof core.regular==='function');
const numericLine=x=>[x.x1,x.y1,x.x2,x.y2].every(Number.isFinite);
const shapeSafe=s=>s.kind==='line'?numericLine(s):s.kind==='point'?[s.x,s.y].every(Number.isFinite):s.kind==='circle'?[s.cx,s.cy,s.r].every(Number.isFinite)&&s.r>0:false;
let stages=0;
for(let n=2;n<=10;n++){
 for(let stage=0;stage<=4;stage++){
  const f=core.regular('divide',n,stage);
  assert.equal(f.mode,'divide');assert.equal(f.n,n);assert.equal(f.stage,stage);
  assert(f.result.valid);assert(f.result.maxError<1e-7);
  assert(f.shapes.every(shapeSafe),'bad divide stage');
  assert.equal(f.result.Q.length,n+1);
  assert(Math.abs(f.result.spacing-(f.result.B.x-f.result.A.x)/n)<1e-8);
  assert.equal(f.shapes.filter(x=>x.role==='found'&&x.kind==='point').length,stage===4?n-1:0);
  assert.equal(f.dof,stage<3?1:0,'division point has one DOF until intersection with its construction parallel');
  stages++;
 }
}
for(const n of [3,4,6,8]){
 for(let stage=0;stage<=4;stage++){
  const f=core.regular('polygon',n,stage);
  assert(f.result.valid,'polygon invalid '+n+':'+stage);
  assert(f.result.maxError<1e-7);
  assert(f.shapes.every(shapeSafe));
  assert.equal(f.result.V.length,n);
  assert.equal(f.dof,stage===0?1:0,'unfixed start-angle must have 1 rotational DOF');
  assert.equal(f.shapes.filter(x=>x.role==='found'&&x.kind==='line').length,stage>=3?n:0);
  if(n===6)assert(Math.abs(f.result.side-f.result.r)<1e-8,'regular hexagon chord equals radius');
  stages++;
 }
}
for(const dx of [60,120,180,280])for(const dy of [50,110,180]){
 for(let stage=0;stage<=4;stage++){
  const f=core.regular('dimension',{dx,dy},stage);
  assert(f.result.valid);assert(f.result.maxError<1e-9);
  assert(f.shapes.every(shapeSafe));
  assert.equal(f.dof,[2,1,0,0,0][stage]);
  assert.equal(f.result.center.x-f.result.base.x,dx);
  assert.equal(f.result.base.y-f.result.center.y,dy);
  if(stage<3)assert(!f.shapes.some(x=>x.role==='found'),'must not show final circle too early');
  if(stage>=3)assert.equal(f.shapes.filter(x=>x.kind==='circle'&&x.role==='found').length,1);
  stages++;
 }
}
assert.throws(()=>core.regular('divide',1,0));assert.throws(()=>core.regular('polygon',5,0));
assert.throws(()=>core.regular('dimension',{dx:12,dy:90},0));
assert.throws(()=>core.regular('dimension',{dx:80,dy:90},5));
assert.throws(()=>core.regular('unsupported',4,0));
const index=book.get('ch01-divide-and-polygons');
assert(index&&index.pages[0]===13&&index.contentStatus==='page-reviewed');
for(const id of ['ch01-divide-and-polygons','ch01-dimension-principle','ch01-dimension-elements','ch01-outline-dimensions']){
 const k=book.get(id);assert(k&&['../labs/paper-geometry.html','../labs/paper-geometry.html?mode=dimension'].includes(k.labLink),'missing allowlisted paper lab '+id);
 assert.equal(k.visualMode,null,'planar paper topic must not use 3D VHW animation');
}
assert.equal(book.get('ch01-circle-tangent-principle').labLink,'../labs/tangent-constraint.html');
assert.equal(book.get('ch03-s01').contentStatus,'toc-only','unreviewed chapters must remain outline only');
const html=text('labs/paper-geometry.html'),ui=text('labs/paper-geometry-ui.js'),app=text('knowledge/knowledge-app.js');
for(const id of ['paperBoard','modeDivide','modePolygon','modeDimension','divisionCount','polygonSides','dimensionX','dimensionY','paperPrev','paperNext','paperRestart','paperCounter','paperDegree','paperValid','paperError','paperScope']){
 assert(html.includes('id="'+id+'"'),'control not found '+id);
}
assert(html.includes('不是')||html.includes('并非原书原题图'),'original-vs-book disclaimer missing');
assert(html.includes('.inputs [hidden]{display:none!important}'),'hidden control groups must stay hidden even under author styles');
assert(ui.includes('model.regular(mode,argument(),stage)'),'core math must actually feed UI');
assert(!ui.includes('VerifiedExerciseSolutions')&&!ui.includes('verified-exercises.js'),'must not touch real scanned original solutions');
assert(app.includes("paper=['../labs/paper-geometry.html','../labs/paper-geometry.html?mode=dimension'].includes(item.labLink)"),'knowledge UI allowlist must permit both exact lab paths');
assert(ui.includes("group.includes(requestedMode)?requestedMode:'divide'"),'deep link must be safely matched to existing modes');
const build=text('scripts/build-static.cjs');
for(const f of ['labs/paper-geometry.html','labs/paper-geometry-core.js','labs/paper-geometry-ui.js'])assert(build.includes("'"+f+"'"),'missing build asset '+f);
console.log('PASS paper geometry: '+stages+' validated frames, equal divisions, 3/4/6/8 polygons, 2→1→0 planar center DOF, edition-3 source and safe links');
