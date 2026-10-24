'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {classifyConvexPolytopeBoundaryRay:ray}=
 require('../../core/numeric/convex-polytope-boundary-ray.cjs');
const P=(x,y,z)=>({x,y,z});
const base=[
 {id:'xmin',normal:P(-1,0,0),offsetMm:0},
 {id:'xmax',normal:P(1,0,0),offsetMm:10},
 {id:'ymin',normal:P(0,-1,0),offsetMm:0},
 {id:'ymax',normal:P(0,1,0),offsetMm:10},
 {id:'zmin',normal:P(0,0,-1),offsetMm:0},
 {id:'zmax',normal:P(0,0,1),offsetMm:10},
 {id:'cut',normal:P(1,1,1),offsetMm:12}
];
const point=P(0,2,10);
const solve=(d,more={})=>ray({point,observerDirection:d,halfspaces:base,...more});
test('M0 multi-support vertex ray is hidden only when it enters every active convex face',()=>{
 const inward=solve(P(1,-3,-1));
 assert.equal(inward.status,'ready');
 assert.equal(inward.visibility,'hidden');
 assert.equal(inward.pointRayCertified,true);
 assert.deepEqual(inward.activeFaceIds,['xmin','zmax','cut']);
 assert.equal(inward.endpointJoinCertified,false);
 const removed=solve(P(0,0,1));
 assert.equal(removed.visibility,'visible');
 assert.equal(removed.reason,'ray-immediately-exits-a-supporting-halfspace');
 const tangent=solve(P(0,-1,0));
 assert.equal(tangent.visibility,'undetermined');
 assert.equal(tangent.pointRayCertified,false);
 const outside=solve(P(-1,0,0));
 assert.equal(outside.visibility,'visible');
});
test('M0 exact retained-solid inequality agrees with local forward ray witnesses',()=>{
 const eq=p=>base.every(f=>f.normal.x*p.x+f.normal.y*p.y+
   f.normal.z*p.z<=f.offsetMm+1e-9);
 for(const direction of [P(1,-3,-1),P(0,0,1),P(-1,0,0),P(1,-2,-2)]){
  const a=solve(direction);
  if(a.visibility==='undetermined')continue;
  const n=Math.hypot(direction.x,direction.y,direction.z);
  for(const step of [1e-4,1e-3]){
   const t=step/n;
   const next=P(point.x+direction.x*t,point.y+direction.y*t,
    point.z+direction.z*t);
   assert.equal(eq(next),a.visibility==='hidden');
  }
 }
});
test('M0 translation, equivalent face scaling and observer scale preserve point-ray signs',()=>{
 const shift=P(37,-19,11);
 const translate=f=>({...f,offsetMm:f.offsetMm+
  f.normal.x*shift.x+f.normal.y*shift.y+f.normal.z*shift.z});
 for(const direction of [P(1,-3,-1),P(0,0,1),P(0,-1,0)]){
  const a=solve(direction);
  const b=ray({point:P(point.x+shift.x,point.y+shift.y,point.z+shift.z),
   observerDirection:P(direction.x*7,direction.y*7,direction.z*7),
   halfspaces:base.map(translate)});
  assert.equal(a.visibility,b.visibility);
  const doubled=base.map(f=>({
   ...f,normal:P(2*f.normal.x,2*f.normal.y,2*f.normal.z),
   offsetMm:f.offsetMm*2
  }));
  assert.equal(solve(direction,{halfspaces:doubled}).visibility,a.visibility);
 }
});
test('M0 forged/outside/inside, incomplete or singular polytope fails closed',()=>{
 assert.equal(ray({point:P(11,2,10),observerDirection:P(1,0,0),
  halfspaces:base}).status,'not-on-polytope');
 assert.equal(ray({point:P(2,2,2),observerDirection:P(1,0,0),
  halfspaces:base}).status,'not-boundary');
 for(const invalid of [
  {observerDirection:P(0,0,0)},
  {observerDirection:P(Infinity,0,0)},
  {point:P(NaN,2,10)},
  {halfspaces:base.slice(0,3)},
  {halfspaces:[...base,base[0]]},
  {halfspaces:[...base.slice(0,6),{id:'cut',normal:P(0,0,0),offsetMm:12}]},
  {positionToleranceMm:-1},
  {directionTolerance:0},
  {halfspaces:[...base.slice(0,6),{id:'cut',normal:P(1,0,0),offsetMm:Infinity}]}
 ]){
  assert.throws(()=>solve(P(0,0,1),invalid));
 }
});
