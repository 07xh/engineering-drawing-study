'use strict';
/**
 * C2 is an evidence consumer of the EXISTING M0/M5 orthogonal Boolean
 * kernels. This adapter does NOT compute union geometry or sign V5 strokes.
 *
 * Original source edges and newly generated face-intersection features
 * retain separate identities and require exact physical 3D endpoint proof.
 * An OPEN union feature is not sufficient to issue a drawing line style.
 */
const {boxFromConfirmedConvexMesh}=
 require('../core/geometry/reviewed-box-contact-evidence.cjs');
const {auditOrthogonalUnionSourceEdges}=
 require('../workbench/m5-orthogonal-union-source-edges.cjs');
const {proveGeneratedOrthogonalUnionCreases}=
 require('../workbench/m5-generated-orthogonal-union-creases.cjs');
const {auditUnionPhysicalFeatureJunctions}=
 require('../workbench/m5-union-physical-feature-junctions.cjs');
const {inspectUnionDirectionalJunctions}=
 require('../workbench/m5-union-directional-junctions.cjs');
const {createReviewedC2BooleanEndpointNeighborhood}=
 require('../workbench/m5-c2-boolean-endpoint-octant-neighborhood.cjs');
const {auditOrthogonalProjectedUnionSilhouette}=
 require('../workbench/m5-orthogonal-projected-union-silhouette.cjs');
const {auditOrthogonalProjectedBoundaryTopology}=
 require('../workbench/m5-orthogonal-projected-boundary-topology.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../workbench/m5-final-source-stroke-obligations.cjs');
const {reviewC2BoundaryPhysicalJunctions}=
 require('./c2-boundary-physical-junction-review.cjs');
const {exactCandidateIntervalCoverage}=
 require('../workbench/c1-original-source-interval-coverage.cjs');
function reviewC2OrthogonalBooleanFeatures({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
   !Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('C2 当前来源及双实体审计修订必须有效');
 // For all other accepted geometry kinds retain the original limited
 // workbench proof; never label a generic mesh as an orthogonal cuboid.
 if(geometry.some(g=>!g||g.kind!=='mesh'||g.space!=='model-3d'||
   g.unit!=='mm'||!boxFromConfirmedConvexMesh(g)))return null;
 const ids=geometry.map(g=>g.id);
 if(new Set(ids).size!==ids.length)
  throw new TypeError('C2 原始实体来源编号重复');
 const source=auditOrthogonalUnionSourceEdges({geometry,revision});
 const generated=proveGeneratedOrthogonalUnionCreases({geometry,revision});
 const physical=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const directional=inspectUnionDirectionalJunctions({
  geometry,revision,physicalJunctionEvidence:physical
 });
 // Exact independent 3D point/cap neighborhood and 2D projected REGION
 // loop topology. Neither may promote a stroke, regardless of local truth.
 const octantScene=createReviewedC2BooleanEndpointNeighborhood({
  geometry,revision
 });
 const projectedRegion=auditOrthogonalProjectedUnionSilhouette({
  geometry,revision
 });
 const projectedLoops=auditOrthogonalProjectedBoundaryTopology({
  geometry,revision,projectedUnionSilhouetteEvidence:projectedRegion
 });
 const nodeByPoint=new Map(physical.nodes.map(n=>
  [['x','y','z'].map(k=>n.point3D[k]).join('|'),n]));
 const endpointRows=[];
 for(const segment of physical.segments){
  for(const endpointRole of ['from','to']){
   const point=endpointRole==='from'?
    segment.source3DFrom:segment.source3DTo;
   const toward=endpointRole==='from'?
    segment.source3DTo:segment.source3DFrom;
   const identity=['x','y','z'].map(k=>point[k]).join('|');
   const node=nodeByPoint.get(identity);
   if(!node||!node.incidences.some(i=>
     i.segmentId===segment.id&&i.endpointRole===endpointRole))
    throw new Error('C2 原始与生成棱的三维端点来源对应中断');
   const local=octantScene.inspect(point,toward);
   if(local.revision!==revision||
      local.status!=='scoped-closed-3d-boolean-local-neighborhood'||
      local.outgoingSourceAxis!==segment.sourceAxis||
      local.closedEndpointCompleteEngineeringLinecapVerified!==false||
      local.allOtherBodyProjectedOcclusionTransitionsVerified!==false||
      local.signedV5LineActions!==0||
      local.v5Ready!==false)
    throw new Error('C2 端点八象限结果与当前源棱不一致');
   endpointRows.push(Object.freeze({
    sourceSegmentId:segment.id,endpointRole,nodeId:node.id,
    sourceFeatureKind:segment.kind,
    localBoundaryWitness:local,
    localBoundaryWithOutgoingSourceVerified:
     local.localClosedUnionBoundaryWithOutgoingSourceVerified
   }));
  }
 }
 const completeEndpointCount=endpointRows.filter(e=>
  e.localBoundaryWithOutgoingSourceVerified).length;
 const originalOpen=source.edges.flatMap(e=>e.subintervals).filter(s=>
  s.positiveUnionExternalCreaseVerified===true).length;
 const generatedOpen=generated.segments.filter(s=>
  s.positiveNewConcaveUnionOpenFeatureVerified===true).length;
 const equalIds=x=>JSON.stringify(x)===JSON.stringify(ids);
 if([source,generated,physical,directional,octantScene,
     projectedRegion,projectedLoops].some(x=>
    x.revision!==revision||!equalIds(x.sourceGeometryIds))||
   source.status!=='source-orthogonal-union-open-sector-coverage'||
   generated.status!=='scoped-pairwise-new-perpendicular-face-open-features'||
   physical.status!=='source-recomputed-physical-3d-feature-incidence'||
   directional.status!=='local-source-direction-and-listed-node-depth-witness'||
   source.sourceEdgeCount!==geometry.reduce((n,g)=>n+g.data.edges.length,0)||
   generated.segmentCount!==generated.segments.length||
   generated.certifiedNewConcaveOpenCount!==generatedOpen||
   physical.sourceSegmentCount!==originalOpen||
   physical.generatedSegmentCount!==generatedOpen||
   physical.nodeCount!==physical.nodes.length||
   directional.nodeCount!==physical.nodeCount||
   octantScene.status!=='m0-reviewed-orthogonal-composite-boolean-neighborhood'||
   projectedRegion.status!=='complete-first-angle-orthogonal-projected-occupancy-boundary'||
   projectedLoops.status!=='first-angle-projected-occupancy-boundary-loop-incidence-audited'||
   projectedRegion.viewCount!==3||
   projectedLoops.viewCount!==3||
   projectedLoops.totalProjectedBoundarySegmentCount!==
    projectedRegion.projectedBoundarySegmentCount||
   projectedLoops.allReviewedProjectedRegionBoundarySegmentsAccountedFor!==true||
   projectedRegion.allProjectedOccupancyRegionBoundariesComplete!==true||
   projectedRegion.fullEngineeringDrawingLineStylesVerified!==false||
   projectedLoops.officialLineStylesVerified!==false||
   projectedLoops.signedV5LineActions!==0||
   projectedLoops.v5Ready!==false||
   endpointRows.length!==2*physical.segments.length||
   !physical.exactEndpointIncidenceVerified||
   !physical.originalAndGeneratedSourceEdgeKindsAccountedFor||
   !directional.allOriginalAndNewFeatureDirectedEndpointsCovered||
   !directional.listedNodesDepthOrderVerified||
   source.globalLineStylesVerified!==false||
   generated.officialLineStylesVerified!==false||
   physical.officialLineStylesVerified!==false||
   directional.officialLineStylesVerified!==false||
   source.v5Ready!==false||
   generated.generatedFeatureV5Ready!==false||
   physical.officialV5FeatureActionsSigned!==0||
   directional.signedV5LineActions!==0||
   directional.v5Ready!==false)
  throw new Error('C2 已确认原棱、布尔生成棱、3D 接点与正式线型资格不一致');
 return Object.freeze({
  schema:'draftai-c2-workbench-original-plus-generated-union-evidence/1',
  revision,sourceGeometryIds:Object.freeze([...ids]),
  source,generated,physical,directional,
  projectedRegion,projectedLoops,
  sourceEndpointOctants:Object.freeze(endpointRows),
  certifiedLocalEndpointCount:completeEndpointCount,
  unresolvedLocalEndpointCount:endpointRows.length-completeEndpointCount,
  originalOpenSourceIntervalCount:originalOpen,
  generatedOpenSourceIntervalCount:generatedOpen,
  officialDrawingLineStylesVerified:false,
  completeV5DrawingAuthorized:false
 });
}

/**
 * A FULL M0..M5 paper-source ledger consumer (not another ray solver).
 * Bounded to TWO confirmed axis-aligned convex solids. The existing final
 * stroke auditor reauthenticates all source transforms, 3D generated edges,
 * projected crossings/overlaps, independent opaque rays and endpoint joins.
 * Everything stays unsigned until its original final V5 gate becomes true.
 */
function reviewC2FullPaperStrokeReadiness({
 geometry,revision,sceneDepthEvidence,orthogonalBooleanFeatureAudit
}={}){
 if(orthogonalBooleanFeatureAudit===null||geometry?.length!==2)return null;
 const baseline=orthogonalBooleanFeatureAudit;
 if(!baseline||baseline.revision!==revision||
    baseline.schema!=='draftai-c2-workbench-original-plus-generated-union-evidence/1')
  throw new Error('C2 当前三维原始及生成棱证据尚未核对');
 const full=inspectFinalSourceStrokeObligations({
  geometry,revision,sceneDepthEvidence
 });
 const paper=full.unifiedPaperLineReadinessEvidence;
 const region=full.projectedUnionSilhouetteEvidence;
 const loops=full.projectedUnionBoundaryTopologyEvidence;
 const ids=geometry.map(g=>g.id);
 const idsEqual=a=>JSON.stringify(a)===JSON.stringify(ids);
 if(full.status!=='per-source-span-proof-obligations-audited'||
    full.revision!==revision||
    !paper||paper.status!=='per-paper-interval-final-stroke-proof-blockers'||
    !idsEqual(paper.sourceGeometryIds)||
    paper.paperIntervalCount!==paper.lines.length||
    !region||region.status!=='complete-first-angle-orthogonal-projected-occupancy-boundary'||
    !loops||loops.status!=='first-angle-projected-occupancy-boundary-loop-incidence-audited'||
    region.revision!==revision||loops.revision!==revision||
    !idsEqual(region.sourceGeometryIds)||!idsEqual(loops.sourceGeometryIds)||
    region.physical3DSourceReviewMode!=='full-independent-m0-to-m5-source-cross-audit'||
    loops.sourceReviewMode!=='full-independent-m0-to-m5-source-cross-audit'||
    region.projectedBoundarySegmentCount!==baseline.projectedRegion.projectedBoundarySegmentCount||
    loops.totalSimpleClosedBoundaryLoopCount!==baseline.projectedLoops.totalSimpleClosedBoundaryLoopCount||
    loops.totalProjectedHoleClosedLoopCount!==baseline.projectedLoops.totalProjectedHoleClosedLoopCount||
    paper.officialLineStylesVerified!==false||
    paper.v5Ready!==false||paper.signedV5LineActions!==0||
    full.signedCount!==0||full.officialLineStylesVerified!==false||
    full.v5Ready!==false)
  throw new Error('C2 全局纸面来源 M0-M5 与现有局部证明不一致');
 // A 2D silhouette boundary only receives a true ORIGINAL / GENERATED
 // 3D source-coverage label when the current full M5 deduplicated source
 // classes cover its ENTIRE projected positive interval. This never
 // asserts 3D frontmost visibility or a standard drawing line.
 const dedup=full.exactPhysicalDedupEvidence;
 if(dedup?.status!=='exact-current-original-generated-3d-physical-feature-classes'||
    dedup.revision!==revision||!idsEqual(dedup.sourceGeometryIds)||
    dedup.allReviewedSourceRecordsRetainedAndExactlyGrouped!==true||
    dedup.allFinalBooleanExteriorFeatureSourcesEnumerated!==false||
    dedup.officialLineStylesVerified!==false||dedup.v5Ready!==false)
  throw new Error('C2 完整纸面轮廓缺少当前三维物理来源清单');
 const sourceKeysByView=new Map(['V','H','W'].map(v=>[v,new Set(
  dedup.groups.filter(g=>g.view===v).flatMap(g=>
   g.physicalFeatureClasses.map(c=>c.key))
 )]));
 const sourceBoundaries=[],byView=[];
 // Independent complete region area/geometry must agree, not only COUNT.
 for(const view of ['V','H','W']){
  const a=baseline.projectedRegion.projectedViews.find(v=>v.view===view);
  const b=region.projectedViews.find(v=>v.view===view);
  const x=baseline.projectedLoops.projectedViews.find(v=>v.view===view);
  const y=loops.projectedViews.find(v=>v.view===view);
  const shape=v=>v.boundaries.map(z=>JSON.stringify([
   z.type,z.projectedFromModelMm,z.projectedToModelMm
  ])).sort();
  if(!a||!b||!x||!y||
     JSON.stringify(shape(a))!==JSON.stringify(shape(b))||
     a.completeProjectedUnionAreaMm2!==b.completeProjectedUnionAreaMm2||
     x.signedLoopAreasTotalMm2!==y.signedLoopAreasTotalMm2||
     x.sourceBoundarySegmentCount!==y.sourceBoundarySegmentCount)
   throw new Error('C2 原生三视图区域与全局纸面线条来源不一致：'+view);
  const sourceByExactBoundary=new Map();
  const fingerprint=z=>JSON.stringify([
   z.type,z.projectedFromModelMm,z.projectedToModelMm
  ]);
  for(const item of b.boundaries){
   const key=fingerprint(item);
   if(sourceByExactBoundary.has(key))
    throw new Error('C2 当前投影区域出现重复来源边界');
   sourceByExactBoundary.set(key,item);
  }
  const start=sourceBoundaries.length;
  for(const origin of a.boundaries){
   const candidate=sourceByExactBoundary.get(fingerprint(origin));
   if(!candidate||candidate.view!==view||
      candidate.exactOpenCellOppositeOccupancyVerified!==true||
      candidate.projectedEngineeringSolidDashedStyle!=='undetermined'||
      candidate.canonicalIntentDAGAndV5Approved!==false||
      candidate.whole3DBooleanFeatureProvenanceAndOcclusionVerified!==false||
      !Array.isArray(candidate.matchingReviewedPhysicalSourceClassKeys)||
      candidate.matchingReviewedPhysicalSourceClassKeys.some(key=>
       !sourceKeysByView.get(view).has(key))||
      (candidate.originalOrGeneratedProjectedPhysicalSourceCoverageVerified===true&&
       candidate.matchingReviewedPhysicalSourceClassKeys.length===0))
    throw new Error('C2 来源区间不可与实际三维物理特征身份匹配：'+view);
   sourceBoundaries.push(Object.freeze({
    id:origin.id,view,kind:origin.type,revision,
    from:Object.freeze({...origin.projectedFromModelMm}),
    to:Object.freeze({...origin.projectedToModelMm}),
    completeProjectedPhysicalSourceCoverage:
     candidate.originalOrGeneratedProjectedPhysicalSourceCoverageVerified===true,
    physical3DSourceClassKeys:Object.freeze([
     ...candidate.matchingReviewedPhysicalSourceClassKeys
    ]),
    globalContinuousOcclusionProven:false,
    officialEngineeringLineStyle:'undetermined',
    officialV5Approved:false
   }));
  }
  const viewBoundaries=sourceBoundaries.slice(start);
  if(viewBoundaries.length!==b.boundaries.length)
   throw new Error('C2 三视图物理边界来源记录未闭合');
  byView.push(Object.freeze({
   view,regionBoundaryCount:viewBoundaries.length,
   sourceCovered:viewBoundaries.filter(z=>
    z.completeProjectedPhysicalSourceCoverage).length,
   sourceIncomplete:viewBoundaries.filter(z=>
    !z.completeProjectedPhysicalSourceCoverage).length,
   projectedAreaMm2:b.completeProjectedUnionAreaMm2
  }));
 }
 const matched=sourceBoundaries.filter(z=>
  z.completeProjectedPhysicalSourceCoverage).length;
 if(sourceBoundaries.length!==region.projectedBoundarySegmentCount||
    sourceBoundaries.length-matched!==
     region.sourceUncoveredProjectedBoundarySegmentCount||
    byView.some(x=>x.sourceCovered+x.sourceIncomplete!==x.regionBoundaryCount))
  throw new Error('C2 三维物理来源与整张闭合图纸的边界证据数不守恒');
 const sourceSubspanRows=(full.unifiedPaperSourceIdentityEvidence?.groups||[])
  .flatMap(group=>group.sourceSubspans.map(source=>({...source,view:group.view})));
 const sourceSubspanById=new Map(sourceSubspanRows.map(source=>
  [source.sourceSubspanId,source]));
 const same3Exact=(a,b)=>!!a&&!!b&&['x','y','z'].every(k=>
  Number.isFinite(a[k])&&Number.isFinite(b[k])&&a[k]===b[k]);
 if(sourceSubspanById.size!==sourceSubspanRows.length)
  throw new Error('C2 M5 纸面来源子段身份重复');
 const entries=paper.lines.map(line=>{
  if(line.revision!==revision||!['V','H','W'].includes(line.view)||
     ![line.projectedFromModelMm?.u,line.projectedFromModelMm?.v,
       line.projectedToModelMm?.u,line.projectedToModelMm?.v].every(Number.isFinite)||
     !['scoped-continuous-front-ray-clear',
       'scoped-continuous-front-ray-opaque',
       'no-unique-3d-source','undetermined'].includes(line.rayStatus)||
     line.officialEngineeringSolidDashedStyle!=='undetermined'||
     line.formalV5StrokeSigned!==false||
     line.positiveGlobalFinalContourCompletenessVerified!==false||
     line.fullClosedEndpointAndAllOpaqueFacesVerified!==false||
     !Array.isArray(line.missingProofObligations)||
     line.missingProofObligations.length<5)
   throw new Error('C2 一条纸面候选线绕过了端点或官方 V5 门禁');
  const sourceSubspanId=line.selectedListed3DSourceSubspanId??null;
  const selectedSource=sourceSubspanId===null?null:
   sourceSubspanById.get(sourceSubspanId);
  if(sourceSubspanId!==null&&(!selectedSource||
     selectedSource.view!==line.view||
     selectedSource.sourceSubspanId!==sourceSubspanId||
     !Array.isArray(line.physical3DEndpointIncidence)||
     line.physical3DEndpointIncidence.length!==2||
     !same3Exact(line.physical3DEndpointIncidence[0].physicalSource3DPoint,
      selectedSource.from3D)||
     !same3Exact(line.physical3DEndpointIncidence[1].physicalSource3DPoint,
      selectedSource.to3D)))
   throw new Error('C2 M5 纸面候选未绑定同一修订的真实三维来源子段');
  return Object.freeze({
   id:line.id,view:line.view,revision,
   from:Object.freeze({...line.projectedFromModelMm}),
   to:Object.freeze({...line.projectedToModelMm}),
   sourceSubspanId,
   sourceFeatureId:selectedSource?.originalSourceFeatureId??null,
   sourceFeatureKind:selectedSource?.kind??null,
   sourceGeometryIds:Object.freeze([...(selectedSource?.sourceGeometryIds||[])]),
   source3DFrom:selectedSource?Object.freeze({...selectedSource.from3D}):null,
   source3DTo:selectedSource?Object.freeze({...selectedSource.to3D}):null,
   sourceMultiplicity:line.sourceMultiplicity,
   rayStatus:line.rayStatus,
   threeDBooleanExteriorOpenSourceVerified:
    line.selectedWholeSource3DBooleanExteriorOpenFeatureVerified,
   localPhysicalEndpointBooleanAndRayJoinVerified:
    line.bothEndpointLocalBooleanAndOpaqueRayAndRealSourceJoinVerified,
   unresolvedObligations:Object.freeze([...line.missingProofObligations]),
   engineeringLineStyle:'undetermined',officialV5Approved:false
  });
 });

 /**
  * Associate each exact 2D occupancy boundary with existing M5 canonical
  * paper groups via their GENUINE physical 3D class key (not 2D coincidence).
  * Classify all open pieces cut at every paper event, without midpoint RAY
  * sampling. Even clear/opaque WHOLE-OPEN-ray pieces do NOT license a GB
  * stroke: closed endpoints, global Boolean boundary and V5 stay blocked.
  */
 const paperById=new Map(paper.lines.map(x=>[x.paperGroupId,x]));
 const groupsById=new Map(dedup.groups.map(x=>[x.paperGroupId,x]));
 if(paperById.size!==paper.lines.length||
    groupsById.size!==dedup.groups.length||
    groupsById.size!==paperById.size)
  throw new Error('C2 原始及生成棱来源纸面 ID 不是一一对应');
 const boundaryRayEvidence=sourceBoundaries.map(boundary=>{
  const vertical=boundary.from.u===boundary.to.u;
  if(!vertical&&boundary.from.v!==boundary.to.v)
   throw new Error('C2 正交区域边界必须是水平或竖直线');
  const axis=vertical?'v':'u',other=vertical?'u':'v',
   length=boundary.to[axis]-boundary.from[axis];
  if(!(Math.abs(length)>0))throw new Error('C2 零长度投影外边界');
  const matchedClassKeys=new Set(boundary.physical3DSourceClassKeys);
  const candidates=[];
  for(const group of dedup.groups){
   if(group.view!==boundary.view||
      group.projectedFromModelMm[other]!==boundary.from[other]||
      group.projectedToModelMm[other]!==boundary.from[other])
    continue;
   const p=group.projectedFromModelMm,q=group.projectedToModelMm,
    start=(p[axis]-boundary.from[axis])/length,
    stop=(q[axis]-boundary.from[axis])/length,
    a=Math.max(0,Math.min(start,stop)),b=Math.min(1,Math.max(start,stop));
   if(!(b>a))continue;
   const line=paperById.get(group.paperGroupId);
   if(!line||line.revision!==revision||line.view!==boundary.view||
      line.projectedFromModelMm.u!==p.u||
      line.projectedFromModelMm.v!==p.v||
      line.projectedToModelMm.u!==q.u||
      line.projectedToModelMm.v!==q.v)
    throw new Error('C2 外边界射线与原始纸面来源端点不一致');
   const frontKey=group.closestListed3DPhysicalFeatureClassKey,
    physical=group.physicalFeatureClasses.find(x=>x.key===frontKey);
   const frontReal=frontKey!==null&&matchedClassKeys.has(frontKey)&&
    group.exactlyOneNearestPhysicalFeatureClassWithinListedSources===true&&
    !!physical&&physical.contributors.some(c=>
     c.sourceSubspanId===line.selectedListed3DSourceSubspanId);
   if(frontReal&&line.rayStatus==='no-unique-3d-source')
    throw new Error('C2 局部前方三维来源与原始 M5 射线矛盾');
   candidates.push(Object.freeze({fromT:a,toT:b,
    paperGroupId:group.paperGroupId,
    matching3DPhysicalSourceKey:frontReal?frontKey:null,
    status:frontReal?line.rayStatus:'unresolved-3d-source',
    sourceExteriorOpenVerified:frontReal&&
     line.selectedWholeSource3DBooleanExteriorOpenFeatureVerified===true,
    closedEndpointAndGlobalOcclusionCertified:false,
    officialEngineeringStyle:'undetermined'}));
  }
  const cuts=[0,1,...candidates.flatMap(x=>[x.fromT,x.toT])]
   .filter(x=>Number.isFinite(x)&&x>=0&&x<=1);
  cuts.sort((a,b)=>a-b);
  const unique=cuts.filter((x,i)=>i===0||x!==cuts[i-1]);
  const pieces=[];
  for(let i=1;i<unique.length;i++){
   const lo=unique[i-1],hi=unique[i];
   if(!(hi>lo))continue;
   // The exact event cut has a CONSTANT set of interval-source witnesses
   // throughout this OPEN paper piece; no new 3D ray evaluation is made.
   const inside=candidates.filter(x=>x.fromT<=lo&&x.toT>=hi),
    keys=[...new Set(inside.map(x=>x.matching3DPhysicalSourceKey)
      .filter(Boolean))];
   // Independently prove each exact OPEN piece: a source gap elsewhere on
   // the boundary cannot erase this piece's original 3D source/ray witness.
   const reason=inside.length===0?'missing-canonical-paper-source':
    keys.length!==1||inside.some(x=>
     x.matching3DPhysicalSourceKey!==keys[0])?
     'nonunique-or-unmatched-3d-source':
    inside.some(x=>x.sourceExteriorOpenVerified!==true)?
     'boolean-exterior-open-source-unproven':
    inside.some(x=>x.status!==inside[0].status)?
     'conflicting-local-open-ray-evidence':
    !['scoped-continuous-front-ray-clear',
      'scoped-continuous-front-ray-opaque'].includes(inside[0].status)?
     'continuous-open-ray-undetermined':null;
   const proved=reason===null;
   pieces.push(Object.freeze({
    fromT:lo,toT:hi,
    localWholeOpenRayStatus:proved?inside[0].status:'undetermined',
    sourceGroupIds:Object.freeze(inside.map(x=>x.paperGroupId).sort()),
    real3DSourceClassKeys:Object.freeze(keys.sort()),
    exactCurrentPhysicalSourceAndOpenRayCorroborated:proved,
    unprovenLocalSourceOrRayReason:reason,
    completeClosedEndpointAndGlobalVisibilityCertified:false,
    officialEngineeringLineStyle:'undetermined',officialV5Approved:false
   }));
  }
  const covered=exactCandidateIntervalCoverage([0,1],
   pieces.filter(x=>x.exactCurrentPhysicalSourceAndOpenRayCorroborated)
    .map(x=>[x.fromT,x.toT]));
  const unresolved=exactCandidateIntervalCoverage([0,1],
   pieces.filter(x=>!x.exactCurrentPhysicalSourceAndOpenRayCorroborated)
    .map(x=>[x.fromT,x.toT]));
  if(JSON.stringify(covered.positiveLengthUncoveredIntervals)!==
     JSON.stringify(unresolved.positiveLengthCoveredIntervals)||
     pieces.some(x=>x.exactCurrentPhysicalSourceAndOpenRayCorroborated===
       (x.unprovenLocalSourceOrRayReason!==null)))
   throw new Error('C2 精确开放参数缺口与三维来源/射线审计不一致');
  return Object.freeze({
   id:boundary.id,view:boundary.view,revision,
   paperPieces:Object.freeze(pieces),
   positiveLocalWholeOpenRayPieceCount:pieces.filter(x=>
    x.exactCurrentPhysicalSourceAndOpenRayCorroborated).length,
   unprovenLocalSourceOrRayPieceCount:pieces.filter(x=>
    !x.exactCurrentPhysicalSourceAndOpenRayCorroborated).length,
   locallyRayCorroboratedFullBoundary:covered.entireOriginalParameterIntervalCovered,
   exactUnprovenBoundaryRanges:Object.freeze(
    covered.positiveLengthUncoveredIntervals.map(x=>Object.freeze([...x]))),
   physicalSourceCoveredBeforeRayProof:
    boundary.completeProjectedPhysicalSourceCoverage,
   full3DBooleanOcclusionAndJunctionProof:false,
   officialEngineeringLineStyle:'undetermined',officialV5Approved:false
  });
 });
 const rayEvidenceCount=boundaryRayEvidence.reduce((n,b)=>n+b.paperPieces.length,0),
  corroborated=boundaryRayEvidence.reduce((n,b)=>n+
   b.positiveLocalWholeOpenRayPieceCount,0),
  unresolvedLocal=boundaryRayEvidence.reduce((n,b)=>n+
   b.unprovenLocalSourceOrRayPieceCount,0),
  fullyCorroborated=boundaryRayEvidence.filter(x=>
   x.locallyRayCorroboratedFullBoundary).length;
 if(boundaryRayEvidence.length!==sourceBoundaries.length||
    boundaryRayEvidence.some((x,i)=>x.id!==sourceBoundaries[i].id||
     x.view!==sourceBoundaries[i].view||
     x.paperPieces.length===0||
     x.paperPieces[0].fromT!==0||
     x.paperPieces.at(-1).toT!==1||
     x.paperPieces.some((p,k)=>
      k>0&&p.fromT!==x.paperPieces[k-1].toT))||
    fullyCorroborated>sourceBoundaries.filter(x=>
     x.completeProjectedPhysicalSourceCoverage).length||
    corroborated+unresolvedLocal!==rayEvidenceCount)
  throw new Error('C2 投影闭合边界局部 M5 射线证据未守恒');

 const projectedBoundaryJunctions=reviewC2BoundaryPhysicalJunctions({
  revision,sourceGeometryIds:ids,sourceBoundaries,boundaryRayEvidence,
  paperLines:paper.lines,physicalJunctionEvidence:baseline.physical
 });
 if(projectedBoundaryJunctions.paperJunctionCount<=0||
    projectedBoundaryJunctions.allRegionBoundaryEndpointsAccountedFor!==true||
    projectedBoundaryJunctions.globalClosedEndpointEngineeringLineStylesProven!==false||
    projectedBoundaryJunctions.officialV5Authorized!==false)
  throw new Error('C2 真实端点与 V/H/W 区域边界联合证明不一致');
 const counts={
  locallyClear:entries.filter(e=>
   e.rayStatus==='scoped-continuous-front-ray-clear').length,
  locallyOpaque:entries.filter(e=>
   e.rayStatus==='scoped-continuous-front-ray-opaque').length,
  unresolved:entries.filter(e=>!['scoped-continuous-front-ray-clear',
   'scoped-continuous-front-ray-opaque'].includes(e.rayStatus)).length,
  sourceExteriorOpen:entries.filter(e=>e.threeDBooleanExteriorOpenSourceVerified).length,
  locallyJointEndpoint:entries.filter(e=>e.localPhysicalEndpointBooleanAndRayJoinVerified).length
 };
 if(entries.length!==counts.locallyClear+counts.locallyOpaque+counts.unresolved||
    counts.locallyClear!==paper.scopedClearFrontRayCandidateCount||
    counts.locallyOpaque!==paper.scopedOpaqueFrontRayCandidateCount||
    counts.unresolved<0)
  throw new Error('C2 实体射线分类数量丢失或未闭合');
 return Object.freeze({
  schema:'draftai-c2-current-first-angle-source-open-ray-review/1',
  revision,sourceGeometryIds:Object.freeze([...ids]),
  paperIntervalCount:entries.length,
  entries:Object.freeze(entries),
  counts:Object.freeze(counts),
  sourceBoundaries:Object.freeze(sourceBoundaries),
  sourceBoundariesByView:Object.freeze(byView),
  sourceCoveredBoundaryCount:matched,
  sourceIncompleteBoundaryCount:sourceBoundaries.length-matched,
  boundaryRayEvidence:Object.freeze(boundaryRayEvidence),
  boundaryRayOpenPieceCount:rayEvidenceCount,
  boundaryRayCorroboratedPieceCount:corroborated,
  boundaryRayUnprovenPieceCount:unresolvedLocal,
  boundaryAllPiecesCorroboratedCount:fullyCorroborated,
  projectedBoundaryJunctions,
  fullSourceCrossAudit:true,
  officialDrawingLineStylesVerified:false,completeV5DrawingAuthorized:false
 });
}

module.exports={reviewC2OrthogonalBooleanFeatures,reviewC2FullPaperStrokeReadiness};
