'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizePlane,intersectFiniteSegmentPlane,intersectCylinderSidePlane}=
 require('../../engines/spatial/sections/axis-cylinder-plane.cjs');
const p=(x,y,z)=>({x,y,z});
const cylinder=(r=5,h=30,base=p(0,0,0))=>({baseCenter:base,radiusMm:r,heightMm:h});
const plane=(point,normal)=>({point,normal});
const horizontal=z=>plane(p(0,0,z),p(0,0,1));
const tilted=z=>plane(p(0,0,z),p(1,0,1));
const vertical=x=>plane(p(x,0,0),p(1,0,0));
const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<=e,String(a)+' not near '+String(b));
test('04-A finite line/plane unique intersection has correct parameter, projection and residual',()=>{
 const s={a:p(-1,3,-5),b:p(1,3,5)};
 const r=intersectFiniteSegmentPlane(s,horizontal(0));
 assert.equal(r.status,'intersect');near(r.parameter,.5);
 near(r.point.x,0);near(r.point.y,3);near(r.point.z,0);
 assert.equal(r.projection.V.u,0);assert.equal(r.projection.H.v,3);
 near(r.residualMm,0);assert.deepEqual(s.a,p(-1,3,-5));
});
test('04-A finite segment parallel, coincident and beyond endpoint remain distinct',()=>{
 const a=intersectFiniteSegmentPlane({a:p(0,0,2),b:p(5,0,2)},horizontal(0));
 assert.equal(a.status,'parallel');assert.equal(a.point,null);
 const b=intersectFiniteSegmentPlane({a:p(0,0,0),b:p(5,0,0)},horizontal(0));
 assert.equal(b.status,'coincident');assert.equal(b.solutionSet,'continuous-segment');
 const c=intersectFiniteSegmentPlane({a:p(0,0,2),b:p(0,0,3)},horizontal(0));
 assert.equal(c.status,'outside-segment');assert.equal(c.point,null);
});
test('04-A finite segment touching its endpoint is one valid point',()=>{
 const r=intersectFiniteSegmentPlane({a:p(1,2,0),b:p(1,2,4)},horizontal(0));
 assert.equal(r.status,'intersect');near(r.parameter,0);near(r.point.z,0);
});
test('04-A degenerate normals and zero-length finite edges throw rather than return imaginary solutions',()=>{
 assert.throws(()=>normalizePlane(plane(p(0,0,0),p(0,0,0))),/degenerate/);
 assert.throws(()=>intersectFiniteSegmentPlane({a:p(1,1,1),b:p(1,1,1)},horizontal(0)),/degenerate/);
 assert.throws(()=>intersectFiniteSegmentPlane(null,horizontal(0)),/finite segment/);
});
test('04-B genuine slanted cylinder cut is analytically closed ellipse with independent surface residuals',()=>{
 const c=cylinder(),r=intersectCylinderSidePlane(c,tilted(15));
 assert.equal(r.status,'ready');assert.equal(r.curveKind,'ellipse');
 assert.equal(r.geometryKind,'closed-lateral-plane-section');
 assert.equal(r.verified,true);assert.equal(r.analyticCurveVerified,true);
 assert.equal(r.sampledPolylineOnly,true);
 assert.equal(r.completeLateralIntersection,true);
 assert.equal(r.requiresSolidCapAnalysis,false);
 assert.equal(r.closedCurve,true);assert.equal(r.globallyUnique,null);
 near(r.analytic.zRange.min,10);near(r.analytic.zRange.max,20);
 assert.equal(r.points.length,65);
 near(r.points[0].x,5);near(r.points[0].y,0);near(r.points[0].z,10);
 near(r.points[16].x,0);near(r.points[16].z,15);
 near(r.points[32].x,-5);near(r.points[32].z,20);
 for(const pt of r.points){
  near(pt.x*pt.x+pt.y*pt.y,25,1e-7);
  near(pt.x+pt.z,15,1e-7);
  assert.ok(pt.z>=0&&pt.z<=30);
 }
 assert.ok(r.maxResidualMm<=1e-8);
 assert.deepEqual(r.projections[0],{V:{u:5,v:10},H:{u:5,v:0},W:{u:0,v:10}});
 near(r.points.at(-1).x,r.points[0].x);
 near(r.points.at(-1).y,r.points[0].y);
 near(r.points.at(-1).z,r.points[0].z);
});
test('04-B horizontal plane yields true circular lateral cross-section at set elevation',()=>{
 const r=intersectCylinderSidePlane(cylinder(),horizontal(15),{samples:32});
 assert.equal(r.status,'ready');assert.equal(r.curveKind,'circle');
 assert.equal(r.points.length,33);
 for(const q of r.points)near(q.z,15);
 assert.ok(r.projections.every(q=>q.V.v===15&&q.W.v===15));
});
test('04-B true vertical secant plane yields two verified line generators, not invented ellipse',()=>{
 const r=intersectCylinderSidePlane(cylinder(),vertical(2));
 assert.equal(r.status,'two-generators');assert.equal(r.verified,true);
 assert.equal(r.generators.length,2);assert.equal(r.closedCurve,false);
 assert.equal(r.completeLateralIntersection,true);
 assert.equal(r.requiresSolidCapAnalysis,true);
 assert.equal(r.points.length,0);
 for(const g of r.generators){
  near(g.a.x,2);near(g.b.x,2);near(g.a.z,0);near(g.b.z,30);
  near(g.a.x*g.a.x+g.a.y*g.a.y,25);near(g.residualMm,0);
 }
});
test('04-B tangential vertical plane produces one generator, a disjoint plane produces none',()=>{
 const tangent=intersectCylinderSidePlane(cylinder(),vertical(5));
 assert.equal(tangent.status,'tangent-generator');
 assert.equal(tangent.generators.length,1);
 near(tangent.generators[0].a.x,5);near(tangent.generators[0].a.y,0);
 const disjoint=intersectCylinderSidePlane(cylinder(),vertical(6));
 assert.equal(disjoint.status,'none');assert.deepEqual(disjoint.points,[]);
});
test('04-B a slanted plane clipping the finite cylinder caps is not misrepresented as closed ellipse',()=>{
 const r=intersectCylinderSidePlane(cylinder(),tilted(3));
 assert.equal(r.status,'clipped');
 assert.equal(r.verified,false);assert.equal(r.requiresSolidCapAnalysis,true);
 assert.deepEqual(r.points,[]);near(r.zRange.min,-2);near(r.zRange.max,8);
});
test('04-B fully nonintersecting horizontal plane has no lateral intersection',()=>{
 const r=intersectCylinderSidePlane(cylinder(),horizontal(-4));
 assert.equal(r.status,'none');assert.equal(r.verified,false);
 assert.deepEqual(r.points,[]);
});
test('04-B near-vertical plane is explicitly undetermined until numerically stable solver exists',()=>{
 const r=intersectCylinderSidePlane(cylinder(),plane(p(0,0,15),p(1,0,1e-12)));
 assert.equal(r.status,'undetermined');assert.equal(r.verified,false);
 assert.deepEqual(r.points,[]);
});
test('04-B translation, positive rescaling of normal, and XY-axis rotation preserve geometric validity',()=>{
 const moved=cylinder(10,60,p(10,-7,3));
 const pl=plane(p(10,-7,33),p(0,2,2));
 const r=intersectCylinderSidePlane(moved,pl,{samples:48});
 assert.equal(r.status,'ready');near(r.analytic.center.z,33);
 near(r.analytic.zRange.min,23);near(r.analytic.zRange.max,43);
 near(r.points[0].x,20);near(r.points[0].y,-7);near(r.points[0].z,33);
 near(r.points[12].y,3);near(r.points[12].z,23);
 const scaled=intersectCylinderSidePlane(moved,
  plane(p(10,-7,33),p(0,20,20)),{samples:48});
 near(scaled.maxResidualMm,0);
 for(let i=0;i<r.points.length;i++){
  const a=[r.points[i].x,r.points[i].y,r.points[i].z];
  const b=[scaled.points[i].x,scaled.points[i].y,scaled.points[i].z];
  a.forEach((n,k)=>near(n,b[k],1e-9));
 }
});
test('04-B all side samples correspond to V, H and W model projection coordinates',()=>{
 const r=intersectCylinderSidePlane(cylinder(),tilted(15),{samples:24});
 assert.equal(r.projections.length,r.points.length);
 r.points.forEach((q,i)=>{
  assert.deepEqual(r.projections[i],{
   V:{u:q.x,v:q.z},H:{u:q.x,v:q.y},W:{u:q.y,v:q.z}
  });
 });
});
test('04-B rejects invalid metric primitives, extreme input and fake sample counts',()=>{
 assert.throws(()=>intersectCylinderSidePlane(cylinder(0),tilted(15)),/positive radius/);
 assert.throws(()=>intersectCylinderSidePlane(cylinder(-5),tilted(15)),/positive radius/);
 assert.throws(()=>intersectCylinderSidePlane(cylinder(5,0),tilted(15)),/positive radius/);
 assert.throws(()=>intersectCylinderSidePlane(cylinder(),plane(p(0,0,0),p(0,0,0))),/degenerate/);
 for(const samples of [0,15,257,1.5,NaN,'64'])
  assert.throws(()=>intersectCylinderSidePlane(cylinder(),tilted(15),{samples}),/16..256/);
});
