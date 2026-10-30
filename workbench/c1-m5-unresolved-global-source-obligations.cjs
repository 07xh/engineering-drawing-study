'use strict';
/**
 * An exact-count, same-source/revision join of still-unresolved M5
 * original-source obligations. A generated HLR paper edge plus original
 * 3D BRep endpoints is useful diagnostic evidence, not a signed line.
 * This module specifically vetoes cross-source class/ordinal laundering.
 */
const {auditC1NativeScopedHLRSourceConsumer}=
 require('./c1-native-scoped-hlr-source-consumer.cjs');
const {auditC1ExactConvexOriginalOpenEdgeRays}=
 require('./c1-exact-convex-original-open-edge-ray.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};

/**
 * Recheck the existing M4 original 3D source intervals and canonical exact
 * event cuts as ONE continuous [0,1] source-depth partition. Genuine
 * original-vertex ties may certify OPEN depth order; they do not certify
 * closed endpoints, opaque-face visibility, generated TopoDS history or V5.
 */
function auditExistingM4OpenSourceDepth(row,kind){
 const gap=kind==='positive-original-m0-parameter-gap';
 if((gap?row.nativeOriginal3DM4GapSourceProjectionAvailable:
     row.nativeOriginal3DM4SourceProjectionPresent)!==true)return null;
 if(gap&&row.realNative3DM4OriginalParameterGapCoverage?.originalParameterRange&&
    (row.realNative3DM4OriginalParameterGapCoverage.originalParameterRange[0]!==row.originalSourceParameterGap[0]||
     row.realNative3DM4OriginalParameterGapCoverage.originalParameterRange[1]!==row.originalSourceParameterGap[1]))
  throw new RangeError('original M4 depth does not belong to the positive M5 gap');
 if((gap?
      row.realNative3DM4OriginalParameterGapCoverage?.entireOriginalParameterIntervalCovered:
      row.nativeOriginal3DM4ProjectionWholeSourceCoverage)!==true||
    row.completeRealNative3DSourceParameterPartition!==true||
    row.originalM4SourcePartitionComplete!==true)
  return {completeOriginalM4SourceDepthPartition:false,
   reason:'incomplete-original-native-3d-m4-partition',signedV5Action:false};
 const source=gap?row.nativeOriginal3DM4ProjectedCandidateSegments:
   row.native3DM4ProjectedCandidateSegments,
  depth=row.nativeOriginalM4CoProjectedDepthOrder;
 if(!Array.isArray(source)||!Array.isArray(depth)||
    !source.length||source.length!==depth.length)
  throw new RangeError('M4 source and depth intervals lack a bijection');
 const rows=depth.map((item,i)=>{
  const r=item.originalM0UnitParameterRange,p=source[i];
  if(!Array.isArray(r)||r.length!==2||!r.every(Number.isFinite)||
     r[0]<0||!(r[1]>r[0])||r[1]>1||
     p?.sourceEdgeId!==row.sourceEdgeId||p.view!==row.view||
     p.native3DHLRClass!==item.native3DHLRClass||
     p.originalM0UnitParameterRange?.[0]!==r[0]||
     p.originalM0UnitParameterRange?.[1]!==r[1]||
     item.canonicalOriginalM4EventCutPartitionCoversNative3DInterval!==true||
     item.originalM4CutEndpointDoesNotAuthorize3DPhysicalJunction!==true||
     item.originalSourceCompetitionOnlyNotWholeOpaqueSceneVisibility!==true||
     item.generated2DHLREdgeTopologyProven!==false||
     item.engineeringLineStyle!=='undetermined'||item.signedV5Action!==false||
     !Array.isArray(item.canonicalOriginalM4EventCutDepthRows)||
     !item.canonicalOriginalM4EventCutDepthRows.length)
   throw new RangeError('invalid native M4 source/depth interval witness');
  return {r,item};
 }).sort((a,b)=>a.r[0]-b.r[0]);
 let cursor=0,front=0,hidden=0,held=0,subpixel=0;
 for(const {r,item} of rows){
  if(r[0]!==cursor)throw new RangeError('positive M4 original source gap or overlap');
  let cutCursor=r[0];
  for(const cut of item.canonicalOriginalM4EventCutDepthRows){
   const t=cut.originalM4SourceCutParameterRange,d=cut.coProjectedOriginal3DDepthOrder;
   if(!Array.isArray(t)||t.length!==2||!t.every(Number.isFinite)||
      t[0]!==cutCursor||!(t[1]>t[0])||t[1]>r[1]||
      cut.originalM4CutFromCurrentReviewedEventGraph!==true||
      cut.originalM4EventPaperOnlyIsNot3DPhysicalJunction!==true||
      cut.openIntervalSourceOrderCannotCertifyClosedOriginalVertices!==true||
      cut.engineeringLineStyle!=='undetermined'||cut.signedV5Action!==false||
      d?.view!==row.view||d.sourceEdgeId!==row.sourceEdgeId||
      d.originalParameterRange?.[0]!==t[0]||
      d.originalParameterRange?.[1]!==t[1]||
      d.engineeringLineStyleSigned!==false||d.signedV5ActionCount!==0)
    throw new RangeError('M4 canonical event cut has a positive gap or forged source');
   if(d.status==='positive-original-dyadic-projection-below-paper-resolution-held'){
    if(d.originalDyadicProjectedIntervalPositive!==true||
       d.renderedPaperSegmentNotCertified!==true||
       cut.strictlyFrontmostAmongOriginal3DSourcesOnOpenIntervalOnly!==false||
       cut.hiddenBehindIndependentlyClearOriginalSourceOnOpenIntervalOnly!==false)
     throw new RangeError('subpixel positive M4 cut cannot become a stroke');
    held++;subpixel++;
   }else{
    if(d.schema!=='draftai-c1-original-3d-coproject-depth-order/1'||
       cut.strictlyFrontmostAmongOriginal3DSourcesOnOpenIntervalOnly!==
        (d.entireOpenIntervalStrictlyInFrontOfAllOriginalCoProjectedSources===true)||
       cut.hiddenBehindIndependentlyClearOriginalSourceOnOpenIntervalOnly!==
        (d.entireOpenIntervalBehindIndependentlyClearOriginalCoProjectedSource===true))
     throw new RangeError('M4 open-depth class not backed by canonical exact source theorem');
    const f=cut.strictlyFrontmostAmongOriginal3DSourcesOnOpenIntervalOnly||
     d.wholeIntervalFrontmostCertified===true;
    const h=cut.hiddenBehindIndependentlyClearOriginalSourceOnOpenIntervalOnly||
     d.visibleSourceCoversEntireLine===true;
    if(f&&h)throw new RangeError('contradictory front and hidden M4 depth');
    if(f)front++;else if(h)hidden++;else held++;
   }
   cutCursor=t[1];
  }
  if(cutCursor!==r[1])throw new RangeError('positive missing M4 depth event cut');
  cursor=r[1];
 }
 if(cursor!==1)throw new RangeError('M4 source depth partition did not reach 1');
 return {completeOriginalM4SourceDepthPartition:true,
  openDepthFrontCuts:front,openDepthHiddenCuts:hidden,
  openDepthHeldCuts:held,positiveSubpixelCutsHeld:subpixel,
  everyOpenDepthCutClassified:held===0,
  closedOriginalVerticesAndOpaqueSceneStillUnproven:true,
  generatedHLRToOriginalTopoDSHistoryCertified:false,signedV5Action:false};
}

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
 // Recompute the ORIGINAL convex all-face OPEN-edge theorem from the
 // current M0 geometry, same-revision native BRep face adjacency and
 // same-run source-filtered 3D HLR. No caller-supplied proof flags and
 // no generated TopoDS history or closed-endpoint promotion.
 const openRayBySource=new Map();
 if(geometry.kind==='mesh'&&cad.originalNativeFaceAdjacency){
  const native=auditC1NativeScopedHLRSourceConsumer({geometry,cad});
  const exact=auditC1ExactConvexOriginalOpenEdgeRays({
   geometry,nativeFaceAdjacency:cad.originalNativeFaceAdjacency,
   nativeM4Views:native.views
  });
  if(exact.status==='audited'){
   for(const [view,rows] of Object.entries(exact.views))for(const r of rows){
    const key=view+'|'+r.sourceEdgeId;
    if(openRayBySource.has(key))
     throw new RangeError('duplicate same-run exact original convex ray');
    openRayBySource.set(key,r);
   }
  }
 }
 const counts={unrepresentedOriginalSourceViews:0,positiveOriginalPaperGapIntervals:0,
  unresolvedM5Obligations:0,obligationsWithGlobalOriginalSourceAnd3DEndpoints:0,
  obligationsWithStrictNative3DClass:0,obligationsWithBoundedOnlyNative3DClass:0,
  obligationsWithPhysicalOriginalM0JunctionCandidates:0,
  obligationsWithActualNativeGeneratedJunctionIsSame:0,
  obligationsWithDistinctNativeGeneratedVertices:0,
  obligationsWithIndependentExactOriginalRayClass:0,
  generatedHLRSourceClassContradictionsHeldForHistory:0,
  missingSourcesWhoseOriginalRayClassRemainsUnknown:0,
  obligationsWithExactConvexOpenRayAndNativeHLRClass:0,
  newlyCorroboratedOpenRaysWithoutClosedEndpointRayClass:0,
  exactConvexOpenRayVersusGeneratedHLRClassConflictsHeld:0,
  originalM4FullSourceOpenDepthPartitions:0,
  originalM4FullSourceOpenDepthAllClassified:0,
  originalM4OpenFrontCuts:0,originalM4OpenHiddenCuts:0,
  originalM4OpenHeldCuts:0,originalM4PositiveSubpixelCutsHeld:0,
  positivePaperGapsWithFullOriginalM4OpenDepthPartition:0,
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
  // Original M0 all-face rays are independent of OCCT generated HLR
  // filtering; a class contradiction is an explicit source-history
  // obstacle, not permission to relabel a native 2D HLR stroke.
  const rayClass=interval===null?
   row.expectedHLRClassFromIndependentOriginalRay:
   row.independentOriginal3DExactRayStatus==='exact-original-closed-ray-clear'?
    'visible-sharp':
    row.independentOriginal3DExactRayStatus==='exact-original-open-strict-interior'?
     'hidden-sharp':null;
  if(rayClass!==null&&rayClass!==undefined&&
     !['visible-sharp','hidden-sharp'].includes(rayClass))
   throw new RangeError('unverified original 3D all-face ray classification');
  const conflicting=paper.filter(p=>rayClass!==null&&rayClass!==undefined&&
   p.hlrClass!==rayClass);
  const openRay=openRayBySource.get(row.view+'|'+row.sourceEdgeId);
  const certifiedOpen=openRay?.originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified===true;
  const openClass=certifiedOpen?openRay.exactOriginalOpenEdgeOpaqueFaceRayClass:null;
  if(certifiedOpen&&(openRay.generated2DTopoDSHistoryCertified!==false||
     openRay.wholeSceneCoProjectedDepthCertified!==false||
     openRay.engineeringLineStyle!=='undetermined'||
     openRay.signedV5Action!==false||
     !['visible-sharp','hidden-sharp'].includes(openClass)||
     (rayClass!==null&&rayClass!==undefined&&rayClass!==openClass)))
   throw new RangeError('same-run convex open-ray proof conflicts with original closed-ray evidence');
  const openConflicts=certifiedOpen?
   paper.filter(p=>p.hlrClass!==openClass):[];
  const openCorroborated=certifiedOpen&&openConflicts.length===0;
  counts.obligationsWithExactConvexOpenRayAndNativeHLRClass+=Number(openCorroborated);
  counts.newlyCorroboratedOpenRaysWithoutClosedEndpointRayClass+=
   Number(openCorroborated&&(rayClass===null||rayClass===undefined));
  counts.exactConvexOpenRayVersusGeneratedHLRClassConflictsHeld+=
   Number(openConflicts.length>0);
  counts.obligationsWithIndependentExactOriginalRayClass+=Number(rayClass!==null&&rayClass!==undefined);
  counts.missingSourcesWhoseOriginalRayClassRemainsUnknown+=
   Number(interval===null&&(rayClass===null||rayClass===undefined));
  counts.generatedHLRSourceClassContradictionsHeldForHistory+=Number(conflicting.length>0);
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
  const m4Depth=auditExistingM4OpenSourceDepth(row,kind);
  if(m4Depth?.completeOriginalM4SourceDepthPartition===true){
   counts.originalM4FullSourceOpenDepthPartitions++;
   if(kind==='positive-original-m0-parameter-gap')
    counts.positivePaperGapsWithFullOriginalM4OpenDepthPartition++;
   counts.originalM4FullSourceOpenDepthAllClassified+=
    Number(m4Depth.everyOpenDepthCutClassified);
   counts.originalM4OpenFrontCuts+=m4Depth.openDepthFrontCuts;
   counts.originalM4OpenHiddenCuts+=m4Depth.openDepthHiddenCuts;
   counts.originalM4OpenHeldCuts+=m4Depth.openDepthHeldCuts;
   counts.originalM4PositiveSubpixelCutsHeld+=m4Depth.positiveSubpixelCutsHeld;
  }
  records.push({kind,view:row.view,sourceEdgeId:row.sourceEdgeId,
   originalM4OpenSourceDepthEvidence:m4Depth,
   originalM0PositiveParameterGap:interval===null?null:[...interval],
   actualGlobalHLROrdinals:paper.map(p=>({
    hlrClass:p.hlrClass,ordinal:p.wholeSolidGeneratedHLREdgeOrdinal
   })),
   independentlyOriginalBRep3DEndpointsPresent:true,
   strictNativeClassWitnesses:strict,boundedNativeClassWitnesses:bounded,
   sharedOriginalM0JunctionCandidates:joins.length,
   independentOriginal3DAllFaceRayClass:rayClass??null,
   exactConvexOriginalOpenRayClass:openClass,
   exactConvexOriginalOpenRayNativeHLRClassCorroborated:openCorroborated,
   exactConvexOpenRayDoesNotProveClosedEndpointsOrGeneratedHistory:true,
   generatedHLRClassesDisagreeingWithExactConvexOpenRay:
    openConflicts.map(p=>({hlrClass:p.hlrClass,
     wholeSolidGeneratedHLREdgeOrdinal:p.wholeSolidGeneratedHLREdgeOrdinal})),
   generatedHLRClassesDisagreeingWithOriginal3DRay:
    conflicting.map(p=>({hlrClass:p.hlrClass,
     wholeSolidGeneratedHLREdgeOrdinal:p.wholeSolidGeneratedHLREdgeOrdinal})),
   nativeHLRClassContradictionNotAllowedToOverrideOriginalRay:true,
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
