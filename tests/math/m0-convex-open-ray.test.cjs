'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {classifyConvexOpenRaySign:classify,OPEN_RAY_SIGNS:S}=
 require('../../core/numeric/convex-open-ray.cjs');
test('M0 open-convex ray has exactly four sign cases and never claims endpoint proof',()=>{
 assert.deepEqual(Object.values(S),['removed','exiting','entering','undetermined']);
 const eps=1e-10;
 for(const outward of [-10,0,10])
  assert.equal(classify(-0.5,outward),S.REMOVED,
   'removed halfspace dominates a surface normal');
 assert.equal(classify(0.5,0.7),S.EXITING);
 assert.equal(classify(0.5,-0.7),S.ENTERING);
 for(const [a,b] of [[0,1],[1,0],[1,eps],[1,-eps],
   [eps,1],[-eps,1],[-eps,-1]])
  assert.equal(classify(a,b),S.UNDETERMINED,
   'boundary equality/tangency is not a visibility proof');
});
test('M0 observer scaling is invariant when the absolute sign tolerance is scaled',()=>{
 for(const pair of [[-0.4,0.3],[0.4,0.7],[0.4,-0.7],
  [0.4,0],[0,0.4],[1e-11,-1e-11]]){
  const truth=classify(...pair,1e-10);
  for(const scale of [0.1,2,10,100]){
   const next=classify(pair[0]*scale,pair[1]*scale,1e-10*scale);
   assert.equal(next,truth);
  }
 }
});
test('M0 changing the cut plane normal AND retained-side sign preserves classification',()=>{
 const dot=(n,d)=>n.reduce((s,v,i)=>s+v*d[i],0);
 const ray=[.2,-.3,.8],normal=[1,2,3],outward=[-.8,.1,.4];
 for(const sign of [-1,1]){
  const a=classify(sign*dot(normal,ray),dot(outward,ray));
  const reversed=classify(-sign*dot(normal.map(v=>-v),ray),
   dot(outward,ray));
  assert.equal(a,reversed);
 }
});
test('M0 nonfinite, nonnumeric and degenerate tolerances are rejected',()=>{
 for(const [a,b,t] of [[NaN,1,1e-10],[1,Infinity,1e-10],
  ['1',1,1e-10],[1,1,0],[1,1,-1],[1,1,NaN],[1,1,1],
  [1,1,Infinity]]){
  assert.throws(()=>classify(a,b,t),/finite ray slopes/);
 }
});
test('M3 prism, cylinder and cone remain specialist-scoped and cannot certify V5',()=>{
 const P=(x,y,z)=>({x,y,z});
 const plane={point:P(0,0,3),normal:P(1,0,1)};
 const cfg={retainedHalfspace:'negative',observerDirection:P(1,0,0)};
 const {classifyPrismSectionVisibility}=require('../../engines/spatial/sections/rectangular-prism-cut-visibility.cjs');
 const {classifyCylinderSectionVisibility}=require('../../engines/spatial/sections/cylinder-cut-ray-visibility.cjs');
 const {classifyConeSectionVisibility}=require('../../engines/spatial/sections/cone-cut-ray-visibility.cjs');
 const prism=classifyPrismSectionVisibility(
  {min:P(0,0,0),max:P(10,10,10)},
  {point:P(0,0,12),normal:P(1,1,1)},
  {retainedHalfspace:'negative',observerDirection:P(0,0,1)});
 const cylinder=classifyCylinderSectionVisibility(
  {baseCenter:P(0,0,0),radiusMm:5,heightMm:30},plane,cfg);
 const cone=classifyConeSectionVisibility(
  {baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'},
  {point:P(0,0,6),normal:P(1,0,3),modelUnit:'mm'},
  {kind:'full-ellipse',sourceConfirmed:true,...cfg});
 for(const r of [prism,cylinder,cone]){
  assert.equal(r.status,'ready');
  assert.ok(r.runs?.length||r.edgeRuns?.length);
  assert.equal(r.standardViewMappingVerified,false);
  assert.equal(r.globallyUnique,null);
  assert.notEqual(r.v5LineStylesReady,true);
  assert.notEqual(r.v5StrokeStyleReady,true);
 }
});
