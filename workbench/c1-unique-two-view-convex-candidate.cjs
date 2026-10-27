'use strict';
/**
 * C1 safe automatic vertex correspondence and convex candidate topology
 * from TWO independent UNLABELLED first-angle V/H/W point clouds.
 *
 * Unique shared-axis bipartite correspondence is recomputed by the existing
 * M3 point-projection solver. For an explicitly hypothesized CLOSED CONVEX
 * solid with ALL of its extreme vertices supplied, reuse the pinned Three.js
 * QuickHull port (mature open source) for a triangulated candidate mesh;
 * M0 independently verifies closed topology / support planes / coplanar
 * subdivisions before anything can be shown.
 *
 * NO fake user confirmation. No inference when projections collapse onto
 * duplicate paper points, match graph is ambiguous, hull vertices are
 * missing, shape could be nonconvex, or source assumptions lack provenance.
 * Only a CANDIDATE is returned; existing C1 requires explicit review.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
const mappings={
 'HV':{H:'v',V:'u'}, // H.v is y, V.u is x? actually shared X: H.u / V.u
 'VW':{V:'v',W:'v'},
 'HW':{H:'v',W:'u'}
};
// H/V shared x must use u for both; annotate and freeze the single
// shared-physical-axis lookup rather than inferring positions by drawing.
mappings.HV={H:'u',V:'u'};
function normalize(points,label){
 if(!Array.isArray(points)||points.length<4||points.length>16)
  throw new TypeError('4..16 independently detected view vertices required');
 const mapped=points.map((p,i)=>{
  if(!p||typeof p!=='object'||Array.isArray(p)||
     Object.keys(p).sort().join(',')!=='u,v'||
     !Number.isFinite(p.u)||!Number.isFinite(p.v)||
     Math.abs(p.u)>100000||Math.abs(p.v)>100000)
   throw new TypeError('current finite '+label+' view mm coordinates required');
  return {u:p.u,v:p.v};
 });
 for(let i=0;i<mapped.length;i++)for(let j=i+1;j<mapped.length;j++)
  if(Math.hypot(mapped[i].u-mapped[j].u,
    mapped[i].v-mapped[j].v)<=1e-8)
   throw new RangeError('duplicate/collapsed paper vertices prevent unique automatic correspondence');
 return mapped;
}
async function inferC1UniqueConvexGeometryCandidate({
 views,geometryId='C1AutoConvexCandidate',revision=1,
 assumedScope='all-extreme-vertices-of-one-closed-convex-opaque-solid'
}={}){
 if(!views||typeof views!=='object'||Array.isArray(views)||
    !Number.isSafeInteger(revision)||revision<1||
    typeof geometryId!=='string'||!/^[a-zA-Z][\w-]{0,70}$/.test(geometryId)||
    assumedScope!=='all-extreme-vertices-of-one-closed-convex-opaque-solid')
  throw new TypeError('explicit bounded convex candidate assumptions and current revision required');
 const pair=Object.keys(views).sort().join('');
 if(!['HV','HW','VW'].includes(pair))
  throw new TypeError('exactly two first-angle views required');
 const first=pair[0],second=pair[1],
  a=normalize(views[first],first),b=normalize(views[second],second);
 if(a.length!==b.length)
  throw new RangeError('different source vertex counts imply incomplete/ambiguous projected detection');
 const axis=mappings[pair];
 const matched=[],seen=new Set();
 for(let i=0;i<a.length;i++){
  const candidates=b.map((p,j)=>Math.abs(a[i][axis[first]]-
   p[axis[second]])<=1e-8?j:-1).filter(j=>j>=0);
  if(candidates.length!==1||seen.has(candidates[0]))
   throw new RangeError('shared first-angle axis gives ambiguous original 3D correspondence');
  const j=candidates[0];seen.add(j);
  const knownViews={
   [first]:[a[i].u,a[i].v],
   [second]:[b[j].u,b[j].v]
  };
  const solution=solveProjection({knownViews});
  if(solution.status!=='unique'||solution.globallyUnique!==true||
     solution.maxResidual>1e-8||!solution.point)
   throw new RangeError('existing M3 point solver cannot uniquely reconstruct this 3D source');
  matched.push({id:'P'+String(i+1).padStart(3,'0'),
   knownViews,xyz:{...solution.point},sourceIndices:{[first]:i,[second]:j}});
 }
 if(seen.size!==b.length)
  throw new RangeError('orphan second-view vertex requires further identification');
 // Reuse pinned mature open-source QuickHull; do not add a second geometry
 // solver and never mistake a render triangle diagonal for physical crease.
 const [{ConvexHull},{Vector3}]=await Promise.all([
  import('three/addons/math/ConvexHull.js'),import('three')
 ]);
 const positions=matched.map(r=>new Vector3(r.xyz.x,r.xyz.y,r.xyz.z)),
  byRef=new Map(positions.map((v,i)=>[v,matched[i].id]));
 let hull;
 try{hull=new ConvexHull().setFromPoints(positions);}
 catch(e){throw new RangeError('not an independently supported full 3D convex hull: '+e.message);}
 const faces=[],used=new Set(),edges=[],seenEdges=new Set();
 for(const face of hull.faces){
  const ids=[],firstEdge=face.edge;
  let edge=firstEdge,n=0;
  if(!edge)throw new RangeError('malformed open-source convex hull face');
  do{
   const id=byRef.get(edge.head()?.point);
   if(!id)throw new RangeError('convex hull vertex has no current M3 original source');
   ids.push(id);used.add(id);
   edge=edge.next;
   if(++n>32)throw new RangeError('convex hull generated unbounded face ring');
  }while(edge!==firstEdge);
  if(ids.length!==3||new Set(ids).size!==3)
   throw new RangeError('nontriangular/degenerate QuickHull face');
  faces.push(ids);
  for(let i=0;i<ids.length;i++){
   const start=ids[i],end=ids[(i+1)%ids.length],
    key=[start,end].sort().join('|');
   if(!seenEdges.has(key)){seenEdges.add(key);edges.push([start,end]);}
  }
 }
 if(used.size!==matched.length)
  throw new RangeError('a detected vertex is not an extreme solid corner');
 const geometry={id:geometryId,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points:Object.fromEntries(matched.map(r=>[r.id,{...r.xyz}])),
   edges,faces}};
 const m0=verifiedConvexMeshHalfspaces(geometry);
 if(m0.status!=='validated-closed-convex-mesh'||
    m0.sourceVertexCount!==matched.length||
    m0.sourceFaceCount!==faces.length)
  throw new RangeError('original M0 independent solid topology verification failed');
 const missingView=VIEWS.find(v=>!Object.hasOwn(views,v));
 return frozen({
  schema:'draftai-c1-unlabelled-two-view-unique-convex-candidate/1',
  revision,missingView,
  status:'automatic-unique-convex-candidate-requires-source-assumption-review',
  knownViewPair:[first,second],
  sourceCorrespondenceUniqueWithinAssumption:true,
  source2DVerticesMatchedWithoutManualIds:true,
  candidateClosedConvexTopologyInferredByPinnedThreeQuickHull:true,
  independentlyValidatedByCurrentM0:true,
  correspondence:matched.map(r=>({...r})),
  inferredOriginal3DPointCount:matched.length,
  candidateGeometry:geometry,
  // Existing production C1 MUST still require user confirmation.
  reviewedSolidInputCandidate:{geometryId,revision,unit:'mm',
   confirmedBy:'unconfirmed-automatic-reconstruction',
   topologyConfirmed:false,
   vertices:matched.map(({id,knownViews})=>({id,knownViews})),
   edges:edges.map(e=>[...e]),faces:faces.map(f=>[...f])},
  sourceImageRecognitionAndLineGraphCompletenessVerified:false,
  sourceConvexCompletenessAssumptionIndependentlyVerified:false,
  productionConstructionIntentAuthorized:false,
  signedV5ActionCount:0,realTextbookBlindTestPassed:false
 });
}
module.exports={inferC1UniqueConvexGeometryCandidate};
