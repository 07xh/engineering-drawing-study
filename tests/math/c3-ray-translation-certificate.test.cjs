'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditC3TransitionRays:audit}=require('../../workbench/c3-transition-ray-candidates.cjs');
const source={kind:'finite-orthogonal-cylinder-intersection',sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}};
function translated(dx,dy,dz){return {...source,
 zCylinder:{...source.zCylinder,xCenter:dx,yCenter:dy,zMin:-18+dz,zMax:18+dz},
 yCylinder:{...source.yCylinder,xCenter:2+dx,zCenter:dz,yMin:-17+dy,yMax:17+dy}};}
test('C3 forward strict-volume ray evidence is invariant under common 3D translation',()=>{
 const point={x:-12,y:0,z:0};
 const delta={x:31,y:-27,z:43};
 for(const view of ['V','H','W']){
  const a=audit({input:source,point,view});
  const b=audit({input:translated(delta.x,delta.y,delta.z),
   point:{x:point.x+delta.x,y:point.y+delta.y,z:point.z+delta.z},view});
  assert.equal(b.positiveInteriorOcclusionVerified,a.positiveInteriorOcclusionVerified);
  assert.equal(b.endpointVisibilityStatus,a.endpointVisibilityStatus);
  assert.equal(b.unionInteriorOpenIntervals.length,a.unionInteriorOpenIntervals.length);
  for(let i=0;i<a.unionInteriorOpenIntervals.length;i++){
   const x=a.unionInteriorOpenIntervals[i],y=b.unionInteriorOpenIntervals[i];
   assert.deepEqual(y.supportingSolids,x.supportingSolids);
   assert.ok(Math.abs(y.range[0]-x.range[0])<1e-7);
   assert.ok(Math.abs(y.range[1]-x.range[1])<1e-7);
  }
  assert.equal(b.officialLineStyle,'undetermined');
  assert.equal(b.v5Authorized,false);
 }
});
