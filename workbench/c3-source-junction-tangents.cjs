'use strict';
/**
 * C3 analytic local 3D source-junction differential audit.
 *
 * Never infer tangency from discrete preview chords or paper projection.
 * Use the exact implicit cylinders' gradients F and G; their cross
 * product gives the lateral/lateral analytic tangent at REGULAR points.
 * A cap-related source edge has exactly one coordinate-axis tangent.
 *
 * This is a proof of local SOURCE edge differential incidence, not
 * a proof that edges survive the Boolean solid boundary, continuous
 * visibility, drafting style or final V5 action.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditC3Merged3DSourceGraph}=
 require('./c3-merged-3d-source-graph.cjs');
const {auditC3CapBoundaryIncidence}=
 require('./c3-cap-boundary-incidence.cjs');
const finite=Number.isFinite;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,
 y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const len=a=>Math.hypot(a.x,a.y,a.z);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const a of Object.values(x))freeze(a);Object.freeze(x);
}return x;};
function auditC3SourceJunctionTangents({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current model revision needed for independent tangent proof');
 const m3=evaluateUnifiedMath({kind:'finite-orthogonal-cylinder-intersection',
  input,revision});
 const graph=auditC3Merged3DSourceGraph({input,revision});
 const cap=auditC3CapBoundaryIncidence({input,revision});
 const blocked=(reason)=>freeze({
  schema:'draftai-c3-source-junction-tangents/1',revision,
  status:'not-covered',reason,junctions:[],regularLocalTangencyCount:0,
  provenDistinctDirectionCount:0,unresolvedLocalJunctionCount:0,
  fullSolidBoundaryTopologyVerified:false,
  officialLineStylesVerified:false,finalV5CurveAuthorized:false});
 if(m3.status!=='scoped-analytic-ready'||
    !['scoped-complete-3d-source-incidence',
      'undetermined-cap-lateral-continuation'].includes(graph.status)||
    graph.allLateralBranchesAndCapSegmentsCovered!==true||
    !['scoped-analytic-cap-junction-incidence',
      'undetermined-unmatched-lateral-cap-junction'].includes(cap.status))
  return blocked('finite M3/M4/M5 source graph not independently complete');
 const Z=input.zCylinder,Y=input.yCylinder;
 const byEdge=new Map(graph.edges.map(e=>[e.id,e]));
 const byCap=new Map(cap.capSegments.map(s=>[s.id,s]));
 const byBranch=new Map(m3.branches.map(b=>[b.id,b]));
 const tol=1e-10*Math.max(1,Z.radius,Y.radius);
 const axis={
  x:{x:1,y:0,z:0},y:{x:0,y:1,z:0},z:{x:0,y:0,z:1}
 };
 function direction(edge,p){
  if(edge.kind==='line'){
   const src=byCap.get(edge.sourceId);
   if(!src||!axis[src.sourceFreeCoordinate])
    throw new RangeError('unverified finite cap-source straight edge');
   return {kind:'source-cap-axis',sourceId:edge.sourceId,
    direction:{...axis[src.sourceFreeCoordinate]},
    exactSourceAxis:src.sourceFreeCoordinate,regular:true,
    sourceDifferentialVerified:true};
  }
  const b=byBranch.get(edge.sourceId);
  if(!b)throw new RangeError('missing analytic M3 curve source');
  // F=(x-Xz)^2+(y-Yz)^2-Rz^2;
  // G=(x-Xy)^2+(z-Zy)^2-Ry^2.
  // Cross(gradF,gradG)/4 gives an exact algebraic tangent direction.
  const nZ={x:p.x-Z.xCenter,y:p.y-Z.yCenter,z:0};
  const nY={x:p.x-Y.xCenter,y:0,z:p.z-Y.zCenter};
  const t=cross(nZ,nY);
  const regular=len(t)>tol*Math.max(1,len(nZ)*len(nY));
  return {kind:'implicit-cylinder-cross-gradient',sourceId:edge.sourceId,
   direction:t,regular,sourceDifferentialVerified:regular,
   gradientRankTwoVerified:regular,
   analyticCurveSignBranchSourceId:b.id};
 }
 const records=[];
 for(const v of graph.vertices){
  const incident=v.incidentEdgeIds.map(id=>{
   const e=byEdge.get(id);if(!e)throw new RangeError('graph incidence missing source edge');
   return {...direction(e,v.point3D),edgeId:e.id,
    sourceKind:e.kind};
  });
  const pairTests=[];
  for(let i=0;i<incident.length;i++)for(let j=i+1;j<incident.length;j++){
   const a=incident[i],b=incident[j];
   const rank=a.regular&&b.regular;
   let classification='undetermined-singular-or-unstable',
     exactSourceTangentIdentity=false,
     analyticallySeparatedDirection=false;
   let normalizedCrossMagnitude=null,absoluteCosine=null;
   if(rank){
    const d=len(a.direction)*len(b.direction);
    const parallel=len(cross(a.direction,b.direction))/d;
    const cosine=Math.abs(dot(a.direction,b.direction))/d;
    normalizedCrossMagnitude=parallel;absoluteCosine=cosine;
    // Same two implicit surfaces have one unique regular tangent line
    // by the IFT; two straight feature axes are exactly parallel iff
    // their independently sourced coordinate-axis identities agree.
    const bothImplicit=a.kind==='implicit-cylinder-cross-gradient'&&
     b.kind==='implicit-cylinder-cross-gradient';
    const bothCapAxes=a.kind==='source-cap-axis'&&b.kind==='source-cap-axis';
    if(bothImplicit||(bothCapAxes&&
        a.exactSourceAxis===b.exactSourceAxis)){
     classification='analytically-same-regular-tangent';
     exactSourceTangentIdentity=true;
    }else if(bothCapAxes&&a.exactSourceAxis!==b.exactSourceAxis){
     classification='analytic-orthogonal-source-corner';
     analyticallySeparatedDirection=true;
    }else if(parallel>1e-7){
     classification='analytic-non-tangent-source-corner';
     analyticallySeparatedDirection=true;
    }
    // Tiny angular gaps are NOT promoted to a rigorous tangent.
   }
   pairTests.push({sourceEdgeIds:[a.edgeId,b.edgeId],
    classification,analyticRegularTangentDirectionsBothAvailable:rank,
    exactSourceTangentIdentity,
    analyticallySeparatedDirection,
    normalizedCrossMagnitude,absoluteCosine,
    officialLineStyle:'undetermined',v5FinalActionAuthorized:false});
  }
  const exactlyTwo=incident.length===2;
  const singlePair=exactlyTwo?pairTests[0]:null;
  const uniqueRegularC1SourceContinuation=!!(singlePair&&
    singlePair.exactSourceTangentIdentity);
  const definiteSourceCorner=!!(singlePair&&
    singlePair.analyticallySeparatedDirection);
  records.push({sourceGraphVertexId:v.id,point3D:{...v.point3D},
   sourceRefs:v.sourceRefs,incidentEdgeCount:incident.length,
   incidentSourceTangents:incident,pairTests,
   localSourceType:uniqueRegularC1SourceContinuation?
    'verified-regular-source-C1-continuation':
    definiteSourceCorner?'verified-local-source-corner':
    incident.length>2?'multivalent-undetermined':
    'undetermined-local-continuation',
   uniqueRegularC1SourceContinuation,
   definiteSourceCorner,fullSolidBoundaryFeatureJoinApproved:false,
   officialLineStyle:'undetermined',v5FinalActionAuthorized:false});
 }
 return freeze({schema:'draftai-c3-source-junction-tangents/1',
  revision,status:'scoped-analytic-local-source-tangents',
  sourceGraph3DVertexCount:graph.vertices.length,
  sourceGraph3DEdgeCount:graph.edges.length,junctions:records,
  regularLocalTangencyCount:records.filter(v=>
   v.uniqueRegularC1SourceContinuation).length,
  provenDistinctDirectionCount:records.filter(v=>v.definiteSourceCorner).length,
  unresolvedLocalJunctionCount:records.filter(v=>
   !v.uniqueRegularC1SourceContinuation&&!v.definiteSourceCorner).length,
  implicitGradientCrossProductDerivedFromCurrentM3:true,
  sourceCapAxisTangentsFromM3SourceFaces:true,
  projected2DCoincidenceNotUsedForJoins:true,
  fullSolidBoundaryTopologyVerified:false,
  allViewsContinuousVisibilityVerified:false,
  officialLineStylesVerified:false,finalV5CurveAuthorized:false});
}
module.exports={auditC3SourceJunctionTangents};
