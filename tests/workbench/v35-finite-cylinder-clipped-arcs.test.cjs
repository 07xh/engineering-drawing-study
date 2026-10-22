'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {finiteCylinderLateralArcs:solve}=
 require('../../engines/spatial/sections/finite-cylinder-lateral-arcs.cjs');
const p=(x,y,z)=>({x,y,z});
const cylinder=(r=5,h=30,baseCenter=p(0,0,0))=>
 ({radiusMm:r,heightMm:h,baseCenter});
const plane=(point,normal)=>({point,normal});
const tilted=z=>plane(p(0,0,z),p(1,0,1));
const horizontal=z=>plane(p(0,0,z),p(0,0,1));
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<=t,
 String(a)+' != '+String(b));
test('04 clipped bottom section resolves true analytic cap intersection roots and side arcs',()=>{
 const r=solve(cylinder(),tilted(3));
 assert.equal(r.status,'clipped-lateral');
 assert.equal(r.verified,true);assert.equal(r.analyticalLateralVerified,true);
 assert.equal(r.completeSolidIntersectionVerified,false);
 assert.equal(r.requiresCapFaceTopology,true);
 assert.equal(r.globallyUnique,null);
 assert.equal(r.arcs.length,1);
 const a=r.arcs[0];assert.equal(a.endpoints.firstCap,'bottom');
 assert.equal(a.endpoints.lastCap,'bottom');
 near(a.endpoints.first.z,0);near(a.endpoints.last.z,0);
 near(a.endpoints.first.x,3);near(a.endpoints.last.x,3);
 near(r.totalAngularSpanRadians,2*Math.PI-2*Math.acos(3/5));
 for(const q of a.samples){
  near(q.x*q.x+q.y*q.y,25);
  near(q.x+q.z,3);
  assert.ok(q.z>=-1e-7&&q.z<=30+1e-7);
 }
 assert.ok(r.maxResidualMm<1e-7);
});
test('04 top-clipped side can cross theta=0 without falsely dropping either interval',()=>{
 const r=solve(cylinder(),tilted(27));
 assert.equal(r.status,'clipped-lateral');assert.equal(r.arcs.length,2);
 near(r.totalAngularSpanRadians,2*Math.acos(-3/5));
 assert.equal(r.arcs[0].endpoints.lastCap,'top');
 assert.equal(r.arcs[1].endpoints.firstCap,'top');
 for(const arc of r.arcs)for(const q of arc.samples){
  assert.ok(q.z>=0&&q.z<=30+1e-7);
  near(q.x+q.z,27);
 }
});
test('04 both finite cylinder caps clip a steep plane into two actual side arc ranges',()=>{
 const r=solve(cylinder(5,8),tilted(4));
 assert.equal(r.status,'clipped-lateral');
 assert.equal(r.arcs.length,2);
 assert.ok(r.polarRootAngles.length>=4);
 const capTypes=r.arcs.flatMap(a=>[a.endpoints.firstCap,a.endpoints.lastCap]);
 assert.ok(capTypes.includes('bottom'));assert.ok(capTypes.includes('top'));
 for(const a of r.arcs)for(const q of a.samples)
  assert.ok(q.z>=-1e-7&&q.z<=8+1e-7);
});
test('04 complete finite oblique cut remains closed analytical lateral range',()=>{
 const r=solve(cylinder(),tilted(15));
 assert.equal(r.status,'complete-lateral');
 assert.equal(r.sourceStatus,'ready');
 assert.equal(r.arcs.length,1);
 near(r.totalAngularSpanRadians,2*Math.PI);
 assert.ok(r.arcs[0].samples.length>=65);
 assert.equal(r.completeSolidIntersectionVerified,false);
 assert.equal(r.sampledPolylineOnly,true);
});
test('04 horizontal section is a complete circle and preserves true model elevations',()=>{
 const r=solve(cylinder(),horizontal(15),{samplesPerTurn:32});
 assert.equal(r.status,'complete-lateral');
 assert.equal(r.arcs.length,1);
 assert.equal(r.arcs[0].samples.length,33);
 r.arcs[0].samples.forEach(q=>near(q.z,15));
});
test('04 top and bottom tangent-only cases never invent a positive-length side arc',()=>{
 const bottom=solve(cylinder(),tilted(-5));
 assert.equal(bottom.status,'blocked');
 assert.equal(bottom.verified,false);
 assert.deepEqual(bottom.arcs,[]);
 const top=solve(cylinder(),tilted(35));
 assert.equal(top.status,'blocked');
 assert.equal(top.verified,false);
 assert.deepEqual(top.arcs,[]);
});
test('04 near-vertical and exact vertical generators need a separate proven solver',()=>{
 const nearVertical=solve(cylinder(),plane(p(0,0,15),p(1,0,1e-12)));
 assert.equal(nearVertical.status,'blocked');
 const vertical=solve(cylinder(),plane(p(2,0,0),p(1,0,0)));
 assert.equal(vertical.status,'blocked');
 assert.equal(vertical.verified,false);
});
test('04 nonintersecting or degenerate geometry cannot claim valid clipped arcs',()=>{
 const none=solve(cylinder(),horizontal(-10));
 assert.equal(none.status,'blocked');
 assert.equal(none.arcs.length,0);
 assert.throws(()=>solve(cylinder(0),tilted(15)),/positive radius/);
 assert.throws(()=>solve(cylinder(),plane(p(0,0,0),p(0,0,0))),/degenerate/);
});
test('04 conservative screen polyline error bound shrinks with finer real sampling',()=>{
 const coarse=solve(cylinder(),tilted(3),{samplesPerTurn:16});
 const fine=solve(cylinder(),tilted(3),{samplesPerTurn:256});
 assert.equal(coarse.status,'clipped-lateral');
 assert.equal(fine.status,'clipped-lateral');
 assert.ok(fine.chordErrorUpperBoundMm<coarse.chordErrorUpperBoundMm);
 assert.ok(fine.pointsCount>coarse.pointsCount);
 assert.ok(coarse.chordErrorUpperBoundMm>0);
});
test('04 clipped segment endpoint projections have the same genuine 3D point in all three views',()=>{
 const result=solve(cylinder(),tilted(3),{samplesPerTurn:32});
 for(const a of result.arcs)
  for(let i=0;i<a.samples.length;i++){
   const q=a.samples[i],proj=a.projections[i];
   assert.deepEqual(proj,{
    V:{u:q.x,v:q.z},H:{u:q.x,v:q.y},W:{u:q.y,v:q.z}
   });
  }
});
test('04 translated cylinder and normalized plane direction give same physical clipped arcs',()=>{
 const c=cylinder(5,30,p(10,-5,2));
 const original=solve(c,plane(p(10,-5,5),p(1,0,1)));
 const equivalent=solve(c,plane(p(10,-5,5),p(20,0,20)));
 assert.equal(original.status,'clipped-lateral');
 assert.equal(original.arcs.length,equivalent.arcs.length);
 for(let i=0;i<original.arcs.length;i++){
  const x=original.arcs[i],y=equivalent.arcs[i];
  near(x.angularInterval[0],y.angularInterval[0]);
  near(x.angularInterval[1],y.angularInterval[1]);
  for(let j=0;j<x.samples.length;j++){
   near(x.samples[j].x,y.samples[j].x);
   near(x.samples[j].y,y.samples[j].y);
   near(x.samples[j].z,y.samples[j].z);
  }
 }
});
test('04 rejects unbounded sample settings and never mutates source parameters',()=>{
 const c=cylinder(),pl=tilted(3),oldC=structuredClone(c),oldP=structuredClone(pl);
 for(const count of [0,15,17,257,0.5,'64',NaN])
  assert.throws(()=>solve(c,pl,{samplesPerTurn:count}),/samplesPerTurn/);
 const a=solve(c,pl),b=solve(structuredClone(c),structuredClone(pl));
 assert.deepEqual(a,b);assert.deepEqual(c,oldC);assert.deepEqual(pl,oldP);
});
