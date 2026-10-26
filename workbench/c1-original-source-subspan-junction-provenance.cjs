'use strict';
/**
 * C1 shared M4->M5 physical source-cut incidence. Recompute original M0
 * geometry and canonical M4 paper event partitions, then prove continuity
 * ONLY between adjacent parameter intervals on the SAME reviewed 3D edge.
 *
 * At an original source endpoint, original vertex identity is authentic.
 * An interior paper crossing or collinear overlap is NOT a physical cross-
 * source join, even when its two projected endpoints coincide exactly.
 * No nearest-point snapping and no new drawing/stroke/GB line signer.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {auditC1ReviewedProjectedSourceEventGraph}=
 require('./c1-reviewed-projected-source-event-graph.cjs');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))freeze(v);
  Object.freeze(o);
 }return o;
};
const finite=Number.isFinite;
const xyz=(a,b)=>a.x===b.x&&a.y===b.y&&a.z===b.z;
const close=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<=1e-7;
const samePaper=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v)<=1e-7;
const point=(a,b,t)=>({
 x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,
 z:a.z+(b.z-a.z)*t
});
/**
 * Positive M4 source-partition witness, not an HLR/M5 visibility or line-style
 * certificate. A count of subspans is insufficient: missing one cut interval
 * could otherwise be concealed by a duplicate or a non-adjacent subspan.
 * All comparisons are exact binary64, including one-ULP holes.
 */
function certifyCanonicalOriginalM4SourcePartition(cutParameters,spans,{
 collapsedProjection=false,original3DFrom,original3DTo,view
}={}){
 if(!Array.isArray(cutParameters)||cutParameters.length<2||
    !Array.isArray(spans)||spans.length>cutParameters.length-1||
    cutParameters[0]!==0||cutParameters.at(-1)!==1||
    cutParameters.some((t,i)=>!finite(t)||t<0||t>1||
     (i>0&&t<=cutParameters[i-1])))
  throw new RangeError('incomplete canonical original M4 source cut partition');
 // A 3D edge parallel to this view's observer direction projects to a
 // point. No paper LINE interval can be certified from this source.
 if(collapsedProjection){
  if(spans.length!==0)
   throw new RangeError('collapsed original source cannot have paper line subspans');
  return freeze({
   sourceParameterRange:[0,1],
   exactOriginalSourceParameterCoverage:
    exactCandidateIntervalCoverage([0,1],[]),
   collapsedOriginalSourceProjection:true,
   sourceOpenParameterCoverageNotRepresentableAsPaperLine:true,
   projectedTinyButPositiveOriginalSourceIntervalsHeld:[],
   everyCanonicalM4CutHasExactlyOneAdjacentSourceSubspan:false,
   entireOriginalM4SourceParameterPartitionPositivelyProven:false,
   generatedHLRSourceIdentityProven:false,
   continuousM5VisibilityProven:false,
   engineeringLineStyleSigned:false,signedV5Action:false
  });
 }
 const ranges=[],tinyHeld=[];let j=0;
 for(let i=0;i<cutParameters.length-1;i++){
  const a=cutParameters[i],b=cutParameters[i+1];
  const r=spans[j]?.originalParameterRange;
  if(Array.isArray(r)&&r.length===2&&r[0]===a&&r[1]===b){
   ranges.push([a,b]);j++;continue;
  }
  // M4 deliberately omits subspans whose *recomputed projected paper
  // length* is <= 1e-10 mm. This does NOT erase their positive ORIGINAL
  // 3D source parameter interval. Recompute the condition independently,
  // then explicitly hold that gap rather than tolerance-stitching it.
  if(!VIEWS.includes(view)||!original3DFrom||!original3DTo)
   throw new RangeError('M4 source subspan missing, duplicated, overlapping or reordered');
  const p=project(point(original3DFrom,original3DTo,a))[view],
   q=project(point(original3DFrom,original3DTo,b))[view];
  const length=Math.hypot(p.u-q.u,p.v-q.v);
  if(!finite(length)||length>1e-10)
   throw new RangeError('M4 source subspan missing, duplicated, overlapping or reordered');
  tinyHeld.push([a,b]);
 }
 if(j!==spans.length)
  throw new RangeError('M4 source subspan missing, duplicated, overlapping or reordered');
 const coverage=exactCandidateIntervalCoverage([0,1],ranges);
 // Even a 1-ULP positive gap remains unproven, including if its projected
 // length rounded to zero. This certificate never authorizes M5/GB/V5.
 const complete=coverage.entireOriginalParameterIntervalCovered&&
  coverage.positiveLengthCoveredIntervals.length===1&&
  coverage.positiveLengthCoveredIntervals[0][0]===0&&
  coverage.positiveLengthCoveredIntervals[0][1]===1;
 if(complete!== (tinyHeld.length===0))
  throw new RangeError('M4 source gap accounting contradicts exact interval union');
 return freeze({
  sourceParameterRange:[0,1],
  exactOriginalSourceParameterCoverage:coverage,
  collapsedOriginalSourceProjection:false,
  sourceOpenParameterCoverageNotRepresentableAsPaperLine:false,
  projectedTinyButPositiveOriginalSourceIntervalsHeld:tinyHeld,
  everyCanonicalM4CutHasExactlyOneAdjacentSourceSubspan:complete,
  entireOriginalM4SourceParameterPartitionPositivelyProven:complete,
  generatedHLRSourceIdentityProven:false,
  continuousM5VisibilityProven:false,
  engineeringLineStyleSigned:false,signedV5Action:false
 });
}
function auditC1OriginalSourceSubspanJunctions({
 geometry,revision,proofMode='m5-hull-required'
}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current reviewed original source revision required');
 const m0=verifiedConvexMeshHalfspaces(geometry);
 const graph=auditC1ReviewedProjectedSourceEventGraph({
  geometry,revision,proofMode
 });
 if(m0.sourceGeometryId!==geometry.id||
    graph.sourceGeometryId!==geometry.id||graph.revision!==revision||
    graph.signedV5ActionCount!==0||
    graph.sourceIntervalEngineeringLineStylesCertified!==false)
  throw new RangeError('M4 source cuts cannot approve engineering line');
 const originals=new Map();
 for(const [a,b] of geometry.data.edges){
  const id=geometry.id+'::'+[a,b].sort().join('|');
  if(originals.has(id))
   throw new TypeError('two reviewed original edges share one source ID');
  originals.set(id,{a,b,from:geometry.data.points[a],to:geometry.data.points[b]});
 }
 const rows=[],seenSourceViews=new Set(),counts={
  sourceEdgeViewCount:0,originalSourceSubspanCount:0,
  sharedOriginalSourceNeighborJoins:0,originalVertexEndpointWitnesses:0,
  authenticatedForeignOriginalVertexEncounters:0,
  paperOnlyForeignSourceEncounters:0,roundedDiagnosticEncountersHeld:0,
  uncertifiedOriginalSubspanJoins:0,
  exactFullOriginalSourceViewPartitionsProven:0,
  noncollapsedSourceViewPartitionsWithPositiveParameterGapsHeld:0,
  collapsedSourceViewPartitionsConservativelyHeld:0,
  signedV5Actions:0
 };
 for(const row of graph.rows){
  const origin=originals.get(row.sourceEdgeId);
  if(!origin||!VIEWS.includes(row.view)||
     row.sourceGeometryId!==geometry.id||
     row.signedV5ActionCount!==0||
     row.sourceOriginalVertexIds[0]!==origin.a||
     row.sourceOriginalVertexIds[1]!==origin.b)
   throw new RangeError('M4 edge, original model and source identity disagree');
  if(row.cutParameters[0]!==0||
     row.cutParameters.at(-1)!==1||
     row.cutParameters.some((t,i)=>!finite(t)||t<0||t>1||
      (i>0&&t<=row.cutParameters[i-1])))
   throw new RangeError('M4 original edge cut parameters are not ordered');
  const key=row.view+'@'+row.sourceEdgeId;
  if(seenSourceViews.has(key))
   throw new RangeError('duplicated M4 original source/view partition');
  seenSourceViews.add(key);
  const spans=row.spans;
  const partition=certifyCanonicalOriginalM4SourcePartition(
   row.cutParameters,spans,{
    collapsedProjection:row.collapsedProjection,
    original3DFrom:origin.from,original3DTo:origin.to,view:row.view
   });
  const details=[];
  for(let i=0;i<spans.length;i++){
   const s=spans[i],ts=s.originalParameterRange;
   if(s.sourceEdgeId!==row.sourceEdgeId||s.view!==row.view||
      s.sourceGeometryId!==geometry.id||
      s.signedV5Action!==false||s.engineeringLineStyle!=='undetermined'||
      !Array.isArray(ts)||ts.length!==2||
      !finite(ts[0])||!finite(ts[1])||ts[0]<0||ts[1]>1||
      ts[0]>=ts[1]||
      !row.cutParameters.includes(ts[0])||
      !row.cutParameters.includes(ts[1]))
    throw new RangeError('untrusted M4 original-source cut subspan');
   const expectedFrom=point(origin.from,origin.to,ts[0]),
    expectedTo=point(origin.from,origin.to,ts[1]);
   if(!xyz(expectedFrom,s.from3D)||!xyz(expectedTo,s.to3D)||
      !samePaper(project(expectedFrom)[row.view],s.fromModelMm)||
      !samePaper(project(expectedTo)[row.view],s.toModelMm))
    throw new RangeError('M4 source cut 3D and paper geometry disagreement');
   const endpoint=(t,kind)=>{
    const origId=t===0?origin.a:t===1?origin.b:null;
    const where=kind==='from'?s.from3D:s.to3D;
    if(origId!==null&&!close(where,geometry.data.points[origId]))
     throw new RangeError('source endpoint misidentified as original vertex');
    const encounters=row.encounters.filter(e=>e.sourceParameter===t);
    const physical=encounters.filter(e=>
      e.original3DPhysicalJunctionProven===true&&
      e.projectedOnlyUnresolved===false&&
      e.sourceParameterBoundaryRoundedForDiagnostic===false&&
      e.exactSharedOriginalVertexId===origId&&origId!==null);
    const paper=encounters.filter(e=>e.projectedOnlyUnresolved===true);
    const rounded=encounters.filter(e=>
      e.sourceParameterBoundaryRoundedForDiagnostic===true);
    if(encounters.some(e=>e.original3DPhysicalJunctionProven===true&&
       !physical.includes(e)))
     throw new RangeError('projected-only or rounded event forged physical junction');
    counts.authenticatedForeignOriginalVertexEncounters+=physical.length;
    counts.paperOnlyForeignSourceEncounters+=paper.length;
    counts.roundedDiagnosticEncountersHeld+=rounded.length;
    if(origId!==null)counts.originalVertexEndpointWitnesses++;
    return {
     originalSourceParameter:t,model3DPoint:{...where},
     originalVertexId:origId,
     originalEndpoint3DIdentityVerified:origId!==null,
     trueCrossSourceOriginalVertexIds:physical.map(e=>
      ({otherOriginalSourceEdgeId:e.otherSourceEdgeId,
       sameOriginalVertexId:origId})),
     paperOnlyOtherSourceEdgeIds:[...new Set(paper.map(e=>
      e.otherSourceEdgeId))].sort(),
     roundedPaperEventCrossSourceJoinHeld:rounded.length>0,
     anotherOriginalSource3DPointInferred:false,
     authorizedAsV5Junction:false
    };
   };
   const preceding=details.at(-1);
   let fromSameSourceNeighbor=false;
   if(preceding){
    const prior=spans[i-1];
    const joined=prior.originalParameterRange[1]===ts[0];
    if(joined){
     if(!xyz(prior.to3D,s.from3D)||
        !samePaper(prior.toModelMm,s.fromModelMm))
      throw new RangeError('adjacent source pieces do not share one exact 3D point');
     fromSameSourceNeighbor=true;
     counts.sharedOriginalSourceNeighborJoins++;
    }else if(prior.originalParameterRange[1]>ts[0]){
     throw new RangeError('overlapping original source intervals');
    }else counts.uncertifiedOriginalSubspanJoins++;
   }
   const start=endpoint(ts[0],'from'),end=endpoint(ts[1],'to');
   details.push({
    view:row.view,revision,sourceGeometryId:geometry.id,
    sourceEdgeId:row.sourceEdgeId,
    originalVertexIds:[origin.a,origin.b],
    sourceParameterRange:[...ts],
    fromModelMm:{...s.fromModelMm},toModelMm:{...s.toModelMm},
    from3D:{...s.from3D},to3D:{...s.to3D},
    fromEndpoint:start,toEndpoint:end,
    sameOriginalSource3DContinuityFromPriorPiece:fromSameSourceNeighbor,
    crossSourcePaperJunctionsCount:
     start.paperOnlyOtherSourceEdgeIds.length+
     end.paperOnlyOtherSourceEdgeIds.length,
    allOtherPhysicalSourceIntersectionsCertified:false,
    completeProjectedOcclusionCertified:false,
    officialEngineeringLineStyle:'undetermined',
    officialLineJoinAuthorized:false,signedV5Action:false
   });
   counts.originalSourceSubspanCount++;
  }
  rows.push({view:row.view,sourceGeometryId:geometry.id,
   sourceEdgeId:row.sourceEdgeId,sourceVertexIds:[origin.a,origin.b],
   collapsedProjection:row.collapsedProjection,spans:details,
   canonicalOriginalM4SourcePartition:partition,
   allCanonicalOriginalSourceParameterSubspansCovered:
    partition.entireOriginalM4SourceParameterPartitionPositivelyProven,
   allReal3DAndPaperSceneJunctionsCertified:false,
   signedV5ActionCount:0});
  counts.sourceEdgeViewCount++;
  if(row.collapsedProjection)
   counts.collapsedSourceViewPartitionsConservativelyHeld++;
  else if(partition.entireOriginalM4SourceParameterPartitionPositivelyProven)
   counts.exactFullOriginalSourceViewPartitionsProven++;
  else counts.noncollapsedSourceViewPartitionsWithPositiveParameterGapsHeld++;
 }
 // Cardinality alone cannot prove that every actual original edge appears
 // once in EACH first-angle view (V/H/W).
 for(const id of originals.keys())for(const view of VIEWS)
  if(!seenSourceViews.has(view+'@'+id))
   throw new RangeError('missing M4 original 3D source/view partition');
 if(counts.exactFullOriginalSourceViewPartitionsProven+
     counts.noncollapsedSourceViewPartitionsWithPositiveParameterGapsHeld+
     counts.collapsedSourceViewPartitionsConservativelyHeld!==
     originals.size*VIEWS.length||
    counts.originalSourceSubspanCount!==graph.partitionedSourceSubintervalCount||
    counts.sourceEdgeViewCount!==geometry.data.edges.length*3||
    counts.signedV5Actions!==0)
  throw new RangeError('missing or duplicated true original subspan');
 return freeze({
  schema:'draftai-c1-original-source-m4-3d-cut-junction-provenance/1',
  revision,sourceGeometryId:geometry.id,unit:'mm',
  graphProofMode:proofMode,
  m5OriginalContourAvailable:graph.originalM5ExteriorHullRecomputedAndAvailable,
  sourceEventGraphSchema:graph.schema,
  rows,counts,
  allNoncollapsedCanonicalM4SourcePartitionsPositivelyCovered:
   counts.noncollapsedSourceViewPartitionsWithPositiveParameterGapsHeld===0,
  allOriginalSourceViewsAccountedIncludingCollapsed:true,
  allCanonicalOriginalM4SourceParameterPartitionsPositivelyCovered:
   counts.collapsedSourceViewPartitionsConservativelyHeld===0&&
   counts.noncollapsedSourceViewPartitionsWithPositiveParameterGapsHeld===0,
  nativeHLRGeneratedSourceIdentityAndM5VisibilityStillUnproven:true,
  fullCrossSourceSceneJunctionsCertified:false,
  finalEngineeringLineStylesAuthorized:false,
  constructionIntentAuthorized:false,
  signedV5ActionCount:0,wholeSolidV5Ready:false
 });
}
module.exports={auditC1OriginalSourceSubspanJunctions,
 certifyCanonicalOriginalM4SourcePartition};
