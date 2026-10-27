'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {project,VIEWS}=require('../../core/projection/conventions.js');
const {deriveGeometryScene}=require('../../core/projection/geometry-scene-views.cjs');
const {reviewedSolidThirdView}=
 require('../../workbench/reviewed-multipoint-solid-third-view.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {auditM0M3M4M5OriginalSources}=
 require('../../workbench/m0-m3-m4-m5-original-source-acceptance.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
function fromFaces(id,points,faces){
 const seen=new Set(),edges=[];
 for(const face of faces)for(let i=0;i<face.length;i++){
  const a=face[i],b=face[(i+1)%face.length];
  const key=[a,b].sort().join('|');
  if(!seen.has(key)){seen.add(key);edges.push([a,b]);}
 }
 return {id,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges,faces}};
}
function box(id,lo={x:-2,y:-3,z:0},hi={x:3,y:4,z:5}){
 const p={A:{x:lo.x,y:lo.y,z:lo.z},
  B:{x:hi.x,y:lo.y,z:lo.z},
  C:{x:hi.x,y:hi.y,z:lo.z},
  D:{x:lo.x,y:hi.y,z:lo.z},
  E:{x:lo.x,y:lo.y,z:hi.z},
  F:{x:hi.x,y:lo.y,z:hi.z},
  G:{x:hi.x,y:hi.y,z:hi.z},
  H:{x:lo.x,y:hi.y,z:hi.z}};
 return fromFaces(id,p,[['A','D','C','B'],['E','F','G','H'],
  ['A','B','F','E'],['B','C','G','F'],
  ['C','D','H','G'],['D','A','E','H']]);
}
function skewPrism(){
 return fromFaces('SkewPrism',{
  A:{x:0,y:0,z:0},B:{x:4,y:1,z:0},C:{x:3,y:4,z:0},
  D:{x:-1,y:3,z:0},E:{x:1,y:-1,z:5},F:{x:5,y:0,z:5},
  G:{x:4,y:3,z:5},H:{x:0,y:2,z:5}
 },[['A','D','C','B'],['E','F','G','H'],
    ['A','B','F','E'],['B','C','G','F'],
    ['C','D','H','G'],['D','A','E','H']]);
}
function tetra(){
 return fromFaces('Tetra',{O:{x:0,y:0,z:0},
  X:{x:4,y:0,z:0},Y:{x:0,y:3,z:0},Z:{x:0,y:0,z:5}},
 [['O','Y','X'],['O','X','Z'],['O','Z','Y'],['X','Y','Z']]);
}
function solve(geometry,revision=1){
 const scene=deriveGeometryScene({geometry,revision,resultId:'ReviewedProof'});
 const sceneDepthEvidence=evaluateReviewedConvexMeshDepth({geometry,revision});
 const report=auditM0M3M4M5OriginalSources({
  geometry,scene,sceneDepthEvidence,revision});
 return {scene,sceneDepthEvidence,report};
}
for(const [label,make] of [
 ['anisotropic rectangular basic solid',()=>box('Box')],
 ['oblique eight-vertex general convex prism',skewPrism],
 ['four-vertex triangular pyramid',tetra]
]){
 test('M0/M3/M4/M5 actual geometric source acceptance: '+label,()=>{
  const geometry=[make()],{report}=solve(geometry);
  assert.equal(report.status,'bounded-original-source-math-acceptance');
  assert.deepEqual(report.sourceGeometryIds,[geometry[0].id]);
  assert.equal(report.originalEdgeViewCount,geometry[0].data.edges.length*3);
  assert.equal(report.m3BoundSourceEdgeViews,report.originalEdgeViewCount);
  for(const view of VIEWS)
   assert.equal(report.views[view].length,geometry[0].data.edges.length);
  assert.equal(report.mutuallyContradictoryIntervals,0);
  assert.equal(report.completeEngineeringLineStylesVerified,false);
  assert.equal(report.constructionIntentAuthorized,false);
  assert.equal(report.v5VerifiedExportReady,false);
 });
}
for(const views of [['V','H'],['V','W'],['H','W']]){
 test('C1 two genuine known views -> M3 third view -> existing M0/M4/M5 original-source closure '+views.join(''),()=>{
  const g=skewPrism();
  const input={geometryId:g.id,revision:8,unit:'mm',
   confirmedBy:'user',topologyConfirmed:true,
   vertices:Object.entries(g.data.points).map(([id,p])=>({
    id,knownViews:Object.fromEntries(views.map(view=>[
     view,Object.values(project(p)[view])]))
   })),edges:g.data.edges,faces:g.data.faces};
  const m3=reviewedSolidThirdView(input);
  assert.equal(m3.provenVertexCount,8);
  assert.equal(m3.missingView,VIEWS.find(view=>!views.includes(view)));
  const {report}=solve([m3.geometry],8);
  assert.equal(report.status,'bounded-original-source-math-acceptance');
  assert.equal(report.m3BoundSourceEdgeViews,36);
  assert.equal(report.fullSceneVerified,false);
 });
}
for(const [name,geometry] of [
 ['two spaced convex bodies',[box('Lower'),box('Upper',{x:-2,y:-3,z:8},{x:3,y:4,z:12})]],
 ['two exact face-touching bodies',[box('Left'),box('Right',{x:3,y:-3,z:0},{x:8,y:4,z:5})]],
 ['two partly overlapping bodies',[box('Back'),box('Front',{x:0,y:-3,z:0},{x:7,y:4,z:5})]]
]){
 test('C2 entire reviewed original model source and M5 keep uncertainty: '+name,()=>{
  const {report,sceneDepthEvidence}=solve(geometry,12);
  assert.equal(sceneDepthEvidence.m0SceneContinuousPartitions.auditedSolidCount,2);
  assert.equal(report.m3BoundSourceEdgeViews,72);
  assert.equal(report.originalEdgeViewCount,72);
  assert.equal(report.completeEngineeringLineStylesVerified,false);
  assert.equal(report.v5VerifiedExportReady,false);
  assert.equal(report.mutuallyContradictoryIntervals,0);
 });
}
test('live unified composition workbench consumes authentic M0/M3/M4/M5 report',()=>{
 const g=box('ConfirmedModel'),session=createUnifiedProjectSession();
 session.loadInputs({task:'composition',revision:15,projectId:'ReviewedExercise',
  source:{imageId:'image1'},objects:[{id:g.id}],
  conditions:[{objectId:g.id,confirmed:true,sourceCandidateId:null,
   value:{type:'manual-geometry',imageId:'image1',geometry:g,unit:'mm'}}],
  relations:[],totalRelationCount:0});
 const result=session.solve();
 assert.equal(result.kind,'composition-evidence');
 assert.equal(result.m0M3M5OriginalSourceAcceptance.status,
  'bounded-original-source-math-acceptance');
 assert.equal(result.m0M3M5OriginalSourceAcceptance.m3BoundSourceEdgeViews,36);
 assert.equal(result.m0M3M5OriginalSourceAcceptance.v5VerifiedExportReady,false);
 session.dispose();
});
test('falsified M0 source evidence and 2D projection are rejected, never silently accepted',()=>{
 const geometry=[box('Honest')],revision=6;
 const {scene,sceneDepthEvidence}=solve(geometry,revision);
 const falseScene=structuredClone(scene);
 falseScene.objects[0].representations.V.points.A.u+=1;
 assert.throws(()=>auditM0M3M4M5OriginalSources({
  geometry,scene:falseScene,sceneDepthEvidence,revision
 }),/M3 view/);
 const falseDepth=structuredClone(sceneDepthEvidence);
 falseDepth.m0SceneContinuousPartitions.views.V.edges[0].status='collapsed-projection';
 assert.throws(()=>auditM0M3M4M5OriginalSources({
  geometry,scene,sceneDepthEvidence:falseDepth,revision
 }),/stale, forged or altered/);
});
test('stale solved geometry after changing one original vertex is never reused',()=>{
 const geometry=[box('Original')],revision=4;
 const {scene,sceneDepthEvidence}=solve(geometry,revision);
 const edited=structuredClone(geometry);
 edited[0].data.points.A.x-=.5;
 assert.throws(()=>auditM0M3M4M5OriginalSources({
  geometry:edited,scene,sceneDepthEvidence,revision
 }),/differs from original/);
});
test('image-only, planar or analytic curve geometry cannot be impersonated as audited convex solid',()=>{
 const report=auditM0M3M4M5OriginalSources({
  geometry:[{id:'Curve',kind:'analytic-curve',space:'model-3d',unit:'mm'}],
  scene:null,sceneDepthEvidence:null,revision:1});
 assert.equal(report.status,'not-covered');
 assert.equal(report.v5VerifiedExportReady,false);
});
