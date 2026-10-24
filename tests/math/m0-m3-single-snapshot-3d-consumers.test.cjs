'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {normalizePlane,intersectFiniteSegmentPlane,intersectCylinderSidePlane}=
 require('../../engines/spatial/sections/axis-cylinder-plane.cjs');
const {prismPlaneSection,snapshotBox}=
 require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {classifyPrismSectionVisibility:visibility}=
 require('../../engines/spatial/sections/rectangular-prism-cut-visibility.cjs');
const P=(x,y,z)=>({x,y,z});
const horizontal=()=>({point:P(0,0,5),normal:P(0,0,1)});
function flip(obj,key,first,next){
 let reads=0;
 Object.defineProperty(obj,key,{enumerable:true,configurable:true,
  get(){return ++reads===1?first:next;}});
 return ()=>reads;
}
test('real M3 plane and finite segment consumer use a single validated model-mm snapshot',()=>{
 const plane=horizontal(),segment={a:P(0,0,0),b:P(0,0,20)};
 const observed=[
  flip(plane.point,'z',5,100),
  flip(plane.normal,'z',1,-1),
  flip(segment.a,'z',0,Infinity),
  flip(segment.b,'z',20,-20),
  flip(segment,'a',segment.a,P(200,200,200))
 ];
 const result=intersectFiniteSegmentPlane(segment,plane);
 assert.equal(result.status,'intersect');
 assert.equal(result.parameter,.25);
 assert.deepEqual(result.point,P(0,0,5));
 assert.equal(result.residualMm,0);
 assert.deepEqual(result.projection.V,{u:0,v:5});
 assert.deepEqual(result.projection.H,{u:0,v:0});
 assert.deepEqual(result.projection.W,{u:0,v:5});
 assert.equal(result.globallyUnique,null);
 assert.deepEqual(observed.map(f=>f()),[1,1,1,1,1]);
});
test('normalization cannot change plane direction after validating initial finite normal',()=>{
 const plane=horizontal(),reads=[
  flip(plane.normal,'x',0,Infinity),
  flip(plane.normal,'z',1,0),
  flip(plane.point,'z',5,-500)
 ];
 const result=normalizePlane(plane);
 assert.deepEqual(result.point,P(0,0,5));
 assert.deepEqual(result.normal,P(0,0,1));
 assert.deepEqual(reads.map(f=>f()),[1,1,1]);
});
test('real M3 cylinder lateral section uses exactly the validated center/radius/height and plane',()=>{
 const cylinder={baseCenter:P(2,-3,0),radiusMm:5,heightMm:30};
 const plane={point:P(0,0,15),normal:P(0,0,1)};
 const observed=[
  flip(cylinder.baseCenter,'x',2,Infinity),
  flip(cylinder,'baseCenter',cylinder.baseCenter,P(99,99,99)),
  flip(cylinder,'radiusMm',5,-1),
  flip(cylinder,'heightMm',30,Infinity),
  flip(plane.point,'z',15,-15),
  flip(plane.normal,'z',1,-1)
 ];
 const result=intersectCylinderSidePlane(cylinder,plane,{samples:32});
 assert.equal(result.status,'ready');
 assert.equal(result.analyticCurveVerified,true);
 assert.equal(result.curveKind,'circle');
 assert.equal(result.points.length,33);
 assert.equal(result.globallyUnique,null);
 for(const q of result.points){
  assert.ok(Math.abs(Math.hypot(q.x-2,q.y+3)-5)<1e-8);
  assert.ok(Math.abs(q.z-15)<1e-8);
 }
 assert.deepEqual(observed.map(f=>f()),[1,1,1,1,1,1]);
});
test('real M3 prism horizontal section uses one rectangle and analytic area/perimeter',()=>{
 const box={min:P(0,0,0),max:P(10,8,10)};
 const plane=horizontal();
 const observed=[
  flip(box.min,'x',0,Infinity),
  flip(box.max,'x',10,-10),
  flip(box,'min',box.min,P(200,200,200)),
  flip(box,'max',box.max,P(-1,-1,-1)),
  flip(plane.point,'z',5,100),
  flip(plane.normal,'z',1,-1)
 ];
 const result=prismPlaneSection(box,plane);
 assert.equal(result.status,'ready');
 assert.equal(result.verified,true);
 assert.equal(result.vertices.length,4);
 assert.equal(result.areaMm2,80);
 assert.equal(result.perimeterMm,36);
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.v5StepsReady,false);
 assert.ok(result.vertices.every(v=>v.point.z===5));
 assert.deepEqual(observed.map(f=>f()),[1,1,1,1,1,1]);
});
test('one consistent prism source passes BOTH M3 topology and local open-ray visibility',()=>{
 const box={min:P(0,0,0),max:P(10,8,10)},plane=horizontal();
 const observer=P(0,0,1);
 const observed=[
  flip(box.min,'z',0,Infinity),
  flip(box.max,'x',10,-10),
  flip(box,'min',box.min,P(999,999,999)),
  flip(box,'max',box.max,P(0,0,0)),
  flip(plane.point,'z',5,100),
  flip(plane.normal,'z',1,-1),
  flip(observer,'z',1,-1)
 ];
 const result=visibility(box,plane,{
  retainedHalfspace:'negative',observerDirection:observer
 });
 assert.equal(result.status,'ready');
 assert.equal(result.sourcePerimeterVerified,true);
 assert.equal(result.totalEdges,4);
 assert.equal(result.counts.visible,4);
 assert.equal(result.counts.hidden,0);
 assert.equal(result.edgeInteriorsVerified,true);
 assert.equal(result.standardViewMappingVerified,false);
 assert.equal(result.v5LineStylesReady,false);
 assert.equal(result.boundaryEndpointsVerified,false);
 assert.deepEqual(observed.map(f=>f()),[1,1,1,1,1,1,1]);
});
test('invalid first reads, zero-sized mm solids and failed precision remain fail closed',()=>{
 const q=horizontal();const n=flip(q.normal,'z',Infinity,1);
 assert.throws(()=>normalizePlane(q),TypeError);assert.equal(n(),1);
 const box={min:P(0,0,0),max:P(10,8,10)};
 const read=flip(box.min,'x',Infinity,0);
 assert.throws(()=>snapshotBox(box),TypeError);assert.equal(read(),1);
 assert.throws(()=>prismPlaneSection(
  {min:P(0,0,0),max:P(1e-9,5,5)},horizontal()),/positive mm extents/);
 assert.throws(()=>intersectCylinderSidePlane(
  {baseCenter:P(0,0,0),radiusMm:0,heightMm:30},horizontal()),TypeError);
 assert.throws(()=>intersectFiniteSegmentPlane(
  {a:P(0,0,5),b:P(0,0,5)},horizontal()),/degenerate segment/);
});
