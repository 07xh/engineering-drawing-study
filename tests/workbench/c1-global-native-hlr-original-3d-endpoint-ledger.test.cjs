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
    sourceGeometryId:geometry.id,revision:cad.revision,
    view,sourceEdgeId:id,officialV5Authorized:false,
    native3DProvenanceIsNotGenerated2DHLREdgeIdentity:true,
    completeGlobalVisibilityCertified:false,
    formalEngineeringLineStyleCertified:false,
    native3DSourceParameterPartitionCompleteExactlyOnce:!missingPartition,
    M4OriginalUnitIntervalCandidateCoverageComplete:!missingPartition,
    M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
    native3DOriginalParameterPositiveGaps:[],
    native3DOriginalParameterPositiveOverlaps:[],
    M4OriginalUnitIntervalNativeClassConflicts:[],
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
test('C1 M5 endpoint ledger refuses extra opposite-class source interval even with forged full coverage flags',()=>{
 const x=setup(),m4=x.sourceM4Views.W.nativeOriginal3DM4Candidates[0];
 m4.segments.push({
  view:'W',sourceEdgeId:m4.sourceEdgeId,native3DHLRClass:'hidden-sharp',
  originalM0UnitParameterRange:[0.25,0.75],
  derivedFromOriginalNative3DCurveNotGeneratedHLRPaper:true,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
 // The previous consumer only counted a full same-class [0,1] row and
 // trusted the unchanged producer booleans, overlooking this contradiction.
 assert.equal(m4.native3DSourceParameterPartitionCompleteExactlyOnce,true);
 assert.equal(m4.M4OriginalUnitIntervalCandidateCoverageComplete,true);
 const r=audit(x),w=r.views.W.rows[0];
 assert.equal(r.counts.multipleNativeM4SourceClassSegmentsHeld,1);
 assert.equal(r.counts.completeOriginalNative3DClassSourceIntervalRows,2);
 assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,1);
 assert.equal(w.receivedOriginalNativeM4SourceClassSegmentCount,2);
 assert.equal(w.receivedNativeM4SourceClassMultiplicityHeld,true);
 assert.equal(w.completeOriginalNativeSource3DClassCoversWholeEdge,false);
 assert.equal(w.original3DToGenerated2DEndpointWitnesses.every(e=>
  e.entireOriginal3DSourceNativeClassConfirmed===false),true);
 assert.equal(r.officialV5Authorized,false);
});
test('duplicate same-class microinterval is not absorbed into a falsely unique M4 full source',()=>{
 const x=setup({rounded:true});
 const m4=x.sourceM4Views.V.nativeOriginal3DM4Candidates[0];
 const tiny=Number.EPSILON;
 m4.segments.push({
  view:'V',sourceEdgeId:m4.sourceEdgeId,native3DHLRClass:'visible-sharp',
  originalM0UnitParameterRange:[1-tiny,1],
  derivedFromOriginalNative3DCurveNotGeneratedHLRPaper:true,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
 const r=audit(x),v=r.views.V.rows[0];
 assert.equal(v.receivedNativeM4SourceClassMultiplicityHeld,true);
 assert.equal(v.completeOriginalNativeSource3DClassCoversWholeEdge,false);
 assert.equal(v.generated2DRepresentationBoundedOnlyWithoutPhysicalVertexIdentity,false,
  'even an otherwise ULP-bounded paper endpoint cannot borrow duplicate source class');
 assert.equal(r.counts.roundedOnlyOriginalM0PaperEndpointPairs,0);
 assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,1);
 assert.equal(r.counts.multipleNativeM4SourceClassSegmentsHeld,1);
});
test('genuine sole full-range native M4 segment still links original physical endpoints without signing GB/V5',()=>{
 const r=audit(setup());
 assert.equal(r.counts.multipleNativeM4SourceClassSegmentsHeld,0);
 for(const view of ['V','H','W']){
  const row=r.views[view].rows[0];
  assert.equal(row.receivedOriginalNativeM4SourceClassSegmentCount,1);
  assert.equal(row.receivedNativeM4SourceClassMultiplicityHeld,false);
  assert.equal(row.completeOriginalNativeSource3DClassCoversWholeEdge,true);
 }
 assert.equal(r.generated2DToOriginal3DNativeTopoDSVertexTopologyCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});

test('C1/M5 accepts unsorted adjacent SAME-class original native source spans only when exact-once',()=>{
 const x=setup(),m4=x.sourceM4Views.H.nativeOriginal3DM4Candidates[0];
 const base=m4.segments[0];
 // Actual OCCT may split one physical source into multiple native class
 // intervals. Sorted order is irrelevant; no fabricated [0,1] span needed.
 m4.segments=[
  {...base,originalM0UnitParameterRange:[0.5,1]},
  {...base,originalM0UnitParameterRange:[0,0.5]}
 ];
 const r=audit(x),row=r.views.H.rows[0];
 assert.equal(row.receivedOriginalNativeM4SourceClassSegmentCount,2);
 assert.equal(row.receivedNativeM4ExactSameClassSourcePartitionVerified,true);
 assert.equal(row.receivedNativeM4OriginalOcctParameterInventoryClear,true);
 assert.equal(row.receivedNativeM4SourceClassMultiplicityHeld,false);
 assert.equal(row.completeOriginalNativeSource3DClassCoversWholeEdge,true);
 assert.equal(r.counts.completeOriginalNative3DClassSourceIntervalRows,3);
 assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,0);
 assert.equal(r.signedV5ActionCount,0);
});
test('C1/M5 holds a positive one-ULP hole or overlap between two otherwise verified native source spans',()=>{
 for(const spans of [
  [[0,0.5],[0.5+Number.EPSILON,1]],
  [[0,0.5+Number.EPSILON],[0.5,1]]
 ]){
  const x=setup(),m4=x.sourceM4Views.W.nativeOriginal3DM4Candidates[0];
  const template=m4.segments[0];
  m4.segments=spans.map(r=>({...template,originalM0UnitParameterRange:r}));
  const r=audit(x),w=r.views.W.rows[0];
  assert.equal(w.receivedOriginalNativeM4SourceClassSegmentCount,2);
  assert.equal(w.receivedNativeM4ExactSameClassSourcePartitionVerified,false);
  assert.equal(w.receivedNativeM4SourceClassMultiplicityHeld,true);
  assert.equal(w.completeOriginalNativeSource3DClassCoversWholeEdge,false);
  assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,1);
  assert.equal(r.officialV5Authorized,false);
 }
});
test('C1/M5 refuses apparent full normalized source if genuine native OCCT parameter inventory reports positive gap',()=>{
 const x=setup(),m4=x.sourceM4Views.V.nativeOriginal3DM4Candidates[0];
 m4.native3DOriginalParameterPositiveGaps.push([0.5,0.5+Number.EPSILON]);
 const r=audit(x),v=r.views.V.rows[0];
 assert.equal(v.receivedNativeM4ExactSameClassSourcePartitionVerified,true);
 assert.equal(v.receivedNativeM4OriginalOcctParameterInventoryClear,false);
 assert.equal(v.completeOriginalNativeSource3DClassCoversWholeEdge,false);
 assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,1);
 assert.equal(r.signedV5ActionCount,0);
});
test('C1/M5 rejects forged same-class source row with a different source ID even if intervals cover whole edge',()=>{
 const x=setup(),m4=x.sourceM4Views.V.nativeOriginal3DM4Candidates[0];
 m4.segments[0].sourceEdgeId='g::foreign';
 const r=audit(x),v=r.views.V.rows[0];
 assert.equal(v.receivedNativeM4ExactSameClassSourcePartitionVerified,false);
 assert.equal(v.completeOriginalNativeSource3DClassCoversWholeEdge,false);
 assert.equal(r.counts.physicalOriginalM0EndpointRowsHeld,1);
});
test('stale M4 revision or forged geometry identity is rejected before original HLR endpoint linking',()=>{
 const mutators=[
  row=>{row.revision=4;},
  row=>{row.sourceGeometryId='other-geometry';},
  row=>{row.native3DProvenanceIsNotGenerated2DHLREdgeIdentity=false;},
  row=>{row.completeGlobalVisibilityCertified=true;},
  row=>{row.formalEngineeringLineStyleCertified=true;}
 ];
 for(const mutate of mutators){
  const x=setup(),row=x.sourceM4Views.W.nativeOriginal3DM4Candidates[0];
  mutate(row);
  assert.throws(()=>audit(x),/stale or forged native source M4 interval/);
 }
 const valid=audit(setup());
 assert.equal(valid.counts.completeOriginalNative3DClassSourceIntervalRows,3);
 assert.equal(valid.officialV5Authorized,false);
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
