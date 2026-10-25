#!/usr/bin/env node
/**
 * Real reusable C1 math consumer regression, using pinned OpenCascade.js WASM.
 * Must NOT pass using stubs, screenshots, or pre-recorded CAD fixtures.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFileSync,statSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
const require=createRequire(import.meta.url);
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {compileC1WithOcjsHLR,auditC1OcjsM5ProofGaps}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const {cuboidBounds,computeC1OcjsVisibleSegments}=
 require('../../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const {verifiedConvexMeshHalfspaces}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {auditC1OcjsPhysicalCreaseCandidates}=
 require('../../workbench/c1-ocjs-physical-crease-ray-evidence.cjs');
const {auditC1OriginalStrokeFinalPreconditions}=
 require('../../workbench/c1-m5-final-source-stroke-preconditions.cjs');
async function main(){
const key='2.0.0-beta.b5ff984';
const root=resolve(process.argv[2]??'');
if(!process.argv[2])throw new TypeError('isolated OCJS package root required');
const pkg=resolve(root,'node_modules/opencascade.js');
const manifest=JSON.parse(readFileSync(resolve(pkg,'package.json'),'utf8'));
assert.equal(manifest.version,key,'fixed real distribution required');
const bytes=statSync(resolve(pkg,'dist/opencascade.full.wasm')).size;
assert.ok(bytes>=50_000_000,'true pinned HLR WASM binary absent');
const entry=pathToFileURL(resolve(pkg,'dist/node.js')).href;
const {default:init}=await import(entry);
const t0=performance.now();
const oc=await init();
const initMs=performance.now()-t0;
const xyz=(x,y,z)=>({x,y,z});
function reviewed(min,max,revision,id){
 const source=prismMesh({solid:{min,max}});
 return {input:{
  geometryId:id,confirmedBy:'user',topologyConfirmed:true,
  revision,unit:'mm',edges:source.data.edges.map(e=>[...e]),
  faces:source.data.faces.map(f=>[...f]),
  vertices:Object.entries(source.data.points).map(([vertexId,p])=>{
   const v=project(p);
   return {id:vertexId,knownViews:{V:[v.V.u,v.V.v],H:[v.H.u,v.H.v]}};
  })
 },sheetTransform:{origin:{x:350,y:195},scale:3}};
}
const cases=[
 ['unequal-translated',xyz(-4,5,-9),xyz(24,18,31),31],
 ['negative-coordinate',xyz(-73,-44,-21),xyz(-13,-7,19),32],
 ['anisotropic-translated',xyz(151,22,-32),xyz(154,73,-29),33]
];
const records=[];
for(const [id,min,max,revision] of cases){
 const args=reviewed(min,max,revision,'C1OCJS_'+id.replaceAll('-','_'));
 const begin=performance.now();
 const result=compileC1WithOcjsHLR({...args,oc});
 assert.equal(result.c1CadRuntime.revision,revision);
 assert.equal(result.c1CadRuntime.geometryId,args.input.geometryId);
 assert.equal(result.c1CadRuntime.secondV5,false);
 assert.equal(result.c1CadRuntime.newOfficialLineStyleSigner,false);
 assert.equal(result.globalVisibleContourProof.allThreeViewsGlobalContourCertified,true);
 assert.equal(result.verifiedLineIntentAndOriginalSingleV5Parity,true);
 assert.equal(result.certifiedVisibleContourLineActionCount,12);
 assert.equal(result.intents.length,result.steps.length);
 assert.equal(result.wholeSolidV5Ready,false);
 assert.deepEqual(Object.keys(result.c1CadRuntime.perView).sort(),['H','V','W']);
 for(const view of Object.values(result.c1CadRuntime.perView)){
  assert.ok(view.cadVisibleSegments>=4);
  assert.equal(view.m5SignedVisibleIntervals,4);
  assert.equal(view.sourceAndCoverageAgreement,true);
 }
 result.player.invalidate(revision+1,0);
 assert.equal(result.player.canRender(revision),false);
 records.push({case:id,revision,
  elapsedMs:Math.round(performance.now()-begin),
  views:result.c1CadRuntime.perView});
}
// Stop unsupported geometry rather than approving untracked occluded edges.
const bad=reviewed(xyz(0,0,0),xyz(10,12,14),35,'C1Unsupported');
const fake={...bad.input,edges:bad.input.edges.slice(1)};
assert.throws(()=>compileC1WithOcjsHLR({input:fake,
 sheetTransform:bad.sheetTransform,oc}),/closed|edge|invalid|topology|geometry/i);
assert.throws(()=>compileC1WithOcjsHLR({input:bad.input,
 sheetTransform:bad.sheetTransform,oc:{}}),/OpenCascade|API|BRep|OCJS|TopAbs/i);
const q=prismMesh({solid:{min:xyz(0,0,0),max:xyz(2,4,9)}});
const g={...q,id:'C1rotated',data:{
 ...q.data,points:Object.fromEntries(Object.entries(q.data.points).map(
 ([id,p])=>[id,{x:p.x+p.y/2,y:p.y,z:p.z}]))}};
assert.throws(()=>cuboidBounds(g),/axis-aligned|corner|cuboid|axis-adjacent/);
// Reuse the SAME WASM HLR computation for geometrically different
// M0-proven closed convex non-cuboids; not snapshots or hardcoded projections.
const t={
 id:'C1SkewTetra',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{
  A:xyz(0,0,0),B:xyz(17,1,3),C:xyz(3,16,2),D:xyz(5,6,23)},
  edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
  faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]
 }
};
const general=[g,t],polyhedra=[];
for(const [index,geometry] of general.entries()){
 const proof=verifiedConvexMeshHalfspaces(geometry);
 assert.equal(proof.status,'validated-closed-convex-mesh');
 const at=performance.now();
 const cad=computeC1OcjsVisibleSegments({oc,geometry,revision:40+index});
 assert.equal(cad.sourceCandidateOnly,true);
 assert.equal(cad.v5Authorized,false);
 assert.equal(cad.proofScope,'reviewed-closed-convex-polyhedral-shell');
 assert.deepEqual(Object.keys(cad.views).sort(),['H','V','W']);
 let count=0;
 const valid=new Set(geometry.data.edges.map(edge=>
  geometry.id+'::'+[...edge].sort().join('|')));
 for(const view of Object.values(cad.views)){
  assert.ok(view.length>=3);
  for(const seg of view){
   assert.ok(seg.projectedOriginalEdgeCandidates.length>0);
   assert.ok(seg.projectedOriginalEdgeCandidates.every(id=>valid.has(id)));
   assert.ok([seg.from.u,seg.from.v,seg.to.u,seg.to.v].every(Number.isFinite));
   count++;
  }
 }
 // The existing M3 point reconstruction -> M0/M5 positive theorem ->
 // canonical original V5 is the ONLY signing authority. Real OCJS source
 // edges must cover each positively signed contour, and unrelated visible
 // CAD creases must stay outside the issued ConstructionStep DAG.
 const reviewedInput={
  geometryId:geometry.id,confirmedBy:'user',topologyConfirmed:true,
  revision:40+index,unit:'mm',
  vertices:Object.entries(geometry.data.points).map(([id,p])=>{
   const paper=project(p);
   return {id,knownViews:{V:[paper.V.u,paper.V.v],
     H:[paper.H.u,paper.H.v]}};
  }),edges:geometry.data.edges.map(e=>[...e]),
  faces:geometry.data.faces.map(e=>[...e])
 };
 const audited=auditC1OcjsM5ProofGaps({oc,input:reviewedInput,
  sheetTransform:{origin:{x:350,y:195},scale:3}});
 assert.equal(audited.sourceGeometryId,geometry.id);
 assert.equal(audited.revision,40+index);
 assert.equal(audited.proofScope,'reviewed-closed-convex-polyhedral-shell');
 assert.equal(audited.globalOfficialV5GateUnchanged,true);
 assert.equal(audited.officialLineStylesVerified,false);
 assert.equal(audited.signedV5ActionCount,0);
 assert.equal(audited.hiddenOrInternalEdgesSigned,false);
 assert.equal(audited.wholeSolidV5Ready,false);
 assert.ok(audited.counts.m5AtomicIntervals>=9);
 assert.equal(Object.values(audited.views).length,3);
 assert.equal(Object.values(audited.views).flatMap(v=>v.intervals).length,
  audited.counts.m5AtomicIntervals);
 assert.ok(Object.values(audited.views).flatMap(v=>v.intervals).every(x=>
  x.engineeringLineStyle==='undetermined'&&x.signedV5===false));
 // If generic M5 cannot positively prove its WHOLE visible ring, real CAD
 // agreement may still be useful forensic evidence but may NOT sign an
 // Intent/DAG/V5 stroke. Keep the original formal C1 gate fail-closed.
 // Both noncuboid meshes must now pass the SAME global M5 formal
 // contour proof as canonical cuboids. This is not a special solver path:
 // exact support-face clearance supplies the previously missing rays.
 assert.equal(audited.allThreeViewsGlobalM5Certified,true,
  'true generic convex closed source must obtain global first-angle exterior contour');
 assert.equal(audited.counts.unresolved,0,
  'no unresolved M5 atomic exterior contour intervals may reach formal V5');
 assert.equal(audited.counts.positiveM5CadConflicts,0,
  'a real CAD source disagreement must block the formal V5');
 assert.equal(audited.counts.cadAndM5Corroborated,
  audited.counts.m5AtomicIntervals);
 const canonical=compileC1WithOcjsHLR({oc,input:reviewedInput,
  sheetTransform:{origin:{x:350,y:195},scale:3}});
 assert.equal(canonical.wholeSolidV5Ready,false);
 assert.equal(canonical.c1CadRuntime.secondV5,false);
 assert.equal(canonical.c1CadRuntime.nonContourCADDrawingActionsSigned,0);
 assert.equal(canonical.verifiedLineIntentAndOriginalSingleV5Parity,true);
 assert.equal(canonical.certifiedVisibleContourLineActionCount,
  audited.counts.m5AtomicIntervals);
 const formalActions=new Set(canonical.certifiedVisibleContourLineActionIds);
 assert.equal(formalActions.size,audited.counts.m5AtomicIntervals);
 assert.ok(canonical.steps.flatMap(step=>step.actions)
  .filter(action=>formalActions.has(action.id))
  .every(action=>action.kind==='line'));
 canonical.player.invalidate(42+index,0);
 assert.equal(canonical.player.canRender(40+index),false);
 const formallySigned=true,
  scopedOfficialVisibleContourLines=formalActions.size;
 const features=auditC1OcjsPhysicalCreaseCandidates({
  oc,geometry,revision:40+index});
 assert.equal(features.sourceGeometryId,geometry.id);
 assert.equal(features.revision,40+index);
 assert.equal(features.officialV5ActionCount,0);
 assert.equal(features.standardEngineeringStylesCertified,false);
 assert.equal(features.wholeSolidV5Ready,false);
 assert.equal(features.originalSourceEdgeViews,geometry.data.edges.length*3);
 assert.equal(features.counts.claimedOfficialV5Strokes,0);
 assert.ok(features.rows.every(x=>x.signedV5===false&&
  x.officialEngineeringLineStyle==='undetermined'));
 assert.equal(features.counts.cadM0PositiveConflicts,0,
  'real CAD M0 positive non-hull edge conflict');
 const finalGate=auditC1OriginalStrokeFinalPreconditions({
  oc,geometry,revision:40+index,physicalEvidence:features});
 assert.equal(finalGate.schema,
  'draftai-c1-m5-recomputed-real-wasm-final-source-obligations/1');
 assert.equal(finalGate.sourceGeometryId,geometry.id);
 assert.equal(finalGate.revision,40+index);
 assert.equal(finalGate.signedV5ActionCount,0);
 assert.equal(finalGate.counts.totalOriginalSourceEdgeViewSubspans,
  features.counts.sourceBoundSubintervalCount);
 assert.equal(finalGate.independentOriginalVertexRayProofSchema,
  'draftai-c1-m5-exact-original-vertex-observer-ray/1');
 assert.equal(finalGate.sourceOriginalVertexObserverRayTotals.
  originalVertexViewRayCount,
  Object.keys(geometry.data.points).length*3);
 assert.ok(finalGate.subspans.every(x=>
  Array.isArray(x.exactOriginalVertexObserverRayEndpoints)&&
  x.exactOriginalVertexObserverRayEndpoints.length===2&&
  x.exactOriginalVertexObserverRayEndpoints.every(e=>
   e.signedV5Action===false&&
   (!e.actualReal3DSourceEndpointVerified||
    e.originalVertexId!==null))));
 assert.equal(finalGate.counts.originalVertexEndpointExactRayClearWitnesses+
  finalGate.counts.originalVertexEndpointExactNearInteriorWitnesses+
  finalGate.counts.originalVertexEndpointRayTangenciesHeld+
  finalGate.counts.paperCutEndpointsWithNoOriginalVertexRayProof,
  features.counts.sourceBoundSubintervalCount*2);

 assert.equal(finalGate.counts.attemptedNewEngineeringLineSignatures,0);
 assert.equal(finalGate.counts.attemptedNewV5Actions,0);
 assert.ok(finalGate.subspans.every(row=>
  row.formalStandardLineStyle==='undetermined'&&
  row.certifiedEngineeringSolidLine===false&&
  row.certifiedEngineeringDashedLine===false&&
  row.signedV5Action===false&&
  row.blockers.applicableStandardEngineeringLineStyleNotCertified===true&&
  row.blockers.originalConstructionIntentDAGAndSingleV5NotAuthorized===true));
 // A local M0 ray-clear source is not necessarily a unique, provenance-
 // resolved CAD source: never demand false positive FINAL stroke readiness.
 // Instead require every independently positive ray to be accounted for
 // even when CAD source multiplicity or other same-paper depth blocks it.
 assert.ok(features.counts.singleOpaqueSourceSubspanClearCount+
  features.counts.singleOpaqueSourceSubspanStrictHiddenCount>0,
  'genuine WASM regression must include independently computed M0 source rays');
 assert.ok(finalGate.counts.nonHullRayClearButCADSourceNotUniqueOrIncomplete>=0);
 assert.ok(finalGate.counts.nonHullRayClearButSourcePriorityUnproven>=0);
 assert.equal(finalGate.counts.strictlyHiddenEvidenceNotYetSignedAsDash,
  features.counts.singleOpaqueSourceSubspanStrictHiddenCount);

 // Caller-supplied display/QA flags are never accepted as real proof.
 assert.throws(()=>auditC1OriginalStrokeFinalPreconditions({
  oc,geometry,revision:40+index,physicalEvidence:{
   ...features,officialV5ActionCount:1}
 }),/stale\/forged/);

 assert.equal(features.sourceProjectedEventGraphSchema,
  'draftai-c1-original-source-m4-projected-event-graph/1');
 assert.equal(features.independentOriginal3DJunctionProofSchema,
  'draftai-c1-original-source-m4-3d-cut-junction-provenance/1');
 assert.equal(features.originalSourcePaperPrioritySchema,
  'draftai-c1-m5-original-source-paper-priority/1');
 assert.equal(features.exactStrictInwardPaperCandidatePruningSchema,
  'draftai-c1-m5-exact-hidden-paper-source-pruning/1');
 // Regression of REAL ambiguous HLR collinear original sources:
 // independent M0 exact inward excludes the far-back physical edge,
 // exposing ONE mathematically possible front edge without OCCT
 // TopoDS provenance or automatic GB/V5 authorization.
 if(index===0){
  assert.ok(features.counts.realCADSourceAliasResolvedByExactInwardCount>=1,
   'real oblique closed convex original projected aliases must narrow by exact inward support');
  assert.ok(finalGate.counts.localPositiveAfterStrictHiddenAliasElimination>=1,
   'exact physical alias pruning must improve genuine unsigned final M5 prerequisites');
  assert.equal(finalGate.counts.nonHullRayClearButCADSourceNotUniqueOrIncomplete,0);
 }

 assert.ok(features.rows.every(row=>row.sourceBoundSubintervals.every(span=>{
  const narrowed=span.originalPaperCandidatesPrunedByExactStrictInward;
  return narrowed?.sourceGeometryId===geometry.id&&
   narrowed?.revision===40+index&&
   narrowed?.view===row.view&&
   narrowed?.targetSourceEdgeId===row.sourceEdgeId&&
   narrowed?.signedV5Action===false&&
   narrowed?.actualOCCTTopoDSEdgeIdentityRecovered===false&&
   span.signedV5Action===false&&
   (!span.originalSourceUniquenessOnlyAfterExactM0Pruning||
    narrowed.targetUniqueWithinOriginalPaperCandidatesByExactM0&&
    narrowed.multipleCandidatesNarrowedByExactM0);
 })));

 assert.ok(features.rows.every(row=>row.sourceBoundSubintervals.every(span=>
  span.originalPaperSourcePriority.signedV5Action===false&&
  span.originalPaperSourcePriority.standardEngineeringLineStyle==='undetermined'&&
  span.originalPaperSourcePriority.
   allOpaqueFacesAndOriginalJunctionsCertified===false)));

 assert.ok(features.counts.authenticatedOriginalVertexSubspanEndpoints>0,
  'genuine reviewed 3D vertex endpoint witnesses required');
 assert.ok(features.rows.every(row=>row.sourceBoundSubintervals.every(span=>
  span.independentOriginal3DJunctionProof.signedV5Action===false&&
  span.independentOriginal3DJunctionProof.
   allPhysicalCrossSourceJunctionsAuthorized===false&&
  span.independentOriginal3DJunctionProof.fromEndpoint.
   authorizedAsV5Junction===false&&
  span.independentOriginal3DJunctionProof.toEndpoint.
   authorizedAsV5Junction===false)));

 assert.equal(features.sourcePairDepthProofSchema,
  'draftai-c1-m5-projected-original-source-affine-depth/1');
 assert.equal(features.originalSourceOpaqueSubspanProofSchema,
  'draftai-c1-m5-original-source-subspan-opaque-ray/1');
 assert.equal(features.counts.sourceBoundSubintervalCount,
  features.counts.singleOpaqueSourceSubspanClearCount+
  features.counts.singleOpaqueSourceSubspanStrictHiddenCount+
  features.counts.singleOpaqueSourceSubspanUndeterminedCount+
  features.counts.singleOpaqueSourceSubspanExteriorHeldCount);
 assert.ok(features.rows.every(row=>row.sourceBoundSubintervals.every(span=>
  span.sourceSubspanOpaqueRayFullyRecomputed===true&&
  !(span.wholeOpenSubspanStrictlyOpaqueOccluded&&
   (span.wholeOpenSubspanExactSourceRayClear||
    span.wholeOpenSubspanAnalyticRayClear))&&
  span.signedV5Action===false)));
 if(index===1){
  assert.ok(features.counts.exactOriginalStrictInwardOpaqueSubspanCount>0,
   'genuine nonregular tetra source backside must independently prove strict interior open ray');
  assert.ok(features.counts.singleOpaqueSourceSubspanStrictHiddenCount>0,
   'genuine C1 source spans must have strictly hidden mathematics, NOT guessed CAD dash style');
 }
 assert.equal(features.counts.originalSourcePairDepthOverlapCount,
  features.counts.originalSourcePairStrictDepthProofCount+
  features.counts.originalSourcePairUnresolvedDepthCount);
 assert.ok(features.rows.every(row=>row.sourceBoundSubintervals.every(span=>
  span.allOpaqueFaceDepthsVerified===false&&
  span.sourcePairDepthComparisons.every(pair=>
   pair.signedV5Action===false&&
   pair.engineeringLineStyle==='undetermined'&&
   pair.thirdPartyFacesVerified===false))));
 assert.equal(features.counts.sourceBoundSubintervalCount,
  features.rows.reduce((n,row)=>n+row.sourceBoundSubintervals.length,0));
 assert.ok(features.counts.projectedSourceEventCount>0,
  'real convex original source M4 V/H/W events required');
 assert.ok(features.rows.some(row=>
  row.physicalProjectedJunctionEncounters.length>0),
  'M4 must preserve original projected source event provenance');
 assert.ok(features.rows.every(row=>
  row.sourceBoundSubintervals.every(span=>
   span.signedV5Action===false&&
   span.officialEngineeringLineStyle==='undetermined'&&
   span.sourceEdgeId===row.sourceEdgeId&&
   span.originalParameterRange[0]<span.originalParameterRange[1])));
 assert.ok(features.rows.every(row=>
  row.physicalProjectedJunctionEncounters.every(event=>
   event.original3DPhysicalJunctionProven!==event.projectedOnlyUnresolved)));
 polyhedra.push({geometryId:geometry.id,revision:40+index,
  physicalFeatureEvidence:{
   localExactOutwardCADVisible:
    features.counts.locallyCADAndM5Visible,
   finalSourceObligations:{
    total:finalGate.counts.totalOriginalSourceEdgeViewSubspans,
    existingOuterContourHeld:finalGate.counts.externalContourHeld,
    physicalFeatureUnproven:finalGate.counts.unprovenPhysicalFeatureHeld,
    visibleCadRayCorroboratedAwaitingFinalM5:
     finalGate.counts.visibleWholeRayAndCadButOtherGatesRemain,
    localPositiveAfterExactSourceAliasElimination:
     finalGate.counts.localPositiveAfterStrictHiddenAliasElimination,
    sourceCandidateIdentitiesPrunedByExactInward:
     finalGate.counts.exactInwardPrunedOriginalSourceCandidates,
    wholeOpenStrictlyHiddenAwaitingFinalM5:
     finalGate.counts.strictlyHiddenWholeOpenRayButOtherGatesRemain,
    behindAnotherSource:
     finalGate.counts.behindAnotherPhysicalSource,
    duplicate3D:finalGate.counts.physical3DDuplicateHeld,
    unresolved:
     finalGate.counts.unresolvedPhysicalVisibilityOrSourcePriority,
    realCadPositiveWithoutWholeRay:
     finalGate.counts.realCadPositiveWithoutWholeRayProof,
    rayClearButRealCadSourceNotUnique:
     finalGate.counts.nonHullRayClearButCADSourceNotUniqueOrIncomplete,
    rayClearButOriginalSourcePriorityUnproven:
     finalGate.counts.nonHullRayClearButSourcePriorityUnproven,
    strictHiddenNotYetSignedAsDash:
     finalGate.counts.strictlyHiddenEvidenceNotYetSignedAsDash,
    genuineOriginalVertexWholeRayClearEndpoints:
     finalGate.counts.originalVertexEndpointExactRayClearWitnesses,
    genuineOriginalVertexNearSolidInteriorEndpoints:
     finalGate.counts.originalVertexEndpointExactNearInteriorWitnesses,
    tangentOriginalVertexRayEndpointsHeld:
     finalGate.counts.originalVertexEndpointRayTangenciesHeld,
    paperOnlyCutEndpointsNeverUpgraded:
     finalGate.counts.paperCutEndpointsWithNoOriginalVertexRayProof,
    signedNewV5:finalGate.signedV5ActionCount
   },
   localStrictHidden:
    features.counts.locallyFullStrictlyOccluded,
   blockedOrUnresolved:features.counts.undetermined,
   exteriorExcluded:features.counts.skippedContourOverlaps,
   coplanarSubdivisionsExcluded:features.counts.skippedCoplanarSubdivisions,
   CADSourceConflicts:features.counts.cadM0PositiveConflicts,
   formalSignedCount:features.officialV5ActionCount,
   originalSourceM4Events:features.counts.projectedSourceEventCount,
   sourceBoundProjectedSubintervals:features.counts.sourceBoundSubintervalCount,
   nonHullPositiveSubintervals:features.counts.nonHullPositiveSubintervals,
   nonHullUnresolvedSubintervals:features.counts.nonHullUndeterminedSubintervals,
   hullExcludedSubintervals:features.counts.hullHeldSubintervals,
   authenticOriginalVertexEventWitnesses:
    features.counts.exactOriginalVertexEventWitnesses,
   paperOnlyUnresolvedEventWitnesses:
    features.counts.paperOnlyUnresolvedEventWitnesses,
   originalSourcePairDepthOverlapCount:
    features.counts.originalSourcePairDepthOverlapCount,
   originalSourceStrictAffineFrontCount:
    features.counts.originalSourcePairStrictDepthProofCount,
   originalSourceUnresolvedPairDepthCount:
    features.counts.originalSourcePairUnresolvedDepthCount,
   sharedVertexDepthProofCount:
    features.counts.authenticSharedVertexPairDepthProofCount,
   original3DVertexEndpointEvidenceCount:
    features.counts.authenticatedOriginalVertexSubspanEndpoints,
   originalPaperSoleListedCount:
    features.counts.originalSourcePaperSoleListedCount,
   originalPaperStrictFrontCount:
    features.counts.originalSourcePaperStrictFrontCount,
   originalPaperBehindSourceCount:
    features.counts.originalSourcePaperBehindSourceCount,
   originalPaperUnresolvedAliasCount:
    features.counts.originalSourcePaperUnresolvedCount,
   originalPaperExact3DDuplicateCount:
    features.counts.originalSourcePaperExact3DDuplicateCount,
   originalPaperPartialOverlapCount:
    features.counts.originalSourcePaperPartialOverlapCount,
   originalPaperPairDepthProofCount:
    features.counts.originalSourcePaperOverlapPairDepthCount,
   actualRealCADMultipleRawSourceAliasSubspans:
    features.counts.realCADCollinearMultipleOriginalCandidateCount,
   provenExactHiddenEliminationsYieldUniqueOriginalSource:
    features.counts.realCADSourceAliasResolvedByExactInwardCount,
   certifiedSameOriginal3DEdgeCutJoins:
    features.counts.sameOriginalSource3DAdjacentCutContinuities,
   unresolvedPaperOnly3DSourceEventCount:
    features.counts.paperOnlyForeignSourceEventWitnesses,
   roundedProjectedParameterJoinsHeld:
    features.counts.roundedParameterPhysicalJoinRefusals,
   actualSingleOpaqueSourceClearSubspans:
    features.counts.singleOpaqueSourceSubspanClearCount,
   actualSingleOpaqueSourceStrictHiddenSubspans:
    features.counts.singleOpaqueSourceSubspanStrictHiddenCount,
   exactStrictInwardOpaqueSourceSubspans:
    features.counts.exactOriginalStrictInwardOpaqueSubspanCount,
   actualSingleOpaqueSourceUnknownSubspans:
    features.counts.singleOpaqueSourceSubspanUndeterminedCount,
   originalM5ExteriorHeldSubspans:
    features.counts.singleOpaqueSourceSubspanExteriorHeldCount
  },
  authenticCadVisibleSegments:count,
  elapsedMs:Math.round(performance.now()-at),
  m5Signed:formallySigned,
  scopedOfficialVisibleContourLines,
  m5GlobalSignedGate:audited.allThreeViewsGlobalM5Certified,
  localM5Positive:audited.counts.locallyPositive,
  cadM5Corroborated:audited.counts.cadAndM5Corroborated,
  cadM5Conflicts:audited.counts.positiveM5CadConflicts,
  m5Unresolved:audited.counts.unresolved,
  unsignedProofGaps:Object.entries(audited.views).flatMap(([v,row])=>
   row.intervals.map((it,i)=>({...it,view:v,index:i}))
    .filter(it=>it.status==='undetermined')
    .map(it=>({view:v,index:it.index,sourceEdgeId:it.sourceEdgeId,
      from:it.fromModelMm,to:it.toModelMm,realCadCovered:it.realCadCovered,
      blockers:it.blockers}))),
  sharedPhysicalEndpointOpenDepthCertificates:
   audited.counts.sharedPhysicalEndpointDepthCertificates,
  missing3DSourceCoverage:audited.counts.missing3DSourceCoverage,
  missingPhysicalJunctionProof:audited.counts.missingPhysicalJunctionProof,
  missingContinuousFrontRayProof:audited.counts.missingContinuousFrontRayProof,
  unsignedInteriorCadLines:count-scopedOfficialVisibleContourLines,
  uniqueV5:formallySigned});

}
// Preserve strict unsupported/degenerate source refusal.
assert.throws(()=>computeC1OcjsVisibleSegments({oc,
 geometry:{...t,data:{...t.data,faces:t.data.faces.slice(1)}},revision:55}),
 /convex|closed|face|Euler/i);
const report={
 schema:'draftai-c1-ocjs-runtime-compute-m5-consumer/1',
 wasmPackage:manifest.name,version:key,wasmBytes:bytes,
 initializedActualWasm:true,initializationMs:Math.round(initMs),
 computationalConsumers:records.length,records,
 genericConvexWasmConsumers:polyhedra.length,polyhedra,
 originalM5AuthorityPreserved:true,extraV5Players:0,
 productionBrowserBundled:false,androidAccepted:false
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');

}
main().catch(error=>{
 process.stderr.write('C1 OCJS CONSUMER FAILED: '+String(error?.message??error)+'\\n');
 process.stderr.write(String(error?.stack??'').split('\\n').slice(0,5).join('\\n')+'\\n');
 process.exitCode=1;
});
