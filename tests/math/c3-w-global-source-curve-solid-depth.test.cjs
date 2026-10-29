'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3WGlobalSourceCurveSolidDepth:audit}=
 require('../../workbench/c3-w-global-source-curve-solid-depth.cjs');
const {auditC3WAllLateralProjectionCollisions:allCollisions}=
 require('../../workbench/c3-w-lateral-projection-collision-inventory.cjs');
const {auditC3WMirrorExitOutlineConcordance:exits}=
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
function evidence(input,revision=191,solidOperation='intersection'){
 const j=joint({input,revision,solidOperation});
 const w=outlines({input,revision,
  capPartitionEvidence:j.wMirrorCapContactPartition,
  wRayPreview:preview({input,revision})});
 const collisionEvidence=allCollisions({input,revision,
  mirrorExitEvidence:exits({input,revision,
   exitEvidence:j.wBooleanForwardExitDepth,outlineEvidence:w})});
 return {input,revision,collisionEvidence,
  forwardExitEvidence:j.wBooleanForwardExitDepth};
}
test('actual finite union and intersection: every original W front source is globally frontmost against BOTH complete cylinders',()=>{
 for(const op of ['intersection','union']){
  const e=evidence(model(),191,op),out=audit(e);
  assert.equal(out.status,
   'scoped-all-W-original-lateral-curves-globally-frontmost-or-behind-finite-Boolean-volume');
  assert.equal(out.certifiedGlobalFrontmostCells,
   e.collisionEvidence.checkedMirrorAtomicOpenCells);
  assert.equal(out.certifiedRearFullInteriorOcclusionCells,
   out.certifiedGlobalFrontmostCells);
  assert.equal(out.allOriginalM3WSourceCurveAtomsGloballyDepthProven,true);
  assert.equal(out.originalM3BranchSourceParameterInventoryRechecked,true);
  assert.equal(out.currentM3SignedLateralSourceBranchCount,4);
  assert.equal(out.sourceFlankInventory.length,8);
  for(const c of out.provedWSourceCurveOpenCells){
   assert.equal(c.frontSourceIsGloballyFrontmostAmongALLSelectedFiniteSolidPoints,true);
   assert.equal(c.noPointOfEitherCompleteFiniteCylinderBeyondFrontAlongW,true);
   assert.equal(c.anyCapFaceOrOriginalSurfaceBeyondFrontExcludedByBothRadialInequalities,true);
   assert.equal(c.rearToFrontOpenWRayStrictlyInsideBothFiniteCylinderSolids,true);
   assert.equal(c.rearToFrontOpenWRayStrictlyInsideSelectedBooleanSolid,true);
   assert.equal(c.rearSelectedSolidOccludedOnEntireSourceOpenCell,true);
   assert.equal(c.projectedLineOrCapFeatureOverlapStyleAuthorized,false);
   assert.equal(c.engineeringLineStyle,'undetermined');
   assert.equal(c.v5ActionAuthorized,false);
  }
  assert.equal(out.fullProjectedDrawingStrokeSetCertified,false);
  assert.equal(out.closedEndpointsCapTouchesCertified,false);
  assert.equal(out.officialV5Authorized,false);
  assert.equal(Object.isFrozen(out.provedWSourceCurveOpenCells[0]),true);
 }
});
test('finite caps shorten the source curves without invalidating the full finite Boolean frontmost theorem',()=>{
 const m=model();
 m.zCylinder.zMin=-7;m.zCylinder.zMax=7;
 m.yCylinder.yMin=-10;m.yCylinder.yMax=10;
 const a=audit(evidence(m,192,'union'));
 assert.equal(a.allOriginalM3WSourceCurveAtomsGloballyDepthProven,true);
 assert.ok(a.certifiedGlobalFrontmostCells>0);
 assert.equal(a.officialV5Authorized,false);
});
test('full selected-solid frontmost theorem holds under nonzero shared X translation',()=>{
 const m=model(),dx=13;m.zCylinder.xCenter+=dx;m.yCylinder.xCenter+=dx;
 const a=audit(evidence(m,193,'intersection'));
 assert.equal(a.allOriginalM3WSourceCurveAtomsGloballyDepthProven,true);
 for(const x of a.provedWSourceCurveOpenCells){
  assert.ok(x.rearOriginalXOpenRange[1]<=dx);
  assert.ok(x.frontOriginalXOpenRange[0]>=dx);
 }
});
test('missing one positive original-curve source interval never becomes globally frontmost',()=>{
 const e=evidence(model(),194,'union');
 const tampered=structuredClone(e.collisionEvidence);
 tampered.atomicSourceMirrorCollisionProofs.pop();
 assert.throws(()=>audit({...e,collisionEvidence:tampered}),
  /source-ray atoms omit or overlap original M3 x domain|current W entire-source-curve inventory/);
});
test('forged front M3 identity or opaque front ray fails source/global-solid theorem',()=>{
 const e=evidence(model(),195,'union');
 const wrong=structuredClone(e.collisionEvidence);
 wrong.atomicSourceMirrorCollisionProofs[0].frontM3BranchId='bogus-M3';
 assert.throws(()=>audit({...e,collisionEvidence:wrong}),
  /false original M3 front\/rear/);
 const bad=structuredClone(e.forwardExitEvidence);
 const atom=e.collisionEvidence.atomicSourceMirrorCollisionProofs[0];
 const front=bad.sourceOpenCells.find(row=>
  row.sourceM3BranchId===atom.frontM3BranchId&&
  row.originalSourceXOpenRange[0]<=atom.frontOriginalXOpenRange[0]&&
  row.originalSourceXOpenRange[1]>=atom.frontOriginalXOpenRange[1]);
 assert.ok(front);
 front.strictForwardVolumeRayStatus='certified-entire-W-open-ray-opaque-first-exit';
 assert.throws(()=>audit({...e,forwardExitEvidence:bad}),
  /finite Boolean forward rays contradict global source depth/);
});
test('different X centers, absent Boolean choice and stale revision cannot authorize frontmost source',()=>{
 const notSelected=audit(evidence(model(),196,null));
 assert.equal(notSelected.status,'not-covered');
 assert.equal(notSelected.officialV5Authorized,false);
 const m=model();m.yCylinder.xCenter=1;
 const offset=audit(evidence(m,197,'union'));
 assert.equal(offset.status,'not-covered');
 assert.equal(offset.allOriginalM3WSourceCurveAtomsGloballyDepthProven,false);
 const e=evidence(model(),198);
 assert.throws(()=>audit({...e,revision:199}),/current same-revision unsigned C3/);
});
