'use strict';
/**
 * Join real global OCJS generated 2D HLR edge ordinals with the ORIGINAL
 * independent TopoDS input BRep line endpoints, 3D native source-class
 * intervals and exact M0 physical vertex IDs. Generated paper coincidence
 * cannot certify a shared HLR TopoDS vertex, and a one-ULP-bound display
 * endpoint cannot certify exact physical junction topology or GB/V5.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const {boundedOriginalFullPaperEndpointEnvelope}=
 require('./c1-native-scoped-2d-3d-class-binding.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
const p2eq=(a,b)=>a&&b&&a.u===b.u&&a.v===b.v;
const xyz=(p,q)=>p&&q&&['x','y','z'].every(k=>
 Number.isFinite(p[k])&&Number.isFinite(q[k])&&p[k]===q[k]);
function auditC1GlobalNativeHLROriginalM0EndpointLinks({
 geometry,cad,globalRebinding,sourceM4Views
}={}){
 if(!geometry?.id||!Array.isArray(geometry?.data?.edges)||
    !geometry.data.points||cad?.sourceGeometryId!==geometry.id||
    !Number.isSafeInteger(cad.revision)||cad.revision<1||
    cad.actualOCCTCurveTypeIndependentlyVerified!==true||
    !Array.isArray(cad.originalBRepSourceEdges)||
    globalRebinding?.schema!==
     'draftai-c1-global-native-generated-2d-to-original-filtered-source-evidence/1'||
    globalRebinding.sourceGeometryId!==geometry.id||
    globalRebinding.revision!==cad.revision||
    globalRebinding.officialV5Authorized!==false||
    globalRebinding.actualGlobalGeneratedEdgeToOriginalTopoDSHistoryCertified!==false)
  throw new TypeError('current genuine whole HLR original 3D BRep M0 and source crosswalk required');
 const originals=new Map();
 for(const e of geometry.data.edges){
  if(!Array.isArray(e)||e.length!==2||e[0]===e[1]||
     e.some(k=>typeof k!=='string'||!Object.hasOwn(geometry.data.points,k)))
   throw new RangeError('nonphysical original M0 edge');
  const id=geometry.id+'::'+[...e].sort().join('|');
  if(originals.has(id))throw new RangeError('duplicate M0 original physical edge');
  originals.set(id,[...e]);
 }
 const native=new Map();
 for(const c of cad.originalBRepSourceEdges){
  if(!originals.has(c?.sourceEdgeId)||native.has(c.sourceEdgeId)||
     c.originalOCCTBRepVertexXYZMatched!==true||
     c.occtSourceCurve3DEndpointsAndMidpointVerified!==true||
     c.occtSourceCurveType!=='line')
   throw new RangeError('unbound original OCCT TopoDS 3D source edge');
  native.set(c.sourceEdgeId,c);
 }
 if(native.size!==originals.size)
  throw new RangeError('incomplete original native 3D source inventory');
 // This is ORIGINAL 3D BRep vertex topology, never the independent
 // GENERATED HLR vertex graph. A generated junction can have distinct
 // native TShapes even when both source edges truly share one 3D vertex.
 const physicalGraph=cad.originalNativeVertexTopology;
 if(physicalGraph!==undefined){
  const ids=[...new Set([...originals.values()].flat())].sort();
  const occurrenceCounts=physicalGraph.originalM0VertexNativeOccurrenceCounts;
  const expectedDegrees=Object.fromEntries(ids.map(id=>[id,0]));
  for(const edge of originals.values())for(const id of edge)expectedDegrees[id]++;
  // TopExp traverses original BRep edges through their incident faces.
  // A 2-manifold solid commonly reports TWO native edge occurrences per
  // unique M0 physical edge; preserve native TShape identity and compare
  // the per-vertex counts at that measured multiplicity, not at 1x.
  const occurrenceMultiplier=cad.occtOriginalEdgeOccurrenceCount/originals.size;
  const validOccurrenceMultiplier=Number.isSafeInteger(occurrenceMultiplier)&&
   occurrenceMultiplier>=1&&occurrenceMultiplier<=2;
  const occurrenceCountsValid=validOccurrenceMultiplier&&occurrenceCounts&&
   JSON.stringify(Object.keys(occurrenceCounts).sort())===JSON.stringify(ids)&&
   ids.every(id=>Number.isSafeInteger(occurrenceCounts[id])&&
    occurrenceCounts[id]===expectedDegrees[id]*occurrenceMultiplier)&&
   ids.reduce((n,id)=>n+occurrenceCounts[id],0)===
    physicalGraph.originalBRepVertexOccurrencesChecked;
  const samePairs=occurrenceCountsValid?ids.reduce((n,id)=>
   n+occurrenceCounts[id]*(occurrenceCounts[id]-1)/2,0):null;
  if(physicalGraph.schema!==
      'draftai-c1-original-occt-brep-vertex-physical-topology/1'||
     !occurrenceCountsValid||
     physicalGraph.originalSamePhysicalVertexTopoDSPairs!==samePairs||
     physicalGraph.sourceGeometryId!==geometry.id||
     physicalGraph.allReviewedOriginalSourceVerticesNativeTShapeVerified!==true||
     physicalGraph.generatedHLREdgeToOriginalTopoDSHistoryCertified!==false||
     physicalGraph.signedV5ActionCount!==0||
     JSON.stringify(physicalGraph.originalM0SourceVertexIds)!==JSON.stringify(ids)||
     physicalGraph.originalBRepVertexOccurrencesChecked!==2*cad.occtOriginalEdgeOccurrenceCount||
     physicalGraph.allOriginalBRepVertexPairsCompared!==
      physicalGraph.originalBRepVertexOccurrencesChecked*
       (physicalGraph.originalBRepVertexOccurrencesChecked-1)/2||
     physicalGraph.originalSamePhysicalVertexTopoDSPairs+
      physicalGraph.originalDistinctPhysicalVertexTopoDSPairs!==
       physicalGraph.allOriginalBRepVertexPairsCompared)
   throw new RangeError('untrusted same-run original native 3D vertex topology');
 }
 // Real sewn OCCT face incidence proves ORIGINAL 3D adjacency only;
 // generated HLR edge history and occlusion remain separate obligations.
 const faceGraph=cad.originalNativeFaceAdjacency;
 if(faceGraph!==undefined){
  const expectedFaceAdjacency=new Map([...originals.keys()].map(id=>[id,[]]));
  const expectedFaces=geometry.data.faces.map((face,index)=>{
   if(!Array.isArray(face)||face.length<3||new Set(face).size!==face.length)
    throw new RangeError('invalid reviewed M0 face for native BRep adjacency');
   const boundary=face.map((a,i)=>{
    const b=face[(i+1)%face.length];
    const id=geometry.id+'::'+[a,b].sort().join('|');
    if(!originals.has(id))
     throw new RangeError('native BRep adjacency refers to absent original M0 edge');
    expectedFaceAdjacency.get(id).push(index);
    return id;
   }).sort();
   return {originalM0FaceIndex:index,originalM0BoundarySourceEdgeIds:boundary};
  });
  const expectedEdges=[...expectedFaceAdjacency].sort((a,b)=>a[0].localeCompare(b[0]))
   .map(([sourceEdgeId,faces])=>({sourceEdgeId,
    originalM0AdjacentFaceIndices:faces.sort((a,b)=>a-b)}));
  if(faceGraph.schema!=='draftai-c1-original-occt-brep-face-edge-adjacency/1'||
     faceGraph.sourceGeometryId!==geometry.id||
     faceGraph.allOriginalBRepSourceEdgesNativeFaceAdjacencyVerified!==true||
     faceGraph.generatedHLREdgeToOriginalTopoDSHistoryCertified!==false||
     faceGraph.signedV5ActionCount!==0||
     faceGraph.nativeBRepFacesChecked!==expectedFaces.length||
     faceGraph.nativeOriginalBRepSourceEdgesWithExactlyTwoVerifiedFaces!==originals.size||
     !Array.isArray(faceGraph.edges)||
     JSON.stringify(faceGraph.edges)!==JSON.stringify(expectedEdges)||
     JSON.stringify(faceGraph.faces)!==JSON.stringify(expectedFaces)||
     expectedEdges.some(x=>x.originalM0AdjacentFaceIndices.length!==2))
   throw new RangeError('untrusted original native BRep face/edge adjacency');
 }
 const counts={
  globalGeneratedHLREdgesChecked:0,
  uniqueOriginalSourceGlobalEdgesExamined:0,
  nativeOriginalBRepExactPhysicalEndpointPairs:0,
  completeOriginalNative3DClassSourceIntervalRows:0,
  exactOriginalM0PaperEndpointPairs:0,
  roundedOnlyOriginalM0PaperEndpointPairs:0,
  strictlyClassBackedButRoundedOriginalM0PaperEndpoints:0,
  sourceScaleULPEnvelopeRejectedOriginalM0PaperEndpoints:0,
  physicalOriginalM0EndpointRowsHeld:0,
  generatedOriginalTopoDSDirectVertexIdentityEndpoints:0,
  originalModelPhysicalJunctionPairCandidates:0,
  physicalJunctionPairsWithBothExactGeneratedPaperEndpoints:0,
  physicalJunctionPairsWithAtLeastOneRoundedEndpoint:0,
  physicalOriginalJunctionPairsWithActualGeneratedTopoDSIsSame:0,
  physicalOriginalJunctionPairsWithDistinctNativeTopoDSVertices:0,
  originalBRepPhysicalJunctionPairsWithVerifiedNativeTShape:0,
  originalBRepPhysicalJunctionPairsDespiteDistinctGeneratedTShapes:0,
  originalBRepSourceEdgesWithNativeFaceAdjacencyVerified:
   faceGraph?.nativeOriginalBRepSourceEdgesWithExactlyTwoVerifiedFaces??0,
  nativeGeneratedTopoDSJunctionPairsWithoutPhysicalOriginalM0Join:0,
  realNativeGeneratedVertexGraphPairsChecked:0,
  genuineGlobal3DSourceCurvePaperPairsCrossChecked:0,
  genuineGlobal3DSourceCurveWithoutUniqueScoped2DClaim:0,
  wholeGeneratedEdgeOriginalTopoDSHistoryCertified:0,
  signedOfficialV5Actions:0
 };
 const views={};
 for(const view of VIEWS){
  const rows=globalRebinding.views?.[view],
   mv=sourceM4Views?.[view]?.nativeOriginal3DM4Candidates;
  if(!Array.isArray(rows)||!Array.isArray(mv)||
     !Array.isArray(cad.views?.[view])||
     !Array.isArray(cad.hiddenSharpViews?.[view]))
   throw new RangeError('incomplete native source M4/generated HLR first-angle view');
  const m4ById=new Map();
  for(const x of mv){
   if(x?.view!==view||!originals.has(x.sourceEdgeId)||
      m4ById.has(x.sourceEdgeId)||x.officialV5Authorized!==false||
      !Array.isArray(x.segments))
    throw new RangeError('stale or forged native source M4 interval');
   m4ById.set(x.sourceEdgeId,x);
  }
  // The independently extracted WHOLE-SOLID native 3D HLR source curve
  // is checked against each generated 2D ordinal. This is stronger than
  // rounded-paper collinearity, but still NOT an OCCT 2D TopoDS source
  // history API and cannot authorize a standard engineering stroke.
  const scoped=cad.nativeSourceScopedSharpOutputByView?.[view];
  const global3D=scoped?.nativeGlobal3DOriginalSourceEvidence;
  const byNative3DCurve=new Map();
  // An isolated legacy M4 fixture may not carry this optional independent
  // whole-solid 3D curve export. Never fabricate it or claim a 3D binding.
  // In real pinned OCJS runs the export exists and is cross-checked below.
  if(global3D!==undefined){
   if(global3D?.schema!==
       'draftai-c1-global-native-hlr-3d-original-curve-corroboration/1'||
      global3D.sourceGeometryId!==geometry.id||
      global3D.revision!==cad.revision||global3D.view!==view||
      global3D.allGenerated3DSharpCurvesBoundToOriginalBRepAnd2DPaper!==true||
      global3D.generated2DTo3DTopoDSHistoryCertified!==false||
      global3D.globalContinuousVisibilityCertified!==false||
      global3D.officialV5Authorized!==false||
      global3D.signedV5ActionCount!==0||
      !Array.isArray(global3D.rows)||
      global3D.rows.length!==cad.views[view].length+
       cad.hiddenSharpViews[view].length||
      global3D.globalGenerated2DSharpEdges!==global3D.rows.length||
      global3D.globalGenerated3DSharpEdgesWithUniqueOriginalCurve!==
       global3D.rows.length)
    throw new RangeError('missing independent whole-solid native 3D original source curve witness');
   for(const curve of global3D.rows){
    const klass=curve?.hlrClass,ordinal=curve?.wholeSolidGeneratedHLREdgeOrdinal,
     key=klass+'|'+ordinal,
     available=klass==='visible-sharp'?cad.views[view]:
      klass==='hidden-sharp'?cad.hiddenSharpViews[view]:null,
     range=curve?.originalNativeCurveParameterRange;
    if(curve.view!==view||!available||
       !Number.isSafeInteger(ordinal)||ordinal<0||ordinal>=available.length||
       byNative3DCurve.has(key)||!originals.has(curve.originalPhysicalSourceEdgeId)||
       !Array.isArray(range)||range.length!==2||
       !range.every(Number.isFinite)||!(range[1]>range[0])||
       curve.globalNative3DHLRCurveEqualsOriginalBRepAtThreeParameters!==true||
       curve.global3DAnd2DHLRMeasuredPaperPairUnique!==true||
       curve.global3DAndOriginalScoped3DHLRParameterIntervalExact!==true||
       curve.globalGenerated2DTo3DTopoDSHistoryCertified!==false||
       curve.fullOpaqueSceneContinuousOcclusionCertified!==false||
       curve.engineeringLineStyle!=='undetermined'||curve.signedV5Action!==false)
     throw new RangeError('forged global native 3D original source curve and generated 2D pairing');
    byNative3DCurve.set(key,curve);
   }
  }
  const result=[],seen=new Set(),vertices=new Map();
  for(const row of rows){
   const klass=row.hlrClass,ordinal=row.wholeSolidGeneratedHLREdgeOrdinal,
    key=klass+'|'+ordinal,
    lines=klass==='visible-sharp'?cad.views[view]:
     klass==='hidden-sharp'?cad.hiddenSharpViews[view]:null;
   if(!lines||!Number.isSafeInteger(ordinal)||ordinal<0||
      ordinal>=lines.length||seen.has(key)||
      row.view!==view||row.signedV5Action!==false||
      row.wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified!==false)
    throw new RangeError('forged or duplicate global HLR native ordinal');
   seen.add(key);
   const global3DSource=byNative3DCurve.get(key)??null;
   if(global3D&& !global3DSource)
    throw new RangeError('missing independently measured 3D curve for generated HLR ordinal');
   const line=lines[ordinal],originalId=row.uniqueOriginalSourceFilteredPaperCandidate,
    physical=originals.get(originalId),
    originalBRep=native.get(originalId);
   if(!line?.from||!line.to||!['u','v'].every(k=>
       Number.isFinite(line.from[k])&&Number.isFinite(line.to[k])))
    throw new RangeError('incomplete actual whole-solid generated HLR line endpoints');
   if(global3DSource){
    counts.genuineGlobal3DSourceCurvePaperPairsCrossChecked++;
    if(originalId!==null&&originalId!==
       global3DSource.originalPhysicalSourceEdgeId)
     throw new RangeError('unique scoped 2D source contradicts independently measured whole-solid native 3D original curve');
    if(originalId===null)
     counts.genuineGlobal3DSourceCurveWithoutUniqueScoped2DClaim++;
   }
   counts.globalGeneratedHLREdgesChecked++;
   let modelVerified=false,sourceClassFull=false,originalPaperExact=false,
    boundedPaper=false,sourcePaperEnvelope=null,links=[];
   if(originalId!==null){
    if(!physical||!originalBRep||
       row.exactlyOneNativeSourceScopedWitnessForWholeSolidEdge!==true||
       row.uniqueNativeScopedAndWholeSolidBinary64PaperEndpointsAgree!==true)
     throw new RangeError('unsigned unique source requires genuine original 3D ownership');
    counts.uniqueOriginalSourceGlobalEdgesExamined++;
    const [aId,bId]=physical,[a,b]=physical.map(k=>geometry.data.points[k]);
    modelVerified=(xyz(originalBRep.fromOCCT3D,a)&&
      xyz(originalBRep.toOCCT3D,b))||
     (xyz(originalBRep.fromOCCT3D,b)&&
      xyz(originalBRep.toOCCT3D,a));
    if(modelVerified)counts.nativeOriginalBRepExactPhysicalEndpointPairs++;
    // The genuine ORIGINAL native 3D class may be split across multiple
    // adjacent parameter spans. A single [0,1] segment is not required:
    // certify exact full coverage with no positive gaps or overlaps instead.
    // Never turn a union containing duplicate spans into once-only lineage.
    const m4=m4ById.get(originalId),segments=m4?.segments??[];
    const ranges=segments.map(s=>s?.originalM0UnitParameterRange);
    const wellFormed=ranges.length>0&&ranges.length<=512&&ranges.every(r=>
     Array.isArray(r)&&r.length===2&&r.every(Number.isFinite)&&
     r[0]>=0&&r[1]<=1&&r[1]>r[0]);
    const sorted=wellFormed?[...ranges].sort((a,b)=>a[0]-b[0]||a[1]-b[1]):[];
    const disjoint=wellFormed&&sorted.every((r,i)=>
     i===0||r[0]>=sorted[i-1][1]);
    const classConsistent=segments.length>0&&segments.every(s=>
     s.sourceEdgeId===originalId&&s.view===view&&
     s.native3DHLRClass===klass&&
     s.derivedFromOriginalNative3DCurveNotGeneratedHLRPaper===true&&
     s.engineeringLineStyle==='undetermined'&&s.signedV5Action===false);
    sourceClassFull=disjoint&&classConsistent&&
     exactCandidateIntervalCoverage([0,1],ranges).
      entireOriginalParameterIntervalCovered===true&&
     m4?.native3DSourceParameterPartitionCompleteExactlyOnce===true&&
     m4.M4OriginalUnitIntervalCandidateCoverageComplete===true&&
     m4.native3DOriginalParameterPositiveGaps?.length===0&&
     m4.native3DOriginalParameterPositiveOverlaps?.length===0&&
     m4.M4ProjectedNative3DIntervalsHeldForBinary64Representation?.length===0;
    if(sourceClassFull)counts.completeOriginalNative3DClassSourceIntervalRows++;
    const [p,q]=[project(a)[view],project(b)[view]];
    const forward=p2eq(line.from,p)&&p2eq(line.to,q),
     reverse=p2eq(line.from,q)&&p2eq(line.to,p);
    originalPaperExact=forward||reverse;
    if(originalPaperExact)counts.exactOriginalM0PaperEndpointPairs++;
    // The 2D rational native-class check can still be STRICTLY backed
    // while the received OCCT paper ENDPOINT is rounded by <1 ULP.
    // Re-check the physical full-source endpoint pair against the same
    // tightly bounded envelope independently of class interval support.
    // Do not turn this into exact original [0,1] paper or TopoDS history.
    sourcePaperEnvelope=boundedOriginalFullPaperEndpointEnvelope(
     p,q,line.from,line.to);
    boundedPaper=!originalPaperExact&&
     sourcePaperEnvelope.compatible===true&&sourceClassFull&&modelVerified&&
     (row.boundedWholeOriginal3DRoundingBackingForUniqueGlobalEdge===true||
      row.exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge===true);
    if(boundedPaper){
     counts.roundedOnlyOriginalM0PaperEndpointPairs++;
     if(row.exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge===true)
      counts.strictlyClassBackedButRoundedOriginalM0PaperEndpoints++;
    }else if(!originalPaperExact)
     counts.sourceScaleULPEnvelopeRejectedOriginalM0PaperEndpoints++;
    // A source-scoped generated segment may have a matching native
    // interval while the independent entire-original native 3D partition
    // still contains gaps. HOLD this endpoint proof instead of treating
    // earlier paper class compatibility as complete native coverage.
    const direct=line.directNativeVertexOriginalSource;
    if(direct!==undefined&&(!Array.isArray(direct)||direct.length!==2))
     throw new RangeError('bad generated TopoDS vertex native original match array');
    const endpointIds=forward?[aId,bId]:reverse?[bId,aId]:
     p2eq(line.from,p)?[aId,bId]:p2eq(line.from,q)?[bId,aId]:
     [aId,bId]; // bounded case: derive oriented by received 2D distance
    if(!originalPaperExact){
     const d=(x,y)=>Math.hypot(x.u-y.u,x.v-y.v);
     const f=d(line.from,p)+d(line.to,q),
      r=d(line.from,q)+d(line.to,p);
     if(!(f<r||r<f))throw new RangeError('ambiguous original generated 2D HLR endpoint orientation');
     if(r<f){endpointIds[0]=bId;endpointIds[1]=aId;}
    }
    for(let side=0;side<2;side++){
     const candidateId=endpointIds[side],paper=side===0?line.from:line.to,
      projectedM0=project(geometry.data.points[candidateId])[view],
      positive=direct?.[side];
     if(positive?.directOriginal3DVertexTopoDSIdentityProven===true){
      if(positive.directlySameOriginalM0VertexId!==candidateId||
         !p2eq(paper,projectedM0))
       throw new RangeError('genuine OCCT generated vertex IsSame contradicts original M0 physical endpoint');
      counts.generatedOriginalTopoDSDirectVertexIdentityEndpoints++;
     }
     links.push({side:side===0?'from':'to',
      originalPhysicalM0VertexId:candidateId,
      originalM0VertexXYZ:{...geometry.data.points[candidateId]},
      generatedPaperExactlyEqualsOriginalM0Vertex:p2eq(paper,projectedM0),
      originalNativeBRep3DSourceEndpointIndependentlyExact:modelVerified,
      entireOriginal3DSourceNativeClassConfirmed:sourceClassFull,
      generatedPaperOnlyWithinWholeSourceOneULPEnvelope:
       boundedPaper&&!p2eq(paper,projectedM0),
      actualNativeGeneratedVertexToOriginalTopoDSIsSame:
       positive?.directOriginal3DVertexTopoDSIdentityProven===true,
      paperAndSourceProximityIsNotNativeVertexTopologyIdentity:true,
      signedV5Action:false});
     if(modelVerified&&sourceClassFull&&(originalPaperExact||boundedPaper)){
      const node=vertices.get(candidateId)??[];
      node.push({klass,ordinal,sourceEdgeId:originalId,
       side:side===0?'from':'to',
       paperExactlyOriginalM0:p2eq(paper,projectedM0)});
      vertices.set(candidateId,node);
     }
    }
   }
   if(!modelVerified||!sourceClassFull||!originalPaperExact&&!boundedPaper)
    counts.physicalOriginalM0EndpointRowsHeld++;
   result.push({view,hlrClass:klass,wholeSolidGeneratedHLREdgeOrdinal:ordinal,
    independentlyMeasuredGlobalNative3DOriginalSourceCandidate:
     global3DSource?.originalPhysicalSourceEdgeId??null,
    independentGlobal3DOriginalCurveParameterRange:
     global3DSource?[...global3DSource.originalNativeCurveParameterRange]:null,
    independentGlobal3DSourceIsNotGenerated2DTopoDSHistory:true,
    uniqueOriginalSourceFilteredPaperCandidate:originalId,
    originalPhysicalM0EdgeEndpointIds:physical??null,
    trueOriginalNativeOCCT3DEndpointsMatchM0Exactly:modelVerified,
    completeOriginalNativeSource3DClassCoversWholeEdge:sourceClassFull,
    receivedGenerated2DEndpointsMatchBothOriginalProjectedVerticesExactly:
     originalPaperExact,
    generated2DRepresentationBoundedOnlyWithoutPhysicalVertexIdentity:
     boundedPaper,
    strictlyOriginal3DClassBackedButPaperEndpointsRounded:
     boundedPaper&&
      row.exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge===true,
    originalM0PaperEndpointRoundoffEnvelope:sourcePaperEnvelope??null,
    exactOriginalM0PaperEndpointsNotReplacedByRoundoffEvidence:true,
    original3DToGenerated2DEndpointWitnesses:links,
    generated2DToOriginalNativeTopoDSFullVertexTopologyCertified:false,
    continuousAllOpaqueFaceVisibilityProven:false,
    engineeringLineStyle:'undetermined',signedV5Action:false});
  }
  if(seen.size!==cad.views[view].length+cad.hiddenSharpViews[view].length)
   throw new RangeError('whole-solid generated endpoint source inventory not exhaustive');
  const pairRows=[];
  for(const [vertexId,group] of vertices){
   for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){
    if(group[i].ordinal===group[j].ordinal&&group[i].klass===group[j].klass)
     throw new RangeError('one noncollapsed global HLR edge has duplicate physical vertex endpoints');
    const both=group[i].paperExactlyOriginalM0&&group[j].paperExactlyOriginalM0;
    counts.originalModelPhysicalJunctionPairCandidates++;
    if(physicalGraph)counts.originalBRepPhysicalJunctionPairsWithVerifiedNativeTShape++;
    counts.physicalJunctionPairsWithBothExactGeneratedPaperEndpoints+=Number(both);
    counts.physicalJunctionPairsWithAtLeastOneRoundedEndpoint+=Number(!both);
    pairRows.push({view,originalPhysicalM0VertexId:vertexId,
     originalPhysicalM0SourceEdges:[group[i].sourceEdgeId,group[j].sourceEdgeId],
     globalGeneratedHLREndpoints:[group[i],group[j]],
     actualNativeGeneratedTopoDSVertexIsSameForThisPairProven:false,
     original3DPhysicalVertexCoincidenceProvenFromIndependentM0:true,
     originalBRepPhysicalVertexTShapeIdentityProven:!!physicalGraph,
     distinctGeneratedHLRTShapesCannotVetoOriginalBRepPhysicalJunction:true,
     paperCoincidenceCannotSignEngineeringJunction:true,
     signedV5Action:false});
   }
  }
  // Consume the independent genuine OCCT generated TopoDS *vertex*
  // graph (not generated edge-to-original 3D TopoDS history).
  // The true IsSame comparison was performed while native handles lived.
  // NEVER synthesize connectivity from paper or shared original M0 vertex.
  const nativeGraph=cad.nativeGeneratedVertexGraph;
  if(nativeGraph!==undefined){
   const g=nativeGraph.views?.[view],
    expectedCount=cad.views[view].length+cad.hiddenSharpViews[view].length;
   if(nativeGraph.schema!==
       'draftai-ocjs-genuine-hlr-generated-topods-issame-vertex-graph/1'||
      nativeGraph.realOCCTIsSameComparedBeforeNativeObjectDeletion!==true||
      nativeGraph.allVHWGeneratedNativeTopologyPairsComparedWithoutPaperBucketing!==true||
      nativeGraph.actualGeneratedToOriginalTopoDSHistoryRecovered!==false||
      nativeGraph.signedV5ActionCount!==0||
      g?.view!==view||g.realNativeSharpEdgeCount!==expectedCount||
      g.allNativeGeneratedEndpointPairsIndependentlyCompared!==true||
      !Array.isArray(g.sameActualGeneratedOCCTTopoDSVertexPairs)||
      !Array.isArray(g.paperCoincidentButDifferentTopoDSVertexPairs))
    throw new RangeError('genuine native generated HLR TopoDS vertex graph unavailable or forged');
   const endKey=r=>r.hlrClass+'|'+r.nativeHLREdgeOrdinal+'|'+r.side;
   const pairKey=(a,b)=>[endKey(a),endKey(b)].sort().join('#');
   const realPairs=new Map();
   for(const [positive,items] of [
    [true,g.sameActualGeneratedOCCTTopoDSVertexPairs],
    [false,g.paperCoincidentButDifferentTopoDSVertexPairs]
   ])for(const pair of items){
    if(pair?.view!==view||pair.signedV5Action!==false||
       pair.nativeGeneratedOCCTTopoDSVertexIsSame!==positive)
     throw new RangeError('forged native HLR vertex IsSame pair');
    const check=r=>{
     if(!['visible-sharp','hidden-sharp'].includes(r?.hlrClass)||
        !['from','to'].includes(r?.side)||
        !Number.isSafeInteger(r.nativeHLREdgeOrdinal)||r.nativeHLREdgeOrdinal<0)
      throw new RangeError('bad genuine HLR native generated endpoint ref');
     const list=r.hlrClass==='visible-sharp'?
      cad.views[view]:cad.hiddenSharpViews[view];
     const seg=list[r.nativeHLREdgeOrdinal],pt=seg?.[r.side];
     if(!p2eq(pt,r.nativePaperPoint))
      throw new RangeError('genuine native vertex IsSame paper point contradicts generated HLR edge');
    };
    check(pair.a);check(pair.b);
    const key=pairKey(pair.a,pair.b);
    if(realPairs.has(key)||endKey(pair.a)===endKey(pair.b))
     throw new RangeError('duplicated or self native generated vertex IsSame pair');
    realPairs.set(key,positive);
    counts.realNativeGeneratedVertexGraphPairsChecked++;
   }
   for(const row of pairRows){
    const [a,b]=row.globalGeneratedHLREndpoints;
    const ref=x=>({hlrClass:x.klass,nativeHLREdgeOrdinal:x.ordinal,side:x.side});
    const pair=realPairs.get(pairKey(ref(a),ref(b)));
    if(pair===true){
     // A genuine generated TopoDS pairwise IsSame can be recorded,
     // even if its PAPER endpoint representation was rounded. This
     // still cannot establish exact original 3D source-parameter
     // endpoint identity, whole-scene occlusion or official V5.
     row.actualNativeGeneratedTopoDSVertexIsSameForThisPairProven=true;
     counts.physicalOriginalJunctionPairsWithActualGeneratedTopoDSIsSame++;
    }else if(pair===false){
     row.nativeGeneratedTopoDSVertexDistinctDespiteM0PhysicalJoin=true;
     counts.physicalOriginalJunctionPairsWithDistinctNativeTopoDSVertices++;
     if(row.originalBRepPhysicalVertexTShapeIdentityProven)
      counts.originalBRepPhysicalJunctionPairsDespiteDistinctGeneratedTShapes++;
    }
   }
   const physical=new Set(pairRows.map(p=>{
    const [a,b]=p.globalGeneratedHLREndpoints;
    return pairKey({hlrClass:a.klass,nativeHLREdgeOrdinal:a.ordinal,side:a.side},
     {hlrClass:b.klass,nativeHLREdgeOrdinal:b.ordinal,side:b.side});
   }));
   for(const [pair,positive] of realPairs)
    if(positive&&!physical.has(pair))
     counts.nativeGeneratedTopoDSJunctionPairsWithoutPhysicalOriginalM0Join++;
  }
  views[view]={rows:result,originalPhysicalEndpointPairCandidates:pairRows};
 }
 return freeze({
  schema:'draftai-c1-global-generated-hlr-to-original-m0-3d-endpoint-junction-ledger/1',
  sourceGeometryId:geometry.id,revision:cad.revision,
  counts,views,
  trueOriginal3DPhysicalSourceEndpointsRecheckedIndependently:true,
  originalM0SharedVertexDoesNotProveGeneratedTopoDSIsSame:true,
  originalNativeOCCTHLRGeneratedVertexGraphCrossReferenced:
   cad.nativeGeneratedVertexGraph!==undefined,
  originalNativeBRepPhysicalVertexTopologyVerified:
   physicalGraph!==undefined,
  originalNativeBRepFaceEdgeAdjacencyVerified:faceGraph!==undefined,
  generated2DToOriginal3DNativeTopoDSVertexTopologyCertified:false,
  allOpaqueFaceOcclusionCertified:false,
  officialV5Authorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1GlobalNativeHLROriginalM0EndpointLinks};
