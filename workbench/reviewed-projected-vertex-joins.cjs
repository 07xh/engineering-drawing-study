'use strict';
/**
 * M5 verified geometric endpoint incidence and shared first-angle projected
 * coincidence groups, with separate ray-depth witnesses for each 3D source
 * vertex. An identical 2D point does NOT mean a 3D source join: two distinct
 * spatial vertices may project to the same paper coordinate at different
 * depths. Neither the nearest listed vertex nor a local point ray alone
 * authorizes a closed projected contour or standard V5 line style.
 */
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {project,VIEWS,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {traceConvexRayDepth}=
 require('../core/numeric/convex-ray-depth.cjs');
const {certifyConvexPointRayClearance}=
 require('../core/numeric/convex-point-ray-clearance.cjs');
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);
  Object.freeze(x);
 }return x;
};
const sameXYZ=(a,b)=>a.x===b.x&&a.y===b.y&&a.z===b.z;
const coordinateKey=p=>JSON.stringify([p.u===0?0:p.u,p.v===0?0:p.v]);
function deriveReviewedProjectedVertexJoins({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current reviewed source revision required');
 if(!Array.isArray(geometry)||!geometry.length||geometry.length>12)
  throw new TypeError('bounded reviewed Geometry scene required');
 const solids=[],all=[];
 const geomIds=new Set();
 for(const g of geometry){
  if(geomIds.has(g?.id))throw new TypeError('duplicate geometry source');
  geomIds.add(g.id);
  const proof=verifiedConvexMeshHalfspaces(g);
  solids.push({id:g.id,halfspaces:proof.halfspaces});
  if(Object.keys(g.data.points).length>128)
   throw new RangeError('bounded vertex set required');
  for(const [vertexId,p] of Object.entries(g.data.points)){
   const incident=g.data.edges.filter(e=>e.includes(vertexId))
    .map(e=>g.id+'::'+[...e].sort().join('|')).sort();
   if(incident.length<3)
    throw new TypeError('closed manifold source vertex without sufficient incident edges');
   all.push({sourceGeometryId:g.id,sourceVertexId:vertexId,
    sourceVertexKey:g.id+'::'+vertexId,
    pointModelMm:{x:p.x,y:p.y,z:p.z},
    incidentSourceEdgeIds:incident});
  }
 }
 if(all.length>128)
  return freeze({schema:'draftai-reviewed-projected-vertex-joins/1',
   revision,status:'vertex-budget-exceeded',groups:[],
   groupCount:0,sourceVertexCount:all.length,
   projectedCoincidencesVerified:false,
   endpointVisibilityVerified:false,officialLineStylesVerified:false,
   completeSceneVerified:false,v5Ready:false});
 const groups=[];
 for(const view of VIEWS){
  const viewGroups=new Map(),d=FIRST_ANGLE_OBSERVER_RAYS[view];
  for(const entry of all){
   const projected=project(entry.pointModelMm)[view];
   const key=coordinateKey(projected);
   if(!viewGroups.has(key))
    viewGroups.set(key,{view,projectedModelMm:projected,members:[]});
   const ray=traceConvexRayDepth({
    point:entry.pointModelMm,observerDirection:d,solids});
   const depth=entry.pointModelMm.x*d.x+
    entry.pointModelMm.y*d.y+entry.pointModelMm.z*d.z;
   // A listed nearest vertex does not establish positive-ray freedom:
   // check against EVERY reviewed closed convex mesh independently.
   const clearances=solids.map(solid=>certifyConvexPointRayClearance({
    point:entry.pointModelMm,observerDirection:d,solid
   }));
   const positivelyClear=clearances.every(x=>x.status==='certified-clear');
   viewGroups.get(key).members.push({
    ...entry,observerDepthMm:depth,
    pointRayOcclusion:ray.status,
    pointRayNearestSolidId:ray.nearestSolidId,
    pointRayScope:ray.scope,
    pointRayVerifiedWithinScene:ray.status!=='undetermined',
    positiveOpenRayClearWithinReviewedSolids:positivelyClear,
    positiveOpenRayClearSolidIds:clearances.filter(x=>
     x.status==='certified-clear').map(x=>x.solidId),
    positiveRayProofScope:'only-all-explicit-closed-convex-mesh-set',
    projectedPointVisibilityCertified:false,
    sourceIncidenceVerified:true,visibleJoinCertified:false
   });
  }
  for(const [key,g]of viewGroups){
   const members=g.members.sort((a,b)=>b.observerDepthMm-a.observerDepthMm||
    a.sourceVertexKey.localeCompare(b.sourceVertexKey));
   const nearest=members[0],next=members[1];
   const depthTie=next&&Math.abs(next.observerDepthMm-
    nearest.observerDepthMm)<=1e-7;
   const identical3D=members.every(x=>
    sameXYZ(x.pointModelMm,members[0].pointModelMm));
   groups.push({view,projectionKey:key,projectedModelMm:g.projectedModelMm,
    memberCount:members.length,members,
    nearestListedSourceVertexKey:depthTie?null:nearest.sourceVertexKey,
    listedVertexDepthOrderVerified:!depthTie,
    same3DPoint:identical3D,
    distinct3DPointsShareProjection:members.length>1&&!identical3D,
    allSourceVertexIncidencesVerified:true,
    jointVisibilityCertified:false,
    projectedJunctionLineStyleCertified:false,
    wholeContourCertified:false
   });
  }
 }
 return freeze({
  schema:'draftai-reviewed-projected-vertex-joins/1',
  revision,status:'scoped-projected-coincidences-only',
  sourceVertexCount:all.length,groupCount:groups.length,groups,
  projectedCoincidencesVerified:true,
  endpointVisibilityVerified:false,officialLineStylesVerified:false,
  completeSceneVerified:false,v5Ready:false
 });
}
module.exports={deriveReviewedProjectedVertexJoins};
