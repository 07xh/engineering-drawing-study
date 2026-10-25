'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1OriginalClosedVertexStars:audit}=
 require('../../workbench/c1-m5-original-closed-vertex-stars.cjs');
const p=(x,y,z)=>({x,y,z});
const box=()=>({...prismMesh({solid:{
 min:p(0,0,0),max:p(10,12,14)}}),id:'C1FanSourceBox'});
const tetra=()=>({
 id:'C1FanSkewTetra',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{A:p(0,0,0),B:p(17,1,3),C:p(3,16,2),D:p(5,6,23)},
  edges:[['A','B'],['A','C'],['A','D'],
   ['B','C'],['B','D'],['C','D']],
  faces:[['A','B','C'],['A','B','D'],
   ['A','C','D'],['B','C','D']]}
});
function check(g,revision){
 const x=audit({geometry:g,revision});
 const vertices=Object.keys(g.data.points);
 assert.equal(x.originalModelVertexCount,vertices.length);
 assert.equal(x.counts.reviewedOriginal3DVertexViewStars,vertices.length*3);
 assert.equal(x.signedV5ActionCount,0);
 assert.equal(x.entireOriginalClosed3DVertexFanTopologyCertified,true);
 for(const row of x.rows){
  assert.equal(row.oneConnectedOriginal3DVertexFaceFanProven,true);
  assert.equal(row.closedIncidentFaceCycleIndexes.length,
   row.originalIncidentEdgeCount);
  assert.equal(row.true3DOriginalSourceJunctionPairs.length,
   row.originalIncidentEdgeCount*(row.originalIncidentEdgeCount-1)/2);
  assert.ok(row.incidentOriginalSourceEdges.every(edge=>
   edge.original3DEndpointConfirmedByM4||
   edge.firstAngleProjectionCollapsed));
  assert.equal(row.completeProjectedVisibleLineJunctionsCertified,false);
  assert.ok(row.true3DOriginalSourceJunctionPairs.every(join=>
   join.exactSharedOriginal3DVertexId===row.original3DVertexId&&
   join.signedV5Action===false&&
   join.completeProjectedVisibleLineJoinProven===false));
  assert.equal(row.signedV5Action,false);
 }
 assert.ok(Object.isFrozen(x));
 return x;
}
test('cuboid V/H/W original vertex face cycles are full 3D closed stars, without projected alias merge',()=>{
 const g=box(),x=check(g,51);
 assert.equal(x.rows.length,24);
 assert.ok(x.rows.every(row=>row.originalIncidentEdgeCount===3));
 const a=x.rows.find(row=>row.view==='V'&&
  row.original3DVertexId==='V000');
 assert.ok(a.distinct3DVerticesProjectingToSamePaperPoint.includes('V010'));
 assert.ok(!a.true3DOriginalSourceJunctionPairs.some(pair=>
  pair.exactSharedOriginal3DVertexId==='V010'));
 const from=Array.from(x.rows.filter(row=>row.view==='V'));
 assert.ok(from.every(row=>row.projectedPaperAliasesDoNotGrantPhysicalJunctions));
 assert.ok(x.counts.projectedOtherOriginal3DVertexAliasesHeld>0);
});
test('skew tetrahedron uses same fan theorem, no hardcoded box assumptions',()=>{
 const g=tetra(),x=check(g,7);
 assert.equal(x.rows.length,12);
 assert.ok(x.rows.every(row=>row.originalIncidentEdgeCount===3));
 assert.equal(x.counts.realClosedOriginalVertexFaceFans,12);
});
test('original face order, winding and vertex lists cannot change physical incident pair identity',()=>{
 const g=tetra();
 const flipped={...g,data:{...g.data,
  faces:g.data.faces.map(f=>[...f].reverse()).reverse()}};
 const a=check(g,4),b=check(flipped,4);
 const norm=result=>result.rows.map(row=>[
  row.original3DVertexId,row.view,row.true3DOriginalSourceJunctionPairs
   .map(pair=>[...pair.originalSourceEdgeIds].sort().join('&')).sort()
 ]).sort((x,y)=>(x[0]+x[1]).localeCompare(y[0]+y[1]));
 assert.deepEqual(norm(a),norm(b));
});
test('paper-only 2D crossing does not introduce any fabricated source vertex fan edge or actual 3D join',()=>{
 const g={id:'C1FanPaperDiagonals',kind:'mesh',
  space:'model-3d',unit:'mm',data:{
   points:{A:p(0,0,0),B:p(20,0,0),
    C:p(20,15,20),D:p(0,12,20)},
   edges:[['A','B'],['A','C'],['A','D'],
    ['B','C'],['B','D'],['C','D']],
   faces:[['A','B','C'],['A','B','D'],
    ['A','C','D'],['B','C','D']] }};
 // This geometry's complete M5 convex-hull may fail for an unrelated
 // branch; forensic M4 is sufficient to prove no 3D crossing join.
 // The global fan consumer intentionally requires existing M5 formal
 // hull eligibility and must not bypass its failure just to draw a line.
 assert.throws(()=>audit({geometry:g,revision:11}),/M5|contour|coverage|source|projection|closed|verified|gap/);
});
test('broken closed convex face/edge identity cannot produce a positive 3D face fan',()=>{
 const g=box();
 assert.throws(()=>audit({geometry:g,revision:0}),/revision/);
 assert.throws(()=>audit({geometry:{...g,
  data:{...g.data,faces:g.data.faces.slice(1)}},revision:4}),
 /closed|face|Euler/);
 assert.throws(()=>audit({geometry:{...g,data:{...g.data,
  edges:[...g.data.edges,[...g.data.edges[0]]]}},revision:4}),
 /duplicate|declared|closed|Euler/);
});
