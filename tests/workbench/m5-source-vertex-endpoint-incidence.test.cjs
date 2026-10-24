'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectSourceVertexIncidence}=
 require('../../workbench/m5-source-vertex-incidence-audit.cjs');
const {auditReviewedSolidWholeSourceEdges}=
 require('../../workbench/m5-reviewed-solid-source-edge-ledger.cjs');
const {proveReviewedCompositeSeamRays}=
 require('../../workbench/m5-reviewed-composite-seam-rays.cjs');
const make=(id,a,b)=>({...prismMesh({solid:{min:a,max:b}}),id});
const pt=(x,y,z)=>({x,y,z});
const a=()=>make('A',pt(0,0,0),pt(20,10,14));
const b=()=>make('B',pt(20,0,0),pt(30,10,14));
const check=(geometry,revision=5)=>{
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 return inspectSourceVertexIncidence({geometry,revision,sceneDepthEvidence:scene});
};
test('M5 every real cuboid vertex has source-ID accounted adjacent edge endpoints in all V/H/W',()=>{
 const mesh=a(),r=check([mesh]);
 assert.equal(r.status,'source-3d-original-vertex-incidence-recomputed');
 assert.equal(r.groupCount,24); // 8 source vertices, first-angle V/H/W
 assert.equal(r.exactSourceIncidenceCount,24);
 assert.equal(r.sourceGeometryIds[0],'A');
 assert.equal(r.allProjectedJunctionsVerified,false);
 assert.equal(r.standardLineStylesVerified,false);
 assert.equal(r.v5Ready,false);
 assert.ok(r.positiveOriginalRayCount>0);
 assert.ok(r.groups.some(x=>x.distinct3DPointSharesSamePaperPoint));
 assert.ok(Object.isFrozen(r.groups));
 for(const g of r.groups){
  assert.deepEqual(g.source3DPoint,mesh.data.points[g.sourceVertexId]);
  assert.deepEqual(g.projectedModelMm,project(g.source3DPoint)[g.view]);
  assert.equal(g.originalSource3DIncidenceVerified,true);
  assert.equal(g.allOriginalProjectedEdgeEndpointsMatched,true);
  assert.equal(g.incidentSourceEdgeCount,3);
  assert.equal(g.projectedActiveEdgeCount+g.collapsedSourceEdgeIds.length,3);
  assert.equal(g.officialLineStyle,'undetermined');
  assert.equal(g.constructionStepV5Approved,false);
  assert.equal(g.fullContourJunctionVisibilityVerified,false);
  for(const e of g.activeSourceEdges){
   assert.ok(e.sourceEdgeId.startsWith('A::'));
   assert.equal(e.verifiedOriginal3DIncidence,true);
   assert.equal(e.officiallyJoinedLineStyle,false);
  }
  if(g.localPositiveProjectedEndpointCandidate){
   assert.equal(g.sourceVertexPositiveRayVerified,true);
   assert.equal(g.everyActiveEdgeEndpointPositiveRayVerified,true);
   assert.equal(g.uniqueProjectedSourceVertexVerified,true);
   assert.equal(g.projectedAngularSeparationVerified,true);
   assert.equal(g.collapsedSourceEdgeIds.length,0);
  }
 }
});
test('M5 two distinct depth-separated source vertices on identical paper coordinates do NOT join',()=>{
 const r=check([a(),b()],8);
 assert.equal(r.groupCount,48);
 assert.equal(r.exactSourceIncidenceCount,48);
 assert.ok(r.groups.some(x=>x.distinct3DPointSharesSamePaperPoint));
 for(const g of r.groups.filter(x=>x.distinct3DPointSharesSamePaperPoint)){
  assert.equal(g.localPositiveProjectedEndpointCandidate,false);
  assert.equal(g.uniqueProjectedSourceVertexVerified,false);
 }
 assert.equal(r.allProjectedJunctionsVerified,false);
});
test('M5 partial-contact solid mesh still has original endpoints, not fake contact-cut vertices',()=>{
 const g=[a(),make('B',pt(20,2,2),pt(30,8,10))];
 const r=check(g,9);
 assert.equal(r.groupCount,48);
 assert.equal(r.exactSourceIncidenceCount,48);
 assert.equal(r.standardLineStylesVerified,false);
 const s=proveReviewedCompositeSeamRays({geometry:g,revision:9});
 assert.equal(s.originalSourceVertexIncidenceEvidence.groupCount,48);
 assert.equal(s.originalSourceVertexIncidenceEvidence.v5Ready,false);
 assert.equal(s.completeSeamLineStyleVerified,false);
});
test('M5 forged projected vertex or cutpoint proof cannot certify spatial source endpoint',()=>{
 const geometry=[a()],revision=5;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const changedJoins={...scene,projectedVertexJoins:{...scene.projectedVertexJoins,
  endpointVisibilityVerified:true}};
 assert.throws(()=>inspectSourceVertexIncidence({
  geometry,revision,sceneDepthEvidence:changedJoins}),/forged or stale/);
 const changedCuts={...scene,projectedCutEndpointTopology:{
  ...scene.projectedCutEndpointTopology,fullProjectedJunctionsVerified:true}};
 assert.throws(()=>inspectSourceVertexIncidence({
  geometry,revision,sceneDepthEvidence:changedCuts}),/forged or stale/);
 const stale={...scene,revision:6};
 assert.equal(inspectSourceVertexIncidence({geometry,revision,
  sceneDepthEvidence:stale}).status,'not-covered');
});
test('M5 open meshes, absent source, invalid revision and bogus units fail closed',()=>{
 const original=a();original.data.faces.pop();
 const scene=evaluateReviewedConvexMeshDepth({geometry:[original],revision:2});
 assert.equal(inspectSourceVertexIncidence({
  geometry:[original],sceneDepthEvidence:scene,revision:2}).status,'not-covered');
 assert.throws(()=>inspectSourceVertexIncidence({
  geometry:[a()],revision:-1}),/revision/);
 assert.throws(()=>inspectSourceVertexIncidence({
  geometry:[],revision:2}),/bounded reviewed/);
 const duplicate=[a(),a()];
 const twoScene=evaluateReviewedConvexMeshDepth({geometry:duplicate,revision:2});
 assert.equal(inspectSourceVertexIncidence({
  geometry:duplicate,revision:2,sceneDepthEvidence:twoScene}).status,'not-covered');
});
test('M5 original C1 whole-edge ledger consumes proof with no edge line-style release',()=>{
 const g=a();const r=auditReviewedSolidWholeSourceEdges({geometry:g,revision:7});
 const j=r.sourceVertexIncidenceEvidence;
 assert.equal(j.status,'source-3d-original-vertex-incidence-recomputed');
 assert.equal(j.groupCount,24);
 assert.equal(j.standardLineStylesVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedEdgeV5Ready,false);
 assert.ok(r.edges.every(e=>e.standardEngineeringLineStyle==='undetermined'));
});
test('M5 public C1 and C2 report source-level incidence separately from official joins',()=>{
 const a=fs.readFileSync('labs/solid-third-view-live-entry.cjs','utf8');
 const b=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(a,/sourceVertexIncidenceEvidence/);
 assert.match(a,/接合\/轮廓\/标准实虚线均未认证/);
 assert.match(b,/originalSourceVertexIncidenceEvidence/);
 assert.match(b,/只审计原始顶点，不冒充新增接触切点的实体接缝/);
});
