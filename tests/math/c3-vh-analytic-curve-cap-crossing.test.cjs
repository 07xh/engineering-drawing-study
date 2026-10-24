'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {arrangeProjectedCircleArcsAndLines:arrange}=
 require('../../core/projection/projected-circle-arc-line-events.cjs');
const {auditC3VHAnalyticCurveCapCrossings:audit}=
 require('../../workbench/c3-vh-analytic-curve-cap-crossings.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const circle=(id='c',sign=1,range=[-4.5,4.5])=>({
 id,view:'V',center:{u:0,v:0},radius:5,sign,uRange:range});
const line=(id,a,b)=>({id,view:'V',from:a,to:b});
const p=(u,v)=>({u,v});
const src=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('exact circle-line double open intersections from quadratic roots, not sampled SVG chords',()=>{
 const r=arrange({view:'V',arcs:[circle()],lines:[
  line('through',p(-6,3),p(6,3))
 ]});
 assert.equal(r.events.length,2);
 assert.equal(r.strictTransverseOpenEventCount,2);
 assert.deepEqual(r.events.map(e=>e.curveParameterU),[-4,4]);
 assert.deepEqual(r.events.map(e=>e.lineParameter),[1/6,5/6]);
 assert.ok(r.events.every(e=>e.projectedUV.v===3));
 assert.ok(r.events.every(e=>e.classification===
  'strict-projected-open-interior-crossing'));
 assert.ok(r.events.every(e=>e.actual3DSourceJoinVerified===false));
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.finalV5StrokeAuthorized,false);
 assert.equal(Object.isFrozen(r.events[0]),true);
});
test('unrelated circle and line do not invent intersections',()=>{
 const r=arrange({view:'V',arcs:[circle()],lines:[
  line('far',p(-4,9),p(4,9))
 ]});
 assert.equal(r.events.length,0);
 assert.equal(r.allAnalyticPairsEnumeratedWithinCircleLineScope,true);
});
test('tangency, curve endpoint, 3D projected collapse remain critical, unsigned',()=>{
 const tangent=arrange({view:'V',arcs:[circle('a',1,[-5,5])],
  lines:[line('touch',p(-6,5),p(6,5))]});
 assert.equal(tangent.events.length,1);
 assert.equal(tangent.events[0].classification,
  'critical-or-endpoint-undetermined');
 assert.equal(tangent.events[0].criticalReason,
  'tangent-or-near-tangent-root-unresolved');
 const end=arrange({view:'V',arcs:[circle('a',1,[-4,4])],
  lines:[line('cross',p(-6,3),p(6,3))]});
 assert.equal(end.events.length,2);
 assert.equal(end.strictTransverseOpenEventCount,0);
 const collapse=arrange({view:'V',arcs:[circle('a',1,[-4,4])],
  lines:[line('point',p(3,4),p(3,4))]});
 assert.equal(collapse.events.length,1);
 assert.equal(collapse.events[0].classification,'critical-or-endpoint-undetermined');
 assert.equal(collapse.events[0].criticalReason,'line-projection-collapsed-to-point');
});
test('deduplicated 2D sources and malformed type or formula cannot become true 3D joins',()=>{
 assert.throws(()=>arrange({view:'Q',arcs:[],lines:[]}),/first-angle/);
 assert.throws(()=>arrange({view:'V',arcs:[circle(),circle()],
  lines:[]}),/unique projected/);
 assert.throws(()=>arrange({view:'V',arcs:[{...circle(),sign:0}],
  lines:[]}),/bounded circle/);
 assert.throws(()=>arrange({view:'V',arcs:[circle()],
  lines:[line('c',p(NaN,0),p(0,1))]}),/bounded exact/);
 assert.throws(()=>arrange({view:'V',arcs:[circle()],
  lines:[],tolerance:Infinity}),/first-angle/);
});
test('real C3 finite cap source crossing events recompute original V/H sources and preserve 3D ambiguity',()=>{
 const input=src();
 input.yCylinder.yMin=-6;input.yCylinder.yMax=6;
 input.zCylinder.zMin=-5;input.zCylinder.zMax=5;
 const proof=audit({input,revision:12});
 assert.equal(proof.status,'scoped-exact-VH-analytic-curve-cap-crossing-ledger');
 assert.equal(proof.originalFiniteCapSourceCount,10);
 assert.ok(proof.projectedIntersectionCandidateCount>0);
 assert.equal(proof.allVHAnalyticCurveCapSourcePairsEnumerated,true);
 assert.equal(proof.allViewsIncludingWComplete,false);
 for(const e of proof.events){
  assert.ok(['V','H'].includes(e.view));
  assert.equal(e.projectionAloneDoesNotProve3DJoin,true);
  assert.equal(e.officialLineStyle,'undetermined');
  assert.equal(e.finalV5StrokeAuthorized,false);
  assert.ok(e.verified3DMatchingBranchIds.length+
   e.verified3DSeparatedBranchIds.length>=1);
  assert.equal(e.physical3DSourceContactCandidate,
   e.verified3DMatchingBranchIds.length>0);
 }
 const combined=joint({input,revision:12,solidOperation:'intersection'});
 assert.equal(combined.projectedVHCurveCapCrossingEvidence.status,proof.status);
 assert.equal(combined.sourceVHAnalyticCurveLinePairCoverageVerified,true);
 assert.equal(combined.officialLineStylesVerified,false);
 assert.equal(combined.v5CurveReady,false);
});
test('no physical cap source preserves valid zero-event coverage without false completion',()=>{
 const proof=audit({input:src(),revision:2});
 assert.equal(proof.originalFiniteCapSourceCount,0);
 assert.equal(proof.events.length,0);
 assert.equal(proof.allVHAnalyticCurveCapSourcePairsEnumerated,true);
 assert.equal(proof.allSpatialCurveLineJunctionsCertified,false);
 const malformed=src();malformed.yCylinder.xCenter=60;
 const blocked=audit({input:malformed,revision:3});
 assert.equal(blocked.status,'not-covered');
 assert.equal(blocked.officialLineStylesVerified,false);
});
