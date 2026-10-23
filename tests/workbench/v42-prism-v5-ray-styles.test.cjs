'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createPrismV5SvgScene:create}=
 require('../../engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs');
const v=(x,y,z)=>({x,y,z});
const cube=()=>({min:v(0,0,0),max:v(10,10,10)});
const plane=()=>({point:v(0,0,12),normal:v(1,1,1)});
const distinct=()=>({V:v(0,-1,0),H:v(0,0,1),W:v(-1,0,0)});
const allRemoved=()=>({V:v(0,1,0),H:v(0,0,1),W:v(1,0,0)});
const mk=(opt={})=>create(cube(),plane(),{revision:3,...opt});
const frame=(s,t=s.totalMs)=>s.renderFrame({elapsedMs:t,expectedRevision:3});
const matches=(text,regex)=>(text.match(regex)||[]).length;
test('04 no explicit observer information remains exactly the original honest uncertain V5 contract',()=>{
 const s=mk(),end=frame(s);
 assert.equal(s.status,'ready');
 assert.equal(s.visibilityEvidenceMode,'unconfirmed');
 assert.equal(s.visibilityVerified,false);
 assert.deepEqual(s.visibilityCounts,{visible:0,hidden:0,undetermined:18});
 assert.equal(end.counts.visibilityUndetermined,18);
 assert.equal(end.counts.visibilityVisible,0);
 assert.equal(end.counts.visibilityHidden,0);
 assert.equal(matches(end.svg,/data-visibility="undetermined"/g),18);
 assert.equal(matches(end.svg,/stroke-dasharray="2 5"/g),18);
 assert.equal(end.firstAngleConventionSignedOff,false);
 assert.equal(end.boundaryEndpointsVerified,false);
});
test('04 explicitly confirmed rays and cut side yield real model hidden and visible dashed/solid SVG',()=>{
 const s=mk({retainedHalfspace:'positive',observerDirections:distinct()});
 const f=frame(s);
 assert.equal(s.status,'ready');
 assert.equal(s.visibilityEvidenceMode,'explicit-observer-rays');
 assert.ok(s.visibilityCounts.visible>0);
 assert.ok(s.visibilityCounts.hidden>0);
 assert.ok(s.visibilityCounts.undetermined>0);
 assert.equal(s.visibilityVerified,false);
 assert.equal(f.counts.results,18);
 assert.equal(f.counts.visibilityHidden,s.visibilityCounts.hidden);
 assert.equal(f.counts.visibilityVisible,s.visibilityCounts.visible);
 assert.equal(f.counts.visibilityUndetermined,s.visibilityCounts.undetermined);
 assert.match(f.svg,/stroke-dasharray="7 4"[^>]*data-visibility="hidden"/);
 assert.match(f.svg,/stroke-dasharray="none"[^>]*data-visibility="visible"/);
 assert.match(f.svg,/stroke-dasharray="2 5"[^>]*data-visibility="undetermined"/);
 assert.equal(f.firstAngleConventionSignedOff,false);
 assert.equal(s.firstAngleConventionSignedOff,false);
});
test('04 all three eyes facing removed halfspace results in model-visible solid strokes, not national standard approval',()=>{
 const s=mk({retainedHalfspace:'negative',observerDirections:allRemoved()});
 assert.equal(s.status,'ready');
 assert.equal(s.visibilityVerified,true);
 assert.equal(s.openEdgeRayVisibilityVerified,true);
 assert.equal(s.visibilityCounts.visible,18);
 assert.equal(s.visibilityCounts.hidden,0);
 assert.equal(s.visibilityCounts.undetermined,0);
 const f=frame(s);
 assert.equal(f.counts.visibilityVisible,18);
 assert.equal(f.counts.visibilityHidden,0);
 assert.equal(f.counts.visibilityUndetermined,0);
 assert.doesNotMatch(f.svg,/data-visibility="undetermined"/);
 assert.match(f.svg,/data-visibility="visible"/);
 assert.equal(f.completeEngineeringDrawingVerified,false);
 assert.equal(s.firstAngleConventionSignedOff,false);
});
test('04 same geometry and three camera rays show different results when retained halfspace reverses',()=>{
 const opts={observerDirections:distinct()};
 const a=mk({...opts,retainedHalfspace:'negative'});
 const b=mk({...opts,retainedHalfspace:'positive'});
 assert.notDeepEqual(a.visibilityCounts,b.visibilityCounts);
 assert.notEqual(frame(a).svg,frame(b).svg);
 assert.deepEqual(a.steps.map(x=>x.id),b.steps.map(x=>x.id));
});
test('04 changing any of three observer directions invalidates previously generated math and drawing',()=>{
 const b=cube(),pl=plane(),rays=distinct();
 const s=create(b,pl,{revision:3,retainedHalfspace:'positive',observerDirections:rays});
 assert.equal(s.status,'ready');
 const before=frame(s);
 assert.equal(before.revision,3);
 rays.W.x=1;
 assert.throws(()=>frame(s),/modified/);
 assert.throws(()=>s.renderFrame({elapsedMs:0,expectedRevision:4}),/stale/);
});
test('04 refuses incomplete or covert observer-mode fallback',()=>{
 const wrong=[
  {retainedHalfspace:'negative'},
  {observerDirections:distinct()},
  {retainedHalfspace:'bad',observerDirections:distinct()},
  {retainedHalfspace:'positive',observerDirections:{V:v(0,-1,0),H:v(0,0,1)}},
  {retainedHalfspace:'positive',observerDirections:{...distinct(),W:v(0,0,0)}}
 ];
 for(const config of wrong)
  assert.throws(()=>mk(config),/halfspace|observer|ray/i);
});
test('04 time zero and actual V5 action fractions stay independent of observer styling',()=>{
 const s=mk({retainedHalfspace:'positive',observerDirections:distinct()});
 const at0=frame(s,0),atEnd=frame(s);
 assert.equal(at0.counts.results,0);
 assert.equal(at0.counts.visibilityHidden,0);
 assert.equal(at0.counts.visibilityVisible,0);
 assert.equal(atEnd.counts.results,18);
 assert.equal(s.stepCount,s.steps.length);
 const p=s.createPlayer({speed:2});
 p.play(0);assert.equal(p.snapshot(200).elapsedMs,400);
 assert.equal(p.seekStep(5,300).elapsedMs,s.steps[5].startMs);
 assert.equal(p.seekStep(0,400).elapsedMs,0);
});
test('04 top-horizontal cut projects to actual SVG point with honest observer evidence',()=>{
 const s=create(cube(),{
  point:v(0,0,5),normal:v(0,0,1)
 },{revision:3,retainedHalfspace:'positive',observerDirections:distinct()});
 assert.equal(s.status,'ready');
 const end=frame(s);
 assert.equal(end.counts.results,12);
 assert.match(end.svg,/<circle[^>]*data-layer="result"[^>]*data-visibility="/);
 assert.ok(end.svg.length<90000);
 assert.doesNotMatch(end.svg,/<script|<foreignObject|<image\b|href=/i);
});
test('04 fresh recomputation is stable, and every visible result retains mathematics source ID',()=>{
 const opts={retainedHalfspace:'positive',observerDirections:distinct()};
 const a=mk(opts),b=mk(structuredClone(opts));
 const out=frame(a),same=frame(b);
 assert.deepEqual(out,same);
 assert.equal(matches(out.svg,/data-source="section-edge-[1-6]"/g),18);
 assert.equal(matches(out.svg,/data-action="prism-section-[1-6]-[VHW]"/g),18);
});
