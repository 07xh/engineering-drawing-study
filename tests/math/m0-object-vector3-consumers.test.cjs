'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const math=require('../../core/numeric/object-vector3.cjs');
const {prismPlaneSection}=require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {pyramidPlaneSection}=require('../../engines/spatial/sections/rectangular-pyramid-plane.cjs');
const {intersectCylinderSidePlane,intersectFiniteSegmentPlane}=
 require('../../engines/spatial/sections/axis-cylinder-plane.cjs');
const P=(x,y,z)=>({x,y,z});
const plane=(z,k=1)=>({point:P(0,0,z),normal:P(0,0,k)});
test('one M0 kernel handles object-shaped sub/dot/cross/norm with no unit conversion',()=>{
 assert.deepEqual(math.modelVector3(P(2,3,4)),[2,3,4]);
 assert.deepEqual(math.subtractObject3(P(4,5,6),P(1,2,3)),P(3,3,3));
 assert.equal(math.dotObject3(P(3,4,0),P(4,-3,0)),0);
 assert.deepEqual(math.crossObject3(P(1,0,0),P(0,1,0)),P(0,0,1));
 assert.equal(math.normObject3(P(3,4,0)),5);
});
test('independent array-kernel parity for generic finite 3D arithmetic',()=>{
 const kernel=require('../../core/numeric/euclidean-kernel.cjs');
 for(const [a,b] of [
  [P(1,2,3),P(4,5,6)],
  [P(-11,22,-33),P(5,6,-7)],
  [P(0,1e-20,7),P(2,0,1)],
  [P(100000,200000,300000),P(400,500,600)]
 ]){
  const x=[a.x,a.y,a.z],y=[b.x,b.y,b.z];
  const s=kernel.subtract(x,y),c=kernel.cross3(x,y);
  assert.deepEqual(math.subtractObject3(a,b),P(...s));
  assert.deepEqual(math.crossObject3(a,b),P(...c));
  assert.equal(math.dotObject3(a,b),kernel.dot(x,y));
  assert.equal(math.normObject3(a),kernel.norm(x));
 }
});
test('invalid source coordinates or numerical loss cannot silently become geometry evidence',()=>{
 for(const bad of [null,[],{x:1,y:2},{x:1,y:2,z:Infinity},
   {x:1,y:2,z:NaN},Object.create(P(1,2,3))]){
  assert.throws(()=>math.modelVector3(bad));
 }
 assert.throws(()=>math.dotObject3(P(1e-200,0,0),P(1e-200,0,0)),/underflow/);
 assert.throws(()=>math.crossObject3(P(1e308,0,0),P(0,1e308,0)),RangeError);
 assert.throws(()=>math.subtractObject3(P(1e308,0,0),P(-1e308,0,0)),RangeError);
});
test('04 prism original independent horizontal section, area/perimeter and V/H/W remain stable',()=>{
 const a={min:P(0,0,0),max:P(10,10,10)};
 const r=prismPlaneSection(a,plane(5));
 assert.equal(r.status,'ready');assert.equal(r.verified,true);
 assert.equal(r.vertices.length,4);assert.equal(r.areaMm2,100);
 assert.equal(r.perimeterMm,40);assert.equal(r.visibilityVerified,false);
 for(const v of r.vertices){
  assert.equal(v.point.z,5);
  assert.deepEqual(v.projection.V,{u:v.point.x,v:5});
  assert.deepEqual(v.projection.H,{u:v.point.x,v:v.point.y});
  assert.deepEqual(v.projection.W,{u:v.point.y,v:5});
 }
 const scaled=prismPlaneSection(a,plane(5,7));
 assert.equal(scaled.status,'ready');assert.equal(scaled.areaMm2,100);
 assert.equal(prismPlaneSection(a,plane(30)).status,'none');
});
test('04 pyramid horizontal mid-height section keeps analytic topology and proof limits',()=>{
 const a={base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:P(5,5,10)};
 const r=pyramidPlaneSection(a,plane(5));
 assert.equal(r.status,'ready');assert.equal(r.verified,true);
 assert.equal(r.vertices.length,4);assert.ok(Math.abs(r.areaMm2-25)<1e-9);
 assert.ok(Math.abs(r.perimeterMm-20)<1e-9);
 assert.equal(r.v5StepsReady,false);assert.equal(r.visibilityVerified,false);
 assert.equal(pyramidPlaneSection(a,plane(30)).status,'none');
});
test('04 cylinder side analytic circular section and finite segment intersection preserve evidence boundary',()=>{
 const c={baseCenter:P(2,-3,0),radiusMm:5,heightMm:30};
 const r=intersectCylinderSidePlane(c,plane(15),{samples:32});
 assert.equal(r.status,'ready');assert.equal(r.analyticCurveVerified,true);
 assert.equal(r.curveKind,'circle');assert.equal(r.points.length,33);
 assert.ok(r.maxResidualMm<1e-7);
 assert.equal(r.globallyUnique,null);
 const s=intersectFiniteSegmentPlane({a:P(0,0,0),b:P(0,0,20)},plane(5));
 assert.equal(s.status,'intersect');assert.equal(s.parameter,.25);
 assert.deepEqual(s.point,P(0,0,5));
 assert.equal(intersectFiniteSegmentPlane({a:P(0,0,0),b:P(0,0,2)},plane(5)).status,'outside-segment');
});
test('consumer normal and section degeneracy gates are preserved (not one universal EPS)',()=>{
 const box={min:P(0,0,0),max:P(10,10,10)};
 const py={base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:P(5,5,10)};
 assert.throws(()=>prismPlaneSection(box,plane(5,0)),/degenerate/);
 assert.throws(()=>pyramidPlaneSection(py,plane(5,0)),/degenerate/);
 assert.throws(()=>intersectCylinderSidePlane(
  {baseCenter:P(0,0,0),radiusMm:0,heightMm:10},plane(5)));
});

test('M0 object add/scale exactly delegates to one shared array kernel',()=>{
 const k=require('../../core/numeric/euclidean-kernel.cjs');
 for(const [a,b,t] of [
  [P(1,2,3),P(4,5,6),.5],
  [P(-100,17,0),P(0,-21,1),3],
  [P(1e-12,4,0),P(2,3,4),-2],
  [P(1e7,3e7,-2e7),P(10,20,30),.125]
 ]){
  const aa=[a.x,a.y,a.z],bb=[b.x,b.y,b.z];
  assert.deepEqual(math.addObject3(a,b),P(...k.add(aa,bb)));
  assert.deepEqual(math.scaleObject3(a,t),P(...k.scale(aa,t)));
 }
 assert.throws(()=>math.scaleObject3(P(1e-200,0,0),1e-200),/underflow/);
 assert.throws(()=>math.addObject3(P(1e308,0,0),P(1e308,0,0)),RangeError);
});
test('inclined prism and pyramid sections survive shared add/scale migration',()=>{
 const prism=prismPlaneSection({min:P(0,0,0),max:P(10,10,10)},
  {point:P(0,0,12),normal:P(1,1,1)});
 assert.equal(prism.status,'ready');assert.equal(prism.vertices.length,6);
 assert.ok(prism.areaMm2>0&&prism.perimeterMm>0);
 assert.equal(prism.v5StepsReady,false);
 const py=pyramidPlaneSection({
  base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:P(5,5,15)
 },{point:P(0,0,15),normal:P(1,1,1)});
 assert.equal(py.status,'ready');assert.equal(py.vertices.length,5);
 assert.ok(py.areaMm2>0&&py.perimeterMm>0);
 assert.equal(py.v5StepsReady,false);
});
