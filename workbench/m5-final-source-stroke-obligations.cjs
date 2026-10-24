'use strict';
/**
 * One M5 PER-CANDIDATE FINAL STROKE evidence record for reviewed 3D meshes.
 *
 * Recompute source-traceable partition / projected 2D UNION / local frontmost
 * M5 contour / authentic source cutpoints / 3D vertex incidence.
 *
 * A visible ray is NOT a standard visible line, and a hidden ray is NOT an
 * automatically drawn dashed edge. Source topology, joint depth, line-style
 * standard, independently reconstructed M3 solve and canonical V5 ordering
 * remain separate global approval gates.
 *
 * An "evidence candidate" never becomes an approved ConstructionStep.
 */
const {partitionReviewedSourceEdges}=
 require('./scoped-projected-stroke-partition.cjs');
const {deriveProjectedCutEndpointTopology}=
 require('./reviewed-projected-cut-endpoint-topology.cjs');
const {correlateReviewedOpenContours}=
 require('./reviewed-frontmost-open-contours.cjs');
const {inspectSourceVertexIncidence}=
 require('./m5-source-vertex-incidence-audit.cjs');
const {auditReviewedConvexSourceCreases}=
 require('./m5-reviewed-convex-source-creases.cjs');
const {classifyMultiBodyProjectedUnion}=
 require('../core/verification/multibody-projected-union.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const y of Object.values(x))freeze(y);
 Object.freeze(x);
}return x;};
const d=(a,b)=>({u:a.u-b.u,v:a.v-b.v});
const dot=(a,b)=>a.u*b.u+a.v*b.v;
const cross=(a,b)=>a.u*b.v-a.v*b.u;
function coversProjectedSpan(from,to,candidates){
 const delta=d(to,from),squared=dot(delta,delta),len=Math.sqrt(squared);
 if(!Number.isFinite(len)||len<=1e-8)return false;
 const tol=Math.max(1e-9,len*1e-10),eps=tol/len,ranges=[];
 for(const item of candidates){
  const a=item.from,b=item.to;
  if(!a||!b)continue;
  const a0=d(a,from),b0=d(b,from);
  if(Math.abs(cross(delta,a0))>tol*len||
     Math.abs(cross(delta,b0))>tol*len)continue;
  const lo=Math.max(0,Math.min(dot(delta,a0)/squared,dot(delta,b0)/squared)),
    hi=Math.min(1,Math.max(dot(delta,a0)/squared,dot(delta,b0)/squared));
  if(hi-lo>eps)ranges.push([lo,hi]);
 }
 ranges.sort((a,b)=>a[0]-b[0]);
 let reach=0;
 for(const [a,b] of ranges){
  if(a>reach+eps)return false;
  reach=Math.max(reach,b);
  if(reach>=1-eps)return true;
 }
 return reach>=1-eps;
}
function inspectFinalSourceStrokeObligations({geometry,revision,sceneDepthEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current M5 candidate revision required');
 if(!Array.isArray(geometry)||!geometry.length||geometry.length>8)
  throw new TypeError('reviewed 3D mesh list required');
 const scene=sceneDepthEvidence;
 if(scene?.schema!=='draftai-reviewed-mesh-scene-ray-audit/1'||
    scene.revision!==revision||scene.status!=='scoped-face-probes-only'||
    scene.v5Ready!==false||scene.officialLineStylesVerified!==false)
  return freeze({schema:'draftai-m5-final-stroke-obligations/1',
   revision,status:'not-covered',spans:[],spanCount:0,
   positiveOuterCandidateCount:0,hiddenDepthCandidateCount:0,
   blockedCount:0,signedCount:0,officialLineStylesVerified:false,
   v5Ready:false});
 const partitions=partitionReviewedSourceEdges({
  geometry,revision,sceneDepthEvidence:scene});
 const cuts=deriveProjectedCutEndpointTopology({
  geometry,revision,sceneDepthEvidence:scene});
 const contours=correlateReviewedOpenContours({geometry,revision,
  sceneDepthEvidence:scene,projectedStrokePartitions:partitions});
 const incidence=inspectSourceVertexIncidence({
  geometry,revision,sceneDepthEvidence:scene});
 const union=classifyMultiBodyProjectedUnion({geometry,revision});
 if(JSON.stringify(partitions)!==JSON.stringify(scene.projectedStrokePartitions)||
    JSON.stringify(cuts)!==JSON.stringify(scene.projectedCutEndpointTopology)||
    JSON.stringify(contours)!==JSON.stringify(scene.frontmostOpenContours)||
    JSON.stringify(union)!==JSON.stringify(scene.projectedUnionOutlines)||
    cuts.status!=='source-projected-endpoint-scope-only'||
    incidence.status!=='source-3d-original-vertex-incidence-recomputed'||
    contours.status!=='scoped-frontmost-open-contour-evidence-only'||
    union.status!=='open-boundary-geometry-only')
  throw new TypeError('stale or unsupported complete M5 stroke-source evidence');
 if(cuts.cutEndpoints.length!==partitions.segments.length*2)
  throw new RangeError('M5 projected cutpoints do not cover every stroke');
 const sourceCreaseEvidence=geometry.map(g=>
  auditReviewedConvexSourceCreases({geometry:g,revision}));
 const creases=new Map(sourceCreaseEvidence.flatMap(e=>
  e.edges.map(x=>[x.sourceEdgeId,x])));
 if(creases.size!==sourceCreaseEvidence.reduce((n,e)=>n+e.sourceEdgeCount,0))
  throw new TypeError('multiple reviewed solids share an untrusted edge ID');
 const spans=[];
 for(const [index,span] of partitions.segments.entries()){
  if(!VIEWS.includes(span.view))throw new TypeError('invalid first-angle source view');
  const sourceCrease=creases.get(span.sourceEdgeId);
  if(!sourceCrease||sourceCrease.sourceGeometryId!==span.sourceGeometryId||
     sourceCrease.finalV5LineActionAuthorized!==false)
   throw new TypeError('source crease must be proven from the original M0 mesh');
  const first=cuts.cutEndpoints[index*2],last=cuts.cutEndpoints[index*2+1],
   pair=[first,last];
  if(pair.some((p,j)=>!p||p.sourceGeometryId!==span.sourceGeometryId||
     p.sourceEdgeId!==span.sourceEdgeId||p.view!==span.view||
     p.sourceParameter!==span.sourceParameterRange[j]||
     p.segmentEndpoint!==(j===0?'from':'to')))
   throw new TypeError('projected source endpoint identity changed');
  const from=project(span.fromModelMm)[span.view],
    to=project(span.toModelMm)[span.view];
  if(JSON.stringify(from)!==JSON.stringify(span.projectedFromModelMm)||
     JSON.stringify(to)!==JSON.stringify(span.projectedToModelMm))
   throw new RangeError('Geometry Scene and projected source span disagree');
  const namedOriginalVertices=pair.every(p=>
   p.source3DIncidenceVerified&&p.sourceVertexKey!==null);
  const bothPositive=pair.every(p=>
   p.status==='positive-original-vertex-ray-incidence'&&
   p.sourceOriginalPointRayVerified===true);
  const noUnresolvedPaperEvents=pair.every(p=>
   !p.screenDepthSeparated&&
   p.associatedEvents.every(e=>e.relation!=='collinear-overlap'&&
     e.relation!=='tangent'&&e.front!=='undetermined'));
  const junctions=pair.map(p=>incidence.groups.find(g=>
   g.sourceVertexKey===p.sourceVertexKey&&g.view===span.view));
  const authenticatedCorners=namedOriginalVertices&&junctions.every(j=>
   j&&j.originalSource3DIncidenceVerified&&
   j.allOriginalProjectedEdgeEndpointsMatched);
  const locallyUniqueCorners=authenticatedCorners&&junctions.every(j=>
   j.localPositiveProjectedEndpointCandidate);
  const outer=union.segments.filter(e=>
    e.sourceGeometryId===span.sourceGeometryId&&e.view===span.view&&
    e.status==='open-projected-union-boundary')
   .map(e=>({from:e.fromModelProjectionMm,to:e.toModelProjectionMm}));
  const entireOpenOuter=coversProjectedSpan(from,to,outer);
  const frontmost=[];
  for(const e of contours.entries){
   if(e.sourceGeometryId!==span.sourceGeometryId||e.view!==span.view)continue;
   for(const open of e.openSpans){
    if(open.status==='scoped-frontmost-visible-open-interval'&&
       open.frontmostSourceEdgeId===span.sourceEdgeId)
     frontmost.push({from:open.fromProjectedModelMm,to:open.toProjectedModelMm});
   }
  }
  const uniqueFrontmostOpenContour=coversProjectedSpan(from,to,frontmost);
  const positiveOpen=span.openInteriorVisibility==='visible'&&
   span.positiveClearanceSolidIds.length===geometry.length;
  const strictlyHidden=span.openInteriorVisibility==='hidden'&&
   span.occluderGeometryIds.length>0;
  const positiveOuter=sourceCrease.sourceIsPhysicalCreaseWithinSingleSolid&&
   positiveOpen&&entireOpenOuter&&
   uniqueFrontmostOpenContour&&bothPositive&&
   authenticatedCorners&&locallyUniqueCorners&&noUnresolvedPaperEvents;
  const hiddenCandidate=sourceCrease.sourceIsPhysicalCreaseWithinSingleSolid&&
   strictlyHidden&&namedOriginalVertices&&
   authenticatedCorners&&noUnresolvedPaperEvents;
  const needs=[];
  if(!positiveOpen&&!strictlyHidden)needs.push('continuous-positive-or-hidden-depth-proof');
  if(positiveOpen&&!entireOpenOuter)needs.push('2d-combined-projected-outer-boundary');
  if(positiveOpen&&!uniqueFrontmostOpenContour)needs.push('unique-frontmost-source-edge-open-contour');
  if(!namedOriginalVertices)needs.push('proven-original-3d-cutpoint-instead-of-paper-crossing');
  if(!bothPositive&&positiveOpen)needs.push('positive-both-original-endpoint-rays');
  if(!authenticatedCorners)needs.push('independent-original-source-corner-incidence');
  if(positiveOpen&&!locallyUniqueCorners)needs.push('unambiguous-source-corner-projection-and-all-incident-rays');
  if(!noUnresolvedPaperEvents)needs.push('paper-crossing-overlap-tangent-or-depth-transition');
  if(!sourceCrease.sourceIsPhysicalCreaseWithinSingleSolid)
   needs.push(sourceCrease.sourceIsCoplanarSubdivisionWithinSingleSolid?
    'source-edge-is-coplanar-mesh-subdivision-not-physical-crease':
    'unproven-single-solid-source-dihedral-feature-edge');
  // No complete 3D source feature-line claim and no official drawing convention
  // exists yet; these missing obligations MUST NOT be waived by source flags.
  needs.push('independent-m3-final-answer-geometry-and-feature-semantics');
  needs.push('all-incident-source-and-projected-stroke-closed-junctions');
  needs.push('global-multibody-depth-sorted-final-feature-contour');
  needs.push('applicable-engineering-standard-solid-dashed-complete-line');
  needs.push('signed-canonical-construction-order-and-single-v5-action');
  spans.push({index,revision,sourceGeometryId:span.sourceGeometryId,
   sourceEdgeId:span.sourceEdgeId,view:span.view,
   sourceParameterRange:[...span.sourceParameterRange],
   candidateStrokeId:'M5Candidate'+index,
   independentlyRecomputedSourceCrease:sourceCrease,
   singleSolidSourceDihedralFeatureVerified:
    sourceCrease.sourceIsPhysicalCreaseWithinSingleSolid,
   sourceMeshSubdivisionNotDrawnAsFeature:
    sourceCrease.sourceIsCoplanarSubdivisionWithinSingleSolid,
   compositeUnionFeatureSemanticsVerified:false,
   visibleOpenRayCertified:positiveOpen,
   strictlyOccludedOpenRayCertified:strictlyHidden,
   fullUnionOpenBoundaryCoverage:entireOpenOuter,
   uniqueFrontmostOpenContourCoverage:uniqueFrontmostOpenContour,
   original3DCutpointIncidenceVerified:authenticatedCorners,
   originalEndpointPositiveObserverRaysVerified:bothPositive,
   localProjectedSourceJunctionCandidatesVerified:locallyUniqueCorners,
   unresolvedProjectedIntersectionOrTangency:!noUnresolvedPaperEvents,
   missingProofs:needs,
   localPositiveOuterGeometryCandidate:positiveOuter,
   hiddenDepthEvidenceCandidate:hiddenCandidate,
   finalContourAndStandardLineStyleVerified:false,
   authorizedStyle:'undetermined',
   officialV5ActionReleaseApproved:false});
 }
 return freeze({schema:'draftai-m5-final-stroke-obligations/1',
  revision,status:'per-source-span-proof-obligations-audited',
  spanCount:spans.length,spans,
  sourceCreaseEvidence,
  sourceCreaseProofCount:sourceCreaseEvidence.reduce((n,e)=>
   n+e.certifiedSingleSolidCreaseCount,0),
  coplanarSubdivisionExcludedCount:sourceCreaseEvidence.reduce((n,e)=>
   n+e.provenCoplanarSubdivisionCount,0),
  originalSourceCutpointCount:cuts.cutEndpoints.length,
  positiveOuterCandidateCount:spans.filter(s=>s.localPositiveOuterGeometryCandidate).length,
  hiddenDepthCandidateCount:spans.filter(s=>s.hiddenDepthEvidenceCandidate).length,
  blockedCount:spans.length,signedCount:0,
  allFinalProjectedContourJunctionsVerified:false,
  completeMultiBodyDepthAndSourceFeaturesVerified:false,
  officialLineStylesVerified:false,v5Ready:false});
}
module.exports={inspectFinalSourceStrokeObligations};
