'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {auditC1GlobalNativeHLROriginalM0EndpointLinks:audit}=
 require('../../workbench/c1-global-native-hlr-original-3d-endpoint-ledger.cjs');
const baseGeometry={id:'g',kind:'mesh',space:'model-3d',unit:'mm',data:{
 points:{A:{x:0,y:0,z:0},B:{x:12,y:5,z:7},C:{x:6,y:3,z:11}},
 edges:[['A','B']]}};
function setup({two=false,rounded=false,missingPartition=false,tetra=false}={}){
 const geometry=structuredClone(baseGeometry);
 if(two)geometry.data.edges.push(['A','C']);
 if(tetra){
  geometry.data.points.D={x:5,y:6,z:23};
  geometry.data.edges=[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']];
  geometry.data.faces=[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']];
 }
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
    native3DOriginalParameterPositiveGaps:[],
    native3DOriginalParameterPositiveOverlaps:[],
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
function attachGlobalNative3DOriginalCurveProof(x){
 x.cad.nativeSourceScopedSharpOutputByView={};
 for(const view of ['V','H','W']){
  const rows=x.globalRebinding.views[view].map(r=>({
   view,hlrClass:r.hlrClass,
   wholeSolidGeneratedHLREdgeOrdinal:r.wholeSolidGeneratedHLREdgeOrdinal,
   originalPhysicalSourceEdgeId:r.uniqueOriginalSourceFilteredPaperCandidate,
   originalNativeCurveParameterRange:[0,1],
   globalNative3DHLRCurveEqualsOriginalBRepAtThreeParameters:true,
   global3DAnd2DHLRMeasuredPaperPairUnique:true,
   global3DAndOriginalScoped3DHLRParameterIntervalExact:true,
   globalGenerated2DTo3DTopoDSHistoryCertified:false,
   fullOpaqueSceneContinuousOcclusionCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  }));
  x.cad.nativeSourceScopedSharpOutputByView[view]={
   nativeGlobal3DOriginalSourceEvidence:{
    schema:'draftai-c1-global-native-hlr-3d-original-curve-corroboration/1',
    sourceGeometryId:x.geometry.id,revision:x.cad.revision,view,
    globalGenerated2DSharpEdges:rows.length,
    globalGenerated3DSharpEdgesWithUniqueOriginalCurve:rows.length,
    allGenerated3DSharpCurvesBoundToOriginalBRepAnd2DPaper:true,
    generated2DTo3DTopoDSHistoryCertified:false,
    globalContinuousVisibilityCertified:false,
    officialV5Authorized:false,signedV5ActionCount:0,rows
   }
  };
 }
 return x;
}
test('real global 3D native source curve witnesses independently bind every 2D ordinal without V5 signoff',()=>{
 const x=attachGlobalNative3DOriginalCurveProof(setup({two:true}));
 const r=audit(x);
 assert.equal(r.counts.genuineGlobal3DSourceCurvePaperPairsCrossChecked,6);
 assert.equal(r.counts.genuineGlobal3DSourceCurveWithoutUniqueScoped2DClaim,0);
 assert.equal(r.views.V.rows[0].independentlyMeasuredGlobalNative3DOriginalSourceCandidate,
  'g::A|B');
 assert.deepEqual(r.views.V.rows[0].independentGlobal3DOriginalCurveParameterRange,[0,1]);
 assert.equal(r.views.V.rows[0].independentGlobal3DSourceIsNotGenerated2DTopoDSHistory,true);
 assert.equal(r.officialV5Authorized,false);
});
test('a measured global 3D original curve cannot contradict the independently scoped 2D original source',()=>{
 const x=attachGlobalNative3DOriginalCurveProof(setup({two:true}));
 x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence.
  rows[0].originalPhysicalSourceEdgeId='g::A|C';
 assert.throws(()=>audit(x),/contradicts independently measured/);
});
test('unclaimed scoped 2D HLR ordinal retains measured 3D original curve as unsigned candidate only',()=>{
 const x=attachGlobalNative3DOriginalCurveProof(setup());
 x.globalRebinding.views.V[0].uniqueOriginalSourceFilteredPaperCandidate=null;
 const r=audit(x);
 assert.equal(r.counts.genuineGlobal3DSourceCurveWithoutUniqueScoped2DClaim,1);
 assert.equal(r.views.V.rows[0].uniqueOriginalSourceFilteredPaperCandidate,null);
 assert.equal(r.views.V.rows[0].independentlyMeasuredGlobalNative3DOriginalSourceCandidate,'g::A|B');
 assert.equal(r.views.V.rows[0].signedV5Action,false);
 assert.equal(r.views.V.rows[0].continuousAllOpaqueFaceVisibilityProven,false);
});
test('missing or duplicated whole-solid global 3D source ordinal fails closed',()=>{
 for(const mutate of [
  g=>{g.rows.pop();},
  g=>{g.rows[1].wholeSolidGeneratedHLREdgeOrdinal=0;},
  g=>{g.rows[0].global3DAndOriginalScoped3DHLRParameterIntervalExact=false;}
 ]){
  const x=attachGlobalNative3DOriginalCurveProof(setup({two:true}));
  mutate(x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence);
  assert.throws(()=>audit(x),/whole-solid native 3D|global native 3D/);
 }
});
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
test('two exactly adjacent original native 3D class intervals preserve full physical endpoint proof',()=>{
 const x=setup({two:true});
 for(const view of ['V','H','W']){
  const m=x.sourceM4Views[view].nativeOriginal3DM4Candidates[0];
  m.segments=[{...m.segments[0],originalM0UnitParameterRange:[0,0.5]},
   {...m.segments[0],originalM0UnitParameterRange:[0.5,1]}];
 }
 const r=audit(x);
 assert.equal(r.counts.completeOriginalNative3DClassSourceIntervalRows,6);
 assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,0);
 assert.equal(r.counts.originalModelPhysicalJunctionPairCandidates,3);
 assert.equal(r.generated2DToOriginal3DNativeTopoDSVertexTopologyCertified,false);
 assert.equal(r.officialV5Authorized,false);
});
test('one-ULP overlap, one-ULP gap, and mixed visibility class cannot forge full original native source proof',()=>{
 const corrupt=[
  ranges=>{ranges[0][1]=0.5000000000000001;},
  ranges=>{ranges[1][0]=0.5000000000000001;}
 ];
 for(const mutate of corrupt){
  const x=setup(),m=x.sourceM4Views.V.nativeOriginal3DM4Candidates[0];
  const ranges=[[0,0.5],[0.5,1]];mutate(ranges);
  m.segments=ranges.map(originalM0UnitParameterRange=>({
   ...m.segments[0],originalM0UnitParameterRange
  }));
  const r=audit(x);
  assert.equal(r.views.V.rows[0].completeOriginalNativeSource3DClassCoversWholeEdge,false);
  assert.equal(r.views.V.rows[0].signedV5Action,false);
  assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,1);
 }
 const mixed=setup(),m=mixed.sourceM4Views.V.nativeOriginal3DM4Candidates[0];
 m.segments=[{...m.segments[0],originalM0UnitParameterRange:[0,0.5]},
  {...m.segments[0],native3DHLRClass:'hidden-sharp',
   originalM0UnitParameterRange:[0.5,1]}];
 const r=audit(mixed);
 assert.equal(r.views.V.rows[0].completeOriginalNativeSource3DClassCoversWholeEdge,false);
 assert.equal(r.views.V.rows[0].signedV5Action,false);
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

test('strict native 3D class support may have a one-ULP original 2D endpoint drift without false vertex identity',()=>{
 const x=setup({rounded:true}),row=x.globalRebinding.views.V[0];
 row.exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge=true;
 row.boundedWholeOriginal3DRoundingBackingForUniqueGlobalEdge=false;
 const r=audit(x);
 assert.equal(r.counts.strictlyClassBackedButRoundedOriginalM0PaperEndpoints,1);
 assert.equal(r.counts.roundedOnlyOriginalM0PaperEndpointPairs,1);
 assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,0);
 assert.equal(r.views.V.rows[0].strictlyOriginal3DClassBackedButPaperEndpointsRounded,true);
 assert.equal(r.views.V.rows[0].receivedGenerated2DEndpointsMatchBothOriginalProjectedVerticesExactly,false);
 assert.equal(r.views.V.rows[0].originalM0PaperEndpointRoundoffEnvelope.compatible,true);
 assert.equal(r.views.V.rows[0].exactOriginalM0PaperEndpointsNotReplacedByRoundoffEvidence,true);
 assert.equal(r.generated2DToOriginal3DNativeTopoDSVertexTopologyCertified,false);
});
test('paper displacement larger than the actual original source ULP envelope stays held even if class exactly covers',()=>{
 const x=setup(),row=x.globalRebinding.views.V[0];
 x.cad.views.V[0].from.u=1e-7;
 row.exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge=true;
 row.boundedWholeOriginal3DRoundingBackingForUniqueGlobalEdge=false;
 const r=audit(x);
 assert.equal(r.counts.sourceScaleULPEnvelopeRejectedOriginalM0PaperEndpoints,1);
 assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,1);
 assert.equal(r.views.V.rows[0].originalM0PaperEndpointRoundoffEnvelope.compatible,false);
});
function attachGenuineNativePair(x,{same=true,pointDifferent=false}={}){
 const graph={schema:'draftai-ocjs-genuine-hlr-generated-topods-issame-vertex-graph/1',
  realOCCTIsSameComparedBeforeNativeObjectDeletion:true,
  allVHWGeneratedNativeTopologyPairsComparedWithoutPaperBucketing:true,
  actualGeneratedToOriginalTopoDSHistoryRecovered:false,
  signedV5ActionCount:0,
  views:{}};
 for(const view of ['V','H','W']){
  const first=x.cad.views[view][0],second=x.cad.views[view][1];
  const pair={view,
   a:{hlrClass:'visible-sharp',nativeHLREdgeOrdinal:0,side:'from',
    nativePaperPoint:{...first.from}},
   b:{hlrClass:'visible-sharp',nativeHLREdgeOrdinal:1,side:'from',
    nativePaperPoint:{...second.from}},
   nativeGeneratedOCCTTopoDSVertexIsSame:same,
   signedV5Action:false};
  if(pointDifferent&&view==='V')pair.b.nativePaperPoint={u:200,v:100};
  graph.views[view]={
   view,realNativeSharpEdgeCount:x.cad.views[view].length,
   allNativeGeneratedEndpointPairsIndependentlyCompared:true,
   sameActualGeneratedOCCTTopoDSVertexPairs:same?[pair]:[],
   paperCoincidentButDifferentTopoDSVertexPairs:same?[]:[pair]
  };
 }
 x.cad.nativeGeneratedVertexGraph=graph;
 return x;
}
test('native IsSame physical M0 junction is proven for a generated vertex pair, never full generated edge history',()=>{
 const x=attachGenuineNativePair(setup({two:true}));
 const r=audit(x);
 assert.equal(r.originalNativeOCCTHLRGeneratedVertexGraphCrossReferenced,true);
 assert.equal(r.counts.physicalOriginalJunctionPairsWithActualGeneratedTopoDSIsSame,3);
 assert.equal(r.counts.physicalOriginalJunctionPairsWithDistinctNativeTopoDSVertices,0);
 assert.equal(r.counts.realNativeGeneratedVertexGraphPairsChecked,3);
 for(const view of ['V','H','W']){
  assert.equal(r.views[view].originalPhysicalEndpointPairCandidates[0].
   actualNativeGeneratedTopoDSVertexIsSameForThisPairProven,true);
 }
 assert.equal(r.generated2DToOriginal3DNativeTopoDSVertexTopologyCertified,false);
 assert.equal(r.officialV5Authorized,false);
});
test('paper-coincident but different actual TopoDS native vertices do not create a generated junction',()=>{
 const r=audit(attachGenuineNativePair(setup({two:true}),{same:false}));
 assert.equal(r.counts.physicalOriginalJunctionPairsWithDistinctNativeTopoDSVertices,3);
 assert.equal(r.counts.physicalOriginalJunctionPairsWithActualGeneratedTopoDSIsSame,0);
 assert.equal(r.views.V.originalPhysicalEndpointPairCandidates[0].
  nativeGeneratedTopoDSVertexDistinctDespiteM0PhysicalJoin,true);
 assert.equal(r.views.V.originalPhysicalEndpointPairCandidates[0].
  actualNativeGeneratedTopoDSVertexIsSameForThisPairProven,false);
});
test('forged native generated graph vertex identity or paper endpoint is rejected even with true M0 shared physical vertices',()=>{
 for(const mutate of [
  x=>{x.cad.nativeGeneratedVertexGraph.signedV5ActionCount=1;},
  x=>{x.cad.nativeGeneratedVertexGraph.views.V.sameActualGeneratedOCCTTopoDSVertexPairs[0].
   b.nativePaperPoint.u=200;},
  x=>{x.cad.nativeGeneratedVertexGraph.views.V.sameActualGeneratedOCCTTopoDSVertexPairs[0].
   b.nativeHLREdgeOrdinal=20;},
  x=>{x.cad.nativeGeneratedVertexGraph.views.V.sameActualGeneratedOCCTTopoDSVertexPairs[0].
   signedV5Action=true;},
  x=>{const a=x.cad.nativeGeneratedVertexGraph.views.V.sameActualGeneratedOCCTTopoDSVertexPairs;
   a.push(structuredClone(a[0]));}
 ]){
  const x=attachGenuineNativePair(setup({two:true}));mutate(x);
  assert.throws(()=>audit(x),/native|generated|vertex|duplicate|paper|forged/i);
 }
});


function attachOriginalPhysicalBRepVertexTopology(x){
 const ids=[...new Set(x.geometry.data.edges.flat())].sort();
 const occurrences=2*x.geometry.data.edges.length;
 const same=ids.reduce((total,id)=>{const n=x.geometry.data.edges.filter(e=>e.includes(id)).length;
  return total+n*(n-1)/2;},0);
 x.cad.occtOriginalEdgeOccurrenceCount=x.geometry.data.edges.length;
 x.cad.originalNativeVertexTopology={
  schema:'draftai-c1-original-occt-brep-vertex-physical-topology/1',
  sourceGeometryId:x.geometry.id,originalM0SourceVertexIds:ids,
  originalM0VertexNativeOccurrenceCounts:Object.fromEntries(ids.map(id=>
   [id,x.geometry.data.edges.filter(e=>e.includes(id)).length])),
  originalBRepVertexOccurrencesChecked:occurrences,
  allOriginalBRepVertexPairsCompared:occurrences*(occurrences-1)/2,
  originalSamePhysicalVertexTopoDSPairs:same,
  originalDistinctPhysicalVertexTopoDSPairs:occurrences*(occurrences-1)/2-same,
  allReviewedOriginalSourceVerticesNativeTShapeVerified:true,
  generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
  signedV5ActionCount:0
 };
 return x;
}
test('genuine original BRep physical vertex proof survives distinct generated HLR native vertices',()=>{
 const x=attachOriginalPhysicalBRepVertexTopology(
  attachGenuineNativePair(setup({two:true}),{same:false}));
 const r=audit(x);
 assert.equal(r.originalNativeBRepPhysicalVertexTopologyVerified,true);
 assert.equal(r.counts.originalBRepPhysicalJunctionPairsWithVerifiedNativeTShape,3);
 assert.equal(r.counts.originalBRepPhysicalJunctionPairsDespiteDistinctGeneratedTShapes,3);
 assert.equal(r.counts.physicalOriginalJunctionPairsWithActualGeneratedTopoDSIsSame,0);
 for(const view of ['V','H','W']){
  const pair=r.views[view].originalPhysicalEndpointPairCandidates[0];
  assert.equal(pair.originalBRepPhysicalVertexTShapeIdentityProven,true);
  assert.equal(pair.nativeGeneratedTopoDSVertexDistinctDespiteM0PhysicalJoin,true);
  assert.equal(pair.actualNativeGeneratedTopoDSVertexIsSameForThisPairProven,false);
  assert.equal(pair.signedV5Action,false);
 }
 assert.equal(r.generated2DToOriginal3DNativeTopoDSVertexTopologyCertified,false);
 assert.equal(r.officialV5Authorized,false);
});
test('stale or forged original physical BRep TShape graph cannot certify generated junction',()=>{
 for(const mutate of [
  g=>{g.sourceGeometryId='old';},
  g=>{g.originalM0SourceVertexIds=['A','B'];},
  g=>{g.allOriginalBRepVertexPairsCompared=0;},
  g=>{g.generatedHLREdgeToOriginalTopoDSHistoryCertified=true;}
 ]){
  const x=attachOriginalPhysicalBRepVertexTopology(setup({two:true}));
  mutate(x.cad.originalNativeVertexTopology);
  assert.throws(()=>audit(x),/original native 3D vertex topology/);
 }
});

function attachOriginalFaceAdjacency(x){
 const sourceEdgeId=(a,b)=>x.geometry.id+'::'+[a,b].sort().join('|');
 const faces=x.geometry.data.faces.map((f,i)=>({
  originalM0FaceIndex:i,
  originalM0BoundarySourceEdgeIds:f.map((a,j)=>
   sourceEdgeId(a,f[(j+1)%f.length])).sort()
 }));
 const edges=x.geometry.data.edges.map(([a,b])=>({
  sourceEdgeId:sourceEdgeId(a,b),
  originalM0AdjacentFaceIndices:faces.filter(f=>
   f.originalM0BoundarySourceEdgeIds.includes(sourceEdgeId(a,b)))
   .map(f=>f.originalM0FaceIndex)
 })).sort((a,b)=>a.sourceEdgeId.localeCompare(b.sourceEdgeId));
 x.cad.originalNativeFaceAdjacency={
  schema:'draftai-c1-original-occt-brep-face-edge-adjacency/1',
  sourceGeometryId:x.geometry.id,nativeBRepFacesChecked:faces.length,
  nativeOriginalBRepSourceEdgesWithExactlyTwoVerifiedFaces:edges.length,
  allOriginalBRepSourceEdgesNativeFaceAdjacencyVerified:true,
  faces,edges,generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
  signedV5ActionCount:0
 };
 return x;
}
test('M4 consumes real original BRep face adjacency without authorizing HLR history or V5',()=>{
 const x=attachOriginalFaceAdjacency(setup({tetra:true})),r=audit(x);
 assert.equal(r.originalNativeBRepFaceEdgeAdjacencyVerified,true);
 assert.equal(r.counts.originalBRepSourceEdgesWithNativeFaceAdjacencyVerified,6);
 assert.equal(r.generated2DToOriginal3DNativeTopoDSVertexTopologyCertified,false);
 assert.equal(r.officialV5Authorized,false);
});
test('M4 rejects forged native face adjacency or false generated-edge history',()=>{
 for(const mutate of [
  x=>{x.cad.originalNativeFaceAdjacency.edges[0].originalM0AdjacentFaceIndices=[1,3];},
  x=>{x.cad.originalNativeFaceAdjacency.faces[0].originalM0BoundarySourceEdgeIds.pop();},
  x=>{x.cad.originalNativeFaceAdjacency.generatedHLREdgeToOriginalTopoDSHistoryCertified=true;}
 ]){
  const x=attachOriginalFaceAdjacency(setup({tetra:true}));
  mutate(x);assert.throws(()=>audit(x),/native BRep face\/edge adjacency/);
 }
});
