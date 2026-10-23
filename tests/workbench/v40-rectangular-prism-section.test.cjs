'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismPlaneSection:cut}=
 require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const p=(x,y,z)=>({x,y,z});
const box=(min=p(0,0,0),max=p(10,10,10))=>({min,max});
const plane=(point,normal)=>({point,normal});
const diag=k=>plane(p(0,0,k),p(1,1,1));
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<=t,
 String(a)+' not near '+String(b));
function proof(r,n){
 assert.equal(r.status,'ready');
 assert.equal(r.verified,true);assert.equal(r.perimeterVerified,true);
 assert.equal(r.edgeCount,n);
 assert.equal(r.vertices.length,n);
 assert.equal(r.perimeter.length,n);
 assert.equal(r.proof.polygonDegreeTwo,true);
 assert.equal(r.proof.orderedCounterclockwiseWithNormal,true);
 assert.equal(r.visibilityVerified,false);
 assert.equal(r.sectionInteriorVerified,false);
 assert.equal(r.v5StepsReady,false);
 assert.equal(r.globallyUnique,null);
 assert.ok(r.maxResidualMm<=1e-7);
 assert.ok(r.areaMm2>0);assert.ok(r.perimeterMm>0);
 for(let i=0;i<n;i++){
  const q=r.vertices[i],edge=r.perimeter[i];
  assert.equal(q.id,edge.fromId);
  assert.equal(edge.toId,r.vertices[(i+1)%n].id);
  assert.ok(q.sourceEdgeIds.length>=1);
  assert.ok(q.sourceEdgeIds.every(x=>/^edge-vertex-/.test(x)));
  assert.ok(edge.lengthMm>0);
  assert.deepEqual(q.projection,{
   V:{u:q.point.x,v:q.point.z},
   H:{u:q.point.x,v:q.point.y},
   W:{u:q.point.y,v:q.point.z}
  });
 }
}
test('04 rectangular prism x+y+z=12 yields genuine six-vertex convex cut',()=>{
 const r=cut(box(),diag(12));proof(r,6);
 const expected=[
  p(0,2,10),p(2,0,10),p(0,10,2),
  p(10,0,2),p(2,10,0),p(10,2,0)
 ];
 for(const wanted of expected)
  assert.ok(r.vertices.some(v=>Math.hypot(
   v.point.x-wanted.x,v.point.y-wanted.y,v.point.z-wanted.z)<1e-7));
 for(const v of r.vertices)near(v.point.x+v.point.y+v.point.z,12);
});
test('04 inside horizontal plane gives 10mm x10mm rectangle, measured area 100mm²',()=>{
 const r=cut(box(),plane(p(0,0,5),p(0,0,1)));proof(r,4);
 near(r.areaMm2,100);near(r.perimeterMm,40);
 assert.ok(r.vertices.every(v=>Math.abs(v.point.z-5)<1e-7));
});
test('04 axial plane x=5 yields rectangular cut with true projected dimensions',()=>{
 const r=cut(box(),plane(p(5,0,0),p(1,0,0)));proof(r,4);
 near(r.areaMm2,100);near(r.perimeterMm,40);
 for(const v of r.vertices)near(v.point.x,5);
 assert.equal(new Set(r.vertices.map(v=>v.projection.V.u)).size,1);
});
test('04 triangular slanted section x+y+z=3 intersects precisely three finite edges',()=>{
 const r=cut(box(),diag(3));proof(r,3);
 near(r.areaMm2,9*Math.sqrt(3)/2);
 for(const v of r.vertices)near(v.point.x+v.point.y+v.point.z,3);
});
test('04 cutting exactly through three box corners preserves unique polygon vertices',()=>{
 const r=cut(box(),diag(10));proof(r,3);
 near(r.areaMm2,50*Math.sqrt(3));
 assert.ok(r.vertices.every(v=>v.sourceEdgeIds.length===3));
 for(const v of r.vertices)
  assert.ok([v.point.x,v.point.y,v.point.z].filter(k=>k===10).length===1);
});
test('04 no intersection and isolated tangent corner are blocked without fabricated polygon',()=>{
 const none=cut(box(),diag(33));
 assert.equal(none.status,'none');assert.deepEqual(none.vertices,[]);
 assert.equal(none.perimeterVerified,false);
 const corner=cut(box(),diag(0));
 assert.equal(corner.status,'degenerate');
 assert.deepEqual(corner.perimeter,[]);
});
test('04 full edge and coplanar face are rejected until boundary-degenerate topology review',()=>{
 const face=cut(box(),plane(p(0,0,0),p(0,0,1)));
 assert.equal(face.status,'boundary-degenerate');
 const edge=cut(box(),plane(p(0,0,0),p(1,1,0)));
 assert.equal(edge.status,'boundary-degenerate');
 assert.equal(face.verified,false);
 assert.equal(edge.vertices.length,0);
});
test('04 topology, area and residues survive translating finite prism and planar datum',()=>{
 const b=box(p(5,-3,7),p(15,7,17));
 const original=cut(box(),diag(12)),moved=cut(b,plane(p(5,-3,19),p(1,1,1)));
 proof(original,6);proof(moved,6);
 near(moved.areaMm2,original.areaMm2);
 near(moved.perimeterMm,original.perimeterMm);
 for(const q of original.vertices){
  assert.ok(moved.vertices.some(v=>Math.hypot(v.point.x-(q.point.x+5),
    v.point.y-(q.point.y-3),v.point.z-(q.point.z+7))<1e-7));
 }
});
test('04 plane normal rescaling is invariant and perpendicular coordinates remain model-mm',()=>{
 const a=cut(box(),diag(12));
 const b=cut(box(),plane(p(0,0,12),p(20,20,20)));
 proof(a,6);proof(b,6);
 near(a.areaMm2,b.areaMm2);
 for(let i=0;i<a.vertices.length;i++){
  near(a.vertices[i].point.x,b.vertices[i].point.x);
  near(a.vertices[i].point.y,b.vertices[i].point.y);
  near(a.vertices[i].point.z,b.vertices[i].point.z);
 }
});
test('04 unit scaling of prism doubles perimeter and quadruples section area',()=>{
 const a=cut(box(),diag(12));
 const b=cut(box(p(0,0,0),p(20,20,20)),diag(24));
 proof(a,6);proof(b,6);
 near(b.areaMm2,4*a.areaMm2);
 near(b.perimeterMm,2*a.perimeterMm);
});
test('04 rejects invalid or unbounded mm bounds and degenerate plane normals',()=>{
 for(const bad of [
  box(p(0,0,0),p(0,10,10)),
  box(p(0,0,0),p(10,-10,10)),
  box(p(0,0,0),p(10,10,1e9))
 ])assert.throws(()=>cut(bad,diag(12)),/finite axis-aligned box/);
 assert.throws(()=>cut(box(),plane(p(0,0,0),p(0,0,0))),/degenerate/);
 assert.throws(()=>cut(null,diag(12)),/finite axis-aligned box/);
});
test('04 stable results and source provenance do not mutate or overclaim user source',()=>{
 const a=box(),pl=diag(12),f=cut(a,pl);
 assert.deepEqual(f,cut(structuredClone(a),structuredClone(pl)));
 assert.deepEqual(a,box());assert.deepEqual(pl,diag(12));
 assert.equal(f.proof.projectedCoordinateOnly,true);
 assert.equal(f.firstAngleConventionVerified,false);
 assert.doesNotMatch(JSON.stringify(f),/"v5StepsReady":true|"visibilityVerified":true|"globallyUnique":true/);
});
