'use strict';
// Independent native T-junction metamorphic checks: the real original 3D
// front depth, not paper coincidence, decides a contradictory closed ray.
const test=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../core/projection/conventions.js');
const {exactNativeClosedRayTJunctionDepthConflict:conflict}=
 require('../workbench/c1-real-occt-m5-visible-contour-parity.cjs');
const axes={V:['x','z','y'],H:['x','y','z'],W:['y','z','x']};
const xyz=(u,v,depth,axes)=>({x:0,y:0,z:0,
 [axes[0]]:u,[axes[1]]:v,[axes[2]]:depth});
const segment=(a,b,view)=>({from:project(a)[view],to:project(b)[view],from3D:a,to3D:b});
const reverse=s=>({from:s.to,to:s.from,from3D:s.to3D,to3D:s.from3D});
test('native vertical source axis detects strict T junction depth conflicts symmetrically in V/H/W',()=>{
 for(const [view,axis] of Object.entries(axes)){
  const base=segment(xyz(0,0,0,axis),xyz(0,4,0,axis),view);
  const branch=d=>segment(xyz(0,2,d,axis),xyz(3,2,d,axis),view);
  for(const d of [Number.MIN_VALUE,1,1e200]){
   const b=branch(d);
   assert.equal(conflict(base,b,view),true);
   assert.equal(conflict(b,base,view),true);
   assert.equal(conflict(reverse(base),reverse(b),view),true);
  }
  assert.equal(conflict(base,branch(0),view),false);
 }
});
test('native vertical source T contact at an endpoint is not an interior contradiction',()=>{
 for(const [view,axis] of Object.entries(axes)){
  const base=segment(xyz(0,0,0,axis),xyz(0,4,0,axis),view);
  const branch=segment(xyz(0,4,1,axis),xyz(3,4,1,axis),view);
  assert.equal(conflict(base,branch,view),false);
 }
});
test('paper gap of one minimum subnormal never becomes a native T junction',()=>{
 for(const [view,axis] of Object.entries(axes)){
  const base=segment(xyz(0,0,0,axis),xyz(0,4,0,axis),view);
  const branch=segment(xyz(Number.MIN_VALUE,2,1,axis),xyz(3,2,1,axis),view);
  assert.equal(conflict(base,branch,view),false);
 }
});
