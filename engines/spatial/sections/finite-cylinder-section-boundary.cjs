'use strict';
/**
 * DraftAI 04: verified ONE-DIMENSIONAL boundary of an oblique plane's
 * section through a finite right Z-axis cylinder.
 *
 * The lateral arcs come from the existing analytic surface solver. A cap
 * contributes a straight chord only when the plane genuinely crosses the
 * interior of that cap disk. All joins, surface constraints and graph degree
 * are independently verified. NOT a mesh, visibility solver or V5 plan.
 */
const {finiteCylinderLateralArcs}=require('./finite-cylinder-lateral-arcs.cjs');
const {normalizePlane}=require('./axis-cylinder-plane.cjs');

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const {subtractObject3:sub,dotObject3:dot,normObject3:norm}=
 require('../../../core/numeric/object-vector3.cjs');
const dist=(a,b)=>norm(sub(a,b));
const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2});
const {project:views}=require('../../../core/projection/conventions.js');
const closedFailure=(reason,sourceStatus='unverified')=>({
 status:'blocked',reason,sourceStatus,boundaryEdges:[],capChords:[],
 contourLoops:[],boundaryVerified:false,solidSectionPerimeterVerified:false,
 completeSolidIntersectionVerified:false,
 visibilityVerified:false,v5StepsReady:false,globallyUnique:null
});
function finiteCylinderSectionBoundary(cylinder,plane,{samplesPerTurn=64}={}){
 const side=finiteCylinderLateralArcs(cylinder,plane,{samplesPerTurn});
 if(!side.verified||!['clipped-lateral','complete-lateral'].includes(side.status))
  return closedFailure(side.reason||'unverified lateral intersection',side.sourceStatus);
 const pl=normalizePlane(plane),n=pl.normal,b=cylinder.baseCenter,
  radius=cylinder.radiusMm,height=cylinder.heightMm;
 const tol=1e-8*Math.max(1,radius,height);
 const normXY=Math.hypot(n.x,n.y);
 const capHeights=[['bottom',b.z],['top',b.z+height]];
 const planeResidual=p=>Math.abs(dot(n,sub(p,pl.point)));
 const radialResidual=p=>Math.abs(Math.hypot(p.x-b.x,p.y-b.y)-radius);
 const sideEdges=side.arcs.map(a=>({
  id:'side-'+a.id,kind:'lateral-arc',sourceId:a.id,
  start:a.endpoints.first,end:a.endpoints.last,
  angularInterval:[...a.angularInterval],
  sampledPolylineOnly:true,points:a.samples,
  pointProjections:a.projections
 }));
 const capChords=[];
 let maximumResidualMm=side.maxResidualMm;
 for(const [face,z] of capHeights){
  const hits=[];
  for(const arc of side.arcs){
   for(const key of ['first','last']){
    if(arc.endpoints[key+'Cap']!==face)continue;
    const q=arc.endpoints[key];
    if(!hits.some(p=>dist(q,p)<=tol*4))hits.push(q);
   }
  }
  if(!hits.length)continue;
  if(hits.length!==2)
   return closedFailure(face+' cap needs exactly two distinct lateral boundary points',
    'non-manifold-cap-contact');
  if(normXY<1e-10)
   return closedFailure('cap disk lies in or parallel to plane: not a stable chord','cap-degenerate');
  // nxy·((x,y)-centerxy) = -signedPlaneOffset.
  const signedPlaneOffset=n.x*(b.x-pl.point.x)+
   n.y*(b.y-pl.point.y)+n.z*(z-pl.point.z);
  const signedDistance=signedPlaneOffset/normXY;
  if(!finite(signedDistance)||Math.abs(signedDistance)>=radius-tol)
   return closedFailure(face+' cap tangent/near-degenerate; no verified finite chord',
    'cap-tangent');
  const root=Math.sqrt(radius*radius-signedDistance*signedDistance);
  const ux=n.x/normXY,uy=n.y/normXY;
  const foot={x:b.x-signedDistance*ux,y:b.y-signedDistance*uy,z};
  const exact=[
   {x:foot.x-root*uy,y:foot.y+root*ux,z},
   {x:foot.x+root*uy,y:foot.y-root*ux,z}
  ];
  const direct=Math.max(dist(exact[0],hits[0]),dist(exact[1],hits[1]));
  const reverse=Math.max(dist(exact[1],hits[0]),dist(exact[0],hits[1]));
  const error=Math.min(direct,reverse);
  if(!finite(error)||error>tol*4)
   return closedFailure('cap chord endpoints do not coincide with independently solved lateral roots',
    'cap-link-mismatch');
  const [start,end]=exact;
  const middle=midpoint(start,end);
  const middlePlaneResidual=planeResidual(middle);
  const diskMarginMm=radius-Math.hypot(middle.x-b.x,middle.y-b.y);
  const residual=Math.max(planeResidual(start),planeResidual(end),
   radialResidual(start),radialResidual(end),middlePlaneResidual,
   Math.abs(start.z-z),Math.abs(end.z-z));
  if(!finite(residual)||residual>tol*4||diskMarginMm<=tol)
   return closedFailure('cap chord did not pass independent plane/disk checks',
    'cap-residual');
  maximumResidualMm=Math.max(maximumResidualMm,residual,error);
  capChords.push({
   id:'cap-'+face,face,kind:'cap-chord',start,end,
   midpoint:middle,lengthMm:dist(start,end),
   projectedEndpoints:{start:views(start),end:views(end)},
   midpointProjection:views(middle),maxResidualMm:residual,
   capInteriorVerified:true,source:'plane-cut-of-finite-disk'
  });
 }
 if(side.status==='clipped-lateral'&&!capChords.length)
  return closedFailure('clipped lateral section has no confirmed cap chord',
   'unmatched-side-ends');
 // A contour is a degree-two embedded edge graph. Parameter 0 and 2π are
 // joined by geometric coincidence, not by comparing angle strings.
 const edges=[...sideEdges,...capChords];
 const nodes=[],joinedEdges=[];
 function findOrAdd(q){
  const idx=nodes.findIndex(p=>dist(p,q)<=tol*4);
  if(idx>=0)return idx;
  nodes.push({...q});return nodes.length-1;
 }
 for(const edge of edges){
  const from=findOrAdd(edge.start),to=findOrAdd(edge.end);
  joinedEdges.push({...edge,fromNode:from,toNode:to});
 }
 const incidence=nodes.map(()=>[]);
 for(const [i,e] of joinedEdges.entries()){
  incidence[e.fromNode].push(i);
  incidence[e.toNode].push(i); // self-loop correctly contributes degree 2
 }
 if(!incidence.length||incidence.some(e=>e.length!==2))
  return closedFailure('section boundary is not a closed degree-two manifold',
   'topology-open');
 const visited=new Set(),contourLoops=[];
 for(let edgeIndex=0;edgeIndex<joinedEdges.length;edgeIndex++){
  if(visited.has(edgeIndex))continue;
  const begin=joinedEdges[edgeIndex].fromNode;
  let at=begin,next=edgeIndex;
  const traversal=[];
  for(let safety=0;safety<=joinedEdges.length;safety++){
   if(visited.has(next))return closedFailure('reused edge before closing contour',
    'topology-cycle');
   const e=joinedEdges[next];
   const forward=e.fromNode===at;
   if(!forward&&e.toNode!==at)
    return closedFailure('topology adjacency mismatch','topology-adjacency');
   const endNode=forward?e.toNode:e.fromNode;
   traversal.push({edgeId:e.id,kind:e.kind,forward,
    fromNode:at,toNode:endNode});
   visited.add(next);
   at=endNode;
   if(at===begin)break;
   const remaining=incidence[at].filter(i=>!visited.has(i));
   if(remaining.length!==1)
    return closedFailure('open or branching contour graph','topology-branch');
   next=remaining[0];
  }
  if(at!==begin)return closedFailure('contour traversal did not close','topology-unclosed');
  contourLoops.push({id:'contour-'+(contourLoops.length+1),traversal,
   closed:true});
 }
 // A nondegenerate section through a convex finite cylinder has one loop.
 if(contourLoops.length!==1||visited.size!==joinedEdges.length)
  return closedFailure('unexpected disconnected or multiply connected perimeter',
   'topology-components');
 const projectionMismatch=joinedEdges.reduce((max,e)=>
  Math.max(max,dist(nodes[e.fromNode],e.start),dist(nodes[e.toNode],e.end)),0);
 if(projectionMismatch>tol*4)
  return closedFailure('geometric endpoints disagree after topology snapping',
   'topology-precision');
 return {
  status:'ready',sourceStatus:side.status,
  boundaryVerified:true,solidSectionPerimeterVerified:true,
  completeSolidIntersectionVerified:false,
  proofScope:'1D plane-section perimeter of finite Z-axis right circular solid cylinder; not filled area, visibility or V5',
  modelUnit:'mm',globallyUnique:null,
  boundaryEdges:joinedEdges,capChords,contourLoops,nodes,
  lateralArcCount:sideEdges.length,capChordCount:capChords.length,
  maxResidualMm:maximumResidualMm,
  maxJoinMismatchMm:projectionMismatch,
  chordErrorUpperBoundMm:side.chordErrorUpperBoundMm,
  sampledLateralPolylinesOnly:true,
  sectionInteriorVerified:false,visibilityVerified:false,
  firstAngleLayoutVerified:false,v5StepsReady:false,
  sourceLateralProof:{status:side.status,maxResidualMm:side.maxResidualMm}
 };
}
module.exports={finiteCylinderSectionBoundary};
