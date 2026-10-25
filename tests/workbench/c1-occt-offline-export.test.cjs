'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {makeCases,exportCases}=
 require('../../tools/cad-oracle/export-c1-cases.cjs');
const {project}=require('../../core/projection/conventions.js');
const {auditC1ConvexContourSourceCoverage}=
 require('../../workbench/m5-c1-convex-contour-source-coverage.cjs');

test('C1 OCCT oracle exports only authentic reviewed convex mm geometry and previously proven unsigned V/H/W M5 hulls',()=>{
 const packet=exportCases();
 assert.equal(packet.schema,'draftai-c1-occt-offline-cases/1');
 assert.equal(packet.cases.length,6);
 const ids=new Set(),views=['V','H','W'];
 for(const {id,geometry,reference} of packet.cases){
  assert.ok(!ids.has(id));ids.add(id);
  assert.equal(geometry.id,id);assert.equal(geometry.unit,'mm');
  assert.equal(geometry.space,'model-3d');
  assert.deepEqual(Object.keys(reference).sort(),[...views].sort());
  const proof=auditC1ConvexContourSourceCoverage({geometry,revision:23});
  assert.equal(proof.status,'scoped-convex-hull-physical-source-coverage');
  assert.equal(proof.officialLineStylesVerified,false);
  assert.equal(proof.completeSolidV5Ready,false);
  for(const view of views){
   const row=reference[view],sides=row.boundarySides;
   assert.equal(row.completePhysicalSourceCoverageVerified,true);
   assert.ok(sides.length>=3);
   for(let i=0;i<sides.length;i++){
    const side=sides[i],next=sides[(i+1)%sides.length];
    assert.ok(Math.hypot(side.to.u-next.from.u,
     side.to.v-next.from.v)<1e-8);
    const observed=proof.views.find(x=>x.view===view).sides[i];
    assert.deepEqual(side,{from:observed.fromModelMm,to:observed.toModelMm});
   }
   const xyz=Object.values(geometry.data.points);
   const hull=reference[view].boundarySides.map(s=>s.from);
   const min=(key,list)=>Math.min(...list.map(v=>v[key]));
   const max=(key,list)=>Math.max(...list.map(v=>v[key]));
   const p3=xyz.map(p=>project(p)[view]);
   for(const axis of ['u','v']){
    assert.ok(Math.abs(min(axis,hull)-min(axis,p3))<1e-7);
    assert.ok(Math.abs(max(axis,hull)-max(axis,p3))<1e-7);
   }
  }
 }
 assert.equal(ids.size,6);
 const same=makeCases();
 assert.deepEqual(same,packet.cases);
});

test('C1 OCCT corpus covers rigid rotation/translation/scale and a coplanar triangulation false crease without introducing a second solver',()=>{
 const cases=makeCases(),byId=new Map(cases.map(c=>[c.id,c]));
 const base=byId.get('C1StandardBox').geometry;
 const tri=byId.get('C1TriangulatedCoplanar').geometry;
 assert.equal(base.data.edges.length,12);
 assert.equal(tri.data.edges.length,13);
 const p=auditC1ConvexContourSourceCoverage({geometry:tri,revision:23});
 assert.equal(p.edgeLedger.sourceCreaseEvidence.provenCoplanarSubdivisionCount,1);
 const rotated=byId.get('C1RotatedBox').geometry;
 const first=Object.values(rotated.data.points)[0];
 assert.ok(Object.values(rotated.data.points).some(q=>
  Math.abs(q.x-first.x)>0&&Math.abs(q.y-first.y)>0));
 assert.equal(byId.get('C1TranslatedBox').geometry.data.edges.length,12);
 assert.equal(byId.get('C1ScaledBox').geometry.data.edges.length,12);
 assert.equal(byId.get('C1Tetrahedron').geometry.data.faces.length,4);
 assert.equal(byId.get('C1Tetrahedron').geometry.data.edges.length,6);
});
