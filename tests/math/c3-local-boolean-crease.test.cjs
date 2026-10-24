'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {auditC3LocalBooleanCreases:audit}=
 require('../../workbench/c3-local-boolean-crease.cjs');
const {auditC3Merged3DSourceGraph:graph}=
 require('../../workbench/c3-merged-3d-source-graph.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('Boolean face retention cannot be guessed from an unspecified engineering image',()=>{
 const r=audit({input:input(),revision:7});
 assert.equal(r.status,'requires-explicit-solid-operation');
 assert.equal(r.solidOperation,'unselected');
 assert.equal(r.localBooleanRetainedFaceSidesVerified,false);
 assert.equal(r.edgeProofs.length,0);
 for(const op of ['difference','subtract','both','',1,undefined]){
  // Explicit undefined is equivalent to unspecified; no implicit selection.
  if(op===undefined)continue;
  assert.throws(()=>audit({input:input(),revision:7,solidOperation:op}),
   /Boolean solid operation must be explicit/);
 }
 const j=joint({input:input(),revision:7});
 assert.equal(j.localBooleanCreaseEvidence.status,
  'requires-explicit-solid-operation');
 assert.equal(j.BooleanSurfaceOperationSelected,false);
 assert.equal(j.officialLineStylesVerified,false);
});
test('selected intersection: regular lateral M3 open curves survive as LOCAL composite creases',()=>{
 const s=input(),revision=8;
 const r=audit({input:s,revision,solidOperation:'intersection'});
 const g=graph({input:s,revision});
 assert.equal(r.status,'scoped-all-source-open-edges-locally-retained');
 assert.equal(r.sourceEdgeCount,g.edges.length);
 assert.ok(r.sourceEdgeCount>=4);
 assert.equal(r.regularLocalCreaseCount,r.sourceEdgeCount);
 assert.equal(r.undeterminedSourceEdgeCount,0);
 assert.equal(r.originalFiniteCapFeatureCount,0);
 assert.equal(r.localBooleanRetainedFaceSidesVerified,true);
 assert.equal(r.selectedBooleanRetainedFaceSectors.activeZSurfaceSide,
  'yCylinder:inside');
 for(const item of r.edgeProofs){
  assert.equal(item.kind,'analytic-curve');
  assert.equal(item.regularTransverseThroughoutOpenEdge,true);
  assert.equal(item.localCompositeCreaseRetained,true);
  assert.equal(item.localFaceSectorsVerified,true);
  const t=item.normalWitness,p=t.point3D;
  const F=(p.x-s.zCylinder.xCenter)**2+
   (p.y-s.zCylinder.yCenter)**2-s.zCylinder.radius**2;
  const G=(p.x-s.yCylinder.xCenter)**2+
   (p.z-s.yCylinder.zCenter)**2-s.yCylinder.radius**2;
  assert.ok(Math.abs(F)<1e-7&&Math.abs(G)<1e-7);
  assert.ok(Math.hypot(...Object.values(t.crossGradient))>1e-7);
  assert.equal(item.verticesAndGlobalBooleanFaceOwnershipVerified,false);
  assert.equal(item.officialLineStyle,'undetermined');
  assert.equal(item.finalV5StrokeAuthorized,false);
 }
 const j=joint({input:s,revision,solidOperation:'intersection'});
 assert.equal(j.BooleanSurfaceOperationSelected,true);
 assert.equal(j.localRegularBooleanCreaseCount,r.regularLocalCreaseCount);
 assert.equal(j.localBooleanCreaseEvidence.solidOperation,'intersection');
 assert.equal(j.fullCurveTopologyVerified,false);
 assert.equal(j.v5CurveReady,false);
});
test('union and intersection require different retained face SECTORS, though both share regular crease geometry',()=>{
 const s=input(),revision=12;
 const a=audit({input:s,revision,solidOperation:'intersection'});
 const b=audit({input:s,revision,solidOperation:'union'});
 assert.equal(b.status,'scoped-all-source-open-edges-locally-retained');
 assert.equal(a.sourceEdgeCount,b.sourceEdgeCount);
 assert.deepEqual(a.edgeProofs.map(x=>x.sourceId),
  b.edgeProofs.map(x=>x.sourceId));
 assert.equal(b.selectedBooleanRetainedFaceSectors.activeZSurfaceSide,
  'yCylinder:outside');
 assert.equal(b.selectedBooleanRetainedFaceSectors.retainedInterior,
  'zCylinder:inside OR yCylinder:inside');
 assert.notDeepEqual(a.selectedBooleanRetainedFaceSectors,
  b.selectedBooleanRetainedFaceSectors);
 assert.ok(b.edgeProofs.every(x=>x.selectedSolidOperation==='union'));
 assert.equal(a.globalRetainedBoundaryComplete,false);
 assert.equal(b.globalRetainedBoundaryComplete,false);
 assert.equal(b.officialLineStylesVerified,false);
});
test('finite Y cap clipping yields independently transverse cap/lateral source line edges',()=>{
 const s=input();s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const r=audit({input:s,revision:5,solidOperation:'intersection'});
 const g=graph({input:s,revision:5});
 assert.equal(r.status,'scoped-all-source-open-edges-locally-retained');
 assert.equal(r.sourceEdgeCount,g.edges.length);
 assert.equal(r.originalFiniteCapFeatureCount,2);
 assert.ok(r.edgeProofs.some(e=>e.kind==='line'));
 for(const e of r.edgeProofs.filter(x=>x.kind==='line')){
  assert.equal(e.status,'regular-local-boolean-crease');
  assert.ok(e.normalWitness.crossGradient);
  assert.ok(Math.hypot(...Object.values(e.normalWitness.crossGradient))>0);
  assert.equal(e.verticesAndGlobalBooleanFaceOwnershipVerified,false);
  assert.equal(e.officialLineStyle,'undetermined');
 }
 assert.equal(r.allSourceGraphVerticesCertified,false);
});
test('both sets of finite caps generate transverse cap-cap and cap-lateral local source edges',()=>{
 const s=input();
 s.zCylinder.zMin=-5;s.zCylinder.zMax=5;
 s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const r=audit({input:s,revision:6,solidOperation:'union'});
 assert.equal(r.status,'scoped-all-source-open-edges-locally-retained');
 assert.equal(r.originalFiniteCapFeatureCount,10);
 const faces=r.edgeProofs.filter(x=>x.kind==='line');
 assert.ok(faces.length>=10);
 assert.ok(faces.every(x=>x.localCompositeCreaseRetained===true));
 assert.ok(faces.some(x=>x.normalWitness.analyticGlobalReason
  .includes('convexity')));
 assert.equal(r.fullVHWVisibilityVerified,false);
 assert.equal(r.finalV5CurveAuthorized,false);
});
test('translation preserves local crease classification without claiming global contours',()=>{
 const a=input(),b=input();
 a.yCylinder.yMin=-6;a.yCylinder.yMax=6;
 b.zCylinder.xCenter+=35;b.yCylinder.xCenter+=35;
 b.zCylinder.yCenter+=14;
 b.yCylinder.yMin=-6+14;b.yCylinder.yMax=6+14;
 b.yCylinder.zCenter-=5;
 b.zCylinder.zMin-=5;b.zCylinder.zMax-=5;
 const A=audit({input:a,revision:1,solidOperation:'intersection'});
 const B=audit({input:b,revision:2,solidOperation:'intersection'});
 assert.equal(A.status,B.status);
 assert.equal(A.sourceEdgeCount,B.sourceEdgeCount);
 assert.equal(A.regularLocalCreaseCount,B.regularLocalCreaseCount);
 assert.deepEqual(A.edgeProofs.map(x=>x.kind),B.edgeProofs.map(x=>x.kind));
 assert.equal(B.globalRetainedBoundaryComplete,false);
});
test('cap plane tangency and absent intersection must never generate local Boolean proofs',()=>{
 const tangent=input();tangent.zCylinder.zMax=9;
 const r=audit({input:tangent,revision:3,solidOperation:'intersection'});
 assert.equal(r.status,'not-covered');
 assert.equal(r.edgeProofs.length,0);
 assert.equal(r.finalV5CurveAuthorized,false);
 const absent=input();absent.zCylinder.zMin=40;absent.zCylinder.zMax=60;
 const x=audit({input:absent,revision:3,solidOperation:'union'});
 assert.equal(x.status,'not-covered');
 assert.equal(x.localBooleanRetainedFaceSidesVerified,false);
 const untrusted=input();untrusted.sourceConfirmed=false;
 assert.throws(()=>audit({input:untrusted,revision:3,
  solidOperation:'intersection'}),/human-confirmed/);
});
test('existing actual W/V/H auxiliary V5 remains uncertified by new Boolean proof',()=>{
 const source=fs.readFileSync('workbench/c3-local-boolean-crease.cjs','utf8');
 assert.doesNotMatch(source,/officialLineStylesVerified:true|finalV5CurveAuthorized:true/);
 assert.match(source,/globalRetainedBoundaryComplete:false/);
 assert.match(source,/sourceGraph3DVertexIds/);
});
