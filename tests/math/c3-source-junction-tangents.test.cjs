'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditC3SourceJunctionTangents:audit}=
 require('../../workbench/c3-source-junction-tangents.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const len=a=>Math.hypot(a.x,a.y,a.z);
test('exact cylinder implicit gradients prove regular C1 tangent at coalesced lateral junctions',()=>{
 const s=input(),r=audit({input:s,revision:10});
 assert.equal(r.status,'scoped-analytic-local-source-tangents');
 assert.equal(r.implicitGradientCrossProductDerivedFromCurrentM3,true);
 assert.ok(r.regularLocalTangencyCount>0);
 for(const v of r.junctions){
  const p=v.point3D;
  const F={x:p.x-s.zCylinder.xCenter,
   y:p.y-s.zCylinder.yCenter,z:0};
  const G={x:p.x-s.yCylinder.xCenter,
   y:0,z:p.z-s.yCylinder.zCenter};
  for(const src of v.incidentSourceTangents){
   if(src.kind!=='implicit-cylinder-cross-gradient'||!src.regular)continue;
   assert.ok(len(src.direction)>1e-8);
   assert.ok(Math.abs(dot(src.direction,F))<=
    1e-8*Math.max(1,len(F)*len(src.direction)));
   assert.ok(Math.abs(dot(src.direction,G))<=
    1e-8*Math.max(1,len(G)*len(src.direction)));
   assert.equal(src.gradientRankTwoVerified,true);
  }
  if(v.uniqueRegularC1SourceContinuation){
   assert.equal(v.incidentEdgeCount,2);
   assert.equal(v.localSourceType,'verified-regular-source-C1-continuation');
   assert.ok(v.pairTests[0].exactSourceTangentIdentity);
  }
  assert.ok(v.pairTests.every(p=>
   p.officialLineStyle==='undetermined'&&
   p.v5FinalActionAuthorized===false));
  assert.equal(v.fullSolidBoundaryFeatureJoinApproved,false);
 }
 const j=joint({input:s,revision:10});
 assert.equal(j.localSourceTangentEvidence.status,r.status);
 assert.equal(j.regularSourceJunctionContinuationCount,
  r.regularLocalTangencyCount);
 assert.equal(j.fullCurveTopologyVerified,false);
 assert.equal(j.officialLineStylesVerified,false);
 assert.equal(j.v5CurveReady,false);
});
test('Y cap-plane source edges and lateral curves form actual analytic CORNERS, not falsely smoothed arcs',()=>{
 const s=input();s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const r=audit({input:s,revision:4});
 assert.equal(r.status,'scoped-analytic-local-source-tangents');
 assert.ok(r.provenDistinctDirectionCount>0);
 assert.ok(r.junctions.some(v=>v.localSourceType===
  'verified-local-source-corner'));
 for(const v of r.junctions){
  for(const t of v.incidentSourceTangents){
   if(t.kind!=='source-cap-axis')continue;
   assert.equal(t.exactSourceAxis,'z');
   assert.deepEqual(t.direction,{x:0,y:0,z:1});
  }
  if(v.definiteSourceCorner){
   assert.equal(v.incidentEdgeCount,2);
   assert.ok(v.pairTests[0].analyticallySeparatedDirection);
   assert.equal(v.uniqueRegularC1SourceContinuation,false);
  }
 }
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.finalV5CurveAuthorized,false);
});
test('simultaneous cap feature contacts stay multi-valent where graph provides no unique continuation',()=>{
 const s=input();s.zCylinder.zMin=-5;s.zCylinder.zMax=5;
 s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const r=audit({input:s,revision:8});
 assert.equal(r.status,'scoped-analytic-local-source-tangents');
 assert.equal(r.junctions.length,r.sourceGraph3DVertexCount);
 assert.ok(r.junctions.every(v=>v.incidentSourceTangents.length===
  v.incidentEdgeCount));
 assert.ok(r.junctions.filter(v=>v.incidentEdgeCount>2).every(v=>
  !v.uniqueRegularC1SourceContinuation&&!v.definiteSourceCorner));
 for(const v of r.junctions){
  if(v.incidentEdgeCount>2)assert.equal(v.localSourceType,'multivalent-undetermined');
 }
 assert.equal(r.fullSolidBoundaryTopologyVerified,false);
 assert.equal(r.allViewsContinuousVisibilityVerified,false);
});
test('rigid translation of actual cylinders preserves classified C1 source joins and corners',()=>{
 const a=input(),b=input();
 a.yCylinder.yMin=-6;a.yCylinder.yMax=6;
 b.zCylinder.xCenter+=35;b.yCylinder.xCenter+=35;
 b.zCylinder.yCenter+=14;
 b.yCylinder.yMin=-6+14;b.yCylinder.yMax=6+14;
 b.yCylinder.zCenter-=5;
 b.zCylinder.zMin-=5;b.zCylinder.zMax-=5;
 const A=audit({input:a,revision:1}),B=audit({input:b,revision:2});
 assert.equal(A.status,B.status);
 assert.equal(A.regularLocalTangencyCount,B.regularLocalTangencyCount);
 assert.equal(A.provenDistinctDirectionCount,B.provenDistinctDirectionCount);
 assert.equal(A.unresolvedLocalJunctionCount,B.unresolvedLocalJunctionCount);
 assert.equal(B.projected2DCoincidenceNotUsedForJoins,true);
});
test('tangency, malformed source and empty finite region can never sign a C3 local junction',()=>{
 const bad=input();bad.zCylinder.zMax=9;
 const r=audit({input:bad,revision:1});
 assert.equal(r.status,'not-covered');
 assert.equal(r.junctions.length,0);
 assert.equal(r.finalV5CurveAuthorized,false);
 const empty=input();empty.zCylinder.zMin=40;empty.zCylinder.zMax=60;
 const no=audit({input:empty,revision:1});
 assert.equal(no.status,'not-covered');
 assert.equal(no.officialLineStylesVerified,false);
 const forged=input();forged.sourceConfirmed=false;
 assert.throws(()=>audit({input:forged,revision:1}),/human-confirmed/);
});
