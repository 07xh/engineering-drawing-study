'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditC3TransitionRays:audit}=require('../../workbench/c3-transition-ray-candidates.cjs');
const {auditC3JointTopologyVisibility:joint}=require('../../workbench/c3-joint-topology-visibility.cjs');
const input={kind:'finite-orthogonal-cylinder-intersection',sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}};
test('C3 ray quadratic candidates stay separate from official visibility',()=>{
 const p={x:12,y:0,z:0};
 for(const view of ['V','H','W']){
  const r=audit({input,point:p,view});
  assert.equal(r.officialLineStyle,'undetermined');
  assert.equal(r.v5Authorized,false);
  assert.equal(r.fullFiniteVolumeVisibilityVerified,false);
  for(const solid of [r.zCylinder,r.yCylinder]){
   assert.ok(['no-forward-boundary-intersection','forward-boundary-intersection',
    'undetermined-tangent-generator-or-origin'].includes(solid.rayBoundaryStatus));
   assert.ok(solid.events.every(e=>e.t>=0&&Number.isFinite(e.t)));
  }
 }
});
test('C3 joint graph exposes physical-junction ray candidates without V5',()=>{
 const r=joint({input,revision:7});
 assert.equal(r.status,'scoped-open-interval-joint-evidence');
 const guards=r.transitionGuards.filter(x=>x.junctionId!==undefined);
 assert.equal(guards.length,r.junctionGuards.length*3);
 for(const g of guards){
  assert.equal(g.finiteCylinderRayCandidates.view,g.view);
  assert.equal(g.finiteCylinderRayCandidates.v5Authorized,false);
  assert.equal(g.standardLineStyle,'undetermined');
 }
});
