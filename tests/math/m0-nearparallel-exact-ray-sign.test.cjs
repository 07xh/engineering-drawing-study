'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {certifyDotSign}=require('../../core/numeric/euclidean-kernel.cjs');
const {intersectConvexRayHalfspaces:intersect,traceConvexRayDepth:trace}=
 require('../../core/numeric/convex-ray-depth.cjs');
const P=(x,y,z)=>({x,y,z});
const H=(id,normal,offsetMm)=>({id,normal,offsetMm});
const faces=[
 H('diagonal',P(1,1,1),-2),
 H('xmin',P(-1,0,0),100),H('xmax',P(1,0,0),100),
 H('ymin',P(0,-1,0),100),H('ymax',P(0,1,0),100),
 H('zmin',P(0,0,-1),100),H('zmax',P(0,0,1),100)
];
const source=P(0,0,0),e=(2**-53)/2;
test('false-zero nearparallel rounded dot is not sufficient for a certified ray miss',()=>{
 const n=P(1,1,1),d=P(-1,-e,1);
 const nm=Math.hypot(n.x,n.y,n.z),dm=Math.hypot(d.x,d.y,d.z);
 const a=[n.x/nm,n.y/nm,n.z/nm],b=[d.x/dm,d.y/dm,d.z/dm];
 assert.equal(a.reduce((s,v,i)=>s+v*b[i],0),0);
 const exact=certifyDotSign(a,b);
 assert.equal(exact.rounded,0);
 assert.equal(exact.sign,-1);
 assert.equal(exact.signMatchesRounded,false);
 const r=intersect({point:source,observerDirection:d,halfspaces:faces});
 assert.equal(r.status,'undetermined');
 assert.equal(r.reason,'coplanar-support-ray');
});
test('genuinely exact parallel outside support still proves a miss of supplied solid',()=>{
 const d=P(-1,0,1);
 const n=P(1,1,1),nm=Math.hypot(3),dm=Math.hypot(2);
 assert.equal(certifyDotSign([n.x/nm,n.y/nm,n.z/nm],
  [d.x/dm,d.y/dm,d.z/dm]).sign,0);
 const r=intersect({point:source,observerDirection:d,halfspaces:faces});
 assert.equal(r.status,'miss');
 assert.equal(r.reason,'ray-outside-exact-parallel-plane');
});
test('nearparallel supplied-solid ray is not promoted to complete-scene clear',()=>{
 const r=trace({point:source,observerDirection:P(-1,-e,1),
  solids:[{id:'box-like',halfspaces:faces}]});
 assert.equal(r.status,'undetermined');
 assert.equal(r.officialLineStyleVerified,false);
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.depthOrderVerified,false);
});
test('ordinary axis rays preserve exact positive depth and first-hit status',()=>{
 const cube=[
  H('x0',P(-1,0,0),0),H('x1',P(1,0,0),10),
  H('y0',P(0,-1,0),0),H('y1',P(0,1,0),10),
  H('z0',P(0,0,-1),-2),H('z1',P(0,0,1),4)
 ];
 const r=intersect({point:P(5,5,0),observerDirection:P(0,0,1),
  halfspaces:cube});
 assert.equal(r.status,'hit');
 assert.equal(r.entryMm,2);
 assert.equal(r.exitMm,4);
});
