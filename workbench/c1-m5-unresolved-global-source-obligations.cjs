'use strict';
/**
 * An exact-count, same-source/revision join of still-unresolved M5
 * original-source obligations. A generated HLR paper edge plus original
 * 3D BRep endpoints is useful diagnostic evidence, not a signed line.
 * This module specifically vetoes cross-source class/ordinal laundering.
 */
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
function auditC1M5UnresolvedGlobalSourceObligations({geometry,cad,positiveOriginalGapRays}={}){
 const audit=positiveOriginalGapRays;
 if(!geometry?.id||cad?.sourceGeometryId!==geometry.id||
    !Number.isSafeInteger(cad.revision)||cad.revision<1||
    audit?.schema!=='draftai-c1-native-gap-positive-original-ray-theorem/1'||
    audit.sourceGeometryId!==geometry.id||
    audit.revision!==cad.revision||audit.officialV5Authorized!==false||
    audit.signedV5ActionCount!==0||
    !Array.isArray(audit.missingOriginalM0SourceViewRows)||
    !Array.isArray(audit.rows))
  throw new TypeError('current unsigned original native M5 source gap and ray inventory required');
 const counts={unrepresentedOriginalSourceViews:0,positiveOriginalPaperGapIntervals:0,
  unresolvedM5Obligations:0,obligationsWithGlobalOriginalSourceAnd3DEndpoints:0,
  obligationsWithStrictNative3DClass:0,obligationsWithBoundedOnlyNative3DClass:0,
  obligationsWithPhysicalOriginalM0JunctionCandidates:0,
  obligationsWithActualNativeGeneratedJunctionIsSame:0,
  obligationsWithDistinctNativeGeneratedVertices:0,
  unsignedV5Actions:0},records=[],seen=new Set();
 for(const [kind,rows] of [
  ['unrepresented-original-m0-view',audit.missingOriginalM0SourceViewRows],
  ['positive-original-m0-parameter-gap',audit.rows]
 ])for(const row of rows){
  if(!['V','H','W'].includes(row?.view)||
     typeof row.sourceEdgeId!=='string'||!row.sourceEdgeId.startsWith(geometry.id+'::')||
     !Array.isArray(row.wholeSolidGeneratedHLROriginalSourceFilterMatches)||
     !Array.isArray(row.wholeSolidGeneratedHLROriginal3DEndpointWitnesses)||
     !Array.isArray(row.wholeSolidGeneratedOriginal3DPhysicalNativeJunctionPairs)||
     row.originalM0PhysicalEndpointEvidenceCannotReplaceNativeHLRJunctionIdentity!==true||
     row.originalPhysicalJunctionAndGeneratedNativeIsSameCannotReplaceSceneM5!==true)
   throw new RangeError('untrusted or unbound M5 original physical source obstacle');
  const interval=kind==='positive-original-m0-parameter-gap'?
   row.originalSourceParameterGap:null;
  if(interval!==null&&(!Array.isArray(interval)||interval.length!==2||
      !interval.every(Number.isFinite)||!(interval[1]>interval[0])))
   throw new RangeError('M5 positive original parameter gap cannot be snapped away');
  const id=[kind,row.view,row.sourceEdgeId,
   interval===null?'full-source':interval.join(':')].join('|');
  if(seen.has(id))throw new RangeError('duplicate source-specific M5 obstacle');
  seen.add(id);
  counts.unresolvedM5Obligations++;
  if(interval===null)counts.unrepresentedOriginalSourceViews++;
  else counts.positiveOriginalPaperGapIntervals++;
  const paper=row.wholeSolidGeneratedHLROriginalSourceFilterMatches;
  const endpoints=row.wholeSolidGeneratedHLROriginal3DEndpointWitnesses;
  const key=x=>x.hlrClass+'|'+x.wholeSolidGeneratedHLREdgeOrdinal;
  const paperIds=new Set(paper.map(key)),endpointIds=new Set(endpoints.map(key));
  if(!paper.length||paper.length!==endpoints.length||
     paperIds.size!==paper.length||endpointIds.size!==endpoints.length||
     [...paperIds].some(k=>!endpointIds.has(k)))
   throw new RangeError('M5 gap must bind an exact bijection of generated HLR source and original BRep endpoints');
  let strict=0,bounded=0;
  for(const p of paper){
   const e=endpoints.find(x=>key(x)===key(p));
   if(p.sourceEdgeId!==row.sourceEdgeId||p.view!==row.view||
      p.sourceScopedWholeGeneratedBinary64PaperExactlyMatched!==true||
      p.actualGeneratedToOriginalTopoDSHistoryCertified!==false||
      p.allOpaqueFaceOcclusionCertified!==false||
      p.signedV5Action!==false||
      !e||e.sourceEdgeId!==row.sourceEdgeId||e.view!==row.view||
      e.original3DBRepExactModelVertexEndpoints!==true||
      e.original3DSourceClassComplete!==true||
      !Array.isArray(e.originalM0PhysicalVertexIds)||
      e.originalM0PhysicalVertexIds.length!==2||
      e.nativeGenerated3DJunctionIdentityCertified!==false||
      e.globalOpaqueFaceOcclusionCertified!==false||e.signedV5Action!==false)
    throw new RangeError('generated global HLR/source 3D physical endpoint evidence contradicted');
   const s=p.originalNative3DClassExactlyBacksEntireGeneratedLine===true,
    b=p.originalNative3DClassWithinFullSourceOneULPEnvelopeOnly===true;
   if(s===b)throw new RangeError('one original native source class requires exact or bounded-only evidence');
   strict+=Number(s);bounded+=Number(b);
  }
  const joins=row.wholeSolidGeneratedOriginal3DPhysicalNativeJunctionPairs;
  for(const j of joins){
   if(j.view!==row.view||
      !Array.isArray(j.originalPhysicalM0SourceEdges)||
      !j.originalPhysicalM0SourceEdges.includes(row.sourceEdgeId)||
      j.original3DPhysicalVertexProvenFromM0NotNativeHistory!==true||
      j.noIndependentGlobalOpaqueVisibilityOrGBLineJoinCertification!==true||
      j.signedV5Action!==false||
      j.generatedHLRNativeTopoDSIsSamePairProven===true&&
       j.generatedHLRNativeTopoDSDistinctDespitePhysicalM0Join===true)
    throw new RangeError('native generated vertex topology conflicts with original M0 3D physical junction');
  }
  counts.obligationsWithGlobalOriginalSourceAnd3DEndpoints++;
  counts.obligationsWithStrictNative3DClass+=Number(strict>0);
  counts.obligationsWithBoundedOnlyNative3DClass+=Number(bounded>0);
  counts.obligationsWithPhysicalOriginalM0JunctionCandidates+=Number(joins.length>0);
  counts.obligationsWithActualNativeGeneratedJunctionIsSame+=
   Number(joins.some(j=>j.generatedHLRNativeTopoDSIsSamePairProven===true));
  counts.obligationsWithDistinctNativeGeneratedVertices+=
   Number(joins.some(j=>j.generatedHLRNativeTopoDSDistinctDespitePhysicalM0Join===true));
  records.push({kind,view:row.view,sourceEdgeId:row.sourceEdgeId,
   originalM0PositiveParameterGap:interval===null?null:[...interval],
   actualGlobalHLROrdinals:paper.map(p=>({
    hlrClass:p.hlrClass,ordinal:p.wholeSolidGeneratedHLREdgeOrdinal
   })),
   independentlyOriginalBRep3DEndpointsPresent:true,
   strictNativeClassWitnesses:strict,boundedNativeClassWitnesses:bounded,
   sharedOriginalM0JunctionCandidates:joins.length,
   sourceOriginalTopoDSGeneratedHistoryCertified:false,
   allOpaqueSceneContinuousOcclusionCertified:false,
   generatedEdgeEngineeringLineStyle:'undetermined',
   signedV5Action:false});
 }
 if(counts.unrepresentedOriginalSourceViews!==audit.missingOriginalM0SourceViewRows.length||
    counts.positiveOriginalPaperGapIntervals!==audit.rows.length)
  throw new RangeError('M5 unrepresented/source-gap original inventory incomplete');
 return frozen({schema:'draftai-c1-m5-unresolved-global-original-source-junction-obligations/1',
  sourceGeometryId:geometry.id,revision:cad.revision,counts,records,
  allUnresolvedM5ObligationsExplicitlyPreserved:true,
  generatedHistoryAndContinuousSceneOcclusionStillRequired:true,
  officialV5Authorized:false,signedV5ActionCount:0});
}
module.exports={auditC1M5UnresolvedGlobalSourceObligations};
