'use strict';
/** Independent M5 metamorphic oracles for existing M3 finite-section solvers.
 * These tests do NOT certify visibility, filled solid, 3D Intent or V5.
 * Keep the old domain solvers as the reference, without replacing them.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismPlaneSection}=require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {pyramidPlaneSection}=require('../../engines/spatial/sections/rectangular-pyramid-plane.cjs');
const {intersectCylinderSidePlane}=
 require('../../engines/spatial/sections/axis-cylinder-plane.cjs');
const P=(x,y,z)=>({x,y,z});
const plane=(point,normal)=>({point,normal});
const box={min:P(0,0,0),max:P(10,10,10)};
const pyramid={base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:P(5,5,15)};
const close=(a,b,eps=1e-6)=>assert.ok(Number.isFinite(a)&&
 Number.isFinite(b)&&Math.abs(a-b)<=eps,
 String(a)+' is not within '+eps+' of '+b);
const shift=(p,t)=>P(p.x+t.x,p.y+t.y,p.z+t.z);
const scaled=(p,k)=>P(p.x*k,p.y*k,p.z*k);
const translatedPrism=(b,t)=>({min:shift(b.min,t),max:shift(b.max,t)});
const translatedPyramid=(b,t)=>({base:{
 minX:b.base.minX+t.x,minY:b.base.minY+t.y,
 maxX:b.base.maxX+t.x,maxY:b.base.maxY+t.y,z:b.base.z+t.z
},apex:shift(b.apex,t)});
const scalePrism=(b,k)=>({min:scaled(b.min,k),max:scaled(b.max,k)});
const scalePyramid=(b,k)=>({base:{
 minX:b.base.minX*k,minY:b.base.minY*k,
 maxX:b.base.maxX*k,maxY:b.base.maxY*k,z:b.base.z*k
},apex:scaled(b.apex,k)});
function assertSameSection(a,b,{factor=1,offset=P(0,0,0)}={}){
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.equal(a.verified,true);assert.equal(b.verified,true);
 assert.equal(a.perimeterVerified,true);assert.equal(b.perimeterVerified,true);
 assert.equal(a.vertices.length,b.vertices.length);
 close(b.perimeterMm,a.perimeterMm*factor);
 close(b.areaMm2,a.areaMm2*factor*factor);
 // Compare unordered 3D vertices so sorting conventions cannot falsely
 // establish mathematical parity.
 const points=b.vertices.map(v=>v.point);
 for(const v of a.vertices){
  const target=shift(scaled(v.point,factor),offset);
  const index=points.findIndex(p=>Math.hypot(
   target.x-p.x,target.y-p.y,target.z-p.z)<1e-6);
  assert.ok(index>=0,'independently transformed section corner is missing');
  points.splice(index,1);
 }
 assert.equal(points.length,0);
 for(const result of [a,b]){
  assert.equal(result.visibilityVerified,false);
  assert.equal(result.v5StepsReady,false);
  assert.equal(result.globallyUnique,null);
  assert.equal(result.sectionInteriorVerified,false);
 }
}
test('04 prism oblique cut is invariant under positive plane-normal rescaling',()=>{
 const cut=plane(P(0,0,12),P(1,1,1));
 const a=prismPlaneSection(box,cut);
 const b=prismPlaneSection(box,plane(cut.point,P(7,7,7)));
 assertSameSection(a,b);
});
test('04 prism oblique cut transforms in model-mm, not sheet-px',()=>{
 const cut=plane(P(0,0,12),P(1,1,1)),a=prismPlaneSection(box,cut);
 const t=P(100,-70,25);
 assertSameSection(a,prismPlaneSection(translatedPrism(box,t),
  plane(shift(cut.point,t),cut.normal)),{offset:t});
 const k=2.5;
 assertSameSection(a,prismPlaneSection(scalePrism(box,k),
  plane(scaled(cut.point,k),cut.normal)),{factor:k});
});
test('04 pyramid oblique 5-corner cut keeps source geometry under translation',()=>{
 const cut=plane(P(0,0,15),P(1,1,1)),a=pyramidPlaneSection(pyramid,cut);
 assert.equal(a.vertices.length,5);
 const t=P(100,-70,25);
 const b=pyramidPlaneSection(translatedPyramid(pyramid,t),
  plane(shift(cut.point,t),cut.normal));
 assertSameSection(a,b,{offset:t});
});
test('04 pyramid 5-corner cut preserves dimensions under positive scaling',()=>{
 const cut=plane(P(0,0,15),P(1,1,1)),a=pyramidPlaneSection(pyramid,cut);
 const k=2.5;
 const b=pyramidPlaneSection(scalePyramid(pyramid,k),
  plane(scaled(cut.point,k),cut.normal));
 assertSameSection(a,b,{factor:k});
});
test('04 cylinder analytic lateral circle scales without claiming whole-solid proof',()=>{
 const cylinder={baseCenter:P(2,-3,0),radiusMm:5,heightMm:30};
 const cut=plane(P(0,0,15),P(0,0,1));
 const a=intersectCylinderSidePlane(cylinder,cut,{samples:32});
 const k=2.5;
 const b=intersectCylinderSidePlane({
  baseCenter:scaled(cylinder.baseCenter,k),
  radiusMm:cylinder.radiusMm*k,heightMm:cylinder.heightMm*k
 },plane(scaled(cut.point,k),P(0,0,7)),{samples:32});
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.equal(a.analyticCurveVerified,true);assert.equal(b.analyticCurveVerified,true);
 assert.equal(a.points.length,b.points.length);
 for(let i=0;i<a.points.length;i++){
  const q=a.points[i],s=b.points[i];
  for(const axis of ['x','y','z'])close(s[axis],q[axis]*k);
  close(Math.hypot(s.x-b.analytic.center.x,s.y-b.analytic.center.y),12.5);
 }
 assert.equal(a.requiresSolidCapAnalysis,false);
 assert.equal(b.requiresSolidCapAnalysis,false);
 assert.equal(a.globallyUnique,null);assert.equal(b.globallyUnique,null);
});
test('04 source-boundary degeneracies cannot be upgraded into a verified cut',()=>{
 const a=prismPlaneSection(box,plane(P(0,0,0),P(0,0,1)));
 const b=pyramidPlaneSection(pyramid,plane(P(5,5,15),P(0,0,1)));
 for(const result of [a,b]){
  assert.equal(result.status,'boundary-degenerate');
  assert.equal(result.verified,false);
  assert.equal(result.perimeterVerified,false);
  assert.deepEqual(result.vertices,[]);
  assert.deepEqual(result.perimeter,[]);
  assert.equal(result.globallyUnique,null);
 }
});
