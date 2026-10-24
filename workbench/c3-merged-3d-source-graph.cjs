'use strict';
/**
 * C3 source-graph integration (M3 → common M4 graph → M5 audit).
 * Independently recompute lateral/lateral curved edges, analytic end-cap
 * face-pair lines, and their actual source 3D junctions.
 *
 * Source-graph completeness is DIFFERENT from retained-surface/composite
 * topology and DIFFERENT from an authorized engineering final stroke.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditFiniteCylinderEndpointIncidence}=
 require('./m5-analytic-cylinder-endpoint-incidence.cjs');
const {auditC3CapBoundaryIncidence}=
 require('./c3-cap-boundary-incidence.cjs');
const {build3DSourceFeatureGraph}=
 require('../core/topology/source-feature-graph-3d.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const a of Object.values(x))freeze(a);Object.freeze(x);
}return x;};
function auditC3Merged3DSourceGraph({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('reviewed current C3 graph revision required');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 const none=(reason)=>freeze({
  schema:'draftai-c3-merged-3d-source-graph/1',
  revision,status:'not-covered',reason,sourceStatus:m3.status,
  vertices:[],edges:[],components:[],
  allLateralBranchesAndCapSegmentsCovered:false,
  allFiniteCapTerminalsPhysicallyJoined:false,
  fullSolidBoundaryTopologyVerified:false,
  standardLineStylesVerified:false,finalV5CurveAuthorized:false
 });
 if(m3.status!=='scoped-analytic-ready')return none('lateral M3 unavailable');
 const incidence=auditFiniteCylinderEndpointIncidence({input,revision});
 const cap=auditC3CapBoundaryIncidence({input,revision});
 if(incidence.status!=='scoped-analytic-3d-endpoint-incidence'||
    !incidence.allAnalyticSourceBranchesAccountedFor||
    !['scoped-analytic-cap-junction-incidence',
      'undetermined-unmatched-lateral-cap-junction'].includes(cap.status)||
    cap.sourceM3LateralJunctionStatus!==incidence.status||
    cap.capSourceStatus!=='scoped-analytic-cap-boundary-pairs'||
    cap.standardLineStylesVerified!==false||
    cap.finalV5CurveAuthorized!==false)
  return none('cap or lateral source graph incomplete');
 const tol=1e-8*Math.max(1,input.zCylinder.radius,input.yCylinder.radius);
 const graph=build3DSourceFeatureGraph({
  lineSources:cap.capSegments.map(s=>({
   id:s.id,kind:'line',pairKind:s.pairKind,
   from:s.from,to:s.to
  })),
  curveSources:m3.branches.map(b=>({
   id:b.id,kind:'analytic-curve',from:b.endpoints[0].point,
   to:b.endpoints[1].point
  })),
  curveVertices:incidence.junctions.map(j=>({
   id:j.id,point3D:j.point3D
  })),
  tolerance:tol
 });
 const curves=graph.edges.filter(e=>e.kind==='analytic-curve');
 const lines=graph.edges.filter(e=>e.kind==='line');
 if(curves.length!==m3.branchCount||
   new Set(curves.map(e=>e.sourceId)).size!==m3.branchCount||
   new Set(lines.map(e=>e.sourceId)).size!==cap.capSegments.length||
   graph.allSourceEdgesCoveredExactlyOnce!==true)
  throw new RangeError('joined C3 M3 source graph missed or duplicated real feature');
 const capTerminals=incidence.junctions.filter(j=>j.finiteCapTermination);
 const terminalEvidence=capTerminals.map(j=>{
  const vertices=graph.vertices.filter(v=>v.sourceRefs.some(ref=>
   ref.kind==='curve-junction'&&ref.id===j.id));
  if(vertices.length!==1)
   throw new RangeError('physical lateral cap junction lost from merged graph');
  const v=vertices[0];
  const incident=graph.edges.filter(e=>
   e.fromVertexId===v.id||e.toVertexId===v.id);
  const lineIds=incident.filter(e=>e.kind==='line').map(e=>e.sourceId);
  const curveIds=incident.filter(e=>e.kind==='analytic-curve').map(e=>e.sourceId);
  return {sourceJunctionId:j.id,graphVertexId:v.id,
   analyticLateralSourceBranchIds:curveIds,
   capFeatureSourceIds:[...new Set(lineIds)],
   sourceFeatureJoinAtOneTrue3DPoint:lineIds.length>0&&curveIds.length>0,
   projectedCoincidenceNotUsed:true,
   finalSolidBoundaryJoinApproved:false,
   officialLineStyle:'undetermined'};
 });
 const fullyMatched=cap.allLateralCapTerminalsIdentifiedWithinSourceScope===true&&
  terminalEvidence.every(t=>t.sourceFeatureJoinAtOneTrue3DPoint);
 const allCovered=curves.length===m3.branchCount&&
   new Set(lines.map(e=>e.sourceId)).size===cap.capSegments.length;
 return freeze({...graph,schema:'draftai-c3-merged-3d-source-graph/1',
  revision,status:fullyMatched?
   'scoped-complete-3d-source-incidence':
   'undetermined-cap-lateral-continuation',
  originalAnalyticCurveSourceCount:m3.branchCount,
  originalCapLineSourceCount:cap.capSegments.length,
  terminalEvidence,
  lateralCapTerminalCount:capTerminals.length,
  lateralCapTerminal3DJoinCount:terminalEvidence.filter(t=>
   t.sourceFeatureJoinAtOneTrue3DPoint).length,
  allLateralBranchesAndCapSegmentsCovered:allCovered,
  allFiniteCapTerminalsPhysicallyJoined:fullyMatched,
  graph3DSourceConnectivityRecomputed:true,
  sourceIntersectionSolidRetainedFaceSelectionVerified:false,
  allAnalyticCurveInteriorsCheckedForOtherFeatureCrossings:false,
  fullSolidBoundaryTopologyVerified:false,
  allViewsContinuousVisibilityVerified:false,
  standardLineStylesVerified:false,finalV5CurveAuthorized:false
 });
}
module.exports={auditC3Merged3DSourceGraph};
