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
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const same3=(a,b)=>a&&b&&a.x===b.x&&a.y===b.y&&a.z===b.z;
const same2=(a,b)=>a&&b&&a.u===b.u&&a.v===b.v;
const scalar=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
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
 const groupedNodes=new Map(junction.paperNodes.map(n=>[
  n.view+':'+n.paperCoordinateMm.u+':'+n.paperCoordinateMm.v,n]));
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
   return {role,projectedModelMm:{...xy},
    physicalSource3DPoint:p?{...p}:null,
    physicalPaperNodeId:node.id,
    genuineSelectedSource3DIncidenceVerified:Boolean(selected)&&incident.length===1,
    otherDistinct3DPointsOnSamePaperEndpointCount:otherNodes.length,
    paperDepthAliasPresent:paperDepthAlias,
    selectedSourceDefinitelyFrontOfOtherListedEndpointNodes:
     Boolean(selected)&&(!paperDepthAlias||definiteAhead),
    physical3DEndpointJoinAndDrawingLinecapCertified:false};
  };
  const ends=[endpoint('from'),endpoint('to')];
  if(selected&&(!same2(project(selected.from3D)[group.view],
     group.projectedFromModelMm)||!same2(project(selected.to3D)[group.view],
     group.projectedToModelMm)))
   throw new TypeError('paper source winner does not correspond to model projections');
  const scope=selected?.sourceObserverRayScope??'no-unique-3d-source';
  const clear=scope==='visible'||
    scope==='certified-whole-open-subspan-forward-rays-clear';
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
   selectedSourceWholeOpenRayClearVerified:Boolean(selected)&&clear,
   selectedSourceWholeOpenRayStrictlyOccludedVerified:
    Boolean(selected)&&hidden,
   rayStatus:!selected?'no-unique-3d-source':
    clear?'scoped-continuous-front-ray-clear':
    hidden?'scoped-continuous-front-ray-opaque':'undetermined',
   physical3DEndpointIncidence:ends,
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
  paperIntervalCount:result.length,lines:result,
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
  allReviewedSourcePaperOpenIntervalsHaveExplicitBlockers:true,
  entireFinalDrawingFeatureGraphVerified:false,
  officialLineStylesVerified:false,
  signedV5LineActions:0,v5Ready:false});
}
module.exports={auditUnifiedPaperLineReadiness};
