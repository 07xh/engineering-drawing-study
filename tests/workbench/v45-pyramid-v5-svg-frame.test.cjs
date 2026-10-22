'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createPyramidV5SvgScene:create}=
 require('../../engines/spatial/sections/rectangular-pyramid-v5-frame-svg.cjs');
const p=(x,y,z)=>({x,y,z});
const pyramid=()=>({base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)});
const plane=(at,normal)=>({point:at,normal});
const diag=k=>plane(p(0,0,k),p(1,1,1));
const make=(shape=pyramid(),cut=diag(15))=>create(shape,cut,{revision:6});
const frame=(scene,ms=scene.totalMs)=>scene.renderFrame({elapsedMs:ms,expectedRevision:6});
const count=(str,re)=>(str.match(re)||[]).length;
test('04 mathematically proven five-sided pyramid becomes an actual 960x680 V5 SVG scene',()=>{
 const s=make(),f=frame(s);
 assert.equal(s.status,'ready');
 assert.equal(s.sectionEdgeCount,5);
 assert.equal(s.mathematicalPerimeterVerified,true);
 assert.equal(s.visibilityVerified,false);
 assert.equal(s.firstAngleConventionSignedOff,false);
 assert.equal(s.productionUiIntegrated,false);
 assert.match(f.svg,/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
 assert.match(f.svg,/viewBox="0 0 960 680"/);
 for(const id of ['pyramid-givens','pyramid-guides','pyramid-section-unknown'])
  assert.match(f.svg,new RegExp('id="'+id+'"'));
 assert.equal(f.counts.givens,24);
 assert.equal(f.counts.results,15);
 assert.equal(f.counts.undetermined,15);
 assert.equal(f.done,true);
});
test('04 before animation starts only real known-pyramid edges can be seen',()=>{
 const s=make(),start=frame(s,0),end=frame(s);
 assert.equal(start.counts.givens,24);
 assert.equal(start.counts.guides,0);
 assert.equal(start.counts.results,0);
 assert.equal(start.completedActions,0);
 assert.equal(start.done,false);
 assert.doesNotMatch(start.svg,/data-layer="result"/);
 assert.notEqual(start.svg,end.svg);
});
test('04 result lines preserve mathematical origin face IDs and remain unconfirmed',()=>{
 const f=frame(make());
 assert.equal(count(f.svg,/data-layer="result"/g),15);
 assert.equal(count(f.svg,/data-visibility="undetermined"/g),15);
 assert.equal(count(f.svg,/data-source="section-edge-[1-5]"/g),15);
 assert.equal(count(f.svg,/data-source-face="(?:base|side-[0-3])"/g),15);
 assert.equal(count(f.svg,/stroke-dasharray="2 5"/g),15);
 assert.doesNotMatch(f.svg,/data-visibility="visible"|data-visibility="hidden"/);
 assert.equal(f.completeEngineeringDrawingVerified,false);
});
test('04 real V5 timeline paints guides before results and advances incrementally',()=>{
 const s=make();
 const frames=Array.from({length:51},(_,i)=>frame(s,s.totalMs*i/50));
 assert.ok(frames.some(f=>f.counts.guides>0&&f.counts.results===0));
 assert.ok(frames.some(f=>f.counts.results>0&&!f.done));
 for(let i=1;i<frames.length;i++){
  assert.ok(frames[i].completedActions>=frames[i-1].completedActions);
  assert.ok(frames[i].counts.guides>=frames[i-1].counts.guides);
  assert.ok(frames[i].counts.results>=frames[i-1].counts.results);
 }
 assert.equal(frames.at(-1).svg,frame(s).svg);
});
test('04 planar triangular, horizontal quadrilateral and diagonal pentagonal cuts all render genuine geometry',()=>{
 const cases=[[diag(3),3],[plane(p(0,0,8),p(0,0,1)),4],[diag(15),5]];
 for(const [cut,edgeCount] of cases){
  const s=make(pyramid(),cut),f=frame(s);
  assert.equal(s.status,'ready');
  assert.equal(s.sectionEdgeCount,edgeCount);
  assert.equal(f.counts.results,edgeCount*3);
  assert.equal(s.sourceSectionFaces.length,edgeCount);
  assert.equal(count(f.svg,/data-source-face="/g),edgeCount*3);
 }
});
test('04 degenerating line projections are real points instead of zero-length impostor lines',()=>{
 const s=make(pyramid(),plane(p(0,0,8),p(0,0,1)));
 const f=frame(s);
 assert.match(f.svg,/<circle[^>]*data-layer="result"/);
 assert.doesNotMatch(f.svg,/<line[^>]*x1="([0-9.]+)" y1="([0-9.]+)" x2="\1" y2="\2"[^>]*data-layer="result"/);
});
test('04 original V5 player retains exact steps, speed, rewind and revision blocking',()=>{
 const s=make(),player=s.createPlayer({speed:2});
 player.play(0);
 assert.equal(player.snapshot(250).elapsedMs,500);
 const step=player.seekStep(5,300);
 assert.equal(step.activeStepIndex,5);
 assert.equal(step.elapsedMs,s.steps[5].startMs);
 assert.equal(frame(s,step.elapsedMs).activeStepIndex,5);
 assert.equal(player.seekStep(0,400).elapsedMs,0);
 player.invalidate(7,500);
 assert.equal(player.canRender(6),false);
});
test('04 no valid polygon means no animation or SVG: no-intersection, tangent and coplanar',()=>{
 for(const cut of [plane(p(0,0,50),p(0,0,1)),diag(0),
  plane(p(0,0,0),p(0,0,1)),plane(p(0,0,15),p(0,0,1))]){
  const s=make(pyramid(),cut);
  assert.equal(s.status,'blocked');
  assert.throws(()=>s.renderFrame({elapsedMs:0,expectedRevision:6}),/no verified/);
 }
});
test('04 new model geometry or changed plane invalidates previously verified frame',()=>{
 const model=pyramid(),cut=diag(15),s=make(model,cut);
 assert.throws(()=>s.renderFrame({elapsedMs:0,expectedRevision:7}),/stale/);
 assert.throws(()=>frame(s,-1),/time/);
 assert.throws(()=>frame(s,s.totalMs+1),/time/);
 assert.equal(frame(s,0).revision,6);
 model.apex.z=17;
 assert.throws(()=>frame(s,0),/changed/);
 model.apex.z=15;cut.point.z=16;
 assert.throws(()=>frame(s,0),/changed/);
});
test('04 deterministic source-proven SVG stays entirely local and non-executable',()=>{
 const model=pyramid(),cut=diag(15),s=make(model,cut);
 const other=make(structuredClone(model),structuredClone(cut));
 assert.deepEqual(frame(s),frame(other));
 assert.deepEqual(model,pyramid());
 assert.deepEqual(cut,diag(15));
 const svg=frame(s).svg;
 assert.doesNotMatch(svg,/<script|<foreignObject|<image\b|href=|onload=|<style/);
 assert.ok(svg.length<120000);
});
