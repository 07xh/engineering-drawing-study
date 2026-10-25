'use strict';
/**
 * M5 C2: a per-canonical-paper-open-interval FINAL LINE PRECONDITION
 * checklist, reusing the existing independent 3D source and ray proofs.
 *
 * A relatively foremost source among listed lines (even if wholly viewer
 * ray-clear) does NOT imply complete source-feature topology, global
 * silhouette, endpoint joins, standards, or an approved V5 draw command.
 * This is a machine-readable missing-proof ledger, NOT a second solver,
 * authoritative engineering style classifier or ConstructionStep factory.
 */
const {FIRST_ANGLE_OBSERVER_RAYS,project}=
 require('../core/projection/conventions.js');
const {auditUnifiedPaperSourceIdentity}=
 require('./m5-unified-paper-source-identity.cjs');
const {auditUnifiedPaperJunctions}=
 require('./m5-unified-paper-junctions.cjs');
const {auditC2SourceBoundBooleanOpenFeatures}=
 require('./m5-c2-source-bound-boolean-open-features.cjs');
const {createReviewedC2BooleanEndpointNeighborhood}=
 require('./m5-c2-boolean-endpoint-octant-neighborhood.cjs');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexPointRayClearance}=
 require('../core/numeric/convex-point-ray-clearance.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const same3=(a,b)=>a&&b&&a.x===b.x&&a.y===b.y&&a.z===b.z;
const same2=(a,b)=>a&&b&&a.u===b.u&&a.v===b.v;
const scalar=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const certifiedOpenRayClear=scope=>scope==='visible'||
 scope==='certified-whole-open-subspan-forward-rays-clear';
function auditUnifiedPaperLineReadiness({geometry,revision,
 projectedStrokePartitions,generatedSubspanRayEvidence,
 unifiedProjectedFeatureEventEvidence,unifiedPaperSourceIdentityEvidence,
 unifiedPaperJunctionEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('M5 canonical paper line requires current source revision');
 const paper=auditUnifiedPaperSourceIdentity({geometry,revision,
  projectedStrokePartitions,generatedSubspanRayEvidence,
  unifiedProjectedFeatureEventEvidence});
 if(paper.status!=='source-traced-canonical-projected-open-interval-registry'||
    JSON.stringify(paper)!==JSON.stringify(unifiedPaperSourceIdentityEvidence)||
    paper.signedV5LineActions!==0||paper.officialLineStylesVerified!==false||
    paper.v5Ready!==false||paper.allCandidatePiecesRetained!==true)
  throw new TypeError('stale or spoofed current reviewed 3D paper source identity');
 const junction=auditUnifiedPaperJunctions({geometry,revision,
  projectedStrokePartitions,generatedSubspanRayEvidence,
  unifiedProjectedFeatureEventEvidence,unifiedPaperSourceIdentityEvidence:paper});
 if(junction.status!=='real-source-reviewed-first-angle-paper-endpoint-incidence'||
    JSON.stringify(junction)!==JSON.stringify(unifiedPaperJunctionEvidence)||
    junction.signedV5LineActions!==0||
    junction.officialLineStylesVerified!==false||
    junction.allSourceOpenLineEndpointIncidencesAccountedFor!==true)
  throw new TypeError('stale or spoofed current 3D paper junction identities');
 // Independent M0 halfspaces from the same CURRENT, source-reviewed
 // Geometry; never trust a page's endpoint ray labels or a listed
 // competing edge as proof of opaque-FACE visibility. One proof per
 // physical view/point and complete solid scene, memoized for junctions
 // shared by many original/generated source candidates.
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8||
    new Set(geometry.map(g=>g.id)).size!==geometry.length)
  throw new TypeError('distinct bounded reviewed 3D opaque source scene required');
 const solids=geometry.map(g=>{
  const verified=verifiedConvexMeshHalfspaces(g);
  if(verified.status!=='validated-closed-convex-mesh')
   throw new TypeError('current closed 3D opaque source halfspaces required');
  return {id:g.id,halfspaces:verified.halfspaces};
 });
 const pointRayCache=new Map();
 const auditEndpointRay=(view,point)=>{
  if(!point)return {allSolidsRayClear:false,witnesses:[]};
  const k=view+':'+point.x+':'+point.y+':'+point.z;
  if(pointRayCache.has(k))return pointRayCache.get(k);
  const ray=FIRST_ANGLE_OBSERVER_RAYS[view];
  if(!ray)throw new TypeError('first-angle observer ray required');
  const witnesses=solids.map(solid=>{
   const proof=certifyConvexPointRayClearance({
    point,observerDirection:ray,solid});
   if(proof.solidId!==solid.id||
      proof.positiveOpenRayClearVerified!==(proof.status==='certified-clear')||
      proof.officialLineStyleVerified!==false||proof.v5Ready!==false)
    throw new TypeError('invalid M0 source point ray contract');
   return {sourceGeometryId:solid.id,rayStatus:proof.status,
    positiveOpenRayClearVerified:proof.positiveOpenRayClearVerified,
    witnessReason:proof.reason};
  });
  const result={allSolidsRayClear:witnesses.length===solids.length&&
   witnesses.every(x=>x.positiveOpenRayClearVerified),
   witnesses};
  pointRayCache.set(k,result);
  return result;
 };
 // Reuse the real original AND generated M0 3D union cross-section
 // auditors. Do not promote a paper stroke without WHOLE source-axial
 // Boolean exterior coverage, even if its midpoint looks exposed.
 const booleanSource=auditC2SourceBoundBooleanOpenFeatures({
  geometry,revision,unifiedPaperSourceIdentityEvidence:paper});
 if(!booleanSource.allPaperSourcesAccountedFor||
    booleanSource.paperIntervalCount!==paper.paperIntervalCount||
    booleanSource.signedV5LineActions!==0||booleanSource.v5Ready!==false)
  throw new TypeError('incomplete or signed 3D Boolean source lineage');
 const booleanByPaper=new Map(booleanSource.lines.map(x=>[x.paperGroupId,x]));
 const booleanBySubspan=new Map(booleanSource.lines.flatMap(x=>
  x.contributions.map(c=>[c.sourceSubspanId,c])));
 const octantNeighborhood=createReviewedC2BooleanEndpointNeighborhood({
  geometry,revision});
 if(octantNeighborhood.signedV5LineActions!==0||
    octantNeighborhood.v5Ready!==false)
  throw new TypeError('3D Boolean endpoint occupancy cannot sign C2 lines');
 const groupedNodes=new Map(junction.paperNodes.map(n=>[
  n.view+':'+n.paperCoordinateMm.u+':'+n.paperCoordinateMm.v,n]));
 // Each reviewed M4 event subspan has its OWN actual 3D coordinates and
 // preexisting M0 whole-open-ray proof. This is a source JOIN ledger,
 // not a new projected intersection solver or a drawing-line signer.
 const subspans=new Map();
 for(const group of paper.groups)for(const source of group.sourceSubspans){
  if(subspans.has(source.sourceSubspanId))
   throw new TypeError('duplicate real source subspan in paper registry');
  subspans.set(source.sourceSubspanId,{...source,view:group.view});
 }
 const result=[];
 for(const group of paper.groups){
  if(group.revision!==revision||group.sourceMultiplicity!==
      group.sourceSubspans.length||
     group.applicableEngineeringLineStyle!=='undetermined'||
     group.formalConstructionIntentDAGAndV5Approved!==false||
     group.soleFinalDrawingSourceForThisPaperSegmentCertified!==false)
   throw new TypeError('unsigned original/new paper source group required');
  const selected=group.sourceSubspans.find(s=>
   s.sourceSubspanId===group.nearestListed3DSourceSubspanId);
  const originalAndNewBoolean=booleanByPaper.get(group.id);
  if(!originalAndNewBoolean||
     originalAndNewBoolean.sourceMultiplicity!==group.sourceMultiplicity||
     originalAndNewBoolean.selectedSourceSubspanId!==
      group.nearestListed3DSourceSubspanId||
     originalAndNewBoolean.officialEngineeringLineStyle!=='undetermined'||
     originalAndNewBoolean.canonicalV5ActionSigned!==false)
   throw new TypeError('true original/new 3D Boolean proof source not bound to paper');
  const wholeBooleanExterior=
   originalAndNewBoolean.selectedWhole3DBooleanExteriorOpenSourceVerified;
  if(group.relativeNearestListed3DSourceLineVerified!==Boolean(selected))
   throw new TypeError('paper winning source has no reviewed 3D identity');
  const ray=FIRST_ANGLE_OBSERVER_RAYS[group.view];
  const endpoint=(role)=>{
   const xy=role==='from'?group.projectedFromModelMm:
    group.projectedToModelMm;
   const node=groupedNodes.get(group.view+':'+xy.u+':'+xy.v);
   if(!node||!same2(xy,node.paperCoordinateMm))
    throw new TypeError('canonical paper interval lacks its genuine projected endpoint node');
   const p=selected?.[role+'3D']??null;
   const incident=selected?node.incidentSourceEndpoints.filter(e=>
    e.unifiedSubspanId===selected.sourceSubspanId&&
    same3(e.real3DEndpoint,p)):[];
   if(selected&&incident.length!==1)
    throw new TypeError('selected real 3D source endpoint is missing from physical junction');
   const otherNodes=node.distinctPhysical3DNodes.filter(x=>
    !p||!same3(x.real3DPoint,p));
   const depth=p?scalar(p,ray):null;
   const definiteAhead=p?otherNodes.every(other=>
    depth>other.observerDotDepthMm+1e-8):false;
   const paperDepthAlias=otherNodes.length>0;
   // Certified LOCAL open-ray continuity at this actual 3D point:
   // both adjacent source FEATURES must own this very point, rather
   // than merely sharing paper coordinates or being 1e-8 mm near.
   // The original junction ledger independently lists every physical
   // pair; require a corresponding exact pair with no depth alias.
   const partnerIds=new Set();
   if(selected&&certifiedOpenRayClear(selected.sourceObserverRayScope)){
    for(const other of node.incidentSourceEndpoints){
     if(other.unifiedSubspanId===selected.sourceSubspanId||
        !same3(other.real3DEndpoint,p))continue;
     const peer=subspans.get(other.unifiedSubspanId);
     if(!peer||peer.view!==group.view||
        !certifiedOpenRayClear(peer.sourceObserverRayScope))continue;
     const from=same3(peer.from3D,p),to=same3(peer.to3D,p);
     if(from===to)continue;
     const witnessed=node.localPairwise3DJunctionRelations.some(join=>
      join.exactlySharedPhysical3DEndpoint===true&&
      join.paperOnlyDepthAlias===false&&
      join.sourceSubspanIds.includes(selected.sourceSubspanId)&&
      join.sourceSubspanIds.includes(other.unifiedSubspanId));
     if(!witnessed)continue;
     partnerIds.add(peer.sourceSubspanId);
    }
   }
   const locallyJoined=[...partnerIds].sort();
   const currentSourceBoolean=selected?
    booleanBySubspan.get(selected.sourceSubspanId):null;
   const toward=selected?
    (role==='from'?selected.to3D:selected.from3D):null;
   const closedNeighborhood=p&&toward?
    octantNeighborhood.inspect(p,toward):null;
   const sourceEndpointBoolean=Boolean(wholeBooleanExterior&&
    currentSourceBoolean?.entireReal3DSourceOpenIntervalBooleanExteriorVerified&&
    closedNeighborhood?.localClosedUnionBoundaryWithOutgoingSourceVerified);
   const locallyJoinedExteriorPartnerIds=sourceEndpointBoolean?
    locallyJoined.filter(sourceId=>{
     const peer=subspans.get(sourceId),
      corresponding=booleanBySubspan.get(sourceId);
     if(!peer||!corresponding?.
        entireReal3DSourceOpenIntervalBooleanExteriorVerified)return false;
     const other=same3(peer.from3D,p)?peer.to3D:peer.from3D;
     const proof=octantNeighborhood.inspect(p,other);
     return proof?.localClosedUnionBoundaryWithOutgoingSourceVerified===true;
    }):[];
   const pointRay=auditEndpointRay(group.view,p);
   // Point at t=0 can be a shared Boolean boundary/tangency. The M0
   // result proves only the OPEN observer ray t>0, never the full
   // closed endpoint, tangent topology, linecap or engineering style.
   const openRayWithTrueJoinedSources=locallyJoined.length>0&&
    pointRay.allSolidsRayClear&&
    Boolean(selected)&&certifiedOpenRayClear(selected.sourceObserverRayScope);
   return {role,projectedModelMm:{...xy},
    physicalSource3DPoint:p?{...p}:null,
    physicalPaperNodeId:node.id,
    genuineSelectedSource3DIncidenceVerified:Boolean(selected)&&incident.length===1,
    otherDistinct3DPointsOnSamePaperEndpointCount:otherNodes.length,
    paperDepthAliasPresent:paperDepthAlias,
    selectedSourceDefinitelyFrontOfOtherListedEndpointNodes:
     Boolean(selected)&&(!paperDepthAlias||definiteAhead),
    exactlyJoinedOtherWholeOpenRayClearSourceSubspanIds:locallyJoined,
    localExact3DSourcePairAndBothOpenRaysClearVerified:
     locallyJoined.length>0,
    allCurrentOpaqueSolidEndpointObserverRayWitnesses:
     pointRay.witnesses.map(x=>({...x})),
    currentSceneOpaqueSolidCount:solids.length,
    currentPhysical3DPointPositiveObserverOpenRayClearVerified:
     pointRay.allSolidsRayClear,
    locallyJoinedSourcesAndEndpointObserverOpenRayClearVerified:
     openRayWithTrueJoinedSources,
    real3DBooleanClosedEndpointNeighborhoodWitness:
     closedNeighborhood,
    localClosedUnionEndpointBoundaryAndSourceDirectionVerified:
     sourceEndpointBoolean,
    trulyExteriorBothSourceFeatureJoinIdsAtClosedNeighborhood:
     locallyJoinedExteriorPartnerIds,
    jointSourceBooleanAndClosedNeighborhoodAndAllSolidOpenRayVerified:
     sourceEndpointBoolean&&pointRay.allSolidsRayClear&&
     locallyJoinedExteriorPartnerIds.length>0,
    // A different source feature may pass through the same 3D node
    // while its physical tangent/Boolean exterior is NOT continuous.
    actualGlobalFeatureAndEndpointVisibilityCertified:false,
    physical3DEndpointJoinAndDrawingLinecapCertified:false};
  };
  const ends=[endpoint('from'),endpoint('to')];
  if(selected&&(!same2(project(selected.from3D)[group.view],
     group.projectedFromModelMm)||!same2(project(selected.to3D)[group.view],
     group.projectedToModelMm)))
   throw new TypeError('paper source winner does not correspond to model projections');
  const scope=selected?.sourceObserverRayScope??'no-unique-3d-source';
  const clear=certifiedOpenRayClear(scope);
  const hidden=scope==='hidden'||
    scope==='certified-whole-open-subspan-strictly-occluded';
  if(clear&&hidden)throw new RangeError('contradictory source visibility');
  const missing=[];
  if(!selected)missing.push('unique-frontmost-authentic-3d-source-not-proven');
  if(group.sourceMultiplicity>1&&
     group.repeatedIdenticalReal3DSourceFeature)
   missing.push('duplicate-real-3d-feature-still-needs-deduplicated-source-identity');
  if(selected&&!clear&&!hidden)
   missing.push('positive-continuous-observer-ray-visibility-undetermined');
  if(!wholeBooleanExterior)
   missing.push('complete-original-or-generated-3d-boolean-exterior-open-feature-unproven');
  if(ends.some(e=>e.paperDepthAliasPresent))
   missing.push('projected-endpoint-has-different-depth-real-3d-nodes');
  missing.push('global-complete-boolean-exterior-and-final-paper-contour');
  missing.push('all-crossing-overlap-occlusion-switches-and-endpoint-joins');
  missing.push('applicable-engineering-line-style-standard');
  missing.push('independent-m3-final-solve-result-and-original-drawing-source');
  missing.push('single-v5-construction-intent-dag-and-action-parity');
  result.push({id:'M5LineReady'+result.length,revision,
   paperGroupId:group.id,view:group.view,
   projectedFromModelMm:{...group.projectedFromModelMm},
   projectedToModelMm:{...group.projectedToModelMm},
   sourceMultiplicity:group.sourceMultiplicity,
   selectedListed3DSourceSubspanId:selected?.sourceSubspanId??null,
   nearestListed3DSourceOnlyVerified:Boolean(selected),
   booleanOriginalOrGeneratedFeatureWitness:
    originalAndNewBoolean.contributions.map(x=>({...x})),
   selectedWholeSource3DBooleanExteriorOpenFeatureVerified:
    wholeBooleanExterior,
   originalAndNew3DBooleanOpenSourceTraceComplete:true,
   selectedSourceWholeOpenRayClearVerified:Boolean(selected)&&clear,
   selectedSourceWholeOpenRayStrictlyOccludedVerified:
    Boolean(selected)&&hidden,
   rayStatus:!selected?'no-unique-3d-source':
    clear?'scoped-continuous-front-ray-clear':
    hidden?'scoped-continuous-front-ray-opaque':'undetermined',
   physical3DEndpointIncidence:ends,
   localExact3DJunctionWithTwoWholeOpenRaysCount:ends.filter(e=>
    e.localExact3DSourcePairAndBothOpenRaysClearVerified).length,
   localBothEndpointSourceOpenRayJoinsVerified:ends.every(e=>
    e.localExact3DSourcePairAndBothOpenRaysClearVerified),
   independentlyClearEndpointPositiveOpenRayCount:ends.filter(e=>
    e.currentPhysical3DPointPositiveObserverOpenRayClearVerified).length,
   bothEndpointPositiveOpenRaysAndLocalJoinsVerified:ends.every(e=>
    e.locallyJoinedSourcesAndEndpointObserverOpenRayClearVerified),
   localClosed3DBooleanEndpointCount:ends.filter(e=>
    e.localClosedUnionEndpointBoundaryAndSourceDirectionVerified).length,
   bothEndpointLocalBooleanAndOpaqueRayAndRealSourceJoinVerified:
    ends.every(e=>
     e.jointSourceBooleanAndClosedNeighborhoodAndAllSolidOpenRayVerified),
   // The 8-octant theorem establishes local t=0 union boundary
   // membership. Full paper junction, all caps, and final linecap remain
   // separate globally unproved obligations.
   // Still do not promote local OPEN ray witnesses to a CLOSED ENDPOINT
   // clearance guarantee, Boolean exterior or standard drawing stroke.
   fullClosedEndpointAndAllOpaqueFacesVerified:false,
   allListedOriginalAndNewSourceContributionsRetained:true,
   positiveGlobalFinalContourCompletenessVerified:false,
   allProjectedCrossingsAndDepthTransitionsFullyResolved:false,
   officialEngineeringSolidDashedStyle:'undetermined',
   missingProofObligations:missing,
   formalV5StrokeSigned:false});
 }
 const noStyle=result.every(x=>x.formalV5StrokeSigned===false&&
  x.officialEngineeringSolidDashedStyle==='undetermined'&&
  x.missingProofObligations.length>=5);
 if(!noStyle||result.length!==paper.paperIntervalCount)
  throw new RangeError('final paper-source stroke proof ledger incomplete');
 return freeze({schema:'draftai-m5-unified-paper-line-readiness/1',
  revision,status:'per-paper-interval-final-stroke-proof-blockers',
  sourceGeometryIds:geometry.map(x=>x.id),
  booleanSourceOpenFeatureEvidence:booleanSource,
  paperIntervalCount:result.length,lines:result,
  selectedWhole3DBooleanExteriorOpenSourceCount:result.filter(x=>
   x.selectedWholeSource3DBooleanExteriorOpenFeatureVerified).length,
  uniquelyListedSourceCount:result.filter(x=>
   x.nearestListed3DSourceOnlyVerified).length,
  scopedClearFrontRayCandidateCount:result.filter(x=>
   x.selectedSourceWholeOpenRayClearVerified).length,
  scopedOpaqueFrontRayCandidateCount:result.filter(x=>
   x.selectedSourceWholeOpenRayStrictlyOccludedVerified).length,
  nonuniqueSourceGroupCount:result.filter(x=>
   !x.nearestListed3DSourceOnlyVerified).length,
  depthAliasEndpointLineCount:result.filter(x=>
   x.physical3DEndpointIncidence.some(e=>e.paperDepthAliasPresent)).length,
  locallyJoinedContinuousRayEndpointCount:result.reduce((n,x)=>n+
   x.localExact3DJunctionWithTwoWholeOpenRaysCount,0),
  bothEndpointLocallyJoinedContinuousRayLineCount:result.filter(x=>
   x.localBothEndpointSourceOpenRayJoinsVerified).length,
  independentlyClearPhysicalEndpointOpenRayCount:result.reduce((n,x)=>n+
   x.independentlyClearEndpointPositiveOpenRayCount,0),
  locallyJoinedAndEndpointOpenRayClearCount:result.reduce((n,x)=>n+
   x.physical3DEndpointIncidence.filter(e=>
    e.locallyJoinedSourcesAndEndpointObserverOpenRayClearVerified).length,0),
  fullyPairedLocalEndAndOpenRayLineCount:result.filter(x=>
   x.bothEndpointPositiveOpenRaysAndLocalJoinsVerified).length,
  locallyValidatedClosed3DBooleanEndpointCount:result.reduce((n,x)=>n+
   x.localClosed3DBooleanEndpointCount,0),
  fullyJointLocalBooleanAndOpaqueRayCandidateCount:result.reduce((n,x)=>n+
   x.physical3DEndpointIncidence.filter(e=>
    e.jointSourceBooleanAndClosedNeighborhoodAndAllSolidOpenRayVerified).length,0),
  locallyPairedBooleanRayAndPhysicalJoinLineCount:result.filter(x=>
   x.bothEndpointLocalBooleanAndOpaqueRayAndRealSourceJoinVerified).length,
  allReviewedSourcePaperOpenIntervalsHaveExplicitBlockers:true,
  entireFinalDrawingFeatureGraphVerified:false,
  officialLineStylesVerified:false,
  signedV5LineActions:0,v5Ready:false});
}
module.exports={auditUnifiedPaperLineReadiness};
