'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditC1OriginalBRepFaceEdgeAdjacency:audit}=
 require('../../engines/spatial/hlr/c1-ocjs-original-source-face-adjacency.cjs');
const geometry={id:'C1SkewTetra',data:{points:{A:{},B:{},C:{},D:{}},
 edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
 faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]}};
const key=(a,b)=>geometry.id+'::'+[a,b].sort().join('|');
const shape=id=>({id,IsSame(x){return this.id===x.id;},IsNull(){return false;}});
function fixture(){
 const originalNativeEdgeHandles=geometry.data.edges.map(([a,b])=>({
  sourceEdgeId:key(a,b),edge:shape(key(a,b))}));
 const nativeFaceEdgeInventories=geometry.data.faces.map(face=>
  face.map((a,i)=>shape(key(a,face[(i+1)%face.length]))));
 return {geometry,originalNativeEdgeHandles,nativeFaceEdgeInventories};
}
test('real original face-edge source incidence has two faces per tetra edge',()=>{
 const r=audit(fixture());
 assert.equal(r.nativeBRepFacesChecked,4);
 assert.equal(r.nativeOriginalBRepSourceEdgesWithExactlyTwoVerifiedFaces,6);
 assert.equal(r.allOriginalBRepSourceEdgesNativeFaceAdjacencyVerified,true);
 assert.equal(r.generatedHLREdgeToOriginalTopoDSHistoryCertified,false);
 assert.equal(r.signedV5ActionCount,0);
 assert.ok(Object.isFrozen(r.edges[0].originalM0AdjacentFaceIndices));
});
test('reject missing, duplicated and aliased original BRep face-edge topology',()=>{
 const mutations=[
  x=>{x.nativeFaceEdgeInventories[0][0]=shape('other');},
  x=>{x.nativeFaceEdgeInventories[0][1]=x.nativeFaceEdgeInventories[0][0];},
  x=>{x.originalNativeEdgeHandles.pop();},
  // Duplicate a genuine source handle: every expected ID is still present,
  // but the native inventory is no longer exactly once per physical edge.
  x=>{x.originalNativeEdgeHandles.push({...x.originalNativeEdgeHandles[0]});},
  x=>{x.originalNativeEdgeHandles[1].edge.id=x.originalNativeEdgeHandles[0].edge.id;},
  x=>{x.nativeFaceEdgeInventories[1]=x.nativeFaceEdgeInventories[0];}
 ];
 for(const mutate of mutations){
  const x=fixture();mutate(x);
  assert.throws(()=>audit(x),/native|BRep|original|source|face/i);
 }
});
