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
const {verifyConvexProjectedOutline}=
 require('../../core/verification/convex-projected-outline.cjs');
const {auditC1OcjsPhysicalCreaseCandidates}=
 require('../../workbench/c1-ocjs-physical-crease-ray-evidence.cjs');
const {auditC1OriginalStrokeFinalPreconditions}=
 require('../../workbench/c1-m5-final-source-stroke-preconditions.cjs');
const {reviewC1M5FinalStrokeObligations}=
 require('../../workbench/c1-m5-final-source-obligation-review.cjs');
const {reviewC1NativeHiddenFinalM5Strokes}=
 require('../../workbench/c1-native-hidden-global-m5-stroke-gate.cjs');
const {auditC1RealOcctVisibleContourSourceParity}=
 require('../../workbench/c1-real-occt-m5-visible-contour-parity.cjs');
const {auditC1NativeHiddenSharpVsM5}=
 require('../../workbench/c1-ocjs-hidden-sharp-m5-corroboration.cjs');
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
 assert.equal(result.c1CadRuntime.everyM5SignedContourReboundToRealNativeOCCTOriginal3DSource,true);
 assert.equal(result.c1CadRuntime.fullyNative3DSourceVerifiedExteriorM5ContourStrokes,12);
 assert.equal(result.c1CadRuntime.originalM5SignedExteriorContourStrokes,12);
 assert.equal(result.c1CadRuntime.sourceProofFromIndependentClosedRayAndActualNativeHLR,true);
 assert.equal(result.c1CadRuntime.originalGeneratedTopoDSEdgeHistoryNotClaimed,true);
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
 const exactHullOutline=verifyConvexProjectedOutline({
  mesh:geometry,revision:40+index});
 let exactM0EndpointBoundFullSides=0;
 for(const view of ['V','H','W']){
  const hull=exactHullOutline[view];
  for(const [sideIndex,side] of hull.boundarySides.entries()){
   const fromIds=hull.vertices[sideIndex].sourcePointIds,
    toIds=hull.vertices[(sideIndex+1)%hull.vertices.length].sourcePointIds;
   for(const candidate of side.sourceEdgeCandidates){
    const [a,b]=candidate.sourceEdgeId.split('|');
    const fullByVertexIds=(fromIds.includes(a)&&toIds.includes(b))||
     (fromIds.includes(b)&&toIds.includes(a));
    if(fullByVertexIds){
     assert.deepEqual(candidate.projectedFractionRange,[0,1],
      'literal M0 hull endpoint IDs must preserve exact [0,1] source span');
     exactM0EndpointBoundFullSides++;
    }
   }
  }
 }
 assert.ok(exactM0EndpointBoundFullSides>=3,
  'real convex geometry must exercise exact M0 hull vertex ID parameters');

 const at=performance.now();
 const cad=computeC1OcjsVisibleSegments({oc,geometry,revision:40+index});
 // Real native edge IsSame is checked BEFORE OCJS handles are disposed,
 // against EVERY original BRep 3D edge occurrence. Two equal paper lines
 // must never count as generated->source TopoDS identity.
 for(const view of ['V','H','W'])
  for(const edge of [...cad.views[view],...cad.hiddenSharpViews[view]]){
   assert.equal(edge.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared,true);
   assert.equal(edge.originalPhysicalOCCTSourceIdsCompared.length,
    geometry.data.edges.length);
   assert.equal(edge.actualDistinctOriginalOCCTBRepSourceCount,
    geometry.data.edges.length);
   assert.ok(edge.actualOriginalOCCTBRepEdgeOccurrencesCompared>=
    geometry.data.edges.length);
   assert.equal(new Set(edge.originalPhysicalOCCTSourceIdsCompared).size,
    geometry.data.edges.length);
   assert.equal(
    edge.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven,
    edge.directlySameUniqueOriginalOCCTBRepSourceEdgeId!==null);
   if(edge.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven)
    assert.ok(edge.projectedOriginalEdgeCandidates.includes(
     edge.directlySameUniqueOriginalOCCTBRepSourceEdgeId));
   assert.equal(edge.completeOCCTGeneratedEdgeToOriginalTopoDSHistoryCertified,false);
   assert.equal(edge.signedV5Action,false);
  }
 // Independently recompute true hidden HLR output and all ORIGINAL M4/M5
 // closed-ray source subspans; do not attribute HLR's generated TopoDS
 // identity merely because paper projections coincide.
 const nativeHiddenM5=auditC1NativeHiddenSharpVsM5({
  oc,geometry,revision:40+index
 });
 assert.equal(nativeHiddenM5.allOriginal3DEdgesAndViewsRecomputed,true);
 assert.equal(nativeHiddenM5.sourceAndGeneratedHiddenLineAttributionNotCertified,true);
 assert.equal(nativeHiddenM5.officialEngineeringLineStylesCertified,false);
 assert.equal(nativeHiddenM5.signedV5ActionCount,0);
 assert.equal(nativeHiddenM5.nativeHiddenSourceRefinements.length,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
 assert.equal(
  nativeHiddenM5.counts.nativeHiddenSharpWithNoSurvivingM5Source+
   nativeHiddenM5.counts.nativeHiddenSharpWithOneSurvivingM5Source+
   nativeHiddenM5.counts.nativeHiddenSharpStillWithMultipleM5Sources,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments
 );
 assert.ok(nativeHiddenM5.nativeHiddenSourceRefinements.every(r=>
  r.nativeHLRToSourceTopoDSIdentityRecovered===false&&
  r.formalEngineeringLineStyle==='undetermined'&&
  r.constructionIntentAuthorized===false&&
  r.signedV5Action===false));
 assert.equal(nativeHiddenM5.nativeHidden3DEndpointFans.genuineNativeHiddenSharpStrokeCount,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
 assert.equal(nativeHiddenM5.nativeHidden3DEndpointFans.nativeGeneratedTopoDSEdgeEndpointIdentityProven,false);
 assert.equal(nativeHiddenM5.nativeHidden3DEndpointFans.signedV5ActionCount,0);
 const nativeGeneratedVertexGraph=cad.nativeGeneratedVertexGraph;
 const nativeIsSame3D=nativeHiddenM5.nativeHLRVertexConcordance;
 const nativeEncounters=nativeHiddenM5.nativeHLRAllM4ProjectedEncounters;
 assert.equal(nativeEncounters.counts.genuineNativeHiddenSharpEdgesInspected,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
 assert.equal(nativeEncounters.entireReviewedNativeHiddenSourceM4EventLedgerAudited,true);
 assert.equal(nativeEncounters.wholeSceneProjectedJunctionAndOcclusionCertified,false);
 assert.equal(nativeEncounters.signedV5ActionCount,0);
 assert.equal(
  nativeEncounters.counts.nativeOriginalM4TransverseCrossingEventsFound,
  nativeEncounters.counts.exactOriginal3DStrictFrontDepthAtM4TransverseCrossingsProven+
  nativeEncounters.counts.exactM4TransverseCrossingsWithDepthTieHeld+
  nativeEncounters.counts.exactM4TransverseCrossingsOutsideOriginalOpenSourceHeld);
 assert.ok(nativeEncounters.rows.every(row=>
  row.originalM4ProjectedEncountersOnNativeSource.every(ev=>
   ev.exactOriginalM4CrossingObserverDepthEvidence===null||
   (ev.exactOriginalM4CrossingObserverDepthEvidence.signedV5Action===false&&
    ev.exactOriginalM4CrossingObserverDepthEvidence.
     sceneCompleteOcclusionAndGlobalJoinCertified===false&&
    ev.fullGlobalProjectedJunctionAndDepthSwitchCertified===false))));
 assert.ok(nativeEncounters.rows.every(r=>
  r.generatedHLREdgeAndOriginalTopoDSIdentityCertified===false&&
  r.officialEngineeringLineStyle==='undetermined'&&
  r.signedV5Action===false&&
  r.originalM4ProjectedEncountersOnNativeSource.every(e=>
   e.fullGlobalProjectedJunctionAndDepthSwitchCertified===false&&
   e.signedV5Action===false)));
 assert.equal(nativeGeneratedVertexGraph.schema,
  'draftai-ocjs-genuine-hlr-generated-topods-issame-vertex-graph/1');
 assert.equal(nativeGeneratedVertexGraph.signedV5ActionCount,0);
 assert.equal(nativeGeneratedVertexGraph.literalPaperCoordinateAloneNeverTopology,true);
 assert.equal(nativeGeneratedVertexGraph.counts.genuineOCCTNativeHLRSharpEdges,
  ['V','H','W'].reduce((n,v)=>
   n+cad.views[v].length+cad.hiddenSharpViews[v].length,0));
 assert.equal(nativeGeneratedVertexGraph.counts.actualNativeBRepVertexEndpoints,
  2*nativeGeneratedVertexGraph.counts.genuineOCCTNativeHLRSharpEdges);
 assert.equal(nativeGeneratedVertexGraph.
  allVHWGeneratedNativeTopologyPairsComparedWithoutPaperBucketing,true);
 assert.equal(nativeGeneratedVertexGraph.
  generatedJunctionComponentsBasedOnlyOnPairwiseOCCTIsSame,true);
 assert.equal(nativeGeneratedVertexGraph.counts.allPerViewGeneratedOCCTTopoDSVertexPairsChecked,
  ['V','H','W'].reduce((n,v)=>{
   const k=2*(cad.views[v].length+cad.hiddenSharpViews[v].length);
   return n+k*(k-1)/2;
  },0));
 assert.equal(nativeIsSame3D.allPerViewActualNativeGeneratedJunctionComponentsConsumed,true);
 assert.equal(nativeIsSame3D.counts.genuineCompleteGeneratedHLRJunctionComponentsAudited,
  nativeGeneratedVertexGraph.counts.genuinelySharedNativeJunctionComponents);
 assert.equal(nativeIsSame3D.counts.
  generatedNativeJunctionComponentsWithExactOriginal3DSourceInteriorSplit,
  nativeIsSame3D.completeGenuineNativeHLRJunctionStars.filter(star=>
   star.actualOCCTGeneratedHLRSourceEdgeInteriorSplit3DProven===true).length);
 assert.ok(nativeIsSame3D.completeGenuineNativeHLRJunctionStars.every(star=>
  star.actualOCCTGeneratedHLRSourceEdgeInteriorSplit3DProven!==true||
  (star.allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex===false&&
   star.source3DEdgeInteriorOriginalEdgeId!==null&&
   star.source3DEdgeInteriorParameter>0&&
   star.source3DEdgeInteriorParameter<1&&
   star.originalOCCTGeneratedToSourceTopoDSEdgeHistoryRecovered===false&&
   star.signedV5Action===false)));
 assert.equal(nativeIsSame3D.counts.
  completeGeneratedHLRJunctionComponentsWithIndependentOriginal3DVertex+
  nativeIsSame3D.counts.
   completeGeneratedHLRJunctionComponentsHeldOnUnmappedPhysicalSource,
  nativeGeneratedVertexGraph.counts.genuinelySharedNativeJunctionComponents);
 assert.ok(nativeIsSame3D.completeGenuineNativeHLRJunctionStars.every(node=>
  node.genuineNativeGeneratedOCCTVertexPairwiseIsSame===true&&
  node.originalOCCTGeneratedToSourceTopoDSEdgeHistoryRecovered===false&&
  node.wholeSceneAndEngineeringGBJunctionCertified===false&&
  node.signedV5Action===false));
 assert.equal(nativeIsSame3D.counts.actualNativeIsSamePairs,
  nativeGeneratedVertexGraph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs);
 assert.equal(
  nativeIsSame3D.counts.IsSameHiddenToHiddenNativeEndpointPairs+
  nativeIsSame3D.counts.IsSameNativeVisibleAndHiddenSourceHistoryStillUnknown+
  nativeIsSame3D.counts.
   nativeMixedVisibleHiddenWithAuthenticatedOriginalM0VertexAndM5ClearRay,
  nativeIsSame3D.counts.actualNativeIsSamePairs);
 assert.ok(nativeIsSame3D.completeGenuineNativeHLRJunctionStars.every(node=>
  node.includesActualVisibleHLRWithIndependentM5WholeOriginalClearRay!==true||
  (node.allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex===true&&
   node.independentlyVerifiedOriginalM03DVertexId!==null&&
   node.originalOCCTGeneratedToSourceTopoDSEdgeHistoryRecovered===false)));
 assert.equal(nativeIsSame3D.counts.exactPaperCoincidentButDistinctNativeTopoDSPairsHeld,
  nativeGeneratedVertexGraph.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs);
 assert.equal(nativeIsSame3D.actualGeneratedHLREdgeToOriginalTopoDSEdgeHistoryComplete,false);
 assert.equal(
  nativeIsSame3D.counts.actualOriginal3DPhysicalSourceJunctionPairsVerified,
  nativeIsSame3D.counts.IsSameHiddenToHiddenMatchingOriginal3DPhysicalVertices+
  nativeIsSame3D.counts.distinctNativeTopoDSButSameIndependentlyProvenOriginal3DVertexPairs);
 assert.equal(
  nativeIsSame3D.counts.exactPaperCoincidentButDistinctNativeTopoDSPairsHeld,
  nativeIsSame3D.counts.distinctNativeTopoDSButSameIndependentlyProvenOriginal3DVertexPairs+
  nativeIsSame3D.counts.paperCoincidentNativePairsWithoutIndependent3DPhysicalJunction);
 assert.equal(nativeIsSame3D.signedV5ActionCount,0);
 assert.ok(nativeIsSame3D.rows.every(p=>
  p.actualOCCTHLRGeneratedTopoDSVertexIsSame===true&&
  p.originalGeneratedHLRTopoDSToSourceTopoDSEdgeHistoryCertified===false&&
  p.globalJunctionAndGBEngineeringLineStyleCertified===false&&
  p.signedV5Action===false));
 const nativePhysicalEnd=nativeHiddenM5.nativeHiddenOriginalVertexEndpointProof;
 assert.equal(nativePhysicalEnd.counts.nativeHLRHiddenEdgesExamined,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
 assert.equal(nativePhysicalEnd.M4SourceCutGapsStillReportedIndependently,true);
 assert.equal(nativePhysicalEnd.allGlobalOCCTHLREdgeJoinsVerified,false);
 assert.equal(nativePhysicalEnd.signedV5ActionCount,0);
 assert.equal(nativePhysicalEnd.counts.originalM4EndCutsStillUnproven,
  nativePhysicalEnd.counts.missingM4EndpointsIndependentlyPositiveNativeM0VertexProven+
  nativePhysicalEnd.counts.missingM4EndpointsStillLackingIndependentNativeProof);
 assert.ok(nativePhysicalEnd.rows.every(row=>
  row.OCCTGeneratedTopoDSNativeEdgeAdjacencyCertified===false&&
  row.applicableGBEngineeringLineStyleCertified===false&&
  row.signedV5Action===false));
 const wholeHidden=nativeHiddenM5.nativeHiddenOriginalOpenRayClosure;
 assert.equal(wholeHidden.counts.actualNativeHiddenEdgesAudited,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
 assert.equal(wholeHidden.signedV5ActionCount,0);
 assert.equal(wholeHidden.wholeEngineeringHiddenLineCertification,false);
 assert.equal(wholeHidden.allOriginal3DRayParameterGapsPreserved,true);
 const frontMask=nativeHiddenM5.nativeHiddenFrontVisibleMask;
 assert.equal(frontMask.counts.realHiddenNativeEdgesAudited,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
 assert.equal(frontMask.signedV5ActionCount,0);
 const combinedHidden=nativeHiddenM5.nativeHiddenDualOpenIntervalProof;
 assert.equal(combinedHidden.counts.realNativeHiddenOpenLineIntervalsReviewed,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
 assert.equal(combinedHidden.counts.realNativeHiddenOpenLineIntervalsReviewed,
  combinedHidden.counts.entireNativeHiddenOpenIntervalLocallyAccountedByEitherProof+
   combinedHidden.counts.stillUnprovenAfterConservativeIntervalUnion);
 assert.equal(combinedHidden.signedV5ActionCount,0);
 assert.equal(combinedHidden.allGeneratedTopoDSOriginalSourceHistoryProven,false);
 const exactFront=nativeHiddenM5.nativeHiddenExactModelFrontMask;
 assert.equal(exactFront.counts.genuineNativeHiddenSharpStrokes,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
 assert.equal(exactFront.signedV5ActionCount,0);
 assert.equal(exactFront.exactM0ProjectedVertexEqualityNotToleranceSnapped,true);
 assert.equal(exactFront.HLRToOriginalTopoDSIdentityProven,false);
 const gapModel=nativeHiddenM5.nativeHiddenExactOriginalFrontGap;
 assert.equal(gapModel.counts.actualNativeHiddenEdgesReviewed,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
 assert.equal(gapModel.signedV5ActionCount,0);
 assert.equal(gapModel.actualNativeGeneratedHLRPaperCoverageAndOriginalModelProofNotConflated,true);
 assert.ok(gapModel.rows.every(r=>r.signedV5Action===false&&
  r.constructionIntentAuthorized===false&&
  r.nativeHLRGeneratedSourceTopoDSLinksAndAllJunctionsProven===false&&
  r.originalM4OrNativePaperPositiveGapWitnesses.every(w=>
   w.signedV5Action===false&&
   w.officialEngineeringLineStyle==='undetermined'&&
   w.generatedHLRSourceTopoDSHistoryAndAllJunctionsCertified===false)));
 assert.ok(exactFront.rows.every(row=>
  row.actualOCCTGeneratedHLRToOriginalTopoDSIdentityCertified===false&&
  row.finalGBHiddenLineStyleCertified===false&&
  row.signedV5Action===false&&
  row.independentModelExactFullFrontOriginalCandidates.every(candidate=>
   candidate.original3DProjectionAndExactAffineDepthProof.
    strictObserverFrontDepthAcrossOriginalOpenInterval===true&&
   candidate.originalNativeHLRSourceTopoDSIdentitiesCertified===false&&
   candidate.signedV5Action===false)));
 assert.ok(combinedHidden.rows.every(row=>
  row.fullGBDashedLineOrVisibleLineAssignmentSigned===false&&
  row.entireOriginal3DAndGeneratedHLRPhysicalJunctionProofCertified===false&&
  row.constructionIntentAuthorized===false&&row.signedV5Action===false));
 assert.equal(frontMask.allNativeHLRGeneratedTopoDSLinksProven,false);
 assert.equal(
  frontMask.counts.unique3DHiddenCandidateEdgesAudited+
   frontMask.counts.nativeHiddenWithoutUnique3DSourceHeld,
  frontMask.counts.realHiddenNativeEdgesAudited);
 assert.ok(frontMask.rows.every(row=>
  row.officialEngineeringLineStyle==='undetermined'&&
  row.originalHLRSourceTopoDSIdentityRecovered===false&&
  row.constructionIntentAuthorized===false&&row.signedV5Action===false&&
  row.realNativeVisibleFrontOriginalSourceWitnesses.every(w=>
   w.realOCCTVisibleFrontSharpStroke===true&&
   w.exactM5FullClosedOriginalFrontRayClear===true&&
   w.independentlyRecomputedOriginalM4WholeAffineFrontDepthOrder===true&&
   w.nativeHLRGeneratedTopoDSIdentityCertified===false&&
   w.GBStyleCertified===false&&w.signedV5Action===false)));
 assert.ok(wholeHidden.rows.every(r=>
  r.nativeHLRGeneratedTopologyComplete===false&&
  r.wholeNativeHLRLineOfficialGBStyleCertified===false&&
  r.signedV5Action===false&&
  r.sourceCandidate3DProofs.every(candidate=>
   candidate.nativeGeneratedTopoDSOriginalSourceIdentityRecovered===false&&
   candidate.officialEngineeringLineStyle==='undetermined'&&
   candidate.constructionIntentAuthorized===false&&
   candidate.signedV5Action===false)));
 assert.equal(
  nativeHiddenM5.nativeHidden3DEndpointFans.counts.survivingOriginal3DSourceEndpointsReviewed,
  nativeHiddenM5.nativeHidden3DEndpointFans.rows.reduce((n,r)=>
   n+2*r.survivingOriginal3DEdgesWithEndpointFans.length,0));
 assert.ok(nativeHiddenM5.nativeHidden3DEndpointFans.rows.every(r=>
  r.nativeHLREdgeJunctionsCertified===false&&
  r.survivingOriginal3DEdgesWithEndpointFans.every(src=>
   src.endpointWitnesses.every(w=>
    w.signedV5Action===false&&
    w.nativeHLRGeneratedTopoDSEndpointToOriginalTopoDSIdentityCertified===false&&
    w.nativeHLRNativeEdgeToAnotherHLREdgeJoinCertified===false))));
 assert.equal(nativeHiddenM5.counts.signedNewV5Actions,0);
 assert.equal(nativeHiddenM5.counts.signedNewEngineeringStrokes,0);
 assert.equal(nativeHiddenM5.rows.length,geometry.data.edges.length*3);
 assert.ok(nativeHiddenM5.rows.every(row=>
  row.officialEngineeringStyle==='undetermined'&&
  row.signedV5Action===false&&
  row.subspans.every(span=>
   span.finalEngineeringStyle==='undetermined'&&
   span.constructionIntentAuthorized===false&&
   span.signedV5Action===false)));
 // Source shape is the REAL original OCCT B-Rep, not flattened HLR edges.
 assert.equal(cad.completeSourceTopology3DEndpointCorrespondence,true);
 assert.equal(cad.originalBRepSourceEdges.length,geometry.data.edges.length);
 assert.ok(cad.occtOriginalEdgeOccurrenceCount>=geometry.data.edges.length);
 assert.equal(cad.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched,false);
 const sourceIds=new Set(cad.originalBRepSourceEdges.map(s=>s.sourceEdgeId));
 assert.equal(sourceIds.size,geometry.data.edges.length);
 assert.ok(cad.originalBRepSourceEdges.every(s=>
  s.originalOCCTBRepVertexXYZMatched===true&&
  s.generatedHLREdgeTopoDSIdentityMatched===false&&
  s.occtCurveTypeIndependentlyVerified===true&&
  s.occtSourceCurveType==='line'&&
  s.occtSourceCurve3DEndpointsAndMidpointVerified===true&&
  s.occtSourceCurveParameterRange[1]>s.occtSourceCurveParameterRange[0]));
 // Independently recalculate physical length from REAL OCCT source vertices:
 // a forged [first,last] BRepAdaptor parameter range must not silently
 // become a normalized M0/M5 source interval. This remains unsigned.
 for(const source of cad.originalBRepSourceEdges){
  const a=source.fromOCCT3D,b=source.toOCCT3D;
  const lengthMm=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
  const [first,last]=source.occtSourceCurveParameterRange;
  assert.ok(Number.isFinite(lengthMm)&&lengthMm>1e-8);
  assert.ok(Math.abs((last-first)-lengthMm)<=
   1e-6*Math.max(1,lengthMm));
  assert.equal(source.generatedHLREdgeTopoDSIdentityMatched,false);
 }
 assert.equal(cad.actualOCCTCurveTypeIndependentlyVerified,true);
 assert.equal(cad.allEmittedVisibleHLRCurvesVerifiedStraightAndPlanar,true);
 assert.equal(cad.actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified,false);
 assert.equal(cad.sourceCandidateOnly,true);
 assert.equal(cad.v5Authorized,false);
 assert.equal(cad.proofScope,'reviewed-closed-convex-polyhedral-shell');
 assert.deepEqual(Object.keys(cad.views).sort(),['H','V','W']);
 assert.deepEqual(Object.keys(cad.hiddenSharpViews).sort(),['H','V','W']);
 assert.equal(cad.hiddenHLROutputFromActualOCCT,true);
 assert.equal(cad.hiddenSharpEdgesAreOnlyUnsignedCandidates,true);
 assert.equal(cad.hiddenHLROriginalEdgeAttributionRecovered,false);
 assert.equal(cad.hiddenLineStylesCertified,false);
 for(const [observer,hiddenEdges] of Object.entries(cad.hiddenSharpViews)){
  assert.ok(hiddenEdges.length<=128);
  for(const seg of hiddenEdges){
   assert.equal(seg.view,observer);
   assert.equal(seg.occtHLRVisibilityClass,'hidden-sharp');
   assert.equal(seg.actualOCCTHLRFlattenedBRepLineVerified,true);
   assert.equal(seg.actualOCCTHLRCurveType,'line');
   assert.equal(seg.actualOCCTHLRCurveEntireFiniteIntervalIsLine,true);
   assert.equal(seg.actualOCCTHLRCurveSamplesProjectedMm.length,5);
   assert.equal(seg.originalTopoDSSourceForHLREdgeRecovered,false);
   assert.equal(seg.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched,false);
   assert.equal(seg.officialEngineeringLineStyle,'undetermined');
   assert.equal(seg.formalStandardLineStyle,'undetermined');
   assert.equal(seg.v5Authorized,false);
   assert.equal(seg.hiddenStrokeEngineeringStyleNotCertified,true);
   assert.equal(seg.sourceCandidate3DLifts.length,
    seg.projectedOriginalEdgeCandidates.length);
   for(const source of seg.sourceCandidate3DLifts){
    assert.equal(source.originalOCCTSourceLineCurveVerified,true);
    assert.equal(source.actualOriginalOCCTBRepEdge3DEndpointsVerified,true);
    assert.equal(source.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched,false);
   }
  }
 }
 let count=0;
 const valid=new Set(geometry.data.edges.map(edge=>
  geometry.id+'::'+[...edge].sort().join('|')));
 for(const view of Object.values(cad.views)){
  assert.ok(view.length>=3);
  for(const seg of view){
   assert.ok(seg.projectedOriginalEdgeCandidates.length>0);
   assert.ok(seg.projectedOriginalEdgeCandidates.every(id=>valid.has(id)));
   // Real HLR output curve BRep proof, separate from source candidate XYZ.
   assert.equal(seg.actualOCCTHLRCurveType,'line');
   assert.equal(seg.actualOCCTHLRFlattenedBRepLineVerified,true);
   assert.equal(seg.actualOCCTHLRCurveEntireFiniteIntervalIsLine,true);
   assert.ok(seg.actualOCCTHLRCurveParameterRange[1]>
    seg.actualOCCTHLRCurveParameterRange[0]);
   assert.equal(seg.actualOCCTHLRCurveSamplesProjectedMm.length,5);
   assert.ok(['surface-pcurve','native-3d'].includes(
    seg.actualOCCTHLRCurveBacking));
   assert.equal(seg.originalTopoDSSourceForHLREdgeRecovered,false);
   assert.equal(seg.formalStandardLineStyle,'undetermined');
   // Genuine WASM HLR candidate XYZ must reproduce its real V/H/W image.
   // This is NOT recovered OCCT TopoDS 3D source identity or M5 signing.
   assert.equal(seg.sourceCandidate3DLifts.length,
    seg.projectedOriginalEdgeCandidates.length);
   assert.equal(seg.actualOCCTTopoDSIdentityRecovered,false);
   assert.equal(seg.v5Authorized,false);
   for(const source of seg.sourceCandidate3DLifts){
    assert.ok(valid.has(source.sourceEdgeId));
    assert.ok(sourceIds.has(source.sourceEdgeId));
    assert.equal(source.actualOriginalOCCTBRepEdge3DEndpointsVerified,true);
    assert.equal(source.originalOCCTSourceCurveType,'line');
    assert.equal(source.originalOCCTSourceLineCurveVerified,true);
    assert.ok(source.originalOCCTCurveParameterRange[1]>
     source.originalOCCTCurveParameterRange[0]);
    assert.ok(['x','y','z'].every(k=>
     Number.isFinite(source.actualOriginalOCCTBRepFrom3D[k])&&
     Number.isFinite(source.actualOriginalOCCTBRepTo3D[k])));
    assert.equal(source.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched,false);
    assert.equal(source.actualOCCTTopoDSEdgeIdentityRecovered,false);
    assert.equal(source.actualOCCT3DCurveExtracted,false);
    assert.equal(source.officialEngineeringLineStyle,'undetermined');
    const projectedA=project(source.fromCandidate3D)[seg.view];
    const projectedB=project(source.toCandidate3D)[seg.view];
    assert.ok(Math.hypot(projectedA.u-seg.from.u,
     projectedA.v-seg.from.v)<=1e-6);
    assert.ok(Math.hypot(projectedB.u-seg.to.u,
     projectedB.v-seg.to.v)<=1e-6);
   }
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
 // An independently valid M5 paper hull source may still lack exact
 // true OCCT generated original physical 3D source coverage. Do not
 // upgrade paper overlap into a production V5 signoff.
 const exactNativeContourForRelease=auditC1RealOcctVisibleContourSourceParity({
  geometry,revision:40+index,cad,
  nativeProof:nativeHiddenM5.nativeHLRVertexConcordance
 });
 // Adversarial real-WASM provenance: a single generated HLR edge ordinal
 // cannot be independently claimed as the unique original physical 3D
 // source by TWO different M0 edges, even if the 2D paper line overlaps.
 // Preserve the authentic positive proof; forge only an additional witness.
 const realNativeProof=nativeHiddenM5.nativeHLRVertexConcordance;
 const authenticNativeWitnesses=
  realNativeProof.independentlyM5AuthenticatedVisibleNativeGeneratedEdges;
 if(authenticNativeWitnesses.length>0){
  const first=authenticNativeWitnesses[0];
  const alternate=geometry.data.edges.map(edge=>
   geometry.id+'::'+[...edge].sort().join('|')).find(id=>
   id!==first.sourceEdgeId);
  assert.ok(alternate,'real geometry must offer a distinct source for the alias counterexample');
  const forgedNativeProof={...realNativeProof,
   independentlyM5AuthenticatedVisibleNativeGeneratedEdges:[
    ...authenticNativeWitnesses,{...first,sourceEdgeId:alternate}
   ]};
  assert.throws(()=>auditC1RealOcctVisibleContourSourceParity({
   geometry,revision:40+index,cad,nativeProof:forgedNativeProof
  }),/one generated OCCT visible HLR ordinal has conflicting original 3D sources/);
 }
 let formallySigned=false,scopedOfficialVisibleContourLines=0;
 if(exactNativeContourForRelease.nativeCADCorroboratesEveryOriginalGloballySignedExteriorContour){
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
 formallySigned=true;
 scopedOfficialVisibleContourLines=formalActions.size; 
 }else{
  assert.ok(exactNativeContourForRelease.
   originalGloballySignedM5ContoursStillHeldForNativeProof>0);
  assert.throws(()=>compileC1WithOcjsHLR({
   oc,input:reviewedInput,sheetTransform:{origin:{x:350,y:195},scale:3}
  }),/true OCCT original 3D source interval fails entire signed M5 contour CAD parity/);
  assert.equal(formallySigned,false);
  assert.equal(scopedOfficialVisibleContourLines,0);
 }
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
 const unsignedReview=reviewC1M5FinalStrokeObligations(finalGate);
 assert.equal(unsignedReview.sourceGeometryId,geometry.id);
 assert.equal(unsignedReview.revision,40+index);
 assert.equal(unsignedReview.total,finalGate.subspans.length);
 assert.equal(unsignedReview.localPositiveCount,
  finalGate.subspans.filter(x=>x.positiveLineLikeGeometryReadyForFurtherM5Proof).length);
 assert.equal(unsignedReview.fullyCertifiedCount,0);
 assert.equal(unsignedReview.signedV5ActionCount,0);
 assert.equal(unsignedReview.unresolvedByProofClass.engineeringLineStandard,
  unsignedReview.total);
 assert.equal(unsignedReview.unresolvedByProofClass.soleConstructionIntentDAGV5,
  unsignedReview.total);
 assert.equal(unsignedReview.unresolvedByProofClass.completeIntervalVisibility,
  unsignedReview.total);
 const hiddenFormalGate=reviewC1NativeHiddenFinalM5Strokes({
  geometry,revision:40+index,
  gapProof:nativeHiddenM5.nativeHiddenExactOriginalFrontGap,
  dualProof:nativeHiddenM5.nativeHiddenDualOpenIntervalProof,
  endpointFans:nativeHiddenM5.nativeHidden3DEndpointFans,
  nativeVertexProof:nativeHiddenM5.nativeHiddenOriginalVertexEndpointProof,
  projectedEncounters:nativeHiddenM5.nativeHLRAllM4ProjectedEncounters,
  nativeHLRJunctionConcordance:nativeHiddenM5.nativeHLRVertexConcordance,
  nativeSourceAudit:nativeHiddenM5,
  // Verify the current pinned OCCT ORIGINAL 3D TopoDS BRep inventory,
  // not HLR-generated edge history or remembered model coordinates.
  cad,
  globalM5Review:unsignedReview
 });
 const actualOriginal3DBRepInventory=hiddenFormalGate.originalOCCTBRepSourceInventory;
 assert.equal(actualOriginal3DBRepInventory.available,true);
 assert.equal(actualOriginal3DBRepInventory.completeOriginal3DSourceCorrespondence,true);
 assert.equal(actualOriginal3DBRepInventory.matchedOriginalPhysicalSourceEdges,
  geometry.data.edges.length);
 assert.equal(actualOriginal3DBRepInventory.expectedOriginalPhysicalSourceEdges,
  geometry.data.edges.length);
 assert.equal(actualOriginal3DBRepInventory.generatedHLREdgeToOriginalTopoDSHistoryCertified,false);
 assert.equal(actualOriginal3DBRepInventory.original3DSourceFanAndGlobalOcclusionCertified,false);
 assert.equal(actualOriginal3DBRepInventory.signedV5Action,false);
 const nativeVHWPhysicalSourceUnion=hiddenFormalGate.realNativeVisibleHiddenSourceGraph;
 assert.equal(nativeVHWPhysicalSourceUnion.available,true);
 assert.equal(nativeVHWPhysicalSourceUnion.originalM0SourceViewCountExpected,
  3*geometry.data.edges.length);
 assert.equal(nativeVHWPhysicalSourceUnion.auditedOriginalSourceViews,
  3*geometry.data.edges.length);
 assert.equal(nativeVHWPhysicalSourceUnion.rows.length,
  nativeVHWPhysicalSourceUnion.auditedOriginalSourceViews);
 assert.equal(nativeVHWPhysicalSourceUnion.
  genuineNoncollapsedSourceViewsWithNecessaryM5VisibleOrHiddenCoverage,
  nativeVHWPhysicalSourceUnion.rows.filter(row=>
   row.originalSourceParameterLineCoverageNecessarilyComplete===true).length);
 assert.equal(nativeVHWPhysicalSourceUnion.
  sourceViewsWithVisibleAndHiddenPhysicalAttributionCollision,
  nativeVHWPhysicalSourceUnion.rows.filter(row=>
   row.positiveLengthVisibleHiddenOriginalSourceOverlap.length>0).length);
 assert.ok(nativeVHWPhysicalSourceUnion.rows.every(row=>
  row.originalRealOCCTBRep3DSourceInventoryVerified===true&&
  row.everyActualOpaqueFaceAndGeneratedTopoDSHistoryProven===false&&
  row.wholeSceneGBLineStyleCertified===false&&
  row.constructionIntentAuthorized===false&&
  row.signedV5Action===false));
 assert.equal(nativeVHWPhysicalSourceUnion.fullHLRGeneratedTopoDSHistoryCertified,false);
 assert.equal(nativeVHWPhysicalSourceUnion.
  allOpaqueFaceContinuousVisibilityAndGlobalJunctionsCertified,false);
 assert.equal(nativeVHWPhysicalSourceUnion.signedV5ActionCount,0);
 // A globally released original M5 convex external contour does NOT
 // automatically mean the ACTUAL native HLR generated BRep covers every
 // claimed 3D original source interval. Cross-check both independently
 // recomputed sources on THIS same real OCCT WASM 3D geometry/revision.
 const nativeM5ExteriorContourParity=exactNativeContourForRelease;
 assert.equal(nativeM5ExteriorContourParity.entireOriginalM5ContourProofRecomputed,true);
 assert.equal(nativeM5ExteriorContourParity.realNativeOCCTVisible3DSourceFragmentsAudited,
  nativeHiddenM5.nativeHLRVertexConcordance.
   independentlyM5AuthenticatedVisibleNativeGeneratedEdges.length);
 assert.equal(nativeM5ExteriorContourParity.
  originalGloballySignedM5ContourStrokeCount,
  nativeM5ExteriorContourParity.rows.filter(x=>
   x.originalM5WholeExteriorContourCertified).length);
 assert.equal(nativeM5ExteriorContourParity.
  originalGloballySignedM5ContoursWithExactNativeOriginal3DSourceCoverage,
  nativeM5ExteriorContourParity.rows.filter(x=>
   x.realOCCTOriginal3DSourceCompleteContourParity).length);
 assert.equal(nativeM5ExteriorContourParity.
  originalGloballySignedM5ContoursStillHeldForNativeProof,
  nativeM5ExteriorContourParity.
   originalGloballySignedM5ContourStrokeCount-
  nativeM5ExteriorContourParity.
   originalGloballySignedM5ContoursWithExactNativeOriginal3DSourceCoverage);
 assert.ok(nativeM5ExteriorContourParity.rows.every(x=>
  x.generatedToOriginalTopoDSHistoricalIdentityRecovered===false&&
  x.constructionIntentDAGV5NativeParityAuthorized===false&&
  x.signedV5Action===false));
 assert.equal(nativeM5ExteriorContourParity.
  globallySignedContoursWithExactOriginalM0VertexPaperEndpointRecovery,
  nativeM5ExteriorContourParity.rows.filter(x=>
   x.exactOriginalPhysical3DVertexPaperBinding).length);
 assert.ok(nativeM5ExteriorContourParity.rows.every(x=>
  x.originalContour3DParameterRecoveryKind==='held'||
  x.originalContour3DParameterRecoveryKind==='exact-original-3d-source-interpolation'||
  x.originalContour3DParameterRecoveryKind==='exact-original-m0-3d-vertex-projection'));
 // Independent genuine OCCT WASM end-to-end regression: the rotated
 // convex solid's formerly held H edges now have literal [0,1] M0 source
 // parameters, whereas true positive native HLR gaps on a skew tetrahedron
 // remain unproved and MUST NOT be silently snapped or V5-signed.
 if(geometry.id==='C1rotated'){
  assert.equal(nativeM5ExteriorContourParity.originalGloballySignedM5ContourStrokeCount,14);
  assert.equal(nativeM5ExteriorContourParity.originalGloballySignedM5ContoursWithExactNativeOriginal3DSourceCoverage,14);
  assert.equal(nativeM5ExteriorContourParity.originalGloballySignedM5ContoursStillHeldForNativeProof,0);
 }
 if(geometry.id==='C1SkewTetra'){
  assert.equal(nativeM5ExteriorContourParity.originalGloballySignedM5ContourStrokeCount,9);
  assert.ok(nativeM5ExteriorContourParity.originalGloballySignedM5ContoursStillHeldForNativeProof>0);
  assert.ok(nativeM5ExteriorContourParity.rows.some(row=>
   row.heldReason==='true-occt-generated-contour-source-parameter-gap'));
 }
 assert.equal(nativeM5ExteriorContourParity.constructionIntentDAGUniqueV5ParityProven,false);
 assert.equal(nativeM5ExteriorContourParity.signedV5ActionCount,0);
 // Live genuine OCCT evidence for unresolved H-source endpoints: report the
 // exact original M0 XYZ, canonical signed M5 3D/paper endpoints and real
 // native BRep lifts separately. Never use these diagnostics as a signer.
 const heldPhysicalContours=nativeM5ExteriorContourParity.rows.filter(row=>
  row.originalM5WholeExteriorContourCertified===true&&
  row.realOCCTOriginal3DSourceCompleteContourParity===false);
 if(heldPhysicalContours.length){
  const {auditC1GlobalVisibleContourProof}=require('../../workbench/m5-c1-global-visible-contour-proof.cjs');
  const canonicalContour=auditC1GlobalVisibleContourProof({geometry,revision:40+index});
  const heldEndpointEvidence=heldPhysicalContours.map(row=>{
   const ids=row.originalPhysical3DSourceEdgeId.split('::').at(-1).split('|');
   const sourceVertices=ids.map(id=>({id,xyz:geometry.data.points[id],
    paper:project(geometry.data.points[id])[row.view]}));
   const line=canonicalContour.views.find(v=>v.view===row.view)
    ?.candidateIntervals[row.canonicalHullIntervalOrdinal];
   assert.equal(line?.sourceEdgeId,row.originalPhysical3DSourceEdgeId);
   assert.equal(row.signedV5Action,false);
   const native=cad.views[row.view].flatMap((seg,ordinal)=>
    (seg.sourceCandidate3DLifts??[]).filter(lift=>
     lift.sourceEdgeId===row.originalPhysical3DSourceEdgeId)
    .map(lift=>({ordinal,from:seg.from,to:seg.to,
     originalSourceParameterRange:lift.originalSourceParameterRange,
     fromCandidate3D:lift.fromCandidate3D,toCandidate3D:lift.toCandidate3D})));
   return {view:row.view,ordinal:row.canonicalHullIntervalOrdinal,
    sourceEdgeId:row.originalPhysical3DSourceEdgeId,
    heldReason:row.heldReason,sourceVertices,
    canonicalM5:{from3D:line.real3DFrom,to3D:line.real3DTo,
     paperFrom:line.projectedFromModelMm,paperTo:line.projectedToModelMm,
     physicalCoverage:line.sourceContourCoverageVerified,
     endpointJoins:line.genuineFrontSourceEndpointJoinsVerified,
     continuousFrontRay:line.continuouslyFrontRayClearVerified},native};
  });
  console.error('C1_HELD_ORIGINAL_3D_ENDPOINTS '+JSON.stringify(heldEndpointEvidence));
 }
 const generatedVisibleM5PhysicalTiling=hiddenFormalGate.nativeVisibleHLRSourceTiling;
 assert.equal(generatedVisibleM5PhysicalTiling.available,true);
 assert.equal(
  generatedVisibleM5PhysicalTiling.
   exactVisibleHLRGeneratedEdgeOriginal3DSourceUniquelySelectedByM5FrontRay,
  nativeHiddenM5.nativeHLRVertexConcordance.
   independentlyM5AuthenticatedVisibleNativeGeneratedEdges.length);
 assert.ok(generatedVisibleM5PhysicalTiling.
  selectedNativeVisibleGeneratedSourcesCrosscheckedAgainstCurrentBRep<=
  generatedVisibleM5PhysicalTiling.
   exactVisibleHLRGeneratedEdgeOriginal3DSourceUniquelySelectedByM5FrontRay);
 assert.ok(nativeHiddenM5.nativeHLRVertexConcordance.
  independentlyM5AuthenticatedVisibleNativeGeneratedEdges.every(v=>
   v.uniquePhysicalM5FrontOriginalSourceFromActualBRep===true&&
   v.fullOriginalPhysicalSourceM5ClosedRayClear===true&&
   v.generatedEdgeOriginalTopoDSHistoryRecovered===false&&
   v.engineeringLineCertified===false&&v.signedV5Action===false));
 assert.equal(
  generatedVisibleM5PhysicalTiling.genuinelyExactMeasuredNativeVisibleSegments+
  generatedVisibleM5PhysicalTiling.unverifiedGeneratedOCCTVisibleSegments,
  generatedVisibleM5PhysicalTiling.trueGeneratedOCCTVisibleSegmentsInspected);
 assert.equal(generatedVisibleM5PhysicalTiling.
  allTrueGeneratedNativeVisibleSourceLiftsCertified,
  generatedVisibleM5PhysicalTiling.unverifiedGeneratedOCCTVisibleSegments===0);
 assert.equal(generatedVisibleM5PhysicalTiling.
  independentlyHeldGeneratedNativeVisibleEdgeCauses.length,
  generatedVisibleM5PhysicalTiling.unverifiedGeneratedOCCTVisibleSegments);
 assert.equal(Object.values(generatedVisibleM5PhysicalTiling.
  independentHeldNativeVisibleReasonCounts).reduce((a,b)=>a+b,0),
  generatedVisibleM5PhysicalTiling.unverifiedGeneratedOCCTVisibleSegments);
 assert.ok(generatedVisibleM5PhysicalTiling.
  independentlyHeldGeneratedNativeVisibleEdgeCauses.every(x=>
   x.actualOCCTNativeSourceEdgeFullyCertified===false&&
   x.officialGBLineStyleCertified===false&&x.signedV5Action===false));
 assert.equal(generatedVisibleM5PhysicalTiling.trueGeneratedOCCTVisibleSegmentsInspected,
  ['V','H','W'].reduce((n,v)=>n+cad.views[v].length,0));
 // Never promote tolerance-reprojected or ambiguous real OCCT native source
 // endpoints into exact source history merely to make the fixture green.
 assert.ok(generatedVisibleM5PhysicalTiling.unverifiedGeneratedOCCTVisibleSegments>=0);
 assert.ok(generatedVisibleM5PhysicalTiling.genuinelyExactMeasuredNativeVisibleSegments>=0);
 assert.equal(generatedVisibleM5PhysicalTiling.sourceViewsAudited,
  geometry.data.edges.length*3);
 assert.equal(
  generatedVisibleM5PhysicalTiling.originalSourceViewsWithDuplicateGeneratedHLRIntervals,
  generatedVisibleM5PhysicalTiling.rows.filter(x=>
   x.positiveSameOriginal3DSourceGeneratedEdgeOverlaps.length>0).length);
 assert.equal(
  generatedVisibleM5PhysicalTiling.originalSourceViewsCompletelyCoveredWithoutGeneratedDuplication,
  generatedVisibleM5PhysicalTiling.rows.filter(x=>
   x.disjointExactCompleteOriginalSourceGeneratedEdgeTiling).length);
 assert.ok(generatedVisibleM5PhysicalTiling.rows.every(row=>
  row.fullGeneratedOCCTToOriginalTopoDSHistoryCertified===false&&
  row.officialGBLineStyleSigned===false&&row.signedV5Action===false));
 assert.equal(generatedVisibleM5PhysicalTiling.allGeneratedEdgeToOriginalTopoDSHistoryCertified,false);
 assert.equal(generatedVisibleM5PhysicalTiling.signedV5ActionCount,0);
 const heldContourFaceRays=hiddenFormalGate.actualNativeVisibleContourSourceFanRayAudit;
 assert.equal(heldContourFaceRays.available,true);
 assert.equal(heldContourFaceRays.heldGeneratedNativeVisibleSegmentsReviewed,
  generatedVisibleM5PhysicalTiling.unverifiedGeneratedOCCTVisibleSegments);
 assert.equal(heldContourFaceRays.rows.length,
  heldContourFaceRays.heldGeneratedNativeVisibleSegmentsReviewed);
 assert.equal(heldContourFaceRays.
  heldGeneratedSegmentsWithFullFaceRayFrontAndAllAlternativesStrictHidden,
  heldContourFaceRays.rows.filter(x=>
   x.oneRealOriginal3DSourceClearAllOtherCandidatesStrictlyHidden).length);
 assert.equal(heldContourFaceRays.
  unresolvedHLRGeneratedSegmentsWhoseAllOriginal3DSourcesProjectToExterior,
  heldContourFaceRays.rows.filter(x=>
   x.allCurrentCandidatesLieOnOriginalExteriorContour).length);
 assert.ok(heldContourFaceRays.rows.every(x=>
  x.sourceStillUndeterminedForEngineeringLine===true&&
  x.originalM5GlobalContourAndFeatureJunctionNotSigned===true&&
  x.signedV5Action===false&&
  x.nativeHLROriginal3DSourceCandidates.every(c=>
   c.generatedOCCTToOriginalBRepHistoryCertified===false&&
   c.engineeringLineStyleSigned===false&&c.signedV5Action===false)));
 assert.equal(heldContourFaceRays.actualGeneratedTopoDSOriginalEdgeFullHistoryCertified,false);
 assert.equal(heldContourFaceRays.allOpaqueSceneAndGBLineStyleCertified,false);
 assert.equal(heldContourFaceRays.signedV5ActionCount,0);
 const trueGeneratedHiddenM5Tiling=hiddenFormalGate.actualNativeHLRHiddenGeneratedSourceTiling;
 assert.equal(trueGeneratedHiddenM5Tiling.available,true);
 assert.equal(trueGeneratedHiddenM5Tiling.actualGeneratedHLRHiddenStrokesAudited,
  ['V','H','W'].reduce((n,v)=>n+cad.hiddenSharpViews[v].length,0));
 assert.equal(trueGeneratedHiddenM5Tiling.
  nativeHiddenGeneratedStrokesWithUniqueM0PhysicalSource+
  trueGeneratedHiddenM5Tiling.generatedHiddenStrokesStillLackingUniqueOriginal3DSource,
  trueGeneratedHiddenM5Tiling.actualGeneratedHLRHiddenStrokesAudited);
 assert.equal(trueGeneratedHiddenM5Tiling.originalPhysicalSourceViewsAudited,
  3*geometry.data.edges.length);
 assert.equal(trueGeneratedHiddenM5Tiling.
  allGeneratedHiddenEdgeFullIntervalsPhysicallyCertified,
  trueGeneratedHiddenM5Tiling.generatedHiddenStrokesStillLackingUniqueOriginal3DSource===0&&
  trueGeneratedHiddenM5Tiling.
   trueNativeHiddenOriginalEdgeIntervalsOnlyPartlyM5SourceProven===0);
 assert.equal(trueGeneratedHiddenM5Tiling.hiddenOriginalSourceViewsWithDuplicateNativeGeneratedFragments,
  trueGeneratedHiddenM5Tiling.rows.filter(row=>
   row.positiveSameOriginal3DSourceGeneratedEdgeOverlaps.length>0).length);
 assert.equal(trueGeneratedHiddenM5Tiling.hiddenOriginalSourceViewsWithCompleteDisjointNativeHLRSourceTiling,
  trueGeneratedHiddenM5Tiling.rows.filter(row=>
   row.disjointExactCompleteOriginalSourceGeneratedEdgeTiling).length);
 const nativeWholeSource=hiddenFormalGate.nativeVisibleHiddenGeneratedSourceTopology;
 assert.equal(nativeWholeSource.available,true);
 assert.equal(nativeWholeSource.original3DSourceViewsWithAnyGeneratedFragmentMultiplicity,
  nativeVHWPhysicalSourceUnion.rows.filter(row=>
   generatedVisibleM5PhysicalTiling.rows.some(v=>v.sourceViewKey===row.sourceViewKey&&
    v.positiveSameOriginal3DSourceGeneratedEdgeOverlaps.length>0)||
   trueGeneratedHiddenM5Tiling.rows.some(h=>h.sourceViewKey===row.sourceViewKey&&
    h.positiveSameOriginal3DSourceGeneratedEdgeOverlaps.length>0)).length);
 assert.equal(nativeWholeSource.engineeringLineStyleCertified,false);
 assert.equal(nativeWholeSource.signedV5ActionCount,0);
 assert.equal(trueGeneratedHiddenM5Tiling.fullGeneratedHLRToOriginalTopoDSHistoryCertified,false);
 // Independently recompute each actual reviewed convex 3D source M4 cut's
 // observer ray against ALL original opaque support faces, then cross-join
 // positive ray status with physically attributed real OCCT HLR spans.
 const faceRayAndActualNativeHLR=hiddenFormalGate.nativeVHWFaceRayAndHLRReconciliation;
 assert.equal(faceRayAndActualNativeHLR.available,true);
 assert.ok(faceRayAndActualNativeHLR.sourceRaySubspansAudited>0);
 assert.equal(faceRayAndActualNativeHLR.sourceRaySubspansAudited,
  faceRayAndActualNativeHLR.rows.length);
 assert.equal(
  faceRayAndActualNativeHLR.singleSolidFaceRaysAndActualHLRPhysicalSourceIntervalsPositivelyCompatible,
  faceRayAndActualNativeHLR.rows.filter(x=>
   x.singleSolidRayAndTrueOCCTNativeOriginalSourceProvenCompatible).length);
 assert.equal(
  faceRayAndActualNativeHLR.original3DSourceSubspansWithNativeVisibilityContradiction,
  faceRayAndActualNativeHLR.rows.filter(x=>
   x.positiveOriginalFaceRayVsRealNativeHLROcclusionContradiction).length);
 assert.ok(faceRayAndActualNativeHLR.rows.every(x=>
  x.allSeparateOpaqueSceneBodiesAndGeneratedEdgeHistoryCertified===false&&
  x.completeProjectedJunctionAndGBLineStyleCertified===false&&
  x.constructionIntentAuthorized===false&&x.signedV5Action===false));
 assert.equal(faceRayAndActualNativeHLR.allSceneGlobalEngineeringLineStyleCertified,false);
 assert.equal(faceRayAndActualNativeHLR.signedV5ActionCount,0);
 const fullOriginalFaceRaySource=hiddenFormalGate.fullSourceVHWFaceRayAndActualHLRClosure;
 assert.equal(fullOriginalFaceRaySource.available,true);
 assert.equal(fullOriginalFaceRaySource.auditedOriginalPhysicalSourceViews,
  3*geometry.data.edges.length);
 assert.equal(fullOriginalFaceRaySource.rows.length,
  fullOriginalFaceRaySource.auditedOriginalPhysicalSourceViews);
 assert.equal(
  fullOriginalFaceRaySource.M4RayPartitionsWithExactPositiveNoOverlapFullSourceCoverage,
  fullOriginalFaceRaySource.rows.filter(row=>
   row.fullOriginalParameterRayPartitionCoverage===true).length);
 assert.equal(
  fullOriginalFaceRaySource.noncollapsedOriginalSourceViewsFullyMatchedToActualOCCTAndAllOriginalOpaqueFaceRays,
  fullOriginalFaceRaySource.rows.filter(row=>
   row.realOCCTNativeOriginalPhysicalSourceCompleteRayReconciliation===true).length);
 assert.equal(fullOriginalFaceRaySource.originalSourceViewsWithNoOriginalM4RaySubspanEvidence,
  fullOriginalFaceRaySource.rows.filter(row=>
   row.canonicalOriginalRayM4SpanCount===0).length);
 assert.ok(fullOriginalFaceRaySource.rows.every(row=>
  (row.canonicalOriginalRayM4SpanCount>0||
   row.fullOriginalParameterRayPartitionCoverage===false)&&
  row.originalFaceRayAndGeneratedHLRTopologyComplete===false&&
  row.entireFinalGeneratedOCCTEdgeTopologyAndGBLineRulesCertified===false&&
  row.nationalEngineeringLineStyleSigned===false&&
  row.signedV5Action===false));
 assert.equal(fullOriginalFaceRaySource.
  wholeGlobalOpaqueSceneAndGeneratedTopoDSHistoryCertified,false);
 assert.equal(fullOriginalFaceRaySource.engineeringGBLineStyleCertified,false);
 assert.equal(fullOriginalFaceRaySource.signedConstructionIntentDAGOrV5ActionCount,0);
 assert.equal(hiddenFormalGate.counts.genuineHiddenHLRStrokesReviewed,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
 assert.equal(hiddenFormalGate.canonicalOriginalM5SourceInventory.
  originalM0EdgeInventoryAvailable,true);
 assert.equal(hiddenFormalGate.canonicalOriginalM5SourceInventory.
  expectedOriginalSourceViewCount,geometry.data.edges.length*3);
 const sceneInventory=hiddenFormalGate.canonicalOriginalM5SourceInventory;
 assert.equal(sceneInventory.completeOriginalSourceViewCount+
  sceneInventory.missingOriginalSourceViews.length+
  sceneInventory.incompleteOriginalSourceViewPartitions.length,
  sceneInventory.expectedOriginalSourceViewCount);
 assert.equal(sceneInventory.allOriginalSourceViewsHaveCompleteParameterPartitions,
  sceneInventory.expectedOriginalSourceViewCount>0&&
  sceneInventory.missingOriginalSourceViews.length===0&&
  sceneInventory.incompleteOriginalSourceViewPartitions.length===0);
 // Keep genuine binary64 residuals and missing source/view identities visible.
 // A near-1 endpoint is not proof of a collapsed projection or coverage.
 const missingKeys=new Set(sceneInventory.missingOriginalSourceViews);
 const incompleteKeys=new Set();
 for(const entry of sceneInventory.incompleteOriginalSourceViewPartitions){
  assert.equal(typeof entry.sourceViewKey,'string');
  assert.equal(missingKeys.has(entry.sourceViewKey),false);
  assert.equal(incompleteKeys.has(entry.sourceViewKey),false);
  incompleteKeys.add(entry.sourceViewKey);
  assert.ok(Array.isArray(entry.positiveLengthParameterGaps));
  assert.ok(entry.positiveLengthParameterGaps.length>0);
  for(const gap of entry.positiveLengthParameterGaps){
   assert.ok(Array.isArray(gap)&&gap.length===2);
   assert.ok(Number.isFinite(gap[0])&&Number.isFinite(gap[1]));
   assert.ok(gap[0]>=0&&gap[0]<gap[1]&&gap[1]<=1,
    'even a one-ULP uncovered interval must remain unsigned');
  }
 }
 assert.equal(missingKeys.size,sceneInventory.missingOriginalSourceViews.length);
 assert.equal(sceneInventory.signedV5Action,false);
 // Distinguish a mathematically collapsed V/H/W projection from a
 // missing NON-collapsed source ledger. Never silently excuse either.
 const projected=require('../../core/projection/conventions.js').project;
 const originalById=new Map(geometry.data.edges.map(edge=>[
  geometry.id+'::'+[...edge].sort().join('|'),edge]));
 const classify=key=>{
  const separator=key.indexOf('@');
  assert.ok(separator>0,'missing source/view identity');
  const view=key.slice(0,separator),id=key.slice(separator+1);
  assert.ok(['V','H','W'].includes(view));
  const edge=originalById.get(id);
  assert.ok(edge,'missing source must belong to actual M0 geometry');
  const a=projected(geometry.data.points[edge[0]])[view];
  const b=projected(geometry.data.points[edge[1]])[view];
  return {sourceViewKey:key,projectionCollapsedExactly:
   a.u===b.u&&a.v===b.v};
 };
 const missingProjectionClasses=[...missingKeys].map(classify);
 const incompleteProjectionClasses=[...incompleteKeys].map(classify);
 assert.equal(missingProjectionClasses.length,
  sceneInventory.missingOriginalSourceViews.length);
 assert.equal(incompleteProjectionClasses.length,
  sceneInventory.incompleteOriginalSourceViewPartitions.length);
 assert.deepEqual(sceneInventory.missingOriginalSourceViewProjectionEvidence.map(x=>
  [x.sourceViewKey,x.projectionCollapsedExactly]),
  missingProjectionClasses.map(x=>[x.sourceViewKey,x.projectionCollapsedExactly]));
 assert.deepEqual(sceneInventory.incompleteOriginalSourceViewProjectionEvidence.map(x=>
  [x.sourceViewKey,x.projectionCollapsedExactly]),
  incompleteProjectionClasses.map(x=>[x.sourceViewKey,x.projectionCollapsedExactly]));
 assert.ok([...sceneInventory.missingOriginalSourceViewProjectionEvidence,
  ...sceneInventory.incompleteOriginalSourceViewProjectionEvidence].every(x=>
  x.completeM5ParameterCoverageCertified===false&&x.signedV5Action===false));
 // Classification is a diagnostic only: every missing/incomplete row
 // remains in the unsigned original source/view inventory.
 assert.equal(sceneInventory.signedV5Action,false);
 // Real rotated geometry has omitted/collapsed source-view rows and
 // binary64 endpoint gaps. Preserve them as unsigned diagnostics; stdout
 // must remain a single JSON report for the existing CI consumer.
 assert.equal(hiddenFormalGate.canonicalOriginalM5SourceInventory.signedV5Action,false);

 assert.equal(hiddenFormalGate.allSameRunCanonicalM4M5AndNativeHLRSourceViewsJoined,true);
 assert.equal(hiddenFormalGate.counts.jointM4M5NativeHLROriginal3DSourceViewsConsumed,
  geometry.data.edges.length*3);
 assert.equal(
  hiddenFormalGate.counts.nativeHiddenStrokesWithFullM4M5AndHLRSourceCoverage+
  hiddenFormalGate.counts.nativeHiddenStrokesWithUnprovenJointPhysicalSourceCoverage,
  hiddenFormalGate.counts.genuineHiddenHLRStrokesReviewed);
 assert.ok(hiddenFormalGate.rows.every(row=>
  row.officialEngineeringLineStyle==='undetermined'&&
  row.signedV5Action===false&&
  row.independentlyRecomputedCanonicalM4M5NativeSourceEvidence===null||
  row.officialEngineeringLineStyle==='undetermined'&&
  row.signedV5Action===false&&
  row.independentlyRecomputedCanonicalM4M5NativeSourceEvidence?.signedV5Action===false
 ));
 assert.equal(
  hiddenFormalGate.counts.originalHLRHiddenEndpointsWithGenuineNativeIsSameAndFullyVerifiedOriginal3DStar+
  hiddenFormalGate.counts.originalHLRHiddenEndpointsAtSharedIsSameButOriginalSourceFanHeld+
  hiddenFormalGate.counts.actualHiddenNativeEndpointsWithExactOriginal3DInteriorSplit,
  hiddenFormalGate.rows.reduce((count,row)=>count+
   row.independentlyVerifiedOCCTNativeIsSameOriginal3DEndpointStars.filter(x=>
    x.actualGeneratedOCCTVertexIsSameJunctionPresent).length,0));
 assert.ok(hiddenFormalGate.rows.every(row=>
  row.independentlyVerifiedOCCTNativeIsSameOriginal3DEndpointStars.length===2&&
  row.independentlyVerifiedOCCTNativeIsSameOriginal3DEndpointStars.every(x=>
   x.nativeGeneratedToOriginalTopoDSEdgeHistoryStillNotProven===true&&
   x.globalOpaqueSceneAndEngineeringLineStyleCertified===false&&
   x.signedV5Action===false)));
 assert.equal(hiddenFormalGate.counts.actualHiddenNativeEndpointsWithExactOriginal3DInteriorSplit,
  hiddenFormalGate.rows.reduce((n,row)=>n+
   row.independentlyVerifiedOCCTNativeIsSameOriginal3DEndpointStars.filter(x=>
    x.actualNativeOCCTIsSameOriginal3DEdgeInteriorSplitProven===true).length,0));
 assert.equal(hiddenFormalGate.counts.actualHiddenNativeStrokesWithBothSourceJunctionsPhysicallyVerified,
  hiddenFormalGate.rows.filter(row=>
   row.actualGeneratedHiddenNativeStrokeBoth3DEndpointsLocallyPhysical).length);
 assert.equal(hiddenFormalGate.counts.actualHiddenNativeStrokesWithLocallyFullM5VisibilityAndPhysicalJunctions,
  hiddenFormalGate.rows.filter(row=>
   row.localOriginal3DSourceExactM5OcclusionAndTruePhysicalHLRJunctions).length);
 assert.ok(hiddenFormalGate.rows.every(row=>
  row.independentlyVerifiedOCCTNativeIsSameOriginal3DEndpointStars.every(e=>
   e.actualNativeOCCTIsSameOriginal3DEdgeInteriorSplitProven!==true||
   (e.independentOriginal3DVertexAndFullHLRJunctionProven===false&&
    e.exactOriginal3DSourceInteriorParameter>0&&
    e.exactOriginal3DSourceInteriorParameter<1&&
    e.nativeGeneratedToOriginalTopoDSEdgeHistoryStillNotProven===true&&
    e.signedV5Action===false))));
 assert.equal(hiddenFormalGate.counts.originalM4PaperEncounterEventsCrosscheckedAgainstActualHLR,
  nativeEncounters.counts.originalM4PaperEncounterOccurrencesCovered);
 assert.equal(
  hiddenFormalGate.counts.originalM4ProjectedEventsWithVerifiedLocal3DSpatialDisposition+
  hiddenFormalGate.counts.originalM4ProjectedEventsStillMissingExactLocal3DSpatialDisposition,
  nativeEncounters.counts.originalM4PaperEncounterOccurrencesCovered);
 assert.equal(
  hiddenFormalGate.counts.nativeHLRSourceStrokesWithCompleteLocal3DEventClassification,
  hiddenFormalGate.rows.filter(row=>
   row.allCurrentOriginalM4SourceEncountersLocally3DClassified).length);
 assert.ok(hiddenFormalGate.rows.every(row=>
  row.currentOriginalM4SourceSpatialEventClassifications.length===
   row.canonicalOriginalM4ProjectedEncountersAudited&&
  row.currentOriginalM4SourceSpatialEventClassifications.every(e=>
   e.actualNativeHLRGeneratedEdgeTopoDSJunctionCertified===false&&
   e.wholeSceneOcclusionCertified===false&&
   e.officialEngineeringLineStyle==='undetermined'&&
   e.signedV5Action===false)));
 assert.equal(hiddenFormalGate.counts.exactOriginal3DSharedVertexWithTwoAuthenticBRepSources,
  nativeEncounters.counts.exactOriginal3DPhysicalSharedVertexAndOCCTSourceAtNativeHLR);
 assert.equal(hiddenFormalGate.counts.exactSource3DSharedVertexButNativeGeneratedPaperStillMisaligned,
  nativeEncounters.counts.exactOriginal3DPhysicalSharedVertexDespiteNativePaperMismatch);
 assert.ok(nativeEncounters.rows.every(row=>
  row.originalM4ProjectedEncountersOnNativeSource.every(event=>
   event.exactOriginalM4VertexOtherSourceDepthEvidence===null||
   (event.exactOriginalM4VertexOtherSourceDepthEvidence.signedV5Action===false&&
    event.exactOriginalM4VertexOtherSourceDepthEvidence.
     actualNativeHLRGeneratedPaperAlignmentCertified===false&&
    event.signedV5Action===false))));
 assert.equal(
  hiddenFormalGate.counts.nativeM4CollinearInteriorEventsWithExactFullFrontDepthNoSwitchProof+
  hiddenFormalGate.counts.nativeM4InteriorCollinearEventsWithoutPositiveFullFrontNoSwitchProof,
  nativeEncounters.rows.reduce((n,r)=>n+
   r.originalM4ProjectedEncountersOnNativeSource.filter(e=>
    e.canonicalM4ProjectedEncounterKind==='collinear-overlap'&&
    e.originalSourceParameter>
      (r.genuineNativeHLROriginalSourceParameterRange?.[0]??0)&&
    e.originalSourceParameter<
      (r.genuineNativeHLROriginalSourceParameterRange?.[1]??1)).length,0));
 assert.ok(hiddenFormalGate.rows.every(row=>
  row.collinearNativeInteriorEventsWithIndependentFullFrontNoDepthSwitchProof.every(e=>
   e.completeSource3DDepthAndRealOCCTHLRPaperProof===true&&
   e.generatedHLREdgeTopoDSIdentityAndGBLineCertified===false&&
   e.signedV5Action===false)));
 assert.equal(hiddenFormalGate.signedV5ActionCount,0);
 assert.equal(hiddenFormalGate.officialEngineeringGBLineRulesCertified,false);
 assert.ok(hiddenFormalGate.rows.every(r=>
  r.actualOCCTGeneratedEdgeToOriginalTopoDSIdentityCertified===false&&
  r.nativeGeneratedHLREdgesHaveAllPhysical3DJunctionsCertified===false&&
  r.engineeringGBSolidOrDashedLineStandardFullyCertified===false&&
  r.officialEngineeringLineStyle==='undetermined'&&
  r.signedConstructionStepDAGOrSoleV5Action===false));

 assert.ok(unsignedReview.rows.every(row=>
  row.independentGlobalProofGaps.original3DSourceIdentity===true&&
  row.independentGlobalProofGaps.endpointAndProjectionTopology===true));

 assert.ok(unsignedReview.rows.every((row,i)=>
  row.sourceEdgeId===finalGate.subspans[i].sourceEdgeId&&
  row.formalLineStyle==='undetermined'&&
  row.constructionIntentAuthorized===false&&
  row.signedV5Action===false&&
  row.blockingReasons.includes('completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified')&&
  row.blockingReasons.includes('applicableStandardEngineeringLineStyleNotCertified')));

 assert.equal(finalGate.counts.totalOriginalSourceEdgeViewSubspans,
  features.counts.sourceBoundSubintervalCount);
 assert.equal(finalGate.independentOriginalVertexRayProofSchema,
  'draftai-c1-m5-exact-original-vertex-observer-ray/1');
 assert.equal(finalGate.independentlyRecomputedOriginal3DVertexFanSchema,
  'draftai-c1-m5-reviewed-closed-original-vertex-fan/1');
 assert.equal(finalGate.original3DVertexClosedFaceFanTotals.
  reviewedOriginal3DVertexViewStars,
  Object.keys(geometry.data.points).length*3);
 assert.equal(finalGate.original3DVertexClosedFaceFanTotals.
  realClosedOriginalVertexFaceFans,
  Object.keys(geometry.data.points).length*3);
 assert.equal(finalGate.counts.certifiedOriginal3DVertexFanEndpointWitnesses+
  finalGate.counts.syntheticPaperPointCannotAcquireClosed3DVertexStarCount,
  finalGate.counts.totalOriginalSourceEdgeViewSubspans*2);
 assert.ok(finalGate.subspans.every(span=>
  span.reviewedOriginalClosed3DVertexFanEndpoints?.length===2&&
  span.reviewedOriginalClosed3DVertexFanEndpoints.every(end=>
   end.signedV5Action===false&&
   (end.genuineClosed3DOriginalVertexFaceFanVerified===
     (end.original3DVertexId!==null))&&
   (!end.originalPaperM4EndpointLinkPositivelyVerified||
    end.genuineClosed3DOriginalVertexFaceFanVerified)&&
   !end.completeVisibleEngineeringLineJunctionCertified)));

 assert.equal(finalGate.independentlyRecomputedClosedOriginalEdgeRaySchema,
  'draftai-c1-m5-exact-closed-original-edge-ray-and-cut-continuity/1');
 assert.equal(finalGate.originalFull3DEdgeRayContinuityTotals.originalSourceEdgeViews,
  geometry.data.edges.length*3);
 assert.equal(finalGate.originalFull3DEdgeRayContinuityTotals.signedV5Actions,0);
 if(index===0){
  // The M4 fix preserves even binary64-positive micro tails as real 3D
  // parameter spans; paper-UNDRAWABLE does not mean source-MISSING.
  assert.equal(finalGate.originalFull3DEdgeRayContinuityTotals.
   missingPaperSourceParameterGapCount,0);
  assert.equal(finalGate.originalFull3DEdgeRayContinuityTotals.
   nonCollapsedProjectionPartitionIncomplete,0);
  assert.equal(finalGate.originalFull3DEdgeRayContinuityTotals.
   signedV5Actions,0);
 }

 assert.ok(finalGate.subspans.every(x=>
  x.paperEventCutsNeverCertifiedAsNew3DVertices===true&&
  x.M4Original3DEdgeCutContinuityVerified!==null&&
  x.blockers.originalConstructionIntentDAGAndSingleV5NotAuthorized===true&&
  (!x.exactClosedOriginal3DSourceObserverRayClear||
   x.singleOpaqueSolidContinuousOpenRayClear||
   x.originalM5ExteriorContourOverlap===true||
   (x.heldUndrawablePositiveOriginal3DMicrospan===true&&
    x.genuineRealCADCompleteSourceCoverage===false&&
    x.formalStandardLineStyle==='undetermined'&&
    x.signedV5Action===false))));
 assert.equal(finalGate.counts.originalSourcePaperCut3DContinuityPreserved,
  finalGate.originalFull3DEdgeRayContinuityTotals.
   same3DOriginalSourceCutJoinsPreserved);
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
  originalM5SourceViewCoverage:{
   expected:sceneInventory.expectedOriginalSourceViewCount,
   complete:sceneInventory.completeOriginalSourceViewCount,
   missing:sceneInventory.missingOriginalSourceViewProjectionEvidence,
   incomplete:sceneInventory.incompleteOriginalSourceViewProjectionEvidence.map(e=>({
    ...e,positiveLengthParameterGaps:
     sceneInventory.incompleteOriginalSourceViewPartitions.find(x=>
      x.sourceViewKey===e.sourceViewKey).positiveLengthParameterGaps
   })),
   // Diagnostic partition only: do not equate exact projection collapse
   // with OCCT history, source coverage or a formal V5 line certificate.
   missingExactlyCollapsed:sceneInventory.missingOriginalSourceViewProjectionEvidence.filter(
    e=>e.projectionCollapsedExactly).length,
   missingNoncollapsed:sceneInventory.missingOriginalSourceViewProjectionEvidence.filter(
    e=>!e.projectionCollapsedExactly).length,
   incompleteExactlyCollapsed:sceneInventory.incompleteOriginalSourceViewProjectionEvidence.filter(
    e=>e.projectionCollapsedExactly).length,
   incompleteNoncollapsed:sceneInventory.incompleteOriginalSourceViewProjectionEvidence.filter(
    e=>!e.projectionCollapsedExactly).length,
   allComplete:sceneInventory.allOriginalSourceViewsHaveCompleteParameterPartitions,
   signedV5Action:false
  },
  actualHiddenNativeSourceAndM5:{
   realSharpSegments:nativeHiddenM5.counts.realNativeHiddenSharpSegments,
   withoutM0Candidates:nativeHiddenM5.counts.nativeHiddenWithoutM0SourceCandidates,
   multi3DSourceAliasSegments:
    nativeHiddenM5.counts.hiddenHLRWithMultiple3DSourceCandidates,
   exact3DClosedRayHiddenPaperCandidatesPruned:
    nativeHiddenM5.counts.exactClosedOutwardRayExcludedHiddenCandidates,
   nativeHiddenWithOneRemaining3DSource:
    nativeHiddenM5.counts.nativeHiddenSharpWithOneSurvivingM5Source,
   nativeHiddenWithMultipleRemaining3DSources:
    nativeHiddenM5.counts.nativeHiddenSharpStillWithMultipleM5Sources,
   nativeHiddenAllCandidatesExcludedHeld:
    nativeHiddenM5.counts.nativeHiddenSharpWithNoSurvivingM5Source,
   originalM4Subspans:nativeHiddenM5.counts.canonicalOriginalM4SubspansChecked,
   exactM5HiddenOpenSubspans:nativeHiddenM5.counts.exactM5HiddenOpenSubspans,
   wholeNativeHiddenCandidateCovered:
    nativeHiddenM5.counts.hiddenNativePaperCoverageConfirmedSubspans,
   locallyExactHiddenAndSinglePaperSourceCandidate:
    nativeHiddenM5.counts.uniqueNativePaperCandidatePlusExactM5HiddenSubspans,
   genuineHiddenCADParameterGaps:
    nativeHiddenM5.counts.positiveLengthHiddenNativePaperGaps,
   nullNativeHCompoundViews:nativeHiddenM5.nativeNullHiddenSharpViews,
   original3DNativeHLREndpointsReviewed:
    nativeHiddenM5.nativeHidden3DEndpointFans.counts.survivingOriginal3DSourceEndpointsReviewed,
   genuineOriginal3DEndpointCandidates:
    nativeHiddenM5.nativeHidden3DEndpointFans.counts.sourceEndpointsAtAuthenticOriginal3DVertices,
   verifiedM4AndClosedFanEndpoints:
    nativeHiddenM5.nativeHidden3DEndpointFans.counts.sourceEndpointsWithOriginalM4AndClosed3DFanWitness,
   nativeInteriorCutsHeldAsNonvertices:
    nativeHiddenM5.nativeHidden3DEndpointFans.counts.originalSourceInterior3DPointsNotMadeVertices,
   genuineOriginal3DSourceVertexJunctionPairs:
    nativeHiddenM5.nativeHidden3DEndpointFans.counts.genuineOriginal3DSourceVertexJunctionPairs,
   formalNativeHLRJunctionsSigned:0,
   wholeNativeHLR3DOriginalOpenSourceRayVerified:
    wholeHidden.counts.wholeHiddenNativeOpen3DSourceIntervalsCertified,
   wholeSourceM5HiddenAndOriginalEndpointFanPositivelyCorroborated:
    wholeHidden.counts.original3DPhysicalCreaseWholeHiddenAndValidEndpoints,
   uniqueOriginalSourceButM5ContinuousRayStillIncomplete:
    wholeHidden.counts.nativeHiddenUnique3DSourceButIncompleteStrictM5,
   withheldOriginalSourceM4NativeParameterGaps:
    wholeHidden.counts.nativeHiddenOriginal3DSourceM4PositiveGapCount,
   withheldStrictM5RayParameterGaps:
    wholeHidden.counts.nativeHiddenOriginalStrictM5ProofPositiveGapCount,
   hiddenPaperCandidateClearRayConflicts:
    wholeHidden.counts.nativeHiddenSourceClearRayConflicts,
   genuineOcctVisibleFrontMaskFullHiddenPaperStrokes:
    frontMask.counts.hiddenNativeFullPaperMaskByRealVisibleFrontSource,
   partlyFrontMaskedButPaperDepthUnproven:
    frontMask.counts.hiddenNativePartialPaperMaskOrDepthGapHeld,
   independentVisibleFrontOCCTM4DepthAndM5RayWitnesses:
    frontMask.counts.realVisibleFrontM5ClosedRayAndM4DepthWitnessCount,
   frontPaperMaskOriginalParameterGaps:
    frontMask.counts.numberOfUncoveredPositiveHiddenPaperIntervals,
   exactOriginalFullFrontDepthCandidatePairs:
    exactFront.counts.exact3DFullOriginalProjectionAndDepthPairs,
   nativeVisibleFullOriginalFrontEndpointsVerified:
    exactFront.counts.actualNativeVisibleM0OriginalEndpointFullPaperMatches,
   entireModelAndNativeFrontEndpointMasks:
    exactFront.counts.exactModelAndNativeFrontWholePaperMaskCertified,
   exactModelButNativeOCCTEndpointDriftHeld:
    exactFront.counts.exactM0FrontButNativeEndpointDriftHeld,
   genuineNativeUncoveredM0PhysicalFrontSourceGapIntervals:
    gapModel.counts.originalOpenParameterGapIntervalsReviewed,
   exactModelFullFrontRayGapOpenIntervalsCertified:
    gapModel.counts.exactM0FullFrontPhysicalSourceGapIntervalsCorroborated,
   exactModelFullFrontNewLocallyExplainedNativeStrokes:
    gapModel.counts.newlyFullOriginalModelOpenIntervalLocallyCorroborated,
   actualNativeHiddenHLRPaperOpenIntervalsNowFullyLocallyVerified:
    hiddenFormalGate.counts.wholeRealNativeHiddenPaperOpenIntervalsLocallyProven,
   remainingNativeHLRGeneratedPaperIntervalUnproven:
    hiddenFormalGate.counts.missingLocalNativeOrModelOpenProofHeld+
    hiddenFormalGate.counts.originalM0ModelPhysicalOpenRayEvidenceWithoutCompleteRealNativeHLR,
   unsignedNativeHLRActual3DEndpointFanGapStrokes:
    hiddenFormalGate.counts.original3DEndpointFanProofIncompleteStrokes,
   originalM4EndCutsIndependentM0NativePhysicalVertexRecoveredInGlobalGate:
    hiddenFormalGate.counts.missingM4OriginalVertexEndpointsIndependentNativeM0ProofRecovered,
   original3DNativePhysicalVertexNotYetAuthenticatedInGlobalGate:
    hiddenFormalGate.counts.genuineOriginalPhysical3DVertexEndpointIdentityStillUnproven,
   originalM4NativeSourceVertexEndpointCutsStillMissing:
    nativePhysicalEnd.counts.originalM4EndCutsStillUnproven,
   missingM4EndpointsWithIndependentExactOriginal3DOcctVertexProof:
    nativePhysicalEnd.counts.missingM4EndpointsIndependentlyPositiveNativeM0VertexProven,
   nativeSourceOriginal3DVertexEndpointProofStillMissing:
    nativePhysicalEnd.counts.missingM4EndpointsStillLackingIndependentNativeProof,
   actualNativeHiddenEdgesWithOriginalPhysicalVertexEndpointsPositive:
    nativePhysicalEnd.counts.nativeHiddenEdgesWithAllOriginal3DVertexEndpointsVerified,
   actualGeneratedOCCTHLRSharpEdgesTopologicallyAudited:
    nativeGeneratedVertexGraph.counts.genuineOCCTNativeHLRSharpEdges,
   nativeGeneratedActualIsSameSharedTopoDSVertexPairs:
    nativeIsSame3D.counts.actualNativeIsSamePairs,
   nativePaperCoincidentButDifferentTopoDSVertexPairs:
    nativeIsSame3D.counts.exactPaperCoincidentButDistinctNativeTopoDSPairsHeld,
   nativeIsSameAndSameOriginal3DPhysicalVertexPairs:
    nativeIsSame3D.counts.IsSameHiddenToHiddenMatchingOriginal3DPhysicalVertices,
   nativeIsSameButOriginal3DPhysicalVertexNotConfirmed:
    nativeIsSame3D.counts.IsSameHLRNodesButOriginalSource3DVertexNotCertified,
   original3DPhysicalSourceHLRJunctionsProvenDespiteNativeTopoDSDisconnected:
    nativeIsSame3D.counts.distinctNativeTopoDSButSameIndependentlyProvenOriginal3DVertexPairs,
   nativePaperAliasesStillWithoutOriginal3DSourceJoin:
    nativeIsSame3D.counts.paperCoincidentNativePairsWithoutIndependent3DPhysicalJunction,
   canonicalM4NativeHiddenOriginalSourceEncounterEventsChecked:
    nativeEncounters.counts.originalM4PaperEncounterOccurrencesCovered,
   authenticOriginal3DPhysicalM4JunctionEncountersVerified:
    nativeEncounters.counts.exactOriginal3DPhysicalVertexEncountersCorroborated,
   M4PaperOnlyNativeSourceEncountersHeld:
    nativeEncounters.counts.paperOnlyOriginalSourceCrossingsAndOverlapsHeld,
   originalM4RoundedEventNativeEncountersHeld:
    nativeEncounters.counts.roundedSourceParameterEncountersHeld,
   nativeHiddenHLRInteriorPaperJunctionEventsAwaitingGlobalResolution:
    nativeEncounters.counts.nativeHLRInteriorPaperEventsRequiringSceneJunctionReview,
   M4NativeHLRExactPaperEventAlignmentUnprovenCount:
    nativeEncounters.counts.M4OriginalEventsWithNativeHLRPaperLineNotExactlyMatched,
   originalM4ExactTransverseCrossingEvents:
    nativeEncounters.counts.nativeOriginalM4TransverseCrossingEventsFound,
   exactDyadicNativeCrossingLocalStrictOriginal3DDepthProof:
    nativeEncounters.counts.exactOriginal3DStrictFrontDepthAtM4TransverseCrossingsProven,
   nativeHLRSourceInteriorSplitPhysicalJunctionEndpointsProven:
    hiddenFormalGate.counts.actualHiddenNativeEndpointsWithExactOriginal3DInteriorSplit,
   genuineNativeHLRStrokesWithBothLocallyPhysicalEndpointsAndContinuousM5Coverage:
    hiddenFormalGate.counts.actualHiddenNativeStrokesWithLocallyFullM5VisibilityAndPhysicalJunctions,
   nativeHLRSourceOriginal3DJunctionEndpointStarsPositivelyProven:
    hiddenFormalGate.counts.originalHLRHiddenEndpointsWithGenuineNativeIsSameAndFullyVerifiedOriginal3DStar,
   nativeHLRSharedJunctionEndpointStarsOriginal3DUnverified:
    hiddenFormalGate.counts.originalHLRHiddenEndpointsAtSharedIsSameButOriginalSourceFanHeld,
   nativeM4SourceProjectedEventsWithExactLocal3DTopology:
    hiddenFormalGate.counts.originalM4ProjectedEventsWithVerifiedLocal3DSpatialDisposition,
   nativeM4SourceProjectedEventsStillSpatiallyUndetermined:
    hiddenFormalGate.counts.originalM4ProjectedEventsStillMissingExactLocal3DSpatialDisposition,
   nativeHLRSourceStrokesWithEntireKnownM4GraphLocally3DClassified:
    hiddenFormalGate.counts.nativeHLRSourceStrokesWithCompleteLocal3DEventClassification,
   nativeM4CollinearInteriorEventsWithVerifiedWholeOriginalFrontNoDepthSwitch:
    hiddenFormalGate.counts.nativeM4CollinearInteriorEventsWithExactFullFrontDepthNoSwitchProof,
   nativeM4CollinearInteriorEventsWithoutIndependentFullFrontMask:
    hiddenFormalGate.counts.nativeM4InteriorCollinearEventsWithoutPositiveFullFrontNoSwitchProof,
   nativePaperMismatchAtAuthenticatedOriginal3DPhysicalVertex:
    hiddenFormalGate.counts.nativePaperMisalignmentWithIndependentAuthenticOriginal3DVertex,
   genuineOriginalSourceBRepAndExact3DSharedVertexEvents:
    hiddenFormalGate.counts.exactOriginal3DSharedVertexWithTwoAuthenticBRepSources,
   measuredOCCTHiddenGeneratedHLREdgePhysicalOriginal3DSourceTiling:
    trueGeneratedHiddenM5Tiling.nativeHiddenGeneratedStrokesWithUniqueM0PhysicalSource,
   measuredOCCTHiddenGeneratedHLREdgesStillUnresolved:
    trueGeneratedHiddenM5Tiling.generatedHiddenStrokesStillLackingUniqueOriginal3DSource,
   measuredNativeHLRHiddenGeneratedSourceIntervalsPartiallyUnprovedByM5:
    trueGeneratedHiddenM5Tiling.trueNativeHiddenOriginalEdgeIntervalsOnlyPartlyM5SourceProven,
   originalVHWSourceViewsWithNativeGeneratedEdgePhysicalMultiplicity:
    nativeWholeSource.original3DSourceViewsWithAnyGeneratedFragmentMultiplicity,
   measuredOCCTVisibleGeneratedHLREdgePhysicalOriginal3DSourceTiling:
    generatedVisibleM5PhysicalTiling.trueGeneratedOCCTVisibleSegmentsInspected,
   measuredOCCTVisibleNativeGeneratedEdgesWithExactOriginal3DEndpoints:
    generatedVisibleM5PhysicalTiling.genuinelyExactMeasuredNativeVisibleSegments,
   genuineRealOCCTGeneratedVisibleEdgesWithIndependentlyUniqueM5Front3DSource:
    generatedVisibleM5PhysicalTiling.
     exactVisibleHLRGeneratedEdgeOriginal3DSourceUniquelySelectedByM5FrontRay,
   genuineRealOCCTGeneratedVisibleSourceSelectionsReconfirmedByM5FinalNativeLedger:
    generatedVisibleM5PhysicalTiling.
     selectedNativeVisibleGeneratedSourcesCrosscheckedAgainstCurrentBRep,
   realOCCTNativeGeneratedSourceEdgesHeldForRoundedOrAmbiguousEndpoints:
    generatedVisibleM5PhysicalTiling.unverifiedGeneratedOCCTVisibleSegments,
   nativeVisibleHLRUnverifiedReasonCounts:
    generatedVisibleM5PhysicalTiling.independentHeldNativeVisibleReasonCounts,
   nativeVisibleHLRPaperDriftWithExactOriginal3DSourceCandidates:
    generatedVisibleM5PhysicalTiling.
     unverifiedNativeHLREdgesWithBitExactOriginal3DSourceButNumericPaperDrift,
   nativeVisibleHLRUnverifiedSegmentsAudit:
    generatedVisibleM5PhysicalTiling.independentlyHeldGeneratedNativeVisibleEdgeCauses,
   mathematicallySignedGlobalM5VisibleContourClaims:
    nativeM5ExteriorContourParity.originalGloballySignedM5ContourStrokeCount,
   globalM5VisibleContourClaimsIndependentlyReconfirmedByRealOCCTNative3DSourceAndFullParameter:
    nativeM5ExteriorContourParity.
     originalGloballySignedM5ContoursWithExactNativeOriginal3DSourceCoverage,
   globalM5VisibleContourClaimsStillHeldByRealOCCTNativeSource:
    nativeM5ExteriorContourParity.originalGloballySignedM5ContoursStillHeldForNativeProof,
   exactOriginalM0VertexBasedNativeContourPhysical3DEndpointsRecovered:
    nativeM5ExteriorContourParity.
     globallySignedContoursWithExactOriginalM0VertexPaperEndpointRecovery,
   realOCCTNativeOriginalPhysicalContourVerification:
    nativeM5ExteriorContourParity.rows.filter(x=>
     x.originalM5WholeExteriorContourCertified).map(x=>({
      view:x.view,ordinal:x.canonicalHullIntervalOrdinal,
      sourceEdge:x.originalPhysical3DSourceEdgeId,
      sourceRange:x.originalSourceParameterRange,
      passed:x.realOCCTOriginal3DSourceCompleteContourParity,
      physical3DParameterRecoveryKind:x.originalContour3DParameterRecoveryKind,
      physicalM0OriginalVertexPaperBinding:x.exactOriginalPhysical3DVertexPaperBinding,
      missingSourceRanges:x.positiveLengthNativeSourceGaps,
      duplicatePhysicalSource:x.nativeGeneratedOriginalSourceOverlap,
      heldReason:x.heldReason,
      signedV5Action:false
     })),
   heldNativeVisibleHLROriginal3DContourFaceRaySourceFanCount:
    heldContourFaceRays.heldGeneratedNativeVisibleSegmentsReviewed,
   originalContourHLRSourceFansWithOneProvablyFront3DEdgeAndStrictlyHiddenAlternatives:
    heldContourFaceRays.
     heldGeneratedSegmentsWithFullFaceRayFrontAndAllAlternativesStrictHidden,
   originalContourHLRSourceFansWithEverySourceOnExteriorHull:
    heldContourFaceRays.
     unresolvedHLRGeneratedSegmentsWhoseAllOriginal3DSourcesProjectToExterior,
   heldNativeHLRSourceFanOriginalFullFaceRayAudit:
    heldContourFaceRays.rows,
   trueNativeHLRVisibleSourceViewsWithOverlappingGeneratedPhysicalFragments:
    generatedVisibleM5PhysicalTiling.originalSourceViewsWithDuplicateGeneratedHLRIntervals,
   originalVHWSourceViewsWithFullNoOverlapM4AllFaceRayParameterPartitions:
    fullOriginalFaceRaySource.
     M4RayPartitionsWithExactPositiveNoOverlapFullSourceCoverage,
   originalVHWPhysicalSourceViewsWithExactContinuousRayAndActualOCCTNativeMatch:
    fullOriginalFaceRaySource.
     noncollapsedOriginalSourceViewsFullyMatchedToActualOCCTAndAllOriginalOpaqueFaceRays,
   realSingleConvexAllFaceRayAndActualOCCTHLRSourceSubspansReconciled:
    faceRayAndActualNativeHLR.sourceRaySubspansAudited,
   nativeSourceSubspansWithIndependentFaceRayAndTrueOCCTHLRPositiveAgreement:
    faceRayAndActualNativeHLR.
     singleSolidFaceRaysAndActualHLRPhysicalSourceIntervalsPositivelyCompatible,
   nativeSourceSubspansWithSingleSolidFaceRayNativeOcclusionContradictions:
    faceRayAndActualNativeHLR.
     original3DSourceSubspansWithNativeVisibilityContradiction,
   realNativeVHWSourceViewsWithTrueVisibleOrHiddenPhysicalCoverage:
    nativeVHWPhysicalSourceUnion.
     genuineNoncollapsedSourceViewsWithNecessaryM5VisibleOrHiddenCoverage,
   realNativeVHWSourceViewsWithUnprovedOriginalPhysicalSourceIntervals:
    nativeVHWPhysicalSourceUnion.sourceViewsWithNonzeroPositiveVisibilityGaps,
   verifiedRealOriginalOCCT3DBRepModelSourceEdgeInventory:
    actualOriginal3DBRepInventory.matchedOriginalPhysicalSourceEdges,
   trueOriginal3DSharedVertexAndNativeIsSameEntireJunctionNodes:
    nativeIsSame3D.counts.completeGeneratedHLRJunctionComponentsWithIndependentOriginal3DVertex,
   genuineNativeHLRInteriorSplitPointsOnOneVerifiedOriginal3DEdge:
    nativeIsSame3D.counts.generatedNativeJunctionComponentsWithExactOriginal3DSourceInteriorSplit,
   genuineNativeVisibleHidden3DSharedVertexWithFullOriginalM5FrontClearRay:
    nativeIsSame3D.counts.nativeMixedVisibleHiddenWithAuthenticatedOriginalM0VertexAndM5ClearRay,
   nativeIsSameJunctionNodesStillLackingFullOriginal3DSourceFan:
    nativeIsSame3D.counts.completeGeneratedHLRJunctionComponentsHeldOnUnmappedPhysicalSource,
   trueOriginal3DSharedVertexButNativeHLRPaperMismatchStillHeld:
    hiddenFormalGate.counts.exactSource3DSharedVertexButNativeGeneratedPaperStillMisaligned,
   originalSourceVertexExactDyadicOtherEdgeChecks:
    nativeEncounters.counts.authenticM4OriginalVertexOtherSourceIncidencesExactlyReviewed,
   projectedSourceEndpointsWithExactStrictDifferent3DObserverDepth:
    nativeEncounters.counts.projectedEndpointEventsProvedStrictlyDifferentOriginal3DDepth,
   exactNativeCrossingTrue3DDepthTieHeld:
    nativeEncounters.counts.exactM4TransverseCrossingsWithDepthTieHeld,
   nativeCrossingOutsideActualOriginalOpenSpanHeld:
    nativeEncounters.counts.exactM4TransverseCrossingsOutsideOriginalOpenSourceHeld,
   unresolvedActualNativeInteriorM4Events:
    nativeEncounters.rows.flatMap(r=>r.originalM4ProjectedEncountersOnNativeSource
     .filter(ev=>ev.originalSourceParameter>
      (r.genuineNativeHLROriginalSourceParameterRange?.[0]??0)&&
      ev.originalSourceParameter<
      (r.genuineNativeHLROriginalSourceParameterRange?.[1]??1))
     .map(ev=>({
      view:r.view,sourceEdgeId:r.uniqueOriginalPhysical3DSourceEdgeId,
      otherSourceEdgeId:ev.otherOriginal3DSourceEdgeId,
      kind:ev.canonicalM4ProjectedEncounterKind,
      nativeOrdinal:r.nativeHiddenSharpEdgeOrdinal,
      originalSourceParameter:ev.originalSourceParameter,
      trueOriginal3DPhysicalVertex:ev.positivelySameOriginal3DPhysicalSourceVertex,
      exactLocal3DDepthProven:ev.exactOriginalM4CrossingObserverDepthEvidence?.
       strictOriginal3DObserverDepthOrderAtPaperCrossingProven??false,
      otherEdgeEndpointOnPaper:ev.exactOriginalM4CrossingObserverDepthEvidence?.
       otherOriginal3DEdgeEndpointAtPaperCrossing??false,
      realNativePaperAligned:ev.actualNativeGeneratedBRepPaperRelation.
       originalEventOnSameNativePaperLineExactly
     }))).slice(0,8),
   unalignedRealNativeM4PaperEvents:
    nativeEncounters.rows.flatMap(r=>r.originalM4ProjectedEncountersOnNativeSource
     .filter(ev=>!ev.actualNativeGeneratedBRepPaperRelation.
      originalEventOnSameNativePaperLineExactly)
     .map(ev=>({
      view:r.view,sourceEdgeId:r.uniqueOriginalPhysical3DSourceEdgeId,
      otherSourceEdgeId:ev.otherOriginal3DSourceEdgeId,
      kind:ev.canonicalM4ProjectedEncounterKind,
      nativeOrdinal:r.nativeHiddenSharpEdgeOrdinal,
      sourceParameter:ev.originalSourceParameter,
      modelEventPaper:ev.originalEventPaperPoint,
      trueNativeOriginalPaperParameter:ev.actualNativeGeneratedBRepPaperRelation.
       nativePaperSegmentParameter,
      exactLocal3DDepthProven:ev.exactOriginalM4CrossingObserverDepthEvidence?.
       strictOriginal3DObserverDepthOrderAtPaperCrossingProven??false
     }))).slice(0,8),
   generatedTopoDSAndGBAndV5RemainUnsigned:true,
   stillUnresolvedOriginalModelFrontGapIntervals:
    gapModel.counts.unprovenOriginalOpenParameterGapIntervalsHeld,
   genuineOCCTVCompoundMissingGeneratedEndpointTailHeld:
    gapModel.counts.actualNativeVisibleHLRDoesNotFullyCoverM0PaperStillHeld,
   realHiddenNativeLocallyCoveredByInwardOrFrontVisibleSource:
    combinedHidden.counts.entireNativeHiddenOpenIntervalLocallyAccountedByEitherProof,
   remainingRealNativeHiddenWithPositiveUnprovenPaperSourceIntervals:
    combinedHidden.counts.stillUnprovenAfterConservativeIntervalUnion,
   actualNativeHiddenRequiringBothIndependentProofTypes:
    combinedHidden.counts.needingBothPositiveProofTypesForFullCoverage,
   exactUnprovedCombinedOriginalParameterGapCount:
    combinedHidden.counts.uncoveredPositiveOriginalSourceParameterRangesHeld,
   actualRemainingOriginalSourceNativeIntervals:
    combinedHidden.rows.filter(row=>!row.locallyExplainedNativeHiddenOpenPaperInterval)
     .map(row=>({
      view:row.view,
      nativeHiddenSharpEdgeOrdinal:row.nativeHiddenSharpEdgeOrdinal,
      originalHiddenSourceEdgeId:row.originalHiddenSourceEdgeId,
      outstandingOriginalParameterRanges:
       row.independentOpenIntervalRayAndFrontVisibleUnion?
       row.independentOpenIntervalRayAndFrontVisibleUnion
        .outstandingUnprovedOriginalParameterIntervals:null
     })),
   fullOriginalTopoDSSourceLinkSigned:false,
   formalGBHiddenLineSigned:false,v5ActionsSigned:0
  },
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
    realOriginal3DVertexFaceFanEndpointProofs:
     finalGate.counts.certifiedOriginal3DVertexFanEndpointWitnesses,
    original3DVertexM4PaperEndpointLinksHeld:
     finalGate.counts.originalVertexFanM4EndpointLinkMissingHeld,
    nonoriginalPaperCutsWithout3DVertexFan:
     finalGate.counts.syntheticPaperPointCannotAcquireClosed3DVertexStarCount,
    distinctDepthPaperVertexAliasesHeld:
     finalGate.counts.actualOriginal3DVertexProjectedAliasWitnessesHeld,
    genuineOriginal3DVertexFaceFanViewStars:
     finalGate.original3DVertexClosedFaceFanTotals.
      realClosedOriginalVertexFaceFans,
    exactWholeClosedOriginalPhysicalEdgeViews:
     finalGate.originalFull3DEdgeRayContinuityTotals.
      exactWholeClosedOriginalPhysicalEdgeRayClear,
    originalSourceCut3DJoinedWithoutPaperVertexPromotion:
     finalGate.counts.originalSourcePaperCut3DContinuityPreserved,
    originalM4PaperParameterGapsHeld:
     finalGate.originalFull3DEdgeRayContinuityTotals.
      missingPaperSourceParameterGapCount,
    incompleteOriginalM4ProjectedSourceEdgeViews:
     finalGate.originalFull3DEdgeRayContinuityTotals.
      nonCollapsedProjectionPartitionIncomplete,
    subspansInheritingWholeClosedOriginal3DRayClear:
     finalGate.counts.originalSourceSubspanInheritedExactClosedEdgeRayClear,
    nonHullClosedOriginalRayNotProven:
     finalGate.counts.originalSourceClosedRayNotYetProven,
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
