'use strict';
/**
 * Genuine native OCJS HCompound vs existing authoritative M0->M4->M5
 * ORIGINAL closed-convex source rays. This is a witness audit, not a
 * second line classifier, a TopoDS-generated edge provenance claim,
 * an engineering standard signer, or a V5/ConstructionStep creator.
 *
 * Positive-length gaps are NEVER bridged by tolerance: #752 discovered
 * that M4 can contain actual micro-gaps that must remain explicit.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {computeC1OcjsVisibleSegments}=
 require('../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const {auditC1OriginalClosedEdgeRayContinuity}=
 require('./c1-m5-closed-original-edge-ray-continuity.cjs');
const frozen=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))frozen(v);Object.freeze(o);
 }return o;
};
const finite=Number.isFinite;
/**
 * Audit complete coverage of one actual original 3D source parameter
 * interval by native HLR projected candidate intervals. Floating-point
 * micro-gaps are recorded even when they are much smaller than paper ink.
 */
function exactCandidateIntervalCoverage(range,candidates){
 if(!Array.isArray(range)||range.length!==2||
    !range.every(finite)||!(range[0]>=0&&range[1]<=1&&range[1]>range[0])||
    !Array.isArray(candidates)||candidates.length>512)
  throw new TypeError('bounded exact physical source parameter interval required');
 const [from,to]=range,parts=[];
 for(const item of candidates){
  if(!Array.isArray(item)||item.length!==2||
     !item.every(finite)||!(item[0]>=0&&item[1]<=1&&item[1]>item[0]))
   throw new TypeError('verified finite native CAD source interval required');
  const start=Math.max(from,item[0]),end=Math.min(to,item[1]);
  if(end>start)parts.push([start,end]);
 }
 parts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const gaps=[],merged=[];let reach=from;
 for(const part of parts){
  if(part[0]>reach)gaps.push([reach,part[0]]);
  const end=Math.max(reach,part[1]);
  if(end>reach){
   if(merged.length&&part[0]<=merged.at(-1)[1]){
    merged.at(-1)[1]=Math.max(merged.at(-1)[1],end);
   }else merged.push([Math.max(reach,part[0]),end]);
   reach=end;
  }
 }
 if(reach<to)gaps.push([reach,to]);
 return frozen({originalParameterRange:[from,to],
  positiveLengthCoveredIntervals:merged,
  positiveLengthUncoveredIntervals:gaps,
  entireOriginalParameterIntervalCovered:gaps.length===0,
  originalSourceSubspanHasGenuinePositiveLengthGap:gaps.length>0,
  candidateIntervalsExamined:candidates.length
 });
}
function auditC1NativeHiddenSharpVsM5({oc,geometry,revision}={}){
 if(!oc||typeof oc!=='object'||!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current pinned real OCJS and C1 source revision required');
 const proof=verifiedConvexMeshHalfspaces(geometry);
 const cad=computeC1OcjsVisibleSegments({oc,geometry,revision});
 const m5=auditC1OriginalClosedEdgeRayContinuity({geometry,revision});
 if(cad.sourceGeometryId!==geometry.id||m5.sourceGeometryId!==geometry.id||
    cad.revision!==revision||m5.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||
    cad.hiddenLineStylesCertified!==false||cad.v5Authorized!==false||
    cad.completeSourceTopology3DEndpointCorrespondence!==true||
    cad.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
    proof.status!=='validated-closed-convex-mesh'||
    m5.signedV5ActionCount!==0)
  throw new RangeError('native hidden OCCT/M0-M5 unsigned proof chain mismatch');
 const realIds=new Set(geometry.data.edges.map(([a,b])=>
  geometry.id+'::'+[a,b].sort().join('|')));
 const nativeMap=new Map();
 const counts={realNativeHiddenSharpSegments:0,
  hiddenHLRWithMultiple3DSourceCandidates:0,
  nativeHiddenWithoutM0SourceCandidates:0,
  sourceViewIntervalsChecked:0,canonicalOriginalM4SubspansChecked:0,
  exactM5HiddenOpenSubspans:0,
  hiddenNativePaperCoverageConfirmedSubspans:0,
  uniqueNativePaperCandidatePlusExactM5HiddenSubspans:0,
  ambiguousHiddenNativePaperCandidateSubspans:0,
  positiveLengthHiddenNativePaperGaps:0,
  contradictoryVisibleCADAttributionRejected:0,
  signedNewEngineeringStrokes:0,signedNewV5Actions:0};
 for(const view of VIEWS){
  const hidden=cad.hiddenSharpViews?.[view];
  if(!Array.isArray(hidden))throw new RangeError('missing real native HCompound view');
  for(const seg of hidden){
   if(seg.view!==view||seg.occtHLRVisibilityClass!=='hidden-sharp'||
      seg.actualOCCTHLRFlattenedBRepLineVerified!==true||
      seg.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
      seg.v5Authorized!==false||
      !Array.isArray(seg.sourceCandidate3DLifts)||
      seg.sourceCandidate3DLifts.length!==seg.projectedOriginalEdgeCandidates?.length)
    throw new RangeError('untrusted real native hidden HLR stroke');
   counts.realNativeHiddenSharpSegments++;
   if(seg.sourceCandidate3DLifts.length===0)
    counts.nativeHiddenWithoutM0SourceCandidates++;
   if(seg.sourceCandidate3DLifts.length>1)
    counts.hiddenHLRWithMultiple3DSourceCandidates++;
   for(const candidate of seg.sourceCandidate3DLifts){
    const id=candidate.sourceEdgeId,range=candidate.originalSourceParameterRange;
    if(!realIds.has(id)||
       candidate.originalXYZReprojectsToHLR!==true||
       candidate.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
       candidate.originalOCCTSourceLineCurveVerified!==true||
       candidate.v5Authorized!==false||
       !Array.isArray(range)||range.length!==2||!range.every(finite)||
       range[0]<0||range[1]>1||range[1]<=range[0])
     throw new RangeError('native HLR candidate lacks actual original 3D OCCT source');
    const key=id+'@'+view;
    if(!nativeMap.has(key))nativeMap.set(key,[]);
    nativeMap.get(key).push({range:[...range],
     distinctOriginal3DCandidateCount:seg.sourceCandidate3DLifts.length,
     realOCCTHLREdgeToSourceIdentityRecovered:false,
     nativeHLRActualClass:'hidden-sharp'});
   }
  }
 }
 const rows=[];
 for(const row of m5.rows){
  if(!VIEWS.includes(row.view)||!realIds.has(row.originalPhysicalSourceEdgeId)||
     row.sourceGeometryId!==geometry.id||row.revision!==revision||
     row.officialEngineeringLineStyle!=='undetermined'||row.signedV5Action!==false)
   throw new RangeError('original full-edge M5 proof does not match reviewed source');
  const candidates=nativeMap.get(row.originalPhysicalSourceEdgeId+'@'+row.view)??[];
  const projectedPoints=row.originalVertexIds.map(id=>
   project(geometry.data.points[id])[row.view]);
  const collapsed=Math.hypot(
   projectedPoints[0].u-projectedPoints[1].u,
   projectedPoints[0].v-projectedPoints[1].v)<=1e-8;
  if(collapsed!==row.projectionCollapsed)
   throw new RangeError('native hidden source projection contradicts M5');
  const subspans=[];
  for(const s of row.originalCutSubspans){
   const all=exactCandidateIntervalCoverage(
    s.originalParameterRange,candidates.map(x=>x.range));
   const unique=exactCandidateIntervalCoverage(
    s.originalParameterRange,candidates.filter(x=>
     x.distinctOriginal3DCandidateCount===1).map(x=>x.range));
   const hidden=s.exactWholeOpenStrictInwardHidden===true;
   const clear=s.exactWholeOpenRayClear===true;
   if(hidden&&clear)
    throw new RangeError('same source M5 ray both exactly inward and outward');
   counts.canonicalOriginalM4SubspansChecked++;
   if(hidden)counts.exactM5HiddenOpenSubspans++;
   if(all.entireOriginalParameterIntervalCovered)
    counts.hiddenNativePaperCoverageConfirmedSubspans++;
   counts.positiveLengthHiddenNativePaperGaps+=
    all.positiveLengthUncoveredIntervals.length;
   const local=hidden&&unique.entireOriginalParameterIntervalCovered;
   if(local)counts.uniqueNativePaperCandidatePlusExactM5HiddenSubspans++;
   if(all.entireOriginalParameterIntervalCovered&&
      !unique.entireOriginalParameterIntervalCovered)
    counts.ambiguousHiddenNativePaperCandidateSubspans++;
   subspans.push({
    originalParameterRange:[...s.originalParameterRange],
    exactOriginalM5WholeOpenStrictlyInwardHidden:hidden,
    exactOriginalM5WholeOpenRayClear:clear,
    nativeHiddenCandidateCoverage:all,
    onlyUniqueOriginal3DCandidateHiddenCoverage:unique,
    nativeHiddenAndExactM5HiddenLocallyCorroborated:local,
    nativeHLRGeneratedTopoDSEdgeToOriginalIdentityProven:false,
    hiddenLineStyleStandardCertified:false,
    projectedSourceCollisionAndAllGlobalJunctionsProven:false,
    finalEngineeringStyle:'undetermined',
    constructionIntentAuthorized:false,signedV5Action:false
   });
  }
  counts.sourceViewIntervalsChecked++;
  rows.push({
   view:row.view,sourceGeometryId:geometry.id,revision,
   sourceEdgeId:row.originalPhysicalSourceEdgeId,
   projectionCollapsed:collapsed,
   originalPhysicalCreaseProven:row.originalPhysicalCreaseProven,
   entireOriginalOpenRayStrictlyHidden:
    row.originalOpenEdgeStrictInteriorOcclusionProven,
   originalSourceM4PaperPartitionComplete:
    row.originalM4PaperParameterPartitionComplete,
   genuineM4ProjectedParameterGaps:
    row.missingProjectedPaperSourceParameterRanges.map(x=>[...x]),
   nativeHiddenProjectedCandidateCount:candidates.length,
   subspans,
   officialEngineeringStyle:'undetermined',
   fullHLRToOriginalTopoDSProven:false,signedV5Action:false
  });
 }
 if(rows.length!==m5.rows.length||
    counts.sourceViewIntervalsChecked!==geometry.data.edges.length*3||
    counts.signedNewV5Actions!==0)
  throw new RangeError('missing original 3D edge/view hidden HLR proof rows');
 return frozen({
  schema:'draftai-c1-ocjs-real-hidden-sharp-m5-original-source-audit/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  nativeHiddenSource:'pinned-genuine-ocjs-hlr-hcompound',
  nativeNullHiddenSharpViews:[...cad.hiddenSharpNullCompoundViews],
  sourceM0M5ClosureSchema:m5.schema,
  allOriginal3DEdgesAndViewsRecomputed:true,
  counts,rows,
  localProofNotGlobalTopoDSIdentity:true,
  sourceAndGeneratedHiddenLineAttributionNotCertified:true,
  officialEngineeringLineStylesCertified:false,
  constructionIntentAuthorized:false,
  signedV5ActionCount:0,wholeSolidV5Ready:false
 });
}
module.exports={exactCandidateIntervalCoverage,auditC1NativeHiddenSharpVsM5};
