'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {exportVerifiedFilletSvg:run}=require('../../export/verified-fillet-svg.cjs');
const p=(x,y)=>({x,y});
const seg=(a,b,c,d)=>({a:p(a,b),b:p(c,d)});
const circle=(x,y,radius)=>({center:p(x,y),radius});
const sheet={origin:p(350,220),scale:5};
const segments=()=>({problem:{kind:'two-segments',unit:'mm',revision:4,
  filletRadius:3,geometry:{first:seg(-10,0,10,0),second:seg(0,-10,0,10)}},
 selection:{branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'},sheet});
const mixed=()=>({problem:{kind:'segment-circle',unit:'mm',revision:7,
  filletRadius:3,geometry:{segment:seg(-15,0,15,0),circle:circle(0,5,8)},options:{side:1}},
 selection:{branchId:'candidate-1',direction:'ccw',lineTravel:'forward',knownCircleTravel:'cw'},sheet});
const circles=()=>({problem:{kind:'two-circles',unit:'mm',revision:8,
  filletRadius:10,geometry:{first:circle(0,0,5),second:circle(20,0,5)},
  options:{firstMode:'external',secondMode:'external'}},
 selection:{branchId:'center-1',direction:'cw',
  knownFirstTravel:'ccw',knownSecondTravel:'ccw'},sheet});

test('three genuinely solved finite fillets export completed SVG paths, not a canned drawing',()=>{
 for(const input of [segments(),mixed(),circles()]){
  const result=run(input,{expectedRevision:input.problem.revision});
  assert.equal(result.revision,input.problem.revision);
  assert.equal(result.selectedBranchId,input.selection.branchId);
  assert.equal(result.globallyUnique,null);
  assert.match(result.svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(result.svg,/<path d="M [^"]+ A /);
  assert.match(result.svg,/data-layer="result"/);
  assert.match(result.svg,/data-layer="given"/);
  assert.ok(result.actionCount>=1);
  assert.ok(result.originalStepCount>=4);
 }
});
test('changing a confirmed radius and revision changes exported math-based arc',()=>{
 const first=segments(),a=run(first,{expectedRevision:4});
 const edited=segments();edited.problem.revision=5;edited.problem.filletRadius=4;
 const b=run(edited,{expectedRevision:5});
 assert.notEqual(a.svg,b.svg);
 assert.match(a.svg,/A 15 15 0 /);
 assert.match(b.svg,/A 20 20 0 /);
 assert.throws(()=>run(edited,{expectedRevision:4}),/current-revision/);
});
test('hiding guides retains source geometry and the verified final arc',()=>{
 const input=circles();
 const full=run(input,{expectedRevision:8,includeGuides:true});
 const clean=run(input,{expectedRevision:8,includeGuides:false});
 assert.ok(full.actionCount>clean.actionCount);
 assert.doesNotMatch(clean.svg,/data-layer="guide"/);
 assert.match(clean.svg,/data-layer="given"/);
 assert.match(clean.svg,/data-layer="result"/);
 assert.match(clean.svg,/不证明全局唯一解/);
});
test('no selected branch, missing direction and invalid G1 may not export',()=>{
 const noBranch=segments();delete noBranch.selection.branchId;
 assert.throws(()=>run(noBranch,{expectedRevision:4}),/current-revision verified/);
 const noDirection=segments();delete noDirection.selection.direction;
 assert.throws(()=>run(noDirection,{expectedRevision:4}),/current-revision verified/);
 const wrong=segments();wrong.selection.firstTravel='reverse';
 assert.throws(()=>run(wrong,{expectedRevision:4}),/current-revision verified/);
});
test('no solution, degenerate geometry, unsupported units are fail-closed',()=>{
 const distant=circles();distant.problem.geometry.second=circle(1000,0,5);
 assert.throws(()=>run(distant,{expectedRevision:8}),/current-revision verified/);
 const degenerate=segments();degenerate.problem.geometry.first=seg(0,0,0,0);
 assert.throws(()=>run(degenerate,{expectedRevision:4}),/degenerate/);
 const pixels=segments();pixels.problem.unit='drawing-px';
 assert.throws(()=>run(pixels,{expectedRevision:4}),/mm/);
});
test('export is purely local data, no source mutation, script, network link or images',()=>{
 const input=mixed(),before=structuredClone(input);
 const output=run(input,{expectedRevision:7});
 assert.deepEqual(input,before);
 assert.doesNotMatch(output.svg,/<script|<image|foreignObject|<style|xlink:href|<a\b|https:\/\/(?!www\.w3\.org)/i);
 assert.match(output.svg,/<circle /);
});
test('export options must be explicit and safe',()=>{
 const input=segments();
 for(const options of [{},{expectedRevision:-1},{expectedRevision:4,includeGuides:1},
   {expectedRevision:4,filename:'wrong.svg'},null])
  assert.throws(()=>run(input,options),/revision|option|required/i);
});
test('formatting is stable for the same verified input and preserves result action provenance',()=>{
 const input=segments();const a=run(input,{expectedRevision:4});
 const b=run(structuredClone(input),{expectedRevision:4});
 assert.equal(a.svg,b.svg);
 assert.match(a.svg,/data-action="[^"]+"/);
 assert.match(a.svg,/data-step="[0-9]+"/);
 assert.match(a.svg,/viewBox="[-0-9. ]+"/);
});
