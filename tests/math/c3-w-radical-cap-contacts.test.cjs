'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {intersectSignedRadicalCurveWithAxisLine:intersect}=
 require('../../core/projection/signed-radical-axis-line-events.cjs');
const {auditC3WAnalyticCurveCapContacts:audit}=
 require('../../workbench/c3-w-analytic-curve-cap-contacts.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const p=(u,v)=>({u,v});
const source=()=>({parameter:{from:-4.5,to:4.5},coordinates:{
 x:{kind:'affine',offset:0,slope:1},
 y:{kind:'signed-circle-radical',center:0,offset:0,radius:5,sign:1},
 z:{kind:'signed-circle-radical',center:0,offset:0,radius:6,sign:1}
}});
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('W exact two inverse-radical roots retain distinct 3D x at the SAME projected y/z',()=>{
 const v=Math.sqrt(20),r=intersect({
  curve:source(),from:p(2,v),to:p(4,v)});
 assert.equal(r.events.length,2);
 assert.equal(r.allAxisLineContactsWithinSupportedScopeEnumerated,true);
 assert.deepEqual(r.events.map(e=>e.parameterX),[-4,4]);
 assert.deepEqual(r.events.map(e=>e.projectedUV.u),[3,3]);
 assert.deepEqual(r.events.map(e=>e.projectedUV.v),[v,v]);
 assert.ok(r.events.every(e=>e.classification===
  'strict-projected-interior-contact'));
 assert.ok(r.events.every(e=>e.physical3DSourceJoinVerified===false));
 assert.equal(r.finalV5StrokeAuthorized,false);
});
test('W vertical source axis-line and X-axis collapsed source preserve analytic candidates without creating fake lines',()=>{
 const v=Math.sqrt(20),g=source();
 const vertical=intersect({curve:g,from:p(3,3),to:p(3,6)});
 assert.equal(vertical.events.length,2);
 assert.equal(vertical.events[0].projectedLineCollapsed,false);
 const point=intersect({curve:g,from:p(3,v),to:p(3,v)});
 assert.equal(point.events.length,2);
 assert.ok(point.events.every(e=>e.projectedLineCollapsed&&
  e.projectedLineParameter===null&&
  e.classification==='critical-or-endpoint-undetermined'));
 assert.equal(point.originalParameterXMultiplicityPreserved,true);
});
test('wrong signed half, disjoint axis line, near-extremal and branch endpoint remain safe',()=>{
 const neg=source();neg.coordinates.y.sign=-1;
 assert.equal(intersect({curve:neg,from:p(2,Math.sqrt(20)),
  to:p(4,Math.sqrt(20))}).events.length,0);
 assert.equal(intersect({curve:source(),from:p(9,7),to:p(10,7)}).events.length,0);
 const tangent=intersect({curve:source(),from:p(4,6),to:p(6,6)});
 assert.equal(tangent.events.length,1);
 assert.equal(tangent.events[0].classification,'critical-or-endpoint-undetermined');
 assert.equal(tangent.events[0].criticalReason,
  'radial-stationary-tangency-or-degeneracy');
 const atLimit=source();atLimit.parameter.from=4;
 assert.equal(intersect({curve:atLimit,from:p(2,Math.sqrt(20)),
  to:p(4,Math.sqrt(20))}).events[0].classification,
  'critical-or-endpoint-undetermined');
});
test('untrusted numerical source, diagonal and non-real radicals reject before M5',()=>{
 const model=source();
 assert.throws(()=>intersect({curve:model,from:p(0,0),
  to:p(1,1)}),/axis-aligned/);
 assert.throws(()=>intersect({curve:model,from:p(NaN,0),
  to:p(1,0)}),/bounded exact/);
 assert.throws(()=>intersect({curve:{...model,coordinates:{
  ...model.coordinates,y:{...model.coordinates.y,sign:2}}},
  from:p(0,0),to:p(1,0)}),/bounded exact/);
 assert.throws(()=>intersect({curve:model,from:p(0,0),
  to:p(1,0),tolerance:0}),/bounded exact/);
});
test('real clipped finite C3 W source cap contacts retain true vs paper-only 3D identities',()=>{
 const s=input();
 s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 s.zCylinder.zMin=-5;s.zCylinder.zMax=5;
 const proof=audit({input:s,revision:12});
 assert.equal(proof.status,'scoped-exact-W-analytic-curve-cap-line-events');
 assert.equal(proof.sourceFiniteCapPairCount,10);
 assert.equal(proof.allWCurveCapPairsEnumerated,true);
 assert.ok(proof.projectedContactCandidateCount>0);
 for(const e of proof.events){
  assert.equal(e.view,'W');
  assert.equal(e.pointwiseTrue3DSourceCoincidenceVerified,
   !e.projectedSourceOnlyNotPhysicalJoin);
  assert.equal(e.officialLineStyle,'undetermined');
  assert.equal(e.finalV5StrokeAuthorized,false);
  assert.ok(Number.isFinite(e.signedCapMinusCurveObserverDepth));
 }
 const combined=joint({input:s,revision:12,solidOperation:'intersection'});
 assert.equal(combined.WCurveCapLineEvidence.status,proof.status);
 assert.equal(combined.WAnalyticCurveCapContactCoverageVerified,true);
 assert.equal(combined.officialLineStylesVerified,false);
 assert.equal(combined.v5CurveReady,false);
});
test('finite C3 without cap contacts yields exact empty W ledger, no false final certification',()=>{
 const proof=audit({input:input(),revision:4});
 assert.equal(proof.sourceFiniteCapPairCount,0);
 assert.equal(proof.events.length,0);
 assert.equal(proof.allWCurveCapPairsEnumerated,true);
 const bad=input();bad.yCylinder.xCenter=80;
 const blocked=audit({input:bad,revision:5});
 assert.equal(blocked.status,'not-covered');
 assert.equal(blocked.officialLineStylesVerified,false);
});
