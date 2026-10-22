'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {finiteCylinderSectionBoundary:solve}=
 require('../../engines/spatial/sections/finite-cylinder-section-boundary.cjs');
const point=(x,y,z)=>({x,y,z});
const cylinder=(r=5,h=30,baseCenter=point(0,0,0))=>
 ({radiusMm:r,heightMm:h,baseCenter});
const plane=(q,n)=>({point:q,normal:n});
const inclined=z=>plane(point(0,0,z),point(1,0,1));
const flat=z=>plane(point(0,0,z),point(0,0,1));
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<=t,
 String(a)+' differs from '+String(b));
function checkContour(r){
 assert.equal(r.status,'ready');
 assert.equal(r.boundaryVerified,true);
 assert.equal(r.solidSectionPerimeterVerified,true);
 assert.equal(r.completeSolidIntersectionVerified,false);
 assert.equal(r.sectionInteriorVerified,false);
 assert.equal(r.visibilityVerified,false);
 assert.equal(r.v5StepsReady,false);
 assert.equal(r.globallyUnique,null);
 assert.equal(r.contourLoops.length,1);
 assert.equal(r.contourLoops[0].closed,true);
 assert.equal(r.contourLoops[0].traversal.length,r.boundaryEdges.length);
 assert.ok(r.maxResidualMm<1e-6);
 assert.ok(r.maxJoinMismatchMm<1e-6);
 const incidences=new Map();
 for(const e of r.boundaryEdges){
  incidences.set(e.fromNode,(incidences.get(e.fromNode)||0)+1);
  incidences.set(e.toNode,(incidences.get(e.toNode)||0)+1);
 }
 assert.ok([...incidences.values()].every(degree=>degree===2));
 for(const e of r.capChords){
  assert.equal(e.capInteriorVerified,true);
  assert.ok(e.lengthMm>0);
  near(e.projectedEndpoints.start.V.u,e.start.x);
  near(e.projectedEndpoints.end.W.u,e.end.y);
  near(e.projectedEndpoints.end.H.v,e.end.y);
 }
}
test('04 bottom cap cut adds real disk chord joining a single verified lateral arc',()=>{
 const result=solve(cylinder(),inclined(3));
 checkContour(result);
 assert.equal(result.sourceStatus,'clipped-lateral');
 assert.equal(result.lateralArcCount,1);
 assert.equal(result.capChordCount,1);
 assert.equal(result.boundaryEdges.length,2);
 const cap=result.capChords[0];
 assert.equal(cap.face,'bottom');
 near(cap.start.x,3);near(cap.end.x,3);
 near(cap.start.z,0);near(cap.end.z,0);
 near(cap.lengthMm,8); // 2*sqrt(r² - x²) = 8 mm
 near(cap.midpoint.x,3);near(cap.midpoint.y,0);
 assert.deepEqual(result.contourLoops[0].traversal.map(e=>e.kind),
  ['lateral-arc','cap-chord']);
});
test('04 upper cap cut reconciles two side intervals split by polar seam into one physical loop',()=>{
 const r=solve(cylinder(),inclined(27));
 checkContour(r);
 assert.equal(r.lateralArcCount,2);
 assert.equal(r.capChordCount,1);
 assert.equal(r.contourLoops[0].traversal.length,3);
 const cap=r.capChords[0];assert.equal(cap.face,'top');
 near(cap.start.x,-3);near(cap.end.x,-3);near(cap.start.z,30);
 near(cap.end.z,30);near(cap.lengthMm,8);
});
test('04 crossing both end caps proves two chords plus remaining side arcs',()=>{
 const r=solve(cylinder(5,8),inclined(4));
 checkContour(r);
 assert.equal(r.lateralArcCount,2);
 assert.equal(r.capChordCount,2);
 assert.equal(r.boundaryEdges.length,4);
 assert.deepEqual(r.capChords.map(e=>e.face),['bottom','top']);
 for(const e of r.capChords){
  near(e.lengthMm,6);
  near(Math.abs(e.start.x),4);
  near(Math.abs(e.end.x),4);
 }
});
test('04 intact oblique ellipse has one closed lateral loop and requires no imaginary cap chord',()=>{
 const r=solve(cylinder(),inclined(15));
 checkContour(r);
 assert.equal(r.lateralArcCount,1);
 assert.equal(r.capChordCount,0);
 assert.equal(r.boundaryEdges[0].fromNode,r.boundaryEdges[0].toNode);
 assert.equal(r.contourLoops[0].traversal.length,1);
});
test('04 horizontal interior plane forms one circular perimeter without cap segments',()=>{
 const r=solve(cylinder(),flat(12));
 checkContour(r);
 assert.equal(r.capChords.length,0);
 assert.equal(r.lateralArcCount,1);
 assert.ok(r.boundaryEdges[0].points.every(q=>Math.abs(q.z-12)<1e-7));
});
test('04 planes coincident with entire top or bottom cap disk do not pass as 1D intersection',()=>{
 for(const z of [0,30]){
  const r=solve(cylinder(),flat(z));
  assert.equal(r.status,'blocked');
  assert.equal(r.boundaryVerified,false);
  assert.deepEqual(r.contourLoops,[]);
 }
});
test('04 isolated cap rim touches without positive arc are not fabricated as solid perimeter',()=>{
 for(const z of [-5,35]){
  const r=solve(cylinder(),inclined(z));
  assert.equal(r.status,'blocked');
  assert.equal(r.solidSectionPerimeterVerified,false);
  assert.deepEqual(r.boundaryEdges,[]);
 }
});
test('04 exact vertical plane, nearly vertical and disjoint cuts remain fail closed',()=>{
 const shapes=[
  plane(point(2,0,0),point(1,0,0)),
  plane(point(0,0,15),point(1,0,1e-12)),
  flat(-15)
 ];
 for(const p of shapes){
  const r=solve(cylinder(),p);
  assert.equal(r.status,'blocked');
  assert.equal(r.visibilityVerified,false);
  assert.deepEqual(r.capChords,[]);
 }
});
test('04 translated and normal-rescaled cylinder/plane give equivalent 3D contours',()=>{
 const c=cylinder(5,30,point(10,-5,2));
 const a=solve(c,plane(point(10,-5,5),point(1,0,1)));
 const b=solve(c,plane(point(10,-5,5),point(3,0,3)));
 checkContour(a);checkContour(b);
 assert.equal(a.boundaryEdges.length,b.boundaryEdges.length);
 assert.equal(a.capChords.length,b.capChords.length);
 for(let i=0;i<a.capChords.length;i++){
  near(a.capChords[i].lengthMm,b.capChords[i].lengthMm);
  near(a.capChords[i].start.x,b.capChords[i].start.x);
  near(a.capChords[i].end.y,b.capChords[i].end.y);
 }
 assert.equal(a.capChords[0].face,'bottom');
 near(a.capChords[0].start.z,2);
 near(a.capChords[0].lengthMm,8);
});
test('04 metric scaling scales true chord lengths and still preserves planar constraints',()=>{
 const a=solve(cylinder(),inclined(3));
 const b=solve(cylinder(10,60),inclined(6));
 checkContour(a);checkContour(b);
 near(b.capChords[0].lengthMm,2*a.capChords[0].lengthMm);
 near(b.capChords[0].start.x,2*a.capChords[0].start.x);
});
test('04 chord residual and topology are invariant to sampling resolution',()=>{
 const low=solve(cylinder(),inclined(3),{samplesPerTurn:16});
 const high=solve(cylinder(),inclined(3),{samplesPerTurn:256});
 checkContour(low);checkContour(high);
 assert.ok(high.chordErrorUpperBoundMm<low.chordErrorUpperBoundMm);
 assert.ok(high.boundaryEdges[0].points.length>low.boundaryEdges[0].points.length);
 near(high.capChords[0].lengthMm,low.capChords[0].lengthMm);
 assert.equal(high.capChords.length,low.capChords.length);
});
test('04 unsupported geometry, extreme values and invalid samples cannot create a standard answer',()=>{
 assert.throws(()=>solve(cylinder(0),inclined(3)),/positive radius/);
 assert.throws(()=>solve(cylinder(),plane(point(0,0,0),point(0,0,0))),/degenerate/);
 for(const n of [0,15,17,257,NaN,'64'])
  assert.throws(()=>solve(cylinder(),inclined(3),{samplesPerTurn:n}),/samplesPerTurn/);
});
test('04 input is immutable and graph carries explicit proof limitations, not fake visibility',()=>{
 const c=cylinder(),p=inclined(3);
 const a=solve(c,p),again=solve(structuredClone(c),structuredClone(p));
 assert.deepEqual(a,again);
 assert.deepEqual(c,cylinder());
 assert.deepEqual(p,inclined(3));
 assert.match(a.proofScope,/not filled area/);
 assert.equal(a.firstAngleLayoutVerified,false);
 assert.equal(a.v5StepsReady,false);
});
