'use strict';
/**
 * Verify ORIGINAL OCCT BRep vertex topology while native TopoDS handles live.
 * HLR output vertices are newly generated objects and need not share TShape
 * with each other or with these originals. This is a positive physical M0
 * source-vertex identity proof, NOT generated HLR edge history or V5 signoff.
 */
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC1OriginalBRepVertexTShapeTopology({geometry,originalNativeVertexHandles}={}){
 const points=geometry?.data?.points,edges=geometry?.data?.edges;
 if(typeof geometry?.id!=='string'||!geometry.id||!points||
    !Array.isArray(edges)||!edges.length||edges.length>256||
    !Array.isArray(originalNativeVertexHandles)||
    originalNativeVertexHandles.length<2||
    originalNativeVertexHandles.length>1024)
  throw new TypeError('current original BRep vertex occurrences and reviewed M0 edges required');
 const used=new Set(),expectedOccurrences=new Map();
 for(const edge of edges){
  if(!Array.isArray(edge)||edge.length!==2||edge[0]===edge[1]||
     edge.some(id=>typeof id!=='string'||!Object.hasOwn(points,id)))
   throw new RangeError('invalid reviewed physical source edge');
  edge.forEach(id=>{used.add(id);
   expectedOccurrences.set(id,(expectedOccurrences.get(id)||0)+1);
  });
 }
 // For a complete closed M0 shell, verify every physical edge belongs to
 // exactly two faces. TopExp returns an edge endpoint once PER face-owned
 // source edge occurrence. Isolated fixtures without faces have one.
 const faces=geometry.data.faces;
 const multiplicity=Array.isArray(faces)&&faces.length?2:1;
 if(multiplicity===2){
  const key=(a,b)=>[a,b].sort().join('|');
  const incidences=new Map(edges.map(edge=>[key(...edge),0]));
  if(incidences.size!==edges.length)
   throw new RangeError('duplicate original physical edge in native vertex audit');
  for(const face of faces){
   if(!Array.isArray(face)||face.length<3||
      new Set(face).size!==face.length)
    throw new RangeError('invalid original closed M0 face incidence');
   for(let i=0;i<face.length;i++){
    const id=key(face[i],face[(i+1)%face.length]);
    if(!incidences.has(id))
     throw new RangeError('unknown original closed M0 face edge');
    incidences.set(id,incidences.get(id)+1);
   }
  }
  if([...incidences.values()].some(count=>count!==2))
   throw new RangeError('original closed M0 source is not exactly two-face manifold');
 }
 for(const [id,count] of expectedOccurrences)
  expectedOccurrences.set(id,count*multiplicity);
 const byId=new Map();
 for(const row of originalNativeVertexHandles){
  const id=row?.sourceVertexId,shape=row?.vertex,model=points[id],xyz=row?.originalModelXYZ;
  if(!used.has(id)||!model||!xyz||
     !['x','y','z'].every(k=>Number.isFinite(model[k])&&xyz[k]===model[k])||
     typeof shape?.IsSame!=='function'||shape.IsNull?.()===true||
     shape.IsSame(shape)!==true)
   throw new RangeError('unbound or invalid original native 3D TopoDS vertex occurrence');
  if(!byId.has(id))byId.set(id,[]);
  byId.get(id).push(shape);
 }
 // Native traversal is face-owned for complete closed shapes. The exact
 // per-vertex multiplicity is determined by reviewed M0 face incidence;
 // arbitrary extra same-TShape records are NOT accepted as evidence.
 if(byId.size!==used.size||
    originalNativeVertexHandles.length!==2*edges.length*multiplicity||
    [...expectedOccurrences].some(([id,count])=>byId.get(id)?.length!==count))
  throw new RangeError('missing or duplicated original native 3D TopoDS source vertex occurrence');
 let same=0,different=0;
 const occurrences=originalNativeVertexHandles;
 for(let i=0;i<occurrences.length;i++)for(let j=i+1;j<occurrences.length;j++){
  const a=occurrences[i],b=occurrences[j];
  const forward=a.vertex.IsSame(b.vertex),reverse=b.vertex.IsSame(a.vertex);
  if(typeof forward!=='boolean'||typeof reverse!=='boolean'||forward!==reverse)
   throw new RangeError('asymmetric original native TopoDS vertex IsSame');
  if(forward!==(a.sourceVertexId===b.sourceVertexId))
   throw new RangeError('original M0 vertex identity contradicts actual BRep TShape topology');
  if(forward)same++;else different++;
 }
 const ids=[...byId.keys()].sort();
 return freeze({
  schema:'draftai-c1-original-occt-brep-vertex-physical-topology/1',
  sourceGeometryId:geometry.id,
  originalM0SourceVertexIds:ids,
  originalM0VertexNativeOccurrenceCounts:Object.fromEntries(ids.map(id=>
   [id,byId.get(id).length])),
  originalBRepVertexOccurrencesChecked:occurrences.length,
  allOriginalBRepVertexPairsCompared:
   occurrences.length*(occurrences.length-1)/2,
  originalSamePhysicalVertexTopoDSPairs:same,
  originalDistinctPhysicalVertexTopoDSPairs:different,
  allReviewedOriginalSourceVerticesNativeTShapeVerified:true,
  generatedHLRVertexIsSameNotRequiredForOriginalPhysicalJunction:true,
  generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
  allOpaqueFaceVisibilityCertified:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0
 });
}
module.exports={auditC1OriginalBRepVertexTShapeTopology};
