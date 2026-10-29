'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {auditC1GlobalNativeHLROriginalM0EndpointLinks:audit}=
 require('../../workbench/c1-global-native-hlr-original-3d-endpoint-ledger.cjs');
const baseGeometry={id:'g',kind:'mesh',space:'model-3d',unit:'mm',data:{
 points:{A:{x:0,y:0,z:0},B:{x:12,y:5,z:7},C:{x:6,y:3,z:11}},
 edges:[['A','B']]}};
function setup({two=false,rounded=false,missingPartition=false}={}){
 const geometry=structuredClone(baseGeometry);
 if(two)geometry.data.edges.push(['A','C']);
 const sources=geometry.data.edges.map(([a,b])=>({
  id:geometry.id+'::'+[a,b].sort().join('|'),edge:[a,b]
 }));
 const cad={sourceGeometryId:'g',revision:5,
  actualOCCTCurveTypeIndependentlyVerified:true,
  originalBRepSourceEdges:sources.map(({id,edge:[a,b]})=>({
   sourceEdgeId:id,originalOCCTBRepVertexXYZMatched:true,
   occtSourceCurve3DEndpointsAndMidpointVerified:true,
   occtSourceCurveType:'line',
   fromOCCT3D:{...geometry.data.points[a]},
   toOCCT3D:{...geometry.data.points[b]}
  })),views:{},hiddenSharpViews:{}};
 const globalRebinding={
  schema:'draftai-c1-global-native-generated-2d-to-original-filtered-source-evidence/1',
  sourceGeometryId:'g',revision:5,officialV5Authorized:false,
  actualGlobalGeneratedEdgeToOriginalTopoDSHistoryCertified:false,views:{}
 };
 const sourceM4Views={};
 for(const view of ['V','H','W']){
  cad.views[view]=[];cad.hiddenSharpViews[view]=[];
  globalRebinding.views[view]=[];
  sourceM4Views[view]={nativeOriginal3DM4Candidates:[]};
  sources.forEach(({id,edge:[a,b]},ordinal)=>{
   const from=project(geometry.data.points[a])[view],
    to=project(geometry.data.points[b])[view];
   const line={from:{...from},to:{...to},
    directNativeVertexOriginalSource:[
     {directOriginal3DVertexTopoDSIdentityProven:false,
      directlySameOriginalM0VertexId:null},
     {directOriginal3DVertexTopoDSIdentityProven:false,
      directlySameOriginalM0VertexId:null}
    ]};
   if(rounded&&view==='V'&&ordinal===0)line.from.u=Number.MIN_VALUE;
   cad.views[view].push(line);
   globalRebinding.views[view].push({
    view,hlrClass:'visible-sharp',wholeSolidGeneratedHLREdgeOrdinal:ordinal,
    uniqueOriginalSourceFilteredPaperCandidate:id,
    exactlyOneNativeSourceScopedWitnessForWholeSolidEdge:true,
    uniqueNativeScopedAndWholeSolidBinary64PaperEndpointsAgree:true,
    exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge:!rounded,
    boundedWholeOriginal3DRoundingBackingForUniqueGlobalEdge:rounded,
    wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified:false,
    signedV5Action:false
   });
   sourceM4Views[view].nativeOriginal3DM4Candidates.push({
    view,sourceEdgeId:id,officialV5Authorized:false,
    native3DSourceParameterPartitionCompleteExactlyOnce:!missingPartition,
    M4OriginalUnitIntervalCandidateCoverageComplete:!missingPartition,
    M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
    segments:[{view,sourceEdgeId:id,native3DHLRClass:'visible-sharp',
     originalM0UnitParameterRange:[0,1],
     derivedFromOriginalNative3DCurveNotGeneratedHLRPaper:true,
     engineeringLineStyle:'undetermined',signedV5Action:false}]
   });
  });
 }
 return {geometry,cad,globalRebinding,sourceM4Views};
}
test('first-angle global HLR generated edge has independently verified ORIGINAL BRep 3D physical endpoints',()=>{
 const r=audit(setup());
 assert.equal(r.counts.globalGeneratedHLREdgesChecked,3);
 assert.equal(r.counts.uniqueOriginalSourceGlobalEdgesExamined,3);
 assert.equal(r.counts.nativeOriginalBRepExactPhysicalEndpointPairs,3);
 assert.equal(r.counts.completeOriginalNative3DClassSourceIntervalRows,3);
 assert.equal(r.counts.exactOriginalM0PaperEndpointPairs,3);
 assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,0);
 for(const view of ['V','H','W']){
  const e=r.views[view].rows[0];
  assert.deepEqual(e.originalPhysicalM0EdgeEndpointIds,['A','B']);
  assert.equal(e.trueOriginalNativeOCCT3DEndpointsMatchM0Exactly,true);
  assert.equal(e.receivedGenerated2DEndpointsMatchBothOriginalProjectedVerticesExactly,true);
  assert.deepEqual(e.original3DToGenerated2DEndpointWitnesses.map(x=>
   x.originalPhysicalM0VertexId),['A','B']);
  assert.equal(e.generated2DToOriginalNativeTopoDSFullVertexTopologyCertified,false);
 }
 assert.equal(r.officialV5Authorized,false);
 assert.ok(Object.isFrozen(r.views.V.rows[0]));
});
test('real shared M0 physical vertex induces first-angle endpoint pair candidates without generated HLR IsSame proof',()=>{
 const r=audit(setup({two:true}));
 assert.equal(r.counts.globalGeneratedHLREdgesChecked,6);
 assert.equal(r.counts.originalModelPhysicalJunctionPairCandidates,3);
 assert.equal(r.counts.physicalJunctionPairsWithBothExactGeneratedPaperEndpoints,3);
 for(const view of ['V','H','W']){
  const p=r.views[view].originalPhysicalEndpointPairCandidates;
  assert.equal(p.length,1);
  assert.equal(p[0].originalPhysicalM0VertexId,'A');
  assert.equal(p[0].actualNativeGeneratedTopoDSVertexIsSameForThisPairProven,false);
 }
});
test('rounded native HLR paper endpoint cannot be promoted to exact physical original HLR vertex junction',()=>{
 const r=audit(setup({rounded:true}));
 assert.equal(r.counts.exactOriginalM0PaperEndpointPairs,2);
 assert.equal(r.counts.roundedOnlyOriginalM0PaperEndpointPairs,1);
 assert.equal(r.views.V.rows[0].generated2DRepresentationBoundedOnlyWithoutPhysicalVertexIdentity,true);
 assert.equal(r.views.V.rows[0].original3DToGenerated2DEndpointWitnesses[0].
  generatedPaperExactlyEqualsOriginalM0Vertex,false);
 assert.equal(r.generated2DToOriginal3DNativeTopoDSVertexTopologyCertified,false);
});
test('native original 3D partition gaps preserve hold even with exact original endpoint projections',()=>{
 const r=audit(setup({missingPartition:true}));
 assert.equal(r.counts.completeOriginalNative3DClassSourceIntervalRows,0);
 assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,3);
 assert.equal(r.counts.originalModelPhysicalJunctionPairCandidates,0);
 assert.equal(r.officialV5Authorized,false);
});
test('generated HLR TopoDS vertex IsSame to a wrong ORIGINAL physical model vertex is rejected',()=>{
 const x=setup(),w=x.cad.views.V[0];
 w.directNativeVertexOriginalSource[0]={
  directOriginal3DVertexTopoDSIdentityProven:true,
  directlySameOriginalM0VertexId:'C'};
 assert.throws(()=>audit(x),/genuine OCCT generated vertex IsSame contradicts/);
});
test('positive generated HLR native vertex IsSame to a verified original M0 endpoint is counted but not signed',()=>{
 const x=setup(),w=x.cad.views.W[0];
 w.directNativeVertexOriginalSource[1]={
  directOriginal3DVertexTopoDSIdentityProven:true,
  directlySameOriginalM0VertexId:'B'};
 const r=audit(x);
 assert.equal(r.counts.generatedOriginalTopoDSDirectVertexIdentityEndpoints,1);
 assert.equal(r.views.W.rows[0].original3DToGenerated2DEndpointWitnesses[1].
  actualNativeGeneratedVertexToOriginalTopoDSIsSame,true);
 assert.equal(r.generated2DToOriginal3DNativeTopoDSVertexTopologyCertified,false);
});
test('forged current source M4, duplicate global ordinal and original BRep alias fail closed',()=>{
 const mutations=[
  x=>{x.sourceM4Views.V.nativeOriginal3DM4Candidates[0].sourceEdgeId='g::A|C';},
  x=>{x.cad.originalBRepSourceEdges[0].sourceEdgeId='g::C|B';},
  x=>{x.cad.originalBRepSourceEdges[0].originalOCCTBRepVertexXYZMatched=false;},
  x=>{x.globalRebinding.views.V[0].wholeSolidGeneratedHLREdgeOrdinal=5;},
  x=>{x.globalRebinding.views.W[0].signedV5Action=true;},
  x=>{x.globalRebinding.actualGlobalGeneratedEdgeToOriginalTopoDSHistoryCertified=true;}
 ];
 for(const mutate of mutations){
  const x=setup();mutate(x);
  assert.throws(()=>audit(x),/native|source|original|global|forged|ordinal|required/i);
 }
});
