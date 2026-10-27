'use strict';
/**
 * REAL reviewed Geometry -> M0 projected contour-topology consumer.
 * Unlike a paper-space coincidence heuristic, every face corner comes from
 * one original THREE-DIMENSIONAL mesh vertex, each face edge from the
 * currently audited original M0 source interval, and each point-ray from
 * the independent convex source/scene vertex-clearance pass.
 *
 * A completely ray-clear planar face ring is only a LOCAL projected join
 * certificate. It is NOT the outer silhouette, scene-wide occlusion, GB
 * engineering line style, ConstructionIntent, or a V5 command.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexSegmentClearance}=
 require('../core/numeric/convex-segment-clearance.cjs');
const {certifyConvexPointRayClearance}=
 require('../core/numeric/convex-point-ray-clearance.cjs');
const {auditProjectedContour}=
 require('../core/numeric/projected-contour-topology.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const near=(p,q)=>p&&q&&Number.isFinite(p.u)&&Number.isFinite(p.v)&&
 Math.hypot(p.u-q.u,p.v-q.v)<=1e-8;
const sameXYZ=(a,b)=>a&&b&&['x','y','z'].every(k=>
 Number.isFinite(a[k])&&a[k]===b[k]);
const held=(revision,reason)=>freeze({
 schema:'draftai-reviewed-m0-face-ring-joins/1',revision,
 status:'not-covered',reason,sourceGeometryIds:[],rings:[],
 reviewedFaceViewCount:0,locallyCertifiedFaceRingCount:0,
 completeSceneVerified:false,allProjectedSourceJoinsVerified:false,
 officialLineStylesVerified:false,constructionIntentAuthorized:false,
 v5VerifiedExportReady:false
});
function auditReviewedM0FaceRingJoins({geometry,revision,
 sourcePartitions,projectedVertexJoins}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current scene revision required');
 if(!Array.isArray(geometry)||!geometry.length||geometry.length>8||
    !sourcePartitions||
    sourcePartitions.schema!=='draftai-reviewed-real-m0-scene-partitions/1'||
    sourcePartitions.revision!==revision||
    sourcePartitions.status!=='actual-reviewed-source-open-interval-evidence'||
    !projectedVertexJoins||
    projectedVertexJoins.schema!=='draftai-reviewed-projected-vertex-joins/1'||
    projectedVertexJoins.revision!==revision||
    !Array.isArray(projectedVertexJoins.groups)||
    projectedVertexJoins.status!=='scoped-projected-coincidences-only')
  return held(revision,'current M0 interval and independent vertex-ray producers required');
 if(JSON.stringify(sourcePartitions.sourceGeometryIds)!==
    JSON.stringify(geometry.map(g=>g.id)))
  return held(revision,'original scene source membership mismatch');
 const originalEdgeViewCount=geometry.reduce((n,g)=>n+g.data.edges.length,0)*3;
 if(sourcePartitions.originalSourceEdgeViewCount!==originalEdgeViewCount)
  return held(revision,'incomplete original source edge view coverage');
 // The producer's unsigned booleans are NOT independent proof. Recheck
 // every candidate positive edge/vertex directly against the CURRENT
 // verified closed 3D solids; no client-invented clearance can certify a join.
 let realSolids;
 try{
  realSolids=geometry.map((g,i)=>({id:'M0JoinSolid'+(i+1),
   halfspaces:verifiedConvexMeshHalfspaces(g).halfspaces}));
 }catch(e){return held(revision,'independent original convex source failed: '+e.message);}
 const fullEdgeClearCache=new Map(),pointRayClearCache=new Map();
 const independentlyClearEdge=(key,from,to,view)=>{
  if(fullEdgeClearCache.has(key))return fullEdgeClearCache.get(key);
  let ok=false;
  try{
   const source={id:'M0JoinEdge',from:{x:from.x,y:from.y,z:from.z},
    to:{x:to.x,y:to.y,z:to.z}};
   ok=realSolids.every(solid=>certifyConvexSegmentClearance({
    source,solid,observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view],
    sourceParameterRange:[0,1]
   }).status==='certified-clear');
  }catch{ok=false;}
  fullEdgeClearCache.set(key,ok);return ok;
 };
 const independentlyClearPoint=(key,point,view)=>{
  if(pointRayClearCache.has(key))return pointRayClearCache.get(key);
  let ok=false;
  try{
   const original={x:point.x,y:point.y,z:point.z};
   ok=realSolids.every(solid=>certifyConvexPointRayClearance({
    point:original,solid,observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view]
   }).status==='certified-clear');
  }catch{ok=false;}
  pointRayClearCache.set(key,ok);return ok;
 };
 const intervals=new Map(),pointRays=new Map();
 for(const view of VIEWS){
  const rows=sourcePartitions.views?.[view]?.edges;
  if(!Array.isArray(rows)||rows.length*3!==originalEdgeViewCount)
   return held(revision,'M0 original V/H/W source inventory mismatch');
  for(const row of rows){
   const key=view+'|'+row.sourceEdgeId;
   if(intervals.has(key))return held(revision,'duplicated current M0 interval source');
   intervals.set(key,row);
  }
 }
 for(const group of projectedVertexJoins.groups){
  if(!VIEWS.includes(group.view)||!Array.isArray(group.members))
   return held(revision,'invalid M0 source vertex ray group');
  for(const member of group.members){
   const key=group.view+'|'+member.sourceGeometryId+'::'+member.sourceVertexId;
   if(pointRays.has(key))return held(revision,'duplicated actual original 3D vertex');
   pointRays.set(key,{member,group});
  }
 }
 const rings=[];
 for(const g of geometry)for(const [i,face] of g.data.faces.entries()){
  if(!Array.isArray(face)||face.length<3||face.length>64)
   return held(revision,'invalid original M0 face cycle');
  for(const view of VIEWS){
   const verts=[],edges=[],physical=[];
   let blocked=null;
   for(let k=0;k<face.length;k++){
    const a=face[k],b=face[(k+1)%face.length];
    const pa=g.data.points[a],pb=g.data.points[b];
    if(!pa||!pb){blocked='face source endpoint missing';break;}
    const uv=project(pa)[view],next=project(pb)[view];
    const sourceId=g.id+'::'+[a,b].sort().join('|');
    const row=intervals.get(view+'|'+sourceId);
    const point=pointRays.get(view+'|'+g.id+'::'+a);
    // A second 3D vertex can share exactly the same paper coordinate.
    // Only the SAME original source identity and XYZ can form this join.
    if(!row||row.sourceGeometryId!==g.id||
       !row.sourceVertexIds?.includes(a)||
       !row.sourceVertexIds?.includes(b)||
       !near(uv,row.fromProjectedModelMm)&&!near(uv,row.toProjectedModelMm)||
       !near(next,row.fromProjectedModelMm)&&
        !near(next,row.toProjectedModelMm)||
       !point||!sameXYZ(point.member.pointModelMm,pa)||
       !near(uv,point.group.projectedModelMm)){
     blocked='original source/vertex provenance mismatch';break;
    }
    physical.push(sourceId);
    if(Math.hypot(next.u-uv.u,next.v-uv.v)<=1e-8||
       row.status!=='audited-open-intervals'||row.runs.length!==1||
       row.runs[0].visibilityEvidence!=='clear-within-supplied-solids'||
       row.runs[0].originalSourceParameterRange?.[0]!==0||
       row.runs[0].originalSourceParameterRange?.[1]!==1||
       row.runs[0].independentlyContinuousM0OpenInterval!==true){
     blocked='original full edge continuous ray not certified or collapsed';
     break;
    }
    if(!independentlyClearEdge(view+'|'+sourceId,pa,pb,view)){
     blocked='independent actual M0 full-edge ray recheck failed';
     break;
    }
    const pointClear=point.member.positiveOpenRayClearWithinReviewedSolids===true&&
     independentlyClearPoint(view+'|'+g.id+'::'+a,pa,view);
    const vid='Vertex'+(k+1),nextId='Vertex'+((k+1)%face.length+1),
     eid='FaceEdge'+(k+1);
    verts.push({id:vid,view,projectedPoint:uv,
     visibility:pointClear?'visible':'undetermined',
     pointRayCertified:pointClear});
    edges.push({edgeId:eid,
     start:{vertexId:vid,view,projectedEndpoint:uv,
      openVisibility:'visible',openIntervalCertified:true},
     end:{vertexId:nextId,view,projectedEndpoint:next,
      openVisibility:'visible',openIntervalCertified:true}});
   }
   let proof=null;
   if(!blocked){
    proof=auditProjectedContour({view,edges,vertices:verts});
    if(!proof.localTopologyVerified)
     blocked='missing positive original 3D point-ray/adjacent interval join';
   }
   rings.push({sourceGeometryId:g.id,sourceFaceId:'face-'+(i+1),
    view,physicalOriginalSourceEdgeIds:physical,
    status:blocked?'undetermined':'local-projected-ring-certified',
    reason:blocked,
    localProjectedTopologyVerified:!blocked,
    source3DVertexAndContinuousOpenRayJoinAudited:!blocked,
    joins:proof?.joins??[],
    completeSceneVerified:false,officialLineStylesVerified:false,
    v5ActionAuthorized:false});
  }
 }
 return freeze({schema:'draftai-reviewed-m0-face-ring-joins/1',
  revision,status:'real-original-mesh-local-projected-rings',
  sourceGeometryIds:geometry.map(g=>g.id),rings,
  reviewedFaceViewCount:rings.length,
  locallyCertifiedFaceRingCount:rings.filter(x=>
   x.localProjectedTopologyVerified).length,
  completeSceneVerified:false,allProjectedSourceJoinsVerified:false,
  officialLineStylesVerified:false,constructionIntentAuthorized:false,
  v5VerifiedExportReady:false});
}
module.exports={auditReviewedM0FaceRingJoins};
