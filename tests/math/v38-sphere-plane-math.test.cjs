'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {planeSphereSurfaceSection:cut}=
 require('../../engines/spatial/sections/sphere-plane.cjs');
const vec=(x,y,z)=>({x,y,z});
const sphere=(center=vec(0,0,0),radiusMm=5)=>({
 center,radiusMm,modelUnit:'mm'});
const plane=(point=vec(0,0,0),normal=vec(0,0,1))=>({
 point,normal,modelUnit:'mm'});
const near=(a,b,epsilon=1e-7)=>assert.ok(Number.isFinite(a)&&
 Math.abs(a-b)<=epsilon,String(a)+' is not within '+String(epsilon)+' of '+String(b));
const signed=(p,q,n)=>((p.x-q.x)*n.x+(p.y-q.y)*n.y+(p.z-q.z)*n.z)/
 Math.hypot(n.x,n.y,n.z);

test('04 genuine equatorial sphere cut returns full analytic circle, not a canned SVG',()=>{
 const result=cut(sphere(),plane(),{samples:24});
 assert.equal(result.status,'ready');
 assert.equal(result.verified,true);
 assert.equal(result.geometryKind,'sphere-surface-plane-circle');
 assert.equal(result.modelUnit,'mm');
 assert.equal(result.curve.analyticCurveVerified,true);
 assert.equal(result.curve.sampledPolylineOnly,true);
 near(result.curve.radiusMm,5);
 assert.equal(result.points.length,25);
 assert.equal(result.projections.length,25);
 for(const p of result.points){
  near(Math.hypot(p.x,p.y,p.z),5,1e-8);
  near(p.z,0,1e-8);
 }
 assert.equal(result.globallyUnique,null);
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.firstAngleLayoutVerified,false);
 assert.equal(result.sectionInteriorVerified,false);
 assert.equal(result.v5StepsReady,false);
});

test('04 oblique source plane through off-origin sphere center preserves 3D residuals',()=>{
 const center=vec(4,-2,8),n=vec(1,2,3),result=cut(sphere(center,7),plane(center,n));
 assert.equal(result.status,'ready');
 near(result.curve.radiusMm,7);
 for(const point of result.points){
  near(Math.hypot(point.x-center.x,point.y-center.y,point.z-center.z),7,1e-7);
  near(signed(point,center,n),0,1e-7);
  assert.equal(result.projections[result.points.indexOf(point)].V.u,point.x);
 }
 assert.ok(result.maxResidualMm<1e-7);
});

test('04 known plane offset yields radius sqrt(r^2-d^2), not projected ellipse radius',()=>{
 const result=cut(sphere(),plane(vec(0,0,3)));
 assert.equal(result.status,'ready');
 near(result.curve.radiusMm,4);
 near(result.curve.center.z,3);
 near(result.curve.normal.z,1);
 for(const p of result.points)near(p.z,3,1e-8);
});

test('04 exact represented tangent is a point, never fabricated circle or global uniqueness',()=>{
 const r=cut(sphere(),plane(vec(0,0,5)));
 assert.equal(r.status,'tangent-point');
 assert.equal(r.verified,true);
 assert.deepEqual(r.point,vec(0,0,5));
 assert.equal(r.curve,null);
 assert.equal(r.points.length,1);
 assert.equal(r.globallyUnique,null);
 assert.equal(r.sectionInteriorVerified,false);
 assert.equal(r.v5StepsReady,false);
});
test('04 plane missing sphere or numerically near tangent does not leak drawable circle',()=>{
 const missed=cut(sphere(),plane(vec(0,0,8)));
 assert.equal(missed.status,'none');
 assert.equal(missed.verified,false);
 assert.deepEqual(missed.points,[]);
 assert.equal(missed.maxResidualMm,null);
 for(const delta of [-1e-9,1e-9]){
  const nearTouch=cut(sphere(),plane(vec(0,0,5+delta)));
  assert.equal(nearTouch.status,'undetermined');
  assert.equal(nearTouch.verified,false);
  assert.deepEqual(nearTouch.projections,[]);
 }
});

test('04 common mm scaling preserves analytic intersection under a stable unit policy',()=>{
 for(const factor of [.01,1,100]){
  const c=vec(factor,-2*factor,3*factor);
  const p=vec(factor,-2*factor,5*factor);
  const r=cut(sphere(c,5*factor),plane(p,vec(0,0,2)));
  assert.equal(r.status,'ready');
  near(r.curve.radiusMm/factor,Math.sqrt(21),1e-8);
  near(r.curve.center.x/factor,1,1e-8);
  near(r.curve.center.z/factor,5,1e-8);
 }
});

test('04 explicit model units, finite radius, normal, samples and geometry required',()=>{
 assert.throws(()=>cut({...sphere(),modelUnit:'px'},plane()));
 assert.throws(()=>cut(sphere(),{...plane(),modelUnit:undefined}));
 assert.throws(()=>cut(sphere(vec(Infinity,0,0)),plane()));
 assert.throws(()=>cut(sphere(vec(1e8,0,0)),plane()));
 assert.throws(()=>cut(sphere(vec(0,0,0),0),plane()));
 assert.throws(()=>cut(sphere(vec(0,0,0),1e-7),plane()));
 assert.throws(()=>cut(sphere(),plane(vec(0,0,0),vec(0,0,0))));
 assert.throws(()=>cut(sphere(),plane(vec(0,0,0),vec(NaN,1,0))));
 assert.throws(()=>cut(sphere(),plane(),{samples:3}));
 assert.throws(()=>cut(sphere(),plane(),{samples:129}));
 assert.throws(()=>cut(null,plane()));
 assert.throws(()=>cut(sphere(),null));
});
test('04 input model is never mutated by shared math and projection',()=>{
 const s=sphere(vec(2,3,4),10),p=plane(vec(0,0,5),vec(1,1,1));
 const before=JSON.stringify([s,p]);
 const a=cut(s,p),b=cut(s,p);
 assert.equal(JSON.stringify([s,p]),before);
 assert.deepEqual(a,b);
});


test('09 independent large-coordinate oracle and normal reversal preserve sphere cut',()=>{
 const center=vec(2500000,-1800000,900000);
 const s=sphere(center,25);
 const point=vec(center.x,center.y,center.z+12);
 const a=cut(s,plane(point,vec(0,0,4)),{samples:32});
 const b=cut(s,plane(point,vec(0,0,-8)),{samples:32});
 assert.equal(a.status,'ready');
 assert.equal(b.status,'ready');
 near(a.curve.radiusMm,Math.sqrt(625-144),1e-7);
 near(b.curve.radiusMm,a.curve.radiusMm,1e-9);
 assert.deepEqual(a.curve.center,point);
 assert.deepEqual(b.curve.center,point);
 for(const result of [a,b])for(let i=0;i<result.points.length;i++){
  const x=result.points[i];
  near(Math.hypot(x.x-center.x,x.y-center.y,x.z-center.z),25,1e-6);
  near(x.z,point.z,1e-6);
  assert.equal(result.projections[i].V.u,x.x);
  assert.equal(result.projections[i].V.v,x.z);
  assert.equal(result.projections[i].H.v,x.y);
  assert.equal(result.projections[i].W.u,x.y);
  assert.equal(result.visibilityVerified,false);
  assert.equal(result.globallyUnique,null);
 }
});

test('09 ULP-sensitive large-coordinate tiny sphere fails closed but resolved scale works',()=>{
 const far=vec(1e7,0,0);
 const tiny=1e-6;
 const blocked=cut(sphere(far,tiny),plane(far),{samples:24});
 assert.equal(blocked.status,'undetermined');
 assert.equal(blocked.verified,false);
 assert.equal(blocked.curve,null);
 assert.deepEqual(blocked.points,[]);
 const resolved=cut(sphere(vec(0,0,0),tiny),plane(),{samples:24});
 assert.equal(resolved.status,'ready');
 near(resolved.curve.radiusMm,tiny,1e-12);
 assert.equal(resolved.globallyUnique,null);
});

test('09 equivalent plane normal scales and reversed sign do not upgrade uniqueness',()=>{
 const s=sphere(vec(1,-2,3),9);
 const p=vec(1,-2,7);
 const scales=[.001,1,10];
 let expected=null;
 for(const k of scales)for(const sign of [-1,1]){
  const result=cut(s,plane(p,vec(k*sign,0,0)),{samples:16});
  assert.equal(result.status,'ready');
  near(result.curve.radiusMm,9,1e-7);
  near(result.curve.center.x,1,1e-8);
  assert.equal(result.curve.analyticCurveVerified,true);
  assert.equal(result.globallyUnique,null);
  if(expected===null)expected=result.curve.radiusMm;
  else near(result.curve.radiusMm,expected,1e-8);
 }
});
