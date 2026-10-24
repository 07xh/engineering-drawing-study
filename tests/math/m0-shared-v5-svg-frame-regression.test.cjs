'use strict';
/**
 * Independent M5 regressions: share only SVG serialization, NEVER promote
 * finite M3 sections into certified line types or additional V5 timelines.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const {formatFrameNumber,escapeFrameAttribute}=
 require('../../engines/spatial/sections/shared-v5-frame-svg-safety.cjs');
const {prismPlaneSection}=
 require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {pyramidPlaneSection}=
 require('../../engines/spatial/sections/rectangular-pyramid-plane.cjs');
const {intersectCylinderSidePlane}=
 require('../../engines/spatial/sections/axis-cylinder-plane.cjs');
const P=(x,y,z)=>({x,y,z});
const cut={point:P(0,0,5),normal:P(0,0,1)};
test('three legacy SVG serializers retain decimal rounding and coordinate bounds',()=>{
 for(const n of [0,-0,1e-9,-1e-9,0.00000051,-0.00000051,
  1.23456789,-19.87654321,299.99999999,999999999.999999,1e9,-1e9]){
  const oracle=String(Number(n.toFixed(6)));
  for(const errorMessage of ['invalid SVG coordinate','unsafe SVG coordinate',
    'unsafe pyramid SVG value'])
   assert.equal(formatFrameNumber(n,errorMessage),oracle);
  assert.ok(Math.abs(Number(formatFrameNumber(n))-n)<=1e-6);
 }
 for(const bad of [NaN,Infinity,-Infinity,1e9+1,-1e9-1,
  '1',null,{},1n]){
  for(const message of ['invalid SVG coordinate','unsafe SVG coordinate',
   'unsafe pyramid SVG value'])
   assert.throws(()=>formatFrameNumber(bad,message),
    e=>e instanceof RangeError&&e.message===message);
 }
});
test('SVG attributes are safely escaped, including adversarial metadata',()=>{
 assert.equal(escapeFrameAttribute('&<>"\''),'&amp;&lt;&gt;&quot;&apos;');
 assert.equal(escapeFrameAttribute('section-edge-03'), 'section-edge-03');
 assert.equal(escapeFrameAttribute('<svg onload="x">&'),
  '&lt;svg onload=&quot;x&quot;&gt;&amp;');
});
test('independent 04/M3 finite geometry stays analytic with no official V5 promotion',()=>{
 const prism=prismPlaneSection({min:P(0,0,0),max:P(10,8,15)},cut);
 const pyramid=pyramidPlaneSection({
  base:{minX:0,minY:0,maxX:10,maxY:8,z:0},
  apex:P(5,4,15)
 },cut);
 const cylinder=intersectCylinderSidePlane({
  baseCenter:P(0,0,0),radiusMm:4,heightMm:15
 },cut,{samples:32});
 for(const poly of [prism,pyramid]){
  assert.equal(poly.status,'ready');
  assert.equal(poly.perimeterVerified,true);
  assert.equal(poly.visibilityVerified,false);
  assert.equal(poly.v5StepsReady,false);
  assert.ok(poly.vertices.every(v=>Math.abs(v.point.z-5)<1e-8));
 }
 assert.equal(prism.vertices.length,4);
 assert.ok(Math.abs(prism.areaMm2-80)<1e-8);
 assert.ok(Math.abs(prism.perimeterMm-36)<1e-8);
 assert.equal(pyramid.vertices.length,4);
 assert.ok(Math.abs(pyramid.areaMm2-320/9)<1e-7);
 assert.ok(Math.abs(pyramid.perimeterMm-24)<1e-7);
 assert.equal(cylinder.status,'ready');
 assert.equal(cylinder.analyticCurveVerified,true);
 assert.equal(cylinder.requiresSolidCapAnalysis,false);
 assert.equal(cylinder.sampledPolylineOnly,true);
 assert.ok(cylinder.points.every(p=>Math.abs(p.z-5)<1e-8&&
  Math.abs(p.x*p.x+p.y*p.y-16)<1e-8));
});
test('apex and coplanar box face counterexamples keep official V5 blocked',()=>{
 const prism=prismPlaneSection({min:P(0,0,0),max:P(10,8,15)},{
  point:P(0,0,0),normal:P(0,0,1)
 });
 const pyramid=pyramidPlaneSection({
  base:{minX:0,minY:0,maxX:10,maxY:8,z:0},
  apex:P(5,4,15)
 },{point:P(5,4,15),normal:P(0,0,1)});
 for(const r of [prism,pyramid]){
  assert.equal(r.status,'boundary-degenerate');
  assert.equal(r.verified,false);
  assert.equal(r.v5StepsReady,false);
 }
});
