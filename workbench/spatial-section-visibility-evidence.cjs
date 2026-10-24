'use strict';
/**
 * M5 evidence transport for projected OPEN section edge interiors.
 *
 * This is a generic per-edge / per-view identity and proof-scope carrier.
 * It never derives hidden lines from a mesh silhouette or samples. A
 * specialist may supply a ray classifier ONLY after trusted M3 evidence.
 * Endpoint, tangency and other-solid occlusion remain unproven.
 */
const {project,VIEWS,validateFirstAngleObserverRays}=
 require('../core/projection/conventions.js');
const {classifyPrismSectionVisibility}=
 require('../engines/spatial/sections/rectangular-prism-cut-visibility.cjs');
const {classifyConvexPolytopeBoundaryRay}=
 require('../core/numeric/convex-polytope-boundary-ray.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const xyz=p=>p&&['x','y','z'].every(k=>finite(p[k]));
const near=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=1e-6;
const deepFreeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))deepFreeze(v);
  Object.freeze(x);
 }
 return x;
};
function reject(reason){throw new TypeError('spatial visibility evidence: '+reason);}
/**
 * The six original prism faces and the SELECTED retained plane describe
 * a single bounded convex intersection; outward halfspaces use <= offsets.
 * Future convex polytope specialists can provide their own verified faces.
 */
function prismRetainedHalfspaces(box,plane,side){
 const faces=[];
 for(const axis of ['x','y','z']){
  for(const [bound,sign] of [['min',-1],['max',1]]){
   const normal={x:0,y:0,z:0};
   normal[axis]=sign;
   faces.push({id:'prism-'+axis+'-'+bound,normal,
    offsetMm:sign*box[bound][axis]});
  }
 }
 const sign=side==='positive'?-1:1;
 const normal={x:sign*plane.normal.x,y:sign*plane.normal.y,
  z:sign*plane.normal.z};
 faces.push({id:'retained-cut-plane',normal,
  offsetMm:normal.x*plane.point.x+normal.y*plane.point.y+
   normal.z*plane.point.z});
 return faces;
}
function reviewDirections(review,revision){
 if(review===null||review===undefined)return null;
 if(!review||typeof review!=='object'||Array.isArray(review)||
    Object.keys(review).sort().join(',')!==
     'observerDirections,retainedHalfspace,sourceRevision'||
    review.sourceRevision!==revision||
    !['positive','negative'].includes(review.retainedHalfspace))
  reject('explicit current-revision retained halfspace and view rays required');
 // A free-camera ray MUST NOT be relabelled as the canonical V/H/W
 // orthographic observer. Projection-coordinate parity alone cannot detect
 // opposite near/far ordering and would invert hidden-line evidence.
 try{validateFirstAngleObserverRays(review.observerDirections);}
 catch(error){reject('first-angle V/H/W observer directions required: '+error.message);}
 return review;
}
function deriveScopedSectionVisibility({input,evidence,revision,review=null}={}){
 if(!Number.isSafeInteger(revision)||revision<0)reject('nonnegative revision required');
 if(!input||!evidence||
    evidence.geometryVerifiedWithinSpecialistScope!==true||
    evidence.sourceMethod!=='internal-specialist-recomputation')
  return null;
 const g=evidence.sectionPerimeterGeometry;
 if(!g||g.kind!=='polyline'||g.space!=='model-3d'||
    g.unit!=='mm'||g.data?.closed!==true||
    !Array.isArray(g.data.points))return null;
 const pts=g.data.points,n=pts.length;
 if(n<3||n>6||!pts.every(xyz))reject('untrusted section perimeter');
 const selected=reviewDirections(review,revision);
 // The output has a COMMON identity shape across specialists. It is NOT
 // authoritative visibility input for SVG unless explicitly and separately
 // proven for the requested standard and every boundary.
 const values=Object.fromEntries(VIEWS.map(v=>[v,[]]));
 const vertexPointRayEvidence=Object.fromEntries(VIEWS.map(v=>[v,[]]));
 for(const view of VIEWS)for(let i=0;i<n;i++){
  values[view].push({view,index:i,sourceGeometryId:g.id,
   sourceEdgeId:'section-edge-'+(i+1),visibility:'undetermined',
   proofScope:'none',endpointsVerified:false,standardLineStyleVerified:false});
  vertexPointRayEvidence[view].push({view,index:i,sourceGeometryId:g.id,
   sourceVertexId:'section-vertex-'+(i+1),
   visibility:'undetermined',pointRayCertified:false,
   activeFaceIds:[],proofScope:'none',
   projectedJoinCertified:false,officialEndpointStyleVerified:false});
 }
 let classified=false;
 if(selected&&input.kind==='rectangular-prism'){
  for(const view of VIEWS){
   const ray=classifyPrismSectionVisibility(input.solid,input.plane,{
    retainedHalfspace:selected.retainedHalfspace,
    observerDirection:selected.observerDirections[view]
   });
   if(ray.status!=='ready'||ray.sourcePerimeterVerified!==true||
      !Array.isArray(ray.edgeRuns)||ray.edgeRuns.length!==n||
      ray.totalEdges!==n||ray.boundaryEndpointsVerified!==false||
      ray.standardViewMappingVerified!==false)
    reject('specialist open-edge ray evidence unavailable');
   for(let i=0;i<n;i++){
    const edge=ray.edgeRuns[i],a=pts[i],b=pts[(i+1)%n];
    if(edge.sourceEdgeId!=='section-edge-'+(i+1)||
       !xyz(edge.from)||!xyz(edge.to)||
       !['x','y','z'].every(k=>near(edge.from[k],a[k])&&near(edge.to[k],b[k]))||
       !['visible','hidden','undetermined'].includes(edge.visibility)||
       edge.endpointVisibilityVerified!==false||
       edge.openEdgeVerified!==(edge.visibility!=='undetermined'))
      reject('ray segment differs from trusted M3 polygon geometry');
    const projected=project(a)[view],end=project(b)[view];
    const claimed=edge.projectedEndpoints;
    if(!claimed||!near(claimed.from[view]?.u,projected.u)||
       !near(claimed.from[view]?.v,projected.v)||
       !near(claimed.to[view]?.u,end.u)||
       !near(claimed.to[view]?.v,end.v))
      reject('specialist view coordinates disagree with common first-angle projection');
    values[view][i]={
     ...values[view][i],visibility:edge.visibility,
     proofScope:edge.openEdgeVerified?'single-convex-solid-open-edge-ray':'none',
     face:edge.boxFace,
     reason:edge.reason,
     endpointsVerified:false,standardLineStyleVerified:false
    };
   }
  }
  // Independently check local rays at the actual ordered polygon vertices.
  // An intersection vertex can touch TWO or MORE source faces; a single
  // edge midpoint outward normal is insufficient to decide its visibility.
  // The convex-polytope support-plane oracle refuses tangencies and avoids
  // confusing a point ray with a COMPLETE projected line/end-junction proof.
  const halfspaces=prismRetainedHalfspaces(input.solid,input.plane,
   selected.retainedHalfspace);
  for(const view of VIEWS)for(let i=0;i<n;i++){
   const witness=classifyConvexPolytopeBoundaryRay({
    point:pts[i],observerDirection:selected.observerDirections[view],
    halfspaces
   });
   if(witness.status!=='ready')
    reject('polygon vertex fails independently bounded convex polytope support planes');
   vertexPointRayEvidence[view][i]={
    ...vertexPointRayEvidence[view][i],
    visibility:witness.visibility,
    pointRayCertified:witness.pointRayCertified,
    activeFaceIds:[...witness.activeFaceIds],
    reason:witness.reason,
    proofScope:witness.pointRayCertified?
     'single-retained-convex-polytope-point-ray':'none',
    projectedJoinCertified:false,officialEndpointStyleVerified:false
   };
  }
  classified=true;
 }
 const counts={visible:0,hidden:0,undetermined:0};
 for(const view of VIEWS)for(const e of values[view])counts[e.visibility]++;
 return deepFreeze({
  schema:'draftai-section-open-edge-visibility/1',revision,
  geometryId:g.id,sourceKind:input.kind,
  status:!selected?'unreviewed':classified?'open-edge-ray-only':'unsupported-proof',
  reviewBound:!!selected,perView:values,counts,
  openEdgeEvidenceAvailable:classified,
  // These are additional local point-ray witnesses only; no claim about
  // source polygon JOIN occlusion or the finished projected endpoint style.
  vertexPointRayEvidence,
  vertexPointRayEvidenceAvailable:classified,
  endpointVisibilityVerified:false,
  completeOcclusionVerified:false,
  standardViewMappingVerified:false,
  fullLineStylesReady:false,wholeDrawingVerified:false
 });
}
module.exports={deriveScopedSectionVisibility};
