'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyConvexPointRayClearance:verify}=
 require('../../core/numeric/convex-point-ray-clearance.cjs');
const P=(x,y,z)=>({x,y,z});
function box(min,max){
 const halfspaces=[];
 for(const k of ['x','y','z'])for(const [name,sign]of [['min',-1],['max',1]]){
  const normal=P(0,0,0);normal[k]=sign;
  halfspaces.push({id:k+name,normal,
   offsetMm:sign*(name==='min'?min[k]:max[k])});
 }
 return {id:'ClosedBox',halfspaces};
}
const solid=box(P(0,0,2),P(10,10,4));
const run=(point,observerDirection=P(0,0,1),change={})=>verify({
 point,observerDirection,solid,...change});
test('positive ray from an actual outward model-3d support vertex clears full convex source body',()=>{
 const r=run(P(0,0,4));
 assert.equal(r.status,'certified-clear');
 assert.equal(r.reason,'outward-support-positive-open-ray');
 assert.equal(r.positiveOpenRayClearVerified,true);
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.projectedJunctionVisibleVerified,false);
 assert.equal(r.sourceEndpointJoinVerified,false);
 assert.equal(r.officialLineStyleVerified,false);
 assert.equal(r.v5Ready,false);
 assert.equal(Object.isFrozen(r),true);
});
test('opposite observer, hidden inner surface and ray passing through volume stay undetermined',()=>{
 for(const [p,d] of [
  [P(2,2,2),P(0,0,1)],
  [P(5,5,3),P(0,0,1)],
  [P(2,2,4),P(0,0,-1)],
  [P(0,0,2),P(0,0,1)]
 ]){
  const r=run(p,d);
  assert.equal(r.status,'undetermined');
  assert.equal(r.positiveOpenRayClearVerified,false);
 }
});
test('exterior clear rays, translation and scaled outward normals preserve ray proof',()=>{
 assert.equal(run(P(-5,4,0)).status,'certified-clear');
 assert.equal(run(P(2,2,4),P(0,0,90)).status,'certified-clear');
 const shift=P(20,-15,34);
 const translated={...solid,halfspaces:solid.halfspaces.map(f=>({
  ...f,offsetMm:7*(f.offsetMm+
   f.normal.x*shift.x+f.normal.y*shift.y+f.normal.z*shift.z),
  normal:P(7*f.normal.x,7*f.normal.y,7*f.normal.z)
 }))};
 assert.equal(run(P(20, -15,38),P(0,0,1),{solid:translated}).status,
  'certified-clear');
});
test('grazing projected silhouette support remains uncertain rather than promoting a visible line',()=>{
 assert.equal(run(P(0,0,0),P(0,0,1)).status,'undetermined');
 assert.equal(run(P(10,5,3),P(0,1,0)).status,'undetermined');
});
test('forged halfspace, degenerate observer or unsupported tolerance fails closed',()=>{
 for(const options of [
  {point:{...P(0,0,4),w:1}},
  {observerDirection:P(0,0,0)},
  {solid:{...solid,halfspaces:solid.halfspaces.slice(0,2)}},
  {solid:{...solid,halfspaces:[...solid.halfspaces,solid.halfspaces[0]]}},
  {solid:{...solid,halfspaces:solid.halfspaces.map((f,i)=>
   i===0?{...f,normal:P(0,0,0)}:f)}},
  {marginMm:0},
  {angleTolerance:-1}
 ])assert.throws(()=>run(P(0,0,4),P(0,0,1),options));
});
