'use strict';
/**
 * A SOURCE-PRESERVING M4 projection consumer for real OCCT source-filtered
 * native 3D HLR intervals. Projects the independently reviewed ORIGINAL M0
 * edge at the received native 3D curve parameters. Never invert rounded
 * generated 2D HLR paper endpoints to guess a 3D source parameter.
 *
 * This is NOT generated 2D TopoDS identity, global visibility, line style,
 * ConstructionIntent or official V5 authorization.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {exactCandidateIntervalCoverage,
 exactCandidateVisibilityClassOverlap}=
 require('./c1-original-source-interval-coverage.cjs');
const {auditC1Native3DSourceScopedIntervals}=
 require('./c1-native-source-scoped-3d-parameter-coverage.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const finite3=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
function projectC1Native3DSourceIntervalsToM4({
 geometry,revision,view,sourceEdgeId,originalCurve,scopedRow
}={}){
 if(geometry?.kind!=='mesh'||geometry.space!=='model-3d'||
    geometry.unit!=='mm'||!Number.isSafeInteger(revision)||revision<1||
    !VIEWS.includes(view)||typeof sourceEdgeId!=='string'||
    scopedRow?.originalPhysicalSourceEdgeId!==sourceEdgeId||
    originalCurve?.sourceEdgeId!==sourceEdgeId||
    originalCurve.occtSourceCurve3DEndpointsAndMidpointVerified!==true||
    originalCurve.occtSourceCurveType!=='line'||
    !Array.isArray(originalCurve.occtSourceCurveParameterRange)||
    originalCurve.occtSourceCurveParameterRange.length!==2||
    !originalCurve.occtSourceCurveParameterRange.every(Number.isFinite)||
    !finite3(originalCurve.occtSourceCurveFirstPoint3D)||
    !finite3(originalCurve.occtSourceCurveLastPoint3D))
  throw new TypeError('current original native 3D source curve and source-filtered HLR required');
 const edges=geometry.data.edges.filter(edge=>
  geometry.id+'::'+[...edge].sort().join('|')===sourceEdgeId);
 if(edges.length!==1||edges[0].length!==2||
    edges[0].some(id=>!finite3(geometry.data.points[id])))
  throw new RangeError('missing or ambiguous original M0 physical edge');
 const [id0,id1]=edges[0],a=geometry.data.points[id0],
  b=geometry.data.points[id1],length=dist(a,b);
 if(!Number.isFinite(length)||length<=1e-8)
  throw new RangeError('collapsed M0 model-space source');
 const [first,last]=originalCurve.occtSourceCurveParameterRange;
 if(!(last>first)||!Number.isFinite(last-first))
  throw new RangeError('invalid original native 3D curve parameter domain');
 // Native BRepAdaptor samples are floating-point OCCT measurements;
 // endpoint orientation is a 3D correspondence, never a paper alias.
 // Require a UNIQUE endpoint ordering with a scale-bounded tolerance.
 const tolerance=Math.min(1e-6,length*1e-6);
 const c0=originalCurve.occtSourceCurveFirstPoint3D,
  c1=originalCurve.occtSourceCurveLastPoint3D;
 const forward=dist(c0,a)<=tolerance&&dist(c1,b)<=tolerance;
 const reversed=dist(c0,b)<=tolerance&&dist(c1,a)<=tolerance;
 if(forward===reversed)
  throw new RangeError('ambiguous or contradictory original native 3D curve direction');
 const groups=[['visible-sharp',scopedRow.visible3D],
  ['hidden-sharp',scopedRow.hidden3D]],segments=[],ranges={};
 for(const [klass,group] of groups){
  const parts=group?.native3DGeneratedCurveIntervals;
  if(group?.nativeSourceFilteredOriginalTopoDSEdge!==true||
     !Array.isArray(parts)||parts.length>128)
   throw new RangeError('incomplete native source-filtered 3D visibility group');
  const intervals=[];
  for(const native of parts){
   const interval=native?.nativeOriginalCurveParameterRange;
   if(native.nativeSourceFilterOriginalEdgeId!==sourceEdgeId||
      native.native3DCurveExactlySameAsOriginalAtThreeParameters!==true||
      native.originalGeneratedTopoDSHistoryCertified!==false||
      native.signedV5Action!==false||
      !Array.isArray(interval)||interval.length!==2||
      !interval.every(Number.isFinite)||!(interval[1]>interval[0])||
      interval[0]<first||interval[1]>last)
    throw new RangeError('unverified source-scoped original native 3D curve interval');
   intervals.push([...interval]);
   // Normalization uses ORIGINAL 3D OCCT curve parameters, not any HLR
   // paper inverse. No epsilon snap or clipping at interval boundaries.
   const normalize=t=>reversed?(last-t)/(last-first):(t-first)/(last-first);
   const u=normalize(interval[0]),v=normalize(interval[1]),
    from=Math.min(u,v),to=Math.max(u,v);
   if(!Number.isFinite(from)||!Number.isFinite(to)||
      from<0||to>1||!(to>from))
    throw new RangeError('native 3D source interval cannot be exactly bounded in original M0 [0,1]');
   const fromModelMm=lerp(a,b,from),toModelMm=lerp(a,b,to);
   const fromPaper=project(fromModelMm)[view],
    toPaper=project(toModelMm)[view];
   if(![fromPaper.u,fromPaper.v,toPaper.u,toPaper.v].every(Number.isFinite))
    throw new RangeError('nonfinite first-angle M4 projection');
   if(fromPaper.u===toPaper.u&&fromPaper.v===toPaper.v)
    throw new RangeError('noncollapsed original edge emitted collapsed M4 projected interval');
   segments.push({view,sourceEdgeId,originalVertexIds:[id0,id1],
    native3DHLRClass:klass,originalNative3DParameterRange:[...interval],
    originalM0UnitParameterRange:[from,to],
    fromModelMm,toModelMm,fromPaper,toPaper,
    derivedFromOriginalNative3DCurveNotGeneratedHLRPaper:true,
    generated2DHLREdgeTopologyProven:false,
    completeGlobalCoProjectedVisibilityCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false});
  }
  ranges[klass]=intervals;
 }
 const nativePartition=auditC1Native3DSourceScopedIntervals({
  originalNativeParameterRange:[first,last],
  generatedNativeParameterRanges:[
   ...ranges['visible-sharp'],...ranges['hidden-sharp']]
 });
 const normalized=exactCandidateIntervalCoverage([0,1],
  segments.map(s=>s.originalM0UnitParameterRange));
 const nativeClassConflicts=exactCandidateVisibilityClassOverlap(
  segments.filter(s=>s.native3DHLRClass==='visible-sharp')
   .map(s=>s.originalM0UnitParameterRange),
  segments.filter(s=>s.native3DHLRClass==='hidden-sharp')
   .map(s=>s.originalM0UnitParameterRange)
 );
 return freeze({
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1',
  sourceGeometryId:geometry.id,revision,view,sourceEdgeId,
  original3DSourceCurveDirection:forward?'forward':'reversed',
  native3DSourceParameterPartitionCompleteExactlyOnce:
   nativePartition.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,
  // A positive native one-ULP gap can disappear when two distinct
  // OCCT parameters round to the SAME binary64 M0 fraction. Never
  // promote the rounded [0,1] union to a complete M4 source witness
  // unless the ORIGINAL native parameter partition is also complete.
  M4OriginalUnitIntervalCandidateCoverageComplete:
   nativePartition.sourceScopedNative3DParameterInventoryCompleteExactlyOnce&&
   normalized.entireOriginalParameterIntervalCovered,
  M4OriginalUnitIntervalCandidatePositiveGaps:
   normalized.positiveLengthUncoveredIntervals,
  native3DOriginalParameterPositiveGaps:
   nativePartition.positiveLengthUncoveredNativeParameterIntervals,
  native3DOriginalParameterPositiveOverlaps:
   nativePartition.positiveLengthOverlappingNativeParameterIntervals,
  M4OriginalUnitIntervalNativeClassConflicts:
   nativeClassConflicts.paperDerivedPositiveLengthVisibleHiddenConflictIntervals,
  segments,
  native3DProvenanceIsNotGenerated2DHLREdgeIdentity:true,
  completeGlobalVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  officialV5Authorized:false
 });
}
module.exports={projectC1Native3DSourceIntervalsToM4};
