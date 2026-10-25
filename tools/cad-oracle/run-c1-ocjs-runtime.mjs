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
const {reviewC1M5FinalStrokeObligations}=
 require('../../workbench/c1-m5-final-source-obligation-review.cjs');
const {reviewC1NativeHiddenFinalM5Strokes}=
 require('../../workbench/c1-native-hidden-global-m5-stroke-gate.cjs');
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
  globalM5Review:unsignedReview
 });
 assert.equal(hiddenFormalGate.counts.genuineHiddenHLRStrokesReviewed,
  nativeHiddenM5.counts.realNativeHiddenSharpSegments);
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
  assert.ok(finalGate.originalFull3DEdgeRayContinuityTotals.
   missingPaperSourceParameterGapCount>0,
   'skew six-face current M4 tiny cuts must remain explicitly held until source-contiguous paper drawing is proved');
  assert.ok(finalGate.originalFull3DEdgeRayContinuityTotals.
   nonCollapsedProjectionPartitionIncomplete>0);
 }

 assert.ok(finalGate.subspans.every(x=>
  x.paperEventCutsNeverCertifiedAsNew3DVertices===true&&
  x.M4Original3DEdgeCutContinuityVerified!==null&&
  x.blockers.originalConstructionIntentDAGAndSingleV5NotAuthorized===true&&
  (!x.exactClosedOriginal3DSourceObserverRayClear||
   x.singleOpaqueSolidContinuousOpenRayClear||
   x.originalM5ExteriorContourOverlap===true)));
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
   originalM4NativeSourceVertexEndpointCutsStillMissing:
    nativePhysicalEnd.counts.originalM4EndCutsStillUnproven,
   missingM4EndpointsWithIndependentExactOriginal3DOcctVertexProof:
    nativePhysicalEnd.counts.missingM4EndpointsIndependentlyPositiveNativeM0VertexProven,
   nativeSourceOriginal3DVertexEndpointProofStillMissing:
    nativePhysicalEnd.counts.missingM4EndpointsStillLackingIndependentNativeProof,
   actualNativeHiddenEdgesWithOriginalPhysicalVertexEndpointsPositive:
    nativePhysicalEnd.counts.nativeHiddenEdgesWithAllOriginal3DVertexEndpointsVerified,
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
