'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3WMirrorCapContactPartition:audit}=
 require('../../workbench/c3-w-mirror-cap-contact-partition.cjs');
const {auditC3WExactMirrorDepthOrder:mirror}=
 require('../../workbench/c3-w-mirror-depth-order.cjs');
const {auditC3WAnalyticCurveCapContacts:caps}=
 require('../../workbench/c3-w-analytic-curve-cap-contacts.cjs');
const {auditC3SelectedBooleanVHWOpenRays:rays}=
 require('../../workbench/c3-selected-boolean-vhw-open-rays.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:0,zCenter:0,yMin:-17,yMax:17}});
const source=(src,operation='union',revision=61)=>{
 const selected=rays({input:src,revision,solidOperation:operation});
 return {input:src,revision,
  mirrorEvidence:mirror({input:src,revision,selectedRayEvidence:selected}),
  wCapEvidence:caps({input:src,revision})};
};
test('real equal-center C3 W mirror source has complete bounded cap-line event-free atomic open cells',()=>{
 for(const operation of ['intersection','union']){
  const src=model(),proof=audit(source(src,operation));
  assert.ok(['scoped-mirror-depth-and-cap-line-event-partition',
   'partial-unassigned-mirror-cap-source-events'].includes(proof.status));
  assert.ok(proof.originalMirroredOpenCellCount>=4);
  assert.ok(proof.atomicMirroredOpenCellCount>=proof.originalMirroredOpenCellCount);
  assert.equal(proof.atomicMirroredOpenCells.length,proof.atomicMirroredOpenCellCount);
  for(const x of proof.atomicMirroredOpenCells){
   assert.ok(x.frontOriginalXOpenRange[1]>x.frontOriginalXOpenRange[0]);
   assert.ok(x.rearOriginalXOpenRange[1]>x.rearOriginalXOpenRange[0]);
   assert.equal(x.allEnumeratedOriginalCapSourceLinesHaveNoInteriorCrossing,true);
   assert.equal(x.sameSourceMirrorStrictFrontDepthProven,true);
   assert.equal(x.adjacentBoundaryEventsHaveCompleteJunctionProof,false);
   assert.equal(x.unrelatedProjectedSolidOutlineOcclusionResolved,false);
   assert.equal(x.standardLineStyle,'undetermined');
   assert.equal(x.v5ActionAuthorized,false);
  }
  assert.equal(proof.globalProjectedFeatureDepthVerified,false);
  assert.equal(proof.closedSourceJunctionContinuityVerified,false);
  assert.equal(proof.officialV5Authorized,false);
  assert.equal(Object.isFrozen(proof.atomicMirroredOpenCells),true);
 }
});
test('real M3/M5 C3 joint exposes scoped W cap/mirror cross-audit without signing strokes',()=>{
 const src=model(),all=joint({input:src,revision:62,solidOperation:'union'});
 const proof=all.wMirrorCapContactPartition;
 assert.equal(proof.revision,62);
 assert.ok(proof.atomicMirroredOpenCellCount>0);
 assert.equal(all.wExactMirrorDepthEvidence.sameSignedLateralSourceWDepthOrderProven,true);
 assert.equal(proof.engineeringLineStylesCertified,false);
 assert.equal(proof.officialV5Authorized,false);
 assert.equal(all.v5CurveReady,false);
});
test('finite cap cut configurations retain independent W projected cap contact source identities',()=>{
 const src=model();
 src.yCylinder.yMin=-10;
 src.yCylinder.yMax=10;
 src.zCylinder.zMin=-7;
 src.zCylinder.zMax=7;
 const evidence=source(src,'union',63);
 const proof=audit(evidence);
 assert.ok(evidence.wCapEvidence.events.length>0,
  'real cap line intersections must be independently enumerated');
 assert.equal(proof.originalMirroredOpenCellCount,
  evidence.mirrorEvidence.verifiedMirroredOpenDepthCellCount);
 assert.equal(proof.atomicMirroredOpenCells.length,
  proof.atomicMirroredOpenCellCount);
 assert.equal(proof.officialV5Authorized,false);
 for(const e of proof.projectedCapContactEvents){
  assert.ok(['cap-in-front-of-curve','cap-behind-curve',
   'coincident-W-depth-or-physical-join'].includes(e.capRelativeToSourceCurveWDepth));
  assert.equal(e.v5ActionAuthorized,false);
 }
});
test('fake source feature / forged 3D point cannot become a W mirror cap cut',()=>{
 const src=model();
 src.yCylinder.yMax=10;src.yCylinder.yMin=-10;
 src.zCylinder.zMax=7;src.zCylinder.zMin=-7;
 const evidence=source(src,'intersection',64);
 assert.ok(evidence.wCapEvidence.events.length>0);
 const forged=JSON.parse(JSON.stringify(evidence.wCapEvidence));
 forged.events[0].sourceCapFeatureId='nonexistent-real-cap';
 assert.throws(()=>audit({...evidence,wCapEvidence:forged}),
  /lacks real current M3 branch or cap source/);
 const shift=JSON.parse(JSON.stringify(evidence.wCapEvidence));
 shift.events[0].sourceCurve3DPoint.y+=0.5;
 assert.throws(()=>audit({...evidence,wCapEvidence:shift}),
  /does not lie on true signed M3 curve|same M3 W projected source/);
});
test('unselected or distinct-center W source cannot impersonate a mirrored cap contact certificate',()=>{
 const src=model(),revision=65;
 const unselected=rays({input:src,revision});
 const x=audit({input:src,revision,
  mirrorEvidence:mirror({input:src,revision,selectedRayEvidence:unselected}),
  wCapEvidence:caps({input:src,revision})});
 assert.equal(x.status,'not-covered');
 assert.equal(x.officialV5Authorized,false);
 const offset=model();offset.yCylinder.xCenter=2;
 const blocked=audit(source(offset,'union',66));
 assert.equal(blocked.status,'not-covered');
 assert.equal(blocked.atomicMirroredOpenCellCount,0);
 assert.throws(()=>audit({...source(src,'union',67),revision:68}),
  /current independent W mirror and cap contact witnesses required/);
});
