'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3WMirrorExitOutlineConcordance:audit}=
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
const source=(input,revision=92,op='union')=>{
 const joined=joint({input,revision,solidOperation:op});
 const W=preview({input,revision});
 return {input,revision,
  exitEvidence:joined.wBooleanForwardExitDepth,
  outlineEvidence:outlines({input,revision,
   capPartitionEvidence:joined.wMirrorCapContactPartition,wRayPreview:W})};
};
test('real C3 symmetric finite cylinder intersection/union: every W mirror/outline atom has rear volume ending at SAME true front M3 curve',()=>{
 for(const op of ['intersection','union']){
  const m=model(),data=source(m,92,op),result=audit(data);
  assert.ok(result.checkedMirroredAtomicOpenCells>=4);
  assert.equal(result.checkedMirroredAtomicOpenCells,
   data.outlineEvidence.allSourceOutlinePartitionOpenCellCount);
  assert.equal(result.rearFirstExitOntoFrontSourceCellCount,
   result.checkedMirroredAtomicOpenCells);
  assert.equal(result.allMirroredOpenSourceCellsCrossCertified,true);
  assert.equal(result.unprovedSourceMirrorExitCellCount,0);
  for(const r of result.atomicSourceMirrorCells){
   assert.equal(r.rearEntireCellOccludedByFiniteBooleanVolume,true);
   assert.equal(r.rearExactFirstExitAtFrontSource3DPoint,true);
   assert.equal(r.frontEntireCellHasNoFurtherStrictBooleanVolume,true);
   assert.equal(r.bothPhysicalCylinderExitSurfacesIdentified,true);
   assert.equal(r.allClosedOriginalContactPointsCertified,false);
   assert.equal(r.officialLineStyle,'undetermined');
   assert.equal(r.v5ActionAuthorized,false);
   assert.ok(r.rearOriginalXOpenRange[1]>r.rearOriginalXOpenRange[0]);
   assert.ok(r.frontOriginalXOpenRange[1]>r.frontOriginalXOpenRange[0]);
   assert.ok(r.rearForwardFirstExitXOpenRange[0]===
    r.frontOriginalXOpenRange[0]);
  }
  assert.equal(result.completeCompositeSourceDepthRankingCertified,false);
  assert.equal(result.standardEngineeringLineStylesVerified,false);
  assert.equal(result.officialV5Authorized,false);
 }
});
test('finite cap clipping still certifies individual W mirror atom depth without signing unrelated contour',()=>{
 const m=model();m.yCylinder.yMin=-10;m.yCylinder.yMax=10;
 m.zCylinder.zMin=-7;m.zCylinder.zMax=7;
 const data=source(m,93,'union'),result=audit(data);
 assert.ok(result.checkedMirroredAtomicOpenCells>0);
 assert.equal(result.allMirroredOpenSourceCellsCrossCertified,true);
 assert.equal(result.officialV5Authorized,false);
});
test('forged front finite W volume ray or mismatched physical source must FAIL, never become signed',()=>{
 const m=model(),data=source(m,94,'intersection');
 assert.ok(data.outlineEvidence.allSourceOutlineAtomicOpenCells.length>0);
 const bad=JSON.parse(JSON.stringify(data));
 const first=bad.outlineEvidence.allSourceOutlineAtomicOpenCells[0];
 first.frontM3BranchId='wrong-M3-original-source';
 assert.throws(()=>audit(bad),/not a true equal-sign 3D branch pair/);
 const tampered=JSON.parse(JSON.stringify(data));
 const cell=tampered.outlineEvidence.allSourceOutlineAtomicOpenCells[0];
 const front=tampered.exitEvidence.sourceOpenCells.find(x=>
  x.sourceM3BranchId===cell.frontM3BranchId&&
  x.originalSourceXOpenRange[0]<=cell.frontOriginalXOpenRange[0]&&
  x.originalSourceXOpenRange[1]>=cell.frontOriginalXOpenRange[1]);
 assert.ok(front);
 front.strictForwardVolumeRayStatus='certified-entire-W-open-ray-opaque-first-exit';
 assert.throws(()=>audit(tampered),/contradicts mirrored source depth/);
});
test('nonidentical W cylinder centers or missing solid operation preserve unsigned not-covered result',()=>{
 const m=model(),revision=95;
 const no=audit(source(m,revision,null));
 assert.equal(no.status,'not-covered');
 assert.equal(no.officialV5Authorized,false);
 const off=model();off.yCylinder.xCenter=2;
 const other=audit(source(off,96,'union'));
 assert.equal(other.status,'not-covered');
 assert.equal(other.allMirroredOpenSourceCellsCrossCertified,false);
 assert.throws(()=>audit({...source(m,97),revision:98}),
  /same-revision unsigned/);
});
