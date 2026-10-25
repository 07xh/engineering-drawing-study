'use strict';
/**
 * C1 M5: correlate every consecutive projected convex-contour interval
 * endpoint with its actual 3D physical source(s). Consume #708's existing
 * complete 2D boundary/source/ray ledger; DO NOT construct another hull,
 * infer a 3D solid from pixels, or sign line styles/ConstructionSteps.
 *
 * A single paper corner may have BOTH near and far real 3D vertices. A
 * paper coincidence alone does not prove that two strokes can join.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const value of Object.values(x))freeze(value);Object.freeze(x);
}return x;};
const d2=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
const d3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const near3=(a,b)=>d3(a,b)<=1e-7;
// M5 positive physical identity is exact on reviewed binary64 model points.
// 1e-7 mm only indicates numerical closeness; it cannot merge different
// 3D source points or certify their common construction endpoint.
function exactSameReviewedModelPoint(a,b){
 if(!a||!b||![a.x,a.y,a.z,b.x,b.y,b.z].every(Number.isFinite))
  throw new TypeError('finite reviewed 3D model-mm source points required');
 return a.x===b.x&&a.y===b.y&&a.z===b.z;
}
const dot3=(p,r)=>p.x*r.x+p.y*r.y+p.z*r.z;
const key=(g,a,b)=>g+'::'+[a,b].sort().join('|');

function auditC1ContourPhysicalJunctionIncidence({
 geometry,revision,contourCoverage
}={}){
 if(!Number.isSafeInteger(revision)||revision<1||
    geometry?.kind!=='mesh'||geometry.space!=='model-3d'||
    geometry.unit!=='mm'||typeof geometry.id!=='string')
  throw new TypeError('current reviewed convex 3D mm source required');
 const c=contourCoverage;
 if(c?.schema!=='draftai-c1-convex-contour-source-coverage/1'||
    c.revision!==revision||c.sourceGeometryId!==geometry.id||
    c.status!=='scoped-convex-hull-physical-source-coverage'||
    !c.completeProjectedConvexBoundaryGeometryVerified||
    !c.fullPhysicalSourceContourCoverageVerified||
    c.officialLineStylesVerified!==false||c.completeSolidV5Ready!==false||
    !Object.isFrozen(c))
  throw new TypeError('C1 original complete convex contour source proof required');
 const led=c.edgeLedger;
 if(led?.revision!==revision||led.sourceGeometryId!==geometry.id||
    led.status!=='scoped-full-original-source-edge-ray-evidence'||
    led.officialLineStylesVerified!==false||led.signedEdgeV5Ready!==false)
  throw new TypeError('current unsigned M5 original source-edge rays required');
 const edgeMap=new Map();
 for(const [a,b] of geometry.data.edges){
  const id=key(geometry.id,a,b);
  if(edgeMap.has(id))throw new TypeError('duplicate source physical edge');
  edgeMap.set(id,{fromId:a,toId:b,
   from:geometry.data.points[a],to:geometry.data.points[b]});
 }
 const ledgerMap=new Map(led.edges.map(e=>[e.view+'::'+e.sourceEdgeId,e]));
 if(ledgerMap.size!==led.edges.length)throw new TypeError('duplicate source ray record');
 const vertexRows=led.sourceVertexIncidenceEvidence?.groups;
 if(!Array.isArray(vertexRows))throw new TypeError('original 3D vertex incidence missing');
 const views=[];
 const makeEndpoint=(view,interval,role,expected)=>{
  const p=role==='from'?interval.fromModelMm:interval.toModelMm;
  if(d2(p,expected)>1e-7)
   throw new RangeError('C1 paper contour interval discontinuity');
  const endpointSource=[];
  for(const sourceId of interval.sourceEdgeIds){
   const edge=edgeMap.get(sourceId),ray=ledgerMap.get(view+'::'+sourceId);
   if(!edge||!ray||ray.view!==view||
      !ray.originalSingleSolidCreaseVerified||
      ray.originalCoplanarMeshSubdivisionVerified||
      ray.standardEngineeringLineStyle!=='undetermined'||
      ray.V5LineActionSignedOff!==false)
    throw new TypeError('paper contour endpoint has unsigned but nonphysical source');
   const q0=project(edge.from)[view],q1=project(edge.to)[view],
    dx=q1.u-q0.u,dy=q1.v-q0.v,
    denom=dx*dx+dy*dy;
   if(!Number.isFinite(denom)||denom<=1e-16)
    throw new RangeError('collapsed edge cannot support a contour endpoint');
   const t=((p.u-q0.u)*dx+(p.v-q0.v)*dy)/denom;
   if(!Number.isFinite(t)||t< -1e-8||t>1+1e-8)
    throw new RangeError('claimed source-edge 3D endpoint is outside its real segment');
   const u=Math.max(0,Math.min(1,t));
   let actual={x:edge.from.x+(edge.to.x-edge.from.x)*u,
    y:edge.from.y+(edge.to.y-edge.from.y)*u,
    z:edge.from.z+(edge.to.z-edge.from.z)*u};
   if(d2(project(actual)[view],p)>1e-7)
    throw new RangeError('source 3D interpolation disagrees with first-angle paper endpoint');
   // Refer back to the EXISTING verified source-vertex incidence when a
   // paper endpoint is a true model vertex; an interior split is different.
   const vId=u<=1e-9?edge.fromId:u>=1-1e-9?edge.toId:null;
   if(vId!==null){
    const exact=geometry.data.points[vId];
    const row=vertexRows.find(x=>x.view===view&&
      x.sourceGeometryId===geometry.id&&x.sourceVertexId===vId);
    if(!row||!row.originalSource3DIncidenceVerified||
       d3(exact,actual)>1e-7||d3(row.source3DPoint,exact)>1e-7||
       d2(row.projectedModelMm,p)>1e-7)
     throw new RangeError('original 3D corner and independent M5 vertex incidence differ');
    // Authenticated original vertex identity beats a rounded interpolation.
    // Its stored model coordinate is the sole reviewed source of this point.
    actual={...exact};
   }
   endpointSource.push({
    sourceEdgeId:sourceId,sourceVertexId:vId,
    originalSourceParameter:u,real3DPoint:actual,
    originalVertexIncidenceCorrelated:vId!==null,
    interiorSourceEdgePointVerified:vId===null,
    currentSourceProjectionVerified:true,
    officialLineJoinAuthorized:false
   });
  }
  if(endpointSource.length===0)throw new RangeError('empty endpoint source set');
  return endpointSource;
 };
 for(const view of VIEWS){
  const row=c.views.find(x=>x.view===view);
  if(!row||row.sides.length!==row.sideCount||row.sides.length<3)
   throw new RangeError('complete convex V/H/W boundary source missing');
  const ordered=[];
  for(const side of row.sides){
   for(const span of side.intervals){
    if(span.revision!==revision||span.view!==view||
       span.sourceGeometryId!==geometry.id||
       !span.geometricBoundarySourceCoverageVerified||
       span.officialLineStyle!=='undetermined'||span.v5StrokeAuthorized!==false)
     throw new TypeError('unverified source interval or stale version');
    ordered.push({sideIndex:side.sideIndex,interval:span});
   }
  }
  if(!ordered.length)throw new RangeError('empty purported paper boundary');
  const joins=[];
  for(let i=0;i<ordered.length;i++){
   const previous=ordered[i],next=ordered[(i+1)%ordered.length],
    p=previous.interval.toModelMm,q=next.interval.fromModelMm;
   if(d2(p,q)>1e-7)throw new RangeError('projected convex contour endpoint gap');
   const lhs=makeEndpoint(view,previous.interval,'to',p),
    rhs=makeEndpoint(view,next.interval,'from',q);
   const pairs=[];
   let nearButDistinct3DSourcePairCount=0;
   for(const a of lhs)for(const b of rhs){
    const exactlySame=exactSameReviewedModelPoint(
     a.real3DPoint,b.real3DPoint);
    if(!exactlySame&&near3(a.real3DPoint,b.real3DPoint))
     nearButDistinct3DSourcePairCount++;
    if(!exactlySame)continue;
    pairs.push({
     arrivingSourceEdgeId:a.sourceEdgeId,
     departingSourceEdgeId:b.sourceEdgeId,
     real3DPoint:{...a.real3DPoint},
     sameActualSourceEdge:a.sourceEdgeId===b.sourceEdgeId,
     originalSharedVertexId:a.sourceVertexId!==null&&
      a.sourceVertexId===b.sourceVertexId?a.sourceVertexId:null,
     sharedPhysical3DPointVerified:true,
     entireDrawingContourJoinAndVisibilityVerified:false
    });
   }
   const distinct=[];
   for(const candidate of [...lhs,...rhs]){
    if(!distinct.some(p=>exactSameReviewedModelPoint(p,candidate.real3DPoint)))
     distinct.push({...candidate.real3DPoint});
   }
   const observer=FIRST_ANGLE_OBSERVER_RAYS[view];
   const depths=distinct.map(x=>dot3(x,observer))
    .sort((a,b)=>b-a);
   joins.push({
    view,revision,projectedModelMm:{...p},
    fromSideIndex:previous.sideIndex,toSideIndex:next.sideIndex,
    fromSourceEndpoints:lhs,toSourceEndpoints:rhs,
    distinct3DPhysicalPoints:distinct,
    distinct3DPointCount:distinct.length,observerDepthMm:depths,
    paperProjectionHasPhysicallyDifferentDepthSources:distinct.length>1,
    authenticatedCommon3DJoinCandidates:pairs,
    physicalJoinCandidateCount:pairs.length,
    nearButDifferent3DSourcePointPairsRemainUndetermined:
     nearButDistinct3DSourcePairCount,
    localPhysical3DJoinExists:pairs.length>0,
    // A local match is a necessary endpoint witness. Visibility/nearest
    // source of the FULL final drawing stroke is a separate theorem.
    entireFinalContourJunctionCertified:false,
    standardEngineeringLineStyle:'undetermined',
    constructionIntentDAGV5Approved:false
   });
  }
  views.push({view,endpointCount:joins.length,junctions:joins,
   allContourSidePaperEndpointsAccountedFor:joins.length===ordered.length,
   distinct3DProjectionAliasCount:joins.filter(x=>
    x.paperProjectionHasPhysicallyDifferentDepthSources).length,
   locallyMatchedPhysical3DEndpointCount:joins.filter(x=>
    x.localPhysical3DJoinExists).length,
   wholeDrawingContourEndpointVisibilityVerified:false,
   officialLineStylesVerified:false});
 }
 return freeze({schema:'draftai-c1-contour-physical-junction-incidence/1',
  status:'scoped-physical-3d-contour-endpoint-candidates',
  revision,sourceGeometryId:geometry.id,views,
  inspectedContourIntervalEndpointCount:views.reduce((n,v)=>n+v.endpointCount*2,0),
  physical3DJoinCandidateCount:views.reduce((n,v)=>n+
    v.junctions.reduce((a,j)=>a+j.physicalJoinCandidateCount,0),0),
  depthAliasedPaperJunctionCount:views.reduce((n,v)=>n+
    v.distinct3DProjectionAliasCount,0),
  nearButDifferent3DSourcePairsNotCertified:views.reduce((n,v)=>n+
    v.junctions.reduce((sum,j)=>sum+
     j.nearButDifferent3DSourcePointPairsRemainUndetermined,0),0),
  currentConvexSourceGeometryAndProjectionVerified:true,
  fullFinalContourJunctionTopologyCertified:false,
  continuousFinalStrokeVisibilityCertified:false,
  standardEngineeringLineStylesCertified:false,
  signedV5EdgeActions:0,completeSolidV5Ready:false});
}
module.exports={auditC1ContourPhysicalJunctionIncidence,
 exactSameReviewedModelPoint};
