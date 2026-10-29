'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3WFiniteCapLineForwardRays:audit}=
 require('../../workbench/c3-w-finite-cap-line-forward-rays.cjs');
const {auditC3SelectedBooleanVHWOpenRays:rays}=
 require('../../workbench/c3-selected-boolean-vhw-open-rays.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-5,zMax:5},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-6,yMax:6}});
const run=(input,op='union',revision=151)=>audit({input,revision,
 selectedRayEvidence:rays({input,revision,solidOperation:op})});
test('genuine finite 3D cap/lateral generators independently prove all selected W open strict Boolean volume rays',()=>{
 const src=model();
 for(const op of ['intersection','union']){
  const a=run(src,op);
  assert.equal(a.status,'scoped-all-real-W-cap-source-open-rays');
  assert.equal(a.allPhysicalCapSourceLinesIndependentlyVerified,true);
  assert.ok(a.capLateralSourceCount>0);
  assert.ok(a.lineSourceRays.length>=a.capLateralSourceCount);
  assert.equal(a.lineSourceRays.length,
   a.strictlyOpaqueLineCount+a.strictlyClearLineCount);
  for(const row of a.lineSourceRays){
   assert.equal(row.independentFirstAngleWSourceRayMatched,true);
   assert.equal(row.finiteCapPlaneNeverHasStrictWInterior,true);
   assert.equal(row.engineeringLineStyle,'undetermined');
   assert.equal(row.v5ActionAuthorized,false);
   if(row.WProjectionCollapsedToSinglePaperPoint){
    assert.equal(row.sourceType,'cap-cap-collapsed-W-point');
    assert.deepEqual(row.originalWProjectedFrom,row.originalWProjectedTo);
    assert.equal(row.strictOpaqueAhead,false);
   }else{
    assert.equal(row.sourceType,'cap-lateral-positive-W-source-line');
    assert.notDeepEqual(row.originalWProjectedFrom,row.originalWProjectedTo);
    assert.equal(row.originalSourceAxialCapStrictInteriorThroughoutOpenLine,true);
   }
  }
  assert.equal(a.allCompositeSourceDepthAndSurfaceContactsProven,false);
  assert.equal(a.officialV5Authorized,false);
 }
});
test('actual cap-cap 3D edge collapses to W point: intersection rays are strictly clear, union can be opaque on cap/lateral sources',()=>{
 const src=model();
 const I=run(src,'intersection',152),U=run(src,'union',152);
 assert.ok(I.capCapWCollapsedSourceCount>=1);
 assert.equal(I.capCapWCollapsedSourceCount,U.capCapWCollapsedSourceCount);
 assert.equal(I.strictlyOpaqueLineCount,0);
 assert.ok(U.strictlyOpaqueLineCount>0);
 for(const row of U.lineSourceRays.filter(x=>x.strictOpaqueAhead)){
  assert.ok(['zCylinder','yCylinder'].includes(row.oppositeLateralSourceId));
  assert.ok(row.frontExitOriginal3DX>row.original3DFrom.x);
  assert.equal(row.positiveRayParameterOpenRange[0],0);
  assert.ok(row.positiveRayParameterOpenRange[1]>0);
 }
 assert.equal(U.officialLineStylesVerified,false);
 assert.equal(U.officialV5Authorized,false);
});
test('current C3 joint reuses independent W cap-ray source witness, without signing cap line styles',()=>{
 const src=model(),r=joint({input:src,revision:153,solidOperation:'union'});
 assert.equal(r.wFiniteCapLineForwardRays.allPhysicalCapSourceLinesIndependentlyVerified,true);
 assert.ok(r.wFiniteCapLineForwardRays.capLateralSourceCount>0);
 assert.ok(r.wFiniteCapLineForwardRays.capCapWCollapsedSourceCount>0);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.v5CurveReady,false);
});
test('a forged W selected ray result, radial sign or native cap source ID fails independent 3D source verification',()=>{
 const src=model(),revision=154;
 const original=rays({input:src,revision,solidOperation:'union'});
 const rows=original.intervals.filter(x=>x.view==='W'&&x.sourceKind==='line');
 assert.ok(rows.length>0);
 const fake=JSON.parse(JSON.stringify(original));
 const row=fake.intervals.find(x=>x.view==='W'&&x.sourceKind==='line');
 row.openInteriorVolumeRayStatus=row.openInteriorVolumeRayStatus===
  'opaque-interior-ahead'?'strict-interior-ray-clear':'opaque-interior-ahead';
 assert.throws(()=>audit({input:src,revision,selectedRayEvidence:fake}),
  /contradicts independent finite cylinder quadratic/);
 const wrong=JSON.parse(JSON.stringify(original));
 wrong.intervals.find(x=>x.view==='W'&&x.sourceKind==='line').sourceId='not-real-M3';
 assert.throws(()=>audit({input:src,revision,selectedRayEvidence:wrong}),
  /line identity or source interval mismatch/);
 const badSign=JSON.parse(JSON.stringify(original));
 badSign.intervals.find(x=>x.view==='W'&&x.sourceKind==='line')
  .zCylinderOutwardRaySign=17;
 assert.throws(()=>audit({input:src,revision,selectedRayEvidence:badSign}),
  /contradicts independent finite cylinder quadratic/);
});
test('unselected Boolean and stale revision never provide W cap-line or V5 authority',()=>{
 const src=model(),revision=155;
 const no=rays({input:src,revision});
 const blocked=audit({input:src,revision,selectedRayEvidence:no});
 assert.equal(blocked.status,'not-covered');
 assert.equal(blocked.allPhysicalCapSourceLinesIndependentlyVerified,false);
 assert.equal(blocked.officialV5Authorized,false);
 assert.throws(()=>audit({input:src,revision:156,selectedRayEvidence:no}),
  /current unsigned selected finite C3 source rays/);
});
