'use strict';
/**
 * C1 safe automatic vertex correspondence and convex candidate topology
 * from TWO independent UNLABELLED first-angle V/H/W point clouds.
 *
 * Unique shared-axis bipartite correspondence is recomputed by the existing
 * M3 point-projection solver. For an explicitly hypothesized CLOSED CONVEX
 * solid with ALL of its extreme vertices supplied, reuse the pinned Three.js
 * QuickHull port (mature open source) for a triangulated candidate mesh;
 * M0 independently verifies closed topology / support planes after exact
 * coplanar QuickHull triangles are restored to physical polygon faces.
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
const mappings=Object.freeze({
 HV:Object.freeze({H:'u',V:'u'}), // common X
 VW:Object.freeze({V:'v',W:'v'}), // common Z
 HW:Object.freeze({H:'v',W:'u'})  // common Y
});
// QuickHull triangulates planar polygon faces. A triangle diagonal is NOT
// an original physical crease: merge adjacent EXACTLY coplanar triangles
// before constructing Geometry.edges. No distance tolerance may erase a
// genuine near-coplanar source crease. M0 still independently validates the
// resulting closed convex manifold and all supporting planes.
const c1Bits=new DataView(new ArrayBuffer(8));
function exactCoplanarOriginalVertices(a,b,c,d){
 const dyadic=x=>{
  if(!Number.isFinite(x))throw new TypeError('finite M3 source coordinate required');
  c1Bits.setFloat64(0,x,false);
  const bits=c1Bits.getBigUint64(0,false),exp=Number((bits>>52n)&2047n),
   mantissa=bits&((1n<<52n)-1n),sign=bits>>63n?-1n:1n;
  return {n:sign*(exp?(1n<<52n)|mantissa:mantissa),
   e:exp?exp-1075:-1074};
 };
 const rows=[a,b,c,d].map(p=>['x','y','z'].map(k=>dyadic(p[k]))),
  minExp=Math.min(...rows.flat().map(q=>q.e)),
  xyz=rows.map(row=>row.map(q=>q.n<<BigInt(q.e-minExp))),
  v=[1,2,3].map(i=>xyz[i].map((n,k)=>n-xyz[0][k]));
 return v[0][0]*(v[1][1]*v[2][2]-v[1][2]*v[2][1])-
  v[0][1]*(v[1][0]*v[2][2]-v[1][2]*v[2][0])+
  v[0][2]*(v[1][0]*v[2][1]-v[1][1]*v[2][0])===0n;
}
function mergeCoplanarQuickHullTriangles(triangles,points){
 if(!Array.isArray(triangles)||triangles.length<4||triangles.length>64||
    !points||typeof points!=='object')
  throw new TypeError('bounded original QuickHull triangle topology required');
 const edgeKey=(a,b)=>[a,b].sort().join('|'),byEdge=new Map();
 for(let i=0;i<triangles.length;i++){
  const tri=triangles[i];
  if(!Array.isArray(tri)||tri.length!==3||new Set(tri).size!==3||
     tri.some(id=>typeof id!=='string'||!points[id]))
   throw new RangeError('original QuickHull triangle identity invalid');
  for(let j=0;j<3;j++){
   const from=tri[j],to=tri[(j+1)%3],key=edgeKey(from,to),
    entries=byEdge.get(key)||[];
   entries.push({index:i,from,to});
   if(entries.length>2)throw new RangeError('nonmanifold QuickHull triangle edge');
   byEdge.set(key,entries);
  }
 }
 const parent=triangles.map((_,i)=>i);
 const root=i=>{while(parent[i]!==i)i=parent[i];return i;};
 for(const entries of byEdge.values()){
  if(entries.length!==2)throw new RangeError('open QuickHull triangle source');
  const [left,right]=entries,
   tri=triangles[left.index],
   fourth=triangles[right.index].find(id=>!tri.includes(id));
  if(!fourth)throw new RangeError('duplicate QuickHull triangles');
  if(exactCoplanarOriginalVertices(...tri.map(id=>points[id]),points[fourth]))
   parent[root(right.index)]=root(left.index);
 }
 const groups=new Map();
 for(let i=0;i<triangles.length;i++){
  const k=root(i),group=groups.get(k)||[];
  group.push(triangles[i]);groups.set(k,group);
 }
 const merged=[];
 for(const group of groups.values()){
  if(group.length===1){merged.push([...group[0]]);continue;}
  const edges=new Map();
  for(const tri of group)for(let j=0;j<3;j++){
   const from=tri[j],to=tri[(j+1)%3],key=edgeKey(from,to),
    row=edges.get(key)||[];
   row.push({from,to});edges.set(key,row);
  }
  const boundary=[...edges.values()].filter(rows=>rows.length===1).map(rows=>rows[0]);
  if(boundary.length<3||boundary.length>64||
     [...edges.values()].some(rows=>rows.length>2))
   throw new RangeError('invalid coplanar QuickHull boundary');
  const next=new Map(),incoming=new Set();
  for(const {from,to} of boundary){
   if(next.has(from)||incoming.has(to))
    throw new RangeError('branched coplanar QuickHull polygon');
   next.set(from,to);incoming.add(to);
  }
  const start=boundary[0].from,ring=[];
  let at=start;
  for(let i=0;i<boundary.length;i++){
   if(!next.has(at)||ring.includes(at))
    throw new RangeError('open coplanar QuickHull polygon');
   ring.push(at);at=next.get(at);
  }
  if(at!==start||ring.length!==boundary.length)
   throw new RangeError('disconnected coplanar QuickHull polygon');
  merged.push(ring);
 }
 return merged;
}
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
 assumedScope='all-extreme-vertices-of-one-closed-convex-opaque-solid',
 // Explicit original two-view 2D source INDEX pairs when multiple physical
 // 3D vertices collapse onto the SAME 2D point. Never guess these pairs.
 reviewedCorrespondences=null
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
 const manual=reviewedCorrespondences!==null;
 if(!manual&&a.length!==b.length)
  throw new RangeError('different source vertex counts imply incomplete/ambiguous projected detection');
 const axis=mappings[pair];
 const matched=[],seenA=new Set(),seenB=new Set(),seenPairs=new Set();
 let pairs;
 if(manual){
  if(!Array.isArray(reviewedCorrespondences)||
     reviewedCorrespondences.length<4||
     reviewedCorrespondences.length>32)
   throw new TypeError('4..32 explicitly reviewed original source vertex pairs required');
  pairs=reviewedCorrespondences.map((row,n)=>{
   if(!row||typeof row!=='object'||Array.isArray(row)||
      Object.keys(row).sort().join(',')!=='firstIndex,secondIndex'||
      !Number.isSafeInteger(row.firstIndex)||!Number.isSafeInteger(row.secondIndex)||
      row.firstIndex<0||row.firstIndex>=a.length||
      row.secondIndex<0||row.secondIndex>=b.length)
    throw new RangeError('reviewed pair must refer to actual original 2D source indices');
   const key=row.firstIndex+'|'+row.secondIndex;
   if(seenPairs.has(key))
    throw new RangeError('repeated reviewed 3D source pair cannot invent another corner');
   seenPairs.add(key);
   return [row.firstIndex,row.secondIndex];
  });
 }else{
  pairs=a.map((v,i)=>{
   const matches=b.map((p,j)=>Math.abs(v[axis[first]]-
    p[axis[second]])<=1e-8?j:-1).filter(j=>j>=0);
   if(matches.length!==1||seenB.has(matches[0]))
    throw new RangeError('shared first-angle axis gives ambiguous original 3D correspondence');
   seenB.add(matches[0]);
   return [i,matches[0]];
  });
  seenB.clear();
 }
 for(const [i,j] of pairs){
  if(Math.abs(a[i][axis[first]]-b[j][axis[second]])>1e-8)
   throw new RangeError('reviewed correspondence contradicts existing shared first-angle axis');
  seenA.add(i);seenB.add(j);
  const knownViews={
   [first]:[a[i].u,a[i].v],
   [second]:[b[j].u,b[j].v]
  };
  const solution=solveProjection({knownViews});
  if(solution.status!=='unique'||solution.globallyUnique!==true||
     solution.maxResidual>1e-8||!solution.point)
   throw new RangeError('existing M3 point solver cannot uniquely reconstruct this 3D source');
  if(matched.some(r=>Math.hypot(
    r.xyz.x-solution.point.x,r.xyz.y-solution.point.y,
    r.xyz.z-solution.point.z)<=1e-8))
   throw new RangeError('repeated 3D extreme corner in independently reviewed projection pairs');
  matched.push({id:'P'+String(matched.length+1).padStart(3,'0'),
   knownViews,xyz:{...solution.point},sourceIndices:{[first]:i,[second]:j}});
 }
 if(seenA.size!==a.length||seenB.size!==b.length)
  throw new RangeError('unassigned original paper vertex requires review, not a guessed 3D corner');
 // Reuse pinned mature open-source QuickHull; do not add a second geometry
 // solver and never mistake a render triangle diagonal for physical crease.
 const faces=[],used=new Set(),edges=[],seenEdges=new Set();
 if(matched.length===4){
  // Every non-coplanar four-extreme-vertex convex 3D hull is a tetrahedron.
  // This finite combinatorial topology has NO dependency or guessed face
  // adjacency; existing M0 independently verifies every support plane,
  // volume, manifold edge and Euler condition below.
  const [a,b,c,d]=matched.map(r=>r.id);
  faces.push([a,b,c],[a,d,b],[a,c,d],[b,d,c]);
  for(const id of [a,b,c,d])used.add(id);
 }else{
  let ConvexHull,Vector3;
  try{
   ({ConvexHull}=await import('three/addons/math/ConvexHull.js'));
   ({Vector3}=await import('three'));
  }catch(e){
   throw new RangeError('pinned Three QuickHull is unavailable; larger convex topology stays unconfirmed');
  }
  const positions=matched.map(r=>new Vector3(r.xyz.x,r.xyz.y,r.xyz.z)),
   byRef=new Map(positions.map((v,i)=>[v,matched[i].id]));
  let hull;
  try{hull=new ConvexHull().setFromPoints(positions);}
  catch(e){throw new RangeError('not an independently supported full 3D convex hull: '+e.message);}
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
  }
 }
 if(matched.length>4){
  const originalXYZ=Object.fromEntries(matched.map(r=>[r.id,r.xyz]));
  faces.splice(0,faces.length,...mergeCoplanarQuickHullTriangles(faces,originalXYZ));
 }
 for(const face of faces)for(let i=0;i<face.length;i++){
  const start=face[i],end=face[(i+1)%face.length],
   key=[start,end].sort().join('|');
  if(!seenEdges.has(key)){seenEdges.add(key);edges.push([start,end]);}
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
  status:manual?
   'manually-paired-convex-candidate-requires-source-topology-review':
   'automatic-unique-convex-candidate-requires-source-assumption-review',
  knownViewPair:[first,second],
  sourceCorrespondenceUniqueWithinAssumption:!manual,
  source2DVerticesMatchedWithoutManualIds:!manual,
  explicitlyReviewedManyToOnePaperProjectionPairs:manual,
  originalDistinctViewVertexCounts:{[first]:a.length,[second]:b.length},
  reviewedOriginal3DPairCount:manual?pairs.length:0,
  candidateClosedConvexTopologyInferredByPinnedThreeQuickHull:matched.length>4,
  candidateTetrahedronTopologyDeductedFromFourExtremes:matched.length===4,
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
module.exports={inferC1UniqueConvexGeometryCandidate,
 mergeCoplanarQuickHullTriangles,exactCoplanarOriginalVertices};
