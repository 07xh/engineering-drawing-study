'use strict';
/**
 * M4 read-only Geometry Scene -> future ConstructionStep/V5 stroke segmentation
 * evidence. Shared first-angle V/H/W, stable original mesh edge IDs.
 *
 * Partition at ALL analytically proven convex occlusion boundaries and
 * projected edge crossing/overlap/depth-switch events. A piece may carry
 * a mathematical 'hidden' OPEN-INTERIOR label only if the union of strictly
 * proven forward-ray blocker intervals COVERS that entire piece. Everything
 * else is undetermined. This is NOT a final drawing line style, endpoint
 * join certificate, canonical ConstructionIntent or another V5 player.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexSegmentOcclusion}=
 require('../core/numeric/convex-segment-occlusion.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const P=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);
  Object.freeze(x);
 }return x;
};
const fail=reason=>{throw new TypeError('scoped projected stroke partition: '+reason);};
function covered(ranges,a,b){
 let reach=a;
 for(const [start,end] of ranges){
  if(start>reach)break;
  if(end>reach)reach=end;
  if(reach>=b)return true;
 }
 return false;
}
const empty=(revision,status)=>freeze({
 schema:'draftai-scoped-projected-stroke-partition/1',
 revision,status,segmentCount:0,segments:[],
 scopedHiddenCount:0,officialLineStylesVerified:false,
 completeOcclusionVerified:false,canonicalIntentVerified:false,
 constructionStepDAGVerified:false,v5Ready:false
});
function partitionReviewedSourceEdges({geometry,sceneDepthEvidence,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('revision required');
 if(sceneDepthEvidence?.schema==='draftai-reviewed-mesh-scene-ray-audit/1'&&
    sceneDepthEvidence.revision===revision&&
    (sceneDepthEvidence.fullSceneVerified!==false||
     sceneDepthEvidence.officialLineStylesVerified!==false))
  fail('unreviewed whole-scene or official line style promotion');
 if(!sceneDepthEvidence||sceneDepthEvidence.revision!==revision||
    sceneDepthEvidence.schema!=='draftai-reviewed-mesh-scene-ray-audit/1'||
    sceneDepthEvidence.status!=='scoped-face-probes-only'||
    sceneDepthEvidence.edgeOverlapAudit?.status!=='pairwise-depth-events-only'||
    sceneDepthEvidence.edgeContinuousOcclusion?.status!==
     'continuous-open-interval-evidence-only'||
    sceneDepthEvidence.fullSceneVerified!==false||
    sceneDepthEvidence.officialLineStylesVerified!==false)
  return empty(revision,'not-covered');
 if(!Array.isArray(geometry)||geometry.length<1||geometry.length>12)
  return empty(revision,'not-covered');
 const solids=[],edges=new Map();
 for(const g of geometry){
  const solid=verifiedConvexMeshHalfspaces(g);
  solids.push({id:g.id,halfspaces:solid.halfspaces});
  for(const [a,b] of g.data.edges){
   const key=g.id+'::'+[a,b].sort().join('|');
   if(edges.has(key))fail('duplicate original mesh edge identity');
   edges.set(key,{id:key,ownerId:g.id,from:g.data.points[a],to:g.data.points[b]});
  }
 }
 if(edges.size>40)return empty(revision,'budget-exceeded');
 if(JSON.stringify(sceneDepthEvidence.sourceGeometryIds)!==
    JSON.stringify(geometry.map(x=>x.id)))fail('source Geometry ownership changed');
 const claimed=sceneDepthEvidence.edgeContinuousOcclusion.certifiedRanges;
 if(!Array.isArray(claimed))fail('missing M5 continuous certificates');
 const expected=[];
 for(const e of edges.values())for(const view of VIEWS)for(const solid of solids){
  const uv0=project(e.from)[view],uv1=project(e.to)[view];
  if(Math.hypot(uv0.u-uv1.u,uv0.v-uv1.v)<=1e-7)continue;
  const witness=certifyConvexSegmentOcclusion({
   source:{id:'CheckedEdge',from:e.from,to:e.to},
   solid,observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view]
  });
  if(witness.status==='certified-open-interval')
   expected.push({view,sourceGeometryId:e.ownerId,
    sourceEdgeId:e.id,occluderGeometryId:solid.id,
    openSourceParameterRange:[...witness.openSourceParameterRange]});
 }
 // Recompute M0 against the approved scene rather than honoring forged
 // renderer data. Check sources, blockers, first-angle signs and intervals.
 if(claimed.length!==expected.length)fail('M0 continuous evidence count changed');
 for(let i=0;i<expected.length;i++){
  const e=expected[i],q=claimed[i];
  if(!q||q.view!==e.view||q.sourceGeometryId!==e.sourceGeometryId||
     q.sourceEdgeId!==e.sourceEdgeId||
     q.occluderGeometryId!==e.occluderGeometryId||
     !Array.isArray(q.openSourceParameterRange)||
     q.openSourceParameterRange.length!==2||
     q.openSourceParameterRange.some((t,j)=>t!==e.openSourceParameterRange[j])||
     q.sourceEndpointsVerified!==false||
     q.fullLineStyleVerified!==false||
     q.completeOcclusionVerified!==false)
   fail('tampered source/occluder/interval proof');
 }
 const overlap=sceneDepthEvidence.edgeOverlapAudit.events;
 if(!Array.isArray(overlap)||overlap.length>6000)fail('bounded edge events required');
 const positions=new Map();
 for(const e of edges.values())for(const view of VIEWS)
  positions.set(e.id+':'+view,[0,1]);
 const insert=(id,view,t)=>{
  if(!edges.has(id)||!VIEWS.includes(view)||!finite(t)||
     t<0||t>1)fail('event refers to missing projected source edge');
  positions.get(id+':'+view).push(t);
 };
 for(const ev of overlap){
  if(!ev||!VIEWS.includes(ev.view)||
     !edges.has(ev.firstSourceEdgeId)||!edges.has(ev.secondSourceEdgeId)||
     edges.get(ev.firstSourceEdgeId).ownerId!==ev.firstSourceGeometryId||
     edges.get(ev.secondSourceEdgeId).ownerId!==ev.secondSourceGeometryId||
     !['crossing','collinear-overlap','endpoint-touch-undetermined'].includes(ev.relation))
   fail('projected overlap source identity or relation mismatch');
  for(const v of ev.events??[]){
   insert(ev.firstSourceEdgeId,ev.view,v.firstParameter);
   insert(ev.secondSourceEdgeId,ev.view,v.secondParameter);
  }
  for(const v of ev.ranges??[]){
   insert(ev.firstSourceEdgeId,ev.view,v.firstParameterRange[0]);
   insert(ev.firstSourceEdgeId,ev.view,v.firstParameterRange[1]);
   insert(ev.secondSourceEdgeId,ev.view,v.secondParameterRange[0]);
   insert(ev.secondSourceEdgeId,ev.view,v.secondParameterRange[1]);
  }
 }
 const segments=[];let scopedHiddenCount=0;
 for(const edge of edges.values())for(const view of VIEWS){
  const a=project(edge.from)[view],b=project(edge.to)[view];
  if(Math.hypot(a.u-b.u,a.v-b.v)<=1e-7)continue;
  const items=expected.filter(e=>e.sourceEdgeId===edge.id&&e.view===view);
  const ranges=items.map(e=>e.openSourceParameterRange);
  for(const [start,end] of ranges){
   insert(edge.id,view,start);insert(edge.id,view,end);
  }
  ranges.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  const cuts=[...new Set(positions.get(edge.id+':'+view))].sort((p,q)=>p-q);
  if(cuts.length>128)fail('too many exact visual transition cuts');
  for(let k=0;k<cuts.length-1;k++){
   const t0=cuts[k],t1=cuts[k+1];
   if(t1<=t0)continue;
   const hidden=covered(ranges,t0,t1);
   if(hidden)scopedHiddenCount++;
   const from=P(edge.from,edge.to,t0),to=P(edge.from,edge.to,t1);
   segments.push({
    sourceGeometryId:edge.ownerId,sourceEdgeId:edge.id,view,
    sourceParameterRange:[t0,t1],
    fromModelMm:from,toModelMm:to,
    projectedFromModelMm:project(from)[view],
    projectedToModelMm:project(to)[view],
    openInteriorVisibility:hidden?'hidden':'undetermined',
    occluderGeometryIds:hidden?
     [...new Set(items.filter(e=>
       e.openSourceParameterRange[0]<=t0&&
       e.openSourceParameterRange[1]>=t1)
       .map(e=>e.occluderGeometryId))]:[],
    evidenceScope:hidden?'strict-forward-ray-convex-interior':'none',
    joinVisibilityVerified:false,officialLineStyleVerified:false,
    canonicalIntentVerified:false,v5ActionApproved:false
   });
  }
 }
 return freeze({
  schema:'draftai-scoped-projected-stroke-partition/1',
  revision,status:'preview-partition-evidence-only',
  segmentCount:segments.length,segments,scopedHiddenCount,
  officialLineStylesVerified:false,completeOcclusionVerified:false,
  canonicalIntentVerified:false,constructionStepDAGVerified:false,
  v5Ready:false
 });
}
module.exports={partitionReviewedSourceEdges};
