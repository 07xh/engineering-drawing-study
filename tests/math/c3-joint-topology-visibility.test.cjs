'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditC3JointTopologyVisibility:audit}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('C3 joint proof partitions all V/H/W branches but never signs V5',()=>{
 const result=audit({input:input(),revision:3});
 assert.equal(result.status,'scoped-open-interval-joint-evidence');
 assert.equal(result.allSourceBranchesAccountedFor,true);
 assert.ok(result.sourceBranchCount>0);
 for(const view of ['V','H','W'])
  assert.equal(new Set(result.intervals.filter(i=>i.view===view)
   .map(i=>i.branchId)).size,result.sourceBranchCount);
 for(const i of result.intervals){
  assert.ok(['clear','occluded','undetermined'].includes(i.openInteriorStatus));
  assert.equal(i.standardLineStyle,'undetermined');
  assert.equal(i.endpointVisibilityVerified,false);
  assert.equal(i.v5ActionAuthorized,false);
 }
 assert.ok(result.junctionGuards.length>0);
 assert.ok(result.junctionGuards.every(j=>j.fullFeatureJoinAuthorized===false));
 assert.ok(result.junctionGuards.every(j=>j.blockers.includes(
  'three-view-endpoint-visibility-not-certified')));
 assert.ok(result.intervals.every(i=>i.blockers.includes(
  'curve-endpoint-and-transition-visibility-unverified')));
 assert.equal(result.fullCurveTopologyVerified,false);
 assert.equal(result.officialLineStylesVerified,false);
 assert.equal(result.constructionIntentAuthorized,false);
 assert.equal(result.v5CurveReady,false);
});
test('C3 empty geometry cannot be promoted into a curve',()=>{
 const s=input();s.zCylinder.zMin=40;s.zCylinder.zMax=60;
 const result=audit({input:s,revision:4});
 assert.equal(result.status,'not-covered');
 assert.equal(result.intervals.length,0);
 assert.equal(result.v5CurveReady,false);
});
