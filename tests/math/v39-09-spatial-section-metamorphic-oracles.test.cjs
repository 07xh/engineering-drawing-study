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

const {planeSphereSurfaceSection}=
 require('../../engines/spatial/sections/sphere-plane.cjs');
const {finiteCylinderSectionBoundary}=
 require('../../engines/spatial/sections/finite-cylinder-section-boundary.cjs');
const sphere=(center,radiusMm)=>({center,radiusMm,modelUnit:'mm'});
const spherePlane=(point,normal)=>({point,normal,modelUnit:'mm'});
const sphereResidual=(q,c,r)=>Math.abs(
 Math.hypot(q.x-c.x,q.y-c.y,q.z-c.z)-r);
const planeResidual=(q,point,normal)=>{
 const n=Math.hypot(normal.x,normal.y,normal.z);
 return Math.abs(((q.x-point.x)*normal.x+
  (q.y-point.y)*normal.y+(q.z-point.z)*normal.z)/n);
};
function checkAnalyticSphereCircle(result,c,r,cut){
 assert.equal(result.status,'ready');
 assert.equal(result.verified,true);
 assert.equal(result.curve.kind,'analytic-circle-3d');
 assert.equal(result.curve.analyticCurveVerified,true);
 assert.equal(result.curve.sampledPolylineOnly,true);
 assert.equal(result.points.length,33);
 assert.equal(result.maxResidualMm>=0,true);
 for(let i=0;i<result.points.length;i++){
  const p=result.points[i];
  assert.ok(sphereResidual(p,c,r)<1e-6);
  assert.ok(planeResidual(p,cut.point,cut.normal)<1e-6);
  assert.deepEqual(result.projections[i].V,{u:p.x,v:p.z});
  assert.deepEqual(result.projections[i].H,{u:p.x,v:p.y});
  assert.deepEqual(result.projections[i].W,{u:p.y,v:p.z});
 }
 assert.equal(result.globallyUnique,null);
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.firstAngleLayoutVerified,false);
 assert.equal(result.sectionInteriorVerified,false);
 assert.equal(result.v5StepsReady,false);
}
test('04 sphere oblique surface section preserves analytic radius and residual under model translation/scaling',()=>{
 const center=P(4,-2,8),cut=spherePlane(P(4,-2,10),P(0,0,3));
 const a=planeSphereSurfaceSection(sphere(center,7),cut,{samples:32});
 checkAnalyticSphereCircle(a,center,7,cut);
 close(a.curve.radiusMm,Math.sqrt(45));
 close(a.curve.center.z,10);
 const k=2,t=P(100,-70,25);
 const c2=shift(scaled(center,k),t);
 const p2=spherePlane(shift(scaled(cut.point,k),t),P(0,0,-9));
 const b=planeSphereSurfaceSection(sphere(c2,7*k),p2,{samples:32});
 checkAnalyticSphereCircle(b,c2,7*k,p2);
 close(b.curve.radiusMm,k*a.curve.radiusMm);
 for(const axis of ['x','y','z'])
  close(b.curve.center[axis],a.curve.center[axis]*k+t[axis]);
 // Normal direction alters drawing-basis parameterization, but not the
 // underlying unoriented circle; never compare sample array indices.
 assert.equal(a.curve.closed,b.curve.closed);
});
test('04 sphere near-tangency never promotes uncertain samples into a circle',()=>{
 const c=P(0,0,0),s=sphere(c,5);
 const exact=planeSphereSurfaceSection(s,spherePlane(P(0,0,5),P(0,0,1)));
 assert.equal(exact.status,'tangent-point');
 assert.equal(exact.curve,null);
 assert.equal(exact.globallyUnique,null);
 for(const delta of [-1e-9,1e-9]){
  const result=planeSphereSurfaceSection(s,
   spherePlane(P(0,0,5+delta),P(0,0,-2)));
  assert.equal(result.status,'undetermined');
  assert.equal(result.verified,false);
  assert.deepEqual(result.points,[]);
  assert.equal(result.curve,null);
 }
});
test('04 cylinder cap-chord perimeter is translation, scale and normal-rescale invariant',()=>{
 const cylinder={baseCenter:P(0,0,0),radiusMm:5,heightMm:30};
 const cut=plane(P(0,0,3),P(1,0,1));
 const a=finiteCylinderSectionBoundary(cylinder,cut,{samplesPerTurn:64});
 assert.equal(a.status,'ready');assert.equal(a.boundaryVerified,true);
 assert.equal(a.capChords.length,1);assert.equal(a.contourLoops.length,1);
 assert.equal(a.capChords[0].capInteriorVerified,true);
 close(a.capChords[0].lengthMm,8);
 const k=2,t=P(100,-70,25);
 const c2={baseCenter:shift(scaled(cylinder.baseCenter,k),t),
  radiusMm:cylinder.radiusMm*k,heightMm:cylinder.heightMm*k};
 const cut2=plane(shift(scaled(cut.point,k),t),P(7,0,7));
 const b=finiteCylinderSectionBoundary(c2,cut2,{samplesPerTurn:64});
 assert.equal(b.status,'ready');assert.equal(b.boundaryVerified,true);
 assert.equal(b.capChords.length,a.capChords.length);
 assert.equal(b.contourLoops.length,a.contourLoops.length);
 close(b.capChords[0].lengthMm,k*a.capChords[0].lengthMm);
 for(const axis of ['x','y','z']){
  close(b.capChords[0].midpoint[axis],
   k*a.capChords[0].midpoint[axis]+t[axis]);
 }
 for(const res of [a,b]){
  assert.equal(res.completeSolidIntersectionVerified,false);
  assert.equal(res.sectionInteriorVerified,false);
  assert.equal(res.visibilityVerified,false);
  assert.equal(res.v5StepsReady,false);
  assert.equal(res.globallyUnique,null);
 }
});
