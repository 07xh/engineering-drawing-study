'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1M5UnresolvedGlobalSourceObligations:audit}=
 require('../../workbench/c1-m5-unresolved-global-source-obligations.cjs');
function fixture(){
 const sourceEdgeId='g::A|B',view='V',ordinal=2,hlrClass='hidden-sharp';
 const paper={view,sourceEdgeId,hlrClass,wholeSolidGeneratedHLREdgeOrdinal:ordinal,
  sourceScopedWholeGeneratedBinary64PaperExactlyMatched:true,
  originalNative3DClassExactlyBacksEntireGeneratedLine:true,
  originalNative3DClassWithinFullSourceOneULPEnvelopeOnly:false,
  actualGeneratedToOriginalTopoDSHistoryCertified:false,
  allOpaqueFaceOcclusionCertified:false,signedV5Action:false};
 const endpoint={view,sourceEdgeId,hlrClass,wholeSolidGeneratedHLREdgeOrdinal:ordinal,
  original3DBRepExactModelVertexEndpoints:true,original3DSourceClassComplete:true,
  originalM0PhysicalVertexIds:['A','B'],
  nativeGenerated3DJunctionIdentityCertified:false,
  globalOpaqueFaceOcclusionCertified:false,signedV5Action:false};
 const join={view,originalPhysicalM0SourceEdges:[sourceEdgeId,'g::A|C'],
  original3DPhysicalVertexProvenFromM0NotNativeHistory:true,
  noIndependentGlobalOpaqueVisibilityOrGBLineJoinCertification:true,
  generatedHLRNativeTopoDSIsSamePairProven:false,
  generatedHLRNativeTopoDSDistinctDespitePhysicalM0Join:true,
  signedV5Action:false};
 const row={view,sourceEdgeId,
  wholeSolidGeneratedHLROriginalSourceFilterMatches:[paper],
  wholeSolidGeneratedHLROriginal3DEndpointWitnesses:[endpoint],
  wholeSolidGeneratedOriginal3DPhysicalNativeJunctionPairs:[join],
  originalM0PhysicalEndpointEvidenceCannotReplaceNativeHLRJunctionIdentity:true,
  originalPhysicalJunctionAndGeneratedNativeIsSameCannotReplaceSceneM5:true};
 return {geometry:{id:'g'},cad:{sourceGeometryId:'g',revision:3},
  positiveOriginalGapRays:{
   schema:'draftai-c1-native-gap-positive-original-ray-theorem/1',
   sourceGeometryId:'g',revision:3,officialV5Authorized:false,
   signedV5ActionCount:0,missingOriginalM0SourceViewRows:[row],
   rows:[{...structuredClone(row),originalSourceParameterGap:[0.2,0.3]}]
  }};
}
test('each omitted source and positive gap independently joins the same real generated HLR ordinal and original BRep endpoint',()=>{
 const r=audit(fixture());
 assert.equal(r.counts.unresolvedM5Obligations,2);
 assert.equal(r.counts.obligationsWithGlobalOriginalSourceAnd3DEndpoints,2);
 assert.equal(r.counts.obligationsWithStrictNative3DClass,2);
 assert.equal(r.counts.obligationsWithDistinctNativeGeneratedVertices,2);
 assert.equal(r.records[1].originalM0PositiveParameterGap[0],0.2);
 assert.equal(r.officialV5Authorized,false);
 assert.equal(r.signedV5ActionCount,0);
 assert.ok(Object.isFrozen(r));
});
test('bounded class only remains strictly separate from exact native class interval',()=>{
 const x=fixture();
 for(const row of [...x.positiveOriginalGapRays.missingOriginalM0SourceViewRows,
  ...x.positiveOriginalGapRays.rows]){
  row.wholeSolidGeneratedHLROriginalSourceFilterMatches[0].
   originalNative3DClassExactlyBacksEntireGeneratedLine=false;
  row.wholeSolidGeneratedHLROriginalSourceFilterMatches[0].
   originalNative3DClassWithinFullSourceOneULPEnvelopeOnly=true;
 }
 const r=audit(x);
 assert.equal(r.counts.obligationsWithBoundedOnlyNative3DClass,2);
 assert.equal(r.counts.obligationsWithStrictNative3DClass,0);
 assert.equal(r.signedV5ActionCount,0);
});
test('rejects missing/duplicate generated edge or forged cross-source physical endpoint evidence',()=>{
 const changes=[
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginal3DEndpointWitnesses.pop(),
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginalSourceFilterMatches.push(
   structuredClone(x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginalSourceFilterMatches[0])),
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginal3DEndpointWitnesses[0].sourceEdgeId='g::C|D',
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginalSourceFilterMatches[0].hlrClass='visible-sharp',
  x=>x.positiveOriginalGapRays.rows[0].originalSourceParameterGap=[0.3,0.3],
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedOriginal3DPhysicalNativeJunctionPairs[0].
   originalPhysicalM0SourceEdges=['g::C|D'],
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedOriginal3DPhysicalNativeJunctionPairs[0].
   generatedHLRNativeTopoDSIsSamePairProven=true,
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginalSourceFilterMatches[0].
   originalNative3DClassWithinFullSourceOneULPEnvelopeOnly=true,
  x=>x.positiveOriginalGapRays.rows[0].wholeSolidGeneratedHLROriginal3DEndpointWitnesses[0].
   globalOpaqueFaceOcclusionCertified=true
 ];
 for(const change of changes){
  const x=fixture();change(x);
  assert.throws(()=>audit(x),/gap|source|endpoint|bijection|class|junction|native|contradicted/i);
 }
});

test('independent original 3D all-face rays classify native HLR owner without signing a source',()=>{
 const x=fixture(),missing=x.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0],
  positive=x.positiveOriginalGapRays.rows[0];
 missing.expectedHLRClassFromIndependentOriginalRay='hidden-sharp';
 positive.independentOriginal3DExactRayStatus='exact-original-open-strict-interior';
 const r=audit(x);
 assert.equal(r.counts.obligationsWithIndependentExactOriginalRayClass,2);
 assert.equal(r.counts.generatedHLRSourceClassContradictionsHeldForHistory,0);
 assert.equal(r.records[0].independentOriginal3DAllFaceRayClass,'hidden-sharp');
 assert.equal(r.records[1].independentOriginal3DAllFaceRayClass,'hidden-sharp');
 assert.equal(r.signedV5ActionCount,0);
});
test('opposing global HLR class versus independently proven original all-face ray is held, not relabeled',()=>{
 const x=fixture(),row=x.positiveOriginalGapRays.rows[0];
 row.independentOriginal3DExactRayStatus='exact-original-closed-ray-clear';
 const r=audit(x);
 assert.equal(r.counts.generatedHLRSourceClassContradictionsHeldForHistory,1);
 assert.equal(r.records[1].independentOriginal3DAllFaceRayClass,'visible-sharp');
 assert.deepEqual(r.records[1].generatedHLRClassesDisagreeingWithOriginal3DRay,
  [{hlrClass:'hidden-sharp',wholeSolidGeneratedHLREdgeOrdinal:2}]);
 assert.equal(r.records[1].nativeHLRClassContradictionNotAllowedToOverrideOriginalRay,true);
 assert.equal(r.records[1].signedV5Action,false);
});
test('forged independent all-face original ray class is rejected',()=>{
 const x=fixture();x.positiveOriginalGapRays.missingOriginalM0SourceViewRows[0].
  expectedHLRClassFromIndependentOriginalRay='visible-and-hidden';
 assert.throws(()=>audit(x),/original 3D all-face ray classification/);
});
