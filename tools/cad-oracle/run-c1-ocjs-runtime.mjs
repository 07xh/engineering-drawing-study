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
const {auditC1RealOcctVisibleContourSourceParity,
 exactPositiveCollinearPaperOverlap}=
 require('../../workbench/c1-real-occt-m5-visible-contour-parity.cjs');
const {auditC1NativeHiddenSharpVsM5}=
 require('../../workbench/c1-ocjs-hidden-sharp-m5-corroboration.cjs');
const {auditC1NativeScopedHLRSourceConsumer}=
 require('../../workbench/c1-native-scoped-hlr-source-consumer.cjs');
const {auditC1M5UnresolvedGlobalSourceObligations}=
 require('../../workbench/c1-m5-unresolved-global-source-obligations.cjs');
const {auditC1Original3DSourceGapDyadicWitness}=
 require('../../workbench/c1-original-3d-source-gap-dyadic-forensics.cjs');
const {auditC1OriginalOcctCurveParameterGapWitness}=
 require('../../workbench/c1-original-occt-curve-parameter-gap-witness.cjs');
const {auditC1NativeGapGeneratedVertexAdjacency}=
 require('../../workbench/c1-native-gap-generated-vertex-adjacency.cjs');

const {auditC1AllOriginalSourceNativeGaps}=
 require('../../workbench/c1-all-native-source-gap-ledger.cjs');
const {auditC1NativeGapOriginalExactRays}=
 require('../../workbench/c1-native-gap-original-exact-rays.cjs');
const {projectC1Native3DSourceIntervalsToM4}=
 require('../../workbench/c1-native-source-scoped-m4-projection.cjs');
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
// Probe the REAL pinned OCJS source-filtered 3D HLR path. OCCT's
// HLRBRep::MakeEdge3d retains original 3D curve parameter intervals,
// unlike the projected 2D VCompound/HCompound edges. Do not treat
// mere API availability as a successful source/history certificate.
console.error('REAL C1 OCJS SOURCE-SCOPED 3D HLR API '+JSON.stringify({
 extractorMethods:Object.getOwnPropertyNames(oc.HLRBRep_HLRToShape?.prototype??{}).
  filter(x=>/CompoundOfEdges|VCompound|HCompound/.test(x)),
 sharpEnumGroupKeys:Object.keys(oc.HLRBRep_TypeOfResultingEdge??{}).
  filter(x=>/Sharp|SharpLine|Rg/.test(x)),
 sharpEnumDirectType:typeof oc.HLRBRep_Sharp,
 sharpEnumGroupType:typeof oc.HLRBRep_TypeOfResultingEdge?.HLRBRep_Sharp
}));
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
 assert.equal(result.c1CadRuntime.independentlyM0BoundedExtremeVertexSetVerified,true);
 assert.equal(result.c1CadRuntime.independentlyM0ExtremeVertexProof.vertexHullVerified,true);
 assert.equal(result.c1CadRuntime.independentlyM0ExtremeVertexProof.derivedVertexCount,8);
 assert.equal(result.c1CadRuntime.independentlyM0ExtremeVertexProof.officialLineStyleVerified,false);
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
  directNativeOriginalVertexMatches:
   result.c1CadRuntime.independentCadComputedSegments.directNativeOriginalVertexMatches,
  fullGeneratedEdgeHistoryProven:false,
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
 assert.deepEqual(Object.keys(cad.nativeHLRSourceHistoryAPISurfaceByView).sort(),
  ['H','V','W']);
 for(const view of ['V','H','W']){
  const api=cad.nativeHLRSourceHistoryAPISurfaceByView[view];
  assert.equal(api.actualPinnedWasmObjectInspected,true);
  assert.ok(['algorithmMethodNames','algorithmHandleMethodNames',
   'extractorMethodNames'].every(k=>Array.isArray(api[k])&&api[k].length<=48));
  const statusAPI=api.originalEdgeStatusAPI;
  assert.ok(statusAPI,'real native HLR status capability must be inventoried');
  assert.ok(Array.isArray(statusAPI.originalHLRDataStructureMethodNames));
  assert.ok(Array.isArray(statusAPI.originalEdgeStatusArrayMethodNames));
  assert.ok(statusAPI.originalHLRDataStructureMethodNames.length<=48);
  assert.ok(statusAPI.originalEdgeStatusArrayMethodNames.length<=48);
  assert.equal(typeof statusAPI.statusArrayExposedInPinnedWasm,'boolean');
  assert.equal(statusAPI.originalHLREdgeStatusIntervalsExtracted,false);
  assert.equal(statusAPI.originalHLREdgeStatusToGeneratedPaperLineageCertified,false);
  assert.equal(statusAPI.originalHLROpenSourceClassBoundToOriginalEdgeMap,true);
  const statusRows=statusAPI.nativeOriginalSourceEdgeStatusRows;
  assert.equal(statusRows.length,geometry.data.edges.length,
   'each current original M0 physical edge must have a native HLR status');
  const expectedM0Ids=new Set(geometry.data.edges.map(edge=>
   geometry.id+'::'+[...edge].sort().join('|')));
  assert.deepEqual(new Set(statusRows.map(x=>x.originalPhysicalSourceEdgeId)),
   expectedM0Ids);
  assert.deepEqual(new Set(statusRows.map(x=>x.nativeHLROriginalEdgeMapIndex)),
   new Set(statusRows.map((_,i)=>i+1)));
  for(const row of statusRows){
   assert.equal(row.view,view);
   assert.equal(row.generated2DHLREdgeToOriginalSourceHistoryCertified,false);
   assert.equal(row.globalContinuousM5OcclusionCertified,false);
   assert.equal(row.engineeringLineStyle,'undetermined');
   assert.equal(row.signedV5Action,false);
   assert.equal(row.originalSourceClass,
    row.originalEdgeStatusAllVisible?'all-visible':
     row.originalEdgeStatusAllHidden?'all-hidden':'mixed');
  }
  if(geometry.id==='C1SkewTetra'&&view==='W'){
   for(const suffix of ['A|C','A|D']){
    const row=statusRows.find(s=>
     s.originalPhysicalSourceEdgeId==='C1SkewTetra::'+suffix);
    assert.ok(row,'genuine native W source must remain indexed');
    assert.equal(row.originalEdgeStatusAllVisible,true,
     'original HLR source EdgeStatus must agree with independent OCP oracle');
    assert.equal(row.originalEdgeStatusAllHidden,false);
    assert.equal(row.nativeOriginalVisiblePartCount,1);
   }
  }
  // Native OCP has already proved original EdgeMap -> EdgeStatus; check
  // the pinned JavaScript WASM binding itself before building a consumer.
  assert.equal(statusAPI.statusArrayExposedInPinnedWasm,true);
  assert.ok(Array.isArray(statusAPI.originalHLREdgeDataMethodNames));
  assert.ok(Array.isArray(statusAPI.originalHLREdgeStatusMethodNames));
  // The pinned OCJS native EDataArray has a 0-indexed spare entry,
  // while OCCT EdgeMap uses original physical input-edge IDs 1..N.
  // Never shift those genuine EdgeMap indices or read source 0 as M0.
  assert.deepEqual(statusAPI.originalEdgeStatusArrayBounds,
   [0,geometry.data.edges.length],
   'native EdgeStatus array [0,N] must contain the 1-based original M0 EdgeMap index');
  assert.ok(statusAPI.firstOriginalIndexedEdgeStatusAllVisible===null||
   typeof statusAPI.firstOriginalIndexedEdgeStatusAllVisible==='boolean');
  assert.ok(statusAPI.firstOriginalIndexedEdgeStatusAllHidden===null||
   typeof statusAPI.firstOriginalIndexedEdgeStatusAllHidden==='boolean');
  assert.equal(statusAPI.signedV5Action,false);
  const ds=api.originalDataStructureIndex;
  assert.equal(ds.generatedHLREdgeToOriginalTopoDSHistoryProven,false);
  assert.equal(ds.signedV5Action,false);
  assert.equal(ds.availability,'real-native-edge-map-inspected',
   'pinned real WASM must expose the native HLR internal original EdgeMap');
  assert.equal(ds.internalEdgeMapExtent,geometry.data.edges.length);
  assert.equal(ds.originalSourceIdsInInputBRep,geometry.data.edges.length);
  assert.equal(ds.internalEdgeMapOriginalSourceIdsMatched,
   geometry.data.edges.length);
  assert.equal(ds.everyOriginalBRepSourcePresentInHLRDataStructure,true);
  assert.equal(ds.indexedOriginalSources.length,ds.internalEdgeMapExtent);
  assert.ok(ds.indexedOriginalSources.every(x=>
   x.directlySameOriginalTopoDSInputEdge===true&&
   x.generatedHLREdgeToOriginalTopoDSHistoryProven===false&&
   x.signedV5Action===false));
  // REAL pinned WASM: original TopoDS edge -> source-scoped HLR filter
  // -> whole-solid HLR projected edge. Only native symmetric IsSame is
  // allowed to claim direct generated identity; paper aliases stay held.
  const scoped=cad.nativeSourceScopedSharpOutputByView[view];
  assert.equal(scoped.schema,
   'draftai-c1-ocjs-real-original-topods-scoped-hlr/1');
  assert.equal(scoped.sourceEdgeCount,geometry.data.edges.length);
  assert.equal(scoped.originalTopoDSEdgeIndexCheckedAgainstActualHLREdgeMap,true);
  assert.equal(scoped.allScopedOutputsReboundToWholeSolidPaper,true);
  assert.ok(scoped.nativeSourceScopedOutputEdgeCount>0,
   'real original TopoDS per-edge VCompound/HCompound filters must emit HLR');
  assert.equal(scoped.nativeSourceScopedOutputEdgeCount,
   scoped.nativeScopedToWholeSolidGeneratedIsSameCount+
   scoped.paperOnlyScopedOutputEdgeCount);
  assert.equal(scoped.fullGlobalGeneratedEdgeToOriginalSourceHistoryProven,false);
  assert.equal(scoped.fullContinuousVisibilityProven,false);
  assert.equal(scoped.signedV5ActionCount,0);
  // A second native output route now supplies actual WHOLE-SOLID
  // generated 3D curves. Independently verify every global 2D sharp
  // ordinal against one original 3D BRep curve, not paper-only aliases.
  const global3D=scoped.nativeGlobal3DOriginalSourceEvidence;
  assert.equal(global3D.schema,
   'draftai-c1-global-native-hlr-3d-original-curve-corroboration/1');
  assert.equal(global3D.sourceGeometryId,geometry.id);
  assert.equal(global3D.revision,cad.revision);
  assert.equal(global3D.view,view);
  assert.equal(global3D.globalGenerated2DSharpEdges,
   cad.views[view].length+cad.hiddenSharpViews[view].length);
  assert.equal(global3D.globalGenerated3DSharpEdgesWithUniqueOriginalCurve,
   global3D.globalGenerated2DSharpEdges);
  assert.equal(global3D.rows.length,global3D.globalGenerated2DSharpEdges);
  assert.equal(global3D.allGenerated3DSharpCurvesBoundToOriginalBRepAnd2DPaper,true);
  assert.equal(global3D.generated2DTo3DTopoDSHistoryCertified,false);
  assert.equal(global3D.globalContinuousVisibilityCertified,false);
  assert.equal(global3D.officialV5Authorized,false);
  assert.equal(global3D.signedV5ActionCount,0);
  const global3DOrdinals=new Set();
  for(const row of global3D.rows){
   const key=row.hlrClass+'|'+row.wholeSolidGeneratedHLREdgeOrdinal;
   assert.equal(global3DOrdinals.has(key),false);
   global3DOrdinals.add(key);
   assert.ok(geometry.data.edges.some(edge=>
    geometry.id+'::'+[...edge].sort().join('|')===
     row.originalPhysicalSourceEdgeId));
   assert.equal(row.globalNative3DHLRCurveEqualsOriginalBRepAtThreeParameters,true);
   assert.equal(row.global3DAnd2DHLRMeasuredPaperPairUnique,true);
   assert.equal(row.global3DAndOriginalScoped3DHLRParameterIntervalExact,true);
   assert.equal(row.globalGenerated2DTo3DTopoDSHistoryCertified,false);
   assert.equal(row.fullOpaqueSceneContinuousOcclusionCertified,false);
   assert.equal(row.engineeringLineStyle,'undetermined');
   assert.equal(row.signedV5Action,false);
  }
  const indexIds=new Map(ds.indexedOriginalSources.map(x=>
   [x.originalPhysicalSourceEdgeId,x.hlrDataStructureOneBasedEdgeIndex]));
  assert.ok(scoped.rows.every(row=>
   row.hlrDataStructureOneBasedEdgeIndex===
    indexIds.get(row.originalPhysicalSourceEdgeId)&&
   ['visible','hidden'].every(k=>row[k].every(w=>
    w.originalPhysicalSourceEdgeId===row.originalPhysicalSourceEdgeId&&
    w.globalPaperCandidateOrdinals.length>=1&&
    w.engineeringLineStyle==='undetermined'&&w.signedV5Action===false))));
  // Real native original 3D HLR -> existing first-angle project() -> M4
  // source-preserving candidate. No rounded generated 2D HLR inverse,
  // no alternative M3, M5 line style or second V5.
  const nativeCurveBySource=new Map(cad.originalBRepSourceEdges.map(row=>
   [row.sourceEdgeId,row]));
  let native3DM4Noncollapsed=0,native3DM4ProjectedSegments=0,
   nativeM4ExactPhysicalBoundaryChecks=0;
  for(const source of scoped.rows){
   const edge=geometry.data.edges.find(e=>
    geometry.id+'::'+[...e].sort().join('|')===source.originalPhysicalSourceEdgeId);
   assert.ok(edge,'real native source must belong to original M0 edge list');
   const [a,b]=edge.map(id=>project(geometry.data.points[id])[view]);
   if(a.u===b.u&&a.v===b.v){
    assert.equal(source.visible3D.native3DGeneratedCurveIntervals.length,0);
    assert.equal(source.hidden3D.native3DGeneratedCurveIntervals.length,0);
    continue;
   }
   const witness=projectC1Native3DSourceIntervalsToM4({
    geometry,revision:cad.revision,view,
    sourceEdgeId:source.originalPhysicalSourceEdgeId,
    originalCurve:nativeCurveBySource.get(source.originalPhysicalSourceEdgeId),
    scopedRow:source
   });
   native3DM4Noncollapsed++;
   native3DM4ProjectedSegments+=witness.segments.length;
   // Real pinned WASM source intervals reaching the LITERAL M0 t=0/1
   // must project from the exact physical vertex, not a rounded lerp.
   // Interior fractions and the generated 2D HLR output remain separate.
   for(const segment of witness.segments){
    const [start,end]=segment.originalM0UnitParameterRange;
    if(start===0){
     assert.deepEqual(segment.fromModelMm,geometry.data.points[edge[0]]);
     assert.deepEqual(segment.fromPaper,a);
     nativeM4ExactPhysicalBoundaryChecks++;
    }
    if(end===1){
     assert.deepEqual(segment.toModelMm,geometry.data.points[edge[1]]);
     assert.deepEqual(segment.toPaper,b);
     nativeM4ExactPhysicalBoundaryChecks++;
    }
   }
   assert.equal(witness.sourceGeometryId,geometry.id);
   assert.equal(witness.revision,cad.revision);
   assert.equal(witness.native3DProvenanceIsNotGenerated2DHLREdgeIdentity,true);
   assert.equal(witness.native3DSourceParameterPartitionCompleteExactlyOnce,
    source.combinedNative3DSourceParameterPartition.
     sourceScopedNative3DParameterInventoryCompleteExactlyOnce);
   assert.deepEqual(witness.native3DOriginalParameterPositiveGaps,
    source.combinedNative3DSourceParameterPartition.
     positiveLengthUncoveredNativeParameterIntervals);
   assert.deepEqual(witness.native3DOriginalParameterPositiveOverlaps,
    source.combinedNative3DSourceParameterPartition.
     positiveLengthOverlappingNativeParameterIntervals);
   // M4 must never certify a rounded fraction union that conceals a
   // positive native gap or overlap; this is not formal HLR ownership.
   assert.equal(witness.M4OriginalUnitIntervalCandidateCoverageComplete,
    witness.native3DSourceParameterPartitionCompleteExactlyOnce&&
    witness.M4OriginalUnitIntervalCandidatePositiveGaps.length===0);
   assert.equal(witness.officialV5Authorized,false);
   assert.ok(witness.segments.every(s=>
    s.generated2DHLREdgeTopologyProven===false&&
    s.completeGlobalCoProjectedVisibilityCertified===false&&
    s.engineeringLineStyle==='undetermined'&&s.signedV5Action===false));
  }
  console.error('REAL C1 NATIVE 3D -> M4 SOURCE PROJECTION '+
   geometry.id+' '+view+': '+JSON.stringify({
    noncollapsedOriginalSources:native3DM4Noncollapsed,
    projectedSourceScoped3DIntervals:native3DM4ProjectedSegments,
    exactOriginalM0PhysicalBoundaryChecks:nativeM4ExactPhysicalBoundaryChecks,
    generated2DHLREdgeHistoryCertified:false,signedV5Actions:0
   }));
  // Actual pinned OCJS source-filtered In3d sharp output retains OCCT
  // original-curve parameter intervals. A complete scoped 3D union is
  // stronger than a paper alias, but is NOT generated 2D IsSame history,
  // whole-scene visibility or formal V5 permission.
  const combined3D=scoped.rows.map(row=>row.combinedNative3DSourceParameterPartition);
  assert.equal(combined3D.length,geometry.data.edges.length);
  assert.ok(combined3D.every(x=>x?.schema===
   'draftai-c1-native-source-scoped-3d-curve-parameter-coverage/1'&&
   x.signedV5Action===false));
  const native3D=scoped.rows.flatMap(row=>[row.visible3D,row.hidden3D]);
  assert.equal(native3D.length,2*geometry.data.edges.length);
  assert.ok(native3D.every(x=>
   x.nativeSourceFilteredOriginalTopoDSEdge===true&&
   x.generated2DSourceIdentityIsSameProven===false&&
   x.signedV5Action===false&&
   x.exactNative3DSourceParameterCoverage?.schema===
    'draftai-c1-native-source-scoped-3d-curve-parameter-coverage/1'&&
   x.native3DGeneratedCurveIntervals.every(e=>
    e.nativeSourceFilterOriginalEdgeId&&
    e.native3DCurveExactlySameAsOriginalAtThreeParameters===true&&
    e.originalGeneratedTopoDSHistoryCertified===false&&
    e.nativeOriginalCurveParameterRange[1]>
     e.nativeOriginalCurveParameterRange[0])));
  console.error('REAL C1 SOURCE-SCOPED NATIVE 3D HLR '+geometry.id+' '+view+': '+
   JSON.stringify({
    emitted3D:native3D.reduce((n,x)=>n+x.native3DGeneratedCurveIntervals.length,0),
    complete3DSourceClassIntervals:native3D.filter(x=>
     x.exactNative3DSourceParameterCoverage.
      sourceScopedNative3DParameterInventoryCompleteExactlyOnce).length,
    native3DPositiveGapIntervals:native3D.reduce((n,x)=>n+
     x.exactNative3DSourceParameterCoverage.
      positiveLengthUncoveredNativeParameterIntervals.length,0),
    native3DPositiveOverlapIntervals:native3D.reduce((n,x)=>n+
     x.exactNative3DSourceParameterCoverage.
      positiveLengthOverlappingNativeParameterIntervals.length,0),
    sourceFiltered2DOutputs:scoped.nativeSourceScopedOutputEdgeCount,
    combined3DSourceFullPartition:combined3D.filter(x=>
     x.sourceScopedNative3DParameterInventoryCompleteExactlyOnce).length,
    combined3DSourcePositiveGapIntervals:combined3D.reduce((n,x)=>n+
     x.positiveLengthUncoveredNativeParameterIntervals.length,0),
    combined3DSourcePositiveOverlapIntervals:combined3D.reduce((n,x)=>n+
     x.positiveLengthOverlappingNativeParameterIntervals.length,0)
   }));
  const nativeClaims=scoped.nativeSourceIdentityConflicts;
  assert.equal(nativeClaims.schema,
   'draftai-c1-native-scoped-source-identity-conflicts/1');
  assert.equal(nativeClaims.conflictingSourceClaimsRejected,true);
  assert.equal(nativeClaims.fullOriginalSourceHistoryCertified,false);
  assert.equal(nativeClaims.signedV5ActionCount,0);
  assert.equal(nativeClaims.wholeSolidNativeGeneratedEdgeCount,
   cad.views[view].length+cad.hiddenSharpViews[view].length);
  assert.equal(nativeClaims.uniqueNativeClaims,
   scoped.nativeScopedToWholeSolidGeneratedIsSameCount);
  assert.equal(nativeClaims.unclaimedWholeSolidGeneratedEdgeOrdinals.length,
   scoped.unclaimedNativeGeneratedHLREdges.length);
  for(const edge of scoped.unclaimedNativeGeneratedHLREdges){
   assert.equal(edge.view,view);
   assert.equal(edge.actualNativeScopedOriginalSourceIdentityRecovered,false);
   assert.equal(edge.originalSourceParameterIntervalCertified,false);
   assert.equal(edge.signedV5Action,false);
  }
  console.error('REAL HLR unclaimed native source identities '+geometry.id+' '+view+': '+
   JSON.stringify({total:nativeClaims.wholeSolidNativeGeneratedEdgeCount,
    claimed:nativeClaims.uniqueNativeClaims,
    unclaimed:scoped.unclaimedNativeGeneratedHLREdges.map(edge=>({
     klass:edge.hlrClass,ordinal:edge.ordinal,
     from:edge.projectedFrom,to:edge.projectedTo,
     m0CandidateCount:edge.sourceCandidate3DLifts?.length??0
    }))}));
  console.error('REAL HLR original source-scoped '+view+': '+
   JSON.stringify({sources:scoped.sourceEdgeCount,
    emitted:scoped.nativeSourceScopedOutputEdgeCount,
    directNativeIsSame:scoped.nativeScopedToWholeSolidGeneratedIsSameCount,
    paperOnly:scoped.paperOnlyScopedOutputEdgeCount}));
  assert.equal(api.generatedToOriginalTopoDSHistoryProven,false);
  assert.equal(api.officialLineStyleCertified,false);
  assert.equal(api.signedV5Action,false);
 }
 const scopedConsumer=auditC1NativeScopedHLRSourceConsumer({geometry,cad});
 assert.equal(scopedConsumer.schema,'draftai-c1-real-source-scoped-hlr-m5-consumer/1');
 assert.equal(scopedConsumer.actualOriginalTopoDSSourceFilteredHLRConsumed,true);
 assert.ok(scopedConsumer.counts.nativeSourceScopedOutputEdges>0);
 assert.equal(scopedConsumer.counts.nativeSourceScopedOutputEdges,
  scopedConsumer.counts.nativeGeneratedIsSameMatches+
  scopedConsumer.counts.paperOnlySourceScopedEdges);
 const globalScopedRebind=scopedConsumer.globalNativeHLRSourceScopeRebinding;
 assert.equal(globalScopedRebind?.schema,
  'draftai-c1-global-native-generated-2d-to-original-filtered-source-evidence/1');
 // Independent real pinned WASM check of exact indexed original TopoDS
 // input source + full native 3D class + globally unique filtered HLR.
 // No source interval, global opaque visibility, or V5 is signed here.
 const sourceAttribution=globalScopedRebind.exactSourceFilterBijectionByView;
 assert.deepEqual(Object.keys(sourceAttribution).sort(),['H','V','W']);
 let actualAttributed=0,actualBoundedSourceOwners=0;
 for(const view of ['V','H','W']){
  const summary=sourceAttribution[view],rows=globalScopedRebind.views[view];
  assert.equal(summary.view,view);
  assert.equal(summary.wholeSolidGeneratedEdgeCount,rows.length);
  const qualified=rows.filter(row=>
   row.exactIndexedOriginal3DClassSourceFilterAttributionWithoutIsSame);
  assert.equal(summary.uniquelyExactIndexedOriginal3DClassAttributedGlobalEdgeCount,
   qualified.length);
  actualAttributed+=qualified.length;
  const bounded=rows.filter(row=>
   row.indexedOriginal3DSourceFilterAttributionWithExplicitBoundedPaperDriftHeld);
  actualBoundedSourceOwners+=bounded.length;
  assert.equal(summary.native3DBoundedPaperDriftHeldButSourceFilterAttributedCount,
   bounded.length);
  assert.ok(bounded.every(row=>
   row.boundedWholeOriginal3DRoundingBackingForUniqueGlobalEdge===true&&
   row.exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge===false&&
   row.uniqueNativeScopedAndWholeSolidBinary64PaperEndpointsAgree===true&&
   row.wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified===false&&
   row.signedV5Action===false));
  if(summary.completeNativeIndexedSourceFilterAttributionIncludingHeldPaperDrift){
   assert.equal(qualified.length+bounded.length,rows.length);
   assert.equal(summary.uniqueScopedOwnerWithExplicitBoundedRoundingCount,rows.length);
  }
  assert.equal(summary.original3DParameterHistoryOnGenerated2DNotCertified,true);
  assert.equal(summary.globalContinuousOcclusionCertified,false);
  assert.equal(summary.signedV5ActionCount,0);
  if(summary.completeExactSourceScopedToWholeSolidOutputBijectionProven){
   assert.equal(qualified.length,rows.length);
   assert.equal(summary.originalSourceFilteredGeneratedEdgeCount,rows.length);
   assert.equal(summary.uniqueScopedOutputEmissionCount,rows.length);
  }
  for(const row of qualified){
   assert.ok(Number.isSafeInteger(row.nativeOriginalHLREdgeMapSourceIndex));
   assert.ok(row.nativeOriginalHLREdgeMapSourceIndex>0);
   assert.equal(row.uniqueNativeScopedAndWholeSolidBinary64PaperEndpointsAgree,true);
   assert.equal(row.exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge,true);
   assert.equal(row.wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified,false);
   assert.equal(row.signedV5Action,false);
  }
 }
 assert.equal(globalScopedRebind.counts.wholeSolidEdgesWithExactIndexedSourceFilterClassAttribution,
  actualAttributed);
 assert.equal(globalScopedRebind.counts.
  wholeSolidEdgesWithBoundedNative3DPaperDriftIndexedSourceFilterAttribution,
  actualBoundedSourceOwners);
 console.error('REAL WASM exact original TopoDS-indexed HLR global source-filter attribution '+
  geometry.id+': '+JSON.stringify({
   globalEdges:globalScopedRebind.counts.wholeSolidNativeHLREdges,
   indexed3DClassAttributed:actualAttributed,
   indexedSourceOwnersWithBoundedPaperDriftHeld:actualBoundedSourceOwners,
   allThreeViewsSourceOwnerAttributionWithHeldRounding:
    globalScopedRebind.allThreeViewsHaveNativeSourceFilterAttributionWithExplicitHeldPaperDrift,
   viewBijections:Object.fromEntries(['V','H','W'].map(view=>[view,{
    global:sourceAttribution[view].wholeSolidGeneratedEdgeCount,
    attributed:sourceAttribution[view].uniquelyExactIndexedOriginal3DClassAttributedGlobalEdgeCount,
    boundedPaperDriftHeld:sourceAttribution[view].native3DBoundedPaperDriftHeldButSourceFilterAttributedCount,
    complete:sourceAttribution[view].completeExactSourceScopedToWholeSolidOutputBijectionProven,
    sourceOwnerBijectionWithDriftHeld:
     sourceAttribution[view].completeNativeIndexedSourceFilterAttributionIncludingHeldPaperDrift
   }])),
   generated2DTopoDSParameterHistoryCertified:false,signedV5ActionCount:0
  }));
 const nativePhysical3DEndpoints=scopedConsumer.globalNativeHLROriginal3DEndpointLedger;
 const originalFaceAdjacency=cad.originalNativeFaceAdjacency;
 assert.equal(originalFaceAdjacency?.schema,
  'draftai-c1-original-occt-brep-face-edge-adjacency/1');
 assert.equal(originalFaceAdjacency.sourceGeometryId,geometry.id);
 assert.equal(originalFaceAdjacency.allOriginalBRepSourceEdgesNativeFaceAdjacencyVerified,true);
 assert.equal(originalFaceAdjacency.nativeBRepFacesChecked,geometry.data.faces.length);
 assert.equal(originalFaceAdjacency.nativeOriginalBRepSourceEdgesWithExactlyTwoVerifiedFaces,
  geometry.data.edges.length);
 assert.equal(originalFaceAdjacency.edges.length,geometry.data.edges.length);
 assert.equal(originalFaceAdjacency.generatedHLREdgeToOriginalTopoDSHistoryCertified,false);
 assert.equal(originalFaceAdjacency.signedV5ActionCount,0);
 const originalPhysicalTopology=cad.originalNativeVertexTopology;
 assert.equal(originalPhysicalTopology?.schema,
  'draftai-c1-original-occt-brep-vertex-physical-topology/1');
 assert.equal(originalPhysicalTopology.sourceGeometryId,geometry.id);
 assert.equal(originalPhysicalTopology.allReviewedOriginalSourceVerticesNativeTShapeVerified,true);
 const degrees=Object.fromEntries(Object.keys(geometry.data.points).map(id=>[id,0]));
 for(const edge of geometry.data.edges)for(const id of edge)degrees[id]++;
 // A sewn OCCT shell can expose each physical edge more than once during
 // TopExp traversal. Use the REAL native occurrence ledger, not a guessed
 // two-vertices-per-unique-M0-edge multiplicity.
 const nativeOccurrences=2*cad.occtOriginalEdgeOccurrenceCount;
 const actualVertexOccurrences=originalPhysicalTopology.originalM0VertexNativeOccurrenceCounts;
 assert.deepEqual(Object.keys(actualVertexOccurrences).sort(),
  Object.keys(degrees).filter(id=>degrees[id]>0).sort());
 for(const [id,degree] of Object.entries(degrees))if(degree>0)
  assert.ok(Number.isSafeInteger(actualVertexOccurrences[id])&&
   actualVertexOccurrences[id]>=degree);
 assert.equal(Object.values(actualVertexOccurrences).reduce((a,b)=>a+b,0),
  nativeOccurrences);
 const expectedOriginalNativeShared=Object.values(actualVertexOccurrences).reduce(
  (sum,n)=>sum+n*(n-1)/2,0);
 assert.equal(originalPhysicalTopology.originalBRepVertexOccurrencesChecked,nativeOccurrences);
 assert.equal(originalPhysicalTopology.originalSamePhysicalVertexTopoDSPairs,
  expectedOriginalNativeShared);
 assert.equal(originalPhysicalTopology.originalDistinctPhysicalVertexTopoDSPairs,
  nativeOccurrences*(nativeOccurrences-1)/2-expectedOriginalNativeShared);
 assert.equal(originalPhysicalTopology.generatedHLREdgeToOriginalTopoDSHistoryCertified,false);
 assert.equal(originalPhysicalTopology.signedV5ActionCount,0);
 assert.equal(nativePhysical3DEndpoints?.schema,
  'draftai-c1-global-generated-hlr-to-original-m0-3d-endpoint-junction-ledger/1');
 assert.equal(nativePhysical3DEndpoints.sourceGeometryId,geometry.id);
 assert.equal(nativePhysical3DEndpoints.revision,cad.revision);
 assert.equal(nativePhysical3DEndpoints.generated2DToOriginal3DNativeTopoDSVertexTopologyCertified,false);
 assert.equal(nativePhysical3DEndpoints.allOpaqueFaceOcclusionCertified,false);
 assert.equal(nativePhysical3DEndpoints.signedV5ActionCount,0);
 assert.equal(nativePhysical3DEndpoints.counts.globalGeneratedHLREdgesChecked,
  globalScopedRebind.counts.wholeSolidNativeHLREdges);
 // This checks genuine native 3D HLR source history against current M4
 // source/class/parameter, NOT generated 2D TopoDS edge history.
 assert.equal(
  nativePhysical3DEndpoints.counts.
   genuineGlobal3DSourceClassNativeParameterRangesMatchedCurrentM4+
  nativePhysical3DEndpoints.counts.
   genuineGlobal3DSourceClassNativeParameterRangesHeldCurrentM4,
  nativePhysical3DEndpoints.counts.globalGeneratedHLREdgesChecked);
 assert.equal(
  nativePhysical3DEndpoints.counts.
   genuineGlobal3DSourceClassNativeParameterRangesHeldCurrentM4,0,
  'real whole-solid native 3D HLR/M4 source interval mismatch');
 for(const view of ['V','H','W'])
  for(const row of nativePhysical3DEndpoints.views[view].rows){
   assert.equal(row.independentGlobal3DClassNativeParameterRangeMatchedCurrentM4,true);
   assert.equal(row.independentGlobal3DClassNativeParameterRangeMatchIsNotHLRHistory,true);
   assert.equal(row.signedV5Action,false);
  }
 assert.equal(nativePhysical3DEndpoints.counts.uniqueOriginalSourceGlobalEdgesExamined,
  globalScopedRebind.counts.wholeSolidEdgesWithExactlyOneSourceScopedPaperClaim);
 assert.equal(nativePhysical3DEndpoints.originalNativeOCCTHLRGeneratedVertexGraphCrossReferenced,true);
 assert.equal(nativePhysical3DEndpoints.originalNativeBRepPhysicalVertexTopologyVerified,true);
 assert.equal(nativePhysical3DEndpoints.originalNativeBRepFaceEdgeAdjacencyVerified,true);
 assert.equal(nativePhysical3DEndpoints.counts.originalBRepSourceEdgesWithNativeFaceAdjacencyVerified,
  geometry.data.edges.length);
 assert.equal(nativePhysical3DEndpoints.counts.originalBRepPhysicalJunctionPairsWithVerifiedNativeTShape,
  nativePhysical3DEndpoints.counts.originalModelPhysicalJunctionPairCandidates);
 assert.equal(
  nativePhysical3DEndpoints.counts.realNativeGeneratedVertexGraphPairsChecked,
  cad.nativeGeneratedVertexGraph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs+
  cad.nativeGeneratedVertexGraph.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs);
 if(geometry.id==='C1SkewTetra'){
  assert.equal(nativePhysical3DEndpoints.counts.nativeOriginalBRepExactPhysicalEndpointPairs,18);
  // Reversing the OCCT camera and orienting sewn faces outward can
  // legitimately change received binary64 endpoint rounding. Recompute
  // the complete partition instead of pinning stale 10/8 paper counts.
  assert.equal(nativePhysical3DEndpoints.counts.exactOriginalM0PaperEndpointPairs+
   nativePhysical3DEndpoints.counts.roundedOnlyOriginalM0PaperEndpointPairs,18);
  assert.ok(nativePhysical3DEndpoints.counts.strictlyClassBackedButRoundedOriginalM0PaperEndpoints>=0);
  assert.ok(nativePhysical3DEndpoints.counts.strictlyClassBackedButRoundedOriginalM0PaperEndpoints<=
   nativePhysical3DEndpoints.counts.roundedOnlyOriginalM0PaperEndpointPairs);
  assert.equal(nativePhysical3DEndpoints.counts.physicalOriginalM0EndpointRowsHeld,0);
 }else if(geometry.id==='C1rotated'){
  assert.equal(nativePhysical3DEndpoints.counts.roundedOnlyOriginalM0PaperEndpointPairs,0);
  assert.equal(nativePhysical3DEndpoints.counts.strictlyClassBackedButRoundedOriginalM0PaperEndpoints,0);
 }
 for(const view of ['V','H','W']){
  const e=nativePhysical3DEndpoints.views[view];
  assert.equal(e.rows.length,globalScopedRebind.views[view].length);
  assert.ok(e.rows.every(row=>
   row.generated2DToOriginalNativeTopoDSFullVertexTopologyCertified===false&&
   row.continuousAllOpaqueFaceVisibilityProven===false&&
   row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false&&
   row.original3DToGenerated2DEndpointWitnesses.every(w=>
    w.paperAndSourceProximityIsNotNativeVertexTopologyIdentity===true&&
    w.signedV5Action===false)));
  assert.ok(e.originalPhysicalEndpointPairCandidates.every(pair=>
   pair.actualNativeGeneratedTopoDSVertexIsSameForThisPairProven===false&&
   pair.original3DPhysicalVertexCoincidenceProvenFromIndependentM0===true&&
   pair.paperCoincidenceCannotSignEngineeringJunction===true&&
   pair.signedV5Action===false));
 }
 console.error('REAL C1 NATIVE GLOBAL HLR ORIGINAL 3D BREP ENDPOINT GRAPH '+
  geometry.id+': '+JSON.stringify(nativePhysical3DEndpoints.counts));
 assert.equal(globalScopedRebind.sourceGeometryId,geometry.id);
 assert.equal(globalScopedRebind.revision,cad.revision);
 assert.equal(globalScopedRebind.nativeGenerated2DOutputVsOriginal3DSourceClassesJointlyAccounted,true);
 assert.equal(globalScopedRebind.actualGlobalGeneratedEdgeToOriginalTopoDSHistoryCertified,false);
 assert.equal(globalScopedRebind.globalSceneM5OpaqueVisibilityCertified,false);
 assert.equal(globalScopedRebind.signedV5ActionCount,0);
 assert.equal(globalScopedRebind.counts.wholeSolidNativeHLREdges,
  ['V','H','W'].reduce((n,view)=>n+cad.views[view].length+
   cad.hiddenSharpViews[view].length,0));
 for(const view of ['V','H','W']){
  assert.equal(globalScopedRebind.views[view].length,
   cad.views[view].length+cad.hiddenSharpViews[view].length);
  for(const row of globalScopedRebind.views[view]){
   assert.equal(row.wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified,false);
   assert.equal(row.globalSceneOpaqueFaceVisibilityCertified,false);
   assert.equal(row.true3DAllEndpointJunctionsCertified,false);
   assert.equal(row.signedV5Action,false);
   assert.ok(row.originalSourceScopedCandidates.every(candidate=>
    candidate.sourceScopedGenerated2DAlreadyHasProvenOriginalTopoDSHistory===false&&
    candidate.actualWholeSolidGenerated2DOriginalTopoDSHistoryProven===false&&
    candidate.engineeringLineStyle==='undetermined'&&
    candidate.signedV5Action===false));
  }
 }
 console.error('REAL C1 WHOLE-SOLID GENERATED HLR TO ORIGINAL SOURCE FILTER '+
  geometry.id+': '+JSON.stringify(globalScopedRebind.counts));
 assert.equal(scopedConsumer.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(scopedConsumer.globalContinuousVisibilityCertified,false);
 assert.equal(scopedConsumer.formalEngineeringLineStyleCertified,false);
 assert.equal(scopedConsumer.signedV5ActionCount,0);
 assert.equal(scopedConsumer.nativeOriginal3DToM4ProjectionConsumerAvailable,true);
 assert.equal(scopedConsumer.nativeOriginal3DProjectionIsNotGenerated2DSourceHistory,true);
 assert.ok(scopedConsumer.counts.nativeOriginal3DM4SourceViewCandidates>0);
 assert.ok(scopedConsumer.counts.nativeOriginal3DM4ProjectedClassSegments>0);
 for(const view of ['V','H','W'])
  for(const row of scopedConsumer.views[view].nativeOriginal3DM4Candidates){
   assert.equal(row.sourceGeometryId,geometry.id);
   assert.equal(row.revision,cad.revision);
   assert.equal(row.native3DProvenanceIsNotGenerated2DHLREdgeIdentity,true);
   assert.equal(row.officialV5Authorized,false);
   assert.ok(row.segments.every(segment=>
    segment.derivedFromOriginalNative3DCurveNotGeneratedHLRPaper===true&&
    segment.generated2DHLREdgeTopologyProven===false&&
    segment.engineeringLineStyle==='undetermined'&&
    segment.signedV5Action===false));
  }
 // Each real source-scoped OCCT 2D generated edge now joins the
 // independent ORIGINAL 3D native curve parameter/visibility class by
 // exact rational original M0 source parameter. This does NOT prove the
 // generated whole-solid 2D TopoDS IsSame or continuous opaque-scene rays.
 assert.equal(scopedConsumer.counts.nativeSourceScoped2DGeneratedEdgesClassReconciledWith3D,
  scopedConsumer.counts.nativeSourceScoped2DEdgesExactlyBackedBySame3DClass+
  scopedConsumer.counts.nativeSourceScoped2DEdgesClassOrRoundingHeld);
 assert.equal(scopedConsumer.counts.nativeSourceScoped2DEdgesClassOrRoundingHeld,
  scopedConsumer.counts.nativeSourceScoped2DEdgesPreciselyHeldButULPBounded+
  scopedConsumer.counts.nativeSourceScoped2DEdgesBeyondOneULPOrWithoutWholeNativeClass);
 if(geometry.id==='C1SkewTetra'){
  // Native face orientation changes binary64 generated endpoints, not
  // the number of physical source/view rows. Recompute strict vs bounded
  // classification instead of freezing the historical 11/7 split.
  assert.equal(scopedConsumer.counts.nativeSourceScoped2DGeneratedEdgesClassReconciledWith3D,18);
  assert.equal(scopedConsumer.counts.nativeSourceScoped2DEdgesBeyondOneULPOrWithoutWholeNativeClass,0);
  assert.equal(scopedConsumer.counts.nativeSourceScoped2DEdgesExactlyBackedBySame3DClass+
   scopedConsumer.counts.nativeSourceScoped2DEdgesPreciselyHeldButULPBounded,18);
 }else if(geometry.id==='C1rotated'){
  assert.equal(scopedConsumer.counts.nativeSourceScoped2DEdgesPreciselyHeldButULPBounded,0);
  assert.equal(scopedConsumer.counts.nativeSourceScoped2DEdgesBeyondOneULPOrWithoutWholeNativeClass,0);
 }
 assert.ok(scopedConsumer.counts.nativeSourceScoped2DGeneratedEdgesClassReconciledWith3D>0);
 let checked2DClassBindings=0,checked2DClassEdges=0;
 for(const view of ['V','H','W']){
  const records=scopedConsumer.views[view].nativeScoped2D3DClassBindings;
  assert.equal(records.length,scopedConsumer.views[view].nativeOriginal3DM4Candidates.length);
  for(const binding of records){
   assert.equal(binding.schema,
    'draftai-c1-native-2d-generated-to-original-3d-source-class-consistency/1');
   const sourceM4=scopedConsumer.views[view].nativeOriginal3DM4Candidates.find(
    candidate=>candidate.sourceEdgeId===binding.sourceEdgeId);
   assert.ok(sourceM4,'real native 2D/3D class row must retain its original M0 source');
   const nativePartitionProven=
    sourceM4.native3DSourceParameterPartitionCompleteExactlyOnce===true&&
    sourceM4.M4OriginalUnitIntervalCandidateCoverageComplete===true&&
    sourceM4.native3DOriginalParameterPositiveGaps.length===0&&
    sourceM4.native3DOriginalParameterPositiveOverlaps.length===0&&
    sourceM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation.length===0;
   assert.equal(binding.originalNativeParameterPartitionIndependentlyVerified,
    nativePartitionProven,'real OCJS native parameter gaps cannot disappear in M4 2D class join');
   assert.ok(binding.rows.every(row=>
    row.originalNativeParameterPartitionIndependentlyVerified===nativePartitionProven&&
    (!nativePartitionProven?
     !row.nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment&&
     !row.generated2DRepresentationWithinOneULPOfFullOriginalM0Source:true)));
   assert.equal(binding.globalGenerated2DEdgeToOriginalTopoDSIdentityCertified,false);
   assert.equal(binding.wholeSceneM5Certified,false);
   assert.equal(binding.officialV5Authorized,false);
   checked2DClassBindings++;
   checked2DClassEdges+=binding.counts.scoped2DGeneratedEdgesChecked;
   assert.ok(binding.rows.every(row=>
    row.actualGlobalHLRGenerated2DTopoDSHistoryCertified===false&&
    row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false));
  }
 }
 assert.equal(checked2DClassBindings,
  scopedConsumer.counts.nativeOriginal3DM4SourceViewCandidates);
 assert.equal(checked2DClassEdges,
  scopedConsumer.counts.nativeSourceScoped2DGeneratedEdgesClassReconciledWith3D);
 const heldClassRows=['V','H','W'].flatMap(view=>
  scopedConsumer.views[view].nativeScoped2D3DClassBindings.flatMap(binding=>{
   const m4=scopedConsumer.views[view].nativeOriginal3DM4Candidates.find(
    candidate=>candidate.sourceEdgeId===binding.sourceEdgeId);
   return binding.rows.filter(row=>
    !row.nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment).map(row=>({
     view,sourceEdgeId:binding.sourceEdgeId,klass:row.hlrClass,
     paperRange:row.originalM0ExactRationalPaperInterval,
     aligned:row.exactOriginalM0PaperAffineCollinearity,
     withinSource:row.exactReceived2DPaperWithinOriginalSourceDomain,
     positive:row.exactPositive2DSourcePaperParameterSpan,
     sameClassCovered:row.exactSameClassNative3DSourceIntervalCoverage,
     oppositeClass:row.exactOppositeNative3DClassPositiveIntervalConflict,
     exactPositiveGaps:row.exactNative3DSourceClassPositivePaperCoverageGaps,
     nativeM4SourceClassRanges:m4.segments.map(s=>({
      klass:s.native3DHLRClass,range:s.originalM0UnitParameterRange
     })),
     heldNative3DSourceRanges:
      m4.M4ProjectedNative3DIntervalsHeldForBinary64Representation,
     oneULPFullSourceRoundingCompatible:row.
      generated2DRepresentationWithinOneULPOfFullOriginalM0Source,
     roundedOutputOnlyNotExactSourceParameterCoverage:row.
      roundedPaperEnvelopeCannotReplaceExactM0SourceParameterCoverage,
     actualSourceM0ProjectedEndpoints:(()=>{
      const edge=geometry.data.edges.find(e=>geometry.id+'::'+
       [...e].sort().join('|')===binding.sourceEdgeId);
      return edge.map(id=>project(geometry.data.points[id])[view]);
     })(),
     actualNativeSourceScoped2DPaperEdges:(()=>{
      const source=cad.nativeSourceScopedSharpOutputByView[view].rows.find(
       x=>x.originalPhysicalSourceEdgeId===binding.sourceEdgeId);
      return source[row.hlrClass==='visible-sharp'?'visible':'hidden'].map(
       item=>({from:item.from,to:item.to}));
     })()
   }));
  }));
 console.error('REAL C1 HELD 2D VS ORIGINAL 3D SOURCE CLASS REASONS '+
  geometry.id+': '+JSON.stringify(heldClassRows));
 console.error('REAL C1 SOURCE-FILTERED GENERATED 2D VS ORIGINAL 3D CLASS '+
  geometry.id+': '+JSON.stringify({
   sourceViews:checked2DClassBindings,
   generated2DEdges:checked2DClassEdges,
   exactlyBackedBySameNative3DClass:
    scopedConsumer.counts.nativeSourceScoped2DEdgesExactlyBackedBySame3DClass,
   classPaperOrBinary64Held:
    scopedConsumer.counts.nativeSourceScoped2DEdgesClassOrRoundingHeld,
   preciselyHeldButNativeSourceOneULPCompatible:
    scopedConsumer.counts.nativeSourceScoped2DEdgesPreciselyHeldButULPBounded,
   beyondOneULPOrWithoutFullNativeSourceClass:
    scopedConsumer.counts.nativeSourceScoped2DEdgesBeyondOneULPOrWithoutWholeNativeClass,
   oppositeNative3DClassPositiveOverlap:
    scopedConsumer.counts.nativeSourceScoped2DEdgesWithOpposite3DClassOverlap,
   officialV5:scopedConsumer.signedV5ActionCount
  }));

 console.error('REAL C1 M4 CONSUMER NATIVE 3D SOURCE PROJECTED '+geometry.id+': '+
  JSON.stringify({
   sourceViews:scopedConsumer.counts.nativeOriginal3DM4SourceViewCandidates,
   native3DProjectedClassSegments:
    scopedConsumer.counts.nativeOriginal3DM4ProjectedClassSegments,
   signedOfficialV5Actions:scopedConsumer.signedV5ActionCount
  }));

 for(const view of ['V','H','W'])
  for(const klass of ['visible','hidden'])
   for(const stroke of scopedConsumer.views[view][klass]){
    assert.equal(stroke.originalTopoDSHistoryProven,false);
    assert.equal(stroke.originalSourceParameterCoverageProven,false);
    assert.equal(stroke.continuousFrontRayProven,false);
    assert.equal(stroke.signedV5Action,false);
   }
 // Exercise the EXACT production paper overlap predicate on genuine native
 // OpenCascade.js visible AND hidden sharp segments, not only synthetic
 // adversarial fixtures. Reversal must not alter a positive native span.
 for(const view of ['V','H','W'])for(const seg of [
  ...cad.views[view],...cad.hiddenSharpViews[view]]){
  const collapsed=seg.from.u===seg.to.u&&seg.from.v===seg.to.v;
  assert.equal(exactPositiveCollinearPaperOverlap(
   seg.from,seg.to,seg.from,seg.to),!collapsed);
  assert.equal(exactPositiveCollinearPaperOverlap(
   seg.to,seg.from,seg.from,seg.to),!collapsed);
 }

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
 // This MUST execute inside the genuine pinned OCJS HLR process: no
 // mocked vertex handles, paper-only identity or fabricated history.
 assert.equal(cad.everyNativeGeneratedEndpointComparedToOriginalTopoDSVertices,true);
 assert.equal(cad.directNativeOriginalVertexIdentityDoesNotProveEdgeHistory,true);
 for(const view of ['V','H','W']){
  const actual=[...cad.views[view],...cad.hiddenSharpViews[view]];
  const direct=actual.flatMap(edge=>{
   assert.equal(edge.directNativeVertexOriginalSource.length,2);
   return edge.directNativeVertexOriginalSource;
  });
  assert.equal(cad.directNativeOriginalVertexMatches[view],
   direct.filter(p=>p.directOriginal3DVertexTopoDSIdentityProven).length);
  assert.ok(direct.every(p=>
   p.originalNativeTopoDSVertexOccurrencesCompared===
    2*cad.occtOriginalEdgeOccurrenceCount&&
   p.fullGeneratedHLREdgeToOriginalTopoDSHistoryProven===false&&
   p.officialEngineeringLineStyle==='undetermined'&&
   p.signedV5Action===false&&
   (p.directOriginal3DVertexTopoDSIdentityProven?
    typeof p.directlySameOriginalM0VertexId==='string':
    p.directlySameOriginalM0VertexId===null)));
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
 // End-to-end genuine WASM check: a native IsSame junction endpoint must
 // refer to an actual emitted HLR segment of the SAME view and visibility
 // class. Its ordinal is not a free-standing identity or a paper-only join.
 // The graph constructor independently enforces every input record's
 // exact array-index binding, including endpoints outside shared stars.
 for(const view of ['V','H','W']){
  const graphView=nativeGeneratedVertexGraph.views[view];
  const refs=[
   ...graphView.sameActualGeneratedOCCTTopoDSVertexPairs.flatMap(x=>[x.a,x.b]),
   ...graphView.paperCoincidentButDifferentTopoDSVertexPairs.flatMap(x=>[x.a,x.b]),
   ...graphView.generatedOCCTSharedNativeJunctionComponents.flatMap(x=>
    x.generatedSharpEdgeEndpoints)
  ];
  for(const ref of refs){
   assert.ok(ref.side==='from'||ref.side==='to');
   const segments=ref.hlrClass==='visible-sharp'?cad.views[view]:
    ref.hlrClass==='hidden-sharp'?cad.hiddenSharpViews[view]:null;
   assert.ok(segments,'genuine HLR class must have an emitted CAD array');
   assert.ok(Number.isSafeInteger(ref.nativeHLREdgeOrdinal)&&
    ref.nativeHLREdgeOrdinal>=0&&
    ref.nativeHLREdgeOrdinal<segments.length,
    'native junction endpoint must index an actual same-class CAD segment');
   const segment=segments[ref.nativeHLREdgeOrdinal];
   assert.equal(segment.occtHLRVisibilityClass,ref.hlrClass);
   assert.equal(segment.actualOCCTHLRFlattenedBRepLineVerified,true);
   assert.equal(segment.v5Authorized,false);
  }
 }

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
 // Independently consume EVERY actual WASM native interior split witness:
 // the same generated TopoDS junction must resolve to the exact same
 // original M0 3D source point and source parameter on EACH HLR stroke.
 // A co-projected alternative never supplies the source by array order.
 for(const star of nativeIsSame3D.completeGenuineNativeHLRJunctionStars.filter(s=>
  s.actualOCCTGeneratedHLRSourceEdgeInteriorSplit3DProven===true)){
  assert.ok(star.generatedHLREndpoints.length>=2);
  for(const ref of star.generatedHLREndpoints){
   const segments=ref.hlrClass==='visible-sharp'?cad.views[star.view]:
    ref.hlrClass==='hidden-sharp'?cad.hiddenSharpViews[star.view]:null;
   assert.ok(segments,'true native HLR class required');
   const seg=segments[ref.nativeHLREdgeOrdinal];
   assert.ok(seg,'native generated interior split must index emitted CAD');
   const matches=seg.sourceCandidate3DLifts.filter(lift=>
    lift.sourceEdgeId===star.source3DEdgeInteriorOriginalEdgeId&&
    (ref.side==='from'?lift.sourceParameterAtProjectedFrom:
     lift.sourceParameterAtProjectedTo)===star.source3DEdgeInteriorParameter);
   assert.equal(matches.length,1,'one exact original 3D source for each native split endpoint');
   assert.deepEqual(ref.nativePaperPoint,ref.side==='from'?seg.from:seg.to);
   assert.deepEqual(star.source3DEdgeInterior3DPoint,
    ref.side==='from'?matches[0].fromCandidate3D:matches[0].toCandidate3D);
   assert.equal(seg.v5Authorized,false);
  }
  assert.equal(star.originalOCCTGeneratedToSourceTopoDSEdgeHistoryRecovered,false);
  assert.equal(star.signedV5Action,false);
 }
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
  ['occtSourceCurveFirstPoint3D','occtSourceCurveLastPoint3D'].every(k=>
   ['x','y','z'].every(axis=>Number.isFinite(s[k]?.[axis])))&&
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
 // Independent EXACT M0 supporting-halfspace proof for every original
 // open edge; the actual native BRep face graph and source-filtered 3D
 // HLR class must agree. Generated 2D history/endpoint/M5 remain held.
 const exactOpenRays=audited.independentExactConvexOriginalOpenEdgeAllFaceRays;
 assert.equal(exactOpenRays.schema,
  'draftai-c1-exact-convex-original-open-edge-rays/1');
 assert.equal(exactOpenRays.sourceGeometryId,geometry.id);
 assert.equal(exactOpenRays.generated2DTopoDSHistoryCertified,false);
 assert.equal(exactOpenRays.originalClosedEndpointRayCertified,false);
 assert.equal(exactOpenRays.wholeSceneCoProjectedDepthCertified,false);
 assert.equal(exactOpenRays.signedV5ActionCount,0);
 assert.ok(Object.values(exactOpenRays.views).flat().every(row=>
  row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false));
 // A negative/zero incident face-ray is hidden behind the opaque tangent
 // face on the entire ORIGINAL open edge, provided actual source-scoped
 // native HLR agrees. This is not an endpoint or generated TopoDS claim.
 const tangentOpaqueRows=Object.values(exactOpenRays.views).flat()
  .filter(row=>row.originalOpenEdgeTangentOpaqueFaceBlockerCertified===true);
 assert.equal(exactOpenRays.counts.exactTangentOpaqueFaceBlockerRowsCertified,
  tangentOpaqueRows.length);
 assert.ok(tangentOpaqueRows.every(row=>
  row.exactOriginalOpenEdgeOpaqueFaceRayClass==='hidden-sharp'&&
  row.originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified===true&&
  row.originalClosedEndpointRayCertified===false&&
  row.generated2DTopoDSHistoryCertified===false&&
  row.wholeSceneCoProjectedDepthCertified===false&&
  row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false));
 if(geometry.id==='C1rotated')
  assert.ok(tangentOpaqueRows.length>0,
   'real pinned native HLR must corroborate convex tangent-face occlusion');
 if(geometry.id==='C1SkewTetra'){
  assert.equal(exactOpenRays.status,'audited');
  assert.equal(exactOpenRays.counts.exactOpenEdgeNativeClassAgreements,18);
  assert.equal(exactOpenRays.counts.heldSourceViewRows,0);
 }
 console.error('REAL C1 EXACT ORIGINAL OPEN-EDGE ALL-FACE RAYS '+
  geometry.id+': '+JSON.stringify(exactOpenRays.counts));
 assert.ok(audited.counts.m5AtomicIntervals>=9);
 assert.equal(Object.values(audited.views).length,3);
 assert.equal(Object.values(audited.views).flatMap(v=>v.intervals).length,
  audited.counts.m5AtomicIntervals);
 assert.ok(Object.values(audited.views).flatMap(v=>v.intervals).every(x=>
  x.engineeringLineStyle==='undetermined'&&x.signedV5===false));
 const independentOpenM5=Object.values(audited.views).flatMap(v=>v.intervals)
  .filter(x=>x.independentExactConvexOpenSourceAllFaceRayVisible===true);
 assert.equal(audited.counts.independentExactAllFaceOpenRayReboundToM5VisibleSource,
  independentOpenM5.length);
 assert.ok(independentOpenM5.every(x=>
  x.independentExactConvexOpenSourceRayWitness.
   originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified===true&&
  x.exactOpenRayCannotAuthorizeGenerated2DOrFormalM5===true&&
  x.signedV5===false&&x.engineeringLineStyle==='undetermined'));
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
 const sourceConflicts=Object.values(audited.views).flatMap(v=>v.intervals)
  .filter(x=>x.status==='positive-m5-vs-cad-conflict')
  .map(x=>({view:x.view,sourceEdgeId:x.sourceEdgeId,
   sourceRange:x.exactNativeOriginal3DSourceCoverage?.
    originalSourceParameterRange,
   sourceStatus:x.exactNativeOriginal3DSourceCoverage?.status,
   gaps:x.exactNativeOriginal3DSourceCoverage?.
    positiveLengthUncoveredIntervals}));
 assert.equal(audited.counts.positiveM5CadConflicts,0,
  'a real CAD source disagreement must block the formal V5: '+
   JSON.stringify(sourceConflicts));
 assert.equal(audited.counts.cadAndM5Corroborated,
  audited.counts.m5AtomicIntervals);
 // Historical CAD/paper proximity is NOT exact original TopoDS source
 // coverage. Genuine HLR micro-gaps remain separately recorded as
 // unsigned M0 source obligations, including a positive one-ULP gap.
 const exactSourceRows=Object.values(audited.views).flatMap(v=>v.intervals);
 const exactGapRows=exactSourceRows.filter(x=>
  x.realNativeOriginal3DSourceParameterCovered!==true);
 assert.equal(audited.counts.exactNative3DSourceParameterGapOrUnbound,
  exactGapRows.length);
 assert.equal(audited.counts.exactNative3DSourceParameterCovered+
  exactGapRows.length,audited.counts.m5AtomicIntervals);
 // The native ORIGINAL 3D source-scoped HLR proof is independent of the
 // received 2D generated HLR paper inverse. A genuine positive 2D inverse
 // gap must remain held even when the original native 3D visible class
 // covers the entire source. Never count that as generated history/V5.
 const native3DWholeVisible=exactSourceRows.filter(x=>
  x.independentSourceFilteredNative3DVisibleFullSourceProven===true);
 const inverseOnlyHeld=exactGapRows.filter(x=>
  x.paperInversePositiveGapDespiteCompleteNative3DVisibleSource===true);
 assert.equal(audited.counts.sourceFilteredNative3DWholeVisibleSourceCertified,
  native3DWholeVisible.length);
 assert.equal(audited.counts.paperInverseGapDespiteCompleteNative3DVisibleSource,
  inverseOnlyHeld.length);
 assert.ok(inverseOnlyHeld.every(x=>
  x.paperInverseGapRemainsUnclosedForGenerated2DAndM5===true&&
  x.generated2DTopoDSHistoryCertifiedByNative3DPartition===false&&
  x.exactNativeOriginal3DSourceCoverage.positiveLengthUncoveredIntervals.length>0&&
  x.signedV5===false&&x.engineeringLineStyle==='undetermined'));
 // Report CURRENT native-vs-paper discrepancies; the previous three
 // positive inverse gaps are a historical fixture, not an invariant under
 // real OCCT face-winding or observer-frame corrections.
 console.error('REAL C1 CURRENT PAPER-INVERSE VS FULL NATIVE 3D '+geometry.id+': '+
  JSON.stringify(inverseOnlyHeld.map(row=>({
   view:row.view,source:row.sourceEdgeId,
   positiveGaps:row.exactNativeOriginal3DSourceCoverage.
    positiveLengthUncoveredIntervals
  }))));

 // Genuine native source-filtered HLR paper coverage must be cross-checked
 // against independently lifted ORIGINAL 3D source intervals. A paper-only
 // full span can NEVER fill a positive native 3D gap or sign official V5.
 const paperOnlyGaps=exactSourceRows.filter(x=>
  x.sourceScopedPaperFullButNative3DPositiveGap===true);
 assert.equal(audited.counts.scopedPaperFullButNative3DPositiveGap,
  paperOnlyGaps.length);
 assert.ok(paperOnlyGaps.every(x=>
  x.realNativeOriginal3DSourceParameterCovered===false&&
  x.sourceScopedPaperCandidateCoverage?.entirePaperCandidateIntervalCovered===true&&
  x.sourceScopedPaperCandidateCoverage.actualOriginalTopoDSParameterHistoryProven===false&&
  x.signedV5===false&&x.engineeringLineStyle==='undetermined'));
 assert.ok(exactSourceRows.every(x=>
  x.sourceScopedPaperCandidateCoverage===null||
  x.sourceScopedPaperCandidateCoverage.signedV5Action===false));
 assert.ok(exactGapRows.every(x=>
  x.signedV5===false&&x.engineeringLineStyle==='undetermined'&&
  (x.exactNativeOriginal3DSourceCoverage?.status===
   'exact-original-3d-native-source-positive-gap'||
   x.exactNativeOriginal3DSourceCoverage?.status===
   'unreconstructable-original-3d-source-parameter')));

 // Rebind the ACTUAL missing native source-parameter tails to the original
 // M0 3D physical edge. Exact dyadic V/H/W span signs distinguish a genuine
 // positive source-space gap from a gap hidden by rounded paper interpolation.
 // This is an unsigned forensic report, not generated TopoDS history or V5.
 const originalGapForensics=exactGapRows.map(x=>{
  const gaps=x.exactNativeOriginal3DSourceCoverage?.
   positiveLengthUncoveredIntervals;
  if(!Array.isArray(gaps))return null;
  const proof=auditC1Original3DSourceGapDyadicWitness({
   geometry,view:x.view,sourceEdgeId:x.sourceEdgeId,
   uncoveredIntervals:gaps
  });
  assert.equal(proof.exact3DPositiveLengthGaps,gaps.length);
  assert.equal(proof.originalGeneratedTopoDSHistoryCertified,false);
  assert.equal(proof.globalContinuousVisibilityCertified,false);
  assert.equal(proof.signedV5ActionCount,0);
  return proof;
 });
 // ACTUAL original BRepAdaptor_Curve first/last parameter XYZ independently
 // fixes the native curve direction relative to the reviewed M0 edge t.
 // A positive native curve gap may round to a zero-length Number interval;
 // never fill a generated HLR source-history hole with this witness.
 const originalOcctCurveGapForensics=exactGapRows.map(x=>{
  const gaps=x.exactNativeOriginal3DSourceCoverage?.
   positiveLengthUncoveredIntervals;
  if(!Array.isArray(gaps))return null;
  const originalBRepSource=cad.originalBRepSourceEdges.find(source=>
   source.sourceEdgeId===x.sourceEdgeId);
  assert.ok(originalBRepSource,'real original BRep curve source required');
  const proof=auditC1OriginalOcctCurveParameterGapWitness({
   geometry,view:x.view,sourceEdgeId:x.sourceEdgeId,
   originalBRepSource,uncoveredIntervals:gaps
  });
  assert.equal(proof.gapsExamined,gaps.length);
  assert.ok(proof.rows.every(row=>
   row.exactOriginalOcctCurveParameterGapHasPositiveLength===true&&
   row.generatedHLREdgeToOriginalTopoDSHistoryCertified===false&&
   row.engineeringLineStyle==='undetermined'));
  assert.equal(proof.generatedHLREdgeToOriginalTopoDSHistoryCertified,false);
  assert.equal(proof.signedV5ActionCount,0);
  return proof;
 });
 // Independently inspect the ACTUAL generated HLR native vertex IsSame
 // witnesses at each unresolved original M0 source gap boundary. A paper
 // inverse t=0 is never promoted to a genuine original TopoDS A vertex.
 const nativeGeneratedVertexGapForensics=exactGapRows.map(x=>{
  const gaps=x.exactNativeOriginal3DSourceCoverage?.
   positiveLengthUncoveredIntervals;
  if(!Array.isArray(gaps))return null;
  const proof=auditC1NativeGapGeneratedVertexAdjacency({
   geometry,view:x.view,sourceEdgeId:x.sourceEdgeId,
   uncoveredIntervals:gaps,
   visibleSegments:cad.views[x.view],
   hiddenSegments:cad.hiddenSharpViews[x.view]
  });
  assert.equal(proof.rows.length,gaps.length);
  assert.ok(proof.rows.every(row=>
   row.sourceGapClosedByNativeEndpointEvidence===false&&
   row.engineeringLineStyle==='undetermined'));
  // Actual pinned OCJS HLR endpoints: an exact rational dominant-axis t
  // is not collinearity. Independent exact M0 cross-axis incidence must
  // partition all interior candidates, including subnormal and ULP drift.
  assert.equal(proof.actualNativeExactReceivedPaperOffLineEndpoints,
   proof.endpoints.filter(e=>
    e.exactReceivedPaperOnOriginalProjectedLine===false).length);
  // Recompute the candidate-on-original-line subranges from CURRENT
  // real native W/V/H paper output. A positive rational remainder is a
  // real open M5 paper gap, even when binary64 inverse t rounds to 0/1.
  // Candidate-only completeness still never authorizes generated history.
  assert.equal(proof.positiveOriginalM5GapsWithPartiallyCorroboratedExactCollinearPaperCandidates,
   proof.rows.filter(row=>
    row.exactReceivedCollinearPaperCandidateSubrangesWithoutSourceHistory.length>0).length);
  assert.equal(proof.positiveOriginalM5GapsWithExactCollinearPaperCandidateOnlyFullCoverage,
   proof.rows.filter(row=>
    row.positiveRationalGapResidualAfterCollinearPaperCandidates.length===0).length);
  assert.ok(proof.rows.every(row=>
   Array.isArray(row.positiveRationalGapResidualAfterCollinearPaperCandidates)&&
   Array.isArray(row.exactReceivedCollinearPaperCandidateSubrangesWithoutSourceHistory)&&
   row.originalPositiveM5GapRemainsUnclosedWithoutGeneratedTopoDSHistory===true&&
   row.sourceGapClosedByNativeEndpointEvidence===false));
  assert.ok(proof.endpoints.every(e=>
   !e.directNativeIsSameOriginalSourceEndpoint||
   e.exactReceivedPaperOnOriginalProjectedLine===true));
  for(const row of proof.rows){
   assert.equal(row.exactReceivedPaperCandidateStrictlyInsideGapCount,
    row.exactReceivedPaperCollinearCandidateStrictlyInsideGapCount+
    row.exactReceivedPaperOffLineCandidateStrictlyInsideGapCount);
   assert.ok(row.exactReceivedPaperCollinearCandidateAtGapFromCount<=
    row.exactReceivedPaperCandidateAtGapFromCount);
   assert.ok(row.exactReceivedPaperCollinearCandidateAtGapToCount<=
    row.exactReceivedPaperCandidateAtGapToCount);
  }
  // Genuine pinned WASM A-end gaps: partition inverse t=0 paper
  // candidates into literal original vertex points versus rounded aliases.
  // Neither class is generated-to-original TopoDS edge history.
  for(const row of proof.rows)for(const end of [row.from,row.to]){
   if(end.originalM0VertexId===null)continue;
   assert.equal(end.nativeGeneratedPaperCandidateParameterEqualCount,
    end.nativeGeneratedLiteralOriginalPaperBoundaryCount+
    end.nativeGeneratedRoundedInverseOriginalBoundaryAliasCount);
   assert.ok(end.directNativeOriginalVertexIsSameAtPaperParameterCount<=
    end.nativeGeneratedLiteralOriginalPaperBoundaryCount);
  }
  assert.equal(proof.generatedToOriginalTopoDSFullHistoryCertified,false);
  assert.equal(proof.signedV5ActionCount,0);
  return proof;
 });

 // Generic WHOLE M5 original-source inventory, including all positive
 // gaps (not just the three known skew-tetra A-end micro-gaps), and every
 // unreconstructable original subspan. These proof objects come from the
 // same real OCJS WASM calculation, never a user-supplied gap map.
 const allOriginalSourceNativeGapLedger=auditC1AllOriginalSourceNativeGaps({
  geometry,cad,m5Ledger:audited
 });
 const native3DM5=allOriginalSourceNativeGapLedger.native3DSourceViewLedger;
 assert.equal(native3DM5.availableFromActualPinnedOCJS,true);
 assert.equal(native3DM5.rows.length,3*geometry.data.edges.length);
 assert.equal(native3DM5.counts.projectedOriginalSourceViews,
  allOriginalSourceNativeGapLedger.originalM0CanonicalSourceInventory.
   counts.originalProjectedSourceViews);
 assert.equal(native3DM5.allNoncollapsedOriginalM0SourceViewsHaveCompleteNative3DPartition,true);
 assert.equal(native3DM5.counts.native3DProjectedSourceViewsWithPositiveGaps,0);
 assert.equal(native3DM5.counts.native3DProjectedSourceViewsWithPositiveOverlaps,0);
 assert.equal(native3DM5.generated2DTopoDSHistoryCertified,false);
 assert.equal(native3DM5.officialV5Authorized,false);
 console.error('REAL C1 M5 ORIGINAL NATIVE 3D VHW PARTITION '+geometry.id+': '+
  JSON.stringify(native3DM5.counts));

 // The genuine native 3D source-scoped HLR class is a NEGATIVE paper
 // candidate filter. Check the consumer on real pinned WASM data: it may
 // reject a false co-projected class, never certify surviving 2D ownership.
 const omittedClassRows=allOriginalSourceNativeGapLedger.
  unrepresentedM0NativeHLRCandidateForensics;
 const classVetoCounts={raw:0,compatible:0,excluded:0};
 for(const row of omittedClassRows){
  const veto=row.native3DClassPaperCandidateVeto;
  assert.equal(veto?.view,row.view);
  assert.equal(veto.sourceEdgeId,row.sourceEdgeId);
  assert.equal(veto.originalWholeSolidPaperCandidateCount,
   row.nativeHLRPaperCandidateCount);
  assert.equal(veto.fullOriginalSourceHistoryCertified,false);
  assert.equal(veto.globalContinuousVisibilityCertified,false);
  assert.equal(veto.signedV5Action,false);
  assert.equal(row.native3DClassCompatiblePaperCandidateCount,
   veto.native3DClassCompatiblePaperCandidates.length);
  assert.equal(row.native3DClassContradictoryPaperCandidateCount,
   veto.paperCandidatesExcludedByNative3DClassAbsence.length);
  classVetoCounts.raw+=veto.originalWholeSolidPaperCandidateCount;
  classVetoCounts.compatible+=veto.native3DClassCompatiblePaperCandidates.length;
  classVetoCounts.excluded+=veto.paperCandidatesExcludedByNative3DClassAbsence.length;
 }
 assert.equal(classVetoCounts.raw,classVetoCounts.compatible+classVetoCounts.excluded);
 console.error('REAL C1 NATIVE 3D CLASS PAPER CANDIDATE VETO '+geometry.id+': '+
  JSON.stringify(classVetoCounts));

 // Genuine pinned WASM CAD and the SAME M5 source gap ledger now feed an
 // independently recomputed, positive M0 exact convex observer-ray theorem.
 // This does not fill the missing native HLR generated TopoDS edges.
 const positiveOriginalGapRays=auditC1NativeGapOriginalExactRays({
  geometry,cad,m5Ledger:audited,scopedConsumer
 });
 assert.equal(
  positiveOriginalGapRays.nativeGenerated2DToOriginal3DHLRSourceClassEvidenceConsumed,
  true);
 assert.equal(positiveOriginalGapRays.actualWholeSolidGeneratedHLRSourceOrdinalCrosswalkConsumed,true);
 assert.equal(
  positiveOriginalGapRays.actualOriginal3DPhysicalEndpointGlobalHLRJunctionEvidenceConsumed,true);
 assert.equal(positiveOriginalGapRays.wholeSolidOriginal3DEndpointSourceViewMatches,
  positiveOriginalGapRays.wholeSolidGeneratedHLRSourceViewMatches);
 assert.equal(positiveOriginalGapRays.wholeSolidGeneratedHLRSourceViewMatches,
  globalScopedRebind.counts.wholeSolidEdgesWithUniqueExactScopedPaperAndStrict3DClassBacking+
  globalScopedRebind.counts.wholeSolidEdgesWithUniqueExactScopedPaperAndBounded3DClassRounding);
 assert.equal(
  positiveOriginalGapRays.realOriginalNativeHLRIndexedSourceViewClassesVerified,
  3*geometry.data.edges.length,
  'M4/M5 must consume every original 1-based native HLR source EdgeStatus');
 const heldM5=[
  ...positiveOriginalGapRays.missingOriginalM0SourceViewRows,
  ...positiveOriginalGapRays.rows
 ];
 for(const row of heldM5){
  const status=row.independentOriginalNativeHLREdgeStatusSource;
  assert.ok(status,'real native original HLR source status must reach each held M5 row');
  assert.equal(status.view,row.view);
  assert.equal(status.originalPhysicalSourceEdgeId,row.sourceEdgeId);
  assert.equal(status.generated2DHLREdgeToOriginalSourceHistoryCertified,false);
  assert.equal(status.globalContinuousM5OcclusionCertified,false);
  assert.equal(status.signedV5Action,false);
  assert.equal(row.nativeOriginalEdgeStatusDoesNotCloseGenerated2DSourceHistory,true);
  if(geometry.id==='C1SkewTetra'&&row.view==='W'&&
     ['C1SkewTetra::A|C','C1SkewTetra::A|D'].includes(row.sourceEdgeId)){
   assert.equal(status.originalSourceClass,'all-visible');
   assert.equal(status.nativeOriginalVisiblePartCount,1);
  }
  assert.equal(row.wholeSolidNativePaperSourceMatchDoesNotCloseM5OrProveTopoDSHistory,true);
  assert.equal(row.originalM0PhysicalEndpointEvidenceCannotReplaceNativeHLRJunctionIdentity,true);
  assert.equal(row.originalPhysicalJunctionAndGeneratedNativeIsSameCannotReplaceSceneM5,true);
  assert.ok(Array.isArray(row.wholeSolidGeneratedOriginal3DPhysicalNativeJunctionPairs));
  for(const pair of row.wholeSolidGeneratedOriginal3DPhysicalNativeJunctionPairs){
   assert.equal(pair.view,row.view);
   assert.ok(pair.originalPhysicalM0SourceEdges.includes(row.sourceEdgeId));
   assert.equal(pair.original3DPhysicalVertexProvenFromM0NotNativeHistory,true);
   assert.equal(pair.noIndependentGlobalOpaqueVisibilityOrGBLineJoinCertification,true);
   assert.equal(pair.signedV5Action,false);
   assert.ok(!(pair.generatedHLRNativeTopoDSIsSamePairProven&&
    pair.generatedHLRNativeTopoDSDistinctDespitePhysicalM0Join));
  }
  assert.equal(row.wholeSolidGeneratedHLROriginal3DEndpointWitnesses.length,
   row.wholeSolidGeneratedHLROriginalSourceFilterMatches.length);
  assert.ok(row.wholeSolidGeneratedHLROriginal3DEndpointWitnesses.length>0);
  for(const witness of row.wholeSolidGeneratedHLROriginal3DEndpointWitnesses){
   assert.equal(witness.sourceEdgeId,row.sourceEdgeId);
   assert.equal(witness.view,row.view);
   assert.equal(witness.nativeGenerated3DJunctionIdentityCertified,false);
   assert.equal(witness.globalOpaqueFaceOcclusionCertified,false);
   assert.equal(witness.signedV5Action,false);
   assert.equal(witness.generated2DEndpointOriginal3DVertexWitnesses.length,2);
  }
  assert.ok(row.wholeSolidGeneratedHLROriginalSourceFilterMatches.length>0);
  for(const claim of row.wholeSolidGeneratedHLROriginalSourceFilterMatches){
   assert.equal(claim.sourceEdgeId,row.sourceEdgeId);
   assert.equal(claim.view,row.view);
   assert.equal(claim.sourceScopedWholeGeneratedBinary64PaperExactlyMatched,true);
   assert.equal(claim.actualGeneratedToOriginalTopoDSHistoryCertified,false);
   assert.equal(claim.allOpaqueFaceOcclusionCertified,false);
   assert.equal(claim.signedV5Action,false);
  }
 }
 const unresolvedM5=auditC1M5UnresolvedGlobalSourceObligations({
  geometry,cad,positiveOriginalGapRays
 });
 assert.equal(unresolvedM5.allUnresolvedM5ObligationsExplicitlyPreserved,true);
 assert.equal(unresolvedM5.officialV5Authorized,false);
 assert.equal(unresolvedM5.signedV5ActionCount,0);
 assert.equal(unresolvedM5.counts.unresolvedM5Obligations,heldM5.length);
 assert.equal(unresolvedM5.records.length,heldM5.length);
 // The genuine native 3D source/index/source-filter evidence is consumed
 // at the very same still-unsigned M5 obligations. Bounds drift is counted
 // separately, never hidden inside strict exact lineage.
 const strictIndexedM5=unresolvedM5.records.filter(row=>
  row.independentlyExactIndexedOriginal3DSourceFilteredGlobalHLREdges.length>0);
 const roundedIndexedM5=unresolvedM5.records.filter(row=>
  row.boundedIndexedOriginal3DSourceFilteredGlobalHLREdgesHeld.length>0);
 assert.equal(unresolvedM5.counts.
  heldObligationsWithExactIndexedOriginal3DSourceFilterCausalEdges,
  strictIndexedM5.length);
 assert.equal(unresolvedM5.counts.
  heldObligationsWithBoundedIndexedOriginal3DPaperDriftCausalEdges,
  roundedIndexedM5.length);
 assert.equal(unresolvedM5.counts.
  heldExactIndexedOriginal3DSourceFilterCausalEdgeWitnesses,
  unresolvedM5.records.reduce((sum,row)=>sum+
   row.independentlyExactIndexedOriginal3DSourceFilteredGlobalHLREdges.length,0));
 assert.equal(unresolvedM5.counts.
  heldBoundedIndexedOriginal3DPaperDriftCausalEdgeWitnesses,
  unresolvedM5.records.reduce((sum,row)=>sum+
   row.boundedIndexedOriginal3DSourceFilteredGlobalHLREdgesHeld.length,0));
 assert.ok(unresolvedM5.records.every(row=>
  row.sourceOriginalTopoDSGeneratedHistoryCertified===false&&
  row.exactIndexedSourceFilterCausalityCannotSignPaperGapsOrM5===true&&
  row.generatedEdgeEngineeringLineStyle==='undetermined'&&
  row.signedV5Action===false));
 console.error('REAL WASM M5 held indexed source-filter causal claims '+geometry.id+
  ': '+JSON.stringify({
   heldM5Obligations:unresolvedM5.counts.unresolvedM5Obligations,
   exactOriginal3DClassSourceAttributions:strictIndexedM5.length,
   boundedPaperDriftSourceAttributionsHeld:roundedIndexedM5.length,
   stillUnsigned:true
  }));
 // The TWO real W-view tiny positive gaps must now independently join
 // original-indexed HLR visibility class, complete native source 3D
 // parameter bounds, full closed convex original vertex rays, and
 // exact M4 open-front ordering. They STILL retain positive 2D paper
 // residual and have NO formal GB/V5 generated-edge history.
 const wGaps=unresolvedM5.records.filter(r=>
  r.kind==='positive-original-m0-parameter-gap'&&r.view==='W');
 assert.equal(unresolvedM5.counts.WPositivePaperGapsWithRealNativeClosed3DJointProof,
  wGaps.filter(r=>r.WOriginalPhysicalNativeParameterClosedRayM4JointEvidence
   ?.jointOriginalClosedPhysicalSourceVisibilityProven===true).length);
 assert.equal(unresolvedM5.counts.WPositivePaperGapsWithOriginal3DJointProofHeld,
  wGaps.length-unresolvedM5.counts.WPositivePaperGapsWithRealNativeClosed3DJointProof);
 assert.equal(unresolvedM5.counts.WPositivePaperGapsWithReceivedGlobalWPaperEndpointDrift,
  wGaps.filter(r=>(r.WOriginalPhysicalNativeParameterClosedRayM4JointEvidence
   ?.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence
   ?.nativeGlobalWEdgesWithReceivedBinary64EndpointDrift??0)>0).length);
 const receivedW=wGaps.map(r=>
  r.WOriginalPhysicalNativeParameterClosedRayM4JointEvidence
   ?.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence);
 assert.ok(receivedW.every(p=>p&&
  p.nativeGlobalWGeneratedHLREdgesChecked===
   p.nativeGlobalWEdgesExactlyCollinearWithOriginalSource+
    p.nativeGlobalWEdgesWithTransverseBinary64PaperDrift&&
  p.receivedExactBinary64PaperCandidateCoverage
   ?.exactForReceivedBinary64PaperCoordinates===true&&
  p.receivedExactBinary64PaperCandidateCoverage
   ?.generatedToOriginalTopoDSHistoryCertified===false));
 assert.equal(unresolvedM5.counts.WPositivePaperGapsWithExactLongitudinalGlobalWPaperDrift,
  receivedW.filter(p=>p.nativeGlobalWEdgesWithReceivedBinary64EndpointDrift>0&&
   p.nativeGlobalWEdgesWithTransverseBinary64PaperDrift===0).length);
 assert.equal(unresolvedM5.counts.WPositivePaperGapsWithTransverseGlobalWPaperDrift,
  receivedW.filter(p=>p.nativeGlobalWEdgesWithTransverseBinary64PaperDrift>0).length);
 assert.equal(unresolvedM5.counts.WPositivePaperGapsWithExactLongitudinalGlobalWPaperDrift+
  unresolvedM5.counts.WPositivePaperGapsWithTransverseGlobalWPaperDrift,
  unresolvedM5.counts.WPositivePaperGapsWithReceivedGlobalWPaperEndpointDrift);
 console.error('REAL C1 W ORIGINAL SOURCE PAPER DRIFT EXACT CLASS '+
  geometry.id+': '+JSON.stringify(wGaps.map((r,i)=>({
   sourceEdgeId:r.sourceEdgeId,
   collinear:receivedW[i].nativeGlobalWEdgesExactlyCollinearWithOriginalSource,
   transverse:receivedW[i].nativeGlobalWEdgesWithTransverseBinary64PaperDrift,
   exactReceivedPaperGaps:receivedW[i].receivedExactBinary64PaperCandidateCoverage
    .exactBinary64PaperPositiveLengthUncoveredIntervals,
   M5PositiveGapStillHeld:true
  }))));
 assert.ok(wGaps.every(r=>{
  const joint=r.WOriginalPhysicalNativeParameterClosedRayM4JointEvidence;
  return joint?.view==='W'&&joint.sourceEdgeId===r.sourceEdgeId&&
   joint.generatedPaperGapStrictlyPositiveStillHeld===true&&
   joint.generated2DTopoDSHistoryCertified===false&&
   joint.globalOpaqueSceneContinuousVisibilityCertified===false&&
   joint.engineeringLineStyle==='undetermined'&&joint.signedV5Action===false;
 }));
 if(geometry.id==='C1SkewTetra'){
  assert.equal(wGaps.length,2,'both real SkewTetra W positive paper gaps must remain recorded');
  assert.equal(unresolvedM5.counts.WPositivePaperGapsWithRealNativeClosed3DJointProof,2,
   'real OCJS W original 3D closed-ray/parameter/depth proof must be complete on both paper gaps');
  assert.equal(unresolvedM5.counts.WPositivePaperGapsWithReceivedGlobalWPaperEndpointDrift,2,
   'real native OCJS must show two received W paper endpoint drifts without snapping');
  // Two-axis source geometry is stronger than dominant-axis inverse t.
  // A|C has exact longitudinal ULP tail; A|D falsely appears complete
  // on dominant axis while its received generated W line lies off-source.
  const strictW=Object.fromEntries(wGaps.map(r=>[
   r.sourceEdgeId,r.WOriginalPhysicalNativeParameterClosedRayM4JointEvidence
    ?.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence
    ?.receivedExactTwoAxisQualifiedPaperCoverage
  ]));
  const ac=strictW['C1SkewTetra::A|C'],ad=strictW['C1SkewTetra::A|D'];
  assert.equal(ac?.strictReceivedTwoAxisPaperCoverageComplete,false);
  assert.equal(ac?.transverseDisplacedGeneratedSegments,0);
  assert.deepEqual(ac?.exactTwoAxisQualifiedPaperCoverage
   ?.exactBinary64PaperPositiveLengthUncoveredIntervals,
   [['9007199254740991/9007199254740992','1']]);
  assert.equal(ad?.falseDominantAxisFullCoverageVetoed,true);
  assert.equal(unresolvedM5.counts.WPositivePaperGapsWithStrictTwoAxisPaperResidual,2);
  assert.equal(unresolvedM5.counts.WPositivePaperGapsWithFalseDominantAxisCompleteVeto,1);
  assert.equal(ad?.unsafeDominantAxisOnlyCoverage
   ?.exactBinary64PaperCandidateCoverageComplete,true);
  assert.equal(ad?.strictReceivedTwoAxisPaperCoverageComplete,false);
  assert.deepEqual(ad?.exactTwoAxisQualifiedPaperCoverage
   ?.exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1']]);
  assert.ok([ac,ad].every(x=>x?.generated2DTopoDSHistoryCertified===false&&
   x.globalOpaqueSceneContinuousOcclusionCertified===false&&
   x.signedV5Action===false));
  assert.ok(wGaps.every(r=>r.WOriginalPhysicalNativeParameterClosedRayM4JointEvidence
   ?.nativeGlobalGeneratedW2DPaperEndpointDriftEvidence
   ?.rows.every(x=>x.engineeringLineStyle==='undetermined'&&x.signedV5Action===false)));
  assert.deepEqual(new Set(wGaps.map(r=>r.sourceEdgeId)),
   new Set(['C1SkewTetra::A|C','C1SkewTetra::A|D']));
 }else assert.equal(wGaps.length,0);
 // Exercise the real same-run global GENERATED 3D HLR -> original BRep
 // source ledger at every held M5 paper candidate. A paper alias to a
 // different original edge cannot inherit its source curve parameter history.
 const nativeGlobal3D=unresolvedM5.records.map(r=>
  r.sameRunNativeGlobal3DSourceCurveAttribution);
 assert.ok(nativeGlobal3D.every(r=>
  r?.schema==='draftai-c1-m5-global-native-3d-original-source-join/1'&&
  r.sourceGeometryId===geometry.id&&r.revision===cad.revision&&
  r.globallyUnique3DBRepCurveSources===r.globalGeneratedEdgeCount&&
  r.claimCount===r.claims.length&&
  r.sourceCorroboratedClaims+r.differentOriginal3DSourceClaimsHeld+
   r.unknownGlobalOrdinalClaimsHeld===r.claimCount&&
  r.generated2DTopoDSHistoryCertified===false&&
  r.globalOpaqueSceneContinuousOcclusionCertified===false&&
  r.officialV5Authorized===false&&r.signedV5ActionCount===0));
 assert.equal(unresolvedM5.counts.obligationsWithNativeGlobal3DBRepCurveSource,
  nativeGlobal3D.filter(r=>r.sourceCorroboratedClaims>0).length);
 assert.equal(unresolvedM5.counts.globalNative3DSourceAliasedPaperCandidatesHeld,
  nativeGlobal3D.reduce((n,r)=>n+r.differentOriginal3DSourceClaimsHeld,0));
 assert.equal(unresolvedM5.counts.globalNative3DSourceClaimUnmatchedOrdinalsHeld,
  nativeGlobal3D.reduce((n,r)=>n+r.unknownGlobalOrdinalClaimsHeld,0));
 // The existing exact convex supporting-halfspace theorem now also
 // re-enters M5 as an ORIGINAL PHYSICAL closed-endpoint ray proof.
 // It is checked against real same-run OCCT BRep source endpoints and
 // global HLR paper witnesses, without claiming generated TShape lineage.
 const closedOriginal=unresolvedM5.records.filter(row=>
  row.originalPhysicalClosedEndpointRaysIndependentlyCertified===true);
 const exactPaper=closedOriginal.filter(row=>
  row.originalPhysicalClosedEndpointRaysWithExactGlobalHLRPaperEndpoints===true);
 const roundedPaper=closedOriginal.filter(row=>
  row.roundedOrUnresolvedGlobalHLREndpointPaperStillHeld===true);
 assert.equal(unresolvedM5.counts.originalPhysicalClosedEndpointRayRowsIndependentlyCertified,
  closedOriginal.length);
 assert.equal(unresolvedM5.counts.originalPhysicalClosedEndpointRayRowsWithExactGlobalHLRPaperEndpoints,
  exactPaper.length);
 assert.equal(unresolvedM5.counts.originalPhysicalClosedEndpointRayRowsWithRoundedGlobalHLRPaperEndpointsHeld,
  roundedPaper.length);
 assert.equal(exactPaper.length+roundedPaper.length,closedOriginal.length);
 assert.equal(unresolvedM5.counts.distinctOriginalPhysicalClosedEndpointRaySourceViews,
  new Set(closedOriginal.map(row=>row.view+'|'+row.sourceEdgeId)).size);
 assert.ok(closedOriginal.length>0,
  'real native WASM must exercise independent original CLOSED endpoint rays on held M5 source rows');
 assert.ok(unresolvedM5.records.every(row=>
  row.originalClosedEndpointRayProofOnlyCoversOneReviewedConvexSolid===true&&
  row.generatedHLRVertexTopoDSHistoryAndWholeSceneEndpointOcclusionStillUnproven===true&&
  row.generatedEdgeEngineeringLineStyle==='undetermined'&&row.signedV5Action===false));
 const newlyOpen=unresolvedM5.records.filter(row=>
  row.exactConvexOriginalOpenRayNativeHLRClassCorroborated===true&&
  row.independentOriginal3DAllFaceRayClass===null);
 assert.equal(
  unresolvedM5.counts.newlyCorroboratedOpenRaysWithoutClosedEndpointRayClass,
  newlyOpen.length);
 assert.equal(unresolvedM5.counts.obligationsWithExactConvexOpenRayAndNativeHLRClass,
  unresolvedM5.records.filter(row=>
   row.exactConvexOriginalOpenRayNativeHLRClassCorroborated===true).length);
 assert.ok(unresolvedM5.records.every(row=>
  row.exactConvexOpenRayDoesNotProveClosedEndpointsOrGeneratedHistory===true&&
  row.generatedEdgeEngineeringLineStyle==='undetermined'&&
  row.signedV5Action===false));
 if(geometry.id==='C1rotated')
  assert.ok(newlyOpen.length>0,
   'exact tangent-face ray proof must resolve previously unknown ORIGINAL open-ray classes');
 assert.ok(unresolvedM5.records.every(row=>
  row.nativeHLRClassContradictionNotAllowedToOverrideOriginalRay===true&&
  row.generatedHLRClassesDisagreeingWithOriginal3DRay.every(item=>
   ['visible-sharp','hidden-sharp'].includes(item.hlrClass))));
 assert.equal(unresolvedM5.counts.obligationsWithGlobalOriginalSourceAnd3DEndpoints,heldM5.length);
 assert.ok(unresolvedM5.records.every(row=>
  row.sourceOriginalTopoDSGeneratedHistoryCertified===false&&
  row.allOpaqueSceneContinuousOcclusionCertified===false&&
  row.generatedEdgeEngineeringLineStyle==='undetermined'&&
  row.signedV5Action===false));
 console.error('REAL C1 M5 UNRESOLVED WHOLE-SOLID SOURCE BREP BIJECTION '+
  geometry.id+': '+JSON.stringify(unresolvedM5.counts));
 console.error('REAL C1 M5 MISSING SOURCE AND POSITIVE PAPER GAPS WITH GLOBAL HLR ORDINAL SOURCES '+
  geometry.id+': '+JSON.stringify({
   missingOriginalSourceViews:positiveOriginalGapRays.missingOriginalM0SourceViewRows.length,
   nativePositiveGapIntervals:positiveOriginalGapRays.rows.length,
   missingOrGapRowsWithExactGlobalHLRFilteredSourceAndNative3DClass:
    heldM5.filter(row=>
     row.wholeSolidGeneratedHLROriginalSourceFilterMatches.length>0).length,
   original3DBRepEndpointMappedM5Rows:heldM5.filter(row=>
    row.wholeSolidGeneratedHLROriginal3DEndpointWitnesses.length>0).length,
   physicalM0OriginalJunctionCandidatePairs:
    nativePhysical3DEndpoints.counts.originalModelPhysicalJunctionPairCandidates,
   verifiedGeneratedNativeIsSamePhysicalM0JunctionPairs:
    nativePhysical3DEndpoints.counts.physicalOriginalJunctionPairsWithActualGeneratedTopoDSIsSame,
   generatedNativeDistinctDespiteM0SharedPhysicalVertex:
    nativePhysical3DEndpoints.counts.physicalOriginalJunctionPairsWithDistinctNativeTopoDSVertices,
   stillOfficialV5:positiveOriginalGapRays.signedV5ActionCount
  }));
 assert.equal(
  positiveOriginalGapRays.nativeGenerated2DToOriginal3DClassSourceViews,
  positiveOriginalGapRays.nativeOriginal3DM4SourceProjectedCount);
 assert.ok(positiveOriginalGapRays.missingOriginalM0SourceViewRows.every(row=>
  row.nativeScoped2DToOriginal3DClassWitness?.officialV5Authorized===false&&
  row.native2DClassWitnessCannotCloseMissingM5SourceRow===true&&
  row.missingM5SourceViewRemainsUncovered===true));
 assert.ok(positiveOriginalGapRays.rows.every(row=>
  row.nativeScoped2DToOriginal3DClassWitness?.officialV5Authorized===false&&
  row.native2DClassWitnessCannotCloseM5PaperGap===true&&
  row.nativeHLRGeneratedEdgeCoversGap===false));
 assert.equal(positiveOriginalGapRays.counts.positiveNativeGapIntervals,
  allOriginalSourceNativeGapLedger.totals.individualPositiveNativeGaps);
 assert.equal(positiveOriginalGapRays.counts.nativeGeneratedHistoryGapsClosed,0);
 assert.equal(positiveOriginalGapRays.counts.independentOriginalOCCTCurvePositiveGapIntervals,
  allOriginalSourceNativeGapLedger.totals.individualPositiveNativeGaps);
 assert.equal(positiveOriginalGapRays.officialV5Authorized,false);
 // EVERY real native 3D-backed M4 segment now passes through the
 // independent exact ORIGINAL 3D co-projected source depth audit.
 // This may prove local source front ordering, but NOT global face
 // occlusion, generated HLR TopoDS identity or formal V5.
 assert.equal(positiveOriginalGapRays.nativeOriginalM4Original3DDepthOrderRecomputed,true);
 const depthCounts=positiveOriginalGapRays.counts.realOriginalM4ToM5CoProjectedDepthCounts;
 assert.equal(depthCounts.sourceIntervalsExamined,
  scopedConsumer.counts.nativeOriginal3DM4ProjectedClassSegments);
 // Real pinned WASM must reconcile EVERY native-positive subspan that
 // cannot be represented as an M4 binary64 segment. It is held, not lost.
 assert.equal(depthCounts.native3DPositiveIntervalsHeldBeforeM4DepthForBinary64,
  scopedConsumer.counts.nativeOriginal3DM4PositiveIntervalsHeldForBinary64);
 assert.equal(depthCounts.sourceIntervalsExamined,
  depthCounts.sourceIntervalsWithFullOriginal3DDepthFrontOrdering+
  depthCounts.sourceIntervalsProvenBehindIndependentlyClearOriginalSource+
  depthCounts.sourceIntervalsHeldForDepthOrProjectedSplits);
 assert.equal(depthCounts.canonicalM4CutSourceIntervalsExamined,
  depthCounts.sourceIntervalsExamined);
 assert.equal(depthCounts.canonicalM4CutSubspansExamined,
  depthCounts.canonicalM4CutSubspansStrictlyFrontmost+
  depthCounts.canonicalM4CutSubspansWeakFrontWithClosedOriginalRay+
  depthCounts.canonicalM4CutSubspansWeakBehindVerifiedClosedFrontSource+
  depthCounts.canonicalM4CutSubspansSuppressedBehindVerifiedFrontSource+
  depthCounts.canonicalM4CutSubspansHeldForDepthOrTopology);
 assert.ok(depthCounts.canonicalM4CutSubspansExamined>=
  depthCounts.canonicalM4CutSourceIntervalsFullyPartitioned);
 assert.ok(depthCounts.canonicalM4CutSubspansWithStrictOriginal3DVertexOpenOrdering<=
  depthCounts.canonicalM4CutSubspansHeldForDepthOrTopology+
  depthCounts.canonicalM4CutSubspansWeakFrontWithClosedOriginalRay+
  depthCounts.canonicalM4CutSubspansWeakBehindVerifiedClosedFrontSource);
 assert.ok(depthCounts.canonicalM4CutSubspansWithRealVertexOpenFrontSourceOrdering+
  depthCounts.canonicalM4CutSubspansWithRealVertexOpenHiddenSourceOrdering<=
  depthCounts.canonicalM4CutSubspansWithStrictOriginal3DVertexOpenOrdering);
 assert.equal(depthCounts.canonicalM4CutSubspansWithWeakClosedPhysicalVertexFrontDepth+
  depthCounts.canonicalM4CutSubspansWithWeakClosedPhysicalVertexBehindDepth,
  depthCounts.canonicalM4CutSubspansWithWeakClosedPhysicalVertexSourceDepthOrder);
 assert.ok(depthCounts.canonicalM4CutSubspansWithWeakClosedPhysicalVertexSourceDepthOrder<=
  depthCounts.canonicalM4CutSubspansHeldForDepthOrTopology+
  depthCounts.canonicalM4CutSubspansWeakFrontWithClosedOriginalRay+
  depthCounts.canonicalM4CutSubspansWeakBehindVerifiedClosedFrontSource);
 assert.ok(depthCounts.canonicalM4CutSubspansWeakFrontWithClosedOriginalRay<=
  depthCounts.canonicalM4CutSubspansWithWeakClosedPhysicalVertexFrontDepth);
 assert.ok(depthCounts.canonicalM4CutSubspansWeakBehindVerifiedClosedFrontSource<=
  depthCounts.canonicalM4CutSubspansWithWeakClosedPhysicalVertexBehindDepth);
 assert.ok(depthCounts.canonicalM4CutPositiveOriginal3DSubpixelProjectionIntervalsHeld<=
  depthCounts.canonicalM4CutSubspansHeldForDepthOrTopology);
 // The rotated convex genuine WASM fixture has four original shared
 // 3D vertex depth ties and positive one-ULP M4 source tails. Distinct
 // received binary64 paper endpoints now enter the exact affine depth
 // consumer, instead of being discarded by a 1e-8 mm length threshold.
 // This never grants HLR generated-edge lineage, GB style or V5 authority.
 if(geometry.id==='C1rotated'){
  assert.ok(depthCounts.canonicalM4CutSubspansWithStrictOriginal3DVertexOpenOrdering>=4);
  assert.ok(depthCounts.canonicalM4CutSubspansWithRealVertexOpenFrontSourceOrdering+
   depthCounts.canonicalM4CutSubspansWithRealVertexOpenHiddenSourceOrdering>=4);
  assert.equal(depthCounts.canonicalM4CutPositiveOriginal3DSubpixelProjectionIntervalsHeld,0);
  // Original source-depth weak-closed vertex ties are NOT closed endpoint
  // observer-ray proofs, global HLR history or engineering-line signoff.
  assert.ok(depthCounts.canonicalM4CutSubspansWithWeakClosedPhysicalVertexSourceDepthOrder>=4);
  // Require a genuine positive same-run M0/native/endpoint-ray join;
  // otherwise this is only an added diagnostic field, not M4 progress.
  assert.ok(depthCounts.canonicalM4CutSubspansWeakFrontWithClosedOriginalRay>0);
  // Genuine pinned WASM must exhibit a positive independently closed
  // front-peer witness, not merely an extra diagnostic field.
  assert.ok(depthCounts.canonicalM4CutSubspansWeakBehindVerifiedClosedFrontSource>0);
 }
 for(const item of [
  ...positiveOriginalGapRays.missingOriginalM0SourceViewRows,
  ...positiveOriginalGapRays.rows]){
  assert.equal(item.originalM4DepthOrderDoesNotConstituteGlobalSceneVisibility,true);
  assert.ok(item.nativeOriginalM4CoProjectedDepthOrder.length>0);
  assert.ok(item.nativeOriginalM4CoProjectedDepthOrder.every(row=>
   row.originalSourceCompetitionOnlyNotWholeOpaqueSceneVisibility===true&&
   row.generated2DHLREdgeTopologyProven===false&&
   Array.isArray(row.canonicalOriginalM4EventCutDepthRows)&&
   row.canonicalOriginalM4EventCutDepthRows.length>0&&
   row.canonicalOriginalM4EventCutDepthRows.every(cut=>
    cut.originalM4EventPaperOnlyIsNot3DPhysicalJunction===true&&
    cut.openIntervalSourceOrderCannotCertifyClosedOriginalVertices===true&&
    cut.weakClosedDepthDoesNotAuthorizeClosedEndpointRayOrV5===true&&
    cut.weakFrontWithOriginalClosedRayCannotCertifyGeneratedHLROrV5===true&&
    cut.weakBehindSourceSuppressionDoesNotCertifyHiddenEndpointOrV5===true&&
    (cut.weakBehindWithIndependentClosedClearFrontSource!==true||
     cut.coProjectedOriginal3DDepthOrder.
      exactClosedWeakSourceDepthBehindOpenRayClearPeerAtPhysicalVertexTie===true)&&
    (cut.weakFrontWithIndependentOriginalClosedEndpointRay!==true||
     cut.coProjectedOriginal3DDepthOrder.
      exactClosedWeakSourceDepthFrontmostOnlyAtTruePhysicalVertexTies===true)&&
    cut.weakClosedOriginalSourceDepthFrontWithOnlyPhysicalVertexTies===
     (cut.coProjectedOriginal3DDepthOrder.
      exactClosedWeakSourceDepthFrontmostOnlyAtTruePhysicalVertexTies===true)&&
    cut.weakClosedOriginalSourceDepthBehindClearOpenRayPeerWithPhysicalVertexTie===
     (cut.coProjectedOriginal3DDepthOrder.
      exactClosedWeakSourceDepthBehindOpenRayClearPeerAtPhysicalVertexTie===true)&&
    cut.strictlyFrontmostAmongOriginal3DSourcesOnOpenIntervalOnly===
     (cut.coProjectedOriginal3DDepthOrder.
       entireOpenIntervalStrictlyInFrontOfAllOriginalCoProjectedSources===true)&&
    cut.hiddenBehindIndependentlyClearOriginalSourceOnOpenIntervalOnly===
     (cut.coProjectedOriginal3DDepthOrder.
       entireOpenIntervalBehindIndependentlyClearOriginalCoProjectedSource===true)&&
    cut.engineeringLineStyle==='undetermined'&&cut.signedV5Action===false)&&
   row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false));
 }
 console.error('REAL C1 EXACT ORIGINAL M4->M5 COPROJECTED DEPTH '+
  geometry.id+': '+JSON.stringify(depthCounts));
 // Emit evidence for EVERY genuinely unresolved canonical M4 subspan.
 // Compact provenance only; no diagnostic result is treated as M5 signoff.
 console.error('REAL C1 ORIGINAL M4 HELD COPROJECTED SUBSPANS '+
  geometry.id+': '+JSON.stringify([
   ...positiveOriginalGapRays.missingOriginalM0SourceViewRows,
   ...positiveOriginalGapRays.rows].flatMap(row=>
    row.nativeOriginalM4CoProjectedDepthOrder.flatMap(seg=>
     seg.canonicalOriginalM4EventCutDepthRows
      .filter(cut=>!cut.coProjectedOriginal3DDepthOrder.
       wholeIntervalFrontmostCertified&&
       !cut.coProjectedOriginal3DDepthOrder.visibleSourceCoversEntireLine)
      .map(cut=>({
       view:row.view,sourceEdgeId:row.sourceEdgeId,
       cut:cut.originalM4SourceCutParameterRange,
       status:cut.coProjectedOriginal3DDepthOrder.status,
       comparisons:cut.coProjectedOriginal3DDepthOrder.comparisons.map(c=>({
        peer:c.peerSourceEdgeId,status:c.status,
        signs:c.exactBinary64RationalOriginalDepthDifferenceEndSigns??null,
        exactFullPaperOverlap:c.exactOriginalSourceWholePaperOverlapProven??null
       }))
      }))
    ))
  ));

 // M5 now consumes actual M4 candidates constructed from source-filtered
 // ORIGINAL native 3D parameters, not the inverse of generated HLR paper.
 assert.equal(positiveOriginalGapRays.nativeOriginal3DM4SourceProjectionAvailable,true);
 assert.equal(positiveOriginalGapRays.nativeOriginal3DM4SourceProjectedCount,
  positiveOriginalGapRays.counts.noncollapsedOriginalM0SourceViews);
 assert.equal(positiveOriginalGapRays.counts.
  missingM5SourceViewsWithCompleteOriginalNativeM4Projection,
  positiveOriginalGapRays.counts.unrepresentedOriginalM0SourceViews);
 assert.equal(positiveOriginalGapRays.counts.
  positivePaperM5GapIntervalsCoveredByOriginalNativeM4Projection,
  positiveOriginalGapRays.counts.positiveNativeGapIntervals);
 assert.ok(positiveOriginalGapRays.missingOriginalM0SourceViewRows.every(row=>
  row.nativeOriginal3DM4SourceProjectionPresent===true&&
  row.nativeOriginal3DM4ProjectionWholeSourceCoverage===true&&
  row.native3DM4ProjectedCandidateSegments.length>0&&
  row.native3DM4CandidateDoesNotCertifyGenerated2DHistory===true&&
  row.missingM5SourceViewRemainsUncovered===true&&
  row.signedV5Action===false));
 assert.ok(positiveOriginalGapRays.rows.every(row=>
  row.nativeOriginal3DM4GapSourceProjectionAvailable===true&&
  row.realNative3DM4OriginalParameterGapCoverage.
   entireOriginalParameterIntervalCovered===true&&
  row.nativeHLRGeneratedEdgeCoversGap===false&&
  row.signedV5Action===false));
 console.error('REAL C1 M4 TO M5 NATIVE SOURCE RECONCILIATION '+geometry.id+': '+
  JSON.stringify({
   allProjectedM0SourceViews:
    positiveOriginalGapRays.nativeOriginal3DM4SourceProjectedCount,
   missingM5SourceViewsWithFull3DBackedM4Projection:
    positiveOriginalGapRays.counts.
     missingM5SourceViewsWithCompleteOriginalNativeM4Projection,
   positiveM5PaperGapIntervalsWithFull3DBackedM4Projection:
    positiveOriginalGapRays.counts.
     positivePaperM5GapIntervalsCoveredByOriginalNativeM4Projection,
   officialV5Actions:positiveOriginalGapRays.signedV5ActionCount
  }));

 // Reconcile every REAL source-filtered 3D HLR visibility class with its
 // independent full original M0 ray theorem, not just the omitted source
 // rows or positive native gaps. Concordance never grants generated 2D
 // edge ownership, global frontmost ordering or official V5.
 const nativeRayConcordance=positiveOriginalGapRays.native3DOriginalRayClassConcordance;
 assert.equal(nativeRayConcordance.schema,
  'draftai-c1-native-3d-original-ray-class-concordance/1');
 assert.equal(nativeRayConcordance.actualNativeSourceScopedHLRAvailable,true);
 assert.equal(nativeRayConcordance.counts.projectedOriginalSourceViewsExamined,
  allOriginalSourceNativeGapLedger.native3DSourceViewLedger.counts.
   projectedOriginalSourceViews);
 assert.ok(nativeRayConcordance.rows.every(row=>
  row.originalToGenerated2DTopoDSHistoryCertified===false&&
  row.globalCoProjectedVisibilityCertified===false&&
  row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false));
 assert.equal(nativeRayConcordance.officialV5Authorized,false);
 // For both real convex controls, ALL noncollapsed ORIGINAL 3D source
 // ranges are accounted for by native source-filtered HLR, despite the
 // still unsigned canonical 2D/M5 source omissions and rounded gaps.
 // This isolates the remaining 2D provenance/depth/junction blocker.
 const native3DCovered=
  allOriginalSourceNativeGapLedger.native3DSourceViewLedger.
   allNoncollapsedOriginalM0SourceViewsHaveCompleteNative3DPartition;
 if(native3DCovered){
  assert.equal(positiveOriginalGapRays.counts.
   missingM5SourceViewsWithCompleteNative3DParameterPartition,
   positiveOriginalGapRays.counts.unrepresentedOriginalM0SourceViews);
  assert.equal(positiveOriginalGapRays.counts.
   positivePaperM5GapIntervalsWithCompleteNative3DSourcePartition,
   positiveOriginalGapRays.counts.positiveNativeGapIntervals);
 }
 console.error('REAL C1 NATIVE 3D SOURCE COMPLETE, M5 PAPER STILL HELD '+
  geometry.id+': '+JSON.stringify({
   native3DAllProjectedSourcePartitionsComplete:native3DCovered,
   missingM5SourceViewsWithCompleteNative3DSourcePartition:
    positiveOriginalGapRays.counts.
     missingM5SourceViewsWithCompleteNative3DParameterPartition,
   positiveM5PaperGapIntervalsWithCompleteNative3DSourcePartition:
    positiveOriginalGapRays.counts.
     positivePaperM5GapIntervalsWithCompleteNative3DSourcePartition,
   signedV5Actions:positiveOriginalGapRays.signedV5ActionCount
  }));

 console.error('REAL C1 NATIVE 3D/M0 RAY CLASS CONCORDANCE '+geometry.id+': '+
  JSON.stringify(nativeRayConcordance.counts));

 assert.ok(positiveOriginalGapRays.rows.every(row=>
  row.originalSourceParameterGap[0]<row.originalSourceParameterGap[1]&&
  row.nativeHLRGeneratedEdgeCoversGap===false&&
  row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false));

 const jointClassCounts=positiveOriginalGapRays.counts.
  omittedNativeHLRPaperCandidateDiagnostics;
 const nativeClassRejected=allOriginalSourceNativeGapLedger.
  unrepresentedM0NativeHLRCandidateForensics.reduce((n,row)=>
   n+row.native3DClassContradictoryPaperCandidateCount,0);
 assert.equal(jointClassCounts.native3DClassExcludedPaperAliases,nativeClassRejected);
 assert.equal(jointClassCounts.native3DAndRayCompatiblePaperFullSourceViews+
  jointClassCounts.native3DAndRayCompatiblePaperPositiveGapSourceViews,
  positiveOriginalGapRays.missingOriginalM0SourceViewRows.length);
 assert.equal(jointClassCounts.native3DAndRayCompatiblePaperCandidateCount,
  positiveOriginalGapRays.missingOriginalM0SourceViewRows.reduce((n,row)=>
   n+row.native3DAndRayCompatibleCandidateCount,0));
 assert.ok(jointClassCounts.native3DAndRayCompatiblePaperConflictSourceViews<=
  jointClassCounts.rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews);
 assert.ok(positiveOriginalGapRays.missingOriginalM0SourceViewRows.every(row=>
  row.native3DClassVetoIsNotOriginalGeneratedTopoDSHistory===true&&
  row.generatedTopoDSToOriginalSourceHistoryCertified===false&&
  row.signedV5Action===false));
 console.error('REAL C1 NATIVE 3D SOURCE CLASS AND M0 EXACT RAY JOIN '+geometry.id+': '+
  JSON.stringify({
   rawPaperCandidates:jointClassCounts.examined,
   native3DClassRejected:nativeClassRejected,
   rayClassRejected:jointClassCounts.rayExcludedOppositeHLRClassPaperAliases,
   bothCompatibleCandidates:jointClassCounts.native3DAndRayCompatiblePaperCandidateCount,
   bothCompatiblePaperFullSourceViews:
    jointClassCounts.native3DAndRayCompatiblePaperFullSourceViews,
   bothCompatiblePaperConflictSourceViews:
    jointClassCounts.native3DAndRayCompatiblePaperConflictSourceViews,
   signedV5Actions:0
  }));

 console.error('REAL C1 POSITIVE ORIGINAL SOURCE RAYS ON NATIVE HLR GAPS '+
  geometry.id+': '+JSON.stringify({
   counts:positiveOriginalGapRays.counts,
   gaps:positiveOriginalGapRays.rows.map(row=>({
    view:row.view,source:row.sourceEdgeId,
    gap:row.originalSourceParameterGap,
    exactM0Ray:row.independentOriginal3DExactRayStatus,
    nativeHLRHistoryClosed:false
   }))
  }));
 const fullM5SourceSpanCount=['V','H','W'].reduce((n,view)=>
  n+audited.views[view].intervals.length,0);
 assert.equal(allOriginalSourceNativeGapLedger.totals.currentM5SourceSpans,
  fullM5SourceSpanCount);
 assert.equal(allOriginalSourceNativeGapLedger.rows.length,
  fullM5SourceSpanCount);
 assert.equal(allOriginalSourceNativeGapLedger.allCurrentM5SourceSpansAccountedFor,true);
 // Independently require complete M0 [0,1] inventory accounting from
 // the SAME pinned real WASM C1 M5 rows. This is not native HLR history.
 const originalInventory=allOriginalSourceNativeGapLedger.
  originalM0CanonicalSourceInventory;
 assert.equal(originalInventory.rows.length,
  originalInventory.counts.originalProjectedSourceViews);
 assert.equal(originalInventory.counts.originalProjectedSourceViews,
  originalInventory.counts.sourceViewsWithCompleteCanonicalM5ParameterInventory+
  originalInventory.rows.filter(row=>
   !row.wholeOriginalM0SourceParameterInventoryComplete).length);
 assert.ok(originalInventory.rows.every(row=>
  row.nativeGeneratedTopoDSToOriginalSourceHistoryCertified===false&&
  row.globalContinuousVisibilityCertified===false&&
  row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false));
 assert.equal(originalInventory.officialV5Authorized,false);
 console.error('REAL C1 ORIGINAL M0 CANONICAL M5 PARAMETER INVENTORY '+
  geometry.id+': '+JSON.stringify(originalInventory.counts));
 const absentM0=allOriginalSourceNativeGapLedger.unrepresentedOriginalM0ProjectedSources;
 assert.equal(originalInventory.counts.sourceViewsWithNoM5Rows,absentM0.length);
 assert.equal(allOriginalSourceNativeGapLedger.allNoncollapsedOriginalM0SourcesRepresentedInCurrentM5,
  absentM0.length===0);
 assert.ok(absentM0.every(x=>['V','H','W'].includes(x.view)&&
  x.sourceEdgeId.startsWith(geometry.id+'::')&&
  x.engineeringLineStyle==='undetermined'&&x.signedV5Action===false&&
  !audited.views[x.view].intervals.some(row=>row.sourceEdgeId===x.sourceEdgeId)));
 const missingM5HLRCandidates=
  allOriginalSourceNativeGapLedger.unrepresentedM0NativeHLRCandidateForensics;
 assert.equal(missingM5HLRCandidates.length,absentM0.length);
 assert.ok(missingM5HLRCandidates.every(x=>
  x.paperCandidateDoesNotProveOriginalTopoDSHistory===true&&
  x.continuousOcclusionCertified===false&&
  x.engineeringLineStyle==='undetermined'&&x.signedV5Action===false&&
  x.nativeHLRPaperCandidateCount===x.nativeHLRPaperCandidates.length));
 // The REAL pinned OCCT WASM result must now join every absent M0
 // source/view to its independently recomputed exact original 3D ray.
 // Candidate paper aliases are diagnostic only, even when ray-clear.
 const missingOriginalRays=positiveOriginalGapRays.missingOriginalM0SourceViewRows;
 const key=x=>x.view+'|'+x.sourceEdgeId;
 assert.deepEqual(missingOriginalRays.map(key).sort(),absentM0.map(key).sort());
 assert.equal(positiveOriginalGapRays.counts.unrepresentedOriginalM0SourceViews,
  absentM0.length);
 assert.equal(positiveOriginalGapRays.counts.noncollapsedOriginalM0SourceViews,
  positiveOriginalGapRays.counts.representedOriginalM0SourceViewsInM5+
  absentM0.length);
 // Recompute exact dyadic paper incidence/domain and independently classify
 // native source-owned HLR visibility against the original 3D ray theorem.
 // These are forensic obligations, never a generated TopoDS history bridge.
 const candidateDiagnostics=
  positiveOriginalGapRays.counts.omittedNativeHLRPaperCandidateDiagnostics;
 assert.equal(candidateDiagnostics.examined,
  missingOriginalRays.reduce((sum,x)=>sum+x.nativeHLRPaperCandidateCount,0));
 assert.equal(candidateDiagnostics.examined,
  candidateDiagnostics.exactAffineAligned+candidateDiagnostics.exactAffineDrift);
 assert.equal(candidateDiagnostics.examined,
  candidateDiagnostics.nativeEndpoint3DContradictoryPaperAliases+
  candidateDiagnostics.nativeEndpoint3DConsistentPaperAliases+
  candidateDiagnostics.nativeEndpoint3DUnknownPaperAliases);
 const nativeEndpoint3DContradictions=missingOriginalRays.flatMap(row=>
  row.nativeHLRCandidateExactBinary64AndRayDiagnostics.
   filter(x=>x.nativeEndpoint3DSourceStatus===
    'contradicted-by-native-original-vertex').
   map(x=>({view:row.view,sourceEdgeId:row.sourceEdgeId,
    hlrClass:x.hlrClass,ordinal:x.ordinal,
    nativeOriginal3DVertexContradictionCount:
     x.nativeOriginal3DVertexContradictionCount})));
 assert.equal(nativeEndpoint3DContradictions.length,
  candidateDiagnostics.nativeEndpoint3DContradictoryPaperAliases);
 console.error('REAL C1 NATIVE ORIGINAL 3D VERTEX VETO OF PAPER ALIASES '+
  geometry.id+': '+JSON.stringify(nativeEndpoint3DContradictions));
 assert.ok(candidateDiagnostics.nativeOwnerRayClassConsistent+
  candidateDiagnostics.nativeOwnerRayClassContradictions<=
  candidateDiagnostics.nativeIsSameOwnerClaims);
 assert.equal(candidateDiagnostics.paperAliasExactFullSourceViewCoverage+
  candidateDiagnostics.paperAliasExactPositiveGapSourceViews,
  missingOriginalRays.length);
 assert.equal(candidateDiagnostics.nativeScopedOwnerExactFullSourceViewCoverage+
  candidateDiagnostics.nativeScopedOwnerExactPositiveGapSourceViews,
  missingOriginalRays.length);
 assert.equal(candidateDiagnostics.exactPaperVisibleHiddenPositiveConflictSourceViews,
  missingOriginalRays.filter(row=>
   row.exactBinary64PaperVisibleHiddenCandidateConflict.
    hasExactPositiveLengthVisibleHiddenPaperClassConflict).length);
 // A genuine whole-original-3D convex ray can EXCLUDE an opposite-class
 // paper alias as this physical source, while retaining the original HLR
 // class conflict and leaving native TopoDS history/V5 unsigned.
 assert.equal(candidateDiagnostics.rayExcludedOppositeHLRClassPaperAliases,
  missingOriginalRays.reduce((n,row)=>n+
   row.nativeHLRCandidateExactBinary64AndRayDiagnostics.filter(x=>
    x.oppositeClassExcludedAsThisOriginal3DSourceByExactRay).length,0));
 assert.equal(candidateDiagnostics.rayCompatiblePaperFullSourceViewCoverage+
  candidateDiagnostics.rayCompatiblePaperPositiveGapSourceViews,
  missingOriginalRays.length);
 assert.equal(candidateDiagnostics.rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews,
  missingOriginalRays.filter(row=>
   row.rayCompatibleOriginal3DSourcePaperVisibility.
    hasExactPositiveLengthVisibleHiddenPaperClassConflict).length);
 assert.ok(candidateDiagnostics.rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews<=
  candidateDiagnostics.exactPaperVisibleHiddenPositiveConflictSourceViews);
 assert.equal(candidateDiagnostics.rayCompatibleNativeOwnerFullSourceViewCoverage+
  candidateDiagnostics.rayCompatibleNativeOwnerPositiveGapSourceViews,
  missingOriginalRays.length);
 assert.equal(candidateDiagnostics.nativeOwnerRayClassContradictorySourceViews,
  missingOriginalRays.filter(row=>
   row.nativeOwnerRayClassContradictionRequiresHistoryReview).length);
 assert.ok(missingOriginalRays.every(row=>
  row.rayCompatibleNativeScopedOwnerPaperCoverage.
   exactBinary64PaperCandidateCoverageComplete!==true||
  row.rayCompatibleOriginal3DSourcePaperCoverage.
   exactBinary64PaperCandidateCoverageComplete===true));
 assert.ok(missingOriginalRays.every(row=>
  row.rayCompatibleCandidateCount<=row.nativeHLRPaperCandidateCount&&
  row.rayClassPruningIsNotNativeHLROwnershipOrContinuousVisibility===true&&
  row.generatedTopoDSToOriginalSourceHistoryCertified===false&&
  row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false));
 console.error('REAL C1 M0 EXACT RAY-CLASS SOURCE-SPECIFIC HLR ALIAS PRUNING '+
  geometry.id+': '+JSON.stringify({
   rawPaperVisibleHiddenConflictSourceViews:
    candidateDiagnostics.exactPaperVisibleHiddenPositiveConflictSourceViews,
   rayCompatiblePaperVisibleHiddenConflictSourceViews:
    candidateDiagnostics.rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews,
   oppositeClassPaperAliasesExcludedAsThisSource:
    candidateDiagnostics.rayExcludedOppositeHLRClassPaperAliases,
   rayCompatibleFullPaperSourceViews:
    candidateDiagnostics.rayCompatiblePaperFullSourceViewCoverage,
   rayCompatibleNativeOwnerFullSourceViews:
    candidateDiagnostics.rayCompatibleNativeOwnerFullSourceViewCoverage,
   contradictoryNativeOwnerRayClassSourceViews:
    candidateDiagnostics.nativeOwnerRayClassContradictorySourceViews,
   nativeOriginalHistoryCertified:false,
   officialV5Authorized:false
  }));
 assert.ok(missingOriginalRays.every(row=>
  row.nativeHLRCandidateExactBinary64AndRayDiagnostics.length===
   row.nativeHLRPaperCandidateCount&&
  row.nativeHLRCandidateExactBinary64AndRayDiagnostics.every(x=>
   x.engineeringLineStyle==='undetermined'&&x.signedV5Action===false)));
 // Surface the exact magnitude of every genuine WASM transverse
 // HLR-paper drift. Signs alone cannot distinguish one-ULP rounding
 // from a substantial source-geometry mismatch; neither permits V5.
 const exactAffineDrifts=missingOriginalRays.flatMap(row=>
  row.nativeHLRCandidateExactBinary64AndRayDiagnostics.
   filter(candidate=>!candidate.exactBinary64PaperAffineAligned).
   map(candidate=>({view:row.view,sourceEdgeId:row.sourceEdgeId,
    hlrClass:candidate.hlrClass,ordinal:candidate.ordinal,
    residuals:candidate.exactBinary64PaperAffineCrossProductDyadic})));
 assert.equal(exactAffineDrifts.length,candidateDiagnostics.exactAffineDrift);
 assert.ok(exactAffineDrifts.every(row=>
  row.residuals.length===2&&
  row.residuals.some(r=>r.numerator!=='0')&&
  row.residuals.every(r=>typeof r.numerator==='string'&&
   Number.isSafeInteger(r.exponent2))));
 console.error('REAL C1 EXACT HLR TRANSVERSE AFFINE DRIFT '+geometry.id+
  ': '+JSON.stringify(exactAffineDrifts));
 console.error('REAL C1 OMITTED SOURCE NATIVE OWNER/EXACT PAPER/RAY JOIN '+
  geometry.id+': '+JSON.stringify(candidateDiagnostics));
 const missingRayByKey=new Map(missingOriginalRays.map(x=>[key(x),x]));
 for(const candidate of missingM5HLRCandidates){
  const ray=missingRayByKey.get(key(candidate));
  assert.ok(ray);
  assert.equal(ray.nativeHLRPaperCandidateCount,
   candidate.nativeHLRPaperCandidateCount);
  assert.deepEqual(ray.nativeHLRPaperCandidates,
   candidate.nativeHLRPaperCandidates.map(x=>({
    hlrClass:x.hlrClass,ordinal:x.ordinal
   })));
  assert.equal(ray.missingM5SourceViewRemainsUncovered,true);
  assert.equal(ray.generatedTopoDSToOriginalSourceHistoryCertified,false);
  assert.equal(ray.globalCoProjectedFrontmostSourceCertified,false);
  assert.equal(ray.engineeringLineStyle,'undetermined');
  assert.equal(ray.signedV5Action,false);
 }
 console.error('REAL C1 ALL M0 ORIGINAL RAYS ABSENT FROM M5 '+geometry.id+': '+
  JSON.stringify({counts:positiveOriginalGapRays.counts,
   missing:missingOriginalRays.map(x=>({
    view:x.view,source:x.sourceEdgeId,
    originalRay:x.original3DRayStatus,
    candidateCount:x.nativeHLRPaperCandidateCount,
    nativeHistoryCertified:false
   }))}));
 console.error('REAL C1 M0->NATIVE HLR PAPER CANDIDATES ABSENT FROM M5 '+geometry.id+': '+
  JSON.stringify(missingM5HLRCandidates.map(x=>({
   view:x.view,source:x.sourceEdgeId,
   candidates:x.nativeHLRPaperCandidates.map(y=>[y.hlrClass,y.ordinal])
  }))));
 console.error('REAL C1 M0 SOURCES ABSENT FROM M5 '+geometry.id+': '+
  JSON.stringify(absentM0.map(x=>({view:x.view,source:x.sourceEdgeId}))));
 assert.equal(allOriginalSourceNativeGapLedger.generatedHLRToOriginalTopoDSHistoryCertified,false);
 assert.equal(allOriginalSourceNativeGapLedger.signedV5ActionCount,0);
 console.error('REAL C1 ALL ORIGINAL SOURCE GAP INVENTORY '+geometry.id+': '+
  JSON.stringify(allOriginalSourceNativeGapLedger.totals));
 // Consume the EXISTING generic all-source M5/native joint-gap auditor,
 // not the obsolete fixture-specific three A-end gap batch. Face winding
 // and the native projector legitimately change received binary64 HLR
 // endpoints, so current positive gaps must be measured on THIS run.
 const currentPositiveGapRows=allOriginalSourceNativeGapLedger.rows.filter(row=>
  row.kind==='positive-original-native-source-gap');
 assert.equal(allOriginalSourceNativeGapLedger.totals.positiveGapSourceSpans,
  currentPositiveGapRows.length);
 assert.equal(allOriginalSourceNativeGapLedger.totals.individualPositiveNativeGaps,
  currentPositiveGapRows.reduce((n,row)=>n+row.positiveGaps.length,0));
 assert.ok(currentPositiveGapRows.every(row=>
  row.positiveGaps.length>0&&
  row.positiveGaps.every(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&b>a)&&
  row.jointNativeGapForensics?.positiveGapCount===row.positiveGaps.length&&
  row.jointNativeGapForensics.signedV5ActionCount===0&&
  row.jointNativeGapForensics.fullOriginalSourceHistoryCertified===false&&
  row.jointNativeGapForensics.globalContinuousVisibilityCertified===false));
 const currentNativeGapJointM5CadAudit={
  schema:'draftai-c1-current-real-native-m5-gap-batch/1',
  revision:audited.revision,sourceGeometryId:geometry.id,
  recordsExamined:currentPositiveGapRows.length,
  individualPositiveNativeGaps:
   allOriginalSourceNativeGapLedger.totals.individualPositiveNativeGaps,
  results:currentPositiveGapRows.map(row=>row.jointNativeGapForensics),
  gapsClosed:0,originalTopoDSHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  signedV5ActionCount:0
 };
 console.error('REAL C1 CURRENT M5 NATIVE GAP JOINT EVIDENCE '+geometry.id+': '+
  JSON.stringify({rows:currentPositiveGapRows.map(row=>({
   view:row.view,source:row.sourceEdgeId,gaps:row.positiveGaps
  })),counts:allOriginalSourceNativeGapLedger.totals}));
 // The general consumer still rejects stale M5 revisions; the dedicated
 // historical three-gap fixture remains covered by its independent tests.
 assert.throws(()=>auditC1AllOriginalSourceNativeGaps({
  geometry,cad,m5Ledger:{...audited,revision:audited.revision-1}
 }),/current unsigned C1 M0|canonical M5 evidence/);
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
 // Genuine OCCT positive witnesses + a deliberately forged SECOND generated
 // ordinal on the exact same paper stroke. The alternative source is a
 // different actual M0 edge at another 3D depth, not a duplicate ordinal.
 // No numerical paper snapping and no permission to sign GB/V5.
 if(geometry.id==='C1rotated'){
  const eqPaper=(a,b)=>a?.u===b?.u&&a?.v===b?.v;
  let coProjected=null;
  for(const w of authenticNativeWitnesses){
   const real=cad.views[w.view][w.nativeVisibleHLREdgeOrdinal];
   const other=geometry.data.edges.find(e=>{
    const id=geometry.id+'::'+[...e].sort().join('|');
    if(id===w.sourceEdgeId)return false;
    const a=project(geometry.data.points[e[0]])[w.view],
     b=project(geometry.data.points[e[1]])[w.view];
    return (eqPaper(a,real.from)&&eqPaper(b,real.to))||
     (eqPaper(b,real.from)&&eqPaper(a,real.to));
   });
   if(other){coProjected={w,real,other};break;}
  }
  assert.ok(coProjected,
   'real rotated convex OCCT W/V/H must exhibit a distinct physical 3D edge with identical paper endpoints');
  const {w,real,other}=coProjected,
   a=geometry.data.points[other[0]],b=geometry.data.points[other[1]],
   t0=eqPaper(project(a)[w.view],real.from)?0:1,
   t1=1-t0,sourceEdgeId=geometry.id+'::'+[...other].sort().join('|');
  const newOrdinal=cad.views[w.view].length;
  const aliasLift={...real.sourceCandidate3DLifts[0],
   sourceEdgeId,originalVertexIds:[...other],
   sourceParameterAtProjectedFrom:t0,sourceParameterAtProjectedTo:t1,
   originalSourceParameterRange:[0,1],
   fromCandidate3D:{...(t0===0?a:b)},toCandidate3D:{...(t1===0?a:b)},
   actualOriginalOCCTBRepFrom3D:{...a},actualOriginalOCCTBRepTo3D:{...b}};
  const forgedCad={...cad,views:{...cad.views,
   [w.view]:[...cad.views[w.view],{
    ...real,from:{...real.from},to:{...real.to},
    sourceCandidate3DLifts:[aliasLift]}]}};
  const forgedProof={...realNativeProof,
   independentlyM5AuthenticatedVisibleNativeGeneratedEdges:[
    ...authenticNativeWitnesses,{...w,sourceEdgeId,
     nativeVisibleHLREdgeOrdinal:newOrdinal,
     originalSourceParameterRange:[0,1]}]};
  assert.throws(()=>auditC1RealOcctVisibleContourSourceParity({
   geometry,revision:40+index,cad:forgedCad,nativeProof:forgedProof
  }),/coincident native visible HLR paper segment has conflicting original 3D front owners/);
  // A SECOND native ordinal covering only HALF the exact same paper
  // interval must also fail, even though the old whole-segment equality
  // check cannot detect it. The two 3D sources are actual different M0
  // edges of this genuine pinned OCCT convex solid.
  const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2},
   partialRange=[Math.min(t0,.5),Math.max(t0,.5)],
   partialLift={...aliasLift,
    sourceParameterAtProjectedTo:.5,
    originalSourceParameterRange:partialRange,
    toCandidate3D:{...mid}},
   partialCad={...cad,views:{...cad.views,
    [w.view]:[...cad.views[w.view],{
     ...real,from:{...real.from},to:project(mid)[w.view],
     sourceCandidate3DLifts:[partialLift]}]}},
   partialProof={...realNativeProof,
    independentlyM5AuthenticatedVisibleNativeGeneratedEdges:[
     ...authenticNativeWitnesses,{...w,sourceEdgeId,
      nativeVisibleHLREdgeOrdinal:newOrdinal,
      originalSourceParameterRange:partialRange}]};
  assert.throws(()=>auditC1RealOcctVisibleContourSourceParity({
   geometry,revision:40+index,cad:partialCad,nativeProof:partialProof
  }),/overlapping native visible HLR paper segments have conflicting original 3D front owners/);
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
 // Genuine pinned OCCT HLR must never erase the literal M0 endpoint
 // theorem: each independently bound original full edge has EXACT [0,1]
 // regardless of floating 3D display interpolation. This cannot repair
 // a separate positive native generated-edge source gap or sign V5.
 for(const row of nativeM5ExteriorContourParity.rows.filter(x=>
  x.exactOriginalPhysical3DVertexPaperBinding)){
  assert.equal(row.originalM5WholeExteriorContourCertified,true);
  assert.equal(row.originalContour3DParameterRecoveryKind,
   'exact-original-m0-3d-vertex-projection');
  assert.deepEqual(row.originalSourceParameterRange,[0,1]);
  assert.equal(row.signedV5Action,false);
 }
 if(geometry.id==='C1rotated')
  assert.ok(nativeM5ExteriorContourParity.
   globallySignedContoursWithExactOriginalM0VertexPaperEndpointRecovery>0);
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
 // Real OCCT candidate coverage is a separate, weaker geometry observation.
 // It cannot repair authentic native M5 closed-ray/frontmost source gaps.
 assert.equal(nativeM5ExteriorContourParity.
  heldOriginalContoursWithUnsignedRealBRepCandidateFullParameterCoverage,
  nativeM5ExteriorContourParity.rows.filter(row=>
   row.originalM5WholeExteriorContourCertified===true&&
   row.realOCCTOriginal3DSourceCompleteContourParity===false&&
   row.unsignedNativeBRepSourceCandidateEvidence?.
    sourceParameterCoverage.entireOriginalParameterIntervalCovered===true).length);
 // Native HLR paper endpoints must be independently reprojected from
 // literal original 3D source parameters. Raw BRep geometric candidates
 // (even with complete [0,1]) are NOT exact paper-bound source history.
 const heldCandidateRows=nativeM5ExteriorContourParity.rows.filter(row=>
  row.originalM5WholeExteriorContourCertified===true&&
  row.realOCCTOriginal3DSourceCompleteContourParity===false);
 assert.equal(nativeM5ExteriorContourParity.
  heldOriginalContoursWithUnsignedRealBRepCandidateExactPaperBoundCoverage,
  heldCandidateRows.filter(row=>row.unsignedNativeBRepSourceCandidateEvidence?.
   exactPaperBoundSourceCoverageWithoutOverlap===true).length);
 assert.equal(nativeM5ExteriorContourParity.
  heldOriginalContoursWithRawBRepCoverageButNoExactPaperBoundCoverage,
  heldCandidateRows.filter(row=>row.unsignedNativeBRepSourceCandidateEvidence?.
   sourceParameterCoverage.entireOriginalParameterIntervalCovered===true&&
   row.unsignedNativeBRepSourceCandidateEvidence?.
    exactPaperBoundSourceCoverageWithoutOverlap!==true).length);
 assert.ok(nativeM5ExteriorContourParity.rows.every(row=>{
  const c=row.unsignedNativeBRepSourceCandidateEvidence;
  if(c===null)return true;
  const bound=c.exactPaperBoundNativeBRepCandidateIntervals;
  return c.signedV5Action===false&&
   c.exactPaperBoundSourceParameterCoverage.entireOriginalParameterIntervalCovered===
    (c.exactPaperBoundSourceParameterCoverage.positiveLengthUncoveredIntervals.length===0)&&
   bound.every(x=>x.exactPaperEndpointsMatched===true)&&
   (!c.exactPaperBoundSourceCoverageWithoutOverlap||
    (bound.length>0&&!c.exactPaperBoundNativeSourceParameterOverlap&&
     c.exactPaperBoundSourceParameterCoverage.entireOriginalParameterIntervalCovered));
 }));
 assert.ok(nativeM5ExteriorContourParity.rows.every(row=>
  row.unsignedNativeBRepSourceCandidateEvidence===null||
  (row.unsignedNativeBRepSourceCandidateEvidence.signedV5Action===false&&
   row.unsignedNativeBRepSourceCandidateEvidence.
    generatedToOriginalTopoDSHistoricalIdentityProven===false&&
   row.unsignedNativeBRepSourceCandidateEvidence.
    originalSourceM5FrontmostRayAuthenticated===false)));
 assert.equal(nativeM5ExteriorContourParity.constructionIntentDAGUniqueV5ParityProven,false);
 assert.equal(nativeM5ExteriorContourParity.signedV5ActionCount,0);
 // Live genuine OCCT evidence for unresolved H-source endpoints: report the
 // exact original M0 XYZ, canonical signed M5 3D/paper endpoints and real
 // native BRep lifts separately. Never use these diagnostics as a signer.
 const heldPhysicalContours=nativeM5ExteriorContourParity.rows.filter(row=>
  row.originalM5WholeExteriorContourCertified===true&&
  row.realOCCTOriginal3DSourceCompleteContourParity===false);
 if(heldPhysicalContours.length){
  // Diagnostic ONLY. Every binary64 coordinate is serialized as its actual
  // 64-bit payload, including signed zero and one-ULP HLR source drift.
  // Rounded decimal/2D equality must not manufacture TopoDS provenance.
  const binary64=n=>{
   if(!Number.isFinite(n))throw new RangeError('nonfinite native HLR forensic coordinate');
   const data=new DataView(new ArrayBuffer(8));
   data.setFloat64(0,n,false);
   return '0x'+data.getBigUint64(0,false).toString(16).padStart(16,'0');
  };
  const exactBits=p=>Object.fromEntries(Object.entries(p).map(
   ([axis,value])=>[axis,binary64(value)]));
  const {auditC1GlobalVisibleContourProof}=require('../../workbench/m5-c1-global-visible-contour-proof.cjs');
  const canonicalContour=auditC1GlobalVisibleContourProof({geometry,revision:40+index});
  const heldEndpointEvidence=heldPhysicalContours.map(row=>{
   const ids=row.originalPhysical3DSourceEdgeId.split('::').at(-1).split('|');
   const sourceVertices=ids.map(id=>({id,xyz:geometry.data.points[id],
    xyzBinary64:exactBits(geometry.data.points[id]),
    paper:project(geometry.data.points[id])[row.view],
    paperBinary64:exactBits(project(geometry.data.points[id])[row.view])}));
   const line=canonicalContour.views.find(v=>v.view===row.view)
    ?.candidateIntervals[row.canonicalHullIntervalOrdinal];
   assert.equal(line?.sourceEdgeId,row.originalPhysical3DSourceEdgeId);
   assert.equal(row.signedV5Action,false);
   const native=cad.views[row.view].flatMap((seg,ordinal)=>
    (seg.sourceCandidate3DLifts??[]).filter(lift=>
     lift.sourceEdgeId===row.originalPhysical3DSourceEdgeId)
    .map(lift=>({ordinal,from:seg.from,to:seg.to,
     nativeFromBinary64:exactBits(seg.from),
     nativeToBinary64:exactBits(seg.to),
     originalSourceParameterRange:lift.originalSourceParameterRange,
     sourceRangeBinary64:lift.originalSourceParameterRange.map(binary64),
     fromCandidate3D:lift.fromCandidate3D,toCandidate3D:lift.toCandidate3D,
     nativeGeneratedToOriginalTopoDSHistoryProven:false})));
   return {view:row.view,ordinal:row.canonicalHullIntervalOrdinal,
    sourceEdgeId:row.originalPhysical3DSourceEdgeId,
    heldReason:row.heldReason,sourceVertices,
    canonicalOriginal3DParameterRange:row.originalSourceParameterRange,
    positiveLengthNativeSourceGaps:row.positiveLengthNativeSourceGaps,
    unsignedNativeBRepCandidateGeometryOnly:
     row.unsignedNativeBRepSourceCandidateEvidence,
    independentlyAuthenticatedNativeVisibleOrdinals:
     row.trueNativeOCCTGeneratedLineOrdinals,
    canonicalM5:{from3D:line.real3DFrom,to3D:line.real3DTo,
     paperFrom:line.projectedFromModelMm,paperTo:line.projectedToModelMm,
     physicalCoverage:line.sourceContourCoverageVerified,
     endpointJoins:line.genuineFrontSourceEndpointJoinsVerified,
     continuousFrontRay:line.continuouslyFrontRayClearVerified},native};
  });
  // Emit stable, structured forensics on stderr (stdout remains one JSON
  // consumer report). The real WASM CI stores this line as an artifact.
  assert.equal(heldEndpointEvidence.length,heldPhysicalContours.length);
  assert.ok(heldEndpointEvidence.every(row=>
   row.positiveLengthNativeSourceGaps.length>0||
   row.heldReason!=='true-occt-generated-contour-source-parameter-gap'));
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
 // Genuine pinned OCCT WASM geometry: independently recompute every
 // original physical 3D edge's first-angle drawable projections. A point
 // projection is NOT a missing paper stroke; the original 3D edge remains
 // in the full inventory, and no positive result here signs GB or V5.
 const originalSourceViewProjections=geometry.data.edges.flatMap(edge=>{
  const p=project(geometry.data.points[edge[0]]);
  const q=project(geometry.data.points[edge[1]]);
  const id=geometry.id+'::'+[...edge].sort().join('|');
  return ['V','H','W'].map(view=>({key:view+'@'+id,
   collapsed:p[view].u===q[view].u&&p[view].v===q[view].v}));
 });
 const drawableKeys=originalSourceViewProjections.filter(x=>!x.collapsed)
  .map(x=>x.key);
 const missingDrawable=sceneInventory.missingOriginalSourceViews.filter(
  key=>drawableKeys.includes(key));
 const incompleteDrawable=sceneInventory.incompleteOriginalSourceViewPartitions
  .filter(x=>drawableKeys.includes(x.sourceViewKey))
  .map(x=>x.sourceViewKey);
 assert.equal(sceneInventory.noncollapsedOriginalSourceViewCount,
  drawableKeys.length);
 assert.equal(sceneInventory.noncollapsedCompleteOriginalSourceViewCount,
  drawableKeys.length-missingDrawable.length-incompleteDrawable.length);
 assert.deepEqual(sceneInventory.noncollapsedMissingOriginalSourceViews,
  missingDrawable);
 assert.deepEqual(sceneInventory.noncollapsedIncompleteOriginalSourceViews,
  incompleteDrawable);
 const expectedUncovered=drawableKeys.filter(key=>
  missingDrawable.includes(key)||incompleteDrawable.includes(key)).map(key=>{
   const absent=missingDrawable.includes(key);
   const gap=sceneInventory.incompleteOriginalSourceViewPartitions.find(x=>
    x.sourceViewKey===key);
   const projection=sceneInventory.missingOriginalSourceViewProjectionEvidence.find(x=>
    x.sourceViewKey===key)||
    sceneInventory.incompleteOriginalSourceViewProjectionEvidence.find(x=>
     x.sourceViewKey===key);
   assert.ok(projection&&!projection.projectionCollapsedExactly);
   return {sourceViewKey:key,missingEntireSourceView:absent,
    uncoveredOriginalParameterIntervals:absent?[[0,1]]:gap.positiveLengthParameterGaps,
    projectedFrom:projection.projectedFrom,projectedTo:projection.projectedTo,
    signedV5Action:false};
  });
 assert.deepEqual(sceneInventory.noncollapsedUncoveredOriginalSourceParameterIntervals,
  expectedUncovered);
 assert.equal(
  sceneInventory.allNoncollapsedOriginalSourceViewsHaveCompleteM5ParameterPartitions,
  drawableKeys.length>0&&missingDrawable.length===0&&incompleteDrawable.length===0);
 assert.equal(sceneInventory.signedV5Action,false);
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
  positiveOriginalGapRays,
  currentNativeGapJointM5CadAudit,
  directNativeOriginalVertexMatches:cad.directNativeOriginalVertexMatches,
  nativeHLRSourceHistoryAPISurfaceByView:
   cad.nativeHLRSourceHistoryAPISurfaceByView,
  fullGeneratedEdgeHistoryProven:false,
  originalM5SourceViewCoverage:{
   expected:sceneInventory.expectedOriginalSourceViewCount,
   complete:sceneInventory.completeOriginalSourceViewCount,
   drawableNoncollapsed:{
    expected:sceneInventory.noncollapsedOriginalSourceViewCount,
    complete:sceneInventory.noncollapsedCompleteOriginalSourceViewCount,
    missing:sceneInventory.noncollapsedMissingOriginalSourceViews,
    incomplete:sceneInventory.noncollapsedIncompleteOriginalSourceViews,
    uncoveredParameterObligations:
     sceneInventory.noncollapsedUncoveredOriginalSourceParameterIntervals,
    allM5ParameterPartitionsComplete:
     sceneInventory.allNoncollapsedOriginalSourceViewsHaveCompleteM5ParameterPartitions,
    globallyCertified:false,signedV5Action:false
   },
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
   originalBRepPhysicalVertexTShapesIndependentlyVerified:
    originalPhysicalTopology.originalM0SourceVertexIds.length,
   originalBRepSamePhysicalVertexNativeTShapePairs:
    originalPhysicalTopology.originalSamePhysicalVertexTopoDSPairs,
   globalHLREndpointPairsWithIndependentOriginalBRepPhysicalTShape:
    nativePhysical3DEndpoints.counts.originalBRepPhysicalJunctionPairsWithVerifiedNativeTShape,
   originalBRepPhysicalJoinsDespiteDistinctGeneratedHLRTShapes:
    nativePhysical3DEndpoints.counts.originalBRepPhysicalJunctionPairsDespiteDistinctGeneratedTShapes,
   originalBRepNativeFacesWithVerifiedM0Boundaries:
    originalFaceAdjacency.nativeBRepFacesChecked,
   originalBRepSourceEdgesWithTwoActualNativeAdjacentFaces:
    originalFaceAdjacency.nativeOriginalBRepSourceEdgesWithExactlyTwoVerifiedFaces,
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
  exactNative3DSourceParameterGapOrUnbound:
   audited.counts.exactNative3DSourceParameterGapOrUnbound,
  exactNative3DSourceParameterCovered:
   audited.counts.exactNative3DSourceParameterCovered,
  scopedPaperFullButNative3DPositiveGap:
   audited.counts.scopedPaperFullButNative3DPositiveGap,
  exactNativeSourceGaps:exactGapRows.map((x,i)=>({
   originalM0DyadicGapWitness:originalGapForensics[i],
   originalNativeOCCTCurveParameterGapWitness:
    originalOcctCurveGapForensics[i],
   nativeGeneratedVertexGapAdjacencyWitness:
    nativeGeneratedVertexGapForensics[i],
   view:x.view,sourceEdgeId:x.sourceEdgeId,
   status:x.exactNativeOriginal3DSourceCoverage?.status,
   scopedPaperCandidateFullButNative3DGap:
    x.sourceScopedPaperFullButNative3DPositiveGap,
   scopedPaperCandidateGaps:
    x.sourceScopedPaperCandidateCoverage?.
     positiveLengthUncoveredCandidateIntervals,
   positiveLengthUncoveredIntervals:
    x.exactNativeOriginal3DSourceCoverage?.
     positiveLengthUncoveredIntervals
  })),
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
