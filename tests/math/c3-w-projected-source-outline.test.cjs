'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditC3WProjectedSourceEdges:audit}=
 require('../../workbench/c3-w-projected-source-outline.cjs');
const {buildC3WIntervalPreview:preview}=
 require('../../workbench/c3-w-ray-preview.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('all W finite-cylinder projected outlines intersect real M3 branches at partition events',()=>{
 const source=input(),revision=21;
 const r=audit({input:source,revision});
 assert.equal(r.status,'scoped-analytic-source-outline-event-partition');
 assert.equal(r.projectedSourceOutlinesHaveOnlyCoordinateConstantEdges,true);
 assert.equal(r.sourceOutlineOpenOverlapExcluded,true);
 assert.equal(r.everyProjectedEventAtExistingWPartitionBoundary,true);
 assert.ok(r.eventCount>0);
 assert.ok(r.events.some(e=>e.sourceFeatureKind==='silhouette'));
 const m=joint({input:source,revision});
 assert.equal(r.originalM3BranchCount,m.sourceBranchCount);
 for(const e of r.events){
  const W=m.intervals.filter(i=>i.view==='W'&&i.branchId===e.sourceBranchId);
  assert.ok(W.length>0);
  assert.ok(W.some(i=>Math.abs(e.x-i.xOpenRange[0])<1e-7||
   Math.abs(e.x-i.xOpenRange[1])<1e-7));
  assert.equal(e.projectedW.u,e.point3D.y);
  assert.equal(e.projectedW.v,e.point3D.z);
  assert.ok(Math.abs(e.point3D[e.sourceLineCoordinate]-e.sourceLineValue)<1e-7);
  assert.equal(e.existingWPartitionBoundaryVerified,true);
  assert.equal(e.officialLineStyle,'undetermined');
  assert.equal(e.v5CurveActionAuthorized,false);
 }
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.continuousCurveV5Ready,false);
 const w=preview({input:source,revision});
 assert.equal(w.projectedSourceOutlineEventsSeparatedAtWBoundaries,true);
 assert.equal(w.sourceOutlineEventCount,r.eventCount);
 assert.ok(w.certifiedClearCount>0);
});
test('finite axial cap edges crossing projected intersection are placed at M3 clip ends',()=>{
 const source=input();
 source.yCylinder.yMin=-9;source.yCylinder.yMax=9;
 const r=audit({input:source,revision:12});
 assert.equal(r.status,'scoped-analytic-source-outline-event-partition');
 const e=r.events.filter(e=>e.id==='y-cap-low'||e.id==='y-cap-high');
 assert.ok(e.length>0,'must include clipped y-axis cylinder cap event');
 assert.ok(e.every(x=>x.existingWPartitionBoundaryVerified));
 assert.ok(e.every(x=>x.sourceFeatureKind==='finite-cap-edge'));
 const p=preview({input:source,revision:12});
 assert.equal(p.projectedSourceOutlineEventsSeparatedAtWBoundaries,true);
 assert.equal(p.officialLineStylesVerified,false);
});
test('identical X centers still exclude source-outline open overlaps but cannot color overlapping ray strokes',()=>{
 const source=input();source.yCylinder.xCenter=0;
 const r=audit({input:source,revision:4});
 assert.equal(r.sourceOutlineOpenOverlapExcluded,true);
 assert.equal(r.everyProjectedEventAtExistingWPartitionBoundary,true);
 const p=preview({input:source,revision:4});
 assert.equal(p.exactProjectedLateralSelfOverlapExcluded,false);
 assert.equal(p.certifiedClearCount,0);
 assert.equal(p.certifiedOccludedCount,0);
 assert.equal(p.undeterminedCount,p.intervals.length);
});
test('geometry translated in source XYZ has identical feature event and open-overlap validity',()=>{
 const A=input(),B=input();
 const a=audit({input:A,revision:1});
 B.zCylinder.xCenter+=35;B.yCylinder.xCenter+=35;
 B.zCylinder.yCenter+=14;B.yCylinder.yMin+=14;B.yCylinder.yMax+=14;
 B.yCylinder.zCenter-=5;B.zCylinder.zMin-=5;B.zCylinder.zMax-=5;
 const b=audit({input:B,revision:2});
 assert.equal(a.status,b.status);
 assert.equal(a.eventCount,b.eventCount);
 assert.equal(b.sourceOutlineOpenOverlapExcluded,true);
 for(let i=0;i<a.events.length;i++){
  const p=a.events[i],q=b.events[i];
  assert.equal(q.id,p.id);
  assert.equal(q.sourceBranchId,p.sourceBranchId);
  assert.ok(Math.abs(q.x-p.x-35)<1e-7);
  assert.ok(Math.abs(q.projectedW.u-p.projectedW.u-14)<1e-7);
  assert.ok(Math.abs(q.projectedW.v-p.projectedW.v+5)<1e-7);
 }
});
test('empty finite region refuses both feature events and any official strokes',()=>{
 const source=input();source.zCylinder.zMin=40;source.zCylinder.zMax=60;
 const r=audit({input:source,revision:5});
 assert.equal(r.status,'not-covered');
 assert.equal(r.sourceOutlineOpenOverlapExcluded,false);
 assert.equal(r.events.length,0);
 assert.equal(r.continuousCurveV5Ready,false);
 const p=preview({input:source,revision:5});
 assert.equal(p.status,'not-covered');
});
