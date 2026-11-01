'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {solveProjection}=require('../../engines/projection/point-projection.cjs');

const V=[15,12],H=[15,10],W=[10,12];
const sheetTransform={origin:{x:100,y:100},scale:2};
const nearly=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<=e,a+' != '+b);

test('P0 03: V+H reconstructs unique xyz and third W from real math',()=>{
 const o=solveProjection({knownViews:{V,H},sheetTransform});
 assert.equal(o.status,'unique');
 assert.deepEqual(o.point,{x:15,y:10,z:12});
 assert.deepEqual(o.views,{V:{u:15,v:12},H:{u:15,v:10},W:{u:10,v:12}});
 assert.deepEqual(o.sheet,{V:{x:70,y:76},H:{x:70,y:120},W:{x:120,y:76},M:{x:120,y:120}});
 assert.equal(o.steps.length,5);
 assert.equal(o.maxResidual,0);
 assert.equal(o.globallyUnique,true);
});

test('P0 03: all two-plane combinations solve exactly one point',()=>{
 for(const knownViews of [{V,H},{V,W},{H,W}]){
  const o=solveProjection({knownViews,sheetTransform});
  assert.equal(o.status,'unique');
  assert.deepEqual(o.point,{x:15,y:10,z:12});
  assert.equal(o.proofLevel,'linear-algebra');
 }
});

test('one projection remains continuous; never displays invented W or guides',()=>{
 const o=solveProjection({knownViews:{V}});
 assert.equal(o.status,'continuous');assert.equal(o.degrees,1);
 assert.equal(o.point,null);assert.equal(o.sheet,null);
 assert.deepEqual(o.steps,[]);assert.deepEqual(o.guides,[]);
});
test('no given conditions means three degrees of freedom, no fake result',()=>{
 const o=solveProjection();
 assert.equal(o.status,'continuous');assert.equal(o.degrees,3);
 assert.equal(o.point,null);
});
test('two contradictory x coordinates yield no solution and no fake guide',()=>{
 const o=solveProjection({knownViews:{V,H:[16,10]},sheetTransform});
 assert.equal(o.status,'none');
 assert.equal(o.solutionCount,0);
 assert.equal(o.point,null);assert.deepEqual(o.steps,[]);
});
test('large model x mismatch of 10mm is never silently accepted',()=>{
 const o=solveProjection({knownViews:{V:[1e12,12],H:[1e12+10,10]}});
 assert.equal(o.status,'none');
 assert.equal(o.point,null);
});
test('point-based full known xyz may drive guides without fake missing geometry',()=>{
 const o=solveProjection({knownPoint:{x:15,y:10,z:12},sheetTransform});
 assert.equal(o.status,'unique');
 assert.deepEqual(o.views.W,{u:10,v:12});
 assert.equal(o.knownPoint,true);
 assert.deepEqual(o.knownViews,[]);
});
test('given spatial point and conflicting 2D view are rejected as none',()=>{
 const o=solveProjection({knownPoint:{x:15,y:10,z:12},knownViews:{V:[15,13]}});
 assert.equal(o.status,'none');
});
test('45 degree transfer guides represent V-H same x, V-W same z, H-M-W same y',()=>{
 const o=solveProjection({knownViews:{V,H},sheetTransform});
 assert.deepEqual(o.guides.map(g=>g.kind),
  ['VH','height-VW','depth-45','depth-HM','depth-MW']);
 assert.equal(o.steps.length,5);
 for(const s of o.steps){
  assert.equal(s.source,'computed-first-angle-guides');
  assert.equal(s.style,'auxiliary');
  assert.equal(s.unit,'px');
  assert.match(s.explanation,/投影|联系|深度/);
 }
 for(let i=1;i<5;i++)assert.deepEqual(o.steps[i].dependsOn,['guide_'+i]);
 const diagonal=o.steps.find(s=>s.kind==='depth-45');
 assert.ok(diagonal);
 assert.deepEqual(diagonal.from,sheetTransform.origin);
 assert.deepEqual(diagonal.to,o.sheet.M);
 assert.equal(diagonal.sourceModelAxis,'y');
 assert.equal(diagonal.sourceModelValue,10);
 assert.equal(diagonal.sourceKnownView,'H');
 assert.equal(diagonal.targetView,'W');
 assert.equal(diagonal.constructionOnly,true);
 assert.match(diagonal.explanation,/45°|俯视图/);
 nearly(o.sheet.V.x,o.sheet.H.x);
 nearly(o.sheet.V.y,o.sheet.W.y);
 nearly(o.sheet.H.y-100,o.sheet.M.x-100);
});
test('negative and zero coordinates are real model coordinates, not pixel values',()=>{
 const o=solveProjection({knownPoint:{x:-2.5,y:-3.75,z:-.125},sheetTransform});
 assert.equal(o.status,'unique');
 assert.deepEqual(o.views,{V:{u:-2.5,v:-.125},H:{u:-2.5,v:-3.75},W:{u:-3.75,v:-.125}});
 assert.deepEqual(o.sheet,{V:{x:105,y:100.25},H:{x:105,y:92.5},W:{x:92.5,y:100.25},M:{x:92.5,y:92.5}});
});
test('change sheet zoom/origin does not affect solved math result',()=>{
 const first=solveProjection({knownViews:{V,H},sheetTransform});
 const second=solveProjection({knownViews:{V,H},
  sheetTransform:{origin:{x:20,y:400},scale:9}});
 assert.deepEqual(first.point,second.point);
 assert.deepEqual(first.views,second.views);
 assert.notDeepEqual(first.sheet,second.sheet);
});
test('invalid planes, nonfinite values and incomplete coordinates throw',()=>{
 for(const knownViews of [{Q:[1,2]},{V:[15]},{V:[NaN,10]},{V:'15,10'}]){
  assert.throws(()=>solveProjection({knownViews}));
 }
 for(const knownPoint of [{x:1,y:2},{x:1,y:2,z:Infinity},{x:1,y:2,z:3,w:4}]){
  assert.throws(()=>solveProjection({knownPoint}));
 }
 assert.throws(()=>solveProjection({knownViews:{V,H},sheetTransform:{origin:{x:0,y:0},scale:0}}));
});
test('finite but overflowing canvas coordinate is rejected, never returned as Infinity',()=>{
 assert.throws(()=>solveProjection({knownPoint:{x:1e308,y:1e308,z:1e308},
  sheetTransform:{origin:{x:0,y:0},scale:10}}));
});
test('supplied input projection arrays are not mutated',()=>{
 const knownViews={V:[15,12],H:[15,10]},original=JSON.stringify(knownViews);
 solveProjection({knownViews,sheetTransform});
 assert.equal(JSON.stringify(knownViews),original);
});

test('negative depth transfers left/up along real 45-degree line; zero depth has no decorative diagonal',()=>{
 const neg=solveProjection({knownViews:{V:[15,12],H:[15,-10]},sheetTransform});
 const d=neg.steps.find(s=>s.kind==='depth-45');
 assert.deepEqual(d.from,{x:100,y:100});
 assert.deepEqual(d.to,{x:80,y:80});
 assert.equal(d.to.x-d.from.x,d.to.y-d.from.y);
 assert.deepEqual(neg.steps.map(s=>s.kind),
  ['VH','height-VW','depth-45','depth-HM','depth-MW']);
 const zero=solveProjection({knownViews:{V:[15,12],H:[15,0]},sheetTransform});
 assert.equal(zero.steps.length,4);
 assert.equal(zero.steps.some(s=>s.kind==='depth-45'),false);
 assert.equal(zero.sheet.W.x,sheetTransform.origin.x);
});

test('45-degree step explanation cannot pretend H was GIVEN when only V/W or XYZ was supplied',()=>{
 const vw=solveProjection({knownViews:{V,W},sheetTransform});
 const d=vw.steps.find(s=>s.kind==='depth-45');
 assert.equal(d.sourceKnownView,'W');
 assert.equal(d.targetView,'H');
 assert.match(d.explanation,/已知侧视图 W/);
 const xyz=solveProjection({knownPoint:{x:15,y:10,z:12},sheetTransform});
 const from3D=xyz.steps.find(s=>s.kind==='depth-45');
 assert.equal(from3D.sourceKnownView,null);
 assert.equal(from3D.targetView,null);
 assert.match(from3D.explanation,/已审三维点/);
});
