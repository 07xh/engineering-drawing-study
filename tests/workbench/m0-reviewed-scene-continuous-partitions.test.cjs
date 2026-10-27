'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditReviewedM0ScenePartitions}=
 require('../../workbench/m0-reviewed-scene-continuous-partitions.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
function cube(id,z0,z1){
 const x0=-1,x1=1,y0=-1,y1=1;
 const p={A:{x:x0,y:y0,z:z0},B:{x:x1,y:y0,z:z0},
  C:{x:x1,y:y1,z:z0},D:{x:x0,y:y1,z:z0},
  E:{x:x0,y:y0,z:z1},F:{x:x1,y:y0,z:z1},
  G:{x:x1,y:y1,z:z1},H:{x:x0,y:y1,z:z1}};
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points:p,
  edges:[['A','B'],['B','C'],['C','D'],['D','A'],
   ['E','F'],['F','G'],['G','H'],['H','E'],
   ['A','E'],['B','F'],['C','G'],['D','H']],
  faces:[['A','D','C','B'],['E','F','G','H'],
   ['A','B','F','E'],['B','C','G','F'],
   ['C','D','H','G'],['D','A','E','H']]}};
}
test('real closed meshes drive all 3 first-angle M0 source partitions and independently bounded depth pairs',()=>{
 const geometry=[cube('Lower',0,2),cube('Upper',5,7)];
 const copy=JSON.stringify(geometry);
 const r=auditReviewedM0ScenePartitions({geometry,revision:3});
 assert.equal(r.status,'actual-reviewed-source-open-interval-evidence');
 assert.equal(r.revision,3);
 assert.equal(r.auditedSolidCount,2);
 assert.equal(r.verifiedExtremeVertexSetCount,2);
 assert.equal(r.originalSourceEdgeViewCount,72);
 assert.ok(r.collapsedSourceProjections>0);
 assert.equal(r.views.H.edges.length,24);
 assert.equal(r.views.V.edges.length,24);
 assert.equal(r.views.W.edges.length,24);
 assert.equal(r.views.H.solidPairOrders[0].frontGeometryIdIfGloballySeparated,'Upper');
 assert.equal(r.views.H.solidPairOrders[0].strictGlobalDepthSeparationVerified,true);
 assert.equal(r.globallyDepthSeparatedSolidPairs,1);
 assert.ok(r.views.H.edges.some(x=>x.status==='audited-open-intervals'));
 for(const view of ['V','H','W'])for(const e of r.views[view].edges){
  assert.match(e.sourceEdgeId,/^(Lower|Upper)::/);
  assert.equal(e.v5ActionAuthorized,false);
  if(e.runs)for(const run of e.runs){
   assert.equal(run.depthOrderVerified,false);
   assert.ok(['hidden-within-supplied-solids',
    'clear-within-supplied-solids','undetermined'].includes(run.visibilityEvidence));
  }
 }
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.constructionIntentAuthorized,false);
 assert.equal(r.v5VerifiedExportReady,false);
 assert.equal(JSON.stringify(geometry),copy,'M0 must never mutate reviewed geometry');
 assert.equal(Object.isFrozen(r),true);
});
test('changing the real source invalidates positive bounded mesh provenance',()=>{
 const one=cube('Broken',0,2);
 one.data.faces.pop();
 const r=auditReviewedM0ScenePartitions({geometry:[one],revision:4});
 assert.equal(r.status,'not-covered');
 assert.equal(r.verifiedExtremeVertexSetCount,0);
 assert.equal(r.originalSourceEdgeViewCount,0);
 assert.equal(r.completeSceneVerified,false);
});
test('duplicate geometry identities cannot be used to fake scene-complete coverage',()=>{
 const r=auditReviewedM0ScenePartitions({
  geometry:[cube('Same',0,2),cube('Same',5,7)],revision:5});
 assert.equal(r.status,'not-covered');
 assert.equal(r.officialLineStylesVerified,false);
});
test('bounded complexity excludes unreviewed large scenes rather than claiming proof',()=>{
 const geometry=Array.from({length:4},(_,i)=>cube('Solid'+i,i*5,i*5+2));
 const r=auditReviewedM0ScenePartitions({geometry,revision:6});
 assert.equal(r.status,'not-covered');
 assert.match(r.reason,/budget/);
 assert.equal(r.originalSourceEdgeViewCount,0);
});
test('existing M5 reviewed scene actually consumes shared M0 partitions without signing lines',()=>{
 const geometry=[cube('Single',0,2)];
 const r=evaluateReviewedConvexMeshDepth({geometry,revision:9});
 assert.equal(r.status,'scoped-face-probes-only');
 const m0=r.m0SceneContinuousPartitions;
 assert.equal(m0.status,'actual-reviewed-source-open-interval-evidence');
 assert.deepEqual(m0.sourceGeometryIds,['Single']);
 assert.equal(m0.originalSourceEdgeViewCount,36);
 assert.equal(m0.v5VerifiedExportReady,false);
 assert.equal(r.v5Ready,false);
 assert.equal(r.officialLineStylesVerified,false);
});
test('unsupported source and invalid revision never become a M0 positive result',()=>{
 assert.throws(()=>auditReviewedM0ScenePartitions({
  geometry:[cube('One',0,2)],revision:-1}),/revision/);
 const r=auditReviewedM0ScenePartitions({geometry:[],revision:1});
 assert.equal(r.status,'not-covered');
 assert.equal(r.v5VerifiedExportReady,false);
});
