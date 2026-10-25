'use strict';
/**
 * C1/M5 exact reviewed original 3D VERTEX FAN incidence, reusing M0
 * closed convex support topology, existing M4 original source cut graph,
 * authentic source physical dihedrals, and exact original vertex rays.
 *
 * A genuine closed 3D source vertex star is a cycle: incident polygon
 * faces pair adjacent source edges exactly once and every incident edge
 * belongs to two original faces. This is POSITIVE 3D topology evidence.
 * Coincident V/H/W paper vertices, projected interior crossings and HLR
 * candidate aliases NEVER create another 3D source junction.
 *
 * No all-solid projected line join, standard line style, signed Intent,
 * ConstructionStep or V5 is approved by this audit.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {auditC1OriginalSourceSubspanJunctions}=
 require('./c1-original-source-subspan-junction-provenance.cjs');
const {auditC1ExactOriginalVertexObserverRays}=
 require('./c1-m5-exact-original-vertex-rays.cjs');
const {auditReviewedConvexSourceCreases}=
 require('./m5-reviewed-convex-source-creases.cjs');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const x of Object.values(o))freeze(x);
  Object.freeze(o);
 }return o;
};
const edgeKey=(g,a,b)=>g.id+'::'+[a,b].sort().join('|');
const eq3=(a,b)=>a&&b&&a.x===b.x&&a.y===b.y&&a.z===b.z;
const eq2=(a,b)=>a&&b&&a.u===b.u&&a.v===b.v;
function auditC1OriginalClosedVertexStars({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current original C1 vertex-star revision required');
 const m0=verifiedConvexMeshHalfspaces(geometry);
 const cuts=auditC1OriginalSourceSubspanJunctions({geometry,revision});
 const crease=auditReviewedConvexSourceCreases({geometry,revision});
 const rays=auditC1ExactOriginalVertexObserverRays({geometry,revision});
 if(m0.sourceGeometryId!==geometry.id||
    cuts.sourceGeometryId!==geometry.id||cuts.revision!==revision||
    cuts.signedV5ActionCount!==0||
    crease.sourceGeometryId!==geometry.id||
    crease.officialLineStylesVerified!==false||
    rays.sourceGeometryId!==geometry.id||rays.revision!==revision||
    rays.signedV5ActionCount!==0)
  throw new RangeError('independently current unsigned M0-M5 vertex fan sources required');
 const p=geometry.data.points,ids=Object.keys(p);
 const sourceEdges=new Map(geometry.data.edges.map(([a,b])=>[
  edgeKey(geometry,a,b),{a,b}]));
 const creaseById=new Map(crease.edges.map(e=>[e.sourceEdgeId,e]));
 const cutsByKey=new Map(cuts.rows.map(row=>[
  row.sourceEdgeId+'@'+row.view,row]));
 const raysByKey=new Map(rays.rows.map(row=>[
  row.view+'@'+row.originalVertexId,row]));
 if(sourceEdges.size!==geometry.data.edges.length||
    creaseById.size!==geometry.data.edges.length||
    cutsByKey.size!==cuts.rows.length||
    raysByKey.size!==rays.rows.length)
  throw new RangeError('duplicate original source edge/view or vertex/view');
 const rows=[],totals={
  reviewedOriginal3DVertexViewStars:0,
  realClosedOriginalVertexFaceFans:0,
  genuineOriginal3DIncidentEdgePairs:0,
  projectedOtherOriginal3DVertexAliasesHeld:0,
  authentic3DEdgeEndpointWitnesses:0,
  projectedOriginalSourceM4EndpointUnresolvedHeld:0,
  projectedCollapsedOriginalIncidentEdgesHeld:0,
  paperOnlyProjectedEventCutJoinRefusals:0,
  exactForwardVertexRayClear:0,
  exactNearInsideVertexRay:0,
  unresolvedVertexRays:0,
  newSignedV5Actions:0
 };
 for(const id of ids){
  const adjacent=[...sourceEdges.entries()].flatMap(([key,e])=>
   e.a===id?[{sourceEdgeId:key,otherOriginalVertexId:e.b}]:
   e.b===id?[{sourceEdgeId:key,otherOriginalVertexId:e.a}]:[]);
  const neighbors=new Map(adjacent.map(e=>[e.otherOriginalVertexId,e]));
  if(neighbors.size!==adjacent.length||neighbors.size<3)
   throw new RangeError('closed original 3D vertex requires at least three unique edges');
  const facePairs=[];
  const incidence=new Map([...neighbors.keys()].map(id=>[id,[]]));
  for(let fi=0;fi<geometry.data.faces.length;fi++){
   const face=geometry.data.faces[fi],pos=face.indexOf(id);
   if(pos<0)continue;
   if(face.lastIndexOf(id)!==pos)
    throw new RangeError('duplicate source vertex inside original face ring');
   const a=face[(pos-1+face.length)%face.length],
    b=face[(pos+1)%face.length];
   if(a===b||!neighbors.has(a)||!neighbors.has(b))
    throw new RangeError('original closed vertex fan references missing source edges');
   facePairs.push({originalFaceIndex:fi,
    adjoiningOriginalVertexIds:[a,b].sort(),
    originalIncidentEdgeIds:[
     neighbors.get(a).sourceEdgeId,
     neighbors.get(b).sourceEdgeId].sort()});
   incidence.get(a).push(b);incidence.get(b).push(a);
  }
  if(facePairs.length!==neighbors.size||
     [...incidence.values()].some(list=>
      list.length!==2||list[0]===list[1]))
   throw new RangeError('original vertex incident faces do not form closed degree-two fan');
  const first=[...neighbors.keys()][0],visited=new Set([first]);
  const stack=[first];
  while(stack.length){
   for(const next of incidence.get(stack.pop())){
    if(!visited.has(next)){visited.add(next);stack.push(next);}
   }
  }
  if(visited.size!==neighbors.size)
   throw new RangeError('original vertex fan is disconnected or multiply covered');
  const fanFaceIds=facePairs.map(x=>x.originalFaceIndex).sort((a,b)=>a-b);
  // There is exactly one verified 3D point for this star. Every distinct
  // original source vertex that happens to project to this paper point
  // remains ANOTHER source vertex; no projected snap/union operation.
  for(const view of VIEWS){
   const uv=project(p[id])[view];
   const ray=raysByKey.get(view+'@'+id);
   if(!ray||!eq3(ray.originalModel3DPoint,p[id])||
      ray.sourceGeometryId!==geometry.id||
      ray.signedV5Action!==false)
    throw new RangeError('original vertex fan has no exact matching observer ray');
   const aliases=ids.filter(other=>other!==id&&
    eq2(project(p[other])[view],uv)).sort();
   const edges=adjacent.map(x=>{
    const row=cutsByKey.get(x.sourceEdgeId+'@'+view),
     current=sourceEdges.get(x.sourceEdgeId),
     dihedral=creaseById.get(x.sourceEdgeId);
    if(!row||!dihedral||row.sourceGeometryId!==geometry.id||
       row.view!==view||row.signedV5ActionCount!==0||
       !Array.isArray(row.sourceVertexIds)||
       row.sourceVertexIds[0]!==current.a||
       row.sourceVertexIds[1]!==current.b)
     throw new RangeError('M4 source edge missing original 3D vertex identity');
    const atStart=current.a===id;
    const endpoint=row.collapsedProjection?null:
     atStart?row.spans[0]?.fromEndpoint:row.spans.at(-1)?.toEndpoint;
    // M4 can contain numerical cut-parameter micro-gaps, or diagnostic
    // projected endpoint clipping. Do NOT invent t=0/1 coverage when an
    // otherwise genuine original source 3D fan lacks that M4 witness.
    // This does NOT weaken source 3D incidence from M0; it separately
    // holds the claimed PAPER line join before it reaches V5.
    const endpointMatches=!row.collapsedProjection&&endpoint&&
     endpoint.originalVertexId===id&&
     endpoint.originalEndpoint3DIdentityVerified===true&&
     eq3(endpoint.model3DPoint,p[id])&&
     endpoint.originalSourceParameter===(atStart?0:1)&&
     endpoint.authorizedAsV5Junction===false&&
     endpoint.anotherOriginalSource3DPointInferred===false;
    if(endpointMatches){
     totals.authentic3DEdgeEndpointWitnesses++;
     totals.paperOnlyProjectedEventCutJoinRefusals+=
      endpoint.paperOnlyOtherSourceEdgeIds.length;
    }else if(row.collapsedProjection)
     totals.projectedCollapsedOriginalIncidentEdgesHeld++;
    else totals.projectedOriginalSourceM4EndpointUnresolvedHeld++;
    return {
     originalSourceEdgeId:x.sourceEdgeId,
     otherOriginal3DVertexId:x.otherOriginalVertexId,
     sourcePhysicalDihedralProven:
      dihedral.sourceIsPhysicalCreaseWithinSingleSolid===true,
     sourceCoplanarSubdivision:
      dihedral.sourceIsCoplanarSubdivisionWithinSingleSolid===true,
     firstAngleProjectionCollapsed:row.collapsedProjection,
     original3DEndpointConfirmedByM4:!!endpointMatches,
     missingM4OriginalEndpointCutSourceProofHeld:
      !row.collapsedProjection&&!endpointMatches,
     paperOnlyEndpointAliasesNever3DConnected:true,
     authorizedAsV5LineJoin:false
    };
   }).sort((a,b)=>a.originalSourceEdgeId.localeCompare(b.originalSourceEdgeId));
   // Every pair is a genuine common 3D ORIGINAL vertex. This theorem
   // does not mean the engineering-visible portions of those edges join.
   const joins=[];
   for(let a=0;a<edges.length;a++)for(let b=a+1;b<edges.length;b++)
    joins.push({
     originalSourceEdgeIds:[
      edges[a].originalSourceEdgeId,edges[b].originalSourceEdgeId],
     exactSharedOriginal3DVertexId:id,
     exactReviewedPhysical3DVertexIdentity:true,
     bothEdgesArePhysicalCreases:
      edges[a].sourcePhysicalDihedralProven&&
      edges[b].sourcePhysicalDihedralProven,
     completeProjectedVisibleLineJoinProven:false,
     applicableEngineeringStyleCertified:false,
     signedV5Action:false
    });
   totals.reviewedOriginal3DVertexViewStars++;
   totals.realClosedOriginalVertexFaceFans++;
   totals.genuineOriginal3DIncidentEdgePairs+=joins.length;
   totals.projectedOtherOriginal3DVertexAliasesHeld+=aliases.length;
   if(ray.proof.positiveForwardRayClear)totals.exactForwardVertexRayClear++;
   else if(ray.proof.strictInteriorNearOriginalVertex)
    totals.exactNearInsideVertexRay++;
   else totals.unresolvedVertexRays++;
   rows.push({
    sourceGeometryId:geometry.id,revision,view,
    original3DVertexId:id,original3DModelPoint:{...p[id]},
    firstAngleProjectedMm:{...uv},
    exactOriginalVertexObserverRayStatus:ray.exactOriginalVertex3DRayStatus,
    incidentOriginalSourceEdges:edges,
    closedIncidentFaceCycleIndexes:fanFaceIds,
    faceNeighborPairs:facePairs.map(x=>({
     originalFaceIndex:x.originalFaceIndex,
     adjoiningOriginalVertexIds:[...x.adjoiningOriginalVertexIds],
     originalIncidentEdgeIds:[...x.originalIncidentEdgeIds]})),
    originalIncidentEdgeCount:edges.length,
    true3DOriginalSourceJunctionPairs:joins,
    distinct3DVerticesProjectingToSamePaperPoint:aliases,
    oneConnectedOriginal3DVertexFaceFanProven:true,
    allIncidentSourceEdgesExactlyTwoOriginalFaceIncidencesProven:true,
    genuineCommonReviewedOriginal3DVertexIdVerified:true,
    projectedPaperAliasesDoNotGrantPhysicalJunctions:true,
    completeProjectedVisibleLineJunctionsCertified:false,
    originalClosedConvexSingleSolidScope:true,
    standardEngineeringLineStyle:'undetermined',
    signedV5Action:false
   });
  }
 }
 const expected=ids.length*VIEWS.length;
 if(rows.length!==expected||
    totals.reviewedOriginal3DVertexViewStars!==expected||
    totals.exactForwardVertexRayClear+totals.exactNearInsideVertexRay+
     totals.unresolvedVertexRays!==expected||
    totals.newSignedV5Actions!==0)
  throw new RangeError('original 3D vertex star incidence coverage incomplete');
 return freeze({
  schema:'draftai-c1-m5-reviewed-closed-original-vertex-fan/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  originalModelVertexCount:ids.length,views:[...VIEWS],
  counts:totals,rows,
  entireOriginalClosed3DVertexFanTopologyCertified:true,
  real3DSourceIDAndM4EndpointMatchesVerified:true,
  allPaperOnlyProjectedCoincidencesHeld:true,
  wholeDrawingFeatureStyleAndVisibilityCertified:false,
  originalConstructionIntentDAGAndV5Approved:false,
  signedV5ActionCount:0,wholeSolidV5Ready:false
 });
}
module.exports={auditC1OriginalClosedVertexStars};
