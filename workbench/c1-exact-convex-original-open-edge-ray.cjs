'use strict';
/**
 * Exact M0 binary64 supporting-halfspace proof for ORIGINAL convex open
 * source edges, cross-checked with same-run native source-filtered 3D HLR.
 * It does not identify a generated 2D TopoDS edge, prove endpoint pixels,
 * resolve co-projected sources, issue a GB line type, or authorize V5.
 */
const {VIEWS,FIRST_ANGLE_OBSERVER_RAYS,project}=
 require('../core/projection/conventions.js');
const {dyadic,difference,product,sum,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const neg=x=>({n:-x.n,e:x.e});
const sub=(a,b)=>difference(a,b);
const vec=(a,b)=>Object.fromEntries(['x','y','z'].map(k=>[k,sub(a[k],b[k])]));
const cross=(a,b)=>({
 x:sub(product(a.y,b.z),product(a.z,b.y)),
 y:sub(product(a.z,b.x),product(a.x,b.z)),
 z:sub(product(a.x,b.y),product(a.y,b.x))
});
const dot=(a,b)=>sum(sum(product(a.x,b.x),product(a.y,b.y)),
 product(a.z,b.z));
const zero=a=>['x','y','z'].every(k=>sign(a[k])===0);
const edgeId=(g,a,b)=>g.id+'::'+[a,b].sort().join('|');
function auditC1ExactConvexOriginalOpenEdgeRays({
 geometry,nativeFaceAdjacency,nativeM4Views
}={}){
 const data=geometry?.data,points=data?.points;
 if(typeof geometry?.id!=='string'||!geometry.id||
    geometry.kind!=='mesh'||geometry.space!=='model-3d'||
    geometry.unit!=='mm'||!points||typeof points!=='object'||
    !Array.isArray(data?.faces)||!Array.isArray(data?.edges)||
    data.faces.length<4||data.faces.length>64||
    data.edges.length<6||data.edges.length>256||
    !nativeM4Views||typeof nativeM4Views!=='object')
  throw new TypeError('current closed 3D M0 convex source and native M4 required');
 const ids=Object.keys(points);
 if(ids.length<4||ids.length>256)
  throw new RangeError('unbounded or degenerate original convex source');
 const xyz=new Map(ids.map(id=>{
  const p=points[id];
  if(!p||!['x','y','z'].every(k=>Number.isFinite(p[k])))
   throw new TypeError('nonfinite exact M0 source vertex');
  return [id,Object.fromEntries(['x','y','z'].map(k=>[k,dyadic(p[k])]))];
 }));
 const edges=new Map();
 for(const e of data.edges){
  if(!Array.isArray(e)||e.length!==2||e[0]===e[1]||
     e.some(id=>!xyz.has(id)))
   throw new RangeError('invalid exact M0 physical edge');
  const id=edgeId(geometry,...e);
  if(edges.has(id))throw new RangeError('duplicate exact M0 source edge');
  edges.set(id,e);
 }
 const faceRows=[],adjacent=new Map([...edges.keys()].map(id=>[id,[]]));
 const held=reason=>freeze({
  schema:'draftai-c1-exact-convex-original-open-edge-rays/1',
  sourceGeometryId:geometry.id,status:'held',reason,
  proofScope:'exact-received-binary64-M0-convex-open-edge-rays',
  counts:{exactOpenEdgeNativeClassAgreements:0,heldSourceViewRows:3*edges.size},
  views:{V:[],H:[],W:[]},
  generated2DTopoDSHistoryCertified:false,
  originalClosedEndpointRayCertified:false,
  wholeSceneCoProjectedDepthCertified:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0
 });
 for(let i=0;i<data.faces.length;i++){
  const face=data.faces[i];
  if(!Array.isArray(face)||face.length<3||new Set(face).size!==face.length||
     face.some(id=>!xyz.has(id)))return held('invalid-or-repeated-face-vertices');
  const boundary=face.map((id,j)=>edgeId(geometry,id,face[(j+1)%face.length]));
  if(boundary.some(id=>!adjacent.has(id))||
     new Set(boundary).size!==boundary.length)
   return held('face-boundary-not-original-source-edge');
  let n=null,anchor=xyz.get(face[0]);
  for(let j=1;j<face.length-1&&!n;j++)for(let k=j+1;k<face.length;k++){
   const candidate=cross(vec(xyz.get(face[j]),anchor),
    vec(xyz.get(face[k]),anchor));
   if(!zero(candidate))n=candidate;
  }
  if(!n)return held('exactly-degenerate-face');
  const faceSet=new Set(face),sides=ids.map(id=>({
   id,side:sign(dot(n,vec(xyz.get(id),anchor)))
  }));
  if(sides.some(x=>faceSet.has(x.id)&&x.side!==0))
   return held('face-not-exactly-planar-in-received-binary64');
  const exterior=sides.filter(x=>!faceSet.has(x.id));
  if(exterior.some(x=>x.side>0)&&exterior.some(x=>x.side<0))
   return held('source-not-exactly-convex');
  if(!exterior.some(x=>x.side!==0))
   return held('face-has-no-strict-interior-witness');
  if(exterior.some(x=>x.side>0))
   n=Object.fromEntries(['x','y','z'].map(k=>[k,neg(n[k])]));
  for(const id of boundary)adjacent.get(id).push(i);
  faceRows.push({originalM0FaceIndex:i,
   originalM0BoundarySourceEdgeIds:[...boundary].sort(),
   outward:n,anchor});
 }
 if([...adjacent.values()].some(a=>a.length!==2||a[0]===a[1]))
  return held('source-edge-not-exactly-two-face-manifold');
 const expectedFaces=faceRows.map(f=>({
  originalM0FaceIndex:f.originalM0FaceIndex,
  originalM0BoundarySourceEdgeIds:f.originalM0BoundarySourceEdgeIds
 }));
 const expectedEdges=[...adjacent].sort((a,b)=>a[0].localeCompare(b[0]))
  .map(([sourceEdgeId,faces])=>({sourceEdgeId,
   originalM0AdjacentFaceIndices:[...faces].sort((a,b)=>a-b)}));
 if(nativeFaceAdjacency?.schema!==
     'draftai-c1-original-occt-brep-face-edge-adjacency/1'||
    nativeFaceAdjacency.sourceGeometryId!==geometry.id||
    nativeFaceAdjacency.allOriginalBRepSourceEdgesNativeFaceAdjacencyVerified!==true||
    nativeFaceAdjacency.generatedHLREdgeToOriginalTopoDSHistoryCertified!==false||
    JSON.stringify(nativeFaceAdjacency.faces)!==JSON.stringify(expectedFaces)||
    JSON.stringify(nativeFaceAdjacency.edges)!==JSON.stringify(expectedEdges))
  throw new RangeError('real original native BRep face topology not aligned with exact M0');
 // Every original OPEN edge must lie strictly inside every nonincident
 // supporting halfspace; this proves local entry for a hidden ray.
 for(const [id,[a,b]] of edges){
  const midpoint=Object.fromEntries(['x','y','z'].map(k=>
   [k,product(sum(xyz.get(a)[k],xyz.get(b)[k]),{n:1n,e:-1})]));
  const incident=new Set(adjacent.get(id));
  for(let i=0;i<faceRows.length;i++){
   const f=faceRows[i],s=sign(dot(f.outward,vec(midpoint,f.anchor)));
   if(incident.has(i)?s!==0:s>=0)
    return held('open-edge-not-strictly-inside-other-supporting-faces');
  }
 }
 const views={},counts={exactOpenEdgeNativeClassAgreements:0,
  heldSourceViewRows:0,exactTangentFaceRayRows:0,
  exactTangentStrictExteriorRowsCertified:0,
  native3DClassOrParameterHeldRows:0};
 for(const view of VIEWS){
  const rows=nativeM4Views[view]?.nativeOriginal3DM4Candidates;
  if(!Array.isArray(rows)||rows.length>edges.size)
   throw new RangeError('incomplete same-run original 3D HLR source ledger');
  const bySource=new Map();
  for(const row of rows){
   if(!edges.has(row?.sourceEdgeId)||row.view!==view||
      bySource.has(row.sourceEdgeId))
    throw new RangeError('duplicate or stale native source class');
   bySource.set(row.sourceEdgeId,row);
  }
  const ray=FIRST_ANGLE_OBSERVER_RAYS[view];
  const exactRay=Object.fromEntries(['x','y','z'].map(k=>[k,dyadic(ray[k])]));
  views[view]=[];
  for(const [sourceEdgeId] of edges){
   const [a,b]=adjacent.get(sourceEdgeId);
   const na=faceRows[a].outward,nb=faceRows[b].outward;
   if(zero(cross(na,nb)))
    return held('coplanar-adjacent-faces-not-physical-crease');
   const sa=sign(dot(na,exactRay)),sb=sign(dot(nb,exactRay));
   const native=bySource.get(sourceEdgeId);
   // An original 3D edge can collapse to a point in this first-angle
   // view. The existing M4 consumer intentionally omits that source;
   // do not invent a drawable stroke or demand a native 3D HLR row.
   if(!native){
    const [id0,id1]=edges.get(sourceEdgeId);
    const p0=project(points[id0])[view],p1=project(points[id1])[view];
    if(p0.u!==p1.u||p0.v!==p1.v)
     throw new RangeError('missing noncollapsed native source HLR class');
    counts.heldSourceViewRows++;
    views[view].push({view,sourceEdgeId,
     exactIncidentOutwardObserverSigns:[sa,sb],
     exactOriginalOpenEdgeOpaqueFaceRayClass:null,
     originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified:false,
     reason:'original-edge-projection-collapsed',
     originalClosedEndpointRayCertified:false,
     generated2DTopoDSHistoryCertified:false,
     wholeSceneCoProjectedDepthCertified:false,
     engineeringLineStyle:'undetermined',signedV5Action:false});
    continue;
   }
   // A strictly positive incident outward halfspace derivative makes
   // EVERY open-edge observer ray leave this convex solid immediately.
   // The other face may be exactly tangent: its zero derivative cannot
   // cancel the strict exterior halfspace. A negative/zero or zero/zero
   // pair still has a tangential boundary ray and remains unsigned.
   const tangent=sa===0||sb===0;
   const candidate=sa>0||sb>0?'visible-sharp':
    sa<0&&sb<0?'hidden-sharp':null;
   let certified=false,reason=null;
   if(!candidate){
    reason='exact-tangent-face-ray';
    counts.exactTangentFaceRayRows++;
   }else{
    const segments=native.segments??[];
    const ranges=segments.map(s=>s.originalM0UnitParameterRange);
    const valid= native.native3DSourceParameterPartitionCompleteExactlyOnce===true&&
     native.M4OriginalUnitIntervalCandidateCoverageComplete===true&&
     native.native3DOriginalParameterPositiveGaps?.length===0&&
     native.native3DOriginalParameterPositiveOverlaps?.length===0&&
     native.M4ProjectedNative3DIntervalsHeldForBinary64Representation?.length===0&&
     segments.length>0&&segments.every(s=>
      s.view===view&&s.sourceEdgeId===sourceEdgeId&&
      s.derivedFromOriginalNative3DCurveNotGeneratedHLRPaper===true&&
      s.generated2DHLREdgeTopologyProven===false&&
      s.native3DHLRClass===candidate)&&
     exactCandidateIntervalCoverage([0,1],ranges).
      entireOriginalParameterIntervalCovered===true;
    if(valid){
     certified=true;counts.exactOpenEdgeNativeClassAgreements++;
     if(tangent)counts.exactTangentStrictExteriorRowsCertified++;
    }
    else {reason='native-3d-class-or-exact-parameter-not-certified';
     counts.native3DClassOrParameterHeldRows++;}
   }
   if(!certified)counts.heldSourceViewRows++;
   views[view].push({view,sourceEdgeId,
    exactIncidentOutwardObserverSigns:[sa,sb],
    exactOriginalOpenEdgeOpaqueFaceRayClass:candidate,
    originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified:certified,
    reason,originalClosedEndpointRayCertified:false,
    generated2DTopoDSHistoryCertified:false,
    wholeSceneCoProjectedDepthCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false});
  }
 }
 return freeze({schema:'draftai-c1-exact-convex-original-open-edge-rays/1',
  sourceGeometryId:geometry.id,status:'audited',
  proofScope:'exact-received-binary64-M0-convex-open-edge-rays',
  originalNativeBRepFaceAdjacencyCrossChecked:true,
  exactOriginalClosedConvexSupportingHalfspacesProven:true,
  counts,views,
  generated2DTopoDSHistoryCertified:false,
  originalClosedEndpointRayCertified:false,
  wholeSceneCoProjectedDepthCertified:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0});
}
module.exports={auditC1ExactConvexOriginalOpenEdgeRays};
