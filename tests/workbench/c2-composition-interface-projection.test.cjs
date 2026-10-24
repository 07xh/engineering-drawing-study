'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh,createUnifiedProjectSession}=require('../../project/unified-workbench-session.cjs');
const {newProject,createCoordinator}=require('../../project/project-coordinator.cjs');
const {evaluateReviewedBoxContacts}=require('../../core/geometry/reviewed-box-contact-evidence.cjs');
const {evaluateReviewedConvexMeshDepth}=require('../../workbench/reviewed-convex-scene-depth.cjs');
const {evaluateReviewedCompositeInterfaces}=
 require('../../workbench/reviewed-composite-interface-evidence.cjs');
const {project}=require('../../core/projection/conventions.js');
const fs=require('node:fs');
const p=(id,a,b)=>({...prismMesh({solid:{min:a,max:b}}),id});
const q=(x,y,z)=>({x,y,z});
const left=()=>p('Base',q(0,0,0),q(12,10,8));
function run(right,revision=7){
 const geometry=[left(),right];
 const contactEvidence=evaluateReviewedBoxContacts({geometry,revision});
 const sceneDepthEvidence=evaluateReviewedConvexMeshDepth({geometry,revision});
 return evaluateReviewedCompositeInterfaces({geometry,revision,contactEvidence,sceneDepthEvidence});
}
test('C2 full positive face interface is unexposed INSIDE, its perimeter remains unverified',()=>{
 const r=run(p('Cap',q(12,0,0),q(20,10,8)));
 assert.equal(r.status,'partial-shared-face-proof');
 assert.equal(r.contactPatchCount,1);
 const patch=r.patches[0];
 assert.deepEqual(patch.objectIds,['Base','Cap']);
 assert.equal(patch.axis,'x');
 assert.equal(patch.coordinateMm,12);
 assert.equal(patch.strictInteriorAreaMm2,80);
 assert.equal(patch.interiorPatchNotExteriorToUnion,true);
 assert.equal(patch.patchPerimeterLineStyle,'undetermined');
 assert.equal(r.canEraseSourceBoundaryEdges,false);
 assert.equal(r.allJunctionsVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.canonicalConstructionReady,false);
 assert.equal(r.v5Ready,false);
 assert.equal(patch.projectedCornerWitnesses.V.length,4);
 for(let k=0;k<4;k++)
  assert.deepEqual(patch.projectedCornerWitnesses.V[k],
   project(patch.source3DCorners[k]).V);
 assert.ok(Object.isFrozen(patch));
});
test('C2 partial face patch area is intersection only, not full union/cuboid face',()=>{
 const r=run(p('Cap',q(12,3,2),q(20,8,6)));
 assert.equal(r.contactPatchCount,1);
 assert.equal(r.patches[0].strictInteriorAreaMm2,20);
 assert.deepEqual(r.patches[0].otherAxisIntervalsMm.y,[3,8]);
 assert.deepEqual(r.patches[0].otherAxisIntervalsMm.z,[2,6]);
 assert.equal(r.patches[0].patchPerimeterLineStyle,'undetermined');
});
test('C2 fully separated, edge-only and volume-overlap do not invent interior face patches',()=>{
 for(const r of [
  run(p('Cap',q(16,0,0),q(20,10,8))),
  run(p('Cap',q(12,10,0),q(20,16,8))),
  run(p('Cap',q(10,0,0),q(20,10,8)))
 ]){
  assert.equal(r.contactPatchCount,0);
  assert.equal(r.interiorContactFaceVerifiedWithinScope,false);
  assert.equal(r.projectedUnionEvidence.officialLineStylesVerified,false);
 }
});
test('C2 source revision and injected topology/occlusion claims are rejected',()=>{
 const geometry=[left(),p('Cap',q(12,0,0),q(20,10,8))],revision=7;
 const contactEvidence=evaluateReviewedBoxContacts({geometry,revision});
 const sceneDepthEvidence=evaluateReviewedConvexMeshDepth({geometry,revision});
 const altered={...contactEvidence,pairs:contactEvidence.pairs.map(p=>({...p,relation:'volumetric-overlap'}))};
 assert.throws(()=>evaluateReviewedCompositeInterfaces({geometry,revision,
  contactEvidence:altered,sceneDepthEvidence}),/outdated or substituted/);
 assert.throws(()=>evaluateReviewedCompositeInterfaces({geometry,revision:8,
  contactEvidence,sceneDepthEvidence}),/outdated or substituted|current M5/);
 const forged={...sceneDepthEvidence,revision:9};
 assert.throws(()=>evaluateReviewedCompositeInterfaces({geometry,revision:7,
  contactEvidence,sceneDepthEvidence:forged}),/current M5/);
});
test('C2 existing V7 composition session exposes internal patch but denies export and V5',()=>{
 const coordinator=createCoordinator(newProject({id:'C2BasicComposite',task:'composition'}));
 const session=createUnifiedProjectSession();coordinator.attachSolver(session);
 for(const g of [left(),p('Cap',q(12,3,2),q(20,8,6))]){
  coordinator.putObject({id:g.id,kind:'solid',spatialId:g.id+'_3D',
   projections:{V:[g.id+'_V'],H:[g.id+'_H'],W:[g.id+'_W']}});
  coordinator.putCondition({id:'source_'+g.id,objectId:g.id,sourceCandidateId:null,
   confirmed:false,value:{type:'manual-geometry',unit:'mm',
    imageId:coordinator.snapshot().source.imageId,geometry:g}});
  coordinator.confirmCondition('source_'+g.id);
 }
 const result=session.solve();
 assert.equal(result.kind,'composition-evidence');
 assert.equal(result.compositionInterfaceEvidence.contactPatchCount,1);
 assert.equal(result.compositionInterfaceEvidence.patches[0].strictInteriorAreaMm2,20);
 assert.equal(result.verified,false);
 assert.equal(result.plan,null);
 assert.equal(result.clock,null);
 assert.equal(coordinator.canExport(),false);
 coordinator.deleteObject('Cap');
 assert.equal(session.readSnapshot(),null);
 session.dispose();
});
test('C2 actual V7 UI describes M5 projected union without official line-style claim',()=>{
 const ui=fs.readFileSync('project/unified-workbench-entry.cjs','utf8');
 assert.match(ui,/compositionInterfaceEvidence/);
 assert.match(ui,/已证明内接触面/);
 assert.match(ui,/接触面的边缘、投影重合和空间遮挡仍需端点与深度证明/);
});

test('C2 exact touching full faces share all four ORIGINAL face-border subsegments',()=>{
 const r=run(p('Cap',q(12,0,0),q(20,10,8)));
 const segments=r.patches[0].boundarySegments;
 assert.equal(r.contactBoundarySegmentCount,4);
 assert.equal(segments.length,4);
 for(const e of segments){
  assert.equal(e.sourceFaceBoundaryClass,'shared-original-face-boundaries');
  assert.equal(e.originalSourceFaceBoundaryContainment.Base,true);
  assert.equal(e.originalSourceFaceBoundaryContainment.Cap,true);
  assert.equal(e.fullSegmentVisibilityVerified,false);
  assert.equal(e.officialLineStyleVerified,false);
  for(const v of ['V','H','W']){
   assert.deepEqual(e.projections[v].from,project(e.from3D)[v]);
   assert.deepEqual(e.projections[v].to,project(e.to3D)[v]);
   assert.equal(e.projections[v].standardLineStyle,'undetermined');
  }
 }
 assert.equal(r.canonicalConstructionReady,false);
 assert.equal(r.v5Ready,false);
});
test('C2 partial face contact segments belong only to smaller source face border',()=>{
 const r=run(p('Cap',q(12,3,2),q(20,8,6)));
 const segments=r.patches[0].boundarySegments;
 assert.equal(segments.length,4);
 assert.ok(segments.every(x=>
  x.sourceFaceBoundaryClass==='single-original-face-boundary'));
 assert.ok(segments.every(x=>
  x.originalSourceFaceBoundaryContainment.Base===false&&
  x.originalSourceFaceBoundaryContainment.Cap===true));
 assert.equal(r.patches[0].strictInteriorAreaMm2,20);
});
test('C2 partial aligned contact has proven dual and single source edge incidences',()=>{
 const r=run(p('Cap',q(12,0,0),q(20,5,8)));
 const labels=r.patches[0].boundarySegments.map(x=>x.sourceFaceBoundaryClass);
 assert.equal(labels.filter(x=>x==='shared-original-face-boundaries').length,3);
 assert.equal(labels.filter(x=>x==='single-original-face-boundary').length,1);
 assert.equal(r.officialLineStylesVerified,false);
});
test('C2 a finite exact face-rectangle intersection border is always in at least one source face',()=>{
 for(const bb of [
  p('Cap',q(12,1,3),q(20,7,9)),
  p('Cap',q(12,-5,-5),q(20,8,6)),
  p('Cap',q(12,-5,2),q(20,15,6))
 ]){
  const out=run(bb);
  for(const edge of out.patches.flatMap(p=>p.boundarySegments)){
   assert.notEqual(edge.sourceFaceBoundaryClass,'interior-face-cut');
   assert.equal(edge.complete3DSourceJoinVerified,false);
  }
 }
});
