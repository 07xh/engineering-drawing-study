'use strict';
/** Independent analytic halfspace and two-projection oracle for the FIVE
 * pre-existing M0 ray and edge consumers. No renderer/V5 promotion. */
const test=require('node:test');
const assert=require('node:assert/strict');
const {intersectConvexRayHalfspaces,traceConvexRayDepth}=
 require('../../core/numeric/convex-ray-depth.cjs');
const {certifyConvexPointRayClearance}=
 require('../../core/numeric/convex-point-ray-clearance.cjs');
const {certifyConvexSegmentClearance}=
 require('../../core/numeric/convex-segment-clearance.cjs');
const {certifyConvexSegmentOcclusion}=
 require('../../core/numeric/convex-segment-occlusion.cjs');
const {inspectProjectedEdgeDepth}=
 require('../../core/numeric/projected-edge-depth-events.cjs');
const V=(x,y,z)=>({x,y,z});
function box(id,min,max){
 const halfspaces=[];
 for(const axis of ['x','y','z'])
  for(const side of ['min','max']){
   const sign=side==='min'?-1:1,n=V(0,0,0);
   n[axis]=sign;
   halfspaces.push({id:axis+side,normal:n,offsetMm:sign*(side==='min'?min[axis]:max[axis])});
  }
 return {id,halfspaces};
}
const occluder=box('Block',V(0,0,2),V(10,10,4));
const source={id:'Source',from:V(-5,5,0),to:V(15,5,0)};
const observer=V(0,0,1);
test('same first-angle +Z ray analytical entry/exit and independent midpoint inclusion',()=>{
 const p=V(5,5,0);
 const raw=intersectConvexRayHalfspaces({point:p,observerDirection:observer,halfspaces:occluder.halfspaces});
 assert.equal(raw.status,'hit');
 assert.equal(raw.entryMm,2);
 assert.equal(raw.exitMm,4);
 const at=t=>V(5,5,t);
 const inside=q=>occluder.halfspaces.every(f=>
  f.normal.x*q.x+f.normal.y*q.y+f.normal.z*q.z<=f.offsetMm);
 assert.equal(inside(at((raw.entryMm+raw.exitMm)/2)),true);
 assert.equal(inside(at(1)),false);
 assert.equal(inside(at(5)),false);
 const total=traceConvexRayDepth({point:p,observerDirection:observer,solids:[occluder]});
 assert.equal(total.status,'occluded');
 assert.equal(total.completeSceneVerified,false);
 assert.equal(total.officialLineStyleVerified,false);
});
test('M0 point ray and continuous source segment distinguish clear from hidden',()=>{
 const top=certifyConvexPointRayClearance({
  point:V(5,5,4),observerDirection:observer,solid:occluder});
 const bottom=certifyConvexPointRayClearance({
  point:V(5,5,2),observerDirection:observer,solid:occluder});
 assert.equal(top.status,'certified-clear');
 assert.equal(bottom.status,'undetermined');
 const left=certifyConvexSegmentClearance({
  source,solid:occluder,observerDirection:observer,sourceParameterRange:[0,.1]});
 const middle=certifyConvexSegmentClearance({
  source,solid:occluder,observerDirection:observer,sourceParameterRange:[.3,.7]});
 assert.equal(left.status,'certified-clear');
 assert.equal(middle.status,'undetermined');
 const hidden=certifyConvexSegmentOcclusion({
  source,solid:occluder,observerDirection:observer});
 assert.equal(hidden.status,'certified-open-interval');
 assert.ok(hidden.openSourceParameterRange[0]>=.24&&hidden.openSourceParameterRange[0]<.26);
 assert.ok(hidden.openSourceParameterRange[1]>.74&&hidden.openSourceParameterRange[1]<=.76);
 assert.equal(hidden.officialLineStyleVerified,false);
});
test('projected finite crossing depth uses shared numeric kernel and scoped evidence',()=>{
 const result=inspectProjectedEdgeDepth({
  first:{id:'First',from:V(-1,0,0),to:V(1,0,0)},
  second:{id:'Second',from:V(0,-1,2),to:V(0,1,2)},
  view:'H'});
 assert.equal(result.status,'crossing');
 assert.equal(result.events[0].front,'second');
 assert.equal(result.events[0].depthDeltaMm,-2);
 assert.equal(result.completeOcclusionVerified,false);
 assert.equal(result.v5Ready,false);
});
test('rescaled outward halfspaces and translated origin preserve five distinct M0 scopes',()=>{
 const shift=V(8,-3,17);
 const moved={id:'Block',halfspaces:occluder.halfspaces.map(f=>({
  id:f.id,normal:V(7*f.normal.x,7*f.normal.y,7*f.normal.z),
  offsetMm:7*(f.offsetMm+
   f.normal.x*shift.x+f.normal.y*shift.y+f.normal.z*shift.z)
 }))};
 const translated=p=>V(p.x+shift.x,p.y+shift.y,p.z+shift.z);
 const movedSource={id:source.id,from:translated(source.from),to:translated(source.to)};
 assert.equal(intersectConvexRayHalfspaces({
  point:translated(V(5,5,0)),observerDirection:V(0,0,17),
  halfspaces:moved.halfspaces}).status,'hit');
 assert.equal(certifyConvexPointRayClearance({
  point:translated(V(5,5,4)),observerDirection:observer,solid:moved}).status,'certified-clear');
 assert.equal(certifyConvexSegmentClearance({
  source:movedSource,observerDirection:observer,solid:moved,
  sourceParameterRange:[0,.1]}).status,'certified-clear');
 assert.equal(certifyConvexSegmentOcclusion({
  source:movedSource,observerDirection:observer,solid:moved}).status,'certified-open-interval');
});
test('underflow in representable normals and source coordinates is not evidence of zero dot product',()=>{
 const tiny=box('Tiny',V(0,0,2),V(10,10,4));
 tiny.halfspaces[0]={...tiny.halfspaces[0],normal:V(-1,1e-200,0)};
 const weird=V(1,1e-200,0);
 for(const f of [
  ()=>intersectConvexRayHalfspaces({point:weird,observerDirection:observer,
   halfspaces:tiny.halfspaces}),
  ()=>certifyConvexPointRayClearance({point:weird,observerDirection:observer,solid:tiny})
 ])assert.throws(f,/underflow/);
});
