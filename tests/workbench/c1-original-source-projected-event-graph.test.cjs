'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1ReviewedProjectedSourceEventGraph:audit}=
 require('../../workbench/c1-reviewed-projected-source-event-graph.cjs');
const pt=(x,y,z)=>({x,y,z});
const box=()=>{
 const g=prismMesh({solid:{min:pt(-3,-4,-5),max:pt(15,20,27)}});
 return {...g,id:'C1EventBox'};
};
const tetra=()=>({id:'C1EventTetra',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{A:pt(0,0,0),B:pt(17,1,3),
  C:pt(3,16,2),D:pt(5,6,23)},
  edges:[['A','B'],['A','C'],['A','D'],
   ['B','C'],['B','D'],['C','D']],
  faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]}});
function verify(g,r){
 assert.equal(r.sourceGeometryId,g.id);
 assert.equal(r.signedV5ActionCount,0);
 assert.equal(r.originalSourceEdgeViewCount,g.data.edges.length*3);
 assert.equal(r.partitionedSourceSubintervalCount,
  r.rows.reduce((n,x)=>n+x.spans.length,0));
 assert.equal(r.sourceIntervalEngineeringLineStylesCertified,false);
 for(const x of r.rows){
  assert.equal(x.signedV5ActionCount,0);
  assert.ok(x.cutParameters[0]===0&&x.cutParameters.at(-1)===1);
  assert.ok(x.cutParameters.every((t,i)=>Number.isFinite(t)&&
   (i===0||t>x.cutParameters[i-1])));
  assert.ok(x.spans.every(s=>s.sourceGeometryId===g.id&&
   s.sourceEdgeId===x.sourceEdgeId&&s.originalParameterRange[0]>=0&&
   s.originalParameterRange[1]<=1&&s.signedV5Action===false&&
   s.engineeringLineStyle==='undetermined'));
  assert.ok(x.encounters.every(e=>
   e.original3DPhysicalJunctionProven!==e.projectedOnlyUnresolved));
 }
 assert.equal(r.nonHullSourceSubintervalCount+r.hullMaskedSubintervalCount,
  r.partitionedSourceSubintervalCount);
 assert.ok(Object.isFrozen(r));
}
test('reviewed original box uses shared M4 projected edge cuts, never V5',()=>{
 const g=box(),r=audit({geometry:g,revision:7});
 verify(g,r);
 assert.ok(r.actualM4OriginalSourcePairwiseEventCount>0);
 assert.ok(r.exactSharedOriginalVertexEncounters>0);
 assert.ok(r.hullMaskedSubintervalCount>0);
});
test('skew tetra uses same original-source 3D/paper junction graph as box',()=>{
 const g=tetra(),r=audit({geometry:g,revision:12});
 verify(g,r);
 assert.ok(r.actualM4OriginalSourcePairwiseEventCount>0);
 assert.ok(r.hullMaskedSubintervalCount>0);
 assert.ok(r.nonHullSourceSubintervalCount>0);
});
test('a missing original face and repeated source identity fail before graph can sign',()=>{
 const g=box();
 assert.throws(()=>audit({geometry:{...g,data:{...g.data,
  faces:g.data.faces.slice(1)}},revision:4}),/closed|Euler|face/);
 assert.throws(()=>audit({geometry:{...g,data:{...g.data,
  edges:[...g.data.edges,g.data.edges[0]]}},revision:4}),
 /closed|Euler|duplicate|explicit finite/);
 assert.throws(()=>audit({geometry:g,revision:0}),/revision/);
});
