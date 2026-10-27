'use strict';
// Real M5 native T-junction depth contradictions must survive a common
// physical translation. This does not certify OCCT TopoDS history or V5.
const test=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {exactNativeClosedRayTJunctionDepthConflict:conflict}=
 require('../../workbench/c1-real-occt-m5-visible-contour-parity.cjs');
const axes={V:['x','z','y'],H:['x','y','z'],W:['y','z','x']};
const xyz=(u,v,d,axes)=>({x:0,y:0,z:0,
 [axes[0]]:u,[axes[1]]:v,[axes[2]]:d});
const shift=(p,t)=>({x:p.x+t.x,y:p.y+t.y,z:p.z+t.z});
const seg=(a,b,view)=>({from:project(a)[view],to:project(b)[view],from3D:a,to3D:b});
test('native T-junction depth contradiction is translation-invariant on exact integer coordinates',()=>{
 for(const [view,axis] of Object.entries(axes)){
  const a=xyz(0,0,0,axis),b=xyz(4,0,0,axis),
   c=xyz(2,0,3,axis),d=xyz(2,3,3,axis);
  assert.equal(conflict(seg(a,b,view),seg(c,d,view),view),true);
  for(const t of [{x:0,y:0,z:0},{x:8,y:16,z:32},{x:-16,y:8,z:-4}]){
   const left=seg(shift(a,t),shift(b,t),view);
   const right=seg(shift(c,t),shift(d,t),view);
   assert.equal(conflict(left,right,view),true);
   assert.equal(conflict(right,left,view),true);
  }
 }
});
test('genuine translated 3D T-junction stays non-conflicting',()=>{
 for(const [view,axis] of Object.entries(axes)){
  const a=xyz(0,0,0,axis),b=xyz(4,0,0,axis),
   c=xyz(2,0,0,axis),d=xyz(2,3,0,axis);
  for(const t of [{x:0,y:0,z:0},{x:8,y:16,z:32},{x:-16,y:8,z:-4}]){
   assert.equal(conflict(seg(shift(a,t),shift(b,t),view),
    seg(shift(c,t),shift(d,t),view),view),false);
  }
 }
});
