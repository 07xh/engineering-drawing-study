'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {exportVerifiedFilletSvg:single}=require('../../export/verified-fillet-svg.cjs');
const {exportVerifiedFilletStepSheets:batch}=
 require('../../export/verified-fillet-step-sheets.cjs');

const p=(x,y)=>({x,y});
const seg=(a,b,c,d)=>({a:p(a,b),b:p(c,d)});
const circle=(x,y,radius)=>({center:p(x,y),radius});
const sheet={origin:p(350,220),scale:5};
const segmentCase=()=>({problem:{kind:'two-segments',unit:'mm',revision:4,
  filletRadius:3,geometry:{first:seg(-10,0,10,0),second:seg(0,-10,0,10)}},
 selection:{branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'},sheet});
const mixedCase=()=>({problem:{kind:'segment-circle',unit:'mm',revision:7,
  filletRadius:3,geometry:{segment:seg(-15,0,15,0),circle:circle(0,5,8)},options:{side:1}},
 selection:{branchId:'candidate-1',direction:'ccw',lineTravel:'forward',knownCircleTravel:'cw'},sheet});
const circleCase=()=>({problem:{kind:'two-circles',unit:'mm',revision:8,
  filletRadius:10,geometry:{first:circle(0,0,5),second:circle(20,0,5)},
  options:{firstMode:'external',secondMode:'external'}},
 selection:{branchId:'center-1',direction:'cw',
  knownFirstTravel:'ccw',knownSecondTravel:'ccw'},sheet});
const viewBox=svg=>svg.match(/viewBox="([^"]+)"/)?.[1];
const tags=svg=>(svg.match(/<(?:line|circle|path)\b/g)||[]).length;

test('R0 three finite-fillet kinds produce real verified sequence including input and result',()=>{
 for(const fixture of [segmentCase,mixedCase,circleCase]){
  const input=fixture();
  const res=batch(input,{expectedRevision:input.problem.revision});
  assert.ok(res.totalSteps>=4);
  assert.equal(res.sheets.length,res.totalSteps+1);
  assert.equal(res.globallyUnique,null);
  assert.equal(res.selectedBranchId,input.selection.branchId);
  assert.match(res.sheets[0].svg,/id="given"/);
  assert.equal(res.sheets[0].completedSteps,0);
  assert.equal(res.sheets[0].finalArcVisible,false);
  assert.doesNotMatch(res.sheets[0].svg,/data-layer="guide"|data-layer="result"/);
  const last=res.sheets.at(-1);
  assert.equal(last.isFinalSheet,true);
  assert.equal(last.finalArcVisible,true);
  assert.match(last.svg,/<path d="M [^"]+ A /);
  assert.equal(last.svg,single(input,{expectedRevision:input.problem.revision}).svg);
 }
});
test('each intermediate step contains only current-and-earlier actions; no future arc leaks',()=>{
 const result=batch(segmentCase(),{expectedRevision:4});
 for(let i=0;i<result.sheets.length;i++){
  const svg=result.sheets[i].svg;
  assert.equal(result.sheets[i].completedSteps,i);
  assert.equal(result.sheets[i].isFinalSheet,i===result.totalSteps);
  for(const found of svg.matchAll(/data-step="(\d+)"/g))
    assert.ok(Number(found[1])<i, 'step '+found[1]+' must not appear on page '+i);
  if(i<result.totalSteps){
   // Intermediate contact points may legitimately have role=result.
   // They are geometrically proven steps, not the completed connecting arc.
   assert.equal(result.sheets[i].finalArcVisible,false);
   assert.doesNotMatch(svg,/<path[^>]*data-layer="result"/);
   assert.match(svg,/未代表最终作图完成/);
  }
  if(i>0)assert.ok(tags(svg)>=tags(result.sheets[i-1].svg));
 }
});
test('all pages have identical drawing viewport, no camera jumping across steps',()=>{
 for(const fixture of [segmentCase,mixedCase,circleCase]){
  const pages=batch(fixture(),{expectedRevision:fixture().problem.revision}).sheets;
  assert.ok(pages.every(p=>viewBox(p.svg)===viewBox(pages[0].svg)));
  assert.ok(viewBox(pages[0].svg));
 }
});
test('an explicit step count yields one stable process page without final answer',()=>{
 const input=segmentCase();
 const before=single(input,{expectedRevision:4,completedSteps:0});
 const first=single(input,{expectedRevision:4,completedSteps:1});
 const last=single(input,{expectedRevision:4});
 assert.equal(before.completedSteps,0);
 assert.equal(before.actionCount,0);
 assert.match(before.svg,/data-layer="given"/);
 assert.ok(first.actionCount>0);
 assert.equal(first.finalArcVisible,false);
 assert.equal(last.completedSteps,last.originalStepCount);
 assert.equal(last.isFinalSheet,true);
 assert.equal(viewBox(before.svg),viewBox(last.svg));
});
test('invalid partial step bounds and unexpected option fields fail closed',()=>{
 const input=segmentCase();
 for(const completedSteps of [-1,0.5,1e9,'2',NaN,null]){
  assert.throws(()=>single(input,{expectedRevision:4,completedSteps}),/completedSteps/);
 }
 assert.throws(()=>single(input,{expectedRevision:4,completedSteps:100}),/completedSteps/);
 assert.throws(()=>batch(input,{expectedRevision:4,step:'fake'}),/option/);
 assert.throws(()=>batch(input,{expectedRevision:4,includeGuides:'yes'}),/includeGuides/);
});
test('revised model changes resulting SVG and rejects old revision',()=>{
 const first=segmentCase();
 const earlier=batch(first,{expectedRevision:4});
 const edited=segmentCase();edited.problem.revision=5;edited.problem.filletRadius=4;
 assert.throws(()=>batch(edited,{expectedRevision:4}),/current-revision/);
 const newer=batch(edited,{expectedRevision:5});
 assert.notEqual(earlier.sheets.at(-1).svg,newer.sheets.at(-1).svg);
 assert.equal(newer.revision,5);
 assert.match(newer.sheets.at(-1).svg,/A 20 20 0 /);
 assert.equal(earlier.revision,4);
});
test('a blocked G1, absent branch or no solution cannot yield a misleading partial page',()=>{
 const a=segmentCase();delete a.selection.branchId;
 assert.throws(()=>batch(a,{expectedRevision:4}),/current-revision/);
 const b=segmentCase();b.selection.firstTravel='reverse';
 assert.throws(()=>batch(b,{expectedRevision:4}),/current-revision/);
 const c=circleCase();c.problem.geometry.second=circle(100,0,5);
 assert.throws(()=>batch(c,{expectedRevision:8}),/current-revision/);
});
test('guide exclusion retains sources and final verified arc, without fake intermediate results',()=>{
 const pages=batch(mixedCase(),{expectedRevision:7,includeGuides:false}).sheets;
 for(const s of pages){
  assert.match(s.svg,/data-layer="given"/);
  assert.doesNotMatch(s.svg,/data-layer="guide"/);
  if(!s.isFinalSheet)assert.doesNotMatch(s.svg,/data-layer="result"/);
 }
 assert.match(pages.at(-1).svg,/data-layer="result"/);
 assert.equal(viewBox(pages[0].svg),viewBox(pages.at(-1).svg));
});
test('SVG contains no external requests, raw source injection or imported scripts',()=>{
 const input=mixedCase(),snapshot=structuredClone(input);
 const pages=batch(input,{expectedRevision:7});
 assert.deepEqual(input,snapshot);
 for(const page of pages.sheets){
  assert.match(page.svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.doesNotMatch(page.svg,/<script|<image|<foreignObject|<style|xlink:href|<a\b/i);
 }
 const repeat=batch(structuredClone(input),{expectedRevision:7});
 assert.deepEqual(pages,repeat);
});
