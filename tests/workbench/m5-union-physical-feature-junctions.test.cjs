'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const {auditUnionPhysicalFeatureJunctions}=
 require('../../workbench/m5-union-physical-feature-junctions.cjs');
const p=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',p(0,0,0),p(10,10,10));
const B=()=>box('B',p(5,5,5),p(15,15,15));
const audit=(geometry,revision=31)=>
 auditUnionPhysicalFeatureJunctions({geometry,revision});
test('C2 six truly NEW concave face intersection edges meet ORIGINAL exterior source creases at identical physical 3D positions',()=>{
 const result=audit([A(),B()]);
 assert.equal(result.status,'source-recomputed-physical-3d-feature-incidence');
 assert.equal(result.generatedSegmentCount,6);
 assert.ok(result.sourceSegmentCount>0);
 assert.ok(result.nodeCount>0);
 assert.ok(result.sharedPhysicalNodeCount>0);
 assert.ok(result.positiveLocalJunctionCandidateCount>0);
 assert.equal(result.exactEndpointIncidenceVerified,true);
 assert.equal(result.originalAndGeneratedSourceEdgeKindsAccountedFor,true);
 assert.equal(result.allBoundaryJunctionsVerified,false);
 assert.equal(result.officialLineStylesVerified,false);
 assert.equal(result.officialV5FeatureActionsSigned,0);
 assert.equal(result.wholeCompositionV5Ready,false);
 assert.ok(Object.isFrozen(result.nodes));
 const mixed=result.nodes.filter(n=>
  n.incidentOriginalSourceCount>0&&n.incidentGeneratedSourceCount>0);
 assert.ok(mixed.length>0,'real 3D source endpoints from BOTH kinds meet');
 for(const n of result.nodes){
  assert.deepEqual(n.projections,project(n.point3D));
  assert.equal(n.incidentSegmentCount,n.incidences.length);
  assert.ok(n.incidences.every(i=>
   i.physical3DSourceIdentityRecomputed&&
   i.completeSourceStrokeEndpointJoinVerified===false));
  assert.equal(n.lineOrientationAndContinuousFeatureOrderingVerified,false);
  assert.equal(n.fullProjectedIncidentDepthAndOverlapVerified,false);
  assert.equal(n.standardEngineeringLineStyle,'undetermined');
  assert.equal(n.approvedV5JunctionAction,false);
  if(n.localMultiSourcePhysicalJunctionCandidate){
   assert.ok(n.incidentSegmentCount>=2);
   assert.ok(n.occupiedOctantCount>0&&n.occupiedOctantCount<8);
   assert.equal(n.nearButNotIdentical3DPointExists,false);
  }
 }
 const at1010=result.nodes.find(n=>n.point3D.x===10&&
  n.point3D.y===5&&n.point3D.z===10);
 assert.ok(at1010);
 assert.ok(at1010.incidentGeneratedSourceCount>0);
 assert.ok(at1010.incidentOriginalSourceCount>0);
});
test('C2 overlapping boxes: equal V or W paper coordinates do NOT make distinct depth points into 3D source junctions',()=>{
 const r=audit([A(),B()],32);
 assert.ok(r.projectedAliases.some(x=>x.different3DPhysicalPoints));
 assert.ok(r.projectedAliases.every(x=>x.mayJoinDrawingStrokesOnProjectionAlone===false));
 for(const q of r.projectedAliases.filter(x=>x.different3DPhysicalPoints)){
  const [a,b]=q.junctionIds.map(id=>r.nodes.find(n=>n.id===id));
  assert.notDeepEqual(a.point3D,b.point3D);
  assert.deepEqual(a.projections[q.view],b.projections[q.view]);
 }
});
test('C2 third body buried middle creates separate OPEN generated source segments but NOT automatically joined engineering lines',()=>{
 const C=box('C',p(9,4,6),p(11,6,8));
 const r=audit([A(),B(),C],33);
 const generatedAB=r.segments.filter(s=>s.kind==='generated-source-face-crease'&&
  s.sourceGeometryIds.join(',')==='A,B'&&s.sourceAxis==='z'&&
  s.source3DFrom.x===10&&
  s.source3DFrom.y===5);
 assert.equal(generatedAB.length,2);
 assert.deepEqual(generatedAB.map(s=>[s.source3DFrom.z,s.source3DTo.z]),
  [[5,6],[8,10]]);
 assert.ok(r.nodes.some(n=>n.point3D.x===10&&n.point3D.y===5&&n.point3D.z===6));
 assert.ok(r.nodes.some(n=>n.point3D.x===10&&n.point3D.y===5&&n.point3D.z===8));
 assert.equal(r.allBoundaryJunctionsVerified,false);
 assert.equal(r.officialV5FeatureActionsSigned,0);
});
test('C2 no-contact boxes have zero generated-to-original mixed feature endpoints',()=>{
 const far=box('B',p(30,0,0),p(40,10,10));
 const r=audit([A(),far],34);
 assert.equal(r.generatedSegmentCount,0);
 assert.equal(r.sourceSegmentCount,24);
 assert.ok(r.nodes.every(n=>n.incidentGeneratedSourceCount===0));
 assert.equal(r.wholeCompositionV5Ready,false);
});
test('C2 full face contact cannot render its flat source interface as an approved physical feature join',()=>{
 const adjacent=box('B',p(10,0,0),p(20,10,10));
 const r=audit([A(),adjacent],35);
 assert.equal(r.generatedSegmentCount,0);
 assert.ok(r.segments.every(s=>s.sourcePhysicalFeatureOpenIntervalVerified));
 assert.ok(r.segments.every(s=>s.sourceFeatureOpenStatus!==
  'certified-flat-union-boundary-no-crease'));
 assert.equal(r.allBooleanUnionFeaturesEnumerated,false);
 assert.equal(r.officialLineStylesVerified,false);
});
test('C2 edited original box coordinates cannot inherit stale union source graph nodes or V5',()=>{
 const one=audit([A(),B()],36);
 const moved=audit([A(),box('B',p(4,5,5),p(15,15,15))],37);
 assert.equal(one.revision,36);
 assert.equal(moved.revision,37);
 assert.notDeepEqual(one.segments.map(s=>s.source3DFrom),
  moved.segments.map(s=>s.source3DFrom));
 assert.equal(one.officialV5FeatureActionsSigned,0);
 assert.equal(moved.officialV5FeatureActionsSigned,0);
});
test('C2 malformed or duplicate mesh, invalid revision, unsupported non-cuboid are refused',()=>{
 assert.throws(()=>audit([A(),B()],-1),/revision/);
 assert.throws(()=>audit([A(),A()]),/duplicate/);
 const broken=A();broken.data.faces.pop();
 assert.equal(audit([broken,B()]).status,'not-covered-non-cuboid');
 const f=B();f.data.points.V000.x=5.3;
 assert.equal(audit([A(),f]).status,'not-covered-non-cuboid');
});
test('C2 authentic V7 source gate rechecks mixed physical junctions and releases zero signed new strokes',()=>{
 const geometry=[A(),B()],revision=38;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const r=inspectFinalSourceStrokeObligations({
  geometry,revision,sceneDepthEvidence:scene});
 assert.equal(r.physicalFeatureJunctionEvidence.status,
  'source-recomputed-physical-3d-feature-incidence');
 assert.ok(r.physicalFeatureJunctionCount>0);
 assert.ok(r.physicalOriginalGeneratedJunctionCount>0);
 assert.ok(r.physicalCrossSourceJunctionCandidateCount>0);
 assert.equal(r.physicalFeatureJunctionEvidence.allBoundaryJunctionsVerified,false);
 assert.equal(r.fullyJoinedGeneratedStrokeCount,0);
 assert.equal(r.generatedSourceStrokeSignedCount,0);
 assert.equal(r.signedCount,0);
 assert.equal(r.v5Ready,false);
 assert.ok(r.spans.every(s=>s.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/physicalFeatureJunctionCount/);
 assert.match(ui,/physicalOriginalGeneratedJunctionCount/);
 assert.match(ui,/physicalCrossSourceJunctionCandidateCount/);
 assert.match(ui,/接合候选不是正式工程图的端点连接/);
});
