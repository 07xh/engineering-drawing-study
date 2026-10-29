'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3WExactMirrorDepthOrder:audit}=
 require('../../workbench/c3-w-mirror-depth-order.cjs');
const {auditC3SelectedBooleanVHWOpenRays:ray}=
 require('../../workbench/c3-selected-boolean-vhw-open-rays.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:0,zCenter:0,yMin:-17,yMax:17}});
const check=(input,solidOperation='intersection',revision=30)=>
 audit({input,revision,selectedRayEvidence:ray({input,revision,solidOperation})});
test('EXACT equal cylinder X centers have genuine distinct-depth W mirror source arcs for intersection and union',()=>{
 for(const op of ['intersection','union']){
  const src=model(),result=check(src,op);
  assert.equal(result.status,'scoped-exact-signed-W-lateral-mirror-depth');
  assert.equal(result.allSignedM3LateralSourceMirrorsAccountedFor,true);
  assert.equal(result.sameSignedLateralSourceWDepthOrderProven,true);
  assert.ok(result.verifiedMirroredOpenDepthCellCount>=4);
  assert.equal(result.verifiedMirroredOpenDepthCellCount,result.mirroredOpenDepthCells.length);
  const groups=new Set(result.mirroredOpenDepthCells.map(c=>c.signedRadicalPair));
  assert.deepEqual(groups,new Set(['1|1','1|-1','-1|1','-1|-1']));
  for(const c of result.mirroredOpenDepthCells){
   assert.ok(c.rearOriginalXOpenRange[0]<
    c.rearOriginalXOpenRange[1]&&c.rearOriginalXOpenRange[1]<=0);
   assert.ok(c.frontOriginalXOpenRange[1]>
    c.frontOriginalXOpenRange[0]&&c.frontOriginalXOpenRange[0]>=0);
   assert.equal(c.frontOriginalXOpenRange[0],-c.rearOriginalXOpenRange[1]);
   assert.equal(c.frontOriginalXOpenRange[1],-c.rearOriginalXOpenRange[0]);
   assert.equal(c.distinctRearAndFront3DPointsShareExactAnalyticWProjection,true);
   assert.equal(c.front3DDepthStrictlyGreaterThroughoutOpenCell,true);
   assert.equal(c.rearSelectedBooleanInteriorAheadProven,true);
   assert.equal(c.frontSelectedBooleanNoInteriorAheadProven,true);
   assert.equal(c.closedCenterAndSourceJunctionDepthProven,false);
   assert.equal(c.unrelatedSourceCapAndOutlineDepthProven,false);
   assert.equal(c.officialLineStyle,'undetermined');
   assert.equal(c.v5ActionAuthorized,false);
  }
  assert.equal(result.otherProjectedFeatureDepthResolved,false);
  assert.equal(result.closedCenterAndCurveEndpointVisibilityProven,false);
  assert.equal(result.officialV5Authorized,false);
  assert.ok(Object.isFrozen(result.mirroredOpenDepthCells[0]));
 }
});
test('actual W overlapping source branches do not become falsely injective or signed',()=>{
 const src=model(),result=joint({input:src,revision:31,solidOperation:'union'});
 assert.equal(result.wLateralProjection.projectedLateralLateralPointInjectivityVerified,false);
 assert.equal(result.wExactMirrorDepthEvidence.sameSignedLateralSourceWDepthOrderProven,true);
 assert.ok(result.intervals.filter(x=>x.view==='W').every(x=>
  x.wLateralProjectionCollisionExcludedWithinSourceScope===false&&
  x.wLateralMirroredDepthOrderProvenWithinSourceScope===true&&
  x.v5ActionAuthorized===false));
 assert.equal(result.officialLineStylesVerified,false);
 assert.equal(result.v5CurveReady,false);
});
test('axis-center offset even 1e-11 proves no centered mirror; existing independent W injectivity remains separate',()=>{
 const src=model();src.yCylinder.xCenter=1e-11;
 const result=check(src);
 assert.equal(result.status,'not-covered');
 assert.equal(result.sameSignedLateralSourceWDepthOrderProven,false);
 assert.equal(result.verifiedMirroredOpenDepthCellCount,0);
 assert.equal(result.officialV5Authorized,false);
});
test('real common X translation preserves source W mirror ordering and strict Boolean ray direction',()=>{
 const src=model(),baseline=check(src,'union',32);
 const shift=20;src.zCylinder.xCenter+=shift;
 src.yCylinder.xCenter+=shift;
 const moved=check(src,'union',33);
 assert.equal(moved.status,baseline.status);
 assert.equal(moved.verifiedMirroredOpenDepthCellCount,
  baseline.verifiedMirroredOpenDepthCellCount);
 assert.ok(moved.mirroredOpenDepthCells.every(x=>
  x.rearOriginalXOpenRange[1]<=shift&&
  x.frontOriginalXOpenRange[0]>=shift));
});
test('forged rear visibility and front occlusion may NOT borrow source mirror proof',()=>{
 const src=model(),revision=35;
 const original=ray({input:src,revision,solidOperation:'union'});
 const forged=JSON.parse(JSON.stringify(original));
 const rear=forged.intervals.find(row=>row.view==='W'&&
  row.sourceKind==='analytic-curve'&&
  row.openParameterRange[1]<=0);
 assert.ok(rear);
 rear.openInteriorVolumeRayStatus='strict-interior-ray-clear';
 assert.throws(()=>audit({input:src,revision,selectedRayEvidence:forged}),
  /mirror depth contradicts independent Boolean source ray/);
});
test('missing selected Boolean model or non-current revision never creates an exact mirror signed line',()=>{
 const src=model(),revision=36;
 const unselected=ray({input:src,revision});
 const blocked=audit({input:src,revision,selectedRayEvidence:unselected});
 assert.equal(blocked.status,'not-covered');
 assert.equal(blocked.verifiedMirroredOpenDepthCellCount,0);
 assert.equal(blocked.officialV5Authorized,false);
 assert.throws(()=>audit({input:src,revision:37,selectedRayEvidence:unselected}),
  /current unsigned C3 Boolean/);
});
