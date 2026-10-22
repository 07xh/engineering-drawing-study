'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {checkedPrismFields,checkedPrismObserverFields:observer}=
 require('../../labs/prism-cut-form.cjs');
const {createPrismV5SvgScene:scene}=
 require('../../engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs');
const read=p=>fs.readFileSync(path.join(__dirname,'../../',p),'utf8');
const numeric=()=>({sizeX:10,sizeY:10,sizeZ:10,
 px:0,py:0,pz:12,nx:1,ny:1,nz:1});
const rays=()=>({mode:'rays',retainedHalfspace:'positive',
 viewV:'-1',viewH:'1',viewW:'-1'});
const build=config=>{
 const {box,plane}=checkedPrismFields(numeric());
 return scene(box,plane,{revision:4,...observer(config)});
};
test('04 pending mode is a deliberate default; no ray inference from V/H/W model display',()=>{
 const config=observer({mode:'unconfirmed'});
 assert.deepEqual(config,{});
 const scene=build({mode:'unconfirmed'});
 assert.equal(scene.status,'ready');
 assert.equal(scene.visibilityEvidenceMode,'unconfirmed');
 assert.equal(scene.visibilityCounts.undetermined,18);
 const f=scene.renderFrame({elapsedMs:scene.totalMs,expectedRevision:4});
 assert.equal(f.counts.visibilityUndetermined,18);
 assert.equal(f.counts.visibilityHidden,0);
 assert.equal(f.counts.visibilityVisible,0);
});
test('04 ray-enabled form requires explicit kept side and all 3 observer directions',()=>{
 const cases=[
  {mode:'rays'},
  {...rays(),retainedHalfspace:''},
  {...rays(),retainedHalfspace:'discarded'},
  {...rays(),viewV:''},
  {...rays(),viewH:''},
  {...rays(),viewW:''},
  {...rays(),viewW:'side'},
  {mode:''},{}
 ];
 for(const config of cases)assert.throws(()=>observer(config),/mode|direction|side|confirm|choose/i);
 assert.throws(()=>observer(null),/settings/);
});
test('04 verified mapping V maps Y, H maps Z, W maps X, no implicit reversed axes',()=>{
 const reviewed=observer(rays());
 assert.equal(reviewed.retainedHalfspace,'positive');
 assert.deepEqual(reviewed.observerDirections,{
  V:{x:0,y:-1,z:0},H:{x:0,y:0,z:1},W:{x:-1,y:0,z:0}
 });
 const flipped=observer({...rays(),retainedHalfspace:'negative',viewV:'1',
  viewH:'-1',viewW:'1'});
 assert.deepEqual(flipped.observerDirections,{
  V:{x:0,y:1,z:0},H:{x:0,y:0,z:-1},W:{x:1,y:0,z:0}
 });
});
test('04 browser reviewed ray choices enable actual solid, hidden and uncertain SVG segments',()=>{
 const result=build(rays());
 assert.equal(result.status,'ready');
 assert.equal(result.visibilityEvidenceMode,'explicit-observer-rays');
 assert.ok(result.visibilityCounts.visible>0);
 assert.ok(result.visibilityCounts.hidden>0);
 assert.ok(result.visibilityCounts.undetermined>0);
 const f=result.renderFrame({elapsedMs:result.totalMs,expectedRevision:4});
 assert.equal(f.counts.results,18);
 assert.match(f.svg,/data-visibility="visible"/);
 assert.match(f.svg,/data-visibility="hidden"/);
 assert.match(f.svg,/data-visibility="undetermined"/);
 assert.equal(f.firstAngleConventionSignedOff,false);
 assert.equal(f.completeEngineeringDrawingVerified,false);
});
test('04 changing retained side or one eye changes real math, not hardcoded line decoration',()=>{
 const a=build(rays()),b=build({...rays(),retainedHalfspace:'negative'});
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.notDeepEqual(a.visibilityCounts,b.visibilityCounts);
 assert.notEqual(
  a.renderFrame({elapsedMs:a.totalMs,expectedRevision:4}).svg,
  b.renderFrame({elapsedMs:b.totalMs,expectedRevision:4}).svg
 );
});
test('04 page defaults to unconfirmed; all visibility inputs and legend are explicit',()=>{
 const html=read('labs/prism-cut-live.html');
 for(const id of ['visibilityMode','rayControls','retainedHalfspace','viewV',
  'viewH','viewW','rayStatus','board','play','seek','speed','guides','save'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/<option value="unconfirmed" selected>/);
 assert.match(html,/<option value="rays">/);
 assert.match(html,/<option value="" selected>请选择保留材料的一侧/);
 assert.match(html,/绿色实线/);
 assert.match(html,/深灰虚线/);
 assert.match(html,/待判定/);
 assert.match(html,/第一角法/);
});
test('04 local browser events re-run mathematical scene only after full ray confirmation',()=>{
 const text=read('labs/prism-cut-live-entry.cjs');
 assert.match(text,/checkedPrismObserverFields\(/);
 assert.match(text,/retainedHalfspace:\$\('retainedHalfspace'\)\.value/);
 assert.match(text,/viewV:\$\('viewV'\)\.value/);
 assert.match(text,/viewH:\$\('viewH'\)\.value/);
 assert.match(text,/viewW:\$\('viewW'\)\.value/);
 assert.match(text,/revision:state\.rev,\.\.\.observer/);
 assert.match(text,/visibilityMode.*addEventListener\('change'/);
 for(const id of ['retainedHalfspace','viewV','viewH','viewW'])
  assert.match(text,new RegExp("'"+id+"'"));
 assert.match(text,/rayControls'\)\.hidden=/);
 assert.match(text,/state\.rev\+\+/);
 assert.match(text,/state\.scene=null/);
 assert.match(text,/URL\.revokeObjectURL/);
 assert.doesNotMatch(text,/\bfetch\(|XMLHttpRequest|WebSocket/);
});
test('04 explicit observer form does not mutate source and changing selected rays causes old scene to fail closed',()=>{
 const config=rays(),copy=structuredClone(config),values=observer(config);
 assert.deepEqual(config,copy);
 const {box,plane}=checkedPrismFields(numeric());
 const s=scene(box,plane,{revision:4,...values});
 const first=s.renderFrame({elapsedMs:0,expectedRevision:4});
 assert.equal(first.revision,4);
 values.observerDirections.W.x=1;
 assert.throws(()=>s.renderFrame({elapsedMs:0,expectedRevision:4}),/modified/);
 assert.equal(s.firstAngleConventionSignedOff,false);
});
