'use strict';
/**
 * C3 conservative joint gate: connect independently recomputed M3 topology
 * with M5 first-angle open-ray certificates, without inferring line styles.
 * This is evidence aggregation, NOT an official drawing authorization.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditFiniteCylinderEndpointIncidence}=require('./m5-analytic-cylinder-endpoint-incidence.cjs');
const {auditFiniteCylinderWRayIntervals}=require('./m5-finite-cylinder-w-ray-intervals.cjs');
const {auditFiniteCylinderVHAxisRays}=require('./m5-finite-cylinder-vh-axis-rays.cjs');
const {auditC3TransitionRays}=require('./c3-transition-ray-candidates.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))freeze(x);Object.freeze(o);
}return o;};
function buildTransitionGuards(intervals,junctionGuards,input,projectedCoincidences){
 const result=[];
 for(const view of ['V','H','W']){
  const byBranch=new Map();
  for(const row of intervals.filter(i=>i.view===view)){
   if(!byBranch.has(row.branchId))byBranch.set(row.branchId,[]);
   byBranch.get(row.branchId).push(row);
  }
  for(const [branchId,parts] of byBranch){
   parts.sort((a,b)=>a.xOpenRange[0]-b.xOpenRange[0]);
   for(let i=1;i<parts.length;i++){
    const left=parts[i-1],right=parts[i];
    const same=left.openInteriorStatus===right.openInteriorStatus&&
      left.openInteriorStatus!=='undetermined';
    result.push({view,branchId,transitionX:left.xOpenRange[1],
     leftOpenStatus:left.openInteriorStatus,rightOpenStatus:right.openInteriorStatus,
     equalCertifiedOpenStatuses:same,
     endpointRayContinuityVerified:false,
     occlusionSwitchPointVerified:false,
     standardLineStyle:'undetermined',v5ActionAuthorized:false,
     blockers:['critical-ray-event-endpoint-not-proven',
      'projected-feature-overlap-and-standard-line-style-not-proven']});
   }
  }
  for(const j of junctionGuards){
   const incident=intervals.filter(i=>i.view===view&&
    j.incidentBranchIds.includes(i.branchId));
   const branchCoverage=j.incidentBranchIds.every(id=>
    incident.some(i=>i.branchId===id));
   const incidentOpenStatuses=[...new Set(incident.map(i=>i.openInteriorStatus))];
   const coincidentJunctions=projectedCoincidences
    .filter(p=>p.view===view&&p.junctionIds.includes(j.junctionId));
   const projectionOverlapUndetermined=true;
   result.push({view,junctionId:j.junctionId,
    projectedCoincidentJunctionIds:[...new Set(coincidentJunctions
     .flatMap(p=>p.junctionIds.filter(id=>id!==j.junctionId)))].sort(),
    distinctPhysicalPointsSharingProjection:coincidentJunctions.some(p=>
     p.distinct3DPhysicalPoints),
    incidentBranchesCoveredInView:branchCoverage,
    incidentOpenStatuses,projectionOverlapUndetermined,
    finiteCylinderRayCandidates:auditC3TransitionRays({input,point:j.point3D,view}),
    incidentBranchIds:[...j.incidentBranchIds],
    localC1JoinVerified:j.localC1JoinVerified,
    endpointRayContinuityVerified:false,
    occlusionSwitchPointVerified:false,
    standardLineStyle:'undetermined',v5ActionAuthorized:false,
    blockers:[...j.blockers,
     'projected-coincidence-and-other-feature-overlap-not-proven',
     ...(branchCoverage?[]:['incident-branch-view-coverage-missing'])]});
  }
 }
 return result;
}
function auditC3JointTopologyVisibility({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('C3 current source revision required');
 const m3=evaluateUnifiedMath({kind:'finite-orthogonal-cylinder-intersection',input,revision});
 const notCovered=()=>freeze({schema:'draftai-c3-joint-topology-visibility/1',
  revision,status:'not-covered',sourceStatus:m3.status,intervals:[],
  allSourceBranchesAccountedFor:false,fullCurveTopologyVerified:false,
  allViewsContinuousVisibilityVerified:false,officialLineStylesVerified:false,
  constructionIntentAuthorized:false,v5CurveReady:false});
 if(m3.status!=='scoped-analytic-ready')return notCovered();
 const topology=auditFiniteCylinderEndpointIncidence({input,revision});
 const w=auditFiniteCylinderWRayIntervals({input,revision});
 const vh=auditFiniteCylinderVHAxisRays({input,revision});
 if(topology.status!=='scoped-analytic-3d-endpoint-incidence'||
  w.status!=='source-bounded-W-open-rays'||
  vh.status!=='scoped-analytic-VH-strict-volume-occlusion'||
  !topology.allAnalyticSourceBranchesAccountedFor||
  !w.sourceBranchCoverageVerified||!vh.sourceBranchCoverageVerified||
  [topology.sourceM3BranchCount,w.sourceBranchCount,vh.sourceBranchCount]
   .some(n=>n!==m3.branchCount))
  throw new RangeError('C3 joint evidence source branch coverage mismatch');
 const sourceIds=new Set(m3.branches.map(b=>b.id));
 const walked=topology.components.flatMap(c=>c.traversal.map(e=>e.branchId));
 if(walked.length!==sourceIds.size||new Set(walked).size!==sourceIds.size||
  walked.some(id=>!sourceIds.has(id)))
  throw new RangeError('C3 physical source graph is incomplete or duplicated');
 const unresolvedJunctions=topology.junctions.filter(j=>
  !j.localC1ContinuationWithinLateralLateralScopeVerified&&
  !((j.incidentBranchIds.length===1)&&j.finiteCapTermination));
 const junctionGuards=topology.junctions.map(j=>({
  junctionId:j.id,point3D:{...j.point3D},incidentBranchIds:[...j.incidentBranchIds],
  classification:j.classification,
  finiteCapTermination:j.finiteCapTermination,
  localC1JoinVerified:j.localC1ContinuationWithinLateralLateralScopeVerified,
  fullFeatureJoinAuthorized:false,
  blockers:[
   ...(j.finiteCapTermination?['finite-cap-other-surface-continuation-unverified']:[]),
   ...(!j.localC1ContinuationWithinLateralLateralScopeVerified&&
     j.incidentBranchIds.length>1?['singular-or-multibranch-continuation-undetermined']:[]),
   'three-view-endpoint-visibility-not-certified',
   'full-solid-boundary-feature-topology-not-certified'
  ]
 }));
 const topologyComponents=topology.components.map(component=>({
  componentId:component.id,topologicalShape:component.topologicalShape,
  branchTraversal:component.traversal.map(edge=>({
   branchId:edge.branchId,
   fromJunctionId:edge.sourceFromJunctionId,
   toJunctionId:edge.sourceToJunctionId,
   directionInX:edge.directionInX,
   formalDrawingOrderAuthorized:false
  })),
  analyticGraphWithinScopeVerified:
   component.graphPathOrCycleVerifiedWithinLateralLateralScope===true,
  fullSolidBoundaryTopologyVerified:false,
  standardStrokeAuthorization:false
 }));
 const intervals=[];
 for(const b of m3.branches)for(const view of ['V','H','W']){
  const pieces=(view==='W'?w.intervals:vh.intervals)
   .filter(i=>i.branchId===b.id&&i.view===view)
   .sort((a,c)=>a.xOpenRange[0]-c.xOpenRange[0]);
  if(!pieces.length||pieces[0].xOpenRange[0]!==b.xRange[0]||
   pieces.at(-1).xOpenRange[1]!==b.xRange[1]||
   pieces.some((p,i)=>i>0&&p.xOpenRange[0]!==pieces[i-1].xOpenRange[1]))
   throw new RangeError('C3 M5 view interval partition incomplete');
  for(const p of pieces){
   const certifiedOccluded=view==='W'?
    p.status==='certified-continuously-occluded-open-interval':
    p.positiveOpaqueVolumeAheadForEveryOpenCurvePoint===true;
   const certifiedClear=view==='W'&&
    p.status==='certified-continuously-visible-open-interval';
   intervals.push({view,branchId:b.id,xOpenRange:[...p.xOpenRange],
    openInteriorStatus:certifiedOccluded?'occluded':
     certifiedClear?'clear':'undetermined',
    originalM5EvidenceId:p.id,sourceM3AnalyticBranchVerified:true,
    physicalGraphBranchAccountedFor:true,
    endpointVisibilityVerified:false,
    blockers:[
     ...(!certifiedOccluded&&!certifiedClear?['open-interval-ray-sign-undetermined']:[]),
     'curve-endpoint-and-transition-visibility-unverified',
     'complete-feature-and-standard-line-style-unverified'
    ],
    standardLineStyle:'undetermined',
    constructionIntentAuthorized:false,v5ActionAuthorized:false});
  }
 }
 return freeze({schema:'draftai-c3-joint-topology-visibility/1',
  revision,status:'scoped-open-interval-joint-evidence',
  sourceBranchCount:m3.branchCount,componentCount:topology.componentCount,
  graphVerifiedComponentCount:topology.graphVerifiedComponentCount,
  unresolvedAnalyticJunctionCount:topology.unresolvedAnalyticJunctionCount,
  allSourceBranchesAccountedFor:true,intervals,junctionGuards,topologyComponents,
  transitionGuards:buildTransitionGuards(intervals,junctionGuards,input,
   topology.projectedCoincidences),
  unresolvedJunctionGuardCount:unresolvedJunctions.length,
  fullCurveTopologyVerified:false,
  allViewsContinuousVisibilityVerified:false,officialLineStylesVerified:false,
  constructionIntentAuthorized:false,v5CurveReady:false});
}
module.exports={auditC3JointTopologyVisibility};
