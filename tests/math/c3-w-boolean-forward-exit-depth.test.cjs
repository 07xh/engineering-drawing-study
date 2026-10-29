'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3WBooleanForwardExitDepth:audit}=
 require('../../workbench/c3-w-boolean-forward-exit-depth.cjs');
const {auditC3SelectedBooleanVHWOpenRays:rays}=
 require('../../workbench/c3-selected-boolean-vhw-open-rays.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const run=(input,op='union',revision=81)=>audit({input,revision,
 selectedRayEvidence:rays({input,revision,solidOperation:op})});
test('finite C3 union W strict ray forward far exit is the MAX center affine plane for all open M3 source cells',()=>{
 const m=model(),r=run(m,'union');
 assert.equal(r.status,'scoped-all-W-lateral-source-open-ray-first-exits');
 assert.equal(r.allWSourceOpenCellsAccountedFor,true);
 assert.equal(r.unresolvedCapOrNumericalCellCount,0);
 assert.ok(r.provedOpaqueExitCellCount>0);
 assert.ok(r.provedClearForwardCellCount>0);
 for(const c of r.sourceOpenCells){
  assert.ok(c.originalSourceXOpenRange[1]>c.originalSourceXOpenRange[0]);
  assert.equal(c.sourceFiniteAxialCapsStrictInOpenCellVerified,true);
  assert.equal(c.fullOpenSourceRayForwardVolumeCertified,true);
  assert.equal(c.officialLineStyle,'undetermined');
  assert.equal(c.v5ActionAuthorized,false);
  if(c.sourceFirstExitXAffine){
   const center=c.sourceFirstExitCylinder==='zCylinder'?
    m.zCylinder.xCenter:m.yCylinder.xCenter;
   assert.equal(c.sourceFirstExitXAffine.slope,-1);
   assert.equal(c.sourceFirstExitXAffine.twiceXCenter,2*center);
   assert.ok(c.sourceFirstExitXAffine.strictForwardDepthPositiveForEveryXInOpenCell);
   assert.equal(c.sourceFirstExitXAffine.unionUsesLargestFiniteCylinderFarExit,true);
  }
 }
 assert.equal(r.officialV5Authorized,false);
 assert.equal(r.allProjectedFeatureDepthAndContactVisibilityProven,false);
});
test('finite C3 INTERSECTION W forward exit uses MIN source X center, not union far boundary',()=>{
 const m=model(),U=run(m,'union',82),I=run(m,'intersection',82);
 assert.equal(U.sourceOpenCells.length,I.sourceOpenCells.length);
 assert.equal(I.allSourceForwardVolumeSegmentsProven,true);
 assert.ok(I.provedOpaqueExitCellCount>0);
 assert.ok(U.provedOpaqueExitCellCount>I.provedOpaqueExitCellCount);
 for(let i=0;i<I.sourceOpenCells.length;i++){
  const v=I.sourceOpenCells[i],u=U.sourceOpenCells[i];
  assert.deepEqual(v.originalSourceXOpenRange,u.originalSourceXOpenRange);
  if(v.sourceFirstExitXAffine){
   assert.equal(v.sourceFirstExitCylinder,'zCylinder');
   assert.equal(v.sourceFirstExitXAffine.twiceXCenter,0);
   assert.equal(v.sourceFirstExitXAffine.intersectionUsesSmallestFiniteCylinderFarExit,true);
  }
 }
});
test('C3 coincident cylinder X centers have same exact affine far-ray exit matching mirrored W front branch',()=>{
 const m=model();m.yCylinder.xCenter=0;
 for(const op of ['union','intersection']){
  const r=run(m,op,83);
  assert.equal(r.allSourceForwardVolumeSegmentsProven,true);
  for(const x of r.sourceOpenCells.filter(row=>row.sourceFirstExitXAffine)){
   assert.equal(x.sourceFirstExitXAffine.twiceXCenter,0);
   const [a,b]=x.originalSourceXOpenRange;
   assert.deepEqual(x.sourceFirstExitXAffine.firstExitXDomain,[-b,-a]);
  }
 }
});
test('C3 source-coordinate translation keeps selected strict first exit source and continuous interval classification',()=>{
 const m=model(),baseline=run(m,'union',84);
 const shift=20;
 m.zCylinder.xCenter+=shift;m.yCylinder.xCenter+=shift;
 const moved=run(m,'union',85);
 assert.equal(moved.sourceOpenCells.length,baseline.sourceOpenCells.length);
 assert.equal(moved.provedOpaqueExitCellCount,baseline.provedOpaqueExitCellCount);
 assert.ok(moved.sourceOpenCells.every(x=>x.fullOpenSourceRayForwardVolumeCertified));
 for(let i=0;i<moved.sourceOpenCells.length;i++){
  const old=baseline.sourceOpenCells[i],current=moved.sourceOpenCells[i];
  assert.equal(current.sourceFirstExitCylinder,old.sourceFirstExitCylinder);
  if(current.sourceFirstExitXAffine){
   assert.ok(Math.abs(current.sourceFirstExitXAffine.twiceXCenter-
    old.sourceFirstExitXAffine.twiceXCenter-2*shift)<1e-12);
  }
 }
});
test('a selected W Boolean ray with false original radial sign or fake complete x coverage fails closed',()=>{
 const m=model(),revision=86;
 const evidence=rays({input:m,revision,solidOperation:'union'});
 const forged=JSON.parse(JSON.stringify(evidence));
 const cell=forged.intervals.find(x=>x.view==='W'&&x.sourceKind==='analytic-curve');
 assert.ok(cell);
 cell.zCylinderOutwardRaySign*=-1;
 assert.throws(()=>audit({input:m,revision,selectedRayEvidence:forged}),
  /conflict with exact M3 radial event partition/);
 const fake=JSON.parse(JSON.stringify(evidence));
 const x=fake.intervals.find(x=>x.view==='W'&&x.sourceKind==='analytic-curve');
 x.openParameterRange[1]=x.openParameterRange[0]+0.01;
 assert.throws(()=>audit({input:m,revision,selectedRayEvidence:fake}),
  /conflict with exact M3 radial event partition/);
});
test('not selected solid or stale revision must never sign W forward ray first-exit',()=>{
 const m=model(),revision=87;
 const no=rays({input:m,revision,solidOperation:null});
 const b=audit({input:m,revision,selectedRayEvidence:no});
 assert.equal(b.status,'not-covered');
 assert.equal(b.allSourceForwardVolumeSegmentsProven,false);
 assert.equal(b.officialV5Authorized,false);
 assert.throws(()=>audit({input:m,revision:88,selectedRayEvidence:no}),
  /current unsigned finite C3 selected Boolean/);
});
test('canonical C3 joint keeps signed GB and formal V5 disabled while exposing true finite W first exit',()=>{
 const m=model();
 const j=joint({input:m,revision:89,solidOperation:'union'});
 assert.equal(j.wBooleanForwardExitDepth.allSourceForwardVolumeSegmentsProven,true);
 assert.ok(j.wBooleanForwardExitDepth.provedOpaqueExitCellCount>0);
 assert.equal(j.wBooleanForwardExitDepth.engineeringLineStylesVerified,false);
 assert.equal(j.v5CurveReady,false);
});
