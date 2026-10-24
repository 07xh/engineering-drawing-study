'use strict';
/**
 * M5 positive proof for a CLOSED original 3D source edge in first-angle views.
 *
 * Intersection of independent evidence:
 * - Recomputed M4 continuous source-stroke partition, with ONE full [0,1]
 *   source interval proven positively clear of every reviewed convex mesh.
 * - Recomputed M0 positive observer rays at BOTH authentic source vertices.
 * - Unambiguous nearest projected 3D vertex identity at BOTH source ends.
 * - Independent 2D geometric UNION showing the projected open stroke lies
 *   on an external outer boundary (not a tangent/shared/covered interval).
 *
 * This is a SOURCE-edge positive-ray and projected-boundary certificate,
 * NOT an official solid/dashed line or construction-order certificate.
 * Split edges, tangencies, coincident projected joins and hidden segments
 * stay undetermined. Never promote closed stroke evidence to final V5.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexSegmentClearance}=
 require('../core/numeric/convex-segment-clearance.cjs');
const {certifyConvexPointRayClearance}=
 require('../core/numeric/convex-point-ray-clearance.cjs');
const {partitionReviewedSourceEdges}=
 require('./scoped-projected-stroke-partition.cjs');
const {deriveReviewedProjectedVertexJoins}=
 require('./reviewed-projected-vertex-joins.cjs');
const {classifyMultiBodyProjectedUnion}=
 require('../core/verification/multibody-projected-union.cjs');
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);
  Object.freeze(x);
 }return x;
};
const dist=(p,q)=>Math.hypot(p.u-q.u,p.v-q.v);
const delta=(a,b)=>({u:a.u-b.u,v:a.v-b.v});
const cross=(p,q)=>p.u*q.v-p.v*q.u;
const dot=(p,q)=>p.u*q.u+p.v*q.v;
const id=(g,a,b)=>g+'::'+[a,b].sort().join('|');
const fail=s=>{throw new TypeError('reviewed closed stroke ray proof: '+s);};
function inspectClosedSourceStrokeRays({geometry,sceneDepthEvidence,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('current source revision required');
 const audit=sceneDepthEvidence;
 if(!Array.isArray(geometry)||geometry.length<1||geometry.length>8||
    audit?.schema!=='draftai-reviewed-mesh-scene-ray-audit/1'||
    audit.status!=='scoped-face-probes-only'||audit.revision!==revision||
    audit.fullSceneVerified!==false||audit.officialLineStylesVerified!==false||
    audit.v5Ready!==false)
  return freeze({schema:'draftai-m5-closed-edge-positive-ray/1',revision,
   status:'not-covered',sourceEdgeViewCount:0,edges:[],
   certifiedClosedVisibleCount:0,certifiedOuterEdgeCount:0,
   officialLineStylesVerified:false,v5Ready:false});
 const solids=geometry.map(g=>{
  const solid=verifiedConvexMeshHalfspaces(g);
  return {id:g.id,halfspaces:solid.halfspaces};
 });
 const expected=partitionReviewedSourceEdges({
  geometry,sceneDepthEvidence:audit,revision});
 if(expected.status!=='preview-partition-evidence-only')
  return freeze({schema:'draftai-m5-closed-edge-positive-ray/1',revision,
   status:'not-covered',sourceEdgeViewCount:0,edges:[],
   certifiedClosedVisibleCount:0,certifiedOuterEdgeCount:0,
   officialLineStylesVerified:false,v5Ready:false});
 if(JSON.stringify(expected)!==JSON.stringify(audit.projectedStrokePartitions))
  fail('claimed source visibility segments differ from recomputed geometry');
 const joins=deriveReviewedProjectedVertexJoins({geometry,revision});
 if(JSON.stringify(joins)!==JSON.stringify(audit.projectedVertexJoins))
  fail('tampered projected source-vertex and ray evidence');
 const union=classifyMultiBodyProjectedUnion({geometry,revision});
 if(JSON.stringify(union)!==JSON.stringify(audit.projectedUnionOutlines))
  fail('tampered or stale projected body union');
 const sourceEdges=geometry.reduce((n,g)=>n+g.data.edges.length,0);
 if(sourceEdges>40)fail('source edge audit exceeds fixed M5 budget');
 const edges=[];
 function vertexIsPositive(sourceKey,point,view){
  const groups=joins.groups.filter(x=>x.view===view&&
   x.members.some(m=>m.sourceVertexKey===sourceKey));
  if(groups.length!==1)return false;
  const group=groups[0],member=group.members.find(x=>x.sourceVertexKey===sourceKey);
  const uv=project(point)[view];
  if(group.projectedModelMm.u!==uv.u||group.projectedModelMm.v!==uv.v||
     group.listedVertexDepthOrderVerified!==true||
     group.nearestListedSourceVertexKey!==sourceKey||
     member?.sourceIncidenceVerified!==true||
     member.positiveOpenRayClearWithinReviewedSolids!==true)return false;
  // Recompute independently rather than trust the endpoint flag.
  return solids.every(s=>certifyConvexPointRayClearance({
   point,observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view],
   solid:s}).status==='certified-clear');
 }
 function externalHullCovers(g,view,from,to){
  const v=delta(to,from),length=dist(from,to),squared=dot(v,v);
  if(length<=1e-8)return false;
  const tol=Math.max(1e-9,length*1e-10),tolerance=tol/length;
  const spans=[];
  for(const s of union.segments){
   if(s.sourceGeometryId!==g||s.view!==view||
      s.status!=='open-projected-union-boundary')continue;
   const a=s.fromModelProjectionMm,b=s.toModelProjectionMm;
   if(Math.abs(cross(v,delta(a,from)))>tol*length||
      Math.abs(cross(v,delta(b,from)))>tol*length)continue;
   const p=dot(delta(a,from),v)/squared,q=dot(delta(b,from),v)/squared;
   const start=Math.max(0,Math.min(p,q)),end=Math.min(1,Math.max(p,q));
   if(end-start>tolerance)spans.push([start,end]);
  }
  spans.sort((a,b)=>a[0]-b[0]);
  let reach=0;
  for(const [start,end] of spans){
   if(start>reach+tolerance)return false;
   reach=Math.max(reach,end);
   if(reach>=1-tolerance)break;
  }
  return reach>=1-tolerance;
 }
 for(const g of geometry)for(const [a,b] of g.data.edges){
  const edgeId=id(g.id,a,b),from=g.data.points[a],to=g.data.points[b];
  for(const view of VIEWS){
   const uv0=project(from)[view],uv1=project(to)[view];
   if(dist(uv0,uv1)<=1e-8)continue;
   const relevant=expected.segments.filter(s=>
    s.view===view&&s.sourceGeometryId===g.id&&s.sourceEdgeId===edgeId);
   const whole=relevant.length===1&&
    relevant[0].sourceParameterRange[0]===0&&
    relevant[0].sourceParameterRange[1]===1&&
    relevant[0].openInteriorVisibility==='visible';
   const continuous=whole&&solids.every(s=>
    certifyConvexSegmentClearance({
     source:{id:'ReviewedSourceEdge',from,to},
     solid:s,observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view],
     sourceParameterRange:[0,1]}).status==='certified-clear');
   const endpointA=continuous&&vertexIsPositive(g.id+'::'+a,from,view),
     endpointB=continuous&&vertexIsPositive(g.id+'::'+b,to,view);
   const visibleClosed=!!(continuous&&endpointA&&endpointB);
   const boundary=visibleClosed&&externalHullCovers(g.id,view,uv0,uv1);
   edges.push({
    sourceGeometryId:g.id,sourceEdgeId:edgeId,view,
    sourceParameterRange:[0,1],
    status:boundary?'certified-visible-closed-outer-source-edge':
     visibleClosed?'certified-visible-closed-source-ray':'undetermined',
    wholeSourceIntervalClearVerified:!!continuous,
    originalSourceEndpointRaysVerified:!!(endpointA&&endpointB),
    projectedOuterOpenBoundaryVerified:!!boundary,
    positiveClosedRayVisibilityVerified:visibleClosed,
    // A projected junction may involve other edges or tangencies even if
    // each original source endpoint is ray-clear.
    projectedJunctionTopologyVerified:false,
    multiBodyClosedSilhouetteVerified:false,
    approvedConstructionOrderVerified:false,
    officialLineStyleVerified:false,
    canonicalConstructionIntentVerified:false,
    constructionStepDAGVerified:false,v5Ready:false
   });
  }
 }
 return freeze({schema:'draftai-m5-closed-edge-positive-ray/1',revision,
  status:'scoped-positive-closed-source-rays-only',
  sourceGeometryIds:geometry.map(g=>g.id),sourceEdgeViewCount:edges.length,
  certifiedClosedVisibleCount:edges.filter(s=>
   s.positiveClosedRayVisibilityVerified).length,
  certifiedOuterEdgeCount:edges.filter(s=>
   s.projectedOuterOpenBoundaryVerified).length,
  edges,projectedJunctionTopologyVerified:false,
  completeMultiBodyLineWorkVerified:false,
  officialLineStylesVerified:false,
  canonicalConstructionIntentVerified:false,
  constructionStepDAGVerified:false,v5Ready:false});
}
module.exports={inspectClosedSourceStrokeRays};
