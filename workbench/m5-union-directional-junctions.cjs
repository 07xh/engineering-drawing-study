'use strict';
/**
 * M5 C2. Source-based DIRECTIONAL incidence at reviewed original+generated
 * union crease endpoints, and listed-node-only first-angle depth order.
 *
 * A coincident 3D endpoint is not yet a continuous feature. Classify the
 * actual outgoing original source segments and distinguish opposite collinear
 * continuation, corner, duplicate-direction overlap, branching and isolated
 * terminals. For each view, order co-projected SOURCE NODES by the exact
 * observer dot-product, never by their SVG position.
 *
 * Every witness remains local. An unlisted source face may occlude a node,
 * and a segment can change visibility between nodes. No official
 * contour/stroke style, ConstructionIntent, Step DAG, or V5 is authorized.
 */
const {project,VIEWS,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {auditUnionPhysicalFeatureJunctions}=
 require('./m5-union-physical-feature-junctions.cjs');
const AXES=['x','y','z'];
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);
 Object.freeze(x);
}return x;};
const same=(a,b)=>AXES.every(k=>a[k]===b[k]);
const id2=p=>p.u+':'+p.v;
function inspectUnionDirectionalJunctions({geometry,revision,physicalJunctionEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current source revision required for M5 directional junctions');
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('two to eight reviewed source meshes required');
 const fresh=auditUnionPhysicalFeatureJunctions({geometry,revision});
 const unavailable=()=>freeze({schema:'draftai-m5-union-directional-junctions/1',
  revision,status:'not-covered',nodes:[],nodeCount:0,
  projectedNodeDepthGroups:[],positiveStraightLocalPairCount:0,
  cornerNodeCount:0,branchingNodeCount:0,
  completeGlobalFeatureGraphVerified:false,
  officialLineStylesVerified:false,v5Ready:false});
 if(fresh.status!=='source-recomputed-physical-3d-feature-incidence')
  return unavailable();
 if(JSON.stringify(fresh)!==JSON.stringify(physicalJunctionEvidence))
  throw new TypeError('forged or stale physical 3D source node graph');
 if(fresh.officialV5FeatureActionsSigned!==0||
    fresh.allBoundaryJunctionsVerified!==false||
    fresh.wholeCompositionV5Ready!==false)
  throw new TypeError('untrusted source union endpoint approval');
 const byId=new Map(fresh.segments.map(s=>[s.id,s]));
 if(byId.size!==fresh.segments.length)
  throw new TypeError('duplicate physical feature source segment');
 const rows=fresh.nodes.map(node=>{
  const directed=node.incidences.map(i=>{
   const segment=byId.get(i.segmentId);
   if(!segment||!['from','to'].includes(i.endpointRole))
    throw new TypeError('source junction references a non-existent edge or endpoint');
   const actual=i.endpointRole==='from'?
    segment.source3DFrom:segment.source3DTo;
   const other=i.endpointRole==='from'?
    segment.source3DTo:segment.source3DFrom;
   if(!same(actual,node.point3D))
    throw new TypeError('spatial source edge does not start at the claimed junction');
   const delta=Object.fromEntries(AXES.map(k=>[k,other[k]-actual[k]]));
   const nonzero=AXES.filter(k=>delta[k]!==0);
   if(nonzero.length!==1||nonzero[0]!==segment.sourceAxis)
    throw new RangeError('source physical segment must have one exact axial direction');
   const axis=nonzero[0],sign=Math.sign(delta[axis]);
   const transverse=AXES.filter(k=>k!==axis);
   return {sourceSegmentId:segment.id,
    sourceFeatureKind:segment.kind,
    sourceGeometryIds:[...segment.sourceGeometryIds],
    sourceFeatureOpenStatus:segment.sourceFeatureOpenStatus,
    axis,sign,sourceEndpointRole:i.endpointRole,
    source3DFeatureDirection:Object.fromEntries(AXES.map(k=>
     [k,k===axis?sign:0])),
    sameSpatialLineKey:axis+':'+transverse.map(k=>
     node.point3D[k]).join(':'),
    originalSourceOpenIntervalIdentityVerified:true,
    independentlyProvenLocalFeatureOpenStatus:true,
    finalDrawingStrokeDirectionSignedOff:false};
  });
  if(directed.length!==node.incidentSegmentCount)
   throw new TypeError('mismatched source junction degree');
  const pairs=[];
  for(let a=0;a<directed.length;a++)for(let b=a+1;b<directed.length;b++){
   const u=directed[a],v=directed[b];
   const sameLine=u.sameSpatialLineKey===v.sameSpatialLineKey;
   const opposite=sameLine&&u.sign===-v.sign;
   const sameStatus=u.sourceFeatureOpenStatus===v.sourceFeatureOpenStatus;
   pairs.push({sourceSegmentIds:[u.sourceSegmentId,v.sourceSegmentId],
    physical3DSharedEndpointVerified:true,
    same3DSourceAxisAndSupportingLineVerified:sameLine,
    exactOppositeOutgoingTangentsVerified:opposite,
    equalProvenOpenFeatureStatus:sameStatus,
    candidateStraightContinuation:opposite&&sameStatus&&
     node.incidentSegmentCount===2&&!node.nearButNotIdentical3DPointExists&&
     !node.nearCriticalOctantBoundary,
    localCornerRatherThanSmoothJoin:!sameLine,
    unresolvedSameDirectionSourceOverlap:sameLine&&!opposite,
    completeContourAndStyleJoinVerified:false});
  }
  const positive=pairs.length===1&&pairs[0].candidateStraightContinuation;
  let kind=directed.length===1?'open-terminal':
   directed.length>2?'multi-branch-junction':
   positive?'source-traced-straight-continuation-candidate':
   pairs[0]?.localCornerRatherThanSmoothJoin?'real-3d-corner-candidate':
   pairs[0]?.unresolvedSameDirectionSourceOverlap?
     'coincident-same-direction-overlap-undetermined':
   'feature-transition-or-degenerate-join-undetermined';
  if(node.nearButNotIdentical3DPointExists||
     node.nearCriticalOctantBoundary)
   kind='near-critical-source-incidence-undetermined';
  return {nodeId:node.id,revision,point3D:{...node.point3D},
   projected:project(node.point3D),incidentCount:directed.length,
   incidentDirections:directed,pairwiseJunctionWitnesses:pairs,
   classification:kind,
   positiveSourceTracedStraightCandidate:positive,
   source3DPhysicalIncidenceVerified:
    node.original3DPhysicalCoincidenceVerified,
   source3DOctantLocalWitnessVerified:
    !node.nearCriticalOctantBoundary&&
      node.occupiedOctantCount>0&&node.occupiedOctantCount<8,
   allOutgoingDirectionsVerified:true,
   projectionDepthTieAndOcclusionFullyProven:false,
   completeSpatialContourTopologyVerified:false,
   standardEngineeringLineStyle:'undetermined',
   formalConstructionStepOrV5Approved:false};
 });
 const projectedNodeDepthGroups=[];
 for(const view of VIEWS){
  const groups=new Map();
  const ray=FIRST_ANGLE_OBSERVER_RAYS[view];
  for(const node of rows){
   const uv=node.projected[view],k=id2(uv);
   if(!groups.has(k))groups.set(k,{uv,nodes:[]});
   const p=node.point3D,
     depth=p.x*ray.x+p.y*ray.y+p.z*ray.z;
   groups.get(k).nodes.push({nodeId:node.nodeId,
    point3D:{...p},observerDotDepthMm:depth});
  }
  for(const [k,group] of groups){
   group.nodes.sort((a,b)=>b.observerDotDepthMm-a.observerDotDepthMm||
     a.nodeId.localeCompare(b.nodeId));
   const distinct=new Set(group.nodes.map(n=>n.observerDotDepthMm));
   projectedNodeDepthGroups.push({view,projectedKey:k,
    projectedModelMm:{...group.uv},
    orderedSourceNodes:group.nodes,
    distinctSource3DNodeCount:group.nodes.length,
    sourceNodeObserverDepthOrderVerified:true,
    coProjectedMultiplePhysicalNodes:group.nodes.length>1,
    identicalObserverDepthTie:distinct.size<group.nodes.length,
    nearestListedPhysicalSourceNodeId:
     distinct.size===group.nodes.length?group.nodes[0].nodeId:null,
    allOtherSourceFaceAndStrokeOcclusionVerified:false,
    physicalJoinFromProjectionAlonePermitted:false,
    officialStrokeStyleApproved:false});
  }
 }
 return freeze({schema:'draftai-m5-union-directional-junctions/1',
  revision,status:'local-source-direction-and-listed-node-depth-witness',
  sourceGeometryIds:[...fresh.sourceGeometryIds],
  nodes:rows,nodeCount:rows.length,
  projectedNodeDepthGroups,
  positiveStraightLocalPairCount:rows.filter(n=>
   n.positiveSourceTracedStraightCandidate).length,
  cornerNodeCount:rows.filter(n=>
   n.classification==='real-3d-corner-candidate').length,
  branchingNodeCount:rows.filter(n=>
   n.classification==='multi-branch-junction').length,
  projectedCoDepthAliasGroupCount:projectedNodeDepthGroups.filter(g=>
   g.coProjectedMultiplePhysicalNodes).length,
  allOriginalAndNewFeatureDirectedEndpointsCovered:true,
  listedNodesDepthOrderVerified:true,
  completeGlobalFeatureGraphVerified:false,
  continuousFaceDepthAndFullContourVerified:false,
  engineeringStandardStrokeStylesVerified:false,
  officialLineStylesVerified:false,
  signedV5LineActions:0,v5Ready:false});
}
module.exports={inspectUnionDirectionalJunctions};
