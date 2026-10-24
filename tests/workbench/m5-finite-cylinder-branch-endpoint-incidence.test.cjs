'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {auditFiniteCylinderEndpointIncidence}=
 require('../../workbench/m5-analytic-cylinder-endpoint-incidence.cjs');
const {compileFiniteCylinderEndpointV5}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
function model(){
 return {kind:'finite-orthogonal-cylinder-intersection',unit:'mm',sourceConfirmed:true,
  zCylinder:{radius:10,xCenter:0,yCenter:0,zMin:-15,zMax:15},
  yCylinder:{radius:6,xCenter:0,zCenter:0,yMin:-15,yMax:15}};
}
const audit=(input=model(),revision=4)=>
 auditFiniteCylinderEndpointIncidence({input,revision});
test('C3 four analytic sign branches have 8 authentic endpoints at 4 real 3D junction positions',()=>{
 const r=audit();
 assert.equal(r.status,'scoped-analytic-3d-endpoint-incidence');
 assert.equal(r.sourceM3BranchCount,4);
 assert.equal(r.endpoints.length,8);
 assert.equal(r.junctions.length,4);
 assert.equal(r.verified3DJunctionCount,4);
 assert.equal(r.pairedSignedRadicalCount,4);
 assert.equal(r.allSourceEndpointEquationsRecomputed,true);
 assert.equal(r.fullBranchTopologyVerified,false);
 assert.equal(r.standardLineStylesVerified,false);
 assert.equal(r.v5CurveReady,false);
 assert.ok(Object.isFrozen(r.junctions));
 for(const j of r.junctions){
  assert.equal(j.incidentBranchIds.length,2);
  assert.equal(j.classification,'analytic-signed-radical-coalescence-candidate');
  assert.equal(j.completeSpatialCurveConnectivityVerified,false);
  assert.equal(j.standardLineStylesVerified,false);
  assert.ok(j.pairedRadicalCandidates.every(p=>
   p.sameExact3DAnalyticEndpoint&&p.signedRadicalEqualityVerified&&
   p.eligibleRadicalCoalescenceCandidate&&
   !p.globalSmoothBranchContinuationVerified));
 }
 for(const e of r.endpoints){
  assert.deepEqual(e.projections,project(e.point3D));
  assert.equal(e.originalAnalyticEquationAndFiniteCapsVerified,true);
  assert.equal(e.completeCurveJunctionVerified,false);
 }
});
test('C3 W paper has co-projected physically different ±X junctions, never a real 3D join',()=>{
 const r=audit();
 assert.ok(r.distinct3DProjectedCoincidenceCount>=2);
 const aliases=r.projectedCoincidences.filter(p=>
  p.view==='W'&&p.distinct3DPhysicalPoints);
 assert.ok(aliases.length>=2);
 for(const a of aliases){
  assert.equal(a.mayInferPhysicalJoinFromPaperPoint,false);
  assert.equal(a.officialCurveJunctionApproved,false);
 }
});
test('C3 cap-trimmed branches end at real finite cap points without a fake sign merge',()=>{
 const input=model();input.yCylinder.yMin=9;input.yCylinder.yMax=11;
 const r=audit(input);
 assert.equal(r.status,'scoped-analytic-3d-endpoint-incidence');
 assert.equal(r.sourceM3BranchCount,2);
 assert.equal(r.endpoints.length,4);
 assert.equal(r.junctions.length,4);
 assert.equal(r.pairedSignedRadicalCount,0);
 assert.ok(r.junctions.every(j=>j.classification==='single-branch-terminal'));
 assert.ok(r.junctions.every(j=>j.finiteCapTermination));
 assert.equal(r.v5CurveReady,false);
});
test('C3 disconnected cap branch source and translated unequal axes stay independently bounded',()=>{
 const cap=model();cap.zCylinder.zMin=0;cap.zCylinder.zMax=3;
 cap.yCylinder.yMin=0;cap.yCylinder.yMax=20;
 const c=audit(cap,8);
 assert.equal(c.sourceM3BranchCount,2);
 assert.equal(c.endpoints.length,4);
 assert.equal(c.fullBranchTopologyVerified,false);
 const offset=model();
 offset.zCylinder.radius=8;offset.zCylinder.xCenter=3;offset.zCylinder.yCenter=-7;
 offset.yCylinder.xCenter=-2;offset.yCylinder.zCenter=15;
 offset.zCylinder.zMin=-30;offset.zCylinder.zMax=30;
 offset.yCylinder.yMin=-30;offset.yCylinder.yMax=30;
 const o=audit(offset,9);
 assert.equal(o.status,'scoped-analytic-3d-endpoint-incidence');
 assert.equal(o.sourceM3BranchCount,4);
 assert.ok(o.endpoints.every(e=>
  e.originalAnalyticEquationAndFiniteCapsVerified));
});
test('C3 no intersection/tangent cannot be promoted to line styles or official V5',()=>{
 const no=model();no.yCylinder.xCenter=30;
 assert.equal(audit(no).status,'not-covered');
 const tangency=model();tangency.yCylinder.xCenter=16;
 assert.equal(audit(tangency).status,'not-covered');
 const cap=model();cap.yCylinder.yMin=10;cap.yCylinder.yMax=11;
 assert.equal(audit(cap).status,'not-covered');
});
test('C3 untrusted source, non-mm units, metadata injection, stale revision rejected',()=>{
 const unconfirmed=model();unconfirmed.sourceConfirmed=false;
 assert.throws(()=>audit(unconfirmed),/confirmed/);
 const px=model();px.unit='px';
 assert.throws(()=>audit(px),/confirmed/);
 const forged=model();forged.globalJunctionTopologyVerified=true;
 assert.throws(()=>audit(forged),/confirmed/);
 assert.throws(()=>audit(model(),-1),/revision/);
});
test('C3 M5 junction records attach to existing proven endpoint POINT V5 only',()=>{
 const r=compileFiniteCylinderEndpointV5({input:model(),revision:5,
  sheetTransform:{origin:{x:340,y:200},scale:3}});
 assert.equal(r.sourceM5JunctionEvidence.status,
  'scoped-analytic-3d-endpoint-incidence');
 assert.equal(r.sourceM5JunctionEvidence.verified3DJunctionCount,4);
 assert.equal(r.sourceM5JunctionEvidence.standardLineStylesVerified,false);
 assert.equal(r.signedEndpointPointActionCount,24);
 assert.equal(r.endpointPointV5Ready,true);
 assert.equal(r.entireCurveV5Ready,false);
 assert.ok(r.constructionSteps.every(s=>s.actions.every(a=>a.kind==='point')));
 assert.equal(r.singleOriginalV5Player,true);
});
