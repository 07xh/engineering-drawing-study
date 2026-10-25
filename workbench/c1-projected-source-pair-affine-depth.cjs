'use strict';
/**
 * C1 M5 evidence: compare ORIGINAL reviewed 3D source-edge depths only
 * across a genuinely M4-proven positive-length SAME paper-line overlap.
 *
 * The M4 exact adaptive orientation and source parameters remain the sole
 * 2D overlap source; we do not midpoint-sample or infer hidden strokes.
 * Observer-depth DIFFERENCE of two projected-matched 3D straight lines is
 * affine across the overlap, so independent endpoint sign + authentic
 * original physical shared endpoint suffice for STRICT open-interval order.
 *
 * Pairwise front ordering is never whole-scene face-occlusion, GB drawing
 * line style, ConstructionIntent, DAG, or a second V5 signature.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {recomputeReviewedProjectedEdgeEvents}=
 require('./recomputed-projected-pairwise-events.cjs');
const {classifyAffineOpenSourceDepth}=
 require('./m5-c1-continuous-frontmost-source-rays.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);
 Object.freeze(o);
}return o;};
const EPS=1e-9;
const depth=(p,view)=>{
 const r=FIRST_ANGLE_OBSERVER_RAYS[view];
 return p.x*r.x+p.y*r.y+p.z*r.z;
};
const p3=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const near=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v)<=1e-7;
const sourceKey=(geometry,a,b)=>geometry.id+'::'+[a,b].sort().join('|');
function auditC1ProjectedSourcePairDepth({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('C1 current original source revision required');
 const convex=verifiedConvexMeshHalfspaces(geometry);
 if(convex.status!=='validated-closed-convex-mesh'||
    convex.sourceGeometryId!==geometry.id)
  throw new RangeError('independent current C1 M0 closed convex mesh required');
 if(geometry.data.edges.length>40)
  throw new RangeError('existing M4 forty source edge budget exceeded');
 const originals=new Map();
 const input=geometry.data.edges.map(([a,b],i)=>{
  const id=sourceKey(geometry,a,b),from=geometry.data.points[a],
   to=geometry.data.points[b];
  if(originals.has(id))throw new RangeError('duplicate current original source');
  originals.set(id,{id,a,b,from,to});
  return {sourceGeometryId:geometry.id,sourceEdgeId:id,
   edge:{id:'C1DepthSource'+i,from,to}};
 });
 const graph=recomputeReviewedProjectedEdgeEvents(input);
 if(graph.status!=='pairwise-depth-events-only'||
    graph.completeContourVerified!==false)
  throw new RangeError('unsigned original M4 event graph missing');
 const witnesses=[];
 let strictOrders=0,unresolved=0,physicalSharedEndpointWitnesses=0,
  falsePaperEndpointJoinsHeld=0;
 const actualVertex=(edge,t)=>t===0?edge.a:t===1?edge.b:null;
 for(const event of graph.events){
  if(!VIEWS.includes(event.view)||
     !['collinear-overlap'].includes(event.relation))continue;
  const A=originals.get(event.firstSourceEdgeId),
   B=originals.get(event.secondSourceEdgeId);
  if(!A||!B)throw new TypeError('M4 original 3D source identity missing');
  for(const range of event.ranges??[]){
   const ts=range.firstParameterRange,us=range.secondParameterRange;
   if(!Array.isArray(ts)||!Array.isArray(us)||ts.length!==2||us.length!==2||
      [...ts,...us].some(x=>!Number.isFinite(x)))
    throw new RangeError('nonfinite or missing M4 source overlap parameters');
   const bounded=[...ts,...us].every(x=>x>=0&&x<=1);
   const slight=[...ts,...us].every(x=>x>=-EPS&&x<=1+EPS);
   if(!slight)throw new RangeError('M4 projected depth overlap outside source');
   // A rounded out-of-bounds source parameter is NOT a certified pair
   // overlap, even if its clamped point looks coincident on paper.
   const valid=bounded&&ts[1]>ts[0]&&Math.abs(us[1]-us[0])>EPS;
   const [a0,a1]=ts.map(t=>p3(A.from,A.to,t)),
    [b0,b1]=us.map(t=>p3(B.from,B.to,t));
   const corresponding=valid&&near(project(a0)[event.view],project(b0)[event.view])&&
    near(project(a1)[event.view],project(b1)[event.view])&&
    near(project(a0)[event.view],range.projectedFrom)&&
    near(project(a1)[event.view],range.projectedTo);
   const firstStart=actualVertex(A,ts[0]),
    secondStart=actualVertex(B,us[0]);
   const firstEnd=actualVertex(A,ts[1]),
    secondEnd=actualVertex(B,us[1]);
   const genuineStart=firstStart!==null&&firstStart===secondStart,
    genuineEnd=firstEnd!==null&&firstEnd===secondEnd;
   const raw=corresponding?classifyAffineOpenSourceDepth({
    from3D:a0,to3D:a1,
    observerDepthAtFromMm:depth(a0,event.view),
    observerDepthAtToMm:depth(a1,event.view)
   },{
    from3D:b0,to3D:b1,
    observerDepthAtFromMm:depth(b0,event.view),
    observerDepthAtToMm:depth(b1,event.view)
   }):null;
   const incorrectlyShared=raw?.strictOpenIntervalSharedPhysicalEndpointProven&&
    !((raw.exactSharedPhysicalStart&&genuineStart)||
     (raw.exactSharedPhysicalEnd&&genuineEnd));
   const certified=corresponding&&
    raw?.relativeDepthProvenForWholeInterval===true&&!incorrectlyShared;
   const relation=certified?raw.relation:'undetermined';
   if(certified)strictOrders++;else unresolved++;
   if(certified&&raw.strictOpenIntervalSharedPhysicalEndpointProven)
    physicalSharedEndpointWitnesses++;
   if(incorrectlyShared)falsePaperEndpointJoinsHeld++;
   witnesses.push({
    view:event.view,revision,sourceGeometryId:geometry.id,
    firstSourceEdgeId:A.id,secondSourceEdgeId:B.id,
    firstOriginalVertexIds:[A.a,A.b],secondOriginalVertexIds:[B.a,B.b],
    firstParameterRange:[...ts],secondParameterRange:[...us],
    projectedFromModelMm:{...range.projectedFrom},
    projectedToModelMm:{...range.projectedTo},
    exactM4PositivePaperCollinearOverlap:true,
    independent3DEndpointProjectionsMatch:!!corresponding,
    exactOriginalSharedVertexAtStart:!!genuineStart,
    exactOriginalSharedVertexAtEnd:!!genuineEnd,
    originalSourceEndpointParametersInBounds:bounded,
    endpointObserverDepthDifferencesMm:raw?
     [raw.depthDifferenceFromMm,raw.depthDifferenceToMm]:null,
    continuousAffineOpenDepthOrderProven:!!certified,
    frontSourceEdgeId:certified?(relation==='first-in-front'?A.id:B.id):null,
    relation:certified?relation:incorrectlyShared?
     'paper-or-interior-depth-tie-without-original-3d-vertex-proof':
     'undetermined-depth-order',
    potentialDepthSwitchAtOverlapParameter:raw?.analyticSwitchFraction??null,
    fullThirdPartyFaceOcclusionProven:false,
    junctionBetweenAllSourcesCertified:false,
    standardEngineeringLineStyle:'undetermined',
    signedV5Action:false
   });
   if(witnesses.length>1800)
    throw new RangeError('C1 source overlap proof complexity limit');
  }
 }
 return frozen({
  schema:'draftai-c1-m5-projected-original-source-affine-depth/1',
  revision,sourceGeometryId:geometry.id,unit:'mm',
  originalM4PairCount:graph.pairCount,
  sameProjectedSourceOverlapIntervals:witnesses.length,
  provenPairwiseStrictFrontCount:strictOrders,
  undeterminedPairwiseDepthCount:unresolved,
  authenticSharedOriginalVertexOpenDepthWitnessCount:
   physicalSharedEndpointWitnesses,
  paperOnlyFalseEndpointFrontHeldCount:falsePaperEndpointJoinsHeld,
  witnesses,
  allOpaqueFacesAndThirdPartySourcesChecked:false,
  wholeSceneVisibilityVerified:false,
  allPhysical3DJunctionsVerified:false,
  engineeringLineStylesSigned:false,
  officialV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={auditC1ProjectedSourcePairDepth};
