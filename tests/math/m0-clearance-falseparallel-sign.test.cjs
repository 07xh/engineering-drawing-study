'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {certifyConvexSegmentClearance:clearance}=
 require('../../core/numeric/convex-segment-clearance.cjs');
const {certifyDotSign}=require('../../core/numeric/euclidean-kernel.cjs');
const P=(x,y,z)=>({x,y,z});
const H=(id,normal,offsetMm)=>({id,normal,offsetMm});
const source={id:'seg',from:P(0,0,0),to:P(0,1,0)};
const faces=[
 H('diagonal',P(1,1,1),-2),
 H('xmin',P(-1,0,0),100),H('xmax',P(1,0,0),100),
 H('ymin',P(0,-1,0),100),H('ymax',P(0,1,0),100),
 H('zmin',P(0,0,-1),100),H('zmax',P(0,0,1),100)
];
const solid={id:'candidate',halfspaces:faces};
const epsilon=2**-54;
test('rounded-zero opposite-normal observer cannot certify full segment clearance',()=>{
 const n=[1,1,1],d=[-1,-epsilon,1];
 const nlen=Math.hypot(...n),dlen=Math.hypot(...d);
 const a=n.map(x=>x/nlen),b=d.map(x=>x/dlen);
 assert.equal(a.reduce((s,v,i)=>s+v*b[i],0),0);
 const exact=certifyDotSign(a,b);
 assert.equal(exact.sign,-1);
 assert.equal(exact.rounded,0);
 const r=clearance({source,solid,observerDirection:P(...d)});
 assert.equal(r.status,'undetermined');
 assert.equal(r.sourceOpenIntervalVerified,false);
 assert.equal(r.officialLineStyleVerified,false);
});
test('mathematically EXACT zero observer slope retains proven exterior-support clearance',()=>{
 const r=clearance({source,solid,observerDirection:P(-1,0,1)});
 assert.equal(r.status,'certified-clear');
 assert.equal(r.reason,'full-interval-exterior-support');
 assert.equal(r.sceneCompleteVerified,false);
});
test('normal exterior finite cube rays preserve 1D continuous clearance proof',()=>{
 const cube={id:'cube',halfspaces:[
  H('x0',P(-1,0,0),0),H('x1',P(1,0,0),10),
  H('y0',P(0,-1,0),0),H('y1',P(0,1,0),10),
  H('z0',P(0,0,-1),0),H('z1',P(0,0,1),10)
 ]};
 const r=clearance({source:{id:'outside',from:P(15,2,2),to:P(15,8,2)},
  solid:cube,observerDirection:P(1,0,0)});
 assert.equal(r.status,'certified-clear');
 assert.equal(r.sceneCompleteVerified,false);
 assert.equal(r.v5Ready,false);
});
test('near-parallel and degenerate source keep existing model-mm strict controls',()=>{
 assert.throws(()=>clearance({source:{id:'x',from:P(0,0,0),to:P(0,0,0)},
  solid,observerDirection:P(1,0,0)}),RangeError);
 assert.throws(()=>clearance({source,solid,observerDirection:P(0,0,0)}),RangeError);
});
