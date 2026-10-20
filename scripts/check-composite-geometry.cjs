'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const source=path=>fs.readFileSync(path,'utf8');
function load(path,name){const ctx={};vm.runInNewContext(source(path),ctx,{filename:path});return ctx[name]}
const geo=load('labs/composite-geometry-core.js','CompositeGeometry');
const kb=load('knowledge/knowledge-data.js','DrawingKnowledge');
assert(geo&&typeof geo.frame==='function');
const frames=[];
function coords(sh){
 if(sh.kind==='panel')return sh.rect;
 if(sh.kind==='rect')return[sh.x,sh.y,sh.w,sh.h];
 if(sh.kind==='line')return sh.xy;
 if(sh.kind==='circle')return[...sh.center,sh.r];
 if(sh.kind==='point')return sh.at;
 if(sh.kind==='polyline')return sh.points.flatMap(p=>p);
 throw Error('Unknown scene primitive: '+sh.kind);
}
function inspectScene(scene){
 assert(scene.valid,'geometry invariants failed for '+scene.mode+' '+scene.stage);
 assert(scene.error<1e-7,'nonzero numeric residual '+scene.mode+' '+scene.error);
 assert(scene.shapes.filter(s=>s.kind==='panel').length===3,'V/H/W panels must all be present');
 for(const sh of scene.shapes)assert(Array.from(coords(sh)).every(Number.isFinite),'nonfinite scene geometry');
 assert.equal(scene.shapes.some(s=>s.kind==='image'),false,'no publisher image may be embedded');
 assert.equal(typeof scene.objectScope,'string');
 assert.equal(typeof scene.why,'string');
 assert(scene.objectScope.length>30&&scene.why.length>30);
 frames.push(scene.mode+'-'+scene.stage);
}
const testPoints=[{x:-43,y:38,z:32},{x:0,y:48,z:60},{x:28,y:74,z:12}];
for(const p of testPoints){
 const v=geo.proj(p,'V'),h=geo.proj(p,'H'),w=geo.proj(p,'W');
 assert.equal(v[0],h[0],'first-angle V/H long alignment incorrect');
 assert.equal(v[1],w[1],'first-angle V/W height incorrect');
 assert.equal(h[1]-312,w[0]-535,'first-angle H/W depth incorrect');
}
let count={composite:0,section:0,intersection:0};
for(const x of [-15,-8,0,8,15])for(const y of [32,48,60])for(let stage=0;stage<5;stage++){
 const s=geo.frame('composite',{x,y},stage);inspectScene(s);
 assert.equal(s.dof,[2,2,1,0,0][stage]);
 assert.equal(s.candidateCount,1,'fixed dimensions + valid xy must produce one defined column');
 if(stage<3)assert(!s.shapes.some(sh=>sh.style==='transfer'),'45 transfer must appear with depth guides, not earlier');
 if(stage>=3)assert(s.shapes.some(sh=>sh.style==='transfer'),'45 transfer guide missing');
 count.composite++;
}
for(const h of [25,30,35,40,42])for(let stage=0;stage<5;stage++){
 const s=geo.frame('section',{h},stage);inspectScene(s);
 assert.equal(s.dof,[1,1,1,0,0][stage]);
 assert.equal(s.vertices.length,4);
 for(const p of s.vertices){
  assert(Math.abs(p.z-h-.28*p.x)<1e-9,'cut point must lie exactly on plane');
  assert(Math.abs(Math.abs(p.x)-38)<1e-9,'section vertices on side prism edges');
  assert([14,76].includes(p.y),'section at a box corner side edge');
  assert(p.z>=0&&p.z<=66);
 }
 if(stage<3)assert(!s.shapes.some(sh=>sh.style==='section'),'do not draw section outline before computing points');
 if(stage>=3)assert.equal(s.shapes.filter(sh=>sh.style==='section').length,3,'need V/H/W section line sets');
 count.section++;
}
for(const r of [18,20,24,26,28])for(let stage=0;stage<5;stage++){
 const s=geo.frame('intersection',{r},stage);inspectScene(s);
 assert.equal(s.dof,[1,1,0,0,0][stage]);
 assert.equal(s.branches.length,4);
 for(const branch of s.branches){
  assert.equal(branch.samples.length,41);
  for(const p of branch.samples){
   assert(Math.abs(p.x*p.x+(p.y-44)**2-32**2)<1e-7,'point not on cylinder Z');
   assert(Math.abs(p.x*p.x+(p.z-44)**2-r*r)<1e-7,'point not on cylinder Y');
  }
 }
 if(stage<3)assert(!s.shapes.some(sh=>sh.style==='intersection'),'do not draw full curves before sample proof');
 if(stage>=3)assert.equal(s.shapes.filter(sh=>sh.style==='intersection').length,12,'all 4 branches need 3 projections');
 count.intersection++;
}
assert.throws(()=>geo.frame('composite',{x:24,y:42},2));
assert.throws(()=>geo.frame('section',{h:80},2));
assert.throws(()=>geo.frame('intersection',{r:33},2));
assert.throws(()=>geo.frame('unknown',{},2));
assert.throws(()=>geo.frame('section',{h:30},9));
assert.equal(kb.entries.length,110);
assert.equal(kb.entries.filter(x=>x.chapter==='ch03'&&x.contentStatus==='page-reviewed').length,18);
for(const [id,path] of [
 ['ch03-combination-forms','../labs/composite-geometry.html?mode=composite'],
 ['ch03-polyhedral-section','../labs/composite-geometry.html?mode=section'],
 ['ch03-cylinder-cylinder','../labs/composite-geometry.html?mode=intersection']
]){
 const lesson=kb.get(id);assert(lesson,'lesson missing '+id);
 assert.equal(lesson.labLink,path,'lesson linked to wrong model');
 assert.equal(lesson.visualMode,null,'chapter 3 should not use fake representative-point VHW mode');
 assert.equal(lesson.contentStatus,'page-reviewed');
}
assert.equal(kb.get('ch04-s01').contentStatus,'toc-only','unreviewed chapter must stay index-only');
const html=source('labs/composite-geometry.html'),ui=source('labs/composite-geometry-ui.js'),app=source('knowledge/knowledge-app.js');
for(const id of ['compositeBoard','tabComposite','tabSection','tabIntersection','compX','compY','compHeight','compRadius','compPrev','compNext','compReset','compDegree','compAudit','compError','compFreedom']){
 assert(html.includes('id="'+id+'"'),'missing interactive control '+id);
}
assert(html.includes('真实零件遮挡')||html.includes('遮挡判定'),'must disclose visibility limitations');
assert(html.includes('.settings [hidden]{display:none!important}'),'hidden sliders must not be revealed by custom CSS');
assert(ui.includes('math.frame(mode,params(),stage)'),'math must power the visual not hardcoded shapes');
assert(!ui.includes('VerifiedExerciseSolutions')&&!ui.includes('verified-exercises'),'must not touch scanned exercise answers');
for(const path of ['../labs/composite-geometry.html?mode=composite','../labs/composite-geometry.html?mode=section','../labs/composite-geometry.html?mode=intersection']){
 assert(app.includes("'"+path+"'"),'knowledge UI failed strict chapter 3 lab allowlist '+path);
}
for(const path of ['labs/composite-geometry.html','labs/composite-geometry-core.js','labs/composite-geometry-ui.js']){
 assert(source('scripts/build-static.cjs').includes("'"+path+"'"),'static bundle missed '+path);
}
console.log('PASS ch3 combination/sections/intersections: '+JSON.stringify(count)+' frames, analytic cylinder-surface residuals, first-angle projections, strict source-linked tools and preserved answer locks');
