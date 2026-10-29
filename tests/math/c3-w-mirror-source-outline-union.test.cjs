'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3WMirrorSourceOutlineUnion:audit}=
 require('../../workbench/c3-w-mirror-source-outline-union.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const {buildC3WIntervalPreview:preview}=
 require('../../workbench/c3-w-ray-preview.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:0,zCenter:0,yMin:-17,yMax:17}});
const run=(input,revision=71,solidOperation='union')=>{
 const evidence=joint({input,revision,solidOperation});
 const W=preview({input,revision});
 return {evidence,W,result:audit({input,revision,
  capPartitionEvidence:evidence.wMirrorCapContactPartition,
  wRayPreview:W})};
};
test('actual coincident-axis C3 source W silhouette and cap outline roots partition mirrored open arcs',()=>{
 for(const solidOperation of ['intersection','union']){
  const src=model();
  const {evidence,W,result}=run(src,71,solidOperation);
  assert.equal(result.schema,'draftai-c3-W-mirror-all-source-outlines/1');
  assert.ok(['scoped-original-W-source-outline-event-partition',
   'partial-original-W-outline-source-coverage'].includes(result.status));
  assert.equal(result.sourceOutlineContactCount,W.sourceOutlineEvents.length);
  assert.ok(result.sourceOutlineContactCount>0);
  assert.equal(result.sourceOutlineContactCount,
   result.mappedSourceOutlineContactCount+
    result.excludedClosedCenterEventCount+
    result.unassignedSourceOutlineEventCount);
  assert.equal(result.originalCapPartitionOpenCellCount,
   evidence.wMirrorCapContactPartition.atomicMirroredOpenCellCount);
  assert.ok(result.allSourceOutlinePartitionOpenCellCount>=
   result.originalCapPartitionOpenCellCount);
  for(const cell of result.allSourceOutlineAtomicOpenCells){
   assert.ok(cell.frontOriginalXOpenRange[1]>cell.frontOriginalXOpenRange[0]);
   assert.ok(cell.rearOriginalXOpenRange[1]>cell.rearOriginalXOpenRange[0]);
   assert.equal(cell.sameSourceMirrorFrontBackDepthProven,true);
   assert.equal(cell.noEnumeratedOriginalSourceOutlineCrossingInOpenInterior,true);
   assert.equal(cell.closedOutlineEventPhysicalJunctionProven,false);
   assert.equal(cell.allRetainedCompositeSolidContourOcclusionProven,false);
   assert.equal(cell.officialLineStyle,'undetermined');
   assert.equal(cell.v5ActionAuthorized,false);
  }
  assert.equal(result.fullyGloballyFrontmostOutlineCertified,false);
  assert.equal(result.engineeringLineStylesCertified,false);
  assert.equal(result.officialV5Authorized,false);
  assert.ok(Object.isFrozen(result.allSourceOutlineAtomicOpenCells));
 }
});
test('actual finite cap clipping keeps W mirrored cap source and 8 original outline event families separated',()=>{
 const src=model();src.yCylinder.yMin=-10;src.yCylinder.yMax=10;
 src.zCylinder.zMin=-7;src.zCylinder.zMax=7;
 const {W,result}=run(src,72,'union');
 assert.ok(W.sourceOutlineEventCount>0);
 assert.equal(result.sourceOutlineContactCount,W.sourceOutlineEventCount);
 assert.ok(result.allSourceOutlinePartitionOpenCellCount>
  0);
 assert.equal(result.closedContactContinuityVerified,false);
 assert.equal(result.officialV5Authorized,false);
});
test('an invented silhouette/cap outline value or stale M3 branch cannot claim full W source crossing',()=>{
 const src=model(),revision=73,{evidence,W}=run(src,revision);
 assert.ok(W.sourceOutlineEvents.length>0);
 const tampered=JSON.parse(JSON.stringify(W));
 tampered.sourceOutlineEvents[0].sourceLineValue+=1;
 assert.throws(()=>audit({input:src,revision,
  capPartitionEvidence:evidence.wMirrorCapContactPartition,
  wRayPreview:tampered}),
  /lacks true M3 identity|original source outline crossing/);
 const bad=JSON.parse(JSON.stringify(W));
 bad.sourceOutlineEvents[0].sourceBranchId='unknown-signed-source';
 assert.throws(()=>audit({input:src,revision,
  capPartitionEvidence:evidence.wMirrorCapContactPartition,
  wRayPreview:bad}),
  /lacks true M3 identity/);
});
test('no solid selection or nonidentical X centers never authorizes W mirror source outlines',()=>{
 const src=model(),revision=74;
 const missing=run(src,revision,null);
 assert.equal(missing.result.status,'not-covered');
 assert.equal(missing.result.officialV5Authorized,false);
 const offset=model();offset.yCylinder.xCenter=1;
 const a=run(offset,75);
 assert.equal(a.result.status,'not-covered');
 assert.equal(a.result.allSourceOutlinePartitionOpenCellCount,0);
 assert.throws(()=>audit({input:src,revision:76,
  capPartitionEvidence:missing.evidence.wMirrorCapContactPartition,
  wRayPreview:missing.W}),/current source-verified/);
});
