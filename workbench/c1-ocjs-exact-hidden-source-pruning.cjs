'use strict';
/**
 * C1 real-HLR paper-candidate REFINEMENT. A projected CAD segment can be
 * collinear with several ORIGINAL 3D edges. This function can remove one
 * candidate only when an INDEPENDENT exact IEEE-754 dyadic support-face
 * theorem proves its ENTIRE ORIGINAL EDGE open observer ray lies strictly
 * INSIDE the reviewed closed convex solid: such an original edge cannot
 * itself generate a visible HLR stroke on that positive-length interval.
 *
 * The result is an ORIGINAL-SOURCE POSSIBILITY audit. It does NOT recover
 * OCCT TopoDS edge identity or certify standard line styles, endpoints,
 * whole-scene occlusion, ConstructionIntent, DAG or the only V5.
 *
 * The calling M5 consumer MUST supply actual locally recomputed OCJS HLR;
 * passing a caller-supplied stroke list is not independent proof.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {inwardProof}=require('../core/numeric/convex-incident-source-open-ray.cjs');
const {intervalCoverage,positiveCollinearOverlap}=
 require('./c1-ocjs-reviewed-solid-v5.cjs');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))freeze(v);
  Object.freeze(o);
 }return o;
};
const edgeId=(g,a,b)=>g.id+'::'+[a,b].sort().join('|');
function auditC1ExactHiddenProjectedCandidatePruning({
 geometry,revision,view,targetSourceEdgeId,
 fromModelMm,toModelMm,cadVisibleSegments,convexProof
}={}){
 if(!Number.isSafeInteger(revision)||revision<1||
    !VIEWS.includes(view)||
    !geometry||!geometry.id||
    !Array.isArray(cadVisibleSegments)||
    !fromModelMm||!toModelMm||
    ![fromModelMm.u,fromModelMm.v,toModelMm.u,toModelMm.v].
     every(Number.isFinite)||
    Math.hypot(fromModelMm.u-toModelMm.u,
     fromModelMm.v-toModelMm.v)<=1e-8)
  throw new TypeError('real C1 paper interval and first-angle reviewed source required');
 const independent=verifiedConvexMeshHalfspaces(geometry);
 if(independent.status!=='validated-closed-convex-mesh'||
    independent.sourceGeometryId!==geometry.id||
    (convexProof!==undefined&&
     JSON.stringify(convexProof)!==JSON.stringify(independent)))
  throw new RangeError('independently current closed convex source proof required');
 const original=new Map(geometry.data.edges.map(([a,b])=>[
  edgeId(geometry,a,b),[a,b]]));
 if(original.size!==geometry.data.edges.length||
    !original.has(targetSourceEdgeId))
  throw new RangeError('untrusted or missing original physical source edge');
 // Inspect ALL real CAD strokes on the same positive-length paper interval,
 // including strokes whose raw projected candidates omit the target source.
 // Partial overlaps are held for possible further M4 source subdivision.
 const overlapping=cadVisibleSegments.filter(s=>{
  if(s?.view!==view||
     !s.from||!s.to||
     !Array.isArray(s.projectedOriginalEdgeCandidates)||
     s.projectedOriginalEdgeCandidates.length===0||
     s.projectedOriginalEdgeCandidates.some(id=>!original.has(id)))
   throw new RangeError('CAD projected segment with unreviewed source ID');
  return positiveCollinearOverlap(
   fromModelMm,toModelMm,s.from,s.to);
 });
 const coverage=intervalCoverage(fromModelMm,toModelMm,
  overlapping.filter(s=>
   s.projectedOriginalEdgeCandidates.includes(targetSourceEdgeId)));
 const candidates=[...new Set(overlapping.flatMap(s=>
  s.projectedOriginalEdgeCandidates))].sort();
 const excluded=[],remaining=[];
 for(const id of candidates){
  if(id===targetSourceEdgeId){remaining.push(id);continue;}
  const certified=inwardProof({
   geometry,sourceVertexIds:original.get(id),view,
   convexProof:independent});
  if(certified.status==='certified-strictly-hidden-open-original-edge'&&
     certified.fullOriginalSourceOpenIntervalStrictlyHidden===true&&
     certified.v5Ready===false){
   excluded.push({sourceEdgeId:id,
    proofSchema:certified.schema,
    reason:'exact-all-original-support-faces-strict-inward-open-ray',
    originalWholeOpenSourceEdgeOccluded:true,
    originalEdgeEndpointsHiddenCertified:false});
  }else remaining.push(id);
 }
 const before=candidates.length,after=remaining.length;
 const narrowed=coverage&&before>1&&excluded.length>0;
 const unique=coverage&&after===1&&remaining[0]===targetSourceEdgeId;
 if(unique&&
    (!candidates.includes(targetSourceEdgeId)||
     remaining.some(id=>id!==targetSourceEdgeId)))
  throw new RangeError('untrusted CAD/M0 projected source narrowing');
 return freeze({
  schema:'draftai-c1-m5-exact-hidden-paper-source-pruning/1',
  sourceGeometryId:geometry.id,revision,view,
  targetSourceEdgeId,
  fromModelMm:{...fromModelMm},toModelMm:{...toModelMm},
  sourceTargetCoveredByRealCADProjectedSegments:coverage,
  originalPaperCandidateEdgeIds:candidates,
  strictlyInwardOccludedCandidateExclusions:excluded,
  unexcludedOriginalPaperCandidateEdgeIds:remaining,
  rawPaperCandidateMultiplicity:before,
  survivingPhysicalSourceCandidateMultiplicity:after,
  multipleCandidatesNarrowedByExactM0:narrowed,
  targetUniqueWithinOriginalPaperCandidatesByExactM0:unique,
  actualOCCTTopoDSEdgeIdentityRecovered:false,
  thirdPartySceneSolidsChecked:false,
  allEndpointsAndEngineeringStandardsCertified:false,
  officialEngineeringLineStyle:'undetermined',
  constructionIntentAuthorized:false,signedV5Action:false
 });
}
module.exports={auditC1ExactHiddenProjectedCandidatePruning};
