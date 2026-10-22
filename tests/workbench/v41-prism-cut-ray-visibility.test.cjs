'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classifyPrismSectionVisibility:check}=
 require('../../engines/spatial/sections/rectangular-prism-cut-visibility.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(min=P(0,0,0),max=P(10,10,10))=>({min,max});
const plane=(point,normal)=>({point,normal});
const cut=z=>plane(P(0,0,z),P(1,1,1));
const solve=(kept,view,z=12)=>check(box(),cut(z),{
 retainedHalfspace:kept,observerDirection:view});
test('04 observer ray toward removed side sees all six verified open polygon sides',()=>{
 const result=solve('negative',P(0,0,1));
 assert.equal(result.status,'ready');
 assert.equal(result.totalEdges,6);
 assert.equal(result.counts.visible,6);
 assert.equal(result.counts.hidden,0);
 assert.equal(result.counts.undetermined,0);
 assert.equal(result.visibilityVerified,true);
 assert.equal(result.v5LineStylesReady,false);
 assert.equal(result.boundaryEndpointsVerified,false);
 assert.equal(result.firstAngleViewConventionsSignedOff,false);
});
test('04 retained side reverses visibility and preserves uncertain tangent face cases',()=>{
 const a=solve('negative',P(0,0,1));
 const b=solve('positive',P(0,0,1));
 assert.equal(a.counts.visible,6);
 assert.ok(b.counts.visible>0);
 assert.ok(b.counts.hidden>0);
 assert.ok(b.counts.undetermined>0);
 assert.equal(b.edgeInteriorsVerified,false);
 assert.equal(b.visibilityVerified,false);
});
test('04 face-interior source proof is a real finite prism face with two residuals',()=>{
 const result=solve('positive',P(0,0,1));
 assert.equal(result.status,'ready');
 for(const edge of result.edgeRuns){
  assert.match(edge.sourceEdgeId,/^section-edge-/);
  assert.match(edge.boxFace,/^[xyz]-(min|max)$/);
  assert.ok(edge.midpointPlaneResidualMm<1e-7);
  assert.ok(edge.midpointFaceResidualMm<1e-7);
  assert.ok(edge.endpointVisibilityVerified===false);
  assert.deepEqual(edge.projectedEndpoints.from,{
   V:{u:edge.from.x,v:edge.from.z},
   H:{u:edge.from.x,v:edge.from.y},
   W:{u:edge.from.y,v:edge.from.z}
  });
 }
});
test('04 observer parallel to plane refuses to make any visibility claims',()=>{
 const r=solve('negative',P(1,-1,0));
 assert.equal(r.status,'ready');
 assert.equal(r.counts.visible,0);assert.equal(r.counts.hidden,0);
 assert.equal(r.counts.undetermined,6);
 assert.equal(r.visibilityVerified,false);
});
test('04 negative plane normal orientation with material-side reversal yields same geometric verdict',()=>{
 const a=check(box(),cut(12),{
  retainedHalfspace:'negative',observerDirection:P(0,0,1)});
 const b=check(box(),plane(P(0,0,12),P(-1,-1,-1)),{
  retainedHalfspace:'positive',observerDirection:P(0,0,1)});
 assert.deepEqual(a.counts,b.counts);
 assert.equal(a.totalEdges,b.totalEdges);
});
test('04 observer vector normalization cannot change real visible and hidden counts',()=>{
 const a=solve('positive',P(0,0,1));
 const b=solve('positive',P(0,0,100));
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.deepEqual(a.counts,b.counts);
 assert.equal(a.totalEdges,b.totalEdges);
 for(let i=0;i<a.totalEdges;i++)
  assert.equal(a.edgeRuns[i].visibility,b.edgeRuns[i].visibility);
});
test('04 triangular, quadrilateral and hexagonal actual cut perimeters all classified',()=>{
 for(const [pl,count] of [
  [cut(3),3],
  [plane(P(0,0,5),P(0,0,1)),4],
  [cut(12),6]
 ]){
  const r=check(box(),pl,{
   retainedHalfspace:'negative',observerDirection:P(0,0,1)});
  assert.equal(r.status,'ready');
  assert.equal(r.totalEdges,count);
  assert.equal(r.sourcePerimeterVerified,true);
 }
});
test('04 near-tangency and endpoint uncertainty are not silently converted into solids',()=>{
 const r=solve('positive',P(1,-1,1e-12));
 assert.equal(r.status,'ready');
 assert.equal(r.counts.undetermined,r.totalEdges);
 assert.equal(r.visibilityVerified,false);
 assert.equal(r.boundaryEndpointsVerified,false);
});
test('04 no intersection, touching vertex and coplanar face produce no ray classes',()=>{
 for(const pl of [
  cut(40),cut(0),
  plane(P(0,0,0),P(0,0,1))
 ]){
  const r=check(box(),pl,{retainedHalfspace:'positive',
   observerDirection:P(0,0,1)});
  assert.equal(r.status,'blocked');
  assert.deepEqual(r.edgeRuns,[]);
  assert.equal(r.visibilityVerified,false);
 }
});
test('04 missing material choice and invalid ray directions rejected before any verdict',()=>{
 assert.throws(()=>check(box(),cut(12),{
  observerDirection:P(0,0,1)}),/retainedHalfspace/);
 assert.throws(()=>check(box(),cut(12),{
  retainedHalfspace:'bad',observerDirection:P(0,0,1)}),/retainedHalfspace/);
 assert.throws(()=>check(box(),cut(12),{
  retainedHalfspace:'negative',observerDirection:P(0,0,0)}),/observer ray/);
 assert.throws(()=>check(box(),cut(12),{
  retainedHalfspace:'negative',observerDirection:P(Infinity,0,0)}),/observer ray/);
});
test('04 immutable input, finite geometric residual and deterministic proof',()=>{
 const b=box(),pl=cut(12),ray=P(0,0,1);
 const config={retainedHalfspace:'positive',observerDirection:ray};
 const a=check(b,pl,config),again=check(
  structuredClone(b),structuredClone(pl),structuredClone(config));
 assert.deepEqual(a,again);
 assert.deepEqual(b,box());assert.deepEqual(pl,cut(12));
 assert.deepEqual(ray,P(0,0,1));
 assert.ok(a.maxResidualMm<1e-7);
 assert.equal(a.standardViewMappingVerified,false);
});
