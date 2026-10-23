'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pyramidPlaneSection:solve}=
 require('../../engines/spatial/sections/rectangular-pyramid-plane.cjs');
const p=(x,y,z)=>({x,y,z});
const pyramid=()=>({base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)});
const plane=(point,normal)=>({point,normal});
const diagonal=k=>plane(p(0,0,k),p(1,1,1));
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,String(a)+' differs from '+String(b));
function proof(o,n){
 assert.equal(o.status,'ready');
 assert.equal(o.verified,true);assert.equal(o.perimeterVerified,true);
 assert.equal(o.edgeCount,n);assert.equal(o.vertices.length,n);
 assert.equal(o.perimeter.length,n);
 assert.equal(o.proof.sourcePyramidEdges,8);
 assert.equal(o.proof.sourcePyramidFaces,5);
 assert.equal(o.proof.uniqueContainingFaces,n);
 assert.equal(o.proof.polygonDegreeTwo,true);
 assert.equal(o.visibilityVerified,false);assert.equal(o.v5StepsReady,false);
 assert.equal(o.firstAngleConventionSignedOff,false);
 assert.equal(o.globallyUnique,null);
 assert.ok(o.maxResidualMm<1e-6);
 assert.ok(o.perimeterMm>0);assert.ok(o.areaMm2>0);
 for(const [i,q] of o.vertices.entries()){
  assert.match(q.sourceEdgeId,/^(apex|base)-edge-[0-3]$/);
  assert.ok(q.sourceEdgeParameter>0&&q.sourceEdgeParameter<1);
  near(q.planeResidualMm,0);
  const e=o.perimeter[i];
  assert.equal(e.fromId,q.id);assert.equal(e.toId,o.vertices[(i+1)%n].id);
  assert.match(e.sourceFaceId,/^(base|side-[0-3])$/);
  assert.ok(e.faceResidualMm<1e-6);
  assert.ok(e.lengthMm>0);
  assert.deepEqual(q.projection,{V:{u:q.point.x,v:q.point.z},
   H:{u:q.point.x,v:q.point.y},W:{u:q.point.y,v:q.point.z}});
 }
}
test('04 strict horizontal pyramid section is a 4-sided similarity polygon',()=>{
 const a=solve(pyramid(),plane(p(0,0,8),p(0,0,1)));
 proof(a,4);
 const side=10*(15-8)/15;
 near(a.areaMm2,side*side);
 near(a.perimeterMm,4*side);
 assert.ok(a.vertices.every(q=>Math.abs(q.point.z-8)<1e-8));
 assert.ok(a.perimeter.every(e=>e.sourceFaceId.startsWith('side-')));
});
test('04 diagonal near one base corner gives a genuine triangular section',()=>{
 const s=solve(pyramid(),diagonal(3));proof(s,3);
 assert.ok(s.perimeter.some(x=>x.sourceFaceId==='base'));
 for(const q of s.vertices)near(q.point.x+q.point.y+q.point.z,3);
});
test('04 diagonal above three base corners gives actual five-sided cut, never synthetic template',()=>{
 const s=solve(pyramid(),diagonal(15));proof(s,5);
 assert.ok(s.perimeter.some(x=>x.sourceFaceId==='base'));
 assert.equal(new Set(s.perimeter.map(x=>x.sourceFaceId)).size,5);
 for(const q of s.vertices)near(q.point.x+q.point.y+q.point.z,15);
});
test('04 cuts outside pyramid return no fake vertices or steps',()=>{
 for(const k of [-1,16,50]){
  const r=solve(pyramid(),plane(p(0,0,k),p(0,0,1)));
  assert.equal(r.status,'none');assert.deepEqual(r.vertices,[]);
  assert.equal(r.perimeterVerified,false);assert.equal(r.v5StepsReady,false);
 }
});
test('04 plane through apex, base vertex or coincident base blocks pending topology proof',()=>{
 for(const section of [plane(p(0,0,0),p(0,0,1)),
  plane(p(0,0,15),p(0,0,1)),diagonal(0),diagonal(25)]){
  const r=solve(pyramid(),section);
  assert.equal(r.status,'boundary-degenerate');
  assert.deepEqual(r.perimeter,[]);assert.equal(r.verified,false);
 }
});
test('04 translated pyramid and cutting plane retain area/perimeter/topology',()=>{
 const a=solve(pyramid(),diagonal(15));
 const shifted={base:{minX:7,minY:-4,maxX:17,maxY:6,z:3},apex:p(12,1,18)};
 const b=solve(shifted,plane(p(7,-4,18),p(1,1,1)));
 proof(a,5);proof(b,5);
 near(a.areaMm2,b.areaMm2);near(a.perimeterMm,b.perimeterMm);
 for(const q of a.vertices)assert.ok(b.vertices.some(v=>
  Math.hypot(v.point.x-q.point.x-7,v.point.y-q.point.y+4,v.point.z-q.point.z-3)<1e-6));
});
test('04 doubling all model lengths quadruples cut area',()=>{
 const a=solve(pyramid(),diagonal(15));
 const bigger={base:{minX:0,minY:0,maxX:20,maxY:20,z:0},apex:p(10,10,30)};
 const b=solve(bigger,diagonal(30));
 proof(a,5);proof(b,5);
 near(b.areaMm2,4*a.areaMm2);near(b.perimeterMm,2*a.perimeterMm);
});
test('04 reversed scaled plane normal preserves geometry and face provenance',()=>{
 const a=solve(pyramid(),diagonal(15));
 const b=solve(pyramid(),plane(p(0,0,15),p(-30,-30,-30)));
 proof(a,5);proof(b,5);
 near(a.areaMm2,b.areaMm2);near(a.perimeterMm,b.perimeterMm);
 assert.deepEqual(new Set(a.vertices.map(x=>x.sourceEdgeId)),new Set(b.vertices.map(x=>x.sourceEdgeId)));
});
test('04 off-center apex strictly within base preserves actual four face edges',()=>{
 const shape=pyramid();shape.apex=p(3,7,17);
 const r=solve(shape,plane(p(0,0,8),p(0,0,1)));
 proof(r,4);assert.ok(r.vertices.every(x=>Math.abs(x.point.z-8)<1e-7));
});
test('04 invalid apex, base sizes, degenerate plane cannot be solved',()=>{
 for(const bad of [
  {...pyramid(),apex:p(0,5,15)}, {...pyramid(),apex:p(15,5,15)},
  {...pyramid(),apex:p(5,5,0)},
  {...pyramid(),base:{...pyramid().base,maxY:0}},
  {...pyramid(),base:{...pyramid().base,maxX:1e9}}
 ])assert.throws(()=>solve(bad,diagonal(15)),/pyramid|finite/i);
 assert.throws(()=>solve(pyramid(),plane(p(0,0,0),p(0,0,0))),/degenerate/);
});
test('04 reproducible solution and no mutation of original input',()=>{
 const shape=pyramid(),section=diagonal(15),copy=structuredClone(shape);
 const a=solve(shape,section),b=solve(structuredClone(shape),structuredClone(section));
 assert.deepEqual(a,b);assert.deepEqual(shape,copy);assert.deepEqual(section,diagonal(15));
});
