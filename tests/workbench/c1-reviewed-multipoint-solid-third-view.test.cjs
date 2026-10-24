'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const {reviewedSolidThirdView}=
 require('../../workbench/reviewed-multipoint-solid-third-view.cjs');
const box=(min,max)=>prismMesh({solid:{min,max}});
function given(mesh,pair,revision=7){
 return {geometryId:'KnownSolid',confirmedBy:'user',topologyConfirmed:true,
  revision,unit:'mm',vertices:Object.entries(mesh.data.points).map(([id,p])=>{
   const projected=project(p);
   return {id,knownViews:Object.fromEntries([...pair].map(v=>
    [v,[projected[v].u,projected[v].v]]))};
  }),edges:mesh.data.edges,faces:mesh.data.faces};
}
const cuboid=box({x:0,y:0,z:0},{x:30,y:15,z:20});
const skew=box({x:-9,y:3,z:5},{x:12,y:19,z:27});
for(const shape of [cuboid,skew])for(const pair of ['VH','VW','HW']){
 test('C1 '+pair+' independently reconstructs eight corresponding corners of general cuboid',()=>{
  const input=given(shape,pair);
  const r=reviewedSolidThirdView(input);
  assert.equal(r.status,'geometry-proven-in-confirmed-convex-scope');
  assert.equal(r.missingView,['V','H','W'].find(v=>!pair.includes(v)));
  assert.equal(r.scene.revision,7);
  assert.equal(r.provenVertexCount,8);
  assert.equal(r.provenEdgeCount,12);
  assert.equal(r.provenFaceCount,6);
  assert.equal(r.individual.length,8);
  assert.equal(r.geometryVerifiedWithinReviewedTopology,true);
  assert.equal(r.officialLineStylesVerified,false);
  assert.equal(r.v5Ready,false);
  assert.equal(r.inferredUnknownTopology,false);
  assert.equal(r.canExportCertifiedDrawing,false);
  assert.equal(r.steps.length,0);
  assert.equal(r.convexProof.provenTopology,'convex-closed-two-face-edges-and-euler');
  assert.ok(Object.isFrozen(r.scene));
  assert.ok(Object.isFrozen(r.geometry.data.points));
  assert.equal(r.thirdView.representation.kind,'mesh-projection');
  for(const [id,p] of Object.entries(shape.data.points)){
   for(const v of ['V','H','W']){
    assert.deepEqual(r.projections[v].points[id],project(p)[v]);
   }
  }
 });
}
test('C1 valid non-cuboid convex polyhedron uses same generic M0/03 chain',()=>{
 const mesh={data:{points:{
  A:{x:0,y:0,z:0},B:{x:20,y:0,z:0},
  C:{x:0,y:20,z:0},D:{x:0,y:0,z:24}},
  edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
  faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]}};
 const r=reviewedSolidThirdView(given(mesh,'VH'));
 assert.equal(r.provenVertexCount,4);
 assert.equal(r.provenEdgeCount,6);
 assert.equal(r.provenFaceCount,4);
 assert.equal(r.officialLineStylesVerified,false);
});
test('C1 same source views, identities and signed topology are required',()=>{
 const d=given(cuboid,'VH');delete d.vertices[2].knownViews.V;
 assert.throws(()=>reviewedSolidThirdView(d),/corresponding vertex IDs/);
 const e=given(cuboid,'VH');e.vertices[1].id=e.vertices[0].id;
 assert.throws(()=>reviewedSolidThirdView(e),/corresponding vertex IDs/);
 const f=given(cuboid,'VH');f.vertices[1].knownViews.H[0]+=7;
 assert.throws(()=>reviewedSolidThirdView(f),/unique 3D vertex/);
 const bad=given(cuboid,'VH');bad.vertices[0].knownViews.V[1]=NaN;
 assert.throws(()=>reviewedSolidThirdView(bad),/finite model mm/);
 const source=given(cuboid,'VH');source.vertices[0].x=0;
 assert.throws(()=>reviewedSolidThirdView(source),/corresponding vertex IDs/);
});
test('C1 undetermined topology must not become a signed solid',()=>{
 const p=given(cuboid,'VH');p.topologyConfirmed=false;
 assert.throws(()=>reviewedSolidThirdView(p),/topology/);
 const open=given(cuboid,'VH');open.faces.pop();
 assert.throws(()=>reviewedSolidThirdView(open),/closed|Euler|face|topology/i);
 const missingEdge=given(cuboid,'VH');missingEdge.edges.pop();
 assert.throws(()=>reviewedSolidThirdView(missingEdge),/closed|Euler|edge|topology/i);
 const rev=given(cuboid,'HW');rev.revision=-1;
 assert.throws(()=>reviewedSolidThirdView(rev),/revision/);
 const unit=given(cuboid,'HW');unit.unit='px';
 assert.throws(()=>reviewedSolidThirdView(unit),/mm/);
 const noUser=given(cuboid,'HW');noUser.confirmedBy='model';
 assert.throws(()=>reviewedSolidThirdView(noUser),/reviewed/);
});
test('C1 changing source model changes computed third view and source revision',()=>{
 const a=reviewedSolidThirdView(given(cuboid,'VH',2));
 const b=reviewedSolidThirdView(given(skew,'VH',3));
 assert.notDeepEqual(a.projections.W.points,b.projections.W.points);
 assert.equal(a.revision,2);
 assert.equal(b.revision,3);
 assert.equal(a.v5Ready,false);
 assert.equal(b.v5Ready,false);
});
test('C1 production page and bundle declare only reviewed local preview, not V5',()=>{
 const html=fs.readFileSync('labs/solid-third-view-live.html','utf8');
 const js=fs.readFileSync('labs/solid-third-view-live-entry.cjs','utf8');
 const build=fs.readFileSync('scripts/build-static.cjs','utf8');
 const home=require('../../ui-next/home.cjs').homeHTML();
 assert.match(html,/id="confirmed"/);
 assert.match(html,/id="pair"/);
 assert.match(html,/id="vertices"/);
 assert.match(html,/不是工程图实线\/虚线/);
 assert.match(js,/reviewedSolidThirdView/);
 assert.match(js,/data-visibility','undetermined/);
 assert.match(js,/data-official-v5','false/);
 assert.match(js,/topologyConfirmed:true/);
 assert.match(build,/'labs\/solid-third-view-live.html'/);
 assert.match(build,/labs\/solid-third-view-live-entry.cjs/);
 assert.match(home,/labs\/solid-third-view-live.html/);
});
