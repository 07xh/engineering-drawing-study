'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditFiniteCylinderEndpointIncidence:audit}=
 require('../../workbench/m5-analytic-cylinder-endpoint-incidence.cjs');

function source(dx=0,dy=0,dz=0){
 return {kind:'finite-orthogonal-cylinder-intersection',sourceConfirmed:true,unit:'mm',
  zCylinder:{radius:12,xCenter:dx,yCenter:dy,zMin:dz-18,zMax:dz+18},
  yCylinder:{radius:9,xCenter:dx+2,zCenter:dz,yMin:dy-17,yMax:dy+17}};
}
function signatures(r){
 return r.components.map(c=>({
  shape:c.topologicalShape,
  degree:c.incidentDegreeWitnesses.map(d=>d.count).sort((a,b)=>a-b),
  branches:c.sourceBranchIds.length,
  verified:c.graphPathOrCycleVerifiedWithinLateralLateralScope
 })).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
test('C3 M5 physical incidence graph is invariant under translating both cylinders',()=>{
 const base=audit({input:source(),revision:11});
 assert.equal(base.status,'scoped-analytic-3d-endpoint-incidence');
 assert.ok(base.sourceM3BranchCount>0);
 assert.equal(base.allAnalyticSourceBranchesAccountedFor,true);
 for(const delta of [[31,-27,13],[-67,42,-19]]){
  const moved=audit({input:source(...delta),revision:11});
  assert.equal(moved.sourceM3BranchCount,base.sourceM3BranchCount);
  assert.equal(moved.componentCount,base.componentCount);
  assert.equal(moved.regularLocalC1JoinCount,base.regularLocalC1JoinCount);
  assert.equal(moved.unresolvedAnalyticJunctionCount,base.unresolvedAnalyticJunctionCount);
  assert.deepEqual(signatures(moved),signatures(base));
  assert.equal(moved.standardLineStylesVerified,false);
  assert.equal(moved.v5CurveReady,false);
  const before=base.junctions.map(j=>j.point3D);
  const after=moved.junctions.map(j=>j.point3D);
  assert.equal(after.length,before.length);
  for(let i=0;i<before.length;i++)
   for(const [axis,shift] of [['x',delta[0]],['y',delta[1]],['z',delta[2]]])
    assert.ok(Math.abs(after[i][axis]-before[i][axis]-shift)<1e-6,
     '3D physical junction must translate in '+axis);
 }
});
test('C3 M5 refuses graph and V5 certification for disjoint finite cylinders',()=>{
 const input=source();
 input.zCylinder.zMin=50;
 input.zCylinder.zMax=60;
 const result=audit({input,revision:12});
 assert.equal(result.status,'not-covered');
 assert.equal(result.sourceM3BranchCount,undefined);
 assert.equal(result.fullBranchTopologyVerified,false);
 assert.equal(result.standardLineStylesVerified,false);
 assert.equal(result.v5CurveReady,false);
});
