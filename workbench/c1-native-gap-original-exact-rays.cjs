'use strict';
/**
 * Positive ORIGINAL M0 convex-source ray theorem on every REAL M5/HLR
 * parameter gap. Unlike a paper endpoint tolerance, the exact supporting
 * halfspace theorem covers the whole original 3D edge (hence each gap)
 * without sampling or interpolating its tiny binary64 endpoints.
 *
 * Crucial separation:
 *  - M0 original source rays can be positively clear/strictly interior.
 *  - missing OCCT generated HLR source intervals are STILL missing.
 *  - generated TopoDS history, global co-projected depth and V5 remain
 *    independent obligations. A strict-hidden OPEN edge does not prove
 *    its endpoint ray, especially when a gap begins at t=0.
 */
const {auditC1AllOriginalSourceNativeGaps}=
 require('./c1-all-native-source-gap-ledger.cjs');
const {auditC1OriginalClosedEdgeRayContinuity}=
 require('./c1-m5-closed-original-edge-ray-continuity.cjs');
const {projectC1Native3DSourceIntervalsToM4}=
 require('./c1-native-source-scoped-m4-projection.cjs');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const {auditC1OriginalCoProjectedDepthOrder}=
 require('./c1-original-coproject-depth-order.cjs');
const {project}=require('../core/projection/conventions.js');
const {dyadic,difference,product,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
// Exact received-binary64 3D incidence, independent of HLR paper aliasing.
// A generated native vertex can project onto an original M0 edge while
// belonging to a DIFFERENT-depth original vertex. This is a veto witness,
// not a generated TopoDS edge ownership or visibility certificate.
function exactOriginal3DVertexOnSourceSegment(a,b,p){
 const axes=['x','y','z'];
 if([a,b,p].some(q=>!q||axes.some(k=>!Number.isFinite(q[k]))))
  throw new TypeError('finite original M0 source and native vertex required');
 const d=axes.map(k=>difference(dyadic(b[k]),dyadic(a[k])));
 const q=axes.map(k=>difference(dyadic(p[k]),dyadic(a[k])));
 const pivot=d.findIndex(x=>sign(x)!==0);
 if(pivot<0)throw new RangeError('collapsed original 3D source edge');
 if(axes.some((_,i)=>sign(difference(
  product(q[i],d[pivot]),product(q[pivot],d[i])))!==0))
  return false;
 const direction=sign(d[pivot]);
 return sign(q[pivot])*direction>=0&&
  sign(difference(d[pivot],q[pivot]))*direction>=0;
}
const {auditC1ExactBinary64PaperAffineWitness}=
 require('./c1-exact-binary64-paper-affine.cjs');
const {auditExactBinary64PaperParameterPair,
 auditExactBinary64PaperCandidateCoverage,
 auditExactBinary64PaperVisibilityConflict}=
 require('./c1-exact-binary64-paper-parameter.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
/**
 * Reconcile every drawable original source's REAL source-filtered HLR 3D
 * visibility classes with an INDEPENDENT full-edge exact M0 ray theorem.
 * A native positive-length opposite-class span cannot be silently treated
 * as a signed line. A matching class is only concordance, NOT proof that
 * the generated 2D edge belongs to this source or is globally frontmost.
 * Reuses the existing native partition and exact ray audits; no HLR/V5 fork.
 */
function auditC1Native3DOriginalRayConcordance({
 native3DSourceViewLedger,rays
}={}){
 if(native3DSourceViewLedger?.schema!==
    'draftai-c1-m5-real-native-3d-source-scoped-partition/1'||
    rays?.schema!==
    'draftai-c1-m5-exact-closed-original-edge-ray-and-cut-continuity/1'||
    !Array.isArray(native3DSourceViewLedger.rows)||!Array.isArray(rays.rows))
  throw new TypeError('current canonical native 3D source partitions and independent M0 rays required');
 const available=native3DSourceViewLedger.availableFromActualPinnedOCJS===true;
 if(!available&&native3DSourceViewLedger.rows.length)
  throw new RangeError('unavailable native 3D source data cannot contain certified rows');
 const byRay=new Map();
 for(const ray of rays.rows){
  const key=ray.view+'|'+ray.originalPhysicalSourceEdgeId;
  if(byRay.has(key))throw new RangeError('duplicate exact original source ray in class audit');
  byRay.set(key,ray);
 }
 const rows=[],counts={
  projectedOriginalSourceViewsExamined:0,
  sourceViewsWithExactClosedClearRay:0,
  sourceViewsWithExactStrictHiddenRay:0,
  sourceViewsWithUnknownRayClass:0,
  sourceViewsWithOppositeNative3DClass:0,
  sourceViewsWithCompleteConcordantNative3DPartition:0,
  sourceViewsWithIncompleteNative3DPartition:0
 };
 const seen=new Set();
 for(const native of native3DSourceViewLedger.rows){
  const key=native.view+'|'+native.sourceEdgeId;
  if(seen.has(key))throw new RangeError('duplicate source-scoped native 3D class partition');
  seen.add(key);
  if(native.originalProjectedSourceNoncollapsed!==true)continue;
  const ray=byRay.get(key);
  const partition=native.exactOriginalNative3DSourcePartition;
  if(!ray||ray.projectionCollapsed!==false||
     native.nativeSourceScopedOriginalCurveProven!==true||
     !Number.isSafeInteger(native.native3DVisibleSharpCount)||
     native.native3DVisibleSharpCount<0||
     !Number.isSafeInteger(native.native3DHiddenSharpCount)||
     native.native3DHiddenSharpCount<0||
     partition?.schema!=='draftai-c1-native-source-scoped-3d-curve-parameter-coverage/1'||
     !Array.isArray(partition.generatedNativeParameterRanges)||
     partition.generatedNativeParameterRanges.length!==
      native.native3DVisibleSharpCount+native.native3DHiddenSharpCount||
     native.signedV5Action!==false)
   throw new RangeError('native source class lacks corresponding real interval or M0 ray');
  const closed=ray.originalPhysicalCreaseProven===true&&
   ray.completeSourceOriginal3DRayClosedIntervalClear===true&&
   ray.exactlyBothOriginalVertexForwardRaysClear===true;
  const hidden=ray.originalPhysicalCreaseProven===true&&
   ray.originalOpenEdgeStrictInteriorOcclusionProven===true;
  if(closed&&hidden)throw new RangeError('contradictory independently proven original ray classes');
  const expected=closed?'visible-sharp':hidden?'hidden-sharp':null;
  const opposite=(closed&&native.native3DHiddenSharpCount>0)||
   (hidden&&native.native3DVisibleSharpCount>0);
  const complete=partition.sourceScopedNative3DParameterInventoryCompleteExactlyOnce===true;
  const concordant=expected!==null&&complete&&!opposite&&
   (closed?native.native3DVisibleSharpCount:native.native3DHiddenSharpCount)>0;
  counts.projectedOriginalSourceViewsExamined++;
  if(closed)counts.sourceViewsWithExactClosedClearRay++;
  else if(hidden)counts.sourceViewsWithExactStrictHiddenRay++;
  else counts.sourceViewsWithUnknownRayClass++;
  if(opposite)counts.sourceViewsWithOppositeNative3DClass++;
  if(concordant)counts.sourceViewsWithCompleteConcordantNative3DPartition++;
  if(!complete)counts.sourceViewsWithIncompleteNative3DPartition++;
  rows.push({view:native.view,sourceEdgeId:native.sourceEdgeId,
   expectedClassFromIndependentExactOriginalRay:expected,
   native3DVisibleSharpCount:native.native3DVisibleSharpCount,
   native3DHiddenSharpCount:native.native3DHiddenSharpCount,
   exactNative3DCombinedParameterPartitionComplete:complete,
   oppositeNative3DClassContradictsOriginalRay:opposite,
   fullNative3DClassConcordanceOnly:concordant,
   originalToGenerated2DTopoDSHistoryCertified:false,
   globalCoProjectedVisibilityCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false});
 }
 if(available&&rows.length!==native3DSourceViewLedger.counts?.projectedOriginalSourceViews)
  throw new RangeError('real native 3D HLR source ray audit lost drawable sources');
 if(counts.projectedOriginalSourceViewsExamined!==
     counts.sourceViewsWithExactClosedClearRay+
     counts.sourceViewsWithExactStrictHiddenRay+
     counts.sourceViewsWithUnknownRayClass)
  throw new RangeError('native 3D visibility class audit counts inconsistent');
 return freeze({
  schema:'draftai-c1-native-3d-original-ray-class-concordance/1',
  actualNativeSourceScopedHLRAvailable:available,
  counts,rows,
  noOriginalRayVersusNative3DClassContradictions:
   available&&counts.sourceViewsWithOppositeNative3DClass===0,
  native2DGeneratedTopoDSHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  officialV5Authorized:false
 });
}
function auditC1NativeGapOriginalExactRays({geometry,cad,m5Ledger}={}){
 const gaps=auditC1AllOriginalSourceNativeGaps({geometry,cad,m5Ledger});
 // Recompute the existing M0/M4/M5 exact halfspace and original-vertex
 // certificates directly from the geometry, never from caller-supplied
 // booleans or from the HLR output itself.
 const rays=auditC1OriginalClosedEdgeRayContinuity({
  geometry,revision:cad.revision
 });
 if(rays.schema!=='draftai-c1-m5-exact-closed-original-edge-ray-and-cut-continuity/1'||
    rays.sourceGeometryId!==geometry.id||rays.revision!==cad.revision||
    rays.signedV5ActionCount!==0||rays.wholeSolidV5Ready!==false||
    rays.allActualOccludingSceneFacesCertified!==false)
  throw new RangeError('current unsigned exact original 3D convex source rays required');
 const native3DOriginalRayClassConcordance=auditC1Native3DOriginalRayConcordance({
  native3DSourceViewLedger:gaps.native3DSourceViewLedger,rays
 });
 const nativeConcordanceBySource=new Map();
 for(const row of native3DOriginalRayClassConcordance.rows){
  const key=row.view+'|'+row.sourceEdgeId;
  if(nativeConcordanceBySource.has(key))
   throw new RangeError('duplicate native 3D/M0 source class concordance');
  nativeConcordanceBySource.set(key,row);
 }
 const nativePartitionFor=(view,id)=>{
  const row=nativeConcordanceBySource.get(view+'|'+id);
  if(native3DOriginalRayClassConcordance.actualNativeSourceScopedHLRAvailable&&
     !row)throw new RangeError('missing original source native 3D parameter reconciliation');
  return row??null;
 };
 // Bind real ORIGINAL-3D-parametric M4 projected candidates to the
 // SAME M5 source/view gaps. Never claim the received generated 2D HLR
 // edge gained a TopoDS history through coincident paper endpoints.
 const m4Available=gaps.native3DSourceViewLedger.availableFromActualPinnedOCJS&&
  geometry.kind==='mesh'&&geometry.space==='model-3d'&&geometry.unit==='mm'&&
  Array.isArray(cad.originalBRepSourceEdges)&&
  cad.originalBRepSourceEdges.every(curve=>
   curve?.occtSourceCurveFirstPoint3D&&
   curve?.occtSourceCurveLastPoint3D);
 const m4BySource=new Map();
 if(m4Available){
  const curveById=new Map(cad.originalBRepSourceEdges.map(x=>
   [x.sourceEdgeId,x]));
  for(const view of ['V','H','W']){
   const native=cad.nativeSourceScopedSharpOutputByView?.[view];
   if(!Array.isArray(native?.rows))
    throw new RangeError('native 3D M4 projection missing real source scoped view');
   for(const row of native.rows){
    const key=view+'|'+row.originalPhysicalSourceEdgeId;
    if(!nativeConcordanceBySource.has(key))continue; // collapsed in this view
    if(m4BySource.has(key))throw new RangeError('repeated native 3D M4 source identity');
    const projected=projectC1Native3DSourceIntervalsToM4({
     geometry,revision:cad.revision,view,
     sourceEdgeId:row.originalPhysicalSourceEdgeId,
     originalCurve:curveById.get(row.originalPhysicalSourceEdgeId),
     scopedRow:row
    });
    m4BySource.set(key,projected);
   }
  }
  if(m4BySource.size!==
     native3DOriginalRayClassConcordance.counts.projectedOriginalSourceViewsExamined)
   throw new RangeError('M4 native source projection does not cover every drawable M0 source');
 }
 const bySource=new Map();
 for(const ray of rays.rows){
  const key=ray.view+'|'+ray.originalPhysicalSourceEdgeId;
  if(bySource.has(key))throw new RangeError('duplicate exact original source ray');
  bySource.set(key,ray);
 }
 // M4 -> M5 co-projected original 3D source competition. This uses the
 // existing exact-depth M5 audit on EVERY genuine native-3D-backed M4
 // projected interval against EVERY other M0 physical source in that view.
 // Positive partial paper overlap remains a cut obligation, never a
 // misleading whole-stroke clear/source-frontmost certificate.
 const m4DepthBySource=new Map();
 const m4DepthCounts={sourceIntervalsExamined:0,
  sourceIntervalsWithFullOriginal3DDepthFrontOrdering:0,
  sourceIntervalsProvenBehindIndependentlyClearOriginalSource:0,
  sourceIntervalsHeldForDepthOrProjectedSplits:0,
  crossSourceProjectedAliasesExamined:0,
  native3DPositiveIntervalsHeldBeforeM4DepthForBinary64:0,
  canonicalM4CutSourceIntervalsExamined:0,
  canonicalM4CutSourceIntervalsFullyPartitioned:0,
  canonicalM4CutSubspansExamined:0,
  canonicalM4CutSubspansStrictlyFrontmost:0,
  canonicalM4CutSubspansSuppressedBehindVerifiedFrontSource:0,
  canonicalM4CutSubspansHeldForDepthOrTopology:0,
  sourceIntervalsWithStrictOriginal3DVertexOpenOrdering:0,
  canonicalM4CutSubspansWithStrictOriginal3DVertexOpenOrdering:0,
  canonicalM4CutPositiveOriginal3DSubpixelProjectionIntervalsHeld:0};
 if(m4Available){
  for(const [key,m4] of m4BySource){
   // The source ID itself contains an original endpoint separator '|'.
   // Only the first character is the view prefix: never split the full
   // original source identity and accidentally truncate 'g::A|B'.
   const view=key[0],sourceEdgeId=key.slice(2);
   const peers=rays.rows.filter(peer=>
    peer.view===view&&peer.projectionCollapsed===false&&
    peer.originalPhysicalSourceEdgeId!==sourceEdgeId).map(peer=>({
     view,sourceGeometryId:geometry.id,
     sourceEdgeId:peer.originalPhysicalSourceEdgeId,
     originalParameterRange:[0,1],
     status:peer.fullProjectedVisibleSourceLineProven===true?
      'single-opaque-solid-whole-open-ray-clear':
      peer.originalOpenEdgeStrictInteriorOcclusionProven===true?
       'single-opaque-solid-whole-open-ray-strictly-hidden':'undetermined'
    }));
   // Do not silently drop positive native OCCT intervals whose normalized
   // [0,1] or paper endpoints are unrepresentable as binary64 segments.
   // Those intervals are distinct from M5 gaps and cannot enter depth
   // competition, source-coverage certification or V5 by rounding.
   const held=m4.M4ProjectedNative3DIntervalsHeldForBinary64Representation;
   if(!Array.isArray(held)||held.some(x=>
      !Array.isArray(x.originalNative3DParameterRange)||
      !(x.originalNative3DParameterRange[1]>x.originalNative3DParameterRange[0])||
      x.engineeringLineStyle!=='undetermined'||x.signedV5Action!==false))
    throw new RangeError('invalid native positive intervals held before M4 depth');
   m4DepthCounts.native3DPositiveIntervalsHeldBeforeM4DepthForBinary64+=held.length;
   const rows=m4.segments.map(segment=>{
    const order=auditC1OriginalCoProjectedDepthOrder({
     geometry,view,sourceEdgeId,
     originalParameterRange:segment.originalM0UnitParameterRange,
     peers
    });
    // Reuse the existing M4 original-source projected EVENT CUTS already
    // cross-checked by M0/M5 exact ray continuity. Splitting by these
    // verified source-parameter intervals is not a second geometry engine.
    // Never infer a physical 3D junction from a paper-only event.
    const originalRay=bySource.get(key);
    if(!originalRay||originalRay.projectionCollapsed!==false||
       !Array.isArray(originalRay.originalCutSubspans))
     throw new RangeError('native M4 original 3D depth check lacks canonical source-event cut');
    const [nativeStart,nativeEnd]=segment.originalM0UnitParameterRange;
    const cutRows=[];
    let cursor=nativeStart,cutPartitionComplete=true;
    for(const cut of originalRay.originalCutSubspans){
     const range=cut.originalParameterRange;
     if(!Array.isArray(range)||range.length!==2||
        !range.every(Number.isFinite)||range[0]<0||range[1]>1||
        range[0]>=range[1])
      throw new RangeError('invalid original M4 source cut');
     const from=Math.max(range[0],nativeStart),
      to=Math.min(range[1],nativeEnd);
     if(!(to>from))continue;
     if(from!==cursor)cutPartitionComplete=false;
     const sliced=auditC1OriginalCoProjectedDepthOrder({
      geometry,view,sourceEdgeId,
      originalParameterRange:[from,to],peers
     });
     if(sliced.originalPhysicalVertexOpenDepthOrderingProven===true)
      m4DepthCounts.canonicalM4CutSubspansWithStrictOriginal3DVertexOpenOrdering++;
     if(sliced.status===
        'positive-original-dyadic-projection-below-paper-resolution-held')
      m4DepthCounts.canonicalM4CutPositiveOriginal3DSubpixelProjectionIntervalsHeld++;
     cutRows.push({
      originalM4SourceCutParameterRange:[from,to],
      originalM4CutFromCurrentReviewedEventGraph:true,
      originalM4EventPaperOnlyIsNot3DPhysicalJunction:true,
      coProjectedOriginal3DDepthOrder:sliced,
      engineeringLineStyle:'undetermined',signedV5Action:false
     });
     cursor=to;
     m4DepthCounts.canonicalM4CutSubspansExamined++;
     if(sliced.wholeIntervalFrontmostCertified)
      m4DepthCounts.canonicalM4CutSubspansStrictlyFrontmost++;
     else if(sliced.visibleSourceCoversEntireLine)
      m4DepthCounts.canonicalM4CutSubspansSuppressedBehindVerifiedFrontSource++;
     else m4DepthCounts.canonicalM4CutSubspansHeldForDepthOrTopology++;
    }
    cutPartitionComplete=cutPartitionComplete&&cutRows.length>0&&
     cursor===nativeEnd;
    m4DepthCounts.canonicalM4CutSourceIntervalsExamined++;
    if(cutPartitionComplete)
     m4DepthCounts.canonicalM4CutSourceIntervalsFullyPartitioned++;
    m4DepthCounts.sourceIntervalsExamined++;
    if(order.originalPhysicalVertexOpenDepthOrderingProven===true)
     m4DepthCounts.sourceIntervalsWithStrictOriginal3DVertexOpenOrdering++;
    m4DepthCounts.crossSourceProjectedAliasesExamined+=order.aliasesExamined;
    if(order.wholeIntervalFrontmostCertified)
     m4DepthCounts.sourceIntervalsWithFullOriginal3DDepthFrontOrdering++;
    else if(order.visibleSourceCoversEntireLine)
     m4DepthCounts.sourceIntervalsProvenBehindIndependentlyClearOriginalSource++;
    else m4DepthCounts.sourceIntervalsHeldForDepthOrProjectedSplits++;
    return {
     originalM0UnitParameterRange:[...segment.originalM0UnitParameterRange],
     native3DHLRClass:segment.native3DHLRClass,
     coProjectedOriginalM0DepthOrder:order,
     canonicalOriginalM4EventCutDepthRows:cutRows,
     canonicalOriginalM4EventCutPartitionCoversNative3DInterval:
      cutPartitionComplete,
     originalM4CutEndpointDoesNotAuthorize3DPhysicalJunction:true,
     originalSourceCompetitionOnlyNotWholeOpaqueSceneVisibility:true,
     generated2DHLREdgeTopologyProven:false,
     engineeringLineStyle:'undetermined',signedV5Action:false
    };
   });
   m4DepthBySource.set(key,rows);
  }
  if(m4DepthCounts.sourceIntervalsExamined!==
      [...m4BySource.values()].reduce((n,row)=>n+row.segments.length,0)||
     m4DepthCounts.sourceIntervalsExamined!==
      m4DepthCounts.sourceIntervalsWithFullOriginal3DDepthFrontOrdering+
      m4DepthCounts.sourceIntervalsProvenBehindIndependentlyClearOriginalSource+
      m4DepthCounts.sourceIntervalsHeldForDepthOrProjectedSplits||
     m4DepthCounts.canonicalM4CutSubspansExamined!==
      m4DepthCounts.canonicalM4CutSubspansStrictlyFrontmost+
      m4DepthCounts.canonicalM4CutSubspansSuppressedBehindVerifiedFrontSource+
      m4DepthCounts.canonicalM4CutSubspansHeldForDepthOrTopology||
     m4DepthCounts.canonicalM4CutSourceIntervalsExamined!==
      m4DepthCounts.sourceIntervalsExamined||
     m4DepthCounts.canonicalM4CutSubspansWithStrictOriginal3DVertexOpenOrdering>
      m4DepthCounts.canonicalM4CutSubspansHeldForDepthOrTopology||
     m4DepthCounts.canonicalM4CutPositiveOriginal3DSubpixelProjectionIntervalsHeld>
      m4DepthCounts.canonicalM4CutSubspansHeldForDepthOrTopology)
    throw new RangeError('source-specific M4/M5 original 3D projected depth coverage incomplete');
 }
 // A missing M5 source/view is a distinct coverage obligation from a
 // positive gap inside an existing M5 span. Audit every noncollapsed
 // original M0 edge, including sources never emitted by the M5 ledger.
 const missingCandidates=new Map();
 for(const witness of gaps.unrepresentedM0NativeHLRCandidateForensics){
  const key=witness.view+'|'+witness.sourceEdgeId;
  if(missingCandidates.has(key)||
     !Number.isSafeInteger(witness.nativeHLRPaperCandidateCount)||
     witness.nativeHLRPaperCandidateCount<0||
     witness.nativeHLRPaperCandidateCount!==witness.nativeHLRPaperCandidates?.length||
     witness.continuousOcclusionCertified!==false||
     witness.signedV5Action!==false)
   throw new RangeError('invalid omitted M0 source HLR candidate inventory');
  missingCandidates.set(key,witness);
 }
 const missingOriginalM0SourceViewRows=[];
 const missingSeen=new Set();
 const omittedCandidateCounts={
  examined:0,exactAffineAligned:0,exactAffineDrift:0,
  exactParameterDomainFailures:0,nativeIsSameOwnerClaims:0,
  nativeOwnerRayClassConsistent:0,nativeOwnerRayClassContradictions:0,
  paperOnlyRayClassDisagreements:0,
  paperAliasExactFullSourceViewCoverage:0,
  paperAliasExactPositiveGapSourceViews:0,
  nativeScopedOwnerExactFullSourceViewCoverage:0,
  nativeScopedOwnerExactPositiveGapSourceViews:0,
  exactPaperVisibleHiddenPositiveConflictSourceViews:0,
  rayExcludedOppositeHLRClassPaperAliases:0,
  native3DClassExcludedPaperAliases:0,
  native3DAndRayCompatiblePaperCandidateCount:0,
  native3DAndRayCompatiblePaperFullSourceViews:0,
  native3DAndRayCompatiblePaperPositiveGapSourceViews:0,
  native3DAndRayCompatiblePaperConflictSourceViews:0,
  rayCompatiblePaperFullSourceViewCoverage:0,
  rayCompatiblePaperPositiveGapSourceViews:0,
  rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews:0,
  rayCompatibleNativeOwnerFullSourceViewCoverage:0,
  rayCompatibleNativeOwnerPositiveGapSourceViews:0,
  nativeOwnerRayClassContradictorySourceViews:0,
  nativeEndpoint3DContradictoryPaperAliases:0,
  nativeEndpoint3DConsistentPaperAliases:0,
  nativeEndpoint3DUnknownPaperAliases:0
 };
 for(const missing of gaps.unrepresentedOriginalM0ProjectedSources){
  const key=missing.view+'|'+missing.sourceEdgeId;
  const ray=bySource.get(key),candidate=missingCandidates.get(key);
  if(missingSeen.has(key)||!ray||!candidate||
     ray.sourceGeometryId!==geometry.id||ray.revision!==cad.revision||
     ray.projectionCollapsed!==false||
     ray.signedV5Action!==false||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[0]!==0||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[1]!==1||
     missing.originalTopoDSHistoryCertified!==false||
     missing.signedV5Action!==false)
   throw new RangeError('unrepresented original M0 source/view lacks independent 3D ray');
  missingSeen.add(key);
  const closed=ray.originalPhysicalCreaseProven===true&&
   ray.completeSourceOriginal3DRayClosedIntervalClear===true&&
   ray.exactlyBothOriginalVertexForwardRaysClear===true;
  const hidden=ray.originalPhysicalCreaseProven===true&&
   ray.originalOpenEdgeStrictInteriorOcclusionProven===true;
  if(closed&&hidden)
   throw new RangeError('contradictory omitted M0 original ray witnesses');
  const original=geometry.data.edges.find(edge=>
   geometry.id+'::'+[...edge].sort().join('|')===missing.sourceEdgeId);
  if(!original||original.some((id,i)=>id!==ray.originalVertexIds[i]))
   throw new RangeError('omitted HLR source is not the original M0 3D edge');
  const [from,to]=original.map(id=>project(geometry.data.points[id])[missing.view]);
  const nativeOwners=new Set(candidate.directNativeGeneratedIdentityCandidates?.map(x=>
   x.hlrClass+'|'+x.ordinal)??[]);
  if(candidate.directNativeGeneratedIdentityCandidateCount!==nativeOwners.size)
   throw new RangeError('incomplete omitted M0 genuine native identity claims');
  const otherOwners=new Set(candidate.paperCandidatesClaimedByDifferentOriginalNativeSource?.
   map(x=>x.hlrClass+'|'+x.ordinal)??[]);
  const expectedClass=closed?'visible-sharp':hidden?'hidden-sharp':null;
  const classVeto=candidate.native3DClassPaperCandidateVeto;
  const native3DClassAllowed=classVeto===null?null:new Set(
   classVeto.native3DClassCompatiblePaperCandidates.map(x=>
    x.hlrClass+'|'+x.ordinal));
  const native3DClassExcluded=classVeto===null?new Set():new Set(
   classVeto.paperCandidatesExcludedByNative3DClassAbsence.map(x=>
    x.hlrClass+'|'+x.ordinal));
  const rawKeys=new Set(candidate.nativeHLRPaperCandidates.map(x=>
   x.hlrClass+'|'+x.ordinal));
  if(classVeto!==null&&(
     classVeto.view!==missing.view||
     classVeto.sourceEdgeId!==missing.sourceEdgeId||
     classVeto.fullOriginalSourceHistoryCertified!==false||
     classVeto.globalContinuousVisibilityCertified!==false||
     classVeto.signedV5Action!==false||
     classVeto.originalWholeSolidPaperCandidateCount!==rawKeys.size||
     native3DClassAllowed.size+native3DClassExcluded.size!==rawKeys.size||
     [...native3DClassAllowed,...native3DClassExcluded].some(x=>!rawKeys.has(x))||
     [...native3DClassExcluded].some(x=>nativeOwners.has(x))))
   throw new RangeError('native 3D class veto contradicts original HLR paper or direct native ownership');
  omittedCandidateCounts.native3DClassExcludedPaperAliases+=native3DClassExcluded.size;
  const candidateDiagnostics=candidate.nativeHLRPaperCandidates.map(paper=>{
   const key=paper.hlrClass+'|'+paper.ordinal;
   if(nativeOwners.has(key)&&otherOwners.has(key))
    throw new RangeError('contradictory original native HLR edge owners');
   const affine=auditC1ExactBinary64PaperAffineWitness({
    sourceFrom:from,sourceTo:to,
    measuredFrom:paper.projectedFrom,measuredTo:paper.projectedTo
   });
   const parameter=auditExactBinary64PaperParameterPair({
    sourceFrom:from,sourceTo:to,
    measuredFrom:paper.projectedFrom,measuredTo:paper.projectedTo
   });
   const aligned=affine.bothNativeEndpointsExactlyOnOriginalBinary64PaperLine;
   const bounded=parameter.nativeFromWithinExactBinary64OriginalParameterDomain&&
    parameter.nativeToWithinExactBinary64OriginalParameterDomain;
   const nativeOwner=nativeOwners.has(key);
   const nativeSegment=paper.hlrClass==='visible-sharp'?
    cad.views[missing.view]?.[paper.ordinal]:
    cad.hiddenSharpViews[missing.view]?.[paper.ordinal];
   const directVertices=nativeSegment?.directNativeVertexOriginalSource;
   if(directVertices!==undefined&&
      (!Array.isArray(directVertices)||directVertices.length!==2))
    throw new RangeError('invalid native generated vertex TopoDS identity pair');
   let positiveOriginal3DVertexEndpoints=0,contradictory3DEndpoints=0;
   if(directVertices)for(let side=0;side<2;side++){
    const witness=directVertices[side];
    const vertexId=witness?.directlySameOriginalM0VertexId;
    if(vertexId===null||vertexId===undefined){
     if(witness?.directOriginal3DVertexTopoDSIdentityProven===true)
      throw new RangeError('unbound positive native original vertex identity');
     continue;
    }
    const point=geometry.data.points[vertexId];
    if(witness?.directOriginal3DVertexTopoDSIdentityProven!==true||!point)
     throw new RangeError('forged original native vertex TopoDS identity');
    const projected=project(point)[missing.view];
    const endpoint=side===0?paper.projectedFrom:paper.projectedTo;
    if(projected.u!==endpoint.u||projected.v!==endpoint.v)
     throw new RangeError('native IsSame original vertex contradicts actual HLR paper endpoint');
    if(exactOriginal3DVertexOnSourceSegment(
      geometry.data.points[original[0]],
      geometry.data.points[original[1]],point))
     positiveOriginal3DVertexEndpoints++;
    else contradictory3DEndpoints++;
   }
   const nativeEndpoint3DSourceStatus=contradictory3DEndpoints?
    'contradicted-by-native-original-vertex':
    positiveOriginal3DVertexEndpoints?
    'positive-original-vertex-incidence-only':'unverified';
   if(contradictory3DEndpoints)
    omittedCandidateCounts.nativeEndpoint3DContradictoryPaperAliases++;
   else if(positiveOriginal3DVertexEndpoints)
    omittedCandidateCounts.nativeEndpoint3DConsistentPaperAliases++;
   else omittedCandidateCounts.nativeEndpoint3DUnknownPaperAliases++;
   const classMatches=expectedClass===null?null:paper.hlrClass===expectedClass;
   // An independently proven whole ORIGINAL 3D edge ray can veto a
   // projected HLR class as ownership of THIS source. It cannot veto
   // the actual HLR segment: another 3D edge may share its paper line.
   if(classMatches===false)
    omittedCandidateCounts.rayExcludedOppositeHLRClassPaperAliases++;
   omittedCandidateCounts.examined++;
   if(aligned)omittedCandidateCounts.exactAffineAligned++;
   else omittedCandidateCounts.exactAffineDrift++;
   if(!bounded)omittedCandidateCounts.exactParameterDomainFailures++;
   if(nativeOwner){
    omittedCandidateCounts.nativeIsSameOwnerClaims++;
    if(classMatches===true)omittedCandidateCounts.nativeOwnerRayClassConsistent++;
    if(classMatches===false)omittedCandidateCounts.nativeOwnerRayClassContradictions++;
   }else if(classMatches===false)
    omittedCandidateCounts.paperOnlyRayClassDisagreements++;
   return {hlrClass:paper.hlrClass,ordinal:paper.ordinal,
    exactBinary64PaperAffineAligned:aligned,
    exactBinary64PaperAffineCrossProductDyadic:[
     affine.exactBinary64PaperFromCrossProductDyadic,
     affine.exactBinary64PaperToCrossProductDyadic],
    exactBinary64PaperWithinOriginalParameterDomain:bounded,
    exactBinary64PaperHasPositiveParameterSpan:
     parameter.nativePaperSourceParameterPairHasExactPositiveSpan,
    sourceScopedGeneratedIsSameOwnerClaim:nativeOwner,
    nativeEndpoint3DSourceStatus,
    nativeOriginal3DVertexIncidenceCount:positiveOriginal3DVertexEndpoints,
    nativeOriginal3DVertexContradictionCount:contradictory3DEndpoints,
    nativeOriginalVertexIncidenceIsNotGeneratedEdgeHistory:true,
    nativeGeneratedEdgeClaimedByDifferentOriginalSource:otherOwners.has(key),
    classConsistentWithIndependentWholeOriginal3DRay:classMatches,
    native3DClassConsistentWithOriginalSource:
     native3DClassAllowed===null?null:native3DClassAllowed.has(key),
    native3DClassVetoExcludesThisSourcePaperAlias:
     native3DClassExcluded.has(key),
    oppositeClassExcludedAsThisOriginal3DSourceByExactRay:classMatches===false,
    sourceScopedIdentityIsNotCompleteGeneratedTopoDSHistory:true,
    engineeringLineStyle:'undetermined',signedV5Action:false};
  });
  if(candidateDiagnostics.length!==candidate.nativeHLRPaperCandidateCount||
     [...nativeOwners,...otherOwners].some(key=>
      !candidateDiagnostics.some(x=>x.hlrClass+'|'+x.ordinal===key)))
   throw new RangeError('omitted original source native HLR candidate/claim inventory mismatch');
  // These are exact dyadic unions of received binary64 HLR PAPER
  // coordinates, not recovered native source parameters. Only exactly
  // affine-aligned, in-domain, positive-length fragments may contribute.
  // Keep native IsSame scoped-owner subsets separate from paper aliases.
  const eligible=candidate.nativeHLRPaperCandidates.filter((paper,i)=>{
   const proof=candidateDiagnostics[i];
   return proof.nativeEndpoint3DSourceStatus!=='contradicted-by-native-original-vertex'&&
    proof.exactBinary64PaperAffineAligned&&
    proof.exactBinary64PaperWithinOriginalParameterDomain&&
    proof.exactBinary64PaperHasPositiveParameterSpan;
  });
  // Source-specific candidate pruning is an independent M0 3D theorem,
  // NOT a change to the actual whole-solid OCCT visible/hidden HLR output.
  // Preserve the raw alias/class conflict separately for audit. In
  // particular, a contradictory direct native IsSame owner claim remains
  // an unresolved evidence conflict rather than being silently approved.
  const rayCompatibleEligible=eligible.filter(paper=>
   candidateDiagnostics[candidate.nativeHLRPaperCandidates.indexOf(paper)].
    classConsistentWithIndependentWholeOriginal3DRay!==false);
  const native3DAndRayEligible=rayCompatibleEligible.filter(paper=>
   native3DClassAllowed===null||
   native3DClassAllowed.has(paper.hlrClass+'|'+paper.ordinal));
  omittedCandidateCounts.native3DAndRayCompatiblePaperCandidateCount+=
   native3DAndRayEligible.length;
  const native3DAndRayPaperCoverage=auditExactBinary64PaperCandidateCoverage({
   sourceFrom:from,sourceTo:to,
   segments:native3DAndRayEligible.map(paper=>({
    from:paper.projectedFrom,to:paper.projectedTo
   }))
  });
  const native3DAndRayPaperVisibility=auditExactBinary64PaperVisibilityConflict({
   sourceFrom:from,sourceTo:to,
   visibleSegments:native3DAndRayEligible.filter(p=>p.hlrClass==='visible-sharp').
    map(p=>({from:p.projectedFrom,to:p.projectedTo})),
   hiddenSegments:native3DAndRayEligible.filter(p=>p.hlrClass==='hidden-sharp').
    map(p=>({from:p.projectedFrom,to:p.projectedTo}))
  });
  if(native3DAndRayPaperCoverage.exactBinary64PaperCandidateCoverageComplete)
   omittedCandidateCounts.native3DAndRayCompatiblePaperFullSourceViews++;
  else omittedCandidateCounts.native3DAndRayCompatiblePaperPositiveGapSourceViews++;
  if(native3DAndRayPaperVisibility.hasExactPositiveLengthVisibleHiddenPaperClassConflict)
   omittedCandidateCounts.native3DAndRayCompatiblePaperConflictSourceViews++;
  const rayCompatiblePaperCoverage=auditExactBinary64PaperCandidateCoverage({
   sourceFrom:from,sourceTo:to,
   segments:rayCompatibleEligible.map(paper=>({
    from:paper.projectedFrom,to:paper.projectedTo
   }))
  });
  const rayCompatiblePaperVisibility=auditExactBinary64PaperVisibilityConflict({
   sourceFrom:from,sourceTo:to,
   visibleSegments:rayCompatibleEligible.filter(p=>p.hlrClass==='visible-sharp').
    map(p=>({from:p.projectedFrom,to:p.projectedTo})),
   hiddenSegments:rayCompatibleEligible.filter(p=>p.hlrClass==='hidden-sharp').
    map(p=>({from:p.projectedFrom,to:p.projectedTo}))
  });
  if(rayCompatiblePaperVisibility.hasExactPositiveLengthVisibleHiddenPaperClassConflict)
   omittedCandidateCounts.rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews++;
  if(rayCompatiblePaperCoverage.exactBinary64PaperCandidateCoverageComplete)
   omittedCandidateCounts.rayCompatiblePaperFullSourceViewCoverage++;
  else omittedCandidateCounts.rayCompatiblePaperPositiveGapSourceViews++;
  const paperCoverage=auditExactBinary64PaperCandidateCoverage({
   sourceFrom:from,sourceTo:to,
   segments:eligible.map(paper=>({
    from:paper.projectedFrom,to:paper.projectedTo
   }))
  });
  const nativeOwnedCoverage=auditExactBinary64PaperCandidateCoverage({
   sourceFrom:from,sourceTo:to,
   segments:eligible.filter(paper=>nativeOwners.has(
    paper.hlrClass+'|'+paper.ordinal)).map(paper=>({
     from:paper.projectedFrom,to:paper.projectedTo
    }))
  });
  const rayCompatibleNativeOwnedCoverage=auditExactBinary64PaperCandidateCoverage({
   sourceFrom:from,sourceTo:to,
   segments:rayCompatibleEligible.filter(paper=>nativeOwners.has(
    paper.hlrClass+'|'+paper.ordinal)).map(paper=>({
     from:paper.projectedFrom,to:paper.projectedTo
    }))
  });
  const nativeOwnerRayClassContradiction=candidateDiagnostics.some(x=>
   x.sourceScopedGeneratedIsSameOwnerClaim&&
   x.classConsistentWithIndependentWholeOriginal3DRay===false);
  if(nativeOwnerRayClassContradiction)
   omittedCandidateCounts.nativeOwnerRayClassContradictorySourceViews++;
  if(rayCompatibleNativeOwnedCoverage.exactBinary64PaperCandidateCoverageComplete)
   omittedCandidateCounts.rayCompatibleNativeOwnerFullSourceViewCoverage++;
  else omittedCandidateCounts.rayCompatibleNativeOwnerPositiveGapSourceViews++;
  const paperVisibility=auditExactBinary64PaperVisibilityConflict({
   sourceFrom:from,sourceTo:to,
   visibleSegments:eligible.filter(p=>p.hlrClass==='visible-sharp').
    map(p=>({from:p.projectedFrom,to:p.projectedTo})),
   hiddenSegments:eligible.filter(p=>p.hlrClass==='hidden-sharp').
    map(p=>({from:p.projectedFrom,to:p.projectedTo}))
  });
  if(paperVisibility.hasExactPositiveLengthVisibleHiddenPaperClassConflict)
   omittedCandidateCounts.exactPaperVisibleHiddenPositiveConflictSourceViews++;
  if(paperCoverage.exactBinary64PaperCandidateCoverageComplete)
   omittedCandidateCounts.paperAliasExactFullSourceViewCoverage++;
  else omittedCandidateCounts.paperAliasExactPositiveGapSourceViews++;
  if(nativeOwnedCoverage.exactBinary64PaperCandidateCoverageComplete)
   omittedCandidateCounts.nativeScopedOwnerExactFullSourceViewCoverage++;
  else omittedCandidateCounts.nativeScopedOwnerExactPositiveGapSourceViews++;
  const nativePartition=nativePartitionFor(missing.view,missing.sourceEdgeId);
  const nativeM4=m4BySource.get(key)??null;
  missingOriginalM0SourceViewRows.push({
   view:missing.view,sourceEdgeId:missing.sourceEdgeId,
   nativeOriginal3DM4SourceProjectionPresent:nativeM4!==null,
   nativeOriginal3DM4ProjectionWholeSourceCoverage:
    nativeM4?.M4OriginalUnitIntervalCandidateCoverageComplete??null,
   native3DM4ProjectedCandidateSegments:nativeM4?.segments??[],
   nativeOriginalM4CoProjectedDepthOrder:
    m4DepthBySource.get(key)??[],
   originalM4DepthOrderDoesNotConstituteGlobalSceneVisibility:true,
   native3DM4CandidateDoesNotCertifyGenerated2DHistory:true,
   completeRealNative3DSourceParameterPartition:
    nativePartition?.exactNative3DCombinedParameterPartitionComplete??null,
   missingM5SourceViewWithNative3DAlreadyFullyAccountedFor:
    nativePartition?.exactNative3DCombinedParameterPartitionComplete===true,
   native3DSourcePartitionDoesNotProveGenerated2DIdentity:true,
   expectedHLRClassFromIndependentOriginalRay:expectedClass,
   allPaperAliasCandidateExactBinary64Coverage:paperCoverage,
   nativeScopedOwnerCandidateExactBinary64Coverage:nativeOwnedCoverage,
   rayCompatibleNativeScopedOwnerPaperCoverage:rayCompatibleNativeOwnedCoverage,
   nativeOwnerRayClassContradictionRequiresHistoryReview:
    nativeOwnerRayClassContradiction,
   exactBinary64PaperVisibleHiddenCandidateConflict:paperVisibility,
   rayCompatibleOriginal3DSourcePaperCoverage:rayCompatiblePaperCoverage,
   native3DAndRayCompatibleOriginalSourcePaperCoverage:native3DAndRayPaperCoverage,
   native3DAndRayCompatibleOriginalSourcePaperVisibility:native3DAndRayPaperVisibility,
   native3DAndRayCompatibleCandidateCount:native3DAndRayEligible.length,
   native3DClassExcludedPaperAliasCount:native3DClassExcluded.size,
   native3DClassVetoIsNotOriginalGeneratedTopoDSHistory:true,
   rayCompatibleOriginal3DSourcePaperVisibility:rayCompatiblePaperVisibility,
   rayCompatibleCandidateCount:rayCompatibleEligible.length,
   rayClassPruningIsNotNativeHLROwnershipOrContinuousVisibility:true,
   paperClassConflictCannotCertifyGlobal3DDepthOrVisibility:true,
   exactPaperCoverageIsNotNativeSourceParameterCoverage:true,
   nativeHLRCandidateExactBinary64AndRayDiagnostics:candidateDiagnostics,
   original3DVertexIds:[...ray.originalVertexIds],
   original3DRayStatus:closed?'exact-original-closed-ray-clear':
    hidden?'exact-original-open-strict-interior':'undetermined',
   originalM4SourcePartitionComplete:
    ray.originalM4Canonical3DSourcePartitionPositivelyProven===true,
   nativeHLRPaperCandidateCount:candidate.nativeHLRPaperCandidateCount,
   nativeHLRPaperCandidates:candidate.nativeHLRPaperCandidates.map(x=>({
    hlrClass:x.hlrClass,ordinal:x.ordinal
   })),
   missingM5SourceViewRemainsUncovered:true,
   generatedTopoDSToOriginalSourceHistoryCertified:false,
   globalCoProjectedFrontmostSourceCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
 }
 if(missingCandidates.size!==missingSeen.size||
    omittedCandidateCounts.examined!==
     omittedCandidateCounts.exactAffineAligned+omittedCandidateCounts.exactAffineDrift||
    omittedCandidateCounts.examined!==
     omittedCandidateCounts.nativeEndpoint3DContradictoryPaperAliases+
     omittedCandidateCounts.nativeEndpoint3DConsistentPaperAliases+
     omittedCandidateCounts.nativeEndpoint3DUnknownPaperAliases||
    omittedCandidateCounts.nativeOwnerRayClassConsistent+
     omittedCandidateCounts.nativeOwnerRayClassContradictions>
     omittedCandidateCounts.nativeIsSameOwnerClaims||
    omittedCandidateCounts.paperAliasExactFullSourceViewCoverage+
     omittedCandidateCounts.paperAliasExactPositiveGapSourceViews!==missingSeen.size||
    omittedCandidateCounts.nativeScopedOwnerExactFullSourceViewCoverage+
     omittedCandidateCounts.nativeScopedOwnerExactPositiveGapSourceViews!==missingSeen.size||
    omittedCandidateCounts.exactPaperVisibleHiddenPositiveConflictSourceViews>missingSeen.size||
    omittedCandidateCounts.rayCompatiblePaperFullSourceViewCoverage+
     omittedCandidateCounts.rayCompatiblePaperPositiveGapSourceViews!==missingSeen.size||
    omittedCandidateCounts.rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews>
     omittedCandidateCounts.exactPaperVisibleHiddenPositiveConflictSourceViews||
    omittedCandidateCounts.rayExcludedOppositeHLRClassPaperAliases>
     omittedCandidateCounts.examined||
    omittedCandidateCounts.native3DAndRayCompatiblePaperFullSourceViews+
     omittedCandidateCounts.native3DAndRayCompatiblePaperPositiveGapSourceViews!==missingSeen.size||
    omittedCandidateCounts.native3DAndRayCompatiblePaperConflictSourceViews>
     omittedCandidateCounts.rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews||
    omittedCandidateCounts.native3DClassExcludedPaperAliases>
     omittedCandidateCounts.examined||
    omittedCandidateCounts.rayCompatibleNativeOwnerFullSourceViewCoverage+
     omittedCandidateCounts.rayCompatibleNativeOwnerPositiveGapSourceViews!==missingSeen.size||
    omittedCandidateCounts.nativeOwnerRayClassContradictorySourceViews>missingSeen.size)
  throw new RangeError('incomplete omitted original M0 native HLR/ray reconciliation');
 // Independent whole-M0 inventory equation: every drawable original
 // source/view is either represented by at least one current M5 span or
 // explicitly missing. Multiple M5 subspans must not inflate the count.
 const noncollapsedOriginalM0SourceViews=rays.rows.filter(x=>
  x.projectionCollapsed===false).length;
 const representedOriginalM0SourceViewsInM5=new Set(gaps.rows.filter(x=>
  x.sourceEdgeId&&bySource.get(x.view+'|'+x.sourceEdgeId)?.
   projectionCollapsed===false).map(x=>x.view+'|'+x.sourceEdgeId)).size;
 if(noncollapsedOriginalM0SourceViews!==
    representedOriginalM0SourceViewsInM5+missingSeen.size)
  throw new RangeError('incomplete whole-M0 noncollapsed V/H/W source inventory');
 const rows=[],counts={
  noncollapsedOriginalM0SourceViews,
  realOriginalM4ToM5CoProjectedDepthCounts:m4DepthCounts,
  representedOriginalM0SourceViewsInM5,
  unrepresentedOriginalM0SourceViews:missingOriginalM0SourceViewRows.length,
  unrepresentedM0SourceViewsWithNativeHLRPaperCandidates:
   missingOriginalM0SourceViewRows.filter(x=>x.nativeHLRPaperCandidateCount>0).length,
  omittedNativeHLRPaperCandidateDiagnostics:omittedCandidateCounts,
  unrepresentedM0SourceViewsWithExactClosedRays:
   missingOriginalM0SourceViewRows.filter(x=>
    x.original3DRayStatus==='exact-original-closed-ray-clear').length,
  unrepresentedM0SourceViewsWithExactOpenHiddenRays:
   missingOriginalM0SourceViewRows.filter(x=>
    x.original3DRayStatus==='exact-original-open-strict-interior').length,
  independentOriginalOCCTCurvePositiveGapIntervals:0,
  positiveNativeGapIntervals:0,
  exactOriginalClosedRayClearGapIntervals:0,
  exactOriginalOpenStrictInteriorGapIntervals:0,
  originalSourceRayUnresolvedGapIntervals:0,
  nativeGeneratedHistoryGapsClosed:0,
  missingM5SourceViewsWithCompleteNative3DParameterPartition:
   missingOriginalM0SourceViewRows.filter(row=>
    row.missingM5SourceViewWithNative3DAlreadyFullyAccountedFor).length,
  positivePaperM5GapIntervalsWithCompleteNative3DSourcePartition:0,
  missingM5SourceViewsWithCompleteOriginalNativeM4Projection:
   missingOriginalM0SourceViewRows.filter(row=>
    row.nativeOriginal3DM4ProjectionWholeSourceCoverage===true).length,
  positivePaperM5GapIntervalsCoveredByOriginalNativeM4Projection:0,
  officialV5Actions:0
 };
 for(const entry of gaps.rows){
  if(entry.positiveGaps.length===0)continue;
  const ray=bySource.get(entry.view+'|'+entry.sourceEdgeId);
  if(!ray||ray.sourceGeometryId!==geometry.id||
     ray.revision!==cad.revision||ray.signedV5Action!==false||
     !Array.isArray(ray.originalVertexIds)||ray.originalVertexIds.length!==2||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[0]!==0||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[1]!==1)
   throw new RangeError('positive HLR gap lacks independently recomputed original M0 ray');
  const original=geometry.data.edges.find(edge=>
   geometry.id+'::'+[...edge].sort().join('|')===entry.sourceEdgeId);
  if(!original||original.some((id,i)=>id!==ray.originalVertexIds[i]))
   throw new RangeError('native HLR gap does not belong to exact original 3D edge');
  const closedClear=ray.originalPhysicalCreaseProven===true&&
   ray.completeSourceOriginal3DRayClosedIntervalClear===true&&
   ray.exactlyBothOriginalVertexForwardRaysClear===true;
  const openHidden=ray.originalPhysicalCreaseProven===true&&
   ray.originalOpenEdgeStrictInteriorOcclusionProven===true;
  if(closedClear&&openHidden)
   throw new RangeError('contradictory exact original full-edge ray theorems');
  const joint=entry.jointNativeGapForensics;
  if(joint?.positiveGapCount!==entry.positiveGaps.length||
     !Array.isArray(joint.rows)||joint.rows.length!==entry.positiveGaps.length||
     joint.fullOriginalSourceHistoryCertified!==false||
     joint.globalContinuousVisibilityCertified!==false)
   throw new RangeError('native gap lacks independent original OCCT curve evidence');
  for(const [gapOrdinal,range] of entry.positiveGaps.entries()){
   const originalCurve=joint.rows[gapOrdinal];
   if(originalCurve?.gapOrdinal!==gapOrdinal||
      originalCurve.view!==entry.view||
      originalCurve.sourceEdgeId!==entry.sourceEdgeId||
      originalCurve.originalSourceParameterGap?.[0]!==range[0]||
      originalCurve.originalSourceParameterGap?.[1]!==range[1]||
      originalCurve.exactOriginalOcctCurvePositive!==true||
      originalCurve.generatedToOriginalTopoDSHistoryProven!==false||
      originalCurve.globalContinuousOcclusionProven!==false||
      originalCurve.signedV5Action!==false)
    throw new RangeError('original OCCT curve gap and M5 source interval disagree');
   counts.independentOriginalOCCTCurvePositiveGapIntervals++;
   if(!Array.isArray(range)||range.length!==2||
      !range.every(Number.isFinite)||range[0]<0||
      !(range[1]>range[0])||range[1]>1)
    throw new RangeError('invalid positive original native gap');
   const status=closedClear?'exact-original-closed-ray-clear':
    openHidden?'exact-original-open-strict-interior':'undetermined';
   counts.positiveNativeGapIntervals++;
   const nativeM4=m4BySource.get(entry.view+'|'+entry.sourceEdgeId)??null;
   const nativeM4GapCoverage=nativeM4===null?null:
    exactCandidateIntervalCoverage(range,nativeM4.segments.map(x=>
     x.originalM0UnitParameterRange));
   // Rounded normalized neighboring segments can appear to cover a
   // positive M5 gap while a positive native OCCT subspan was lost.
   // Require a complete, representable original-source M4 inventory,
   // not just the rounded candidate union across the requested gap.
   if(nativeM4?.M4OriginalUnitIntervalCandidateCoverageComplete===true&&
      nativeM4GapCoverage?.entireOriginalParameterIntervalCovered===true)
    counts.positivePaperM5GapIntervalsCoveredByOriginalNativeM4Projection++;
   const nativePartition=nativePartitionFor(entry.view,entry.sourceEdgeId);
   if(nativePartition?.exactNative3DCombinedParameterPartitionComplete===true)
    counts.positivePaperM5GapIntervalsWithCompleteNative3DSourcePartition++;
   if(closedClear)counts.exactOriginalClosedRayClearGapIntervals++;
   else if(openHidden)counts.exactOriginalOpenStrictInteriorGapIntervals++;
   else counts.originalSourceRayUnresolvedGapIntervals++;
   rows.push({
    view:entry.view,sourceEdgeId:entry.sourceEdgeId,
    originalSourceParameterGap:[...range],
    original3DVertexIds:[...ray.originalVertexIds],
    independentOriginalOCCTCurveGapPositive:true,
    nativeOriginal3DM4GapSourceProjectionAvailable:nativeM4!==null,
    nativeOriginal3DM4ProjectedCandidateSegments:nativeM4?.segments??[],
    nativeOriginalM4CoProjectedDepthOrder:
     m4DepthBySource.get(entry.view+'|'+entry.sourceEdgeId)??[],
    originalM4DepthOrderDoesNotConstituteGlobalSceneVisibility:true,
    realNative3DM4OriginalParameterGapCoverage:nativeM4GapCoverage,
    nativeOriginalM4PositiveIntervalsHeldForBinary64:
     nativeM4?.M4ProjectedNative3DIntervalsHeldForBinary64Representation??[],
    native3DM4CandidateDoesNotCertifyGenerated2DHistory:true,
    completeRealNative3DSourceParameterPartition:
     nativePartition?.exactNative3DCombinedParameterPartitionComplete??null,
    positivePaperM5GapDespiteFullNative3DSourceCoverage:
     nativePartition?.exactNative3DCombinedParameterPartitionComplete===true,
    native3DParameterCoverageDoesNotFillM5PaperOrGeneratedEdgeHistory:true,
    originalOCCTCurveGapRoundedToZero:
     originalCurve.originalCurveRoundedParameterCollapsed===true,
    nativeHLRGapDiagnosis:originalCurve.diagnosis,
    independentOriginal3DExactRayStatus:status,
    exactOriginal3DRayProvenThroughoutOpenGap:closedClear||openHidden,
    exactOriginal3DRayProvenAtBothOriginalVertices:closedClear,
    originalM4SourcePartitionComplete:
     ray.originalM4Canonical3DSourcePartitionPositivelyProven===true,
    nativeHLRGeneratedEdgeCoversGap:false,
    generatedTopoDSToOriginalSourceHistoryCertified:false,
    globalCoProjectedFrontmostSourceCertified:false,
    engineeringLineStyle:'undetermined',
    signedV5Action:false
   });
  }
 }
 if(rows.length!==gaps.totals.individualPositiveNativeGaps||
    rows.length!==counts.independentOriginalOCCTCurvePositiveGapIntervals||
    missingOriginalM0SourceViewRows.length!==
     gaps.unrepresentedOriginalM0ProjectedSources.length||
    rows.length!==counts.exactOriginalClosedRayClearGapIntervals+
     counts.exactOriginalOpenStrictInteriorGapIntervals+
     counts.originalSourceRayUnresolvedGapIntervals)
  throw new RangeError('original exact ray/native HLR gap reconciliation incomplete');
 return freeze({
  schema:'draftai-c1-native-gap-positive-original-ray-theorem/1',
  sourceGeometryId:geometry.id,revision:cad.revision,
  originalSourceGapLedgerSchema:gaps.schema,
  independentOriginalClosedRaySchema:rays.schema,
  counts,rows,missingOriginalM0SourceViewRows,
  native3DOriginalRayClassConcordance,
  nativeOriginal3DM4SourceProjectionAvailable:m4Available,
  nativeOriginal3DM4SourceProjectedCount:m4BySource.size,
  nativeOriginalM4Original3DDepthOrderRecomputed:m4Available,
  allNoncollapsedOriginalM0SourcesRepresentedInM5:
   missingOriginalM0SourceViewRows.length===0,
  allNativeHLRSourceGapsClosed:false,
  fullOriginalTopoDSGeneratedHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  officialV5Authorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1NativeGapOriginalExactRays,
 auditC1Native3DOriginalRayConcordance,exactOriginal3DVertexOnSourceSegment};
