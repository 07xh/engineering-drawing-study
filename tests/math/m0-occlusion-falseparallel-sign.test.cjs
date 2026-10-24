'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {certifyConvexSegmentOcclusion:occlusion}=
 require('../../core/numeric/convex-segment-occlusion.cjs');
const {certifyDotSign}=require('../../core/numeric/euclidean-kernel.cjs');
const P=(x,y,z)=>({x,y,z});
const H=(id,normal,offsetMm)=>({id,normal,offsetMm});
const source={id:'s',from:P(0,0,0),to:P(0,1,0)};
const solid={id:'bounded',halfspaces:[
 H('diagonal',P(1,1,1),-2),
 H('xmin',P(-1,0,0),100),H('xmax',P(1,0,0),100),
 H('ymin',P(0,-1,0),100),H('ymax',P(0,1,0),100),
 H('zmin',P(0,0,-1),100),H('zmax',P(0,0,1),100)
]};
test('M0 rounded-zero but exact negative slope never becomes depth-independent evidence',()=>{
 const d=[-1,-(2**-54),1],n=[1,1,1];
 const nl=Math.hypot(...n),dl=Math.hypot(...d);
 const a=n.map(v=>v/nl),b=d.map(v=>v/dl);
 assert.equal(a.reduce((s,x,i)=>s+x*b[i],0),0);
 assert.equal(certifyDotSign(a,b).sign,-1);
 const r=occlusion({source,solid,observerDirection:P(...d)});
 assert.equal(r.status,'undetermined');
 assert.equal(r.reason,'rounded-zero-near-parallel-support');
 assert.equal(r.occlusionComplete,false);
 assert.equal(r.officialLineStyleVerified,false);
 assert.equal(r.v5Verified,false);
});
test('true exact parallel outside support retains known no-strict-hit',()=>{
 const r=occlusion({source,solid,observerDirection:P(-1,0,1)});
 assert.equal(r.status,'no-strict-hit');
 assert.equal(r.officialLineStyleVerified,false);
});
test('ordinary axis-aligned box ray maintains strictly positive interior occlusion',()=>{
 const cube={id:'cube',halfspaces:[
  H('x0',P(-1,0,0),0),H('x1',P(1,0,0),10),
  H('y0',P(0,-1,0),0),H('y1',P(0,1,0),10),
  H('z0',P(0,0,-1),-2),H('z1',P(0,0,1),4)
 ]};
 const r=occlusion({source:{id:'across',from:P(-5,5,0),to:P(15,5,0)},
  solid:cube,observerDirection:P(0,0,1)});
 assert.equal(r.status,'certified-open-interval');
 assert.ok(r.openSourceParameterRange[0]<.3);
 assert.ok(r.openSourceParameterRange[1]>.7);
 assert.equal(r.sourceEndpointsVerified,false);
 assert.equal(r.officialLineStyleVerified,false);
});
test('invalid source and zero observer direction remain fail-closed',()=>{
 assert.throws(()=>occlusion({source:{id:'broken',from:source.from,to:source.from},
  solid,observerDirection:P(1,0,0)}),RangeError);
 assert.throws(()=>occlusion({source,solid,observerDirection:P(0,0,0)}),RangeError);
});
