'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditC1OriginalBRepVertexTShapeTopology:audit}=
 require('../../engines/spatial/hlr/c1-ocjs-original-source-vertex-topology.cjs');
const geometry={id:'C1SkewTetra',data:{
 points:{A:{x:0,y:0,z:0},B:{x:17,y:1,z:3},
  C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}},
 edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']]}};
function fixture(){
 const occurrences=geometry.data.edges.flatMap(edge=>edge.map(id=>({
  sourceVertexId:id,originalModelXYZ:{...geometry.data.points[id]},
  vertex:{IsSame(other){return this.id===other.id;},IsNull(){return false;},id}
 })));
 return {geometry,originalNativeVertexHandles:occurrences};
}
test('actual original 3D source topology joins all six tetrahedral edges at four native TShapes',()=>{
 const r=audit(fixture());
 assert.equal(r.originalBRepVertexOccurrencesChecked,12);
 assert.equal(r.allOriginalBRepVertexPairsCompared,66);
 assert.equal(r.originalSamePhysicalVertexTopoDSPairs,12);
 assert.equal(r.originalDistinctPhysicalVertexTopoDSPairs,54);
 assert.deepEqual(r.originalM0SourceVertexIds,['A','B','C','D']);
 assert.deepEqual(r.originalM0VertexNativeOccurrenceCounts,{A:3,B:3,C:3,D:3});
 assert.equal(r.allReviewedOriginalSourceVerticesNativeTShapeVerified,true);
 assert.equal(r.generatedHLREdgeToOriginalTopoDSHistoryCertified,false);
 assert.equal(r.signedV5ActionCount,0);
 assert.ok(Object.isFrozen(r.originalM0SourceVertexIds));
});
test('original native TShape may be shared even if all generated HLR vertex TShapes differ',()=>{
 const x=fixture();
 // The input is deliberately only the ORIGINAL BRep; generated HLR native
 // vertices are independent and cannot veto genuine original 3D incidence.
 const r=audit(x);
 assert.equal(r.generatedHLRVertexIsSameNotRequiredForOriginalPhysicalJunction,true);
});
test('sewn native vertex explorer may repeat a proven physical TShape but cannot omit an original endpoint',()=>{
 const missing=fixture();
 missing.originalNativeVertexHandles.splice(0,1);
 assert.throws(()=>audit(missing),/missing original native/);
 const duplicate=fixture();
 duplicate.originalNativeVertexHandles.push({...duplicate.originalNativeVertexHandles[0]});
 const accepted=audit(duplicate);
 assert.equal(accepted.originalBRepVertexOccurrencesChecked,13);
 assert.equal(accepted.allReviewedOriginalSourceVerticesNativeTShapeVerified,true);
 const split=fixture();
 split.originalNativeVertexHandles.push({
  ...split.originalNativeVertexHandles[0],
  vertex:{id:'distinct-native-tshape',IsSame(other){return this.id===other.id;},IsNull(){return false;}}
 });
 assert.throws(()=>audit(split),/contradicts actual BRep TShape/);
 const reassigned=fixture();
 const row=reassigned.originalNativeVertexHandles[0];
 row.sourceVertexId='B';
 row.originalModelXYZ={...geometry.data.points.B};
 row.vertex={id:'B',IsSame(other){return this.id===other.id;},IsNull(){return false;}};
 assert.throws(()=>audit(reassigned),/missing original native/);
});
test('two distinct M0 3D vertices aliased to one native TopoDS vertex are rejected',()=>{
 const x=fixture();
 x.originalNativeVertexHandles[1].vertex.id='A';
 assert.throws(()=>audit(x),/contradicts actual BRep TShape/);
});
test('one M0 vertex split into two native TopoDS vertices is rejected',()=>{
 const x=fixture();
 x.originalNativeVertexHandles[2].vertex.id='different-A';
 assert.throws(()=>audit(x),/contradicts actual BRep TShape/);
});
test('asymmetric native IsSame, missing source occurrence and forged XYZ are rejected',()=>{
 const a=fixture();
 a.originalNativeVertexHandles[0].vertex.IsSame=()=>true;
 assert.throws(()=>audit(a),/asymmetric|contradicts/);
 const b=fixture();
 b.originalNativeVertexHandles=b.originalNativeVertexHandles.filter(r=>r.sourceVertexId!=='D');
 assert.throws(()=>audit(b),/missing original native/);
 const c=fixture();
 c.originalNativeVertexHandles[0].originalModelXYZ.x=999;
 assert.throws(()=>audit(c),/unbound or invalid/);
});
