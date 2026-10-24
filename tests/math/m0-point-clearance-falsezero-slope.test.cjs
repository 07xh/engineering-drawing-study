'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyConvexPointRayClearance:clear}=
 require('../../core/numeric/convex-point-ray-clearance.cjs');
const {certifyDotSign}=require('../../core/numeric/euclidean-kernel.cjs');
const P=(x,y,z)=>({x,y,z});
const H=(id,normal,offsetMm)=>({id,normal,offsetMm});
const halfspaces=[
 H('diagonal',P(1,1,1),-2),
 H('xmin',P(-1,0,0),100),H('xmax',P(1,0,0),100),
 H('ymin',P(0,-1,0),100),H('ymax',P(0,1,0),100),
 H('zmin',P(0,0,-1),100),H('zmax',P(0,0,1),100)
];
const solid={id:'SourceSolid',halfspaces};
test('M0 point open-ray refuses rounded-zero but genuinely inward support slope',()=>{
 const n=[1,1,1],d=[-1,-(2**-54),1];
 const ln=Math.hypot(...n),ld=Math.hypot(...d);
 const a=n.map(x=>x/ln),b=d.map(x=>x/ld);
 assert.equal(a.reduce((v,x,i)=>v+x*b[i],0),0);
 const ev=certifyDotSign(a,b);
 assert.equal(ev.sign,-1);
 assert.equal(ev.rounded,0);
 const r=clear({point:P(0,0,0),observerDirection:P(...d),solid});
 assert.equal(r.status,'undetermined');
 assert.equal(r.positiveOpenRayClearVerified,false);
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.v5Ready,false);
});
test('true exact parallel exterior support still grants local clear only',()=>{
 const r=clear({point:P(0,0,0),observerDirection:P(-1,0,1),solid});
 assert.equal(r.status,'certified-clear');
 assert.equal(r.reason,'exterior-support-positive-open-ray');
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.officialLineStyleVerified,false);
});
test('ordinary cube upper supporting face +Z ray stays locally clear',()=>{
 const cube={id:'Box',halfspaces:[
  H('x0',P(-1,0,0),0),H('x1',P(1,0,0),10),
  H('y0',P(0,-1,0),0),H('y1',P(0,1,0),10),
  H('z0',P(0,0,-1),0),H('z1',P(0,0,1),10)
 ]};
 const r=clear({point:P(5,5,10),solid:cube,observerDirection:P(0,0,1)});
 assert.equal(r.status,'certified-clear');
 assert.equal(r.positiveOpenRayClearVerified,true);
 assert.equal(r.sourceEndpointJoinVerified,false);
 const near=clear({point:P(5,5,0),solid:cube,observerDirection:P(0,0,1)});
 assert.equal(near.status,'undetermined');
});
test('no arbitrary scene-level certificate follows from a local point ray',()=>{
 const v=clear({point:P(0,0,0),observerDirection:P(-1,0,1),solid});
 assert.equal(v.projectedJunctionVisibleVerified,false);
 assert.equal(v.constructionIntentVerified,false);
 assert.equal(v.officialLineStyleVerified,false);
 assert.equal(v.v5Ready,false);
});
