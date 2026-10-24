'use strict';
/**
 * M5 source-anchored projected stroke CUT-ENDPOINT incidence proof.
 *
 * Every stroke endpoint is classified against independently recomputed
 * source mesh vertices and pairwise first-angle projected edge events.
 * Physical 3D source incidence and positive point-ray clearance are
 * distinct from a paper crossing and from a finished, visible joint.
 *
 * No imprecise paper intersection becomes a new model vertex. Tangencies,
 * depth ties, overlaps and generic occlusion transition endpoints stay
 * undetermined for official engineering line styling and the single V5.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {deriveReviewedProjectedVertexJoins}=
 require('./reviewed-projected-vertex-joins.cjs');
const {recomputeReviewedProjectedEdgeEvents}=
 require('./recomputed-projected-pairwise-events.cjs');
const {partitionReviewedSourceEdges}=
 require('./scoped-projected-stroke-partition.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const bad=s=>{throw new TypeError('M5 projected cut endpoint topology: '+s);};
const at=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const dot=(a,b)=>a.u*b.u+a.v*b.v;
const sub=(a,b)=>({u:a.u-b.u,v:a.v-b.v});
const cross=(a,b)=>a.u*b.v-a.v*b.u;
const distance=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
function deriveProjectedCutEndpointTopology({geometry,sceneDepthEvidence,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)bad('current revision required');
 const scene=sceneDepthEvidence;
 const empty=(status)=>freeze({schema:'draftai-m5-projected-cut-endpoints/1',
  revision,status,sourceCount:0,cutEndpoints:[],positiveOriginalPointCount:0,
  depthSeparatedPaperCrossingCount:0,undeterminedCount:0,
  fullProjectedJunctionsVerified:false,officialLineStylesVerified:false,
  constructionIntentReady:false,v5Ready:false});
 if(!Array.isArray(geometry)||!geometry.length||geometry.length>8||
    !scene||scene.schema!=='draftai-reviewed-mesh-scene-ray-audit/1'||
    scene.status!=='scoped-face-probes-only'||scene.revision!==revision||
    scene.v5Ready!==false||scene.officialLineStylesVerified!==false)
  return empty('not-covered');
 const originals=new Map(),sourceEdges=[],ids=new Set();
 for(const g of geometry){
  if(ids.has(g.id))bad('duplicate reviewed Geometry');
  ids.add(g.id);
  verifiedConvexMeshHalfspaces(g);
  for(const [a,b] of g.data.edges){
   const sourceEdgeId=g.id+'::'+[a,b].sort().join('|');
   if(originals.has(sourceEdgeId))bad('duplicate source edge');
   const entry={sourceGeometryId:g.id,sourceEdgeId,vertices:[a,b],
    points:[g.data.points[a],g.data.points[b]]};
   originals.set(sourceEdgeId,entry);
   sourceEdges.push({sourceGeometryId:g.id,sourceEdgeId,
    edge:{id:'ReviewedEdge_'+sourceEdges.length,
     from:entry.points[0],to:entry.points[1]}});
  }
 }
 if(sourceEdges.length>40)return empty('edge-budget-exceeded');
 const pairs=recomputeReviewedProjectedEdgeEvents(sourceEdges);
 if(JSON.stringify(pairs)!==JSON.stringify(scene.edgeOverlapAudit))
  bad('untrusted or stale projected pairwise source cuts');
 const joins=deriveReviewedProjectedVertexJoins({geometry,revision});
 if(JSON.stringify(joins)!==JSON.stringify(scene.projectedVertexJoins))
  bad('untrusted or stale original 3D vertex ray evidence');
 const partition=partitionReviewedSourceEdges({geometry,
  sceneDepthEvidence:scene,revision});
 if(partition.status!=='preview-partition-evidence-only')
  return empty('partition-not-covered');
 if(JSON.stringify(partition)!==JSON.stringify(scene.projectedStrokePartitions))
  bad('untrusted or stale source stroke partition');
 const cutEndpoints=[];
 for(const span of partition.segments){
  const source=originals.get(span.sourceEdgeId);
  if(!source||source.sourceGeometryId!==span.sourceGeometryId||
     !VIEWS.includes(span.view))bad('missing source edge of split segment');
  const [first,second]=source.points,
    from=project(first)[span.view],to=project(second)[span.view],
    projectedLength=distance(from,to);
  if(projectedLength<=1e-8)bad('collapsed projected source stroke');
  for(const which of ['from','to']){
   const t=span.sourceParameterRange[which==='from'?0:1];
   if(!Number.isFinite(t)||t<0||t>1)bad('invalid source split endpoint parameter');
   const model=at(first,second,t),p=project(model)[span.view];
   const tol=Math.max(1e-8,projectedLength*1e-9),eps=tol/projectedLength;
   const original=t===0||t===1;
   let status='undetermined-interior-split',sourceVertexKey=null,
     originalIncidence=false,positiveRay=false,screenDepthSeparated=false,
     ambiguous=false,associatedEvents=[];
   if(original){
    const key=source.sourceGeometryId+'::'+source.vertices[t===0?0:1];
    const found=joins.groups.filter(g=>g.view===span.view&&
     g.members.some(m=>m.sourceVertexKey===key));
    if(found.length!==1)bad('original 3D source vertex incidence missing');
    const group=found[0],member=group.members.find(m=>m.sourceVertexKey===key);
    if(distance(group.projectedModelMm,p)>tol||
       member.sourceIncidenceVerified!==true||
       !member.incidentSourceEdgeIds.includes(source.sourceEdgeId))
     bad('projected original vertex and physical edge incidence disagree');
    sourceVertexKey=key;originalIncidence=true;
    positiveRay=member.positiveOpenRayClearWithinReviewedSolids===true&&
      group.listedVertexDepthOrderVerified===true&&
      group.nearestListedSourceVertexKey===key;
    status=positiveRay?'positive-original-vertex-ray-incidence':
      'undetermined-original-vertex-projection';
   }
   // A second mesh edge crossing in paper is NEVER a proved
   // three-dimensional source join. Preserve the strict depth relation
   // only for transverse interior crossings with well-separated rays.
   for(const event of pairs.events){
    if(event.view!==span.view||!
      [event.firstSourceEdgeId,event.secondSourceEdgeId]
       .includes(span.sourceEdgeId))continue;
    const firstEdge=event.firstSourceEdgeId===span.sourceEdgeId;
    if(event.relation==='collinear-overlap'){
     for(const range of event.ranges||[]){
      const bounds=firstEdge?range.firstParameterRange:
       range.secondParameterRange;
      if(t>=Math.min(...bounds)-eps&&t<=Math.max(...bounds)+eps){
       ambiguous=true;associatedEvents.push({relation:'collinear-overlap',
        otherSourceEdgeId:firstEdge?event.secondSourceEdgeId:
         event.firstSourceEdgeId});
      }
     }
    }else for(const witness of event.events||[]){
     const param=firstEdge?witness.firstParameter:witness.secondParameter;
     if(Math.abs(t-param)>eps)continue;
     const otherId=firstEdge?event.secondSourceEdgeId:event.firstSourceEdgeId;
     associatedEvents.push({relation:event.relation,
      otherSourceEdgeId:otherId,front:witness.front});
     if(event.relation==='crossing'&&witness.endpointOrJoin===false&&
        witness.front!=='undetermined'){
      screenDepthSeparated=true;
     }else ambiguous=true;
    }
   }
   if(ambiguous)status='undetermined-paper-overlap-touch-or-tie';
   else if(screenDepthSeparated){
    status='depth-separated-paper-crossing-no-spatial-join';
    // A projection crossing may land at a source vertex; then even
    // if the source vertex ray is positive, full joint topology is not.
   }
   cutEndpoints.push({view:span.view,sourceGeometryId:source.sourceGeometryId,
    sourceEdgeId:source.sourceEdgeId,sourceParameter:t,
    segmentEndpoint:which,pointModelMm:model,projectedModelMm:p,
    sourceVertexKey,source3DIncidenceVerified:originalIncidence,
    sourceOriginalPointRayVerified:positiveRay,
    screenDepthSeparated,associatedEvents,status,
    projectedIntersectionIsPhysicalSourceJoinVerified:false,
    allIncidentStrokeContinuityVerified:false,
    tangentOrCoincidentTopologyVerified:false,
    officialEndpointLineStyleVerified:false,
    canonicalIntentApproved:false,v5Ready:false});
  }
 }
 if(cutEndpoints.length>6000)bad('projected cut endpoints exceed audit budget');
 return freeze({schema:'draftai-m5-projected-cut-endpoints/1',revision,
  status:'source-projected-endpoint-scope-only',
  sourceGeometryIds:geometry.map(g=>g.id),
  sourceCount:partition.segments.length,
  cutEndpoints,
  positiveOriginalPointCount:cutEndpoints.filter(x=>
   x.status==='positive-original-vertex-ray-incidence').length,
  depthSeparatedPaperCrossingCount:cutEndpoints.filter(x=>
   x.status==='depth-separated-paper-crossing-no-spatial-join').length,
  undeterminedCount:cutEndpoints.filter(x=>x.status.startsWith('undetermined')).length,
  fullProjectedJunctionsVerified:false,officialLineStylesVerified:false,
  constructionIntentReady:false,v5Ready:false});
}
module.exports={deriveProjectedCutEndpointTopology};
