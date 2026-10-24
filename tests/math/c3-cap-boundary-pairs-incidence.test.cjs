'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluateFiniteCylinderCapBoundaryPairs:solve}=
 require('../../engines/spatial/intersections/finite-cylinder-cap-boundary-pairs.cjs');
const {auditC3CapBoundaryIncidence:audit}=
 require('../../workbench/c3-cap-boundary-incidence.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const {project}=require('../../core/projection/conventions.js');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const close=(x,y)=>assert.ok(Math.abs(x-y)<=1e-7,
 'independent exact face geometry mismatch '+x+' vs '+y);
test('finite Z and Y cap disk face pairs enumerate all 3 nondegenerate types',()=>{
 const a=input();
 a.zCylinder.zMin=-5;a.zCylinder.zMax=5;
 a.yCylinder.yMin=-6;a.yCylinder.yMax=6;
 const r=solve({input:a,revision:11});
 assert.equal(r.status,'scoped-analytic-cap-boundary-pairs');
 assert.equal(r.capRelatedBoundaryPairsCompleteWithinScope,true);
 assert.equal(r.allEndpointsOnSourceFacesVerified,true);
 assert.equal(r.capLateralSegments.length,6);
 assert.equal(r.capCapSegments.length,4);
 assert.equal(r.segments.length,10);
 const types=new Set(r.segments.map(s=>s.pairKind));
 assert.deepEqual([...types].sort(),[
  'y-cap-to-z-lateral','z-cap-to-y-cap','z-cap-to-y-lateral']);
 const {zCylinder:Z,yCylinder:Y}=a;
 for(const segment of r.segments){
  assert.equal(segment.continuousSegmentCertifiedByDiskConvexity,true);
  assert.equal(segment.sourcePairImplicitAndAxialConstraintsVerified,true);
  assert.equal(segment.finiteBoundaryContactVerified,true);
  assert.equal(segment.officialLineStyle,'undetermined');
  assert.equal(segment.v5OfficialCurveAuthorized,false);
  assert.ok(segment.lengthModelMm>0);
  assert.equal(segment.witnesses.length,3);
  const midpoint={x:(segment.from.x+segment.to.x)/2,
   y:(segment.from.y+segment.to.y)/2,
   z:(segment.from.z+segment.to.z)/2};
  for(const p of [segment.from,midpoint,segment.to]){
   assert.ok(p.z>=Z.zMin&&p.z<=Z.zMax);
   assert.ok(p.y>=Y.yMin&&p.y<=Y.yMax);
   assert.ok((p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2<=Z.radius**2+1e-7);
   assert.ok((p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2<=Y.radius**2+1e-7);
   if(segment.pairKind==='z-cap-to-y-lateral'){
    close((p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2,Y.radius**2);
    assert.ok(p.z===Z.zMin||p.z===Z.zMax);
   }else if(segment.pairKind==='y-cap-to-z-lateral'){
    close((p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2,Z.radius**2);
    assert.ok(p.y===Y.yMin||p.y===Y.yMax);
   }else{
    assert.ok(p.z===Z.zMin||p.z===Z.zMax);
    assert.ok(p.y===Y.yMin||p.y===Y.yMax);
   }
   const entry=segment.witnesses.find(w=>
    Math.hypot(w.point3D.x-p.x,w.point3D.y-p.y,
     w.point3D.z-p.z)<1e-9);
   assert.ok(entry);
   assert.deepEqual(entry.projections,project(p));
  }
 }
 assert.ok(Object.isFrozen(r));
 assert.ok(Object.isFrozen(r.segments[0].from));
 assert.equal(r.fullSolidBoundaryTopologyVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.finalCurveV5Authorized,false);
});
test('true Y cap terminal contacts bind lateral/lateral M3 endpoints to additional cap edges in 3D',()=>{
 const s=input();
 s.yCylinder.yMin=-6;s.yCylinder.yMax=6;
 const r=audit({input:s,revision:7});
 assert.equal(r.status,'scoped-analytic-cap-junction-incidence');
 assert.equal(r.capPairSourceSegmentCount,2);
 assert.equal(r.sourceLateralCapTerminalCount,4);
 assert.equal(r.joinedLateralCapTerminalCount,4);
 assert.deepEqual(r.unmatchedLateralCapTerminalIds,[]);
 assert.equal(r.allLateralCapTerminalsIdentifiedWithinSourceScope,true);
 assert.ok(r.capJunctions.some(j=>j.sourceLateralJunctionIds.length===1));
 assert.ok(r.capJunctions.every(j=>j.officialLineStyle==='undetermined'));
 const g=joint({input:s,revision:7});
 assert.equal(g.status,'scoped-open-interval-joint-evidence');
 assert.equal(g.capRelatedFeatureSegmentsEnumerated,2);
 assert.equal(g.capRelatedTopologyJoinedToLateralWithinSourceScope,true);
 assert.ok(g.junctionGuards.filter(j=>j.finiteCapTermination).every(j=>
  j.sourceCapBoundaryFacePairEndpointFound&&j.verifiedCapPairJunctionId));
 assert.ok(g.junctionGuards.every(j=>j.fullFeatureJoinAuthorized===false));
 assert.equal(g.fullCurveTopologyVerified,false);
 assert.equal(g.officialLineStylesVerified,false);
 assert.equal(g.v5CurveReady,false);
});
test('Z cap clipping also produces distinct source endcap-to-Y lateral intervals',()=>{
 const s=input();s.zCylinder.zMin=-5;s.zCylinder.zMax=5;
 const r=solve({input:s,revision:3});
 assert.equal(r.status,'scoped-analytic-cap-boundary-pairs');
 assert.equal(r.capLateralSegments.filter(x=>
  x.pairKind==='z-cap-to-y-lateral').length,4);
 assert.equal(r.capCapSegments.length,0);
 const j=audit({input:s,revision:3});
 assert.equal(j.status,'scoped-analytic-cap-junction-incidence');
 assert.equal(j.joinedLateralCapTerminalCount,
  j.sourceLateralCapTerminalCount);
 assert.equal(j.finalV5CurveAuthorized,false);
});
test('unclipped baseline has no fake cap intersections but still checks the full face-pair family',()=>{
 const r=solve({input:input(),revision:2});
 assert.equal(r.status,'scoped-analytic-cap-boundary-pairs');
 assert.equal(r.regularNonzeroSegmentCount,0);
 assert.equal(r.capRelatedBoundaryPairsCompleteWithinScope,true);
 const joined=audit({input:input(),revision:2});
 assert.equal(joined.capPairSourceSegmentCount,0);
 assert.equal(joined.sourceLateralCapTerminalCount,0);
 assert.equal(joined.fullCompositeBoundaryTopologyVerified,false);
});
test('tangent and degenerate cap-to-lateral generator must NOT be certified or drawn',()=>{
 const s=input();
 s.zCylinder.zMax=s.yCylinder.radius;
 const r=solve({input:s,revision:8});
 assert.equal(r.status,'degenerate-undetermined');
 assert.equal(r.capRelatedBoundaryPairsCompleteWithinScope,false);
 assert.equal(r.segments.length,0);
 assert.equal(r.finalCurveV5Authorized,false);
 const guard=audit({input:s,revision:8});
 assert.equal(guard.status,'not-covered');
 assert.equal(guard.finalV5CurveAuthorized,false);
 const g=joint({input:s,revision:8});
 assert.equal(g.capBoundaryEvidence.status,'not-covered');
 assert.equal(g.fullCurveTopologyVerified,false);
});
test('source validation, empty lateral region, and revision cannot fabricate a cap graph',()=>{
 const untrusted=input();untrusted.sourceConfirmed=false;
 assert.throws(()=>solve({input:untrusted,revision:9}),/human-confirmed/);
 assert.throws(()=>solve({input:input(),revision:-1}),/revision/);
 const s=input();s.zCylinder.zMin=40;s.zCylinder.zMax=60;
 const r=solve({input:s,revision:2});
 assert.equal(r.status,'scoped-analytic-cap-boundary-pairs');
 assert.equal(r.segments.length,0);
 const guard=audit({input:s,revision:2});
 assert.equal(guard.status,'scoped-cap-pairs-without-lateral-source');
 assert.equal(guard.finalV5CurveAuthorized,false);
});
