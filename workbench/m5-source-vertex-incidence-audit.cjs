'use strict';
/**
 * Shared M5 source-vertex / projected cutpoint junction evidence for C1/C2.
 *
 * A real original 3D mesh vertex joins its OWN incident 3D mesh edges.
 * This NEVER proves that coincident paper points of distinct source vertices
 * join, nor that source edges should be drawn in an official line style.
 *
 * Derive exact projected incidence against ALL current M4 cutpoint endpoints,
 * recompute the M5 cutpoint and source-point ray witnesses, and separately
 * classify depth-separated co-projection, collapsed incident edges, projected
 * tangent directions and positive observer rays.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexPointRayClearance}=
 require('../core/numeric/convex-point-ray-clearance.cjs');
const {deriveReviewedProjectedVertexJoins}=
 require('./reviewed-projected-vertex-joins.cjs');
const {deriveProjectedCutEndpointTopology}=
 require('./reviewed-projected-cut-endpoint-topology.cjs');
const deepFreeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))deepFreeze(v);Object.freeze(x);
 }return x;};
const dist=(p,q)=>Math.hypot(p.u-q.u,p.v-q.v);
const key=(g,a,b)=>g+'::'+[a,b].sort().join('|');
function inspectSourceVertexIncidence({geometry,revision,sceneDepthEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('M5 source junction requires current source revision');
 if(!Array.isArray(geometry)||geometry.length<1||geometry.length>8)
  throw new TypeError('M5 source junction requires bounded reviewed meshes');
 const scene=sceneDepthEvidence;
 if(scene?.schema!=='draftai-reviewed-mesh-scene-ray-audit/1'||
    scene.status!=='scoped-face-probes-only'||scene.revision!==revision||
    scene.v5Ready!==false||scene.officialLineStylesVerified!==false)
  return deepFreeze({schema:'draftai-m5-source-vertex-incidence/1',
   revision,status:'not-covered',groups:[],groupCount:0,
   exactSourceIncidenceCount:0,positiveOriginalRayCount:0,
   unambiguousProjectedCandidateCount:0,allProjectedJunctionsVerified:false,
   standardLineStylesVerified:false,v5Ready:false});
 const verifiedGeometry=[],ids=new Set();
 for(const g of geometry){
  if(!g||ids.has(g.id))throw new TypeError('duplicate or missing source mesh');
  ids.add(g.id);
  const proof=verifiedConvexMeshHalfspaces(g);
  verifiedGeometry.push({g,solid:{id:g.id,halfspaces:proof.halfspaces}});
 }
 const joins=deriveReviewedProjectedVertexJoins({geometry,revision});
 if(JSON.stringify(scene.projectedVertexJoins)!==JSON.stringify(joins))
  throw new TypeError('forged or stale projected original source vertex evidence');
 const cuts=deriveProjectedCutEndpointTopology({
  geometry,revision,sceneDepthEvidence:scene});
 if(JSON.stringify(scene.projectedCutEndpointTopology)!==JSON.stringify(cuts))
  throw new TypeError('forged or stale original projected split endpoint evidence');
 if(cuts.status!=='source-projected-endpoint-scope-only')
  return deepFreeze({schema:'draftai-m5-source-vertex-incidence/1',
   revision,status:'not-covered',groups:[],groupCount:0,
   exactSourceIncidenceCount:0,positiveOriginalRayCount:0,
   unambiguousProjectedCandidateCount:0,allProjectedJunctionsVerified:false,
   standardLineStylesVerified:false,v5Ready:false});
 const groups=[];
 for(const {g} of verifiedGeometry){
  for(const [vertexId,point] of Object.entries(g.data.points)){
   const sourceVertexKey=g.id+'::'+vertexId;
   const incident=g.data.edges.filter(e=>e.includes(vertexId))
    .map(e=>({sourceEdgeId:key(g.id,e[0],e[1]),
     otherVertexId:e[0]===vertexId?e[1]:e[0],
     originalSourceParameter:e[0]===vertexId?0:1}));
   if(incident.length<3)throw new TypeError('closed manifold corner without incident edges');
   for(const view of VIEWS){
    const uv=project(point)[view];
    const group=joins.groups.filter(j=>j.view===view&&
     j.members.some(m=>m.sourceVertexKey===sourceVertexKey));
    if(group.length!==1||dist(group[0].projectedModelMm,uv)>1e-8)
     throw new RangeError('original mesh corner not uniquely accounted for in its projected group');
    const gjoin=group[0];
    const active=[],collapsed=[];
    for(const e of incident){
     const endpoint=project(g.data.points[e.otherVertexId])[view];
     const length=dist(uv,endpoint);
     if(!(length>1e-8)){collapsed.push(e.sourceEdgeId);continue;}
     const matched=cuts.cutEndpoints.filter(p=>p.view===view&&
      p.sourceEdgeId===e.sourceEdgeId&&
      p.sourceGeometryId===g.id&&
      p.sourceParameter===e.originalSourceParameter&&
      p.sourceVertexKey===sourceVertexKey&&
      p.source3DIncidenceVerified===true&&
      dist(p.projectedModelMm,uv)<=1e-8);
     if(matched.length!==1)throw new RangeError('missing or duplicated exact projected source-edge endpoint incidence');
     const witness=matched[0];
     active.push({sourceEdgeId:e.sourceEdgeId,
      otherVertexId:e.otherVertexId,
      projectedDirection:{u:(endpoint.u-uv.u)/length,
       v:(endpoint.v-uv.v)/length},
      originalParameter:e.originalSourceParameter,
      sourceEndpointStatus:witness.status,
      verifiedOriginal3DIncidence:true,
      sourceEndpointPositiveObserverRayVerified:
       witness.status==='positive-original-vertex-ray-incidence'&&
       witness.sourceOriginalPointRayVerified===true,
      screenCrossingIsNotPhysical3DJoin:
       witness.status==='depth-separated-paper-crossing-no-spatial-join',
      hasUnresolvedCoincidenceOrTangency:
       witness.status.startsWith('undetermined'),
      officiallyJoinedLineStyle:false});
    }
    const pointClear=verifiedGeometry.every(v=>
     certifyConvexPointRayClearance({point,
      observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view],
      solid:v.solid}).status==='certified-clear');
    const vertexDepthUnique=
     gjoin.listedVertexDepthOrderVerified===true&&
     gjoin.nearestListedSourceVertexKey===sourceVertexKey;
    const allActiveRays=active.length>=2&&active.every(a=>
     a.sourceEndpointPositiveObserverRayVerified);
    const noProjectedAngularTies=active.length>=2&&active.every((e,i)=>
     active.slice(i+1).every(q=>{
      const cross=e.projectedDirection.u*q.projectedDirection.v-
        e.projectedDirection.v*q.projectedDirection.u;
      return Math.abs(cross)>1e-9; // tangent/opposite collinearity stays undecided
     }));
    // This is an UNAMBIGUOUS SOURCE ENDPOINT CANDIDATE only. No claim that
    // projected neighbouring strokes form the final outer/hidden contour.
    const uniqueProjectedIdentity=gjoin.memberCount===1&&
     gjoin.distinct3DPointsShareProjection!==true;
    const candidate=active.length>=2&&allActiveRays&&pointClear&&
     vertexDepthUnique&&uniqueProjectedIdentity&&noProjectedAngularTies&&
     collapsed.length===0;
    groups.push({sourceGeometryId:g.id,sourceVertexKey,sourceVertexId:vertexId,
     view,source3DPoint:{...point},projectedModelMm:uv,
     incidentSourceEdgeCount:incident.length,
     projectedActiveEdgeCount:active.length,
     collapsedSourceEdgeIds:collapsed,activeSourceEdges:active,
     originalSource3DIncidenceVerified:true,
     allOriginalProjectedEdgeEndpointsMatched:true,
     sourceVertexPositiveRayVerified:pointClear&&vertexDepthUnique,
     everyActiveEdgeEndpointPositiveRayVerified:allActiveRays,
     uniqueProjectedSourceVertexVerified:uniqueProjectedIdentity,
     projectedAngularSeparationVerified:noProjectedAngularTies,
     distinct3DPointSharesSamePaperPoint:
      gjoin.distinct3DPointsShareProjection===true,
     proofScope:candidate?'positive-3d-vertex-and-projective-endpoint-candidate':
      'source-incidence-only-joins-undetermined',
     localPositiveProjectedEndpointCandidate:candidate,
     fullContourJunctionVisibilityVerified:false,
     allIncidentStrokeVisibilityAndStylesVerified:false,
     officialLineStyle:'undetermined',
     constructionStepV5Approved:false});
   }
  }
 }
 return deepFreeze({schema:'draftai-m5-source-vertex-incidence/1',
  revision,status:'source-3d-original-vertex-incidence-recomputed',
  sourceGeometryIds:geometry.map(g=>g.id),groups,groupCount:groups.length,
  exactSourceIncidenceCount:groups.filter(g=>
   g.allOriginalProjectedEdgeEndpointsMatched).length,
  positiveOriginalRayCount:groups.filter(g=>
   g.sourceVertexPositiveRayVerified).length,
  unambiguousProjectedCandidateCount:groups.filter(g=>
   g.localPositiveProjectedEndpointCandidate).length,
  depthSeparatedProjectedCoincidenceCount:groups.filter(g=>
   g.distinct3DPointSharesSamePaperPoint).length,
  allProjectedJunctionsVerified:false,
  finalContourCompletionVerified:false,
  standardLineStylesVerified:false,v5Ready:false});
}
module.exports={inspectSourceVertexIncidence};
