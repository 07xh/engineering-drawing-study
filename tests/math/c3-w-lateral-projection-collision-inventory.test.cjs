'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3WAllLateralProjectionCollisions:audit}=
 require('../../workbench/c3-w-lateral-projection-collision-inventory.cjs');
const {auditC3WMirrorExitOutlineConcordance:mirrorExit}=
 require('../../workbench/c3-w-mirror-exit-outline-concordance.cjs');
const {auditC3WMirrorSourceOutlineUnion:outlines}=
 require('../../workbench/c3-w-mirror-source-outline-union.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const {buildC3WIntervalPreview:preview}=
 require('../../workbench/c3-w-ray-preview.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:0,zCenter:0,yMin:-17,yMax:17}});
function source(input,revision=120,solidOperation='union'){
 const j=joint({input,revision,solidOperation});
 const originalW=preview({input,revision});
 const W=outlines({input,revision,
  capPartitionEvidence:j.wMirrorCapContactPartition,
  wRayPreview:originalW});
 const e=mirrorExit({input,revision,
  exitEvidence:j.wBooleanForwardExitDepth,outlineEvidence:W});
 return {input,revision,mirrorExitEvidence:e};
}
test('all true lateral W projected collisions are exactly front/rear equal-sign sources on real finite union/intersection',()=>{
 for(const operation of ['union','intersection']){
  const src=model(),args=source(src,120,operation),out=audit(args);
  assert.equal(out.status,'scoped-every-original-M3-lateral-W-projection-collision');
  assert.equal(out.differentSignedRadicalSourceFamilies,4);
  assert.equal(out.currentM3LateralSourceBranchCount,4);
  assert.equal(out.checkedMirrorAtomicOpenCells,
   args.mirrorExitEvidence.checkedMirroredAtomicOpenCells);
  assert.equal(out.sourceFlankInventories.length,8);
  assert.equal(out.completeSourceOpenFlankCount,8);
  assert.equal(out.entireOriginalM3OpenSourceInventoryExactlyOnce,true);
  assert.equal(out.allPositiveWSourceCurveProjectionCollisionsClassified,true);
  assert.equal(out.differentSignLateralWProjectionCollisionExcluded,true);
  assert.equal(out.atomicSourceMirrorCollisionProofs.length,
   out.checkedMirrorAtomicOpenCells);
  for(const x of out.atomicSourceMirrorCollisionProofs){
   assert.equal(x.positiveRadicalsForEveryInteriorSourceParameter,true);
   assert.equal(x.onlyTwoPossibleSpatialLateralPointsAtEachWInterior,true);
   assert.equal(x.otherSignedLateralSourceWProjectionCollisionExcluded,true);
   assert.equal(x.rearSpatialSourceStrictlyBehindFront,true);
   assert.equal(x.completeCompositeContourAndCapProjectionCollisionCertified,false);
   assert.equal(x.officialLineStyle,'undetermined');
   assert.equal(x.v5ActionAuthorized,false);
  }
  assert.equal(out.otherFiniteCapAndCompositeContourOcclusionProven,false);
  assert.equal(out.closedCenterAndRadicalEndpointTopologyCertified,false);
  assert.equal(out.officialV5Authorized,false);
  assert.ok(Object.isFrozen(out.atomicSourceMirrorCollisionProofs[0]));
 }
});
test('finite cylinder caps shorten lateral source but exact-once W projection source inventory is preserved',()=>{
 const src=model();src.yCylinder.yMin=-10;src.yCylinder.yMax=10;
 src.zCylinder.zMin=-7;src.zCylinder.zMax=7;
 const a=source(src,121,'intersection'),out=audit(a);
 assert.equal(out.entireOriginalM3OpenSourceInventoryExactlyOnce,true);
 assert.ok(out.checkedMirrorAtomicOpenCells>=4);
 assert.equal(out.officialV5Authorized,false);
});
test('missing even one mirrored positive source interval is NOT complete W M3 input',()=>{
 const src=model(),a=source(src,122,'union');
 const forged=JSON.parse(JSON.stringify(a.mirrorExitEvidence));
 forged.atomicSourceMirrorCells.pop();
 assert.throws(()=>audit({...a,mirrorExitEvidence:forged}),
  /missing or double-claimed x source|original M3 branch source inventory incomplete/);
});
test('overlapping/duplicated W mirror source cell never counts as one original M3 parameter interval',()=>{
 const src=model(),a=source(src,123,'union');
 const forged=JSON.parse(JSON.stringify(a.mirrorExitEvidence));
 forged.atomicSourceMirrorCells.push({...forged.atomicSourceMirrorCells[0]});
 assert.throws(()=>audit({...a,mirrorExitEvidence:forged}),
  /missing or double-claimed x source|original M3 branch source inventory incomplete/);
});
test('forged other-sign W source branch cannot borrow a real mirror/first-exit source ID',()=>{
 const src=model(),a=source(src,124,'intersection');
 const forged=JSON.parse(JSON.stringify(a.mirrorExitEvidence));
 const actual=forged.atomicSourceMirrorCells[0];
 const other=forged.atomicSourceMirrorCells.find(x=>x.signedRadicalPair!==actual.signedRadicalPair);
 assert.ok(other);
 actual.frontM3BranchId=other.frontM3BranchId;
 assert.throws(()=>audit({...a,mirrorExitEvidence:forged}),
  /inconsistent M3 branches or 3D depth/);
});
test('noncoincident X centers and unselected Boolean remain strictly not covered',()=>{
 const src=model(),v=source(src,125,null),none=audit(v);
 assert.equal(none.status,'not-covered');
 assert.equal(none.allPositiveWSourceCurveProjectionCollisionsClassified,false);
 assert.equal(none.officialV5Authorized,false);
 const m=model();m.yCylinder.xCenter=2;
 const off=audit(source(m,126,'union'));
 assert.equal(off.status,'not-covered');
 assert.equal(off.entireOriginalM3OpenSourceInventoryExactlyOnce,false);
 assert.throws(()=>audit({...source(src,127,'union'),revision:128}),
  /current unsigned W M3\/M5/);
});
