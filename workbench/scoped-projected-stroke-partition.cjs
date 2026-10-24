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
const {certifyConvexSegmentClearance}=
 require('../core/numeric/convex-segment-clearance.cjs');
const {deriveReviewedProjectedVertexJoins}=
 require('./reviewed-projected-vertex-joins.cjs');
const {recomputeReviewedProjectedEdgeEvents}=
 require('./recomputed-projected-pairwise-events.cjs');
const {auditOrthogonalUnionSourceEdges}=
 require('./m5-orthogonal-union-source-edges.cjs');
const {proveGeneratedOrthogonalUnionCreases}=
 require('./m5-generated-orthogonal-union-creases.cjs');
const {evaluateFullSourceSegmentOcclusion}=
 require('../core/verification/convex-occlusion-coverage.cjs');
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
 scopedHiddenCount:0,scopedVisibleCount:0,officialLineStylesVerified:false,
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
 const solids=[],edges=new Map(),edgeInput=[];
 for(const g of geometry){
  const solid=verifiedConvexMeshHalfspaces(g);
  solids.push({id:g.id,halfspaces:solid.halfspaces});
  for(const [a,b] of g.data.edges){
   const key=g.id+'::'+[a,b].sort().join('|');
   if(edges.has(key))fail('duplicate original mesh edge identity');
   edges.set(key,{id:key,ownerId:g.id,
    from:g.data.points[a],to:g.data.points[b],
    fromVertexKey:g.id+'::'+a,toVertexKey:g.id+'::'+b});
   edgeInput.push({sourceGeometryId:g.id,sourceEdgeId:key,
    edge:{id:'ReviewedEdge_'+(edgeInput.length+1),
     from:g.data.points[a],to:g.data.points[b]}});
  }
 }
 if(edges.size>40)return empty(revision,'budget-exceeded');
 if(JSON.stringify(sceneDepthEvidence.sourceGeometryIds)!==
    JSON.stringify(geometry.map(x=>x.id)))fail('source Geometry ownership changed');
 // A paper coincidence is not an actual 3D join. Recompute the endpoint
 // incidence/point-ray scope from CURRENT Geometry, never trust renderer
 // supplied vertex group IDs, nearest listed depth or certification flags.
 const joins=deriveReviewedProjectedVertexJoins({geometry,revision});
 if(joins.status!=='scoped-projected-coincidences-only'||
    JSON.stringify(sceneDepthEvidence.projectedVertexJoins)!==
      JSON.stringify(joins))
  fail('source 3D vertex and projected junction evidence was changed');
 const endpoint=(edge,view,which)=>{
  const vertexKey=which==='from'?edge.fromVertexKey:edge.toVertexKey;
  const hits=joins.groups.filter(g=>g.view===view&&
   g.members.some(m=>m.sourceVertexKey===vertexKey));
  if(hits.length!==1)fail('missing or duplicate projected source vertex');
  const group=hits[0],sourcePoint=which==='from'?edge.from:edge.to;
  const uv=project(sourcePoint)[view];
  if(group.projectedModelMm.u!==uv.u||group.projectedModelMm.v!==uv.v)
   fail('source vertex projection disagrees with first-angle geometry');
  const member=group.members.find(m=>m.sourceVertexKey===vertexKey);
  if(!member.sourceIncidenceVerified||
     !member.incidentSourceEdgeIds.includes(edge.id)||
     member.visibleJoinCertified!==false||
     group.jointVisibilityCertified!==false)
   fail('false source-edge/endpoint join certificate');
  return {
   sourceVertexKey:vertexKey,projectedGroupKey:group.projectionKey,
   same3DPointWithinProjectedGroup:group.same3DPoint,
   distinct3DPointsShareProjection:group.distinct3DPointsShareProjection,
   nearestListedVertexKey:group.nearestListedSourceVertexKey,
   pointRayOcclusion:member.pointRayOcclusion,
   sourceIncidenceVerified:true,
   projectedEndpointJoinVisibilityVerified:false,
   officialEndpointLineStyleVerified:false
  };
 };
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
 const canonicalPairs=recomputeReviewedProjectedEdgeEvents(edgeInput);
 if(JSON.stringify(sceneDepthEvidence.edgeOverlapAudit)!==
     JSON.stringify(canonicalPairs))
  fail('forged or stale projected crossing/overlap event proof');
 const overlap=canonicalPairs.events;
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
 // A 3D source crease may change its physical UNION feature class even
 // when no projected mesh edge intersects at that paper coordinate.
 // Recompute exact original-crease axial events and INSERT their t values
 // into EXISTING M4 cutting positions, instead of building a new M4/V5
 // renderer. A new t cut is NOT a newly inferred source Geometry vertex.
 const unionSourceFeatures=auditOrthogonalUnionSourceEdges({geometry,revision});
 const scopedUnion=unionSourceFeatures.status===
  'source-orthogonal-union-open-sector-coverage';
 const unionByEdge=new Map(unionSourceFeatures.edges.map(x=>
  [x.sourceEdgeId,x]));
 let unionFeatureAddedCutCount=0;
 if(scopedUnion){
  for(const row of unionSourceFeatures.edges){
   if(!edges.has(row.sourceEdgeId))fail('untrusted union 3D source crease identity');
   for(const piece of row.subintervals){
    if(piece.sourceEdgeId!==row.sourceEdgeId||
       piece.canonicalV5LineActionAuthorized!==false)
     fail('forged union source interval V5 release');
    for(const view of VIEWS){
     const edge=edges.get(row.sourceEdgeId);
     const a=project(edge.from)[view],b=project(edge.to)[view];
     if(Math.hypot(a.u-b.u,a.v-b.v)<=1e-7)continue;
     for(const t of piece.sourceParameterOpenRange){
      if(t<=0||t>=1)continue;
      const key=row.sourceEdgeId+':'+view;
      if(!positions.get(key).includes(t))unionFeatureAddedCutCount++;
      insert(row.sourceEdgeId,view,t);
     }
    }
   }
  }
 }
 const segments=[];let scopedHiddenCount=0,scopedVisibleCount=0;
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
   if(segments.length>=3000)fail('partition complexity budget exceeded');
   const hidden=covered(ranges,t0,t1);
   // A non-hidden interval is NOT automatically visible. Independently
   // prove that EVERY positive observer ray along the whole source open
   // interval misses EVERY explicitly reviewed convex mesh solid.
   // A single possible touch/inward ray means UNCERTAIN, not visible.
   const clearance=!hidden?solids.map(solid=>
    certifyConvexSegmentClearance({
     source:{id:'CheckedEdge',from:edge.from,to:edge.to},
     solid,observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view],
     sourceParameterRange:[t0,t1]
    })):null;
   const visible=!hidden&&clearance.every(q=>q.status==='certified-clear');
   if(hidden)scopedHiddenCount++;
   if(visible)scopedVisibleCount++;
   const from=P(edge.from,edge.to,t0),to=P(edge.from,edge.to,t1);
   const unionEdge=unionByEdge.get(edge.id);
   const match=unionEdge?.subintervals.filter(piece=>
    piece.sourceParameterOpenRange[0]<=t0&&
    piece.sourceParameterOpenRange[1]>=t1)??[];
   if(scopedUnion&&unionEdge?.subintervals.length&&match.length!==1)
    fail('M4 stroke crosses a verified union-feature critical source event');
   const openUnionFeature=match[0]??null;
   segments.push({
    sourceGeometryId:edge.ownerId,sourceEdgeId:edge.id,view,
    sourceParameterRange:[t0,t1],
    unionOpenSourceFeatureStatus:openUnionFeature?.status??'not-covered',
    unionOpenSourceFeatureId:openUnionFeature?.id??null,
    unionOpenSourceFeatureVerified:
      openUnionFeature?.positiveUnionExternalCreaseVerified===true,
    unionOpenSourceBuriedOrFlatVerified:
      openUnionFeature?.positiveUnionBuriedOrFlatVerified===true,
    unionOriginalSourceEndpointJoinVerified:false,
    // Only original source-model endpoints carry shared incident-edge
    // topology. A newly split interior parameter is a PROJECTION event,
    // never a fabricated 3D object vertex.
    sourceEndpointJoins:{from:t0===0?endpoint(edge,view,'from'):null,
     to:t1===1?endpoint(edge,view,'to'):null},
    fromModelMm:from,toModelMm:to,
    projectedFromModelMm:project(from)[view],
    projectedToModelMm:project(to)[view],
    openInteriorVisibility:hidden?'hidden':visible?'visible':'undetermined',
    occluderGeometryIds:hidden?
     [...new Set(items.filter(e=>
       e.openSourceParameterRange[0]<=t0&&
       e.openSourceParameterRange[1]>=t1)
       .map(e=>e.occluderGeometryId))]:[],
    positiveClearanceSolidIds:visible?solids.map(s=>s.id):[],
    evidenceScope:hidden?'strict-forward-ray-convex-interior':
     visible?'strict-forward-ray-clearance-in-reviewed-solids':'none',
    joinVisibilityVerified:false,officialLineStyleVerified:false,
    canonicalIntentVerified:false,v5ActionApproved:false
   });
  }
 }
 // Genuine new source-face intersection features have NO historical
 // original mesh edge or M3 final-answer ConstructionIntent. Keep them
 // separate from `segments`, whose indices are already bound to the
 // legacy original-source M4 → DAG → sole V5 release gate.
 const generatedUnionCreaseEvidence=geometry.length>=2?
  proveGeneratedOrthogonalUnionCreases({geometry,revision}):null;
 const generatedSegments=[];let generatedCollapsedCount=0;
 if(generatedUnionCreaseEvidence?.status===
    'scoped-pairwise-new-perpendicular-face-open-features'){
  for(const sourceFeature of generatedUnionCreaseEvidence.segments){
   // Buried and unknown face intersections cannot become a candidate
   // printable stroke. Likewise, screen collapse is a point, not a line.
   if(!sourceFeature.positiveNewConcaveUnionOpenFeatureVerified)continue;
   for(const view of VIEWS){
    const proj=sourceFeature.projected[view];
    if(proj.kind==='collapsed-point'){generatedCollapsedCount++;continue;}
    if(generatedSegments.length>=600)
     fail('bounded generated source projection candidate budget exceeded');
    const from=sourceFeature.source3DFrom,
     to=sourceFeature.source3DTo;
    const source={id:'GeneratedSource'+generatedSegments.length,from,to};
    const occlusion=evaluateFullSourceSegmentOcclusion({
     source,solids,view});
    const rays=solids.map(solid=>certifyConvexSegmentClearance({
     source,solid,observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view]}));
    const clear=rays.every(r=>r.status==='certified-clear');
    const hidden=occlusion.entireSourceSegmentOccluded===true;
    if(clear&&hidden)
     fail('M0 generated source interval both strictly hidden and forward clear');
    generatedSegments.push({
     id:'M4NewFeature'+generatedSegments.length,revision,
     sourceGeneratedFeatureId:sourceFeature.id,
     sourceGeometryIds:[...sourceFeature.sourceGeometryIds],
     sourceFacePlanes:sourceFeature.sourceFacePlanes,
     sourceAxis:sourceFeature.sourceAxis,view,
     originalSourceMeshEdgeId:null,
     source3DFrom:{...from},source3DTo:{...to},
     projectedFromModelMm:{...proj.from},
     projectedToModelMm:{...proj.to},
     sourceParameterOpenRangeMm:[...sourceFeature.sourceParameterOpenRangeMm],
     localGeneratedUnionConcaveGeometryVerified:true,
     wholeOpenSourceForwardRayClearVerified:clear,
     wholeSourceStrictlyOccludedVerified:hidden,
     rayClassification:hidden?'strictly-occluded-by-reviewed-volume':
      clear?'forward-ray-clear-over-reviewed-solids':'undetermined',
     sourceOccluderGeometryIds:hidden?[...occlusion.occluderIds]:[],
     independentSolidForwardRayStatuses:rays.map((r,i)=>({
      sourceGeometryId:solids[i].id,status:r.status})),
     completeProjectiveJunctionsVerified:false,
     originalSourceMeshVertexInferred:false,
     entireMultiBodyContourVerified:false,
     officialEngineeringLineStyle:'undetermined',
     formalM3SolveResultVerified:false,
     canonicalIntentAndV5LineStepApproved:false
    });
   }
  }
 }
 return freeze({
  schema:'draftai-scoped-projected-stroke-partition/1',
  revision,status:'preview-partition-evidence-only',
  segmentCount:segments.length,segments,scopedHiddenCount,scopedVisibleCount,
  generatedUnionCreaseEvidence,
  generatedSegments,
  generatedProjectedCandidateCount:generatedSegments.length,
  generatedProjectedCollapsedCount:generatedCollapsedCount,
  generatedStrokeSignedCount:0,
  unionSourceFeatureScope:unionSourceFeatures.status,
  unionFeatureAddedCutCount,
  unionSourceFeatureOpenIntervalCount:unionSourceFeatures.intervalCount,
  officialLineStylesVerified:false,completeOcclusionVerified:false,
  canonicalIntentVerified:false,constructionStepDAGVerified:false,
  v5Ready:false
 });
}
module.exports={partitionReviewedSourceEdges};
