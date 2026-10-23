'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {conePlaneFullEllipse:solve}=
 require('../../engines/spatial/sections/finite-cone-plane.cjs');
const P=(x,y,z)=>({x,y,z});
const C=(baseCenter=P(0,0,0),radiusMm=5,heightMm=10)=>
 ({baseCenter,radiusMm,heightMm,modelUnit:'mm'});
const Pl=(point=P(0,0,6),normal=P(0,0,1))=>
 ({point,normal,modelUnit:'mm'});
const near=(x,y,t=1e-7)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=t,
 String(x)+' differs from '+String(y));
function check(result,cone,plane){
 assert.equal(result.status,'ready');assert.equal(result.verified,true);
 assert.equal(result.curve.analyticCurveVerified,true);
 assert.equal(result.completeLateralIntersection,true);
 assert.equal(result.points.length,65);
 assert.equal(result.projections.length,65);
 for(let i=0;i<result.points.length;i++){
  const q=result.points[i],b=cone.baseCenter,apexZ=b.z+cone.heightMm;
  assert.ok(q.z>b.z&&q.z<apexZ);
  near(Math.hypot(q.x-b.x,q.y-b.y),
   cone.radiusMm*(apexZ-q.z)/cone.heightMm);
  const n=plane.normal,norm=Math.hypot(n.x,n.y,n.z);
  near(((q.x-plane.point.x)*n.x+(q.y-plane.point.y)*n.y+
   (q.z-plane.point.z)*n.z)/norm,0);
  assert.deepEqual(result.projections[i],{
   V:{u:q.x,v:q.z},H:{u:q.x,v:q.y},W:{u:q.y,v:q.z}});
 }
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.sectionInteriorVerified,false);
 assert.equal(result.firstAngleLayoutVerified,false);
 assert.equal(result.v5StepsReady,false);
 assert.equal(result.globallyUnique,null);
 assert.equal(result.curve.sampledPolylineOnly,true);
}
test('04 a horizontal interior cone cut proves circle of radius 2mm',()=>{
 const r=solve(C(),Pl());check(r,C(),Pl());
 assert.equal(r.curve.conicType,'circle');
 near(r.curve.radialBoundsMm.min,2);
 near(r.curve.radialBoundsMm.max,2);
 for(const q of r.points)near(q.z,6);
});
test('04 an oblique plane proves genuine complete conical ellipse',()=>{
 const p=Pl(P(0,0,6),P(1,0,3)),r=solve(C(),p);
 check(r,C(),p);
 assert.equal(r.curve.conicType,'ellipse');
 near(r.curve.radialBoundsMm.min,12/7);
 near(r.curve.radialBoundsMm.max,12/5);
 assert.ok(r.curve.radialBoundsMm.max<5);
});
test('04 plane normal reversal and rescaling preserve analytic radial bounds',()=>{
 const a=solve(C(),Pl(P(0,0,6),P(1,0,3)));
 for(const k of [-7,2,11]){
  const p=Pl(P(0,0,6),P(k,0,3*k)),b=solve(C(),p);
  check(b,C(),p);
  near(b.curve.radialBoundsMm.min,a.curve.radialBoundsMm.min);
  near(b.curve.radialBoundsMm.max,a.curve.radialBoundsMm.max);
  for(let i=0;i<b.points.length;i++)for(const axis of ['x','y','z'])
   near(b.points[i][axis],a.points[i][axis]);
 }
});
test('04 3D translation and model-mm scaling preserve true sampled cone/plane residuals',()=>{
 const c=C(),p=Pl(P(0,0,6),P(1,0,3)),a=solve(c,p);
 const k=2,t=P(100,-70,25);
 const transform=q=>P(k*q.x+t.x,k*q.y+t.y,k*q.z+t.z);
 const c2=C(transform(c.baseCenter),c.radiusMm*k,c.heightMm*k);
 const p2=Pl(transform(p.point),p.normal),b=solve(c2,p2);
 check(b,c2,p2);
 for(let i=0;i<a.points.length;i++)for(const axis of ['x','y','z'])
  near(b.points[i][axis],k*a.points[i][axis]+t[axis]);
 near(b.curve.radialBoundsMm.min,k*a.curve.radialBoundsMm.min);
 near(b.curve.radialBoundsMm.max,k*a.curve.radialBoundsMm.max);
});
test('04 visualization sample density cannot change analytic conic envelope',()=>{
 const p=Pl(P(0,0,6),P(1,0,3));
 const a=solve(C(),p,{samples:32}),b=solve(C(),p,{samples:128});
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 near(a.curve.radialBoundsMm.min,b.curve.radialBoundsMm.min);
 near(a.curve.radialBoundsMm.max,b.curve.radialBoundsMm.max);
 assert.equal(a.points.length,33);assert.equal(b.points.length,129);
});
test('04 apex tangent and near-apex cases must not become drawable ellipse',()=>{
 for(const z of [10,10-1e-10]){
  const r=solve(C(),Pl(P(0,0,z)));
  assert.equal(r.verified,false);assert.deepEqual(r.points,[]);
  assert.equal(r.v5StepsReady,false);
 }
});
test('04 finite base clipping is blocked, exterior sections are empty',()=>{
 for(const p of [Pl(P(0,0,0)),Pl(P(0,0,1),P(1,0,1))]){
  const r=solve(C(),p);
  assert.equal(r.verified,false);
  assert.notEqual(r.status,'ready');
 }
 for(const z of [11,20,-3]){
  const r=solve(C(),Pl(P(0,0,z)));
  assert.equal(r.status,'none');assert.deepEqual(r.points,[]);
 }
});
test('04 vertical and generator-parallel planes remain unsupported',()=>{
 for(const n of [P(1,0,0),P(2,0,1),P(1,0,.4999999999)]){
  const r=solve(C(),Pl(P(0,0,6),n));
  assert.equal(r.status,'unsupported-conic');
  assert.equal(r.verified,false);assert.deepEqual(r.points,[]);
 }
});
test('04 malformed mm units, near-zero planes, dimensions and samples cannot yield positive proof',()=>{
 assert.throws(()=>solve({...C(),modelUnit:'px'},Pl()),/model-mm/);
 assert.throws(()=>solve(C(),{...Pl(),modelUnit:'px'}),/model-mm/);
 assert.throws(()=>solve(C(P(NaN,0,0)),Pl()));
 assert.throws(()=>solve(C(P(1e8,0,0)),Pl()));
 assert.throws(()=>solve(C(P(0,0,1e7),5,10),Pl()));
 assert.throws(()=>solve(C(P(0,0,0),0),Pl()));
 assert.throws(()=>solve(C(),Pl(P(0,0,6),P(0,0,0))),/degenerate/);
 for(const n of [0,31,257,'64',NaN])
  assert.throws(()=>solve(C(),Pl(),{samples:n}),/samples/);
});
test('04 source inputs are immutable and analytic results reproducible',()=>{
 const c=C(P(4,-8,3)),p=Pl(P(4,-8,9),P(1,0,3));
 const before=JSON.stringify([c,p]),a=solve(c,p),b=solve(c,p);
 check(a,c,p);assert.deepEqual(a,b);
 assert.equal(JSON.stringify([c,p]),before);
});
test('04 underresolved tiny-radius cone at huge coordinates must fail closed',()=>{
 const r=solve(C(P(1e7,0,0),1e-6,10),Pl(P(1e7,0,6)));
 assert.equal(r.status,'undetermined');
 assert.equal(r.verified,false);
});

test('04 only exactly horizontal plane is a mathematical circle, not nearly horizontal oblique',()=>{
 const n=P(1e-15,0,1),r=solve(C(),Pl(P(0,0,6),n));
 assert.equal(r.status,'ready');
 assert.equal(r.curve.conicType,'ellipse');
 assert.ok(r.curve.radialBoundsMm.max>r.curve.radialBoundsMm.min);
});
test('04 inherited geometry coordinate is not accepted as model-space evidence',()=>{
 const bad=Object.assign(Object.create({x:0}),{y:0,z:0});
 assert.throws(()=>solve(C(bad),Pl()),/bounded upright finite cone/);
 assert.throws(()=>solve(C(),Pl(bad)),/bounded finite model-mm plane/);
});
