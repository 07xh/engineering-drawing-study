'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {reconcileThreeViewSourceContacts:reconcile}=
 require('../../core/projection/three-view-source-contact-concordance.cjs');
const {auditC3ThreeViewPhysicalContactConcordance:audit}=
 require('../../workbench/c3-three-view-physical-contact-concordance.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const p=(x,y,z)=>({x,y,z});
const item=(view,eventId,curvePoint3D,capPoint3D=curvePoint3D,extra={})=>({
 view,eventId,branchId:'branchA',featureId:'capLineB',
 curvePoint3D,capPoint3D,
 projectedUV:project(curvePoint3D)[view],
 capSourceDomainVerified:true,...extra
});
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('independent V/H/W witnesses with one genuine source 3D point are grouped, not re-solved',()=>{
 const q=p(3,4,5),r=reconcile({revision:2,records:[
  item('V','v1',q),item('H','h1',q),item('W','w1',q)
 ]});
 assert.equal(r.spatialContactCount,1);
 assert.equal(r.allThreeViewWitnessCount,1);
 assert.equal(r.paperOnlyOrDepthSeparatedWitnessCount,0);
 assert.deepEqual(r.spatialContacts[0].viewCoverage,['V','H','W']);
 assert.deepEqual(r.spatialContacts[0].views.V,['v1']);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.completePhysicalFeatureGraphJoinsVerified,false);
 assert.equal(Object.isFrozen(r.spatialContacts[0]),true);
});
test('same W projected point but different true 3D source depth is never a physical join',()=>{
 const curve=p(1,4,5),cap=p(9,4,5);
 const r=reconcile({revision:1,records:[
  item('W','w',curve,cap),item('V','v',curve)
 ]});
 assert.equal(r.paperOnlyOrDepthSeparatedWitnessCount,1);
 assert.equal(r.spatialContactCount,1);
 assert.equal(r.incompleteViewWitnessCount,1);
 assert.deepEqual(r.spatialContacts[0].viewCoverage,['V']);
 assert.equal(r.inferred3DJoinsFrom2DPosition,false);
});
test('distinct source branch IDs remain different physical groups even at same spatial XYZ',()=>{
 const q=p(1,2,3),r=reconcile({revision:4,records:[
  item('V','one',q),item('W','two',q,q,{branchId:'branchB'})
 ]});
 assert.equal(r.spatialContactCount,2);
 assert.equal(r.allThreeViewWitnessCount,0);
});
test('forged source projection, repeated event and broken coordinate inputs are rejected',()=>{
 const q=p(1,2,3),valid=item('V','a',q);
 assert.throws(()=>reconcile({revision:1,records:[
  {...valid,projectedUV:{u:8,v:8}}]}),/disagrees/);
 assert.throws(()=>reconcile({revision:1,records:[valid,valid]}),/duplicate/);
 assert.throws(()=>reconcile({revision:1,records:[
  {...valid,capPoint3D:p(NaN,0,0)}]}),/full source/);
 assert.throws(()=>reconcile({revision:1,records:[
  {...valid,view:'M'}]}),/full source/);
 assert.throws(()=>reconcile({revision:1,records:[],
  tolerance:Infinity}),/bounded current/);
});
test('real C3 cap clipping keeps independent paper overlap, branch and physical contact witnesses',()=>{
 const s=input();s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 s.zCylinder.zMin=-5;s.zCylinder.zMax=5;
 const evidence=audit({input:s,revision:11});
 assert.equal(evidence.status,'scoped-C3-source-VHW-contact-concordance');
 assert.equal(evidence.originalWInverseRadicalContactCount>0,true);
 assert.equal(evidence.witnesses.length,evidence.sourceWitnessCount);
 assert.equal(evidence.spatialContactCount,evidence.spatialContacts.length);
 assert.ok(evidence.spatialContacts.every(c=>
  ['V','H','W'].every(view=>Array.isArray(c.views[view]))));
 assert.ok(evidence.witnesses.every(w=>w.standardLineStyle==='undetermined'));
 assert.equal(evidence.allProjectedCurvesAndOutlineCrossingsCertified,false);
 assert.equal(evidence.sourceJunctionTopologyCertified,false);
 const existing=joint({input:s,revision:11,solidOperation:'intersection'});
 assert.equal(existing.threeViewPhysicalContactEvidence.status,evidence.status);
 assert.equal(existing.allThreeViewCurveCapSourceContactsReconciledWithinScope,
  evidence.allSourceViewsEnumerated);
 assert.equal(existing.officialLineStylesVerified,false);
 assert.equal(existing.v5CurveReady,false);
});
test('unclipped cap-free C3 is an empty identity ledger without claiming final contours',()=>{
 const proof=audit({input:input(),revision:8});
 assert.equal(proof.status,'scoped-C3-source-VHW-contact-concordance');
 assert.equal(proof.sourceWitnessCount,0);
 assert.equal(proof.spatialContactCount,0);
 assert.equal(proof.officialLineStylesVerified,false);
 const none=input();none.yCylinder.xCenter=80;
 const blocked=audit({input:none,revision:8});
 assert.equal(blocked.status,'not-covered');
 assert.equal(blocked.finalV5StrokeAuthorized,false);
});
