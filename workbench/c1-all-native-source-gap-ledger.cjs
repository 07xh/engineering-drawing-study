'use strict';
/**
 * Generic C1 native ORIGINAL-source coverage audit, not tied to known
 * A-end skew-tetra regression values or any one textbook drawing.
 *
 * Walk ALL canonical M5 source spans in V/H/W, preserve positive native
 * gaps and source spans whose native parameters cannot be reconstructed.
 * Recompute the independent source-curve and actual generated HLR endpoint
 * forensic proofs for EVERY positive gap. NEVER turn a 2D paper match into
 * original TopoDS generated-edge history, closed M5 occlusion, GB line
 * styles or signed official V5 actions.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {auditC1JointNativeGapFromCad}=
 require('./c1-joint-native-gap-evidence.cjs');
const {auditC1OriginalM0InventoryCoverage}=
 require('./c1-original-m0-inventory-coverage.cjs');
const {auditC1Native3DSourceScopedIntervals}=
 require('./c1-native-source-scoped-3d-parameter-coverage.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC1AllOriginalSourceNativeGaps({geometry,cad,m5Ledger}={}){
 if(typeof geometry?.id!=='string'||!geometry.id||
    !Array.isArray(geometry.data?.edges)||!geometry.data.edges.length||
    !geometry.data.points||
    cad?.schema!=='draftai-c1-ocjs-real-visible-brep/1'||
    cad.engine!=='opencascade.js'||cad.sourceGeometryId!==geometry.id||
    !Number.isSafeInteger(cad.revision)||cad.revision<1||
    cad.actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified!==false||
    cad.lineStyleCertified!==false||cad.v5Authorized!==false||
    m5Ledger?.schema!=='draftai-c1-ocjs-m5-convex-proof-gap-ledger/1'||
    m5Ledger.revision!==cad.revision||
    m5Ledger.sourceGeometryId!==geometry.id||
    m5Ledger.engine!=='opencascade.js'||
    m5Ledger.realCadSourceCandidateOnly!==true||
    m5Ledger.officialLineStylesVerified!==false||
    m5Ledger.wholeSolidV5Ready!==false||
    m5Ledger.signedV5ActionCount!==0)
  throw new TypeError('current unsigned C1 M0, real OCJS and canonical M5 evidence required');
 const originalIds=new Set();
 for(const e of geometry.data.edges){
  if(!Array.isArray(e)||e.length!==2||e[0]===e[1]||
     e.some(id=>typeof id!=='string'||
      !Object.hasOwn(geometry.data.points,id)))
   throw new RangeError('invalid original C1 3D source topology');
  const id=geometry.id+'::'+[...e].sort().join('|');
  if(originalIds.has(id))throw new RangeError('duplicated original C1 source');
  originalIds.add(id);
 }
 // M5 may omit an original physical edge entirely. Counting only the rows
 // already in M5 would then report a misleading 'complete' inventory.
 // Independently enumerate every noncollapsed original M0 source per view.
 // A missing row is an UNSIGNED evidence obligation, not a hidden line.
 const projectedOriginalSourcesByView=Object.fromEntries(VIEWS.map(view=>[
  view,new Set(geometry.data.edges.filter(([a,b])=>{
   const p=project(geometry.data.points[a])[view],
    q=project(geometry.data.points[b])[view];
   if(![p.u,p.v,q.u,q.v].every(Number.isFinite))
    throw new RangeError('nonfinite projected original C1 source');
   return p.u!==q.u||p.v!==q.v;
  }).map(e=>geometry.id+'::'+[...e].sort().join('|')))
 ]));
 // Independent M5 consumer of REAL OCCT source-filtered In3d HLR output.
 // Unlike projected 2D VCompound inverses, these are original BRep curve
 // parameters emitted by MakeEdge3d. Recompute every V/H/W source union
 // from raw native ranges; never trust a producer's 'complete' boolean.
 // A fully covered native 3D source is NOT yet a whole-solid generated 2D
 // TopoDS identity, global occlusion, engineering style or V5 certificate.
 const native3DSourceViewRows=[];
 const native3DSourceViewCounts={
  projectedOriginalSourceViews:0,
  native3DProjectedSourceViewsWithCompleteCombinedPartition:0,
  native3DProjectedSourceViewsWithPositiveGaps:0,
  native3DProjectedSourceViewsWithPositiveOverlaps:0,
  collapsedSourceViewsWithoutNative3DSharpSegments:0
 };
 const scoped3D=cad.nativeSourceScopedSharpOutputByView;
 const hasScoped3D=VIEWS.some(view=>
  scoped3D?.[view]?.rows?.some(row=>
   row.combinedNative3DSourceParameterPartition!==undefined));
 if(hasScoped3D){
  const originalCurves=new Map();
  if(!Array.isArray(cad.originalBRepSourceEdges)||
     cad.originalBRepSourceEdges.length!==originalIds.size)
   throw new RangeError('complete real original BRep 3D source curve ledger required');
  for(const curve of cad.originalBRepSourceEdges){
   if(!originalIds.has(curve?.sourceEdgeId)||
      originalCurves.has(curve.sourceEdgeId)||
      curve.occtSourceCurve3DEndpointsAndMidpointVerified!==true)
    throw new RangeError('invalid original BRep source 3D curve inventory');
   originalCurves.set(curve.sourceEdgeId,curve);
  }
  for(const view of VIEWS){
   const scoped=scoped3D?.[view];
   if(scoped?.schema!=='draftai-c1-ocjs-real-original-topods-scoped-hlr/1'||
      !Array.isArray(scoped.rows)||scoped.rows.length!==originalIds.size||
      scoped.originalTopoDSEdgeIndexCheckedAgainstActualHLREdgeMap!==true)
    throw new RangeError('incomplete native source-scoped 3D HLR view');
   const seen3D=new Set();
   for(const row of scoped.rows){
    const id=row?.originalPhysicalSourceEdgeId;
    if(!originalIds.has(id)||seen3D.has(id))
     throw new RangeError('duplicate or unknown native source-scoped 3D edge');
    seen3D.add(id);
    const source=originalCurves.get(id);
    const visible=row.visible3D?.native3DGeneratedCurveIntervals;
    const hidden=row.hidden3D?.native3DGeneratedCurveIntervals;
    if(!Array.isArray(visible)||!Array.isArray(hidden)||
       visible.length+hidden.length>256)
     throw new RangeError('missing real native 3D source-scoped visibility partition');
    const emitted=[...visible,...hidden];
    if(emitted.some(edge=>
     edge.nativeSourceFilterOriginalEdgeId!==id||
     edge.native3DCurveExactlySameAsOriginalAtThreeParameters!==true||
     edge.originalGeneratedTopoDSHistoryCertified!==false||
     edge.signedV5Action!==false))
     throw new RangeError('native 3D source curve/parameter identity contradicted');
    const actual=auditC1Native3DSourceScopedIntervals({
     originalNativeParameterRange:source.occtSourceCurveParameterRange,
     generatedNativeParameterRanges:emitted.map(edge=>
      edge.nativeOriginalCurveParameterRange)
    });
    const claimed=row.combinedNative3DSourceParameterPartition;
    if(claimed?.schema!==actual.schema||
       JSON.stringify(claimed.originalNativeParameterRange)!==
        JSON.stringify(actual.originalNativeParameterRange)||
       JSON.stringify(claimed.generatedNativeParameterRanges)!==
        JSON.stringify(actual.generatedNativeParameterRanges)||
       JSON.stringify(claimed.positiveLengthUncoveredNativeParameterIntervals)!==
        JSON.stringify(actual.positiveLengthUncoveredNativeParameterIntervals)||
       JSON.stringify(claimed.positiveLengthOverlappingNativeParameterIntervals)!==
        JSON.stringify(actual.positiveLengthOverlappingNativeParameterIntervals)||
       claimed.sourceScopedNative3DParameterInventoryCompleteExactlyOnce!==
        actual.sourceScopedNative3DParameterInventoryCompleteExactlyOnce)
     throw new RangeError('native source-scoped 3D partition disagrees with independent M5 recomputation');
    const drawable=projectedOriginalSourcesByView[view].has(id);
    if(drawable){
     native3DSourceViewCounts.projectedOriginalSourceViews++;
     if(actual.sourceScopedNative3DParameterInventoryCompleteExactlyOnce)
      native3DSourceViewCounts.native3DProjectedSourceViewsWithCompleteCombinedPartition++;
     if(actual.positiveLengthUncoveredNativeParameterIntervals.length)
      native3DSourceViewCounts.native3DProjectedSourceViewsWithPositiveGaps++;
     if(actual.positiveLengthOverlappingNativeParameterIntervals.length)
      native3DSourceViewCounts.native3DProjectedSourceViewsWithPositiveOverlaps++;
    }else{
     if(emitted.length)
      throw new RangeError('projected collapsed source emitted a native sharp HLR segment');
     native3DSourceViewCounts.collapsedSourceViewsWithoutNative3DSharpSegments++;
    }
    native3DSourceViewRows.push({view,sourceEdgeId:id,
     originalProjectedSourceNoncollapsed:drawable,
     native3DVisibleSharpCount:visible.length,
     native3DHiddenSharpCount:hidden.length,
     exactOriginalNative3DSourcePartition:actual,
     nativeSourceScopedOriginalCurveProven:true,
     wholeSolidGenerated2DTopoDSIdentityCertified:false,
     globalContinuousVisibilityCertified:false,
     engineeringLineStyle:'undetermined',signedV5Action:false});
   }
  }
 }
 const native3DSourceViewLedger=freeze({
  schema:'draftai-c1-m5-real-native-3d-source-scoped-partition/1',
  availableFromActualPinnedOCJS:hasScoped3D,
  counts:native3DSourceViewCounts,
  rows:native3DSourceViewRows,
  allNoncollapsedOriginalM0SourceViewsHaveCompleteNative3DPartition:
   hasScoped3D&&native3DSourceViewCounts.projectedOriginalSourceViews===
    native3DSourceViewCounts.native3DProjectedSourceViewsWithCompleteCombinedPartition,
  generated2DTopoDSHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  officialV5Authorized:false
 });
 const representedOriginalSourcesByView=Object.fromEntries(VIEWS.map(view=>
  [view,new Set()]));
 const result=[],seen=new Set(),totals={
  currentM5SourceSpans:0,fullyNativeCoveredSpans:0,
  positiveGapSourceSpans:0,individualPositiveNativeGaps:0,
  originalParameterUnreconstructableSpans:0,
  missingOrUnboundSourceSpans:0
 };
 for(const view of VIEWS){
  const ledgerRows=m5Ledger.views?.[view]?.intervals;
  if(!Array.isArray(ledgerRows)||ledgerRows.length>2048||
     !Array.isArray(cad.views?.[view])||
     !Array.isArray(cad.hiddenSharpViews?.[view]))
   throw new RangeError('complete bounded C1 M5 and real OCJS V/H/W views required');
  for(const row of ledgerRows){
   totals.currentM5SourceSpans++;
   if(row?.view!==view||
      row.engineeringLineStyle!=='undetermined'||row.signedV5!==false)
    throw new RangeError('C1 M5 source span incorrectly signed or wrong view');
   const id=row.sourceEdgeId,proof=row.exactNativeOriginal3DSourceCoverage;
   if(id&&originalIds.has(id))representedOriginalSourcesByView[view].add(id);
   if(id!==null&&(!originalIds.has(id)||
      typeof id!=='string'))
    throw new RangeError('M5 source must be an actual original M0 3D edge');
   // Invalid/non-M0 source identity is accounted for but never promoted.
   if(!id||!proof){
    if(row.realNativeOriginal3DSourceParameterCovered===true)
     throw new RangeError('C1 source declared covered without any native source proof');
    totals.missingOrUnboundSourceSpans++;
    result.push({view,sourceEdgeId:id||null,originalParameterRange:null,
     kind:'unbound-original-native-source-or-missing-proof',
     positiveGaps:[],jointNativeGapForensics:null,
     entireSourceHistoryAndOcclusionVerified:false,signedV5Action:false});
    continue;
   }
   if(proof.sourceEdgeId!==id||proof.view!==view||
      proof.engineeringLineStyle!=='undetermined'||
      proof.signedV5Action!==false)
    throw new RangeError('C1 native source proof conflicts with canonical M5 identity');
   const range=proof.originalSourceParameterRange;
   if(range===null){
    if(proof.status!=='unreconstructable-original-3d-source-parameter'||
       proof.entireOriginalParameterIntervalCovered!==false||
       row.realNativeOriginal3DSourceParameterCovered!==false||
       !Array.isArray(proof.positiveLengthUncoveredIntervals)||
       proof.positiveLengthUncoveredIntervals.length!==0)
     throw new RangeError('C1 unreconstructable original source must remain explicitly unsigned');
    totals.originalParameterUnreconstructableSpans++;
    result.push({view,sourceEdgeId:id,originalParameterRange:null,
     kind:'unreconstructable-original-native-source-parameter',
     positiveGaps:[],jointNativeGapForensics:null,
     entireSourceHistoryAndOcclusionVerified:false,signedV5Action:false});
    continue;
   }
   if(!Array.isArray(range)||range.length!==2||
      !range.every(Number.isFinite)||range[0]<0||range[1]>1||
      !(range[1]>range[0])||
      !Array.isArray(proof.positiveLengthUncoveredIntervals)||
      proof.positiveLengthUncoveredIntervals.length>128)
    throw new RangeError('C1 positive and bounded native original source interval required');
   const key=view+'|'+id+'|'+range.join(',');
   if(seen.has(key))throw new RangeError('C1 duplicate canonical source span');
   seen.add(key);
   const gaps=proof.positiveLengthUncoveredIntervals;
   let previous=range[0];
   for(const [a,b] of gaps){
    if(!Number.isFinite(a)||!Number.isFinite(b)||
       a<previous||a<range[0]||b>range[1]||!(b>a))
     throw new RangeError('C1 ordered positive original native gaps must not overlap');
    previous=b;
   }
   const covered=proof.entireOriginalParameterIntervalCovered===true;
   if(covered!== (gaps.length===0)||
      row.realNativeOriginal3DSourceParameterCovered!==covered||
      proof.status!==(covered?
       'exact-original-3d-native-source-covered':
       'exact-original-3d-native-source-positive-gap'))
    throw new RangeError('C1 positive native gap count contradicts exact M5 source coverage');
   const joint=gaps.length?auditC1JointNativeGapFromCad({
    geometry,cad,view,sourceEdgeId:id,
    uncoveredIntervals:gaps
   }):null;
   if(joint&&(joint.positiveGapCount!==gaps.length||
      joint.fullOriginalSourceHistoryCertified!==false||
      joint.globalContinuousVisibilityCertified!==false||
      joint.signedV5ActionCount!==0))
    throw new RangeError('C1 joint independent native gap evidence promoted unsigned input');
   if(covered)totals.fullyNativeCoveredSpans++;
   else {totals.positiveGapSourceSpans++;totals.individualPositiveNativeGaps+=gaps.length;}
   result.push({view,sourceEdgeId:id,originalParameterRange:[...range],
    kind:covered?'native-source-interval-covered-candidate-only':
     'positive-original-native-source-gap',
    positiveGaps:gaps.map(x=>[...x]),
    jointNativeGapForensics:joint,
    entireSourceHistoryAndOcclusionVerified:false,signedV5Action:false});
  }
 }
 if(result.length!==totals.currentM5SourceSpans||
    Object.values(totals).some(x=>!Number.isSafeInteger(x)||x<0)||
    totals.currentM5SourceSpans!==
     totals.fullyNativeCoveredSpans+totals.positiveGapSourceSpans+
      totals.originalParameterUnreconstructableSpans+
      totals.missingOrUnboundSourceSpans)
  throw new RangeError('C1 complete canonical M5 original source gap accounting lost');
 // A canonical M5 source row may cover only a strict subinterval of [0,1],
 // or overlap another row. Audit ALL original M0 source/view parameters,
 // including source views entirely absent from M5. This is separate from
 // native HLR generated-edge provenance and from native gaps within a row.
 const originalM0CanonicalSourceInventory=auditC1OriginalM0InventoryCoverage({
  projectedOriginalSourcesByView,
  canonicalM5RowsByView:Object.fromEntries(VIEWS.map(view=>[
   view,result.filter(row=>row.view===view)
  ]))
 });
 const unrepresentedOriginalM0ProjectedSources=[];
 for(const view of VIEWS)
  for(const sourceEdgeId of projectedOriginalSourcesByView[view])
   if(!representedOriginalSourcesByView[view].has(sourceEdgeId))
    unrepresentedOriginalM0ProjectedSources.push({
     view,sourceEdgeId,
     reason:'noncollapsed-original-source-absent-from-current-M5-ledger',
     originalTopoDSHistoryCertified:false,
     engineeringLineStyle:'undetermined',signedV5Action:false
    });
 // Rebind each omitted M0 source/view to ACTUAL whole-solid HLR paper
 // candidates. This is deliberately not native generated TopoDS history:
 // one projected segment can match multiple different-depth 3D edges.
 const unrepresentedM0NativeHLRCandidateForensics=
  unrepresentedOriginalM0ProjectedSources.map(({view,sourceEdgeId})=>{
   const candidates=[];
   for(const [klass,segments] of [
    ['visible-sharp',cad.views[view]],
    ['hidden-sharp',cad.hiddenSharpViews[view]]
   ]){
    if(segments.length>128)throw new RangeError('unbounded real native HLR edges');
    for(let ordinal=0;ordinal<segments.length;ordinal++){
     const segment=segments[ordinal];
     const lifts=segment?.sourceCandidate3DLifts;
     if(!Array.isArray(lifts)||lifts.length>originalIds.size||
        lifts.some(x=>!originalIds.has(x?.sourceEdgeId)))
      throw new RangeError('real HLR paper candidate inventory lacks M0 provenance bounds');
     if(lifts.some(x=>x.sourceEdgeId===sourceEdgeId))
      candidates.push({hlrClass:klass,ordinal,
       projectedFrom:{...segment.from},projectedTo:{...segment.to},
       original3DLiftCount:lifts.length,
       nativeGeneratedTopoDSToOriginalSourceHistoryCertified:false,
       engineeringLineStyle:'undetermined',signedV5Action:false});
    }
   }
   // Native IsSame is a generated-edge identity witness only. It must
   // agree with the same original source and whole-solid ordinal; a paper
   // candidate alone is never allowed to borrow another source's claim.
   const nativeClaims=cad.nativeSourceScopedSharpOutputByView?.[view]?.
    nativeSourceIdentityConflicts?.rows;
   if(nativeClaims!==undefined&&(!Array.isArray(nativeClaims)||
      nativeClaims.length>256))
    throw new RangeError('invalid actual native HLR source claim inventory');
   const claims=nativeClaims??[];
   // Reject forged or stale claims before joining a native ordinal to a
   // paper alias. Otherwise an unrelated M0 source can impersonate the
   // current real-WASM native inventory and skew omission forensics.
   const seenNativeClaims=new Set();
   for(const claim of claims){
    const segments=claim?.hlrClass==='visible-sharp'?cad.views[view]:
     claim?.hlrClass==='hidden-sharp'?cad.hiddenSharpViews[view]:null;
    const ordinal=claim?.nativeWholeSolidEdgeOrdinal;
    if(claim?.view!==view||
       !originalIds.has(claim.originalPhysicalSourceEdgeId)||
       !Array.isArray(segments)||
       !Number.isSafeInteger(ordinal)||ordinal<0||
       ordinal>=segments.length||
       claim.nativeScopedGeneratedEdgeIsSame!==true)
     throw new RangeError('invalid actual native HLR source ownership claim');
    const key=claim.hlrClass+'|'+ordinal;
    if(seenNativeClaims.has(key))
     throw new RangeError('duplicate actual native HLR generated edge owner');
    seenNativeClaims.add(key);
   }
   const directNativeIdentityCandidates=candidates.filter(candidate=>
    claims.some(claim=>claim.view===view&&
     claim.originalPhysicalSourceEdgeId===sourceEdgeId&&
     claim.hlrClass===candidate.hlrClass&&
     claim.nativeWholeSolidEdgeOrdinal===candidate.ordinal&&
     claim.nativeScopedGeneratedEdgeIsSame===true));
   const mismatchedNativeIdentityClaims=candidates.filter(candidate=>
    claims.some(claim=>claim.view===view&&
     claim.hlrClass===candidate.hlrClass&&
     claim.nativeWholeSolidEdgeOrdinal===candidate.ordinal&&
     claim.originalPhysicalSourceEdgeId!==sourceEdgeId));
   return {view,sourceEdgeId,
    directNativeGeneratedIdentityCandidateCount:directNativeIdentityCandidates.length,
    directNativeGeneratedIdentityCandidates:directNativeIdentityCandidates.map(
     candidate=>({hlrClass:candidate.hlrClass,ordinal:candidate.ordinal})),
    paperCandidatesClaimedByDifferentOriginalNativeSource:
     mismatchedNativeIdentityClaims.map(candidate=>({
      hlrClass:candidate.hlrClass,ordinal:candidate.ordinal
     })),
    nativeIdentityDoesNotCertifyOriginalSourceParameterCoverage:true,
    nativeHLRPaperCandidateCount:candidates.length,
    nativeHLRPaperCandidates:candidates,
    noHLRPaperCandidateDoesNotProveGlobalOcclusion:true,
    paperCandidateDoesNotProveOriginalTopoDSHistory:true,
    continuousOcclusionCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false};
  });
 return freeze({schema:'draftai-c1-all-original-3d-native-source-gaps/1',
  originalM0CanonicalSourceInventory,native3DSourceViewLedger,
  unrepresentedM0NativeHLRCandidateForensics,
  unrepresentedOriginalM0ProjectedSources,
  allNoncollapsedOriginalM0SourcesRepresentedInCurrentM5:
   unrepresentedOriginalM0ProjectedSources.length===0,
  revision:cad.revision,sourceGeometryId:geometry.id,
  status:'full-current-M5-interval-inventory-unsigned',
  originalM0PhysicalSourceCount:originalIds.size,
  totals,rows:result,
  allCurrentM5SourceSpansAccountedFor:true,
  knownThreeGapCoordinatesNotUsedToSelectRecords:true,
  generatedHLRToOriginalTopoDSHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  fullEngineeringLineStyleCertified:false,
  officialV5Authorized:false,signedV5ActionCount:0});
}
module.exports={auditC1AllOriginalSourceNativeGaps};
