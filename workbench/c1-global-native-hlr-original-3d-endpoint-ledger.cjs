'use strict';
/**
 * Join real global OCJS generated 2D HLR edge ordinals with the ORIGINAL
 * independent TopoDS input BRep line endpoints, 3D native source-class
 * intervals and exact M0 physical vertex IDs. Generated paper coincidence
 * cannot certify a shared HLR TopoDS vertex, and a one-ULP-bound display
 * endpoint cannot certify exact physical junction topology or GB/V5.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
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
   const line=lines[ordinal],originalId=row.uniqueOriginalSourceFilteredPaperCandidate,
    physical=originals.get(originalId),
    originalBRep=native.get(originalId);
   if(!line?.from||!line.to||!['u','v'].every(k=>
       Number.isFinite(line.from[k])&&Number.isFinite(line.to[k])))
    throw new RangeError('incomplete actual whole-solid generated HLR line endpoints');
   counts.globalGeneratedHLREdgesChecked++;
   let modelVerified=false,sourceClassFull=false,originalPaperExact=false,
    boundedPaper=false,links=[];
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
    const m4=m4ById.get(originalId),matching=m4?.segments.filter(s=>
     s.sourceEdgeId===originalId&&s.view===view&&
     s.native3DHLRClass===klass&&
     s.derivedFromOriginalNative3DCurveNotGeneratedHLRPaper===true&&
     s.engineeringLineStyle==='undetermined'&&s.signedV5Action===false&&
     s.originalM0UnitParameterRange?.[0]===0&&
     s.originalM0UnitParameterRange?.[1]===1)??[];
    sourceClassFull=matching.length===1&&
     m4?.native3DSourceParameterPartitionCompleteExactlyOnce===true&&
     m4.M4OriginalUnitIntervalCandidateCoverageComplete===true&&
     m4.M4ProjectedNative3DIntervalsHeldForBinary64Representation.length===0;
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
    const sourcePaperEnvelope=boundedOriginalFullPaperEndpointEnvelope(
     p,q,line.from,line.to);
    const boundedPaper=!originalPaperExact&&
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
      node.push({klass,ordinal,side:side===0?'from':'to',
       paperExactlyOriginalM0:p2eq(paper,projectedM0)});
      vertices.set(candidateId,node);
     }
    }
   }
   if(!modelVerified||!sourceClassFull||!originalPaperExact&&!boundedPaper)
    counts.physicalOriginalM0EndpointRowsHeld++;
   result.push({view,hlrClass:klass,wholeSolidGeneratedHLREdgeOrdinal:ordinal,
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
    counts.physicalJunctionPairsWithBothExactGeneratedPaperEndpoints+=Number(both);
    counts.physicalJunctionPairsWithAtLeastOneRoundedEndpoint+=Number(!both);
    pairRows.push({view,originalPhysicalM0VertexId:vertexId,
     globalGeneratedHLREndpoints:[group[i],group[j]],
     actualNativeGeneratedTopoDSVertexIsSameForThisPairProven:false,
     original3DPhysicalVertexCoincidenceProvenFromIndependentM0:true,
     paperCoincidenceCannotSignEngineeringJunction:true,
     signedV5Action:false});
   }
  }
  views[view]={rows:result,originalPhysicalEndpointPairCandidates:pairRows};
 }
 return freeze({
  schema:'draftai-c1-global-generated-hlr-to-original-m0-3d-endpoint-junction-ledger/1',
  sourceGeometryId:geometry.id,revision:cad.revision,
  counts,views,
  trueOriginal3DPhysicalSourceEndpointsRecheckedIndependently:true,
  originalM0SharedVertexDoesNotProveGeneratedTopoDSIsSame:true,
  generated2DToOriginal3DNativeTopoDSVertexTopologyCertified:false,
  allOpaqueFaceOcclusionCertified:false,
  officialV5Authorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1GlobalNativeHLROriginalM0EndpointLinks};
