'use strict';
/**
 * Read-only M5 C2 join between *region-boundary ENDPOINTS* and the actual
 * original/generated 3D physical-source endpoint ledger.
 *
 * The occupancy region's V/H/W vertex is a PAPER vertex, not necessarily
 * one physical 3D vertex. We only identify its 3D point if a complete
 * local ray/source piece reaches the current endpoint AND its canonical
 * M5 paper group has an exact 3D source endpoint at the same paper point.
 * "Same 2D" never implies "same 3D" or a certified GB line cap.
 */
const {project}=require('../core/projection/conventions.js');
function reviewC2BoundaryPhysicalJunctions({
 revision,sourceGeometryIds,sourceBoundaries,boundaryRayEvidence,
 paperLines,physicalJunctionEvidence
}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    !Array.isArray(sourceGeometryIds)||sourceGeometryIds.length!==2||
    !Array.isArray(sourceBoundaries)||!Array.isArray(boundaryRayEvidence)||
    sourceBoundaries.length!==boundaryRayEvidence.length||
    !Array.isArray(paperLines)||
    !Array.isArray(physicalJunctionEvidence?.nodes)||
    physicalJunctionEvidence?.revision!==revision||
    physicalJunctionEvidence.status!==
     'source-recomputed-physical-3d-feature-incidence'||
    JSON.stringify(physicalJunctionEvidence.sourceGeometryIds)!==
     JSON.stringify(sourceGeometryIds))
  throw new TypeError('C2 physical junction needs current M5 3D and region evidence');
 const byPaper=new Map();
 for(const l of paperLines){
  if(l.revision!==revision||!l.paperGroupId||
     byPaper.has(l.paperGroupId)||
     !['V','H','W'].includes(l.view))
   throw new Error('C2 duplicate or outdated canonical paper group');
  byPaper.set(l.paperGroupId,l);
 }
 const same2=(a,b)=>a&&b&&a.u===b.u&&a.v===b.v;
 const finite3=p=>p&&['x','y','z'].every(k=>
  typeof p[k]==='number'&&Number.isFinite(p[k]));
 const key3=p=>[p.x,p.y,p.z].join('|');
 // Even when V=(x,z) looks valid, unprojected depth y must be finite.
 // The 3D ledger is the ONLY authority for a real multi-source junction.
 if(physicalJunctionEvidence.nodes.some(n=>
   !finite3(n?.point3D)||!Number.isSafeInteger(n.incidentSegmentCount)||
   n.incidentSegmentCount<1||
   typeof n.original3DPhysicalCoincidenceVerified!=='boolean'||
   typeof n.localMultiSourcePhysicalJunctionCandidate!=='boolean'))
  throw new TypeError('C2 native physical source junction ledger is incomplete');
 const actualNodes=new Map(physicalJunctionEvidence.nodes.map(n=>
  [key3(n.point3D),n]));
 if(actualNodes.size!==physicalJunctionEvidence.nodes.length)
  throw new Error('C2 duplicate M5 source physical node');
 const nodeMap=new Map(),edgeIds=new Set();
 for(let i=0;i<sourceBoundaries.length;i++){
  const edge=sourceBoundaries[i],ray=boundaryRayEvidence[i];
  const boundaryId=edge.view+':'+edge.id;
  if(edgeIds.has(boundaryId)||ray.id!==edge.id||ray.view!==edge.view||
     edge.revision!==revision||ray.revision!==revision||
     !['V','H','W'].includes(edge.view)||
     !Array.isArray(ray.paperPieces)||ray.paperPieces.length===0||
     ray.paperPieces.length>4096||
     ray.paperPieces[0].fromT!==0||
     ray.paperPieces.at(-1).toT!==1||
     ray.paperPieces.some((span,k)=>!span||
      !Number.isFinite(span.fromT)||!Number.isFinite(span.toT)||
      span.fromT<0||span.toT>1||span.fromT>=span.toT||
      (k>0&&span.fromT!==ray.paperPieces[k-1].toT))||
     edge.officialV5Approved!==false||
     ray.officialV5Approved!==false)
   throw new Error('C2 physical junction boundary/ray identity mismatch');
  const du=edge.to?.u-edge.from?.u,dv=edge.to?.v-edge.from?.v;
  // The true region boundary is a non-degenerate orthogonal paper span.
  // Merely touching an endpoint is not positive source coverage of that span.
  if(!Number.isFinite(du)||!Number.isFinite(dv)||
     (du===0&&dv===0)||(du!==0&&dv!==0))
   throw new Error('C2 first-angle boundary must have a finite positive axis span');
  edgeIds.add(boundaryId);
  for(const role of ['from','to']){
   const paper=role==='from'?edge.from:edge.to,
    piece=role==='from'?ray.paperPieces[0]:ray.paperPieces.at(-1);
   if(!Number.isFinite(paper.u)||!Number.isFinite(paper.v)||
      !piece||piece.officialV5Approved!==false||
      piece.completeClosedEndpointAndGlobalVisibilityCertified!==false||
      !Array.isArray(piece.sourceGroupIds))
    throw new Error('C2 junction endpoint has no bounded unsigned open source');
   const candidates=[];
   let invalidEndpointSourceGroup=false;
   if(new Set(piece.sourceGroupIds).size!==piece.sourceGroupIds.length)
    invalidEndpointSourceGroup=true;
   if(piece.exactCurrentPhysicalSourceAndOpenRayCorroborated===true){
    for(const groupId of piece.sourceGroupIds){
     const line=byPaper.get(groupId);
     if(!line||line.view!==edge.view||
        line.selectedWholeSource3DBooleanExteriorOpenFeatureVerified!==true||
        !['scoped-continuous-front-ray-clear',
          'scoped-continuous-front-ray-opaque'].includes(line.rayStatus)||
        !Array.isArray(line.physical3DEndpointIncidence)||
        line.physical3DEndpointIncidence.length!==2)
      throw new Error('C2 local ray claimed a missing or unverified true 3D paper group');
     let positiveEndpointSourceFound=false;
     const endpoints=[line.projectedFromModelMm,line.projectedToModelMm];
     for(const [index,xy] of endpoints.entries()){
      if(!same2(xy,paper))continue;
      const other=endpoints[1-index];
      // Require the source to head INTO this actual boundary, not just
      // touch the vertex from a perpendicular or outward-going 3D edge.
      const into=(other.u-paper.u)*du+(other.v-paper.v)*dv;
      const cross=(other.u-paper.u)*dv-(other.v-paper.v)*du;
      if(!Number.isFinite(into)||cross!==0||
         (role==='from'?into<=0:into>=0))continue;
      const candidate=line.physical3DEndpointIncidence[index]?.physicalSource3DPoint;
      if(candidate&&!finite3(candidate))
       throw new TypeError('C2 M5 3D source endpoint has a nonfinite hidden axis');
      if(candidate&&!same2(project(candidate)[edge.view],paper))
       throw new Error('C2 M5 original 3D endpoint contradicts its first-angle paper point');
      if(candidate&&same2(project(candidate)[edge.view],paper)){
       candidates.push({groupId,point3D:{...candidate}});
       positiveEndpointSourceFound=true;
      }
     }
     if(!positiveEndpointSourceFound)invalidEndpointSourceGroup=true;
    }
   }
   // Do not allow another valid group to mask an invalid/spurious source
   // claimed by this same local ray piece.
   const keys=invalidEndpointSourceGroup?[]:
    [...new Set(candidates.map(x=>key3(x.point3D)))];
   const resolved=keys.length===1?candidates[0].point3D:null;
   const incidence=Object.freeze({
    boundaryId:edge.id,role,revision,
    localSourceAndWholeOpenRayCorroborated:
     piece.exactCurrentPhysicalSourceAndOpenRayCorroborated===true,
    physicalPointCandidate:resolved?Object.freeze({...resolved}):null,
    allClaimedSourceGroupsReachPositiveBoundaryEndpoint:!invalidEndpointSourceGroup,
    unresolvedReason:invalidEndpointSourceGroup?
      'source-group-not-bound-to-positive-boundary-endpoint':
      piece.exactCurrentPhysicalSourceAndOpenRayCorroborated!==true?
      piece.unprovenLocalSourceOrRayReason:
      keys.length>1?'multiple-physical-source-endpoints-at-paper-vertex':
      keys.length===0?'paper-vertex-is-not-listed-source-endpoint':null,
    matchedCanonicalPaperGroups:Object.freeze(
     (invalidEndpointSourceGroup?[]:
      [...new Set(candidates.map(x=>x.groupId))]).sort()),
    closedGlobalOcclusionAndOfficialLineCapCertified:false
   });
   const k=edge.view+':'+paper.u+':'+paper.v;
   if(!nodeMap.has(k))nodeMap.set(k,{view:edge.view,point:paper,incidences:[]});
   nodeMap.get(k).incidences.push(incidence);
  }
 }
 const nodes=[...nodeMap.values()].sort((a,b)=>
  a.view.localeCompare(b.view)||a.point.u-b.point.u||a.point.v-b.point.v)
  .map((n,index)=>{
   const resolved=n.incidences.map(x=>x.physicalPointCandidate);
   const allResolved=n.incidences.length>=2&&resolved.every(Boolean);
   const points=new Map(resolved.filter(Boolean).map(p=>[key3(p),p]));
   const samePhysical=allResolved&&points.size===1;
   const alias=points.size>=2;
   const point=samePhysical?resolved[0]:null;
   const physicalNode=point?actualNodes.get(key3(point)):null;
   // A physical multi-edge node does not prove that TWO PAPER boundary
   // incidences meet there: both could reference the SAME canonical source.
   // Ambiguous/multiple groups also cannot identify which 3D edge joins.
   const sourceSets=n.incidences.map(row=>row.matchedCanonicalPaperGroups);
   const sourceGroupsIndependentlyBound=sourceSets.every(groups=>groups.length===1)&&
    new Set(sourceSets.map(groups=>groups[0])).size>=2;
   // Numerical co-location is not sufficient: one segment can end at a
   // projected corner while the paper has two different boundary incidences.
   // Demand actual recomputed M5 MULTI-feature proof and DISTINCT paper source
   // identities, never paper coordinates alone.
   const positive=!!physicalNode&&
    physicalNode.incidentSegmentCount>=2&&
    physicalNode.original3DPhysicalCoincidenceVerified===true&&
    physicalNode.localMultiSourcePhysicalJunctionCandidate===true&&
    sourceGroupsIndependentlyBound;
   const realJunction=samePhysical&&positive;
   const allAliasEndpointsListed=points.size>=2&&
    [...points.keys()].every(k=>actualNodes.has(k));
   const certifiedPaperAlias=alias&&allAliasEndpointsListed;
   return Object.freeze({
    id:'C2PaperJunction'+index,view:n.view,revision,
    paperPoint:Object.freeze({...n.point}),
    incidentBoundaryCount:n.incidences.length,
    incidences:Object.freeze(n.incidences),
    distinctReal3DEndpointCandidateCount:points.size,
    exactSame3DSourceEndpointCandidateAtAllIncidences:samePhysical,
    distinctCanonicalPaperSourceGroupsVerified:sourceGroupsIndependentlyBound,
    sourceLedgerMultiFeatureJunctionVerified:realJunction,
    realOriginalOrGenerated3DJunctionNodeListed:realJunction,
    paperOnlyDifferent3DDepthOrLocationAliasDetected:certifiedPaperAlias,
    unresolvedReal3DJunctionIncidence:!realJunction,
    globalClosedEndpointAndStandardLineStylesProven:false,
    officialV5JunctionAuthorized:false
   });
  });
 const physical=nodes.filter(n=>n.realOriginalOrGenerated3DJunctionNodeListed).length,
  alias=nodes.filter(n=>n.paperOnlyDifferent3DDepthOrLocationAliasDetected).length,
  unproven=nodes.filter(n=>!n.realOriginalOrGenerated3DJunctionNodeListed&&
   !n.paperOnlyDifferent3DDepthOrLocationAliasDetected).length;
 if(nodes.reduce((n,x)=>n+x.incidentBoundaryCount,0)!==
    2*sourceBoundaries.length||physical+alias+unproven!==nodes.length||
    nodes.some(n=>n.officialV5JunctionAuthorized!==false||
      n.globalClosedEndpointAndStandardLineStylesProven!==false))
  throw new Error('C2 first-angle paper junction endpoints do not conserve physical evidence');
 return Object.freeze({
  schema:'draftai-c2-first-angle-paper-versus-real-3d-junction-ledger/1',
  revision,sourceGeometryIds:Object.freeze([...sourceGeometryIds]),
  nodes:Object.freeze(nodes),paperJunctionCount:nodes.length,
  exactPhysical3DSourceNodeCount:physical,
  paperOnlyDifferent3DSourceAliasCount:alias,
  unresolvedPhysicalSourceJoinCount:unproven,
  allRegionBoundaryEndpointsAccountedFor:true,
  globalClosedEndpointEngineeringLineStylesProven:false,
  officialV5Authorized:false
 });
}
module.exports={reviewC2BoundaryPhysicalJunctions};
