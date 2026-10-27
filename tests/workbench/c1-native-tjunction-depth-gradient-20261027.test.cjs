'use strict';
// Verify native closed-ray T-junctions on non-constant original source depth.
// This tests the actual M5 consumer and never authorizes engineering style/V5.
const test=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {exactNativeClosedRayTJunctionDepthConflict:conflict}=
 require('../../workbench/c1-real-occt-m5-visible-contour-parity.cjs');
const axes={V:['x','z','y'],H:['x','y','z'],W:['y','z','x']};
const xyz=(u,v,d,axes)=>({x:0,y:0,z:0,
 [axes[0]]:u,[axes[1]]:v,[axes[2]]:d});
const seg=(a,b,view)=>({from:project(a)[view],to:project(b)[view],from3D:a,to3D:b});
const reverse=s=>({from:s.to,to:s.from,from3D:s.to3D,to3D:s.from3D});
test('sloped original depth is interpolated at native T junction, not compared with an endpoint',()=>{
 for(const [view,axis] of Object.entries(axes)){
  const line=seg(xyz(0,0,0,axis),xyz(4,0,8,axis),view);
  for(const [u,expectedDepth] of [[1,2],[2,4],[3,6]]){
   const shared=seg(xyz(u,0,expectedDepth,axis),xyz(u,3,expectedDepth,axis),view);
   assert.equal(conflict(line,shared,view),false);
   for(const otherDepth of [expectedDepth-1,expectedDepth+1]){
    const alias=seg(xyz(u,0,otherDepth,axis),xyz(u,3,otherDepth,axis),view);
    assert.equal(conflict(line,alias,view),true);
    assert.equal(conflict(alias,line,view),true);
    assert.equal(conflict(reverse(line),reverse(alias),view),true);
   }
  }
 }
});
