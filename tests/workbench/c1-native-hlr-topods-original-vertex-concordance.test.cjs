'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditC1NativeHLRGeneratedToOriginalVertexConcordance:audit}=
 require('../../workbench/c1-native-hlr-topods-original-vertex-concordance.cjs');
const revision=27,point={u:10,v:4};
const nativeEdge=(cl,n)=>({view:'H',occtHLRVisibilityClass:cl,
 actualOCCTHLRFlattenedBRepLineVerified:true,
 from:{u:n===0?0:10,v:4},to:{...point}});
const ref=(kind,n,side)=>({
 hlrClass:kind,nativeHLREdgeOrdinal:n,side,
 nativePaperPoint:{...point}
});
const pair=(a,b,same)=>({view:'H',a,b,
 nativeGeneratedOCCTTopoDSVertexIsSame:same,
 original3DSourceTopoDSVertexIdentityRecovered:false,
 actualNativeHLRStrokeJoinMeetsGlobalEngineeringRules:false,
 signedV5Action:false});
const fixture=()=>{
 const r={
  geometry:{id:'G',data:{points:{A:{x:0,y:0,z:0}}}},
  revision,
  cad:{
   sourceGeometryId:'G',revision,hiddenHLROutputFromActualOCCT:true,v5Authorized:false,
   views:{V:[],H:[nativeEdge('visible-sharp',0)],W:[]},
   hiddenSharpViews:{V:[],H:[
    nativeEdge('hidden-sharp',0),nativeEdge('hidden-sharp',1)
   ],W:[]},
   nativeGeneratedVertexGraph:{
    schema:'draftai-ocjs-genuine-hlr-generated-topods-issame-vertex-graph/1',
    realOCCTIsSameComparedBeforeNativeObjectDeletion:true,
    actualGeneratedToOriginalTopoDSHistoryRecovered:false,
    signedV5ActionCount:0,
    views:{
     V:{view:'V',realNativeSharpEdgeCount:0,
      sameActualGeneratedOCCTTopoDSVertexPairs:[],
      paperCoincidentButDifferentTopoDSVertexPairs:[]},
     H:{view:'H',realNativeSharpEdgeCount:3,
      sameActualGeneratedOCCTTopoDSVertexPairs:[],
      paperCoincidentButDifferentTopoDSVertexPairs:[]},
     W:{view:'W',realNativeSharpEdgeCount:0,
      sameActualGeneratedOCCTTopoDSVertexPairs:[],
      paperCoincidentButDifferentTopoDSVertexPairs:[]}
    },
    counts:{positivelySameGeneratedOCCTTopoDSVertexPairs:0,
     coincidentPaperButDistinctGeneratedTopoDSVertexPairs:0}
   }
  },
  originalNativeVertexProof:{sourceGeometryId:'G',revision,
   signedV5ActionCount:0,rows:[
    {view:'H',sourceGeometryId:'G',revision,nativeHiddenSharpEdgeOrdinal:0,
     OCCTGeneratedTopoDSNativeEdgeAdjacencyCertified:false,signedV5Action:false,
     nativeSource3DVertexEndpointRows:[{
      originalPhysicalSourceEdgeId:'G::A|B',
      endpointWitnesses:[{originalModel3DSourceVertexId:'B',
       exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified:true},
      {originalModel3DSourceVertexId:'A',
       exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified:true}]
     }]},
    {view:'H',sourceGeometryId:'G',revision,nativeHiddenSharpEdgeOrdinal:1,
     OCCTGeneratedTopoDSNativeEdgeAdjacencyCertified:false,signedV5Action:false,
     nativeSource3DVertexEndpointRows:[{
      originalPhysicalSourceEdgeId:'G::A|C',
      endpointWitnesses:[{originalModel3DSourceVertexId:'C',
       exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified:true},
      {originalModel3DSourceVertexId:'A',
       exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified:true}]
     }]}
   ]}
 };
 return r;
};
test('true shared generated OCCT IsSame vertex AND exact independently shared original 3D vertex produce positive local junction witness, no GB/V5',()=>{
 const x=fixture();
 const v=x.cad.nativeGeneratedVertexGraph.views.H;
 v.sameActualGeneratedOCCTTopoDSVertexPairs.push(pair(
  ref('hidden-sharp',0,'to'),ref('hidden-sharp',1,'to'),true));
 x.cad.nativeGeneratedVertexGraph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs=1;
 const r=audit(x);
 assert.equal(r.counts.IsSameHiddenToHiddenMatchingOriginal3DPhysicalVertices,1);
 assert.equal(r.rows[0].independentlyRealOriginal3DSourceJunctionAlsoProven,true);
 assert.equal(r.rows[0].original3DVertexIdAgreedFromTwoIndependentHiddenSources,'A');
 assert.equal(r.actualGeneratedHLREdgeToOriginalTopoDSEdgeHistoryComplete,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('distinct physical 3D original vertices with native IsSame do not certify source 3D junction',()=>{
 const x=fixture(),v=x.cad.nativeGeneratedVertexGraph.views.H;
 // Two actual native endpoints coincide on paper, but M0 sources map
 // to different ORIGINAL physical 3D vertex IDs.
 x.originalNativeVertexProof.rows[0].nativeSource3DVertexEndpointRows[0].
  endpointWitnesses[1].originalModel3DSourceVertexId='B';
 v.sameActualGeneratedOCCTTopoDSVertexPairs.push(pair(
  ref('hidden-sharp',0,'to'),ref('hidden-sharp',1,'to'),true));
 x.cad.nativeGeneratedVertexGraph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs=1;
 const r=audit(x);
 assert.equal(r.counts.IsSameHiddenToHiddenMatchingOriginal3DPhysicalVertices,0);
 assert.equal(r.counts.IsSameHLRNodesButOriginalSource3DVertexNotCertified,1);
});
test('same original physical vertex with paper coincidence but distinct native TopoDS vertices refuses join',()=>{
 const x=fixture(),v=x.cad.nativeGeneratedVertexGraph.views.H;
 v.paperCoincidentButDifferentTopoDSVertexPairs.push(pair(
  ref('hidden-sharp',0,'to'),ref('hidden-sharp',1,'to'),false));
 x.cad.nativeGeneratedVertexGraph.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs=1;
 const r=audit(x);
 assert.equal(r.counts.IsSameHiddenToHiddenMatchingOriginal3DPhysicalVertices,0);
 assert.equal(r.counts.exactPaperCoincidentButDistinctNativeTopoDSPairsHeld,1);
 assert.equal(r.counts.distinctNativeTopoDSButSameIndependentlyProvenOriginal3DVertexPairs,1);
 assert.equal(r.paperOnlyProjectedVertexAliases[0].verifiedOriginal3DVertexId,'A');
 assert.equal(r.paperOnlyProjectedVertexAliases[0].actualNativeGeneratedHLRSharedTopoDSVertexCertified,false);
 assert.equal(r.paperOnlyProjectedVertexAliases[0].globalGBLineJoinStillNotCertified,true);
});
test('co-projected native HLR distinct TopoDS vertices do NOT imply a physical 3D junction when their independently verified model vertices differ',()=>{
 const x=fixture(),v=x.cad.nativeGeneratedVertexGraph.views.H;
 x.originalNativeVertexProof.rows[0].nativeSource3DVertexEndpointRows[0].
  endpointWitnesses[1].originalModel3DSourceVertexId='B';
 v.paperCoincidentButDifferentTopoDSVertexPairs.push(pair(
  ref('hidden-sharp',0,'to'),ref('hidden-sharp',1,'to'),false));
 x.cad.nativeGeneratedVertexGraph.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs=1;
 const r=audit(x);
 assert.equal(r.counts.distinctNativeTopoDSButSameIndependentlyProvenOriginal3DVertexPairs,0);
 assert.equal(r.counts.paperCoincidentNativePairsWithoutIndependent3DPhysicalJunction,1);
 assert.equal(r.rows.length,0);
 assert.equal(r.signedV5ActionCount,0);
});
test('visible native HLR source identity does not materialize merely by sharing generated native vertex',()=>{
 const x=fixture(),v=x.cad.nativeGeneratedVertexGraph.views.H;
 v.sameActualGeneratedOCCTTopoDSVertexPairs.push(pair(
  ref('visible-sharp',0,'to'),ref('hidden-sharp',0,'to'),true));
 x.cad.nativeGeneratedVertexGraph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs=1;
 const r=audit(x);
 assert.equal(r.counts.IsSameNativeVisibleAndHiddenSourceHistoryStillUnknown,1);
 assert.equal(r.rows[0].original3DVertexIdAgreedFromTwoIndependentHiddenSources,null);
});
test('forged HLR vertex index or projected paper coordinates fail closed',()=>{
 const x=fixture(),v=x.cad.nativeGeneratedVertexGraph.views.H;
 v.sameActualGeneratedOCCTTopoDSVertexPairs.push(pair(
  ref('hidden-sharp',0,'to'),ref('hidden-sharp',9,'to'),true));
 x.cad.nativeGeneratedVertexGraph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs=1;
 assert.throws(()=>audit(x),/native true OCCT TopoDS vertex reference/);
 const y=fixture(),w=y.cad.nativeGeneratedVertexGraph.views.H;
 const b=ref('hidden-sharp',1,'to');b.nativePaperPoint.u+=1;
 w.sameActualGeneratedOCCTTopoDSVertexPairs.push(pair(
  ref('hidden-sharp',0,'to'),b,true));
 y.cad.nativeGeneratedVertexGraph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs=1;
 assert.throws(()=>audit(y),/native OCCT shared vertex lacks real IsSame/);
});

const markGraphComplete=x=>{
 x.cad.nativeGeneratedVertexGraph.
  allVHWGeneratedNativeTopologyPairsComparedWithoutPaperBucketing=true;
 x.cad.nativeGeneratedVertexGraph.counts.genuinelySharedNativeJunctionComponents=1;
 for(const v of ['V','H','W']){
  const view=x.cad.nativeGeneratedVertexGraph.views[v];
  view.allNativeGeneratedEndpointPairsIndependentlyCompared=true;
  view.generatedOCCTSharedNativeJunctionComponents=[];
 }
};
const completeStar=(a,b)=>({
 view:'H',actualGeneratedOCCTTopoDSVertexPairwiseIsSame:true,
 originalGeneratedTopoDSHistoryRecovered:false,
 exactNativePaperCoordinatesForEntireComponent:{...point},
 generatedSharpEdgeEndpoints:[a,b],
 independentlyCertifiedOriginal3DSourceVertexId:null,
 engineeringLineJoinCertified:false,signedV5Action:false
});
test('entire genuine HLR generated TopoDS shared node is an original 3D source junction only when every original M0 vertex and BRep source fan agrees',()=>{
 const x=fixture();markGraphComplete(x);
 const a=ref('hidden-sharp',0,'to'),b=ref('hidden-sharp',1,'to');
 x.cad.nativeGeneratedVertexGraph.views.H.
  sameActualGeneratedOCCTTopoDSVertexPairs.push(pair(a,b,true));
 x.cad.nativeGeneratedVertexGraph.views.H.
  generatedOCCTSharedNativeJunctionComponents.push(completeStar(a,b));
 x.cad.nativeGeneratedVertexGraph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs=1;
 const out=audit(x),star=out.completeGenuineNativeHLRJunctionStars[0];
 assert.equal(out.allPerViewActualNativeGeneratedJunctionComponentsConsumed,true);
 assert.equal(out.counts.genuineCompleteGeneratedHLRJunctionComponentsAudited,1);
 assert.equal(out.counts.completeGeneratedHLRJunctionComponentsWithIndependentOriginal3DVertex,1);
 assert.equal(star.allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex,true);
 assert.equal(star.independentlyVerifiedOriginalM03DVertexId,'A');
 assert.deepEqual(star.independentlyTracedOriginal3DSourceEdges,['G::A|B','G::A|C']);
 assert.equal(star.wholeSceneAndEngineeringGBJunctionCertified,false);
 assert.equal(star.signedV5Action,false);
});
test('same genuine generated native vertex across visible+hidden strokes is held when original 3D visible source provenance is unavailable',()=>{
 const x=fixture();markGraphComplete(x);
 const a=ref('visible-sharp',0,'to'),b=ref('hidden-sharp',0,'to');
 x.cad.nativeGeneratedVertexGraph.views.H.
  sameActualGeneratedOCCTTopoDSVertexPairs.push(pair(a,b,true));
 x.cad.nativeGeneratedVertexGraph.views.H.
  generatedOCCTSharedNativeJunctionComponents.push(completeStar(a,b));
 x.cad.nativeGeneratedVertexGraph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs=1;
 const out=audit(x),star=out.completeGenuineNativeHLRJunctionStars[0];
 assert.equal(star.allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex,false);
 assert.equal(star.independentlyVerifiedOriginalM03DVertexId,null);
 assert.equal(out.counts.completeGeneratedHLRJunctionComponentsHeldOnUnmappedPhysicalSource,1);
 assert.equal(out.signedV5ActionCount,0);
});
test('cannot forge a complete native generated vertex star without actual IsSame pair, consistent native paper and unique edge endpoints',()=>{
 const x=fixture();markGraphComplete(x);
 const a=ref('hidden-sharp',0,'to'),b=ref('hidden-sharp',1,'to');
 x.cad.nativeGeneratedVertexGraph.views.H.
  generatedOCCTSharedNativeJunctionComponents.push(completeStar(a,b));
 assert.throws(()=>audit(x),/missing actual OCCT IsSame pair/);
 x.cad.nativeGeneratedVertexGraph.views.H.
  sameActualGeneratedOCCTTopoDSVertexPairs.push(pair(a,b,true));
 x.cad.nativeGeneratedVertexGraph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs=1;
 x.cad.nativeGeneratedVertexGraph.views.H.
  generatedOCCTSharedNativeJunctionComponents[0].exactNativePaperCoordinatesForEntireComponent.u=11;
 assert.throws(()=>audit(x),/paper-misaligned native TopoDS junction/);
});
