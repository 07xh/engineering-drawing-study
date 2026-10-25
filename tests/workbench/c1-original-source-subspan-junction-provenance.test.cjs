'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1OriginalSourceSubspanJunctions:audit}=
 require('../../workbench/c1-original-source-subspan-junction-provenance.cjs');
const xyz=(x,y,z)=>({x,y,z});
const box=()=>{
 const g=prismMesh({solid:{min:xyz(-4,2,-6),max:xyz(21,17,30)}});
 return {...g,id:'C1JunctionBox'};
};
const tetra=()=>({
 id:'C1JunctionTetra',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{A:xyz(0,0,0),B:xyz(17,1,3),
 C:xyz(3,16,2),D:xyz(5,6,23)},
 edges:[['A','B'],['A','C'],['A','D'],
 ['B','C'],['B','D'],['C','D']],
 faces:[['A','B','C'],['A','B','D'],
 ['A','C','D'],['B','C','D']]}
});
function assertLedger(g,revision){
 const r=audit({geometry:g,revision});
 assert.equal(r.sourceGeometryId,g.id);
 assert.equal(r.revision,revision);
 assert.equal(r.signedV5ActionCount,0);
 assert.equal(r.constructionIntentAuthorized,false);
 assert.equal(r.wholeSolidV5Ready,false);
 assert.equal(r.m5OriginalContourAvailable,true);
 assert.equal(r.counts.originalSourceSubspanCount,
  r.rows.reduce((n,e)=>n+e.spans.length,0));
 assert.equal(r.counts.sourceEdgeViewCount,g.data.edges.length*3);
 assert.ok(r.counts.originalVertexEndpointWitnesses>0);
 for(const row of r.rows)for(const s of row.spans){
  assert.equal(s.officialEngineeringLineStyle,'undetermined');
  assert.equal(s.signedV5Action,false);
  assert.equal(s.fromEndpoint.authorizedAsV5Junction,false);
  assert.equal(s.toEndpoint.authorizedAsV5Junction,false);
  assert.equal(s.allOtherPhysicalSourceIntersectionsCertified,false);
  assert.ok(s.fromEndpoint.trueCrossSourceOriginalVertexIds.every(e=>
   e.sameOriginalVertexId===s.fromEndpoint.originalVertexId));
  assert.ok(s.toEndpoint.trueCrossSourceOriginalVertexIds.every(e=>
   e.sameOriginalVertexId===s.toEndpoint.originalVertexId));
 }
 assert.ok(Object.isFrozen(r));
 return r;
}
test('current reviewed box can prove original physical vertex identities without certifying line styles',()=>{
 const g=box(),result=assertLedger(g,17);
 assert.ok(result.counts.authenticatedForeignOriginalVertexEncounters>0);
 assert.ok(result.rows.some(e=>e.spans.some(s=>
  s.fromEndpoint.trueCrossSourceOriginalVertexIds.length>0||
  s.toEndpoint.trueCrossSourceOriginalVertexIds.length>0)));
});
test('one source graph works on unbalanced true tetrahedron, no special cases',()=>{
 const g=tetra(),result=assertLedger(g,25);
 assert.ok(result.counts.originalVertexEndpointWitnesses>0);
 assert.ok(result.counts.paperOnlyForeignSourceEncounters>=0);
});
test('a 2D diagonal crossing has SAME-edge continuity but NEVER a different-edge 3D junction',()=>{
 // V=(x,z): AC and BD diagonal lines intersect on paper; their
 // original 3D y coordinates differ. M5 whole contour is intentionally
 // not accepted for this source; forensic M4 mode cannot sign styles.
 const g={id:'C1PaperOnlyDiagonals',kind:'mesh',
  space:'model-3d',unit:'mm',data:{
   points:{A:xyz(0,0,0),B:xyz(20,0,0),
    C:xyz(20,15,20),D:xyz(0,12,20)},
   edges:[['A','B'],['A','C'],['A','D'],
    ['B','C'],['B','D'],['C','D']],
   faces:[['A','B','C'],['A','B','D'],
    ['A','C','D'],['B','C','D']]}}
 const result=audit({geometry:g,revision:9,
  proofMode:'m4-projected-events-only'});
 assert.equal(result.m5OriginalContourAvailable,false);
 assert.equal(result.signedV5ActionCount,0);
 const ac=g.id+'::A|C',bd=g.id+'::B|D';
 const row=result.rows.find(x=>x.view==='V'&&x.sourceEdgeId===ac);
 assert.ok(row&&row.spans.length>=2,
  'real M4 projected diagonal intersection must split the same 3D edge');
 const [first,second]=row.spans;
 assert.equal(second.sameOriginalSource3DContinuityFromPriorPiece,true);
 assert.deepEqual(first.to3D,second.from3D);
 assert.ok(second.fromEndpoint.paperOnlyOtherSourceEdgeIds.includes(bd));
 assert.equal(second.fromEndpoint.trueCrossSourceOriginalVertexIds.length,0);
 assert.equal(second.fromEndpoint.anotherOriginalSource3DPointInferred,false);
 assert.equal(second.signedV5Action,false);
});
test('invalid current geometry and revision fail before certifying physical connections',()=>{
 const g=box();
 assert.throws(()=>audit({geometry:g,revision:0}),/revision/);
 assert.throws(()=>audit({geometry:{...g,
  data:{...g.data,faces:g.data.faces.slice(1)}},revision:8}),
 /closed|face|Euler/);
 assert.throws(()=>audit({geometry:{...g,
  data:{...g.data,edges:[...g.data.edges,[...g.data.edges[0]]]},revision:8}),
 /duplicate|declared|explicit finite|Euler/);
});
