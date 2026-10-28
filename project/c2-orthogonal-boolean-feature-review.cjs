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
module.exports={reviewC2OrthogonalBooleanFeatures};
