'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1OriginalCoProjectedDepthOrder}=
 require('../../workbench/c1-original-coproject-depth-order.cjs');
const geometry=()=>({
 id:'CubeOverlap',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{
  A:{x:0,y:0,z:0},B:{x:4,y:0,z:0},C:{x:4,y:3,z:0},
  D:{x:0,y:3,z:0},E:{x:0,y:0,z:5},F:{x:4,y:0,z:5},
  G:{x:4,y:3,z:5},H:{x:0,y:3,z:5}},
  edges:[['A','E'],['D','H'],['A','B']],
  faces:[]
 }
});
const source=(a,b)=>'CubeOverlap::'+[a,b].sort().join('|');
const peer=(a,b,status='single-opaque-solid-whole-open-ray-clear',
 range=[0,1])=>({
 sourceGeometryId:'CubeOverlap',sourceEdgeId:source(a,b),
 view:'V',originalParameterRange:range,status
});
const check=(geom,id,peers,range=[0,1])=>
 auditC1OriginalCoProjectedDepthOrder({
  geometry:geom,view:'V',sourceEdgeId:id,
  originalParameterRange:range,peers
 });
test('same paper interval from independent original 3D edges has strict front order',()=>{
 const a=check(geometry(),source('A','E'),[peer('D','H',
  'single-opaque-solid-whole-open-ray-strictly-hidden')]);
 assert.equal(a.status,'candidate-strictly-front-of-all-aliases');
 assert.equal(a.aliasesExamined,1);
 assert.equal(a.wholeIntervalFrontmostCertified,true);
 assert.deepEqual(a.comparisons[0].depthDifferenceAtEndsMm,[3,3]);
});
test('verified back physical edge is suppressed by actual front-visible source',()=>{
 const a=check(geometry(),source('D','H'),[peer('A','E')]);
 assert.equal(a.status,'suppressed-by-front-original-visible-source');
 assert.equal(a.visibleSourceCoversEntireLine,true);
 assert.equal(a.wholeIntervalFrontmostCertified,false);
});
test('positive partial overlap cannot certify a whole source stroke',()=>{
 const g=geometry();g.data.points.H.z=2;
 const a=check(g,source('A','E'),[peer('D','H')]);
 assert.equal(a.status,'undetermined-coproject-source-order');
 assert.equal(a.comparisons[0].status,
  'partial-or-ambiguous-coproject-overlap');
});
test('affine depth reversal through the middle remains unsigned',()=>{
 const g=geometry();g.data.points.D.y=3;g.data.points.H.y=-3;
 const a=check(g,source('A','E'),[peer('D','H')]);
 assert.equal(a.status,'undetermined-coproject-source-order');
 assert.equal(a.comparisons[0].status,'depth-switch-or-tie');
});
test('front/back ranking uses the first-angle observer ray, not numerical coordinate size',()=>{
 const a=check(geometry(),source('A','E'),[peer('D','H')]);
 assert.equal(a.comparisons[0].depthDifferenceAtEndsMm[0],3);
 const back=check(geometry(),source('D','H'),[peer('A','E',
  'single-opaque-solid-whole-open-ray-strictly-hidden')]);
 assert.equal(back.status,'undetermined-source-behind-unverified-peer');
});
test('forged stale original parameter ranges fail closed',()=>{
 assert.throws(()=>check(geometry(),source('A','E'),[
  peer('D','H',undefined,[0,1.5])
 ]),/forged original peer/);
 assert.throws(()=>check(geometry(),'CubeOverlap::nope',[]),
  /unrecognized original source/);
});
