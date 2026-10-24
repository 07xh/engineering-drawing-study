'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {partitionReviewedSourceEdges}=
 require('../../workbench/scoped-projected-stroke-partition.cjs');
const {auditUnionPhysicalFeatureJunctions}=
 require('../../workbench/m5-union-physical-feature-junctions.cjs');
const {auditProjectedSourceOverlapDepth}=
 require('../../workbench/m5-union-projected-overlap-depth.cjs');
const {auditGeneratedViewEndpointIncidence}=
 require('../../workbench/m5-generated-view-endpoint-incidence.cjs');
const {auditGeneratedStrokeOverlapPartitions}=
 require('../../workbench/m5-generated-stroke-overlap-partitions.cjs');
const {auditGeneratedOpenSubspanOpaqueRays}=
 require('../../workbench/m5-generated-open-subspan-opaque-rays.cjs');
const {auditUnifiedProjectedFeatureEvents}=
 require('../../workbench/m5-unified-projected-feature-events.cjs');
const {auditUnifiedPaperSourceIdentity}=
 require('../../workbench/m5-unified-paper-source-identity.cjs');
const {auditExactPhysicalFeatureDedup}=
 require('../../workbench/m5-exact-physical-feature-dedup.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const P=(x,y,z)=>({x,y,z});
const cuboid=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const A=()=>cuboid('A',P(0,0,0),P(10,10,10));
const B=()=>cuboid('B',P(5,5,5),P(15,15,15));
function audit(geometry,revision=187){
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const m4=partitionReviewedSourceEdges({geometry,revision,sceneDepthEvidence:scene});
 const physical=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const depth=auditProjectedSourceOverlapDepth({geometry,revision,
  physicalJunctionEvidence:physical});
 const ends=auditGeneratedViewEndpointIncidence({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical});
 const partition=auditGeneratedStrokeOverlapPartitions({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical,
  projectedOverlapDepthEvidence:depth,generatedProjectedEndpointEvidence:ends});
 const rays=auditGeneratedOpenSubspanOpaqueRays({geometry,revision,
  projectedStrokePartitions:m4,physicalJunctionEvidence:physical,
  projectedOverlapDepthEvidence:depth,generatedProjectedEndpointEvidence:ends,
  generatedOverlapPartitionEvidence:partition});
 const event=auditUnifiedProjectedFeatureEvents({geometry,revision,
  projectedStrokePartitions:m4,generatedSubspanRayEvidence:rays});
 const paper=auditUnifiedPaperSourceIdentity({geometry,revision,
  projectedStrokePartitions:m4,generatedSubspanRayEvidence:rays,
  unifiedProjectedFeatureEventEvidence:event});
 const args={geometry,revision,projectedStrokePartitions:m4,
  generatedSubspanRayEvidence:rays,
  unifiedProjectedFeatureEventEvidence:event,
  unifiedPaperSourceIdentityEvidence:paper};
 return {paper,args,result:auditExactPhysicalFeatureDedup(args)};
}
test('C2 exactly identical bounded source bodies: true 3D duplicates reduce to one physical line class with ALL original IDs retained',()=>{
 const g=[A(),cuboid('B',P(0,0,0),P(10,10,10))];
 const {result:r,paper}=audit(g);
 assert.equal(r.status,'exact-current-original-generated-3d-physical-feature-classes');
 assert.equal(r.paperIntervalCount,paper.paperIntervalCount);
 assert.ok(r.exact3DDuplicateSourceRecordCount>0);
 assert.ok(r.groups.some(x=>x.exact3DDuplicateSourceRecordsEliminated>0));
 // Front- and rear-depth original edges remain different REAL 3D
 // geometric features even for two fully identical closed cuboids.
 assert.ok(r.groups.every(x=>x.exact3DPhysicalFeatureClassCount>=1));
 assert.ok(r.groups.some(x=>x.exact3DPhysicalFeatureClassCount>1));
 assert.ok(r.groups.some(x=>x.physicalFeatureClasses.some(c=>
  c.contributors.length>=2)));
 assert.ok(r.groups.every(x=>x.allReviewedPaperSourceRecordsAccountedFor));
 assert.ok(r.groups.every(x=>x.exact3DPhysicalFeatureClassCount<=
  x.originalReviewedSourceRecordCount));
 assert.equal(r.allReviewedSourceRecordsRetainedAndExactlyGrouped,true);
 assert.equal(r.allFinalBooleanExteriorFeatureSourcesEnumerated,false);
 assert.equal(r.globalPaperJunctionsAndOpaqueOcclusionVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.signedV5LineActions,0);
 assert.equal(r.v5Ready,false);
 assert.ok(Object.isFrozen(r.groups));
 for(const group of r.groups){
  for(const c of group.physicalFeatureClasses){
   assert.equal(c.nationalStandardLineStyle,'undetermined');
   assert.equal(c.v5DrawingActionApproved,false);
   assert.equal(c.exactlyOneFinitePhysical3DGeometricLineLocusVerified,true);
   assert.equal(c.coveredCompleteUnionSurfaceAndJunctionsVerified,false);
  }
 }
});
test('C2 same actual feature sources canonical ID does not depend on source object order',()=>{
 const one=audit([A(),cuboid('B',P(0,0,0),P(10,10,10))],188).result;
 const two=audit([cuboid('B',P(0,0,0),P(10,10,10)),A()],188).result;
 const labels=r=>r.groups.flatMap(g=>g.physicalFeatureClasses.map(c=>
  [g.view,c.key,c.canonicalSourceFeatureId])).sort((a,b)=>
    JSON.stringify(a).localeCompare(JSON.stringify(b)));
 assert.deepEqual(labels(one),labels(two));
 assert.equal(one.signedV5LineActions,0);
 assert.equal(two.signedV5LineActions,0);
});
test('C2 W projected same paper line from spatially separated bodies MUST retain two distinct 3D classes',()=>{
 const r=audit([A(),cuboid('B',P(30,0,0),P(40,10,10))],189).result;
 assert.equal(r.exact3DDuplicateSourceRecordCount,0);
 assert.ok(r.multi3DPhysicalClassPaperIntervalCount>0);
 const multi=r.groups.filter(x=>x.view==='W'&&
  x.exact3DPhysicalFeatureClassCount>1);
 assert.ok(multi.length>0);
 assert.ok(multi.every(g=>g.physicalFeatureClasses.length>1));
 assert.ok(multi.every(g=>g.physicalFeatureClasses.every(c=>
  c.exactlyOneFinitePhysical3DGeometricLineLocusVerified)));
 assert.ok(multi.every(g=>g.nationalEngineeringStrokeStyle==='undetermined'));
 assert.ok(multi.every(g=>!g.canonicalV5ActionAuthorized));
});
test('C2 intersection-generated face creases and original source creases do not falsely merge if depths differ',()=>{
 const r=audit([A(),B()],190).result;
 assert.ok(r.paperIntervalCount>0);
 assert.ok(r.groups.some(g=>g.physicalFeatureClasses.some(c=>
  c.contributors.some(x=>x.kind==='generated-two-face-crease'))));
 assert.ok(r.groups.every(g=>g.physicalFeatureClasses.reduce((n,x)=>
  n+x.contributors.length,0)===g.originalReviewedSourceRecordCount));
 assert.equal(r.officialLineStylesVerified,false);
});
test('C2 third-body exterior changes and near-critical source cannot inherit signed V5 line',()=>{
 const r=audit([A(),B(),
  cuboid('C',P(9,4,6),P(11,6,8))],191).result;
 assert.ok(r.paperIntervalCount>0);
 assert.ok(r.groups.every(g=>g.canonicalV5ActionAuthorized===false));
 assert.ok(r.groups.every(g=>g.allBooleanExteriorFeaturesProvenComplete===false));
 assert.equal(r.signedV5LineActions,0);
});
test('C2 source paper registry forgery or stale revision fail closed',()=>{
 const {args,paper}=audit([A(),B()],192);
 assert.throws(()=>auditExactPhysicalFeatureDedup({...args,revision:-1}),/revision/);
 assert.throws(()=>auditExactPhysicalFeatureDedup({...args,
  unifiedPaperSourceIdentityEvidence:{...paper,signedV5LineActions:1}
 }),/stale or forged/);
 assert.throws(()=>auditExactPhysicalFeatureDedup({...args,
  unifiedPaperSourceIdentityEvidence:{...paper,groups:paper.groups.slice(1)}
 }),/stale or forged/);
 assert.throws(()=>auditExactPhysicalFeatureDedup({...args,
  unifiedPaperSourceIdentityEvidence:{...paper,officialLineStylesVerified:true}
 }),/stale or forged/);
});
test('C2 actual M5 per-action gate consumes real duplicate classes without signing official line style',()=>{
 const geometry=[A(),cuboid('B',P(0,0,0),P(10,10,10))],
  revision=193;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const gate=inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
 const proof=gate.exactPhysicalDedupEvidence;
 assert.equal(proof.status,'exact-current-original-generated-3d-physical-feature-classes');
 assert.equal(gate.exactDuplicate3DSourceRecords,proof.exact3DDuplicateSourceRecordCount);
 assert.equal(gate.exactDedupedPhysicalFeatureClasses,proof.distinctPhysical3DFeatureClassCount);
 assert.equal(gate.paperIntervalsWithMultiplePhysicalDepthSources,
  proof.multi3DPhysicalClassPaperIntervalCount);
 assert.equal(gate.paperIntervalsWithUniquelyFrontPhysicalClass,
  proof.uniqueNearestListedPhysicalClassIntervalCount);
 assert.equal(gate.signedCount,0);
 assert.equal(gate.v5Ready,false);
 assert.ok(gate.spans.every(x=>x.authorizedStyle==='undetermined'));
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/exactDuplicate3DSourceRecords/);
 assert.match(ui,/exactDedupedPhysicalFeatureClasses/);
 assert.match(ui,/paperIntervalsWithMultiplePhysicalDepthSources/);
 assert.match(ui,/严格去重不代表最终外轮廓和标准线型/);
});
