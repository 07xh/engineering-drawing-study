'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditReviewedMultiBodyWholePhysicalEdgeRays}=
 require('../../workbench/m5-reviewed-multibody-original-edge-rays.cjs');
function box(id,{x0,x1,y0,y1,z0,z1}){
 const points={
  A:{x:x0,y:y0,z:z0},B:{x:x1,y:y0,z:z0},
  C:{x:x1,y:y1,z:z0},D:{x:x0,y:y1,z:z0},
  E:{x:x0,y:y0,z:z1},F:{x:x1,y:y0,z:z1},
  G:{x:x1,y:y1,z:z1},H:{x:x0,y:y1,z:z1}};
 const faces=[['A','D','C','B'],['E','F','G','H'],
  ['A','B','F','E'],['D','H','G','C'],
  ['A','E','H','D'],['B','C','G','F']];
 const edges=[],seen=new Set();
 for(const f of faces)for(let i=0;i<f.length;i++){
  const a=f[i],b=f[(i+1)%f.length],key=[a,b].sort().join('|');
  if(!seen.has(key)){seen.add(key);edges.push([a,b]);}
 }
 return {id,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges,faces}};
}
const left=()=>box('CompositeLeft',{x0:0,x1:2,y0:0,y1:2,z0:0,z1:2});
const right=()=>box('CompositeRight',{x0:4,x1:6,y0:-1,y1:3,z0:-1,z1:3});
test('continuous union ray depth hides a whole rear physical edge via ANOTHER solid',()=>{
 const proof=auditReviewedMultiBodyWholePhysicalEdgeRays({
  geometry:[left(),right()],revision:1
 });
 assert.equal(proof.componentCount,2);
 assert.equal(proof.allBodiesM0ClosedConvexVerified,true);
 assert(proof.counts.clear>0,'real positive frontmost physical source');
 assert(proof.counts.strictHidden>0,'real positive full-interval composite occlusion');
 const behind=proof.rows.filter(r=>r.sourceGeometryId==='CompositeLeft'&&
  r.view==='W'&&r.fullyContinuousUnionOpaqueRayOcclusionVerified===true);
 assert(behind.length>0,'rear left cube must be continuously hidden by right cube');
 assert(behind.some(r=>r.certifiedOccluderComponentIds.includes('CompositeRight')));
 const front=proof.rows.filter(r=>r.sourceGeometryId==='CompositeRight'&&
  r.view==='W'&&r.strictlyContinuousAllComponentFrontRayClearVerified===true);
 assert(front.length>0,'right cube must expose continuous W front sources');
 assert.equal(proof.signedV5ActionCount,0);
 assert.equal(proof.compositeNonconvexBooleanBoundaryCertified,false);
});
test('overlapping convex box union is admitted as nonconvex C2 composite rays ONLY',()=>{
 const a=box('LPart1',{x0:0,x1:3,y0:0,y1:2,z0:0,z1:2});
 const b=box('LPart2',{x0:2,x1:4,y0:0,y1:4,z0:0,z1:2});
 const p=auditReviewedMultiBodyWholePhysicalEdgeRays({
  geometry:[a,b],revision:2
 });
 assert.equal(p.componentCount,2);
 assert.equal(p.rows.length,72);
 assert.equal(p.generatedIntersectionCurveEdgesCertified,false);
 assert.equal(p.completedDrawingV5Authorized,false);
 assert(p.counts.clear+p.counts.strictHidden+p.counts.undetermined>0);
});
test('nonmanifold source and duplicate component IDs refuse certification',()=>{
 const b=right();b.data.faces.pop();
 assert.throws(()=>auditReviewedMultiBodyWholePhysicalEdgeRays({
  geometry:[left(),b],revision:1
 }));
 assert.throws(()=>auditReviewedMultiBodyWholePhysicalEdgeRays({
  geometry:[left(),left()],revision:1
 }),/unique original/);
});
