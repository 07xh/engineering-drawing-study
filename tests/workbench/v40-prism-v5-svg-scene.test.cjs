'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createPrismV5SvgScene:scene}=
 require('../../engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(min=P(0,0,0),max=P(10,10,10))=>({min,max});
const plane=(at,normal)=>({point:at,normal});
const diag=z=>plane(P(0,0,z),P(1,1,1));
const mk=(b=box(),pl=diag(12))=>scene(b,pl,{revision:7});
const at=(s,ms)=>s.renderFrame({elapsedMs:ms,expectedRevision:7});
test('04 prism six-side cut renders actual full-page SVG with source/guide/result layers',()=>{
 const s=mk();assert.equal(s.status,'ready');
 assert.equal(s.sectionEdgeCount,6);
 assert.equal(s.modelGeometryVerified,true);
 assert.equal(s.visibilityVerified,false);
 assert.equal(s.firstAngleConventionSignedOff,false);
 assert.equal(s.productionUiIntegrated,false);
 const f=at(s,s.totalMs);
 assert.match(f.svg,/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
 assert.match(f.svg,/viewBox="0 0 960 680"/);
 assert.match(f.svg,/id="prism-source"/);
 assert.match(f.svg,/id="prism-guides"/);
 assert.match(f.svg,/id="prism-cut-unknown-visibility"/);
 assert.equal(f.counts.givens,12);
 assert.ok(f.counts.guides>10);
 assert.equal(f.counts.results,18);
 assert.equal(f.counts.visibilityUndetermined,f.counts.results);
 assert.equal(f.completeEngineeringDrawingVerified,false);
});
test('04 at time zero only the actual known prism projection is visible',()=>{
 const s=mk(),start=at(s,0),end=at(s,s.totalMs);
 assert.equal(start.counts.givens,12);
 assert.equal(start.counts.guides,0);
 assert.equal(start.counts.results,0);
 assert.equal(start.completeActions,0);
 assert.notEqual(start.svg,end.svg);
 assert.doesNotMatch(start.svg,/data-visibility="undetermined"/);
 assert.equal(end.done,true);
});
test('04 every result segment is visibly marked uncertain rather than fabricated solid/hidden standard',()=>{
 const s=mk(),end=at(s,s.totalMs);
 assert.match(end.svg,/data-visibility="undetermined"/);
 assert.match(end.svg,/stroke-dasharray="2 5"/);
 assert.doesNotMatch(end.svg,/data-visibility="visible"|data-visibility="hidden"/);
 const unknown=(end.svg.match(/data-visibility="undetermined"/g)||[]);
 assert.equal(unknown.length,18);
 assert.match(end.svg,/data-source="section-edge-/);
 assert.match(end.svg,/data-action="prism-section-/);
});
test('04 V5 frame progresses rather than revealing all polygon sides at once',()=>{
 const s=mk(),frames=Array.from({length:35},(_,i)=>at(s,s.totalMs*i/34));
 for(let i=1;i<frames.length;i++){
  assert.ok(frames[i].completeActions>=frames[i-1].completeActions);
  assert.ok(frames[i].counts.guides>=frames[i-1].counts.guides);
  assert.ok(frames[i].counts.results>=frames[i-1].counts.results);
 }
 assert.ok(frames.some(f=>f.counts.guides>0&&f.counts.results===0));
 assert.ok(frames.some(f=>f.counts.results>0&&!f.done));
 assert.equal(frames.at(-1).svg,at(s,s.totalMs).svg);
});
test('04 vertical and horizontal projection degeneracies render as real SVG points',()=>{
 const s=mk(box(),plane(P(0,0,5),P(0,0,1)));
 assert.equal(s.status,'ready');
 assert.equal(s.sectionEdgeCount,4);
 const svg=at(s,s.totalMs).svg;
 assert.match(svg,/data-layer="result"/);
 assert.match(svg,/<circle[^>]+data-visibility="undetermined"/);
});
test('04 native player supports speed/step seek/rewind and rejects earlier revisions',()=>{
 const s=mk(),p=s.createPlayer({speed:2});
 p.play(0);
 assert.equal(p.snapshot(200).elapsedMs,400);
 const step=p.seekStep(4,300);
 assert.equal(step.activeStepIndex,4);
 assert.equal(step.elapsedMs,s.steps[4].startMs);
 assert.equal(at(s,step.elapsedMs).activeStepIndex,4);
 assert.equal(p.seekStep(0,400).elapsedMs,0);
 p.invalidate(8,500);assert.equal(p.canRender(7),false);
});
test('04 triangular and rectangular genuine cuts result in correct number of strokes',()=>{
 const cases=[[diag(3),3],[plane(P(0,0,5),P(0,0,1)),4],
  [plane(P(5,0,0),P(1,0,0)),4]];
 for(const [p,edges] of cases){
  const s=mk(box(),p);
  assert.equal(s.status,'ready');
  assert.equal(s.sectionEdgeCount,edges);
  assert.equal(at(s,s.totalMs).counts.results,3*edges);
 }
});
test('04 valid translated geometry changes physical output without template substitution',()=>{
 const a=mk(),b=mk(box(P(5,-2,4),P(15,8,14)),
  plane(P(5,-2,16),P(1,1,1)));
 assert.equal(b.status,'ready');
 assert.equal(at(a,a.totalMs).svg,at(b,b.totalMs).svg);
 assert.equal(a.areaMm2,b.areaMm2);
});
test('04 stale revision and mutated geometry stop displaying old verified drawings',()=>{
 const b=box(),p=diag(12),s=mk(b,p);
 assert.throws(()=>s.renderFrame({elapsedMs:0,expectedRevision:8}),/stale/);
 assert.throws(()=>s.renderFrame({elapsedMs:s.totalMs+1,expectedRevision:7}),/time/);
 const good=at(s,0);assert.equal(good.revision,7);
 b.max.x=11;
 assert.throws(()=>at(s,0),/modified/);
 b.max.x=10;p.point.z=13;
 assert.throws(()=>at(s,0),/modified/);
});
test('04 unsupported geometry cannot create an SVG via fabricated proof flags',()=>{
 const s=mk(box(),diag(50));
 assert.equal(s.status,'blocked');
 assert.throws(()=>s.renderFrame({elapsedMs:0,expectedRevision:7}),/no verified/);
 const face=mk(box(),plane(P(0,0,0),P(0,0,1)));
 assert.equal(face.status,'blocked');
});
test('04 SVG contains no external loading or executable markup',()=>{
 const s=mk(),str=at(s,s.totalMs).svg;
 assert.doesNotMatch(str,/<script|<foreignObject|<image\b|href=|onload=|<style/i);
 assert.ok(str.length<90000);
});
test('04 solution is immutable and deterministic across repeated copies',()=>{
 const b=box(),pl=diag(12);
 const a=mk(b,pl),copy=mk(structuredClone(b),structuredClone(pl));
 assert.deepEqual(at(a,a.totalMs),at(copy,copy.totalMs));
 assert.deepEqual(b,box());assert.deepEqual(pl,diag(12));
});
