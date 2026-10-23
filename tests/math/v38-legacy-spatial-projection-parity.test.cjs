'use strict';
// 00 migration guard: compare unmodified 04 actual solver outputs against
// the shared mathematical first-angle projection. This is a compatibility
// baseline, NOT a new geometry algorithm or any visibility proof.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../../core/projection/conventions.js');
const {intersectCylinderSidePlane}=require('../../engines/spatial/sections/axis-cylinder-plane.cjs');
const {prismPlaneSection}=require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {pyramidPlaneSection}=require('../../engines/spatial/sections/rectangular-pyramid-plane.cjs');
const p=(x,y,z)=>({x,y,z});
const plane=(point,normal)=>({point,normal});
const pr=point=>P.project(point);

test('unmodified cylinder analytic samples exactly match the shared V/H/W projection',()=>{
 const result=intersectCylinderSidePlane(
  {baseCenter:p(0,0,0),radiusMm:5,heightMm:30},
  plane(p(0,0,15),p(1,0,1)),{samples:24});
 assert.equal(result.status,'ready');
 assert.equal(result.verified,true);
 assert.equal(result.points.length,result.projections.length);
 result.points.forEach((point,i)=>{
  assert.deepEqual(result.projections[i],pr(point));
  assert.ok(Math.abs(point.x+point.z-15)<1e-7);
 });
 assert.equal(result.globallyUnique,null);
});

test('unmodified prism six-vertex section shares model projection, without claiming sheet or visibility proof',()=>{
 const result=prismPlaneSection(
  {min:p(0,0,0),max:p(10,10,10)},
  plane(p(0,0,12),p(1,1,1)));
 assert.equal(result.status,'ready');
 assert.equal(result.edgeCount,6);
 result.vertices.forEach(vertex=>assert.deepEqual(vertex.projection,pr(vertex.point)));
 assert.equal(result.firstAngleConventionVerified,false);
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.globallyUnique,null);
});

test('unmodified pyramid five-vertex section shares model projection, not global uniqueness',()=>{
 const result=pyramidPlaneSection(
  {base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)},
  plane(p(0,0,15),p(1,1,1)));
 assert.equal(result.status,'ready');
 assert.equal(result.edgeCount,5);
 result.vertices.forEach(vertex=>assert.deepEqual(vertex.projection,pr(vertex.point)));
 assert.equal(result.firstAngleConventionSignedOff,false);
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.globallyUnique,null);
});

test('sheet-px remains an explicit invertible display transform, independent of all model geometry',()=>{
 const point=p(-7,23.5,4.25),views=pr(point);
 for(const scale of [0.5,2,17]){
  const frame={origin:{x:123.5,y:456.75},scale};
  for(const view of P.VIEWS){
   const px=P.toSheet(view,views[view],frame);
   const roundtrip=P.fromSheet(view,px,frame);
   assert.ok(Math.abs(roundtrip.u-views[view].u)<1e-9);
   assert.ok(Math.abs(roundtrip.v-views[view].v)<1e-9);
  }
  assert.deepEqual(pr(point),views);
 }
 assert.throws(()=>P.toSheet('V',views.V,{origin:{x:0,y:0},scale:0}));
});

test('legacy degenerate sections stay blocked, never magically become verified results',()=>{
 const prism=prismPlaneSection(
  {min:p(0,0,0),max:p(10,10,10)},
  plane(p(0,0,0),p(0,0,1)));
 const pyramid=pyramidPlaneSection(
  {base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)},
  plane(p(0,0,0),p(0,0,1)));
 const cylinder=intersectCylinderSidePlane(
  {baseCenter:p(0,0,0),radiusMm:5,heightMm:30},
  plane(p(0,0,15),p(1,0,1e-12)));
 assert.equal(prism.status,'boundary-degenerate');
 assert.equal(pyramid.status,'boundary-degenerate');
 assert.equal(cylinder.status,'undetermined');
 for(const r of [prism,pyramid,cylinder]){
  assert.equal(r.verified,false);
  assert.notEqual(r.globallyUnique,true);
 }
});
