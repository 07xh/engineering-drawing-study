'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {conePlaneClippedEllipseBoundary:solve,conePlaneFullEllipse:full}=
 require('../../engines/spatial/sections/finite-cone-plane.cjs');
const P=(x,y,z)=>({x,y,z});
const C=(baseCenter=P(0,0,0),radiusMm=5,heightMm=10)=>
 ({baseCenter,radiusMm,heightMm,modelUnit:'mm'});
const Pl=(point=P(0,0,1),normal=P(1,0,3))=>
 ({point,normal,modelUnit:'mm'});
const near=(a,b,tol=1e-7)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=tol,String(a)+' differs from '+String(b));
function verify(result,c,p){
 assert.equal(result.status,'ready');
 assert.equal(result.boundaryVerified,true);
 assert.equal(result.solidSectionPerimeterVerified,true);
 assert.equal(result.completeSolidIntersectionVerified,false);
 assert.equal(result.curve.analyticCurveVerified,true);
 assert.equal(result.contourLoops.length,1);
 assert.equal(result.contourLoops[0].closed,true);
 assert.equal(result.boundaryEdges.length,2);
 assert.equal(result.points.length,65);
 const b=c.baseCenter,zTop=b.z+c.heightMm,n=p.normal;
 for(let i=0;i<result.points.length;i++){
  const q=result.points[i];
  near(Math.hypot(q.x-b.x,q.y-b.y),
   c.radiusMm*(zTop-q.z)/c.heightMm);
  near((q.x-p.point.x)*n.x+(q.y-p.point.y)*n.y+
   (q.z-p.point.z)*n.z,0);
  assert.ok(q.z>=b.z-1e-7&&q.z<=zTop+1e-7);
  assert.deepEqual(result.projections[i],{
   V:{u:q.x,v:q.z},H:{u:q.x,v:q.y},W:{u:q.y,v:q.z}});
 }
 const cap=result.capChord;
 assert.equal(cap.capInteriorVerified,true);
 for(const q of [cap.start,cap.end]){
  near(q.z,b.z);near(Math.hypot(q.x-b.x,q.y-b.y),c.radiusMm);
 }
 near(result.boundaryEdges[0].start.x,result.boundaryEdges[1].end.x);
 near(result.boundaryEdges[0].start.y,result.boundaryEdges[1].end.y);
 near(result.boundaryEdges[0].end.x,result.boundaryEdges[1].start.x);
 near(result.boundaryEdges[0].end.y,result.boundaryEdges[1].start.y);
 assert.equal(result.globallyUnique,null);
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.sectionInteriorVerified,false);
 assert.equal(result.firstAngleLayoutVerified,false);
 assert.equal(result.v5StepsReady,false);
}
test('04 truncated ellipse yields actual 8-mm bottom cap chord and one closed boundary',()=>{
 const r=solve(C(),Pl());verify(r,C(),Pl());
 near(r.capChord.lengthMm,8);
 near(r.capChord.midpoint.x,3);near(r.capChord.midpoint.y,0);
 near(r.curve.radialBoundsMm.min,27/7);
 near(r.curve.radialBoundsMm.max,27/5);
 assert.ok(r.joinMismatchMm<1e-7);
});
test('04 bottom-center cut gives one diameter chord of 10 mm',()=>{
 const p=Pl(P(0,0,0)),r=solve(C(),p);verify(r,C(),p);
 near(r.capChord.lengthMm,10);
 near(r.capChord.midpoint.x,0);
});
test('04 normal reversal and rescaling must preserve cap and analytic radial bounds',()=>{
 const a=solve(C(),Pl());
 for(const k of [-7,2,11]){
  const p=Pl(P(0,0,1),P(k,0,3*k)),b=solve(C(),p);
  verify(b,C(),p);
  near(b.capChord.lengthMm,a.capChord.lengthMm);
  for(const axis of ['x','y','z'])
   near(b.capChord.midpoint[axis],a.capChord.midpoint[axis]);
  near(b.curve.radialBoundsMm.min,a.curve.radialBoundsMm.min);
  near(b.curve.radialBoundsMm.max,a.curve.radialBoundsMm.max);
 }
});
test('04 uniform model-mm scaling and 3D translation preserve side samples and cap length',()=>{
 const c=C(),p=Pl(),a=solve(c,p);
 const k=2,t=P(100,-70,25);
 const transform=q=>P(k*q.x+t.x,k*q.y+t.y,k*q.z+t.z);
 const c2=C(transform(c.baseCenter),c.radiusMm*k,c.heightMm*k);
 const p2=Pl(transform(p.point),p.normal),b=solve(c2,p2);
 verify(a,c,p);verify(b,c2,p2);
 near(b.capChord.lengthMm,k*a.capChord.lengthMm);
 for(const axis of ['x','y','z'])
  near(b.capChord.midpoint[axis],k*a.capChord.midpoint[axis]+t[axis]);
 for(let i=0;i<a.points.length;i++)for(const axis of ['x','y','z'])
  near(b.points[i][axis],k*a.points[i][axis]+t[axis]);
});
test('04 sampling resolution cannot change analytic chord and radial bounds',()=>{
 const a=solve(C(),Pl(),{samplesPerArc:32});
 const b=solve(C(),Pl(),{samplesPerArc:256});
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.equal(a.points.length,33);assert.equal(b.points.length,257);
 near(a.capChord.lengthMm,b.capChord.lengthMm);
 near(a.curve.radialBoundsMm.min,b.curve.radialBoundsMm.min);
 near(a.curve.radialBoundsMm.max,b.curve.radialBoundsMm.max);
});
test('04 full lateral ellipse is not mislabeled clipped; existing full solver stays available',()=>{
 const p=Pl(P(0,0,2)),partial=solve(C(),p),whole=full(C(),p);
 assert.equal(partial.status,'not-clipped');assert.equal(partial.verified,false);
 assert.deepEqual(partial.points,[]);
 assert.equal(whole.status,'ready');assert.equal(whole.verified,true);
});
test('04 exact and near rim contact must not fabricate positive boundary',()=>{
 for(const z of [5/3,5/3+1e-9,-5/3,-5/3-1e-9]){
  const r=solve(C(),Pl(P(0,0,z)));
  assert.notEqual(r.status,'ready');assert.equal(r.verified,false);
  assert.deepEqual(r.points,[]);
 }
});
test('04 apex/disjoint/unsupported conics fail closed',()=>{
 for(const p of [
  Pl(P(0,0,10)),Pl(P(0,0,10-1e-10)),
  Pl(P(0,0,11)),Pl(P(0,0,-4)),
  Pl(P(0,0,1),P(1,0,0)),
  Pl(P(0,0,1),P(1,0,0.5))]){
  const r=solve(C(),p);
  assert.notEqual(r.status,'ready');
  assert.equal(r.verified,false);
  assert.deepEqual(r.points,[]);
  assert.equal(r.v5StepsReady,false);
 }
});
test('04 invalid coordinates, units, plane normals and sample settings throw',()=>{
 assert.throws(()=>solve({...C(),modelUnit:'px'},Pl()),/model-mm/);
 assert.throws(()=>solve(C(),{...Pl(),modelUnit:'px'}),/model-mm/);
 assert.throws(()=>solve(C(),Pl(P(0,0,1),P(0,0,0))),/degenerate/);
 assert.throws(()=>solve(C(P(0,0,0),0),Pl()));
 assert.throws(()=>solve(C(P(Infinity,0,0)),Pl()));
 for(const samplesPerArc of [0,16,31,257,'64',NaN])
  assert.throws(()=>solve(C(),Pl(),{samplesPerArc}),/samples/);
});
test('04 large absolute positions and unresolvable tiny features never claim proof',()=>{
 const q=P(1e7,0,0);
 const r=solve(C(q,1e-6,10),Pl(P(1e7,0,1)));
 assert.equal(r.status,'undetermined');
 assert.equal(r.verified,false);
 assert.deepEqual(r.points,[]);
});
test('04 solver is deterministic and does not modify source geometry',()=>{
 const c=C(P(4,-8,3)),p=Pl(P(4,-8,4));
 const snapshot=JSON.stringify([c,p]),a=solve(c,p),b=solve(c,p);
 verify(a,c,p);assert.deepEqual(a,b);
 assert.equal(JSON.stringify([c,p]),snapshot);
});
