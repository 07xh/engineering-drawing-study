'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyTrivialRecessionCone:certify}=
 require('../../core/numeric/trivial-recession-cone.cjs');
const P=(x,y,z)=>({x,y,z});
const H=(id,normal,offsetMm=1)=>({id,normal,offsetMm});
function cube(){
 return [
  H('xmin',P(-1,0,0)),H('xmax',P(1,0,0)),
  H('ymin',P(0,-1,0)),H('ymax',P(0,1,0)),
  H('zmin',P(0,0,-1)),H('zmax',P(0,0,1))
 ];
}
const verify=r=>{
 assert.equal(r.status,'certified-trivial-recession');
 assert.equal(r.recessionConeTrivialVerified,true);
 assert.ok(r.nonparallelPairsChecked>0);
 assert.equal(r.uncertainPairCount,0);
 assert.equal(r.pairExclusionWitnesses.length,r.nonparallelPairsChecked);
 assert.equal(r.nonemptyFeasibleSetVerified,false);
 assert.equal(r.sourceVertexCompletenessVerified,false);
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.officialLineStyleVerified,false);
 assert.equal(r.v5VerifiedExportReady,false);
};
test('axis-aligned cube succeeds without a strict-positive four-normal tetrahedron',()=>{
 const r=certify({halfspaces:cube()});verify(r);
 // The six axis normals have no 4-element STRICT positive combination
 // equal to zero: one needs all six opposing faces.
 assert.equal(r.nonparallelPairsChecked,12);
 for(const witness of r.pairExclusionWitnesses)
  assert.notEqual(witness.excludesPositiveRayFaceIndex,
   witness.excludesNegativeRayFaceIndex);
});
test('all bounded rectangular prisms and rotated convex cubes prove the same cone',()=>{
 const θ=Math.PI/6,c=Math.cos(θ),s=Math.sin(θ);
 const rotate=n=>P(c*n.x-s*n.y,s*n.x+c*n.y,n.z);
 verify(certify({halfspaces:cube().map(f=>({...f,normal:rotate(f.normal)}))}));
 const factors=[2,4,5,3,7,9];
 verify(certify({halfspaces:cube().map((f,i)=>({
  ...f,normal:P(f.normal.x*factors[i],f.normal.y*factors[i],
   f.normal.z*factors[i]),offsetMm:11*factors[i]}))}));
 const redundant=[...cube(),H('redundant',P(1,1,1),10)];
 verify(certify({halfspaces:redundant}));
});
test('tetrahedral normals with four strict opposing ray directions are bounded',()=>{
 verify(certify({halfspaces:[
  H('a',P(-1,-1,-1)),H('b',P(1,0,0)),
  H('c',P(0,1,0)),H('d',P(0,0,1))]}));
});
test('remove one bounding face: no false boundedness certificate',()=>{
 for(let omit=0;omit<6;omit++){
  const input=cube().filter((_,i)=>i!==omit);
  const r=certify({halfspaces:input});
  assert.equal(r.status,'undetermined');
  assert.equal(r.recessionConeTrivialVerified,false);
 }
});
test('rank-two, only one-sided normals and nearly parallel sets cannot be certified',()=>{
 for(const faces of [
  [H('a',P(1,0,0)),H('b',P(-1,0,0)),
   H('c',P(0,1,0)),H('d',P(0,-1,0))],
  [H('a',P(1,0,1)),H('b',P(-1,0,1)),
   H('c',P(0,1,1)),H('d',P(0,-1,1))],
  [H('a',P(1,0,0)),H('b',P(1,1e-14,0)),
   H('c',P(-1,0,0)),H('d',P(-1,-1e-14,0))]
 ]){
  const r=certify({halfspaces:faces});
  assert.equal(r.recessionConeTrivialVerified,false);
 }
});
test('inconsistent offset constraints cannot be mistaken for feasible geometry',()=>{
 const faces=cube();
 faces[0].offsetMm=-2;faces[1].offsetMm=-2; // x >= 2 and x <= -2
 const r=certify({halfspaces:faces});verify(r);
 assert.equal(r.nonemptyFeasibleSetVerified,false);
});
test('mutation-backed coordinate getters are snapshotted exactly once',()=>{
 const faces=cube();let reads=0;
 Object.defineProperty(faces[0].normal,'x',{
  get(){reads++;return reads===1?-1:Infinity;}
 });
 verify(certify({halfspaces:faces}));
 assert.equal(reads,1);
});
test('sparse, unbounded, nonfinite and zero normal inputs reject before certification',()=>{
 for(const bad of [
  [H('a',P(1,0,0))],null,
  cube().map((f,i)=>i===0?null:f),
  cube().map((f,i)=>i===0?H('zero',P(0,0,0)):f),
  cube().map((f,i)=>i===0?H('inf',P(Infinity,0,0)):f),
  cube().map((f,i)=>i===0?H('huge',P(1e300,0,0)):f),
  cube().map((f,i)=>i===0?H('bad',P(1,0,0),Infinity):f)
 ])assert.throws(()=>certify({halfspaces:bad}));
 const sparse=cube();delete sparse[1];
 assert.throws(()=>certify({halfspaces:sparse}));
});
test('certificate records strict numeric exclusions, not caller-trusted booleans',()=>{
 const faces=cube().map(f=>({...f,verified:true,completeSceneVerified:true}));
 const r=certify({halfspaces:faces});
 verify(r);assert.ok(Object.isFrozen(r));
 assert.ok(Object.isFrozen(r.pairExclusionWitnesses));
 assert.ok(r.pairExclusionWitnesses.every(Object.isFrozen));
});
