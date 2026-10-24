'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../../core/projection/conventions.js');
const {auditUnionPhysicalFeatureJunctions}=
 require('../../workbench/m5-union-physical-feature-junctions.cjs');
const {inspectUnionDirectionalJunctions}=
 require('../../workbench/m5-union-directional-junctions.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>box('A',P(0,0,0),P(10,10,10));
const B=()=>box('B',P(5,5,5),P(15,15,15));
function audit(geometry,revision=21){
 const j=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const d=inspectUnionDirectionalJunctions({geometry,revision,
  physicalJunctionEvidence:j});
 return {j,d};
}
test('M5 C2 all real physical endpoints get exact outgoing 3D axis vectors and no official drawing styles',()=>{
 const {j,d}=audit([A(),B()]);
 assert.equal(d.status,'local-source-direction-and-listed-node-depth-witness');
 assert.equal(d.nodeCount,j.nodeCount);
 assert.equal(d.allOriginalAndNewFeatureDirectedEndpointsCovered,true);
 assert.equal(d.listedNodesDepthOrderVerified,true);
 assert.equal(d.completeGlobalFeatureGraphVerified,false);
 assert.equal(d.officialLineStylesVerified,false);
 assert.equal(d.signedV5LineActions,0);
 assert.equal(d.v5Ready,false);
 assert.ok(Object.isFrozen(d.nodes));
 assert.ok(d.nodes.some(n=>n.incidentCount>1));
 assert.ok(d.cornerNodeCount+d.branchingNodeCount>0);
 for(const n of d.nodes){
  assert.deepEqual(n.projected,project(n.point3D));
  assert.equal(n.incidentCount,n.incidentDirections.length);
  assert.equal(n.allOutgoingDirectionsVerified,true);
  assert.equal(n.formalConstructionStepOrV5Approved,false);
  assert.equal(n.standardEngineeringLineStyle,'undetermined');
  for(const dir of n.incidentDirections){
   assert.equal(['x','y','z'].filter(k=>
    dir.source3DFeatureDirection[k]!==0).length,1);
   assert.equal(dir.source3DFeatureDirection[dir.axis],dir.sign);
   assert.ok([-1,1].includes(dir.sign));
   assert.equal(dir.originalSourceOpenIntervalIdentityVerified,true);
   assert.equal(dir.finalDrawingStrokeDirectionSignedOff,false);
  }
  for(const pair of n.pairwiseJunctionWitnesses){
   assert.equal(pair.physical3DSharedEndpointVerified,true);
   assert.equal(pair.completeContourAndStyleJoinVerified,false);
   if(pair.candidateStraightContinuation){
    assert.equal(n.incidentCount,2);
    assert.equal(pair.exactOppositeOutgoingTangentsVerified,true);
    assert.equal(pair.equalProvenOpenFeatureStatus,true);
   }
  }
 }
});
test('M5 C2 an unrelated remote box inserts two source axial events but preserves honest local opposite straight features',()=>{
 const remote=box('B',P(30,0,3),P(40,10,7));
 const {d}=audit([A(),remote],22);
 assert.ok(d.positiveStraightLocalPairCount>0);
 const cornerAtSplit=d.nodes.find(n=>n.point3D.x===0&&
  n.point3D.y===0&&n.point3D.z===3);
 assert.ok(cornerAtSplit);
 assert.equal(cornerAtSplit.incidentCount,2);
 assert.equal(cornerAtSplit.classification,
  'source-traced-straight-continuation-candidate');
 const pair=cornerAtSplit.pairwiseJunctionWitnesses[0];
 assert.equal(pair.same3DSourceAxisAndSupportingLineVerified,true);
 assert.equal(pair.exactOppositeOutgoingTangentsVerified,true);
 assert.equal(pair.equalProvenOpenFeatureStatus,true);
 assert.equal(pair.completeContourAndStyleJoinVerified,false);
 assert.equal(d.v5Ready,false);
});
test('M5 C2 real overlapping box face intersections include non-collinear source corners and 3+ branches that cannot be silently joined',()=>{
 const {d}=audit([A(),B()],23);
 assert.ok(d.nodes.some(n=>n.classification===
  'real-3d-corner-candidate'||
  n.classification==='multi-branch-junction'));
 for(const n of d.nodes.filter(n=>n.incidentCount>=3)){
  assert.equal(n.positiveSourceTracedStraightCandidate,false);
  assert.equal(n.classification,'multi-branch-junction');
  assert.ok(n.pairwiseJunctionWitnesses.length>=3);
  assert.equal(n.completeSpatialContourTopologyVerified,false);
 }
});
test('M5 C2 projected same-paper different-3D source nodes have physically ranked observer dot depths, not a legal line connection',()=>{
 const {d}=audit([A(),B()],24);
 const aliases=d.projectedNodeDepthGroups.filter(x=>
  x.coProjectedMultiplePhysicalNodes);
 assert.ok(aliases.length>0);
 assert.equal(aliases.length,d.projectedCoDepthAliasGroupCount);
 for(const group of aliases){
  assert.equal(group.sourceNodeObserverDepthOrderVerified,true);
  assert.equal(group.physicalJoinFromProjectionAlonePermitted,false);
  assert.equal(group.allOtherSourceFaceAndStrokeOcclusionVerified,false);
  assert.ok(group.orderedSourceNodes.length>=2);
  for(let k=1;k<group.orderedSourceNodes.length;k++)
   assert.ok(group.orderedSourceNodes[k-1].observerDotDepthMm>=
    group.orderedSourceNodes[k].observerDotDepthMm);
  for(const entry of group.orderedSourceNodes){
   const ray=FIRST_ANGLE_OBSERVER_RAYS[group.view],p=entry.point3D;
   assert.equal(entry.observerDotDepthMm,
    p.x*ray.x+p.y*ray.y+p.z*ray.z);
   assert.deepEqual(project(p)[group.view],group.projectedModelMm);
  }
 }
});
test('M5 C2 a third body buries a middle feature span: 3D cutpoints do not imply signed endpoint continuation across missing volume',()=>{
 const C=box('C',P(9,4,6),P(11,6,8));
 const {j,d}=audit([A(),B(),C],25);
 const feature=j.segments.filter(s=>
  s.kind==='generated-source-face-crease'&&
  s.sourceGeometryIds.join(',')==='A,B'&&s.sourceAxis==='z'&&
  s.source3DFrom.x===10&&s.source3DFrom.y===5);
 assert.equal(feature.length,2);
 assert.deepEqual(feature.map(s=>[s.source3DFrom.z,s.source3DTo.z]),
  [[5,6],[8,10]]);
 assert.equal(d.v5Ready,false);
 assert.ok(d.nodes.some(n=>n.point3D.x===10&&n.point3D.y===5&&n.point3D.z===6));
 assert.ok(d.nodes.some(n=>n.point3D.x===10&&n.point3D.y===5&&n.point3D.z===8));
 assert.equal(d.nodes.every(n=>!n.formalConstructionStepOrV5Approved),true);
});
test('M5 C2 revisions, forged physical nodes and arbitrary V5 approval are rejected',()=>{
 const geometry=[A(),B()],revision=26;
 const j=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const bad={...j,nodes:[{...j.nodes[0],
  approvedV5JunctionAction:true},...j.nodes.slice(1)]};
 assert.throws(()=>inspectUnionDirectionalJunctions({
  geometry,revision,physicalJunctionEvidence:bad}),/forged or stale/);
 assert.throws(()=>inspectUnionDirectionalJunctions({
  geometry:[A(),box('B',P(10,0,0),P(20,10,10))],
  revision:27,physicalJunctionEvidence:j
 }),/forged or stale/);
 assert.throws(()=>inspectUnionDirectionalJunctions({
  geometry,revision:-1,physicalJunctionEvidence:j
 }),/revision/);
 const broken=A();broken.data.faces.pop();
 const unsupported=auditUnionPhysicalFeatureJunctions({
  geometry:[broken,B()],revision:28});
 assert.equal(inspectUnionDirectionalJunctions({
  geometry:[broken,B()],revision:28,
  physicalJunctionEvidence:unsupported
 }).status,'not-covered');
});
test('M5 C2 final current per-action gate consumes the source direction/depth witness but releases zero official V5 lines',()=>{
 const geometry=[A(),B()],revision=29;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const r=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 assert.equal(r.directionalJunctionEvidence.status,
  'local-source-direction-and-listed-node-depth-witness');
 assert.equal(r.verifiedSourceOutgoingJunctionCount,r.physicalFeatureJunctionCount);
 assert.equal(r.positiveLocalStraightSourceCandidateCount,
  r.directionalJunctionEvidence.positiveStraightLocalPairCount);
 assert.equal(r.projectedSourceNodeDepthAliasGroupCount,
  r.directionalJunctionEvidence.projectedCoDepthAliasGroupCount);
 assert.equal(r.directionalJunctionEvidence.signedV5LineActions,0);
 assert.equal(r.signedCount,0);
 assert.equal(r.v5Ready,false);
 assert.ok(r.spans.every(s=>s.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/positiveLocalStraightSourceCandidateCount/);
 assert.match(ui,/true3DCornerSourceCandidateCount/);
 assert.match(ui,/branchingSourceJunctionCount/);
 assert.match(ui,/projectedSourceNodeDepthAliasGroupCount/);
 assert.match(ui,/只证明已列出三维源节点的前后顺序/);
});
