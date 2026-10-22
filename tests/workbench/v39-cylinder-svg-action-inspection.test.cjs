'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createCylinderVisibilitySvgScene:make}=
 require('../../engines/spatial/sections/cylinder-visibility-frame-svg.cjs');
const p=(x,y,z)=>({x,y,z});
const cylinder=()=>({baseCenter:p(0,0,0),radiusMm:5,heightMm:30});
const plane=()=>({point:p(0,0,3),normal:p(1,0,1)});
const rays=()=>({V:p(1,0,0),H:p(0,0,1),W:p(-1,0,.2)});
function scene(c=cylinder(),pl=plane(),dirs=rays()){
 return make(c,pl,{revision:4,retainedHalfspace:'negative',
  observerDirections:dirs});
}
const whole=s=>s.renderFrame({elapsedMs:s.totalMs,expectedRevision:4});
function resultSegment(svg){
 const m=svg.match(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"[^>]*data-visibility="(visible|hidden|undetermined)"[^>]*data-action="(vis-[VHW]-[0-9]+-[0-9]+)"/);
 assert.ok(m,'true render must contain discoverable result geometry ID');
 return {a:{x:Number(m[1]),y:Number(m[2])},
  b:{x:Number(m[3]),y:Number(m[4])},id:m[6],visibility:m[5]};
}
test('04 source-backed scene exposes stable result action ID in actual rendered SVG',()=>{
 const s=scene(),f=whole(s),line=resultSegment(f.svg);
 assert.equal(s.status,'ready');
 assert.match(f.svg,/data-action="vis-V-/);
 assert.match(f.svg,/data-action="given-H-round"/);
 assert.equal(line.visibility,'visible');
 const focus=s.focusOnAction({actionId:line.id,expectedRevision:4});
 assert.ok(focus.width>=340&&focus.height>0);
 assert.ok(focus.x>=0&&focus.y>=0);
 assert.ok(focus.x+focus.width<=960.000001);
 assert.ok(focus.y+focus.height<=680.000001);
 assert.equal(focus.viewBox.split(' ').length,4);
});
test('04 tap on a proven result stroke finds its V5 owning step and seek time',()=>{
 const s=scene(),line=resultSegment(whole(s).svg);
 const center={x:(line.a.x+line.b.x)/2,y:(line.a.y+line.b.y)/2};
 const picked=s.inspectAt({...center,elapsedMs:s.totalMs,expectedRevision:4,
  tolerancePx:5});
 assert.ok(picked);
 assert.equal(picked.layer,'result');
 assert.ok(picked.actionId.startsWith('vis-'));
 assert.ok(Number.isInteger(picked.stepIndex));
 assert.equal(picked.stepId,s.stepDescriptors[picked.stepIndex].id);
 assert.ok(picked.seekMs>=s.stepDescriptors[picked.stepIndex].startMs);
 assert.ok(picked.seekMs<s.stepDescriptors[picked.stepIndex].endMs);
 assert.ok(picked.distancePx<=5);
 const frame=s.renderFrame({elapsedMs:picked.seekMs,expectedRevision:4});
 assert.ok(frame.activeStepIndex>=0);
});
test('04 seeking to time zero cannot select a future invisible result line',()=>{
 const s=scene(),line=resultSegment(whole(s).svg);
 const center={x:(line.a.x+line.b.x)/2,y:(line.a.y+line.b.y)/2};
 const hit=s.inspectAt({...center,elapsedMs:0,expectedRevision:4,tolerancePx:5});
 assert.ok(hit===null||hit.layer==='given');
});
test('04 tapping on known source circle is supported without fake construction step',()=>{
 const s=scene(),f=whole(s);
 const match=f.svg.match(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"[^>]*data-action="given-H-round"/);
 assert.ok(match);
 const x=Number(match[1])+Number(match[3]),y=Number(match[2]);
 const hit=s.inspectAt({x,y,elapsedMs:0,expectedRevision:4,tolerancePx:4});
 assert.ok(hit);
 assert.equal(hit.layer,'given');
 assert.equal(hit.actionId,'given-H-round');
 assert.equal(hit.stepIndex,null);
 assert.equal(hit.seekMs,0);
});
test('04 each real step supports clamped, aspect-preserving autofocus within paper',()=>{
 const s=scene();
 for(const i of [0,2,5,s.stepCount-1]){
  const f=s.focusOnStep({stepIndex:i,expectedRevision:4});
  assert.ok(f.width>=340&&f.width<=960);
  assert.ok(f.height>=240&&f.height<=680);
  assert.ok(f.x>=0&&f.y>=0);
  assert.ok(f.x+f.width<=960.000001);
  assert.ok(f.y+f.height<=680.000001);
  assert.ok(Math.abs(f.width/f.height-960/680)<1e-12);
  assert.ok(f.width>0&&f.height>0);
 }
});
test('04 stale revision, input mutation and unproven shape IDs forbid picking and focus',()=>{
 const c=cylinder(),pl=plane(),dirs=rays(),s=scene(c,pl,dirs);
 assert.throws(()=>s.focusOnStep({stepIndex:0,expectedRevision:3}),/revision/);
 assert.throws(()=>s.focusOnAction({actionId:'fake-shape',expectedRevision:4}),/reviewed/);
 assert.throws(()=>s.focusOnStep({stepIndex:s.stepCount,expectedRevision:4}),/step/);
 assert.throws(()=>s.inspectAt({x:25,y:25,elapsedMs:0,expectedRevision:5}),/revision/);
 assert.throws(()=>s.inspectAt({x:NaN,y:25,elapsedMs:0,expectedRevision:4}),/pointer/);
 assert.throws(()=>s.inspectAt({x:0,y:0,elapsedMs:0,tolerancePx:400,expectedRevision:4}),/pointer/);
 c.radiusMm=6;
 assert.throws(()=>s.focusOnAction({actionId:'given-H-round',expectedRevision:4}),/changed/);
 assert.throws(()=>s.inspectAt({x:25,y:25,elapsedMs:0,expectedRevision:4}),/changed/);
});
test('04 point picking is deterministic across new scenes and never mutates source math',()=>{
 const c=cylinder(),pl=plane(),dir=rays();
 const x=scene(c,pl,dir),y=scene(structuredClone(c),structuredClone(pl),structuredClone(dir));
 const target=resultSegment(whole(x).svg);
 const pos={x:(target.a.x+target.b.x)/2,y:(target.a.y+target.b.y)/2,
  expectedRevision:4,elapsedMs:x.totalMs,tolerancePx:4};
 assert.deepEqual(x.inspectAt(pos),y.inspectAt(pos));
 assert.deepEqual(x.focusOnStep({stepIndex:1,expectedRevision:4}),
  y.focusOnStep({stepIndex:1,expectedRevision:4}));
 assert.deepEqual(c,cylinder());assert.deepEqual(pl,plane());assert.deepEqual(dir,rays());
});
