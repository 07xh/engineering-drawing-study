'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {fields,checkedPrismFields:parse}=
 require('../../labs/prism-cut-form.cjs');
const {createPrismV5SvgScene:make}=
 require('../../engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs');
const P=(x,y,z)=>({x,y,z});
const raw=()=>({sizeX:10,sizeY:10,sizeZ:10,
 px:0,py:0,pz:12,nx:1,ny:1,nz:1});
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
test('04 reviewed prism form converts actual mm sizes into finite box and plane',()=>{
 const p=parse(raw());
 assert.deepEqual(p.box,{min:P(0,0,0),max:P(10,10,10)});
 assert.deepEqual(p.plane,{point:P(0,0,12),normal:P(1,1,1)});
 assert.ok(fields.every(k=>Object.hasOwn(raw(),k)));
});
test('04 invalid prism sizes, plane normals and unbounded text cannot become model values',()=>{
 for(const [name,value] of [['sizeX',0],['sizeY',-5],
  ['sizeZ',0],['px',Infinity],['py','0'],['pz',1e12],
  ['nx',NaN]]){
  assert.throws(()=>parse({...raw(),[name]:value}),/positive|finite/);
 }
 assert.throws(()=>parse({...raw(),nx:0,ny:0,nz:0}),/normal/);
 assert.throws(()=>parse({}),/finite/);
 assert.throws(()=>parse(null),/explicit/);
});
test('04 actual browser default six-sided cut compiles into verified V5 time',()=>{
 const parsed=parse(raw());
 const scene=make(parsed.box,parsed.plane,{revision:4});
 assert.equal(scene.status,'ready');
 assert.equal(scene.sectionEdgeCount,6);
 assert.equal(scene.visibilityVerified,false);
 assert.equal(scene.productionUiIntegrated,false);
 assert.ok(scene.totalMs>0);
 assert.equal(scene.steps.length,scene.stepCount);
 assert.ok(scene.steps.every(x=>Number.isFinite(x.startMs)&&Number.isFinite(x.endMs)));
 const zero=scene.renderFrame({elapsedMs:0,expectedRevision:4});
 const end=scene.renderFrame({elapsedMs:scene.totalMs,expectedRevision:4});
 assert.equal(zero.counts.results,0);
 assert.equal(end.counts.results,18);
 assert.equal(end.counts.visibilityUndetermined,18);
 assert.match(end.svg,/data-visibility="undetermined"/);
});
test('04 unmodified V5 player supports exact step boundaries, multiple speeds and revision',()=>{
 const parsed=parse(raw()),s=make(parsed.box,parsed.plane,{revision:4});
 const player=s.createPlayer({speed:2});
 player.play(0);assert.equal(player.snapshot(250).elapsedMs,500);
 let r=player.seekStep(5,300);
 assert.equal(r.activeStepIndex,5);
 assert.equal(r.elapsedMs,s.steps[5].startMs);
 player.setSpeed(.25,400);
 r=player.seekStep(0,500);
 assert.equal(r.elapsedMs,0);
 player.invalidate(5,600);assert.equal(player.canRender(4),false);
 assert.throws(()=>s.renderFrame({elapsedMs:0,expectedRevision:5}),/stale/);
});
test('04 responsive page includes actual input, controls and explicit uncertified visibility',()=>{
 const html=read('labs/prism-cut-live.html');
 for(const id of [...fields,'board','status','reset','solve',
  'previous','play','next','seek','percentage',
  'speed','guides','mono','save','steps','stepDetail','measure'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/prism-cut-live-bundle\.js/);
 assert.match(html,/max-width:940px/);
 assert.match(html,/可见性|待审核线型/);
 assert.doesNotMatch(html,/<input[^>]*type="file"/);
});
test('04 browser event binding uses real V5 snapshots and rejects revisions after any field edit',()=>{
 const entry=read('labs/prism-cut-live-entry.cjs');
 assert.match(entry,/createPrismV5SvgScene/);
 assert.match(entry,/expectedRevision:state\.rev/);
 assert.match(entry,/\.createPlayer\(/);
 assert.match(entry,/state\.player\.seekStep/);
 assert.match(entry,/state\.player\.seekProgress/);
 assert.match(entry,/state\.player\.setSpeed/);
 assert.match(entry,/addEventListener\('input',invalidate\)/);
 assert.match(entry,/addEventListener\('change',update\)/);
 assert.match(entry,/Blob\(\[frame\.svg\]/);
 assert.match(entry,/URL\.revokeObjectURL/);
 assert.doesNotMatch(entry,/fetch\(|XMLHttpRequest|WebSocket|localStorage/);
});
test('04 static build explicitly includes new page and one self-contained local browser bundle',()=>{
 const script=read('scripts/build-static.cjs');
 assert.match(script,/'labs\/prism-cut-live\.html'/);
 assert.match(script,/labs\/prism-cut-live-entry\.cjs/);
 assert.match(script,/outfile:path\.join\(out,'labs\/prism-cut-live-bundle\.js'\)/);
 assert.match(script,/'labs\/cylinder-cut-live\.html'/);
 assert.match(script,/labs\/recognition-qa-entry\.cjs/);
 assert.doesNotMatch(script,/'engines\/spatial\/sections\/rectangular-prism-plane\.cjs'/);
});
test('04 no-intersection and boundary-degenerate models block all scene steps',()=>{
 for(const z of [0,33]){
  const p=parse({...raw(),pz:z});
  const scene=make(p.box,p.plane,{revision:3});
  assert.equal(scene.status,'blocked');
  assert.throws(()=>scene.renderFrame({elapsedMs:0,expectedRevision:3}),/no verified/);
 }
});
test('04 changing human inputs leads to independent mathematics, never canned SVG',()=>{
 const p=parse(raw());
 const a=make(p.box,p.plane,{revision:4});
 const n=parse({...raw(),pz:3});
 const b=make(n.box,n.plane,{revision:4});
 assert.equal(a.status,'ready');
 assert.equal(b.status,'ready');
 assert.equal(a.sectionEdgeCount,6);
 assert.equal(b.sectionEdgeCount,3);
 assert.notEqual(a.renderFrame({elapsedMs:a.totalMs,expectedRevision:4}).svg,
  b.renderFrame({elapsedMs:b.totalMs,expectedRevision:4}).svg);
});
test('04 input conversion and rendering preserve user source without unintended side effects',()=>{
 const input=raw(),copy=structuredClone(input),params=parse(input);
 const a=make(params.box,params.plane,{revision:4});
 const b=make(structuredClone(params.box),structuredClone(params.plane),{revision:4});
 assert.deepEqual(a.renderFrame({elapsedMs:a.totalMs,expectedRevision:4}),
  b.renderFrame({elapsedMs:b.totalMs,expectedRevision:4}));
 assert.deepEqual(input,copy);
});
