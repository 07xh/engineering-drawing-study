'use strict';
/**
 * Audit actual sewn OCCT BRep face/edge incidence while native handles live.
 * Face-edge IsSame proves ORIGINAL 3D source topology, not generated HLR
 * edge lineage, opaque-face occlusion, engineering style or V5 authorization.
 */
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const edgeId=(g,a,b)=>g.id+'::'+[a,b].sort().join('|');
function auditC1OriginalBRepFaceEdgeAdjacency({
 geometry,originalNativeEdgeHandles,nativeFaceEdgeInventories
}={}){
 const data=geometry?.data;
 if(typeof geometry?.id!=='string'||!geometry.id||
    !Array.isArray(data?.faces)||!data.faces.length||data.faces.length>64||
    !Array.isArray(data.edges)||!data.edges.length||data.edges.length>256||
    !Array.isArray(originalNativeEdgeHandles)||!originalNativeEdgeHandles.length||
    originalNativeEdgeHandles.length>512||
    !Array.isArray(nativeFaceEdgeInventories)||
    nativeFaceEdgeInventories.length!==data.faces.length)
  throw new TypeError('complete original M0 faces and live native BRep face/edge inventories required');
 const expectedEdges=new Set();
 for(const e of data.edges){
  if(!Array.isArray(e)||e.length!==2||e[0]===e[1]||
     e.some(id=>typeof id!=='string'||!Object.hasOwn(data.points??{},id)))
   throw new RangeError('invalid reviewed original source edge');
  const id=edgeId(geometry,e[0],e[1]);
  if(expectedEdges.has(id))throw new RangeError('duplicate reviewed original source edge');
  expectedEdges.add(id);
 }
 // TopExp_Explorer on a sewn shell can return one occurrence per face.
 // A physical source edge is allowed to occur twice ONLY when both native
 // occurrences are symmetrically IsSame: it is one actual shared TShape,
 // not two coincident but topologically unrelated edges. Deduplicate for
 // the source/face bijection without discarding the occurrence evidence.
 const nativeEdges=[],nativeBySource=new Map();
 for(const row of originalNativeEdgeHandles){
  if(!expectedEdges.has(row?.sourceEdgeId)||
     typeof row.edge?.IsSame!=='function'||row.edge.IsNull?.()===true||
     row.edge.IsSame(row.edge)!==true)
   throw new RangeError('unbound original native BRep source edge');
  const prior=nativeBySource.get(row.sourceEdgeId);
  if(prior){
   const forward=row.edge.IsSame(prior.edge),
    reverse=prior.edge.IsSame(row.edge);
   if(typeof forward!=='boolean'||typeof reverse!=='boolean'||
      forward!==reverse||!forward)
    throw new RangeError('repeated sewn source edge is not the same native TopoDS TShape');
  }else{
   nativeBySource.set(row.sourceEdgeId,row);
   nativeEdges.push(row);
  }
 }
 if(nativeEdges.length!==expectedEdges.size)
  throw new RangeError('missing original native BRep source edge');
 for(let i=0;i<nativeEdges.length;i++)for(let j=i+1;j<nativeEdges.length;j++){
  const a=nativeEdges[i],b=nativeEdges[j];
  const f=a.edge.IsSame(b.edge),r=b.edge.IsSame(a.edge);
  if(typeof f!=='boolean'||f!==r||f!==(a.sourceEdgeId===b.sourceEdgeId))
   throw new RangeError('original native BRep edge TShape/source mismatch');
 }
 const expectedFaceKeys=new Map();
 for(let index=0;index<data.faces.length;index++){
  const face=data.faces[index];
  if(!Array.isArray(face)||face.length<3||new Set(face).size!==face.length||
     face.some(id=>typeof id!=='string'||!Object.hasOwn(data.points,id)))
   throw new RangeError('invalid original M0 polygon face');
  const ids=face.map((a,i)=>edgeId(geometry,a,face[(i+1)%face.length])).sort();
  if(ids.some(id=>!expectedEdges.has(id)))
   throw new RangeError('M0 face has an unreviewed boundary edge');
  const key=ids.join('\u0000');
  if(expectedFaceKeys.has(key))throw new RangeError('duplicate original M0 face');
  expectedFaceKeys.set(key,index);
 }
 const matched=new Set(),faceRows=[],adjacent=new Map([...expectedEdges].map(id=>[id,[]]));
 for(const face of nativeFaceEdgeInventories){
  if(!Array.isArray(face)||face.length<3||face.length>256)
   throw new RangeError('invalid actual native BRep face edge inventory');
  const sources=[];
  for(const edge of face){
   if(typeof edge?.IsSame!=='function'||edge.IsNull?.()===true||
      edge.IsSame(edge)!==true)
    throw new RangeError('invalid actual native BRep face edge');
   const candidates=new Set();
   for(const row of nativeEdges){
    const f=edge.IsSame(row.edge),r=row.edge.IsSame(edge);
    if(typeof f!=='boolean'||f!==r)
     throw new RangeError('asymmetric native BRep face/source IsSame');
    if(f)candidates.add(row.sourceEdgeId);
   }
   if(candidates.size!==1)
    throw new RangeError('native BRep face edge lacks unique original 3D source');
   sources.push([...candidates][0]);
  }
  if(new Set(sources).size!==sources.length)
   throw new RangeError('duplicate original BRep source edge within one face');
  const key=sources.sort().join('\u0000'),faceIndex=expectedFaceKeys.get(key);
  if(faceIndex===undefined||matched.has(faceIndex))
   throw new RangeError('native BRep face boundary does not match unique reviewed M0 face');
  matched.add(faceIndex);
  for(const id of sources)adjacent.get(id).push(faceIndex);
  faceRows.push({originalM0FaceIndex:faceIndex,originalM0BoundarySourceEdgeIds:sources});
 }
 if(matched.size!==data.faces.length||
    [...adjacent.values()].some(faces=>faces.length!==2||faces[0]===faces[1]))
  throw new RangeError('native BRep source has missing or nonmanifold face adjacency');
 const sourceRows=[...adjacent].sort((a,b)=>a[0].localeCompare(b[0])).map(
  ([sourceEdgeId,faces])=>({sourceEdgeId,originalM0AdjacentFaceIndices:faces.sort((a,b)=>a-b)}));
 return freeze({schema:'draftai-c1-original-occt-brep-face-edge-adjacency/1',
  sourceGeometryId:geometry.id,
  nativeBRepFacesChecked:faceRows.length,
  nativeOriginalBRepEdgeExplorerOccurrencesChecked:originalNativeEdgeHandles.length,
  nativeOriginalBRepSourceEdgesWithExactlyTwoVerifiedFaces:sourceRows.length,
  allOriginalBRepSourceEdgesNativeFaceAdjacencyVerified:true,
  faces:faceRows.sort((a,b)=>a.originalM0FaceIndex-b.originalM0FaceIndex),
  edges:sourceRows,
  generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
  allOpaqueFaceVisibilityCertified:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0});
}
module.exports={auditC1OriginalBRepFaceEdgeAdjacency};
