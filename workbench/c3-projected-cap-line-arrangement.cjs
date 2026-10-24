'use strict';
/**
 * Finite-C3 M5 consumer of the reusable per-view exact straight-source
 * projected arrangement. All line endpoints are recomputed from the
 * original 3D M4 incidence graph, NOT read from V5 SVG screen strokes.
 */
const {auditC3Merged3DSourceGraph}=
 require('./c3-merged-3d-source-graph.cjs');
const {auditC3CapBoundaryIncidence}=
 require('./c3-cap-boundary-incidence.cjs');
const {arrangeProjected3DSourceLines}=
 require('../core/projection/projected-source-line-arrangement.cjs');
const {VIEWS}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC3ProjectedCapLineArrangement({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current C3 source revision required');
 const source=auditC3Merged3DSourceGraph({input,revision});
 const blocked=reason=>freeze({
  schema:'draftai-c3-projected-cap-line-arrangement/1',
  revision,status:'not-covered',reason,
  views:{},true3DSourceCapEdgeCount:0,
  allProjectedCapLinesAccountedFor:false,
  completeC3ProjectedContourCertified:false,
  allCurveLineIntersectionsCertified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false
 });
 if(source.status!=='scoped-complete-3d-source-incidence'||
    source.allLateralBranchesAndCapSegmentsCovered!==true||
    !source.all3DPointIdentitiesUsed||
    source.finalV5CurveAuthorized!==false)
  return blocked('complete physical source incidence not established');
 const cap=auditC3CapBoundaryIncidence({input,revision});
 if(!['scoped-analytic-cap-junction-incidence',
      'undetermined-unmatched-lateral-cap-junction'].includes(cap.status)||
    cap.finalV5CurveAuthorized!==false)
  return blocked('source cap pair feature audit not covered');
 const vertices=new Map(source.vertices.map(v=>[v.id,v]));
 const actualSourceIds=new Set(cap.capSegments.map(s=>s.id));
 const segments=source.edges.filter(e=>e.kind==='line').map(e=>{
  if(!actualSourceIds.has(e.sourceId))throw new RangeError('unsourced cap edge');
  const from=vertices.get(e.fromVertexId),to=vertices.get(e.toVertexId);
  if(!from||!to||!e.sourceEndpointIncidenceVerified||
     e.officialLineStyle!=='undetermined')
   throw new RangeError('unverified source topology edge');
  return {id:e.id,sourceId:e.sourceId,
   from3D:from.point3D,to3D:to.point3D};
 });
 if(new Set(segments.map(s=>s.sourceId)).size!==actualSourceIds.size)
  throw new RangeError('finite cap projected arrangement lost a source feature');
 const scale=Math.max(1,input.zCylinder.radius,input.yCylinder.radius);
 const tol=1e-8*scale;
 const byView={};
 for(const view of VIEWS){
  const r=arrangeProjected3DSourceLines({view,segments,tolerance:tol});
  if(r.sourceEdgeCount!==segments.length||
     !r.allProjectedStraightSourceParametersCoveredExactlyOnce||
     r.finalV5StrokeAuthorized!==false||
     r.officialLineStylesVerified!==false)
   throw new RangeError('projected M4 source coverage or signed stroke conflict');
  byView[view]=r;
 }
 return freeze({schema:'draftai-c3-projected-cap-line-arrangement/1',
  revision,status:'scoped-source-cap-line-three-view-arrangement',
  views:byView,
  true3DSourceCapEdgeCount:segments.length,
  originalCapFeatureCount:cap.capSegments.length,
  projectedCrossingEventCount:VIEWS.reduce((n,v)=>
   n+byView[v].projectedEvents.filter(e=>
    e.kind==='transverse-projected-crossing').length,0),
  projectedOverlapPairCount:VIEWS.reduce((n,v)=>
   n+byView[v].projectedPositiveLengthOverlaps.length,0),
  projectedCollapsedPointCount:VIEWS.reduce((n,v)=>
   n+byView[v].projectedPointSourceCount,0),
  allProjectedCapLinesAccountedFor:VIEWS.every(v=>
   byView[v].allProjectedStraightSourceParametersCoveredExactlyOnce),
  original3DGraphUsedForPhysicalJoins:true,
  independentSourceDepthOrderingOnly:false,
  allCurveLineIntersectionsCertified:false,
  allProjectedCircularAndNoncircularCurvesCertified:false,
  completeC3ProjectedContourCertified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
}
module.exports={auditC3ProjectedCapLineArrangement};
