'use strict';
/**
 * C2/M5: certified planar TOPOLOGY of each complete projected occupancy
 * boundary produced by the reviewed orthogonal cuboid union kernel.
 *
 * A mathematical silhouette REGION is not yet a drawing STROKE. Derive a
 * single source-traceable endpoint graph from all original projected-cell
 * boundary segments; close and orient only 2-regular simple edge cycles.
 * A four-way projected point touch, 3D depth alias, overlapping source
 * feature, or missing physical source does not license an engineering join.
 *
 * Region topology/area are independent of the optional stronger M4/M5
 * original-and-generated 3D source audit. NEVER mint a standard line style,
 * ConstructionIntent, Step DAG or canonical V5 action here.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {auditOrthogonalProjectedUnionSilhouette}=
 require('./m5-orthogonal-projected-union-silhouette.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const y of Object.values(x))freeze(y);
 Object.freeze(x);
}return x;};
const clean=n=>Object.is(n,-0)?0:n;
const pointKey=p=>clean(p.u)+','+clean(p.v);
const cmp=(a,b)=>a.u-b.u||a.v-b.v;
const fail=s=>{throw new TypeError('M5 orthogonal projected boundary topology: '+s);};
function auditOrthogonalProjectedBoundaryTopology({geometry,revision,
 projectedStrokePartitions,generatedSubspanRayEvidence,
 unifiedProjectedFeatureEventEvidence,unifiedPaperSourceIdentityEvidence,
 exactPhysicalDedupEvidence,projectedUnionSilhouetteEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('current M0 source revision required');
 const auditArgs={geometry,revision,
  projectedStrokePartitions,generatedSubspanRayEvidence,
  unifiedProjectedFeatureEventEvidence,unifiedPaperSourceIdentityEvidence,
  exactPhysicalDedupEvidence};
 const current=auditOrthogonalProjectedUnionSilhouette(auditArgs);
 if(!projectedUnionSilhouetteEvidence||
    JSON.stringify(current)!==JSON.stringify(projectedUnionSilhouetteEvidence)||
    current.status!=='complete-first-angle-orthogonal-projected-occupancy-boundary'||
    current.signedV5LineActions!==0||
    current.fullEngineeringDrawingLineStylesVerified!==false)
  fail('stale, incomplete or forged M0 projected region evidence');
 const records=[];
 for(const view of current.projectedViews){
  if(!VIEWS.includes(view.view)||!view.completeProjectedOccupancyRegionBoundaryVerified)
   fail('missing certified V/H/W projected region');
  const nodes=new Map(),edges=new Map(),geometricEdgeKeys=new Set();
  const touch=(p)=>{
   const k=pointKey(p);
   if(!nodes.has(k))nodes.set(k,{
    key:k,point:{u:clean(p.u),v:clean(p.v)},edges:[]});
   return k;
  };
  for(const b of view.boundaries){
   if(b.view!==view.view||b.exactOpenCellOppositeOccupancyVerified!==true||
      b.projectedEngineeringSolidDashedStyle!=='undetermined'||
      b.canonicalIntentDAGAndV5Approved!==false)
    fail('unreviewed silhouette grid edge or signed V5');
   const a=b.projectedFromModelMm,c=b.projectedToModelMm;
   if(![a.u,a.v,c.u,c.v].every(Number.isFinite)||
      (a.u!==c.u&&a.v!==c.v)||
      (a.u===c.u&&a.v===c.v))
    fail('non-axial or degenerate projected boundary edge');
   const ka=touch(a),kb=touch(c);
   const semantic=[ka,kb].sort().join('=>');
   if(geometricEdgeKeys.has(semantic))
    fail('duplicate opposite-occupancy grid boundary segment');
   geometricEdgeKeys.add(semantic);
   if(edges.has(b.id))fail('repeated projected segment ID');
   edges.set(b.id,{id:b.id,fromKey:ka,toKey:kb,
    boundaryKind:b.type,source3DFeatureCoverage:
     b.originalOrGeneratedProjectedPhysicalSourceCoverageVerified,
    sourcePhysicalClassKeys:[...b.matchingReviewedPhysicalSourceClassKeys]});
   nodes.get(ka).edges.push(b.id);
   nodes.get(kb).edges.push(b.id);
  }
  if(nodes.size>2200||edges.size>2200)
   fail('projected source boundary graph exceeds safety budget');
  const sourceEdges=[...edges.keys()].sort();
  const nodesOut=[...nodes.values()].sort((a,b)=>cmp(a.point,b.point)).map(n=>{
   const kinds=new Set(n.edges.map(id=>edges.get(id).boundaryKind));
   return {id:n.key,view:view.view,projectedPointMm:{...n.point},
    incidentSourceBoundarySegmentIds:[...n.edges].sort(),
    degree:n.edges.length,
    local2RegularJoinCandidate:n.edges.length===2&&kinds.size===1,
    nonManifoldProjectedFourWayPointContact:n.edges.length>=4,
    projectedBoundaryKindTransitionUnresolved:kinds.size>1,
    exactGridBoundaryEndpointIncidenceVerified:true,
    real3DPhysicalEndpointAndOcclusionJoinVerified:false,
    officialEngineeringStrokeJunctionApproved:false};
  });
  const outNode=new Map(nodesOut.map(x=>[x.id,x]));
  const consumed=new Set(),components=[],cycles=[];
  for(const first of sourceEdges){
   if(consumed.has(first))continue;
   const work=[first],componentEdgeIds=new Set(),componentNodes=new Set();
   for(let t=0;t<work.length;t++){
    const eId=work[t];
    if(componentEdgeIds.has(eId))continue;
    const e=edges.get(eId);
    if(!e)fail('graph references an unknown boundary segment');
    componentEdgeIds.add(eId);
    for(const k of [e.fromKey,e.toKey]){
     componentNodes.add(k);
     for(const other of nodes.get(k).edges)
      if(!componentEdgeIds.has(other))work.push(other);
    }
   }
   for(const eid of componentEdgeIds){
    if(consumed.has(eid))fail('overlapping source boundary components');
    consumed.add(eid);
   }
   const edgesIn=[...componentEdgeIds].sort();
   const pointsIn=[...componentNodes].sort((a,b)=>
    cmp(nodes.get(a).point,nodes.get(b).point));
   const typeSet=new Set(edgesIn.map(id=>edges.get(id).boundaryKind));
   const allDegree2=pointsIn.every(k=>outNode.get(k).degree===2);
   const uniformType=typeSet.size===1;
   const degree4=pointsIn.filter(k=>outNode.get(k).degree>=4);
   let cycle=null;
   if(allDegree2&&uniformType&&edgesIn.length>=4){
    // In a connected 2-regular finite graph, every edge belongs to ONE
    // cycle. Choose a canonical start, then deterministic first neighbor.
    const start=pointsIn[0],incident=[...nodes.get(start).edges].
     sort((a,b)=>{
      const A=edges.get(a),B=edges.get(b);
      const pa=nodes.get(A.fromKey===start?A.toKey:A.fromKey).point,
       pb=nodes.get(B.fromKey===start?B.toKey:B.fromKey).point;
      return cmp(pa,pb);
     });
    let at=start,last=null,selected=incident[0];
    const orderedPoints=[start],orderedEdges=[],used=new Set();
    for(let t=0;t<=edgesIn.length;t++){
     if(used.has(selected))break;
     const edge=edges.get(selected);
     if(edge.fromKey!==at&&edge.toKey!==at)
      fail('nonincident certified cycle traversal');
     used.add(selected);
     orderedEdges.push(selected);
     const next=edge.fromKey===at?edge.toKey:edge.fromKey;
     orderedPoints.push(next);
     if(next===start)break;
     const nextEdges=nodes.get(next).edges.filter(id=>id!==selected);
     if(nextEdges.length!==1)fail('alleged 2-regular cycle is not 2-regular');
     last=selected;at=next;selected=nextEdges[0];
    }
    if(orderedPoints.at(-1)!==start||
       orderedEdges.length!==edgesIn.length||
       used.size!==edgesIn.length)
     fail('inconsistent 2-regular projected grid connected component');
    const list=orderedPoints.map(k=>nodes.get(k).point);
    let area2=0;
    for(let i=0;i<list.length-1;i++)
     area2+=list[i].u*list[i+1].v-list[i+1].u*list[i].v;
    const absArea=Math.abs(area2)/2;
    if(!(absArea>0)&&Number.isFinite(absArea))
     fail('degenerate zero-area closed orthogonal projected boundary cycle');
    if(!Number.isFinite(absArea))
     fail('nonfinite projected source boundary cycle area');
    const kind=[...typeSet][0];
    const desiredSign=kind==='exterior-projected-region-boundary'?1:-1;
    if(kind!=='exterior-projected-region-boundary'&&
       kind!=='bounded-hole-projected-region-boundary')
     fail('source grid boundary has an unknown exterior/hole kind');
    if(Math.sign(area2)!==desiredSign){
     orderedPoints.reverse();orderedEdges.reverse();
    }
    const signedAreaMm2=desiredSign*absArea;
    const coverage=edgesIn.every(id=>edges.get(id).source3DFeatureCoverage);
    cycle={id:'M5BoundaryCycle'+cycles.length,view:view.view,
     kind,orderedSourceBoundarySegmentIds:orderedEdges,
     orderedClosedProjectedPointKeys:orderedPoints,
     signedOrientedProjectedAreaMm2:signedAreaMm2,
     absoluteProjectedAreaMm2:absArea,
     orientedFilledProjectedUnionOnLeftVerified:true,
     closed2RegularSourceGridCycleVerified:true,
     entireCyclePhysical3DFeatureSourceCoverageVerified:coverage,
     completeReal3DSourceJunctionsAndOcclusionVerified:false,
     applicableEngineeringStrokeStyle:'undetermined',
     formalConstructionIntentDAGV5Signed:false};
    cycles.push(cycle);
   }
   components.push({
    id:'M5BoundaryComponent'+components.length,view:view.view,
    sourceBoundarySegmentIds:edgesIn,projectedVertexKeys:pointsIn,
    sourceSegmentCount:edgesIn.length,
    boundaryKinds:[...typeSet].sort(),
    everyProjectedEndpointDegree2:allDegree2,
    allEdgesHaveSingleExteriorOrHoleKind:uniformType,
    projectedNonManifoldPointContactCount:degree4.length,
    projectedNonManifoldPointKeys:degree4,
    closedSimpleGridCycleVerified:cycle!==null,
    closedCycleId:cycle?.id??null,
    physical3DJunctionContinuityVerified:false,
    officialLineStyleApproved:false});
  }
  if(consumed.size!==edges.size||components.reduce((n,x)=>
    n+x.sourceSegmentCount,0)!==edges.size)
   fail('a projected boundary source segment was omitted or duplicated');
  const continuous=components.every(x=>x.closedSimpleGridCycleVerified);
  const signedSum=cycles.reduce((sum,x)=>
   sum+x.signedOrientedProjectedAreaMm2,0);
  const maxArea=Math.max(1,Math.abs(view.completeProjectedUnionAreaMm2));
  const normalizedResidual=Math.abs(signedSum-view.completeProjectedUnionAreaMm2)/maxArea;
  const consistent=continuous&&normalizedResidual<=1e-10;
  records.push({view:view.view,revision,
   sourceProjectedUnionAreaMm2:view.completeProjectedUnionAreaMm2,
   signedLoopAreasTotalMm2:signedSum,
   normalizedUnionAreaLoopResidual:normalizedResidual,
   sourceBoundarySegmentCount:edges.size,vertexCount:nodesOut.length,
   exactProjectedBoundaryVertices:nodesOut,
   connectedBoundaryComponents:components,
   certifiedSimpleClosedBoundaryCycles:cycles,
   simpleClosedLoopCount:cycles.length,
   exteriorClosedLoopCount:cycles.filter(x=>
    x.kind==='exterior-projected-region-boundary').length,
   boundedHoleClosedLoopCount:cycles.filter(x=>
    x.kind==='bounded-hole-projected-region-boundary').length,
   unresolvedPointContactOrIncompleteCycleCount:components.filter(x=>
    !x.closedSimpleGridCycleVerified).length,
   fourWayProjectedPointContactVertexCount:nodesOut.filter(n=>
    n.nonManifoldProjectedFourWayPointContact).length,
   sourceBoundarySegmentLedgerComplete:true,
   allProjectedBoundaryComponentsAreSimpleCycles:continuous,
   projectedLoopAreaAndUnionOccupancyNumericallyConsistent:consistent,
   entire3DSourceFeatureAndJunctionTopologyVerified:false,
   officialEngineeringLineStylesVerified:false,signedV5LineActions:0});
 }
 const allClosed=records.length===VIEWS.length&&records.every(x=>
  x.allProjectedBoundaryComponentsAreSimpleCycles&&
  x.projectedLoopAreaAndUnionOccupancyNumericallyConsistent);
 return freeze({schema:'draftai-m5-orthogonal-projected-boundary-topology/1',
  revision,status:'first-angle-projected-occupancy-boundary-loop-incidence-audited',
  sourceGeometryIds:geometry.map(g=>g.id),
  sourceReviewMode:current.physical3DSourceReviewMode,
  projectedViews:records,viewCount:records.length,
  totalProjectedBoundarySegmentCount:records.reduce((n,v)=>
   n+v.sourceBoundarySegmentCount,0),
  totalSimpleClosedBoundaryLoopCount:records.reduce((n,v)=>
   n+v.simpleClosedLoopCount,0),
  totalExteriorClosedLoopCount:records.reduce((n,v)=>
   n+v.exteriorClosedLoopCount,0),
  totalProjectedHoleClosedLoopCount:records.reduce((n,v)=>
   n+v.boundedHoleClosedLoopCount,0),
  unresolvedNonManifoldOrOpenBoundaryComponentCount:records.reduce((n,v)=>
   n+v.unresolvedPointContactOrIncompleteCycleCount,0),
  totalFourWayProjectedPointContactCount:records.reduce((n,v)=>
   n+v.fourWayProjectedPointContactVertexCount,0),
  allReviewedProjectedRegionBoundarySegmentsAccountedFor:true,
  allProjectedBoundaryCyclesSimpleAndClosedVerified:allClosed,
  allPhysical3DSourceAndFullProjectedIntersectionsContinuouslyVerified:false,
  officialLineStylesVerified:false,signedV5LineActions:0,v5Ready:false});
}
module.exports={auditOrthogonalProjectedBoundaryTopology};
