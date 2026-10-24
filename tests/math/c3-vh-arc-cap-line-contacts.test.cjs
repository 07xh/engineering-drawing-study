'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {intersectCircleSubarcWithLine:intersect}=
 require('../../core/projection/analytic-arc-line-contacts.cjs');
const {auditC3VHArcCapLineContacts:audit}=
 require('../../workbench/c3-vh-arc-cap-line-contacts.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const circle={xCenter:0,coordinateCenter:0,radius:5};
test('exact signed upper semicircle with horizontal line yields BOTH quadratic intersection roots',()=>{
 const result=intersect({circle,sign:1,xRange:[-5,5],
  from:{u:-6,v:3},to:{u:6,v:3}});
 assert.equal(result.classification,'strictly-transverse-source-contacts');
 assert.equal(result.contacts.length,2);
 assert.equal(result.contacts[0].uv.u,-4);
 assert.equal(result.contacts[1].uv.u,4);
 assert.equal(result.contacts[0].uv.v,3);
 assert.ok(result.contacts.every(c=>
  c.exactCircleLineEquationVerified&&
  c.signedBranchAndFiniteXRangeVerified&&
  c.officialLineStyle==='undetermined'));
 const lower=intersect({circle,sign:-1,xRange:[-5,5],
  from:{u:-6,v:3},to:{u:6,v:3}});
 assert.equal(lower.contacts.length,0);
 assert.equal(lower.classification,'no-in-scope-signed-arc-contact');
});
test('finite analytic x-domain filters roots without invented crossings or incorrect clip gaps',()=>{
 const r=intersect({circle,sign:1,xRange:[-3,3],
  from:{u:-6,v:3},to:{u:6,v:3}});
 assert.equal(r.contacts.length,0);
 const right=intersect({circle,sign:1,xRange:[0,5],
  from:{u:-6,v:3},to:{u:6,v:3}});
 assert.equal(right.contacts.length,1);
 assert.equal(right.contacts[0].uv.u,4);
});
test('tangent and near-tangent are BLOCKERS, not guaranteed two crossings or final visible strokes',()=>{
 const exact=intersect({circle,sign:1,xRange:[-5,5],
  from:{u:-6,v:5},to:{u:6,v:5}});
 assert.equal(exact.classification,'tangent-or-near-degenerate-undetermined');
 assert.equal(exact.contacts.length,0);
 assert.equal(exact.sourceAlgebraVerified,false);
 const none=intersect({circle,sign:1,xRange:[-5,5],
  from:{u:-6,v:6},to:{u:6,v:6}});
 assert.equal(none.classification,'strictly-disjoint');
 assert.equal(none.contacts.length,0);
});
test('reject zero paper-length source, forged radial sign and invalid analytic arc domain',()=>{
 const baseline={circle,sign:1,xRange:[-5,5],
  from:{u:-6,v:3},to:{u:6,v:3}};
 assert.throws(()=>intersect({...baseline,sign:0}),/bounded signed/);
 assert.throws(()=>intersect({...baseline,xRange:[2,2]}),/bounded signed/);
 assert.throws(()=>intersect({...baseline,to:{u:-6,v:3}}),/collapsed/);
 assert.throws(()=>intersect({...baseline,circle:{...circle,radius:-2}}),
  /bounded signed/);
});
test('finite C3 Y-cap source lines cut signed V/H analytic arcs at exact source points with TRUE 3D depth witnesses',()=>{
 const input=model();input.yCylinder.yMin=-6;input.yCylinder.yMax=6;
 const r=audit({input,revision:4});
 assert.match(r.status,/scoped-/);
 assert.equal(r.firstAngleViewsCovered[0],'V');
 assert.equal(r.firstAngleViewsCovered[1],'H');
 assert.ok(r.signedArcAtoms.length>0);
 assert.ok(r.contacts.length>0,'genuine Y cap cuts must produce source circle-line crossings');
 for(const row of r.contacts){
  assert.ok(['V','H'].includes(row.view));
  assert.equal(row.exactQuadraticArcLineEquationVerified,true);
  assert.equal(row.firstAnglePhysicalDepthAtIntersectionCompared,true);
  assert.equal(row.officialLineStyle,'undetermined');
  assert.equal(row.finalV5StrokeAuthorized,false);
  assert.ok(row.sourceBranchDepths.length>0);
  for(const w of row.sourceBranchDepths){
   assert.equal(w.sourceBranchIdentityVerified,true);
   assert.equal(w.adjacentIntervalDepthOrderProven,false);
   const depth=row.view==='V'?-w.point3D.y:w.point3D.z;
   assert.ok(Math.abs(depth-w.observerDepth)<1e-7);
  }
 }
 for(const atom of r.signedArcAtoms){
  assert.ok(atom.openXRange[1]>atom.openXRange[0]);
  assert.ok(atom.sourceBranchIds.length>0);
  assert.equal(atom.standardLineStyle,'undetermined');
  assert.equal(atom.finalV5StrokeAuthorized,false);
 }
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.allProjectedCurvesAndLinesResolved,false);
 const j=joint({input,revision:4,solidOperation:'intersection'});
 assert.equal(j.VHArcCapLineEvidence.status,r.status);
 assert.equal(j.VHAnalyticCurveCapCrossingsEnumerated,r.exactQuadraticContactCount);
 assert.equal(j.fullCurveTopologyVerified,false);
});
test('real both-cylinder cap clipping exposes source-bounded V/H intersection roots without authorizing final engineering drawing',()=>{
 const input=model();input.zCylinder.zMin=-5;input.zCylinder.zMax=5;
 input.yCylinder.yMin=-6;input.yCylinder.yMax=6;
 const r=audit({input,revision:7});
 assert.ok(r.exactQuadraticContactCount>0);
 assert.equal(r.signedArcAtoms.length>=r.projectedArcSourceCount,true);
 assert.ok(r.contacts.every(c=>c.sourceCap3DPoint&&c.sourceBranchDepths));
 assert.equal(r.all3DTo2DCompositeLineStyleJoinsVerified,false);
 assert.equal(r.finalV5StrokeAuthorized,false);
});
test('baseline with no finite cap boundary lines returns original V/H projected arc coverage unchanged',()=>{
 const r=audit({input:model(),revision:2});
 assert.equal(r.status,'scoped-transverse-VH-arc-cap-contacts');
 assert.equal(r.contacts.length,0);
 assert.equal(r.tangentBlockers.length,0);
 assert.equal(r.signedArcAtoms.length,r.projectedArcSourceCount);
 assert.equal(r.officialLineStylesVerified,false);
});
test('failed source revision/degenerate cap cannot invent certified C3 arc-line junctions',()=>{
 const input=model();input.zCylinder.zMax=9;
 const r=audit({input,revision:2});
 assert.equal(r.status,'not-covered');
 assert.equal(r.contacts.length,0);
 assert.equal(r.finalV5StrokeAuthorized,false);
 assert.throws(()=>audit({input:model(),revision:-1}),/revision/);
});
