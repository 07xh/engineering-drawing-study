'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {prismMesh,createUnifiedProjectSession}=require('../../project/unified-workbench-session.cjs');
const {newProject,createCoordinator}=require('../../project/project-coordinator.cjs');
const {proveReviewedCompositeSeamRays}=
 require('../../workbench/m5-reviewed-composite-seam-rays.cjs');
const {project}=require('../../core/projection/conventions.js');
const q=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>({...prismMesh({solid:{min,max}}),id});
const left=()=>box('A',q(0,0,0),q(10,12,8));
const right=(min=q(10,0,0),max=q(20,12,8))=>box('B',min,max);
test('M5 whole-source seam ray evidence is source-bound for each V/H/W projected 3D line',()=>{
 const v=proveReviewedCompositeSeamRays({
  geometry:[left(),right()],revision:6});
 assert.equal(v.status,'scoped-source-bounded-whole-seam-ray-evidence');
 assert.equal(v.sourcePatchCount,1);
 assert.equal(v.checkedCount,12);
 assert.equal(v.segments.length,12);
 assert.equal(v.revision,6);
 assert.equal(v.checkedCount,v.certifiedOpenVisibleCount+
   v.certifiedFullyOccludedCount+v.undeterminedCount);
 assert.equal(v.completeSeamLineStyleVerified,false);
 assert.equal(v.allPhysicalSeamFeaturesVerified,false);
 assert.equal(v.allProjectedContourJunctionsVerified,false);
 assert.equal(v.v5Ready,false);
 assert.ok(Object.isFrozen(v.segments));
 for(const s of v.segments){
  assert.ok(['V','H','W'].includes(s.view));
  assert.deepEqual(s.projectedFrom,project(s.from3D)[s.view]);
  assert.deepEqual(s.projectedTo,project(s.to3D)[s.view]);
  assert.equal(s.standardLineStyle,'undetermined');
  assert.equal(s.V5LineActionAuthorized,false);
  assert.equal(s.physicalEngineeringSeamVerified,false);
  assert.equal(s.sourceEndpointJunctionContinuityVerified,false);
  if(s.status==='certified-open-ray-clear-whole-source-segment'){
   assert.equal(s.wholeOpenSourceRayClearVerified,true);
   assert.equal(s.entireSourceSegmentBehindOpaqueVolumeVerified,false);
   assert.ok(s.independentSolidRayWitnesses.every(x=>x.wholeOpenRayClearVerified));
  }
  if(s.status==='certified-strictly-occluded-whole-source-segment'){
   assert.equal(s.entireSourceSegmentBehindOpaqueVolumeVerified,true);
   assert.equal(s.wholeOpenSourceRayClearVerified,false);
   assert.ok(s.occluderGeometryIds?.length>0);
  }
 }
 assert.ok(v.certifiedOpenVisibleCount>0,
  'at least outward seam border in the reviewed two-box scene must be clear');
});
test('M5 partial face seam must check true intersection subsegments, not an entire guessed face',()=>{
 const r=proveReviewedCompositeSeamRays({geometry:[
  left(),right(q(10,3,2),q(20,8,6))],revision:7});
 assert.equal(r.checkedCount,12);
 assert.equal(r.sourcePatchCount,1);
 assert.ok(r.segments.every(s=>s.sourceFaceBoundaryClass===
  'single-original-face-boundary'));
 assert.equal(r.completeSeamLineStyleVerified,false);
});
test('M5 disjoint and edge-only contacts have zero certified seam strokes',()=>{
 const far=proveReviewedCompositeSeamRays({geometry:[
  left(),right(q(15,0,0),q(20,12,8))],revision:8});
 assert.equal(far.checkedCount,0);
 assert.equal(far.sourcePatchCount,0);
 const edge=proveReviewedCompositeSeamRays({geometry:[
  left(),right(q(10,12,0),q(20,22,8))],revision:8});
 assert.equal(edge.checkedCount,0);
 assert.equal(edge.v5Ready,false);
});
test('M5 refuses forged, open, stale, or unbounded source meshes',()=>{
 const a=left(),b=right();
 a.data.faces.pop();
 assert.equal(proveReviewedCompositeSeamRays({
  geometry:[a,b],revision:9}).status,'not-covered');
 assert.throws(()=>proveReviewedCompositeSeamRays({
  geometry:[left(),right()],revision:-1}),/revision/);
 assert.throws(()=>proveReviewedCompositeSeamRays({
  geometry:[left()],revision:2}),/bounded/);
 assert.throws(()=>proveReviewedCompositeSeamRays({
  geometry:[left(),right(),right(),right(),right(),right(),right(),right(),right()],
  revision:9}),/bounded/);
});
test('M5 existing V7 composition receives ray witnesses with export and V5 still blocked',()=>{
 const coordinator=createCoordinator(newProject({id:'ContactSeamRay',task:'composition'}));
 const session=createUnifiedProjectSession();
 coordinator.attachSolver(session);
 for(const mesh of [left(),right()]){
  coordinator.putObject({id:mesh.id,kind:'solid',spatialId:mesh.id+'_3D',
   projections:{V:[mesh.id+'_V'],H:[mesh.id+'_H'],W:[mesh.id+'_W']}});
  coordinator.putCondition({id:'geo_'+mesh.id,objectId:mesh.id,sourceCandidateId:null,
   confirmed:false,value:{type:'manual-geometry',unit:'mm',
    imageId:coordinator.snapshot().source.imageId,geometry:mesh}});
  coordinator.confirmCondition('geo_'+mesh.id);
 }
 const result=session.solve();
 assert.equal(result.kind,'composition-evidence');
 assert.equal(result.compositionSeamRayEvidence.checkedCount,12);
 assert.equal(result.compositionSeamRayEvidence.completeSeamLineStyleVerified,false);
 assert.equal(result.verified,false);
 assert.equal(result.plan,null);
 assert.equal(result.clock,null);
 assert.equal(coordinator.canExport(),false);
 coordinator.deleteObject('B');
 assert.equal(session.readSnapshot(),null);
 session.dispose();coordinator.dispose();
});
test('M5 actual V7 status never equates ray certificates with certified standard lines',()=>{
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/compositionSeamRayEvidence/);
 assert.match(ui,/只审计原始顶点，不冒充新增接触切点的实体接缝/);
 assert.match(ui,/端点整合和标准实虚线仍未签收/);
});
