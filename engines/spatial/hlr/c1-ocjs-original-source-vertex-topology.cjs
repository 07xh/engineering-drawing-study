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
 const used=new Set();
 for(const edge of edges){
  if(!Array.isArray(edge)||edge.length!==2||edge[0]===edge[1]||
     edge.some(id=>typeof id!=='string'||!Object.hasOwn(points,id)))
   throw new RangeError('invalid reviewed physical source edge');
  edge.forEach(id=>used.add(id));
 }
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
 if(byId.size!==used.size)
  throw new RangeError('missing original native 3D TopoDS source vertex');
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
