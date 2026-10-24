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
const {auditOrthogonalUnionSourceEdges}=
 require('./m5-orthogonal-union-source-edges.cjs');
const {proveGeneratedOrthogonalUnionCreases}=
 require('./m5-generated-orthogonal-union-creases.cjs');
const {auditUnionPhysicalFeatureJunctions}=
 require('./m5-union-physical-feature-junctions.cjs');
const {auditGeneratedViewEndpointIncidence}=
 require('./m5-generated-view-endpoint-incidence.cjs');
const {inspectUnionDirectionalJunctions}=
 require('./m5-union-directional-junctions.cjs');
const {auditProjectedSourceOverlapDepth}=
 require('./m5-union-projected-overlap-depth.cjs');
const {auditGeneratedStrokeOverlapPartitions}=
 require('./m5-generated-stroke-overlap-partitions.cjs');
const {auditGeneratedOpenSubspanOpaqueRays}=
 require('./m5-generated-open-subspan-opaque-rays.cjs');
const {auditUnifiedProjectedFeatureEvents}=
 require('./m5-unified-projected-feature-events.cjs');
const {auditUnifiedPaperSourceIdentity}=
 require('./m5-unified-paper-source-identity.cjs');
const {auditUnifiedPaperJunctions}=
 require('./m5-unified-paper-junctions.cjs');
const {auditUnifiedPaperLineReadiness}=
 require('./m5-unified-paper-line-readiness.cjs');
const {auditExactPhysicalFeatureDedup}=
 require('./m5-exact-physical-feature-dedup.cjs');
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
 const sourceUnionFeatureEvidence=auditOrthogonalUnionSourceEdges({
  geometry,revision});
 // Genuine new union intersections have NO original source-edge ID.
 // They are intentionally separate from the M4 source-edge action list.
 // Promote neither their geometric existence nor their projected line
 // candidate to a final standard solid/dashed construction step.
 const generatedUnionCreaseEvidence=geometry.length>=2?
  proveGeneratedOrthogonalUnionCreases({geometry,revision}):null;
 const physicalFeatureJunctionEvidence=geometry.length>=2?
  auditUnionPhysicalFeatureJunctions({geometry,revision}):null;
 const projectedSourceOverlapDepthEvidence=geometry.length>=2&&
  physicalFeatureJunctionEvidence?.status===
   'source-recomputed-physical-3d-feature-incidence'?
  auditProjectedSourceOverlapDepth({geometry,revision,
   physicalJunctionEvidence:physicalFeatureJunctionEvidence}):null;
 if(projectedSourceOverlapDepthEvidence&&
    projectedSourceOverlapDepthEvidence.status===
     'full-analytic-listed-source-pair-overlap-depth'&&
    (projectedSourceOverlapDepthEvidence.signedV5LineActions!==0||
     projectedSourceOverlapDepthEvidence.officialLineStylesVerified!==false||
     projectedSourceOverlapDepthEvidence.v5Ready!==false))
  throw new TypeError('source overlap depth is not an official line approval');

 const directionalJunctionEvidence=geometry.length>=2&&
  physicalFeatureJunctionEvidence?.status===
   'source-recomputed-physical-3d-feature-incidence'?
  inspectUnionDirectionalJunctions({geometry,revision,
   physicalJunctionEvidence:physicalFeatureJunctionEvidence}):null;
 if(directionalJunctionEvidence&&
    (directionalJunctionEvidence.status!==
      'local-source-direction-and-listed-node-depth-witness'||
     directionalJunctionEvidence.nodeCount!==
      physicalFeatureJunctionEvidence.nodeCount||
     directionalJunctionEvidence.officialLineStylesVerified!==false||
     directionalJunctionEvidence.signedV5LineActions!==0||
     directionalJunctionEvidence.v5Ready!==false))
  throw new TypeError('untrusted or stale directional source junction gate');

 const generatedProjectedEndpointEvidence=geometry.length>=2&&
  physicalFeatureJunctionEvidence?.status===
   'source-recomputed-physical-3d-feature-incidence'?
  auditGeneratedViewEndpointIncidence({geometry,revision,
   projectedStrokePartitions:partitions,
   physicalJunctionEvidence:physicalFeatureJunctionEvidence}):null;
 if(generatedProjectedEndpointEvidence&&
    (generatedProjectedEndpointEvidence.signedV5LineActions!==0||
     generatedProjectedEndpointEvidence.officialLineStylesVerified!==false||
     generatedProjectedEndpointEvidence.candidateCount!==
      partitions.generatedProjectedCandidateCount))
  throw new TypeError('generated projected endpoints attempted to bypass formal V5 gate');
 const generatedOverlapPartitionEvidence=geometry.length>=2&&
   projectedSourceOverlapDepthEvidence?.status===
    'full-analytic-listed-source-pair-overlap-depth'&&
   generatedProjectedEndpointEvidence?.status===
    'source-bound-generated-3d-to-projected-endpoints'?
  auditGeneratedStrokeOverlapPartitions({geometry,revision,
   projectedStrokePartitions:partitions,
   physicalJunctionEvidence:physicalFeatureJunctionEvidence,
   projectedOverlapDepthEvidence:projectedSourceOverlapDepthEvidence,
   generatedProjectedEndpointEvidence}):null;
 if(generatedOverlapPartitionEvidence&&
    (generatedOverlapPartitionEvidence.status!==
      'source-generated-view-pair-overlap-open-partitions'||
     generatedOverlapPartitionEvidence.generatedM4CandidateCount!==
       partitions.generatedProjectedCandidateCount||
     generatedOverlapPartitionEvidence.officialLineStylesVerified!==false||
     generatedOverlapPartitionEvidence.signedV5LineActions!==0||
     generatedOverlapPartitionEvidence.v5Ready!==false))
  throw new TypeError('unapproved generated projected depth subspan V5 release');
 const generatedSubspanRayEvidence=generatedOverlapPartitionEvidence?.status===
  'source-generated-view-pair-overlap-open-partitions'?
  auditGeneratedOpenSubspanOpaqueRays({geometry,revision,
   projectedStrokePartitions:partitions,
   physicalJunctionEvidence:physicalFeatureJunctionEvidence,
   projectedOverlapDepthEvidence:projectedSourceOverlapDepthEvidence,
   generatedProjectedEndpointEvidence,
   generatedOverlapPartitionEvidence}):null;
 if(generatedSubspanRayEvidence&&
    (generatedSubspanRayEvidence.status!==
      'all-current-generated-open-subspan-source-rays-recomputed'||
     generatedSubspanRayEvidence.pieceCount!==
      generatedOverlapPartitionEvidence.openPieceCount||
     generatedSubspanRayEvidence.officialLineStylesVerified!==false||
     generatedSubspanRayEvidence.signedV5LineActions!==0||
     generatedSubspanRayEvidence.v5Ready!==false))
  throw new TypeError('unapproved generated subspan opacity proof attempting V5 release');
 // ONE shared candidate/event topology across authentic remaining original
 // creases and genuinely generated union face lines. It is a prerequisite
 // to, not a substitute for, global contour + standard line-style signoff.
 const unifiedProjectedFeatureEventEvidence=
  generatedSubspanRayEvidence?.status===
   'all-current-generated-open-subspan-source-rays-recomputed'?
  auditUnifiedProjectedFeatureEvents({geometry,revision,
   projectedStrokePartitions:partitions,
   generatedSubspanRayEvidence}):null;
 if(unifiedProjectedFeatureEventEvidence&&
    (unifiedProjectedFeatureEventEvidence.status!==
      'reviewed-original-and-generated-paper-event-candidates'||
     unifiedProjectedFeatureEventEvidence.officialLineStylesVerified!==false||
     unifiedProjectedFeatureEventEvidence.signedV5LineActions!==0||
     unifiedProjectedFeatureEventEvidence.v5Ready!==false))
  throw new TypeError('unified C2 feature candidates bypassed V5 line authority');
 const unifiedPaperSourceIdentityEvidence=
  unifiedProjectedFeatureEventEvidence?.status===
   'reviewed-original-and-generated-paper-event-candidates'?
  auditUnifiedPaperSourceIdentity({geometry,revision,
   projectedStrokePartitions:partitions,
   generatedSubspanRayEvidence,
   unifiedProjectedFeatureEventEvidence}):null;
 if(unifiedPaperSourceIdentityEvidence&&
    (unifiedPaperSourceIdentityEvidence.status!==
       'source-traced-canonical-projected-open-interval-registry'||
     unifiedPaperSourceIdentityEvidence.allCandidatePiecesRetained!==true||
     unifiedPaperSourceIdentityEvidence.officialLineStylesVerified!==false||
     unifiedPaperSourceIdentityEvidence.signedV5LineActions!==0||
     unifiedPaperSourceIdentityEvidence.v5Ready!==false))
  throw new TypeError('paper source identity is not a signed official V5 line');
 const unifiedPaperJunctionEvidence=
  unifiedPaperSourceIdentityEvidence?.status===
   'source-traced-canonical-projected-open-interval-registry'?
  auditUnifiedPaperJunctions({geometry,revision,
   projectedStrokePartitions:partitions,
   generatedSubspanRayEvidence,
   unifiedProjectedFeatureEventEvidence,
   unifiedPaperSourceIdentityEvidence}):null;
 if(unifiedPaperJunctionEvidence&&
    (unifiedPaperJunctionEvidence.status!==
      'real-source-reviewed-first-angle-paper-endpoint-incidence'||
     unifiedPaperJunctionEvidence.allSourceOpenLineEndpointIncidencesAccountedFor!==true||
     unifiedPaperJunctionEvidence.officialLineStylesVerified!==false||
     unifiedPaperJunctionEvidence.signedV5LineActions!==0||
     unifiedPaperJunctionEvidence.v5Ready!==false))
  throw new TypeError('unverified paper junction tried to release a V5 line');
 const unifiedPaperLineReadinessEvidence=
  unifiedPaperJunctionEvidence?.status===
   'real-source-reviewed-first-angle-paper-endpoint-incidence'?
  auditUnifiedPaperLineReadiness({geometry,revision,
   projectedStrokePartitions:partitions,
   generatedSubspanRayEvidence,
   unifiedProjectedFeatureEventEvidence,
   unifiedPaperSourceIdentityEvidence,
   unifiedPaperJunctionEvidence}):null;
 if(unifiedPaperLineReadinessEvidence&&
    (unifiedPaperLineReadinessEvidence.status!==
      'per-paper-interval-final-stroke-proof-blockers'||
     unifiedPaperLineReadinessEvidence.paperIntervalCount!==
      unifiedPaperSourceIdentityEvidence.paperIntervalCount||
     unifiedPaperLineReadinessEvidence.officialLineStylesVerified!==false||
     unifiedPaperLineReadinessEvidence.signedV5LineActions!==0||
     unifiedPaperLineReadinessEvidence.v5Ready!==false))
  throw new TypeError('unverified canonical paper line tried to release official V5 strokes');
 const exactPhysicalDedupEvidence=
  unifiedPaperLineReadinessEvidence?.status===
   'per-paper-interval-final-stroke-proof-blockers'?
  auditExactPhysicalFeatureDedup({geometry,revision,
   projectedStrokePartitions:partitions,
   generatedSubspanRayEvidence,
   unifiedProjectedFeatureEventEvidence,
   unifiedPaperSourceIdentityEvidence}):null;
 if(exactPhysicalDedupEvidence&&
    (exactPhysicalDedupEvidence.status!==
      'exact-current-original-generated-3d-physical-feature-classes'||
     exactPhysicalDedupEvidence.paperIntervalCount!==
      unifiedPaperSourceIdentityEvidence.paperIntervalCount||
     exactPhysicalDedupEvidence.allReviewedSourceRecordsRetainedAndExactlyGrouped!==true||
     exactPhysicalDedupEvidence.officialLineStylesVerified!==false||
     exactPhysicalDedupEvidence.signedV5LineActions!==0||
     exactPhysicalDedupEvidence.v5Ready!==false))
  throw new TypeError('unreviewed physical source dedup tried to release final V5 line');


 if(physicalFeatureJunctionEvidence?.status===
    'source-recomputed-physical-3d-feature-incidence'){
  if(physicalFeatureJunctionEvidence.officialV5FeatureActionsSigned!==0||
     physicalFeatureJunctionEvidence.wholeCompositionV5Ready!==false||
     physicalFeatureJunctionEvidence.allBoundaryJunctionsVerified!==false||
     physicalFeatureJunctionEvidence.generatedSegmentCount!==
      (generatedUnionCreaseEvidence?.certifiedNewConcaveOpenCount??0))
   throw new TypeError('newly generated physical endpoints bypassed M5 independent gate');
 }

 if(generatedUnionCreaseEvidence&&
    (generatedUnionCreaseEvidence.generatedFeatureV5Ready!==false||
     generatedUnionCreaseEvidence.officialLineStylesVerified!==false))
  throw new TypeError('generated union feature cannot bypass original M5 V5 gate');
 if(generatedUnionCreaseEvidence&&
    (JSON.stringify(partitions.generatedUnionCreaseEvidence)!==
       JSON.stringify(generatedUnionCreaseEvidence)||
     partitions.generatedStrokeSignedCount!==0||
     partitions.generatedSegments.length!==
       partitions.generatedProjectedCandidateCount||
     partitions.generatedSegments.some(s=>
       s.canonicalIntentAndV5LineStepApproved!==false||
       s.officialEngineeringLineStyle!=='undetermined')))
  throw new TypeError('M4 generated source-face projected actions were substituted or signed');

 const unionFeatureMap=new Map(sourceUnionFeatureEvidence.edges.map(e=>
  [e.sourceEdgeId,e]));
 // Only claim an entire M4 stroke piece if its source parameter interval is
 // COVERED continuously by a union-exterior source-crease classification.
 // Never infer a whole piece from its midpoint, even where another body
 // starts/ends partway along the real 3D source edge.
 function coveredByUnionClass(interval,items){
  const a=interval[0],b=interval[1];
  if(!(b>a))return false;
  const eps=Math.min(1e-10,(b-a)*1e-7);
  let end=a;
  for(const e of items.slice().sort((x,y)=>
    x.sourceParameterOpenRange[0]-y.sourceParameterOpenRange[0])){
   const [lo,hi]=e.sourceParameterOpenRange;
   if(lo>end+eps)return false;
   if(hi>end)end=hi;
   if(end>=b-eps)return true;
  }
  return end>=b-eps;
 }
 const spans=[];
 for(const [index,span] of partitions.segments.entries()){
  if(!VIEWS.includes(span.view))throw new TypeError('invalid first-angle source view');
  const sourceCrease=creases.get(span.sourceEdgeId);
  const unionEdge=unionFeatureMap.get(span.sourceEdgeId);
  const sourceUnionScoped=sourceUnionFeatureEvidence.status===
    'source-orthogonal-union-open-sector-coverage';
  if(sourceUnionScoped&&(!unionEdge||
      unionEdge.sourceGeometryId!==span.sourceGeometryId))
   throw new TypeError('source union-edge identity diverged from M0 mesh');
  const unionExternalOpen=sourceUnionScoped&&unionEdge?.subintervals?
   coveredByUnionClass(span.sourceParameterRange,
    unionEdge.subintervals.filter(x=>x.positiveUnionExternalCreaseVerified)):false;
  const unionBuriedOrFlat=sourceUnionScoped&&unionEdge?.subintervals?
   coveredByUnionClass(span.sourceParameterRange,
    unionEdge.subintervals.filter(x=>x.positiveUnionBuriedOrFlatVerified)):false;
  if(unionExternalOpen&&unionBuriedOrFlat)
   throw new RangeError('contradictory positive union feature and missing feature proof');

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
   (!sourceUnionScoped||unionExternalOpen)&&
   positiveOpen&&entireOpenOuter&&
   uniqueFrontmostOpenContour&&bothPositive&&
   authenticatedCorners&&locallyUniqueCorners&&noUnresolvedPaperEvents;
  const hiddenCandidate=sourceCrease.sourceIsPhysicalCreaseWithinSingleSolid&&
   (!sourceUnionScoped||unionExternalOpen)&&
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
  if(sourceUnionScoped&&!unionExternalOpen)
   needs.push(unionBuriedOrFlat?
    'source-crease-proven-flat-or-buried-in-composite-union':
    'union-exterior-crease-needs-complete-3d-parameter-splitting');
  if(!sourceUnionScoped&&geometry.length>1)
   needs.push('non-orthogonal-multibody-union-feature-outside-proven-scope');
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
   sourceUnionExteriorOpenIntervalVerified:unionExternalOpen,
   sourceUnionBuriedOrFlatOpenIntervalVerified:unionBuriedOrFlat,
   sourceUnionEdge:sourceUnionScoped?unionEdge:null,
   sourceUnionFeatureScope:sourceUnionFeatureEvidence.status,
   extraM4UnionAxialEventsRequired:sourceUnionScoped&&
     !unionExternalOpen&&!unionBuriedOrFlat,
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
  sourceCreaseEvidence,sourceUnionFeatureEvidence,
  generatedUnionCreaseEvidence,
  physicalFeatureJunctionEvidence,
  projectedSourceOverlapDepthEvidence,
  comparedProjectedSourceOverlapCount:
   projectedSourceOverlapDepthEvidence?.overlapCount??0,
  fullySortedProjectedSourceOverlapCount:
   projectedSourceOverlapDepthEvidence?.strictlyOrderedPairCount??0,
  coincidentDepthSourceFeaturePairCount:
   projectedSourceOverlapDepthEvidence?.identicalDepthPairCount??0,
  unresolvedProjectedSourcePairDepthCount:
   projectedSourceOverlapDepthEvidence?.ambiguousDepthCount??0,
  directionalJunctionEvidence,
  verifiedSourceOutgoingJunctionCount:
   directionalJunctionEvidence?.nodeCount??0,
  positiveLocalStraightSourceCandidateCount:
   directionalJunctionEvidence?.positiveStraightLocalPairCount??0,
  true3DCornerSourceCandidateCount:
   directionalJunctionEvidence?.cornerNodeCount??0,
  branchingSourceJunctionCount:
   directionalJunctionEvidence?.branchingNodeCount??0,
  projectedSourceNodeDepthAliasGroupCount:
   directionalJunctionEvidence?.projectedCoDepthAliasGroupCount??0,
  generatedProjectedEndpointEvidence,
  generatedOverlapPartitionEvidence,
  generatedSubspanRayEvidence,
  unifiedProjectedFeatureEventEvidence,
  unifiedPaperSourceIdentityEvidence,
  unifiedPaperJunctionEvidence,
  unifiedPaperLineReadinessEvidence,
  exactPhysicalDedupEvidence,
  exactDuplicate3DSourceRecords:
   exactPhysicalDedupEvidence?.exact3DDuplicateSourceRecordCount??0,
  exactDedupedPhysicalFeatureClasses:
   exactPhysicalDedupEvidence?.distinctPhysical3DFeatureClassCount??0,
  paperIntervalsWithMultiplePhysicalDepthSources:
   exactPhysicalDedupEvidence?.multi3DPhysicalClassPaperIntervalCount??0,
  paperIntervalsWithUniquelyFrontPhysicalClass:
   exactPhysicalDedupEvidence?.uniqueNearestListedPhysicalClassIntervalCount??0,

  paperStrokeScopedClearSourceCount:
   unifiedPaperLineReadinessEvidence?.scopedClearFrontRayCandidateCount??0,
  paperStrokeScopedOpaqueSourceCount:
   unifiedPaperLineReadinessEvidence?.scopedOpaqueFrontRayCandidateCount??0,
  paperStrokeNonuniqueSourceCount:
   unifiedPaperLineReadinessEvidence?.nonuniqueSourceGroupCount??0,
  paperStrokeDepthAliasEndpointCount:
   unifiedPaperLineReadinessEvidence?.depthAliasEndpointLineCount??0,

  unifiedPaperJunctionNodeCount:
   unifiedPaperJunctionEvidence?.nodeCount??0,
  unifiedPhysicalSourceCoincidentPaperJunctionCount:
   unifiedPaperJunctionEvidence?.physicallySharedEndpointNodeCount??0,
  unifiedPaperOnlyDifferent3DDepthJunctionCount:
   unifiedPaperJunctionEvidence?.paperOnlyDifferent3DDepthNodeCount??0,

  unifiedPaperIntervalCount:
   unifiedPaperSourceIdentityEvidence?.paperIntervalCount??0,
  unifiedCoProjectedMultipleSourceIntervalCount:
   unifiedPaperSourceIdentityEvidence?.coProjectedMultiSourceIntervalCount??0,
  unifiedPhysicallyDuplicatedSourceIntervalCount:
   unifiedPaperSourceIdentityEvidence?.physicallyDuplicatedSourceIntervalCount??0,
  unifiedLocallyFrontListedSourceIntervalCount:
   unifiedPaperSourceIdentityEvidence?.uniquelyFrontListedSourceIntervalCount??0,

  unifiedProjectedOriginalCandidateCount:
   unifiedProjectedFeatureEventEvidence?.originalSourceCandidateCount??0,
  unifiedProjectedGeneratedCandidateCount:
   unifiedProjectedFeatureEventEvidence?.generatedSourceCandidateCount??0,
  unifiedProjectedCrossingEventCount:
   unifiedProjectedFeatureEventEvidence?.properPaperCrossingCount??0,
  unifiedProjectedCollinearOverlapCount:
   unifiedProjectedFeatureEventEvidence?.positiveCollinearOverlapCount??0,
  unifiedProjectedEventSubspanCount:
   unifiedProjectedFeatureEventEvidence?.partitionedOpenSubspanCount??0,

  generatedSubspanWholeClearCount:
   generatedSubspanRayEvidence?.certifiedClearPieceCount??0,
  generatedSubspanStrictlyHiddenCount:
   generatedSubspanRayEvidence?.certifiedOccludedPieceCount??0,
  generatedSubspanRayUndeterminedCount:
   generatedSubspanRayEvidence?.undeterminedPieceCount??0,

  generatedOverlapSubspanCount:
   generatedOverlapPartitionEvidence?.openPieceCount??0,
  generatedOverlapDepthCriticalCutCount:
   generatedOverlapPartitionEvidence?.projectedCriticalEventCount??0,
  generatedOverlapLocallyAheadCount:
   generatedOverlapPartitionEvidence?.strictlyFrontRelativePieceCount??0,
  generatedOverlapLocallyBehindCount:
   generatedOverlapPartitionEvidence?.strictlyBehindRelativePieceCount??0,

  generated3DProjectedMatchedEndpointCount:
   generatedProjectedEndpointEvidence?.physicallyMatched3DEndpointCount??0,
  generated3DProjectedDepthAliasEndpointCount:
   generatedProjectedEndpointEvidence?.distinctDepthAliasEndpointCount??0,

  physicalFeatureJunctionCount:physicalFeatureJunctionEvidence?.nodeCount??0,
  physicalCrossSourceJunctionCandidateCount:
   physicalFeatureJunctionEvidence?.positiveLocalJunctionCandidateCount??0,
  physicalOriginalGeneratedJunctionCount:
   physicalFeatureJunctionEvidence?.nodes.filter(n=>
    n.incidentOriginalSourceCount>0&&n.incidentGeneratedSourceCount>0).length??0,
  fullyJoinedGeneratedStrokeCount:0,

  generatedSource3DOpenCandidateCount:
   generatedUnionCreaseEvidence?.certifiedNewConcaveOpenCount??0,
  generatedM4ProjectedCandidateCount:
   partitions.generatedProjectedCandidateCount,
  generatedM4ProjectionCollapseCount:
   partitions.generatedProjectedCollapsedCount,
  generatedM4ForwardRayClearCount:
   partitions.generatedSegments.filter(s=>
    s.wholeOpenSourceForwardRayClearVerified).length,
  generatedM4StrictlyOccludedCount:
   partitions.generatedSegments.filter(s=>
    s.wholeSourceStrictlyOccludedVerified).length,

  generatedSourceStrokeActionCount:0,
  generatedSourceStrokeSignedCount:0,

  locallyUnionExternalFeatureSpanCount:spans.filter(x=>
   x.sourceUnionExteriorOpenIntervalVerified).length,
  locallyUnionBuriedOrFlatSpanCount:spans.filter(x=>
   x.sourceUnionBuriedOrFlatOpenIntervalVerified).length,
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
