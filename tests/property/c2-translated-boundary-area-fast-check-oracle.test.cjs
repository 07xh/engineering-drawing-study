'use strict';
/**
 * M5/C2 independent area oracle:
 * area(square 10x10 union of same square shifted by (5,5))
 * = 100 + 100 - 5*5 = 175 mm^2.
 * All three V/H/W projections of source cuboids have this shape.
 * Seeded/shrinkable fast-check only; no production numerical dependency.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fc=require('fast-check');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditOrthogonalProjectedUnionSilhouette:silhouette}=
 require('../../workbench/m5-orthogonal-projected-union-silhouette.cjs');
const {auditOrthogonalProjectedBoundaryTopology:topology}=
 require('../../workbench/m5-orthogonal-projected-boundary-topology.cjs');
const p=(x,y,z)=>({x,y,z});
const box=(id,a,b)=>({...prismMesh({solid:{min:a,max:b}}),id});
function check(x,y,z){
 const geometry=[
  box('A',p(x,y,z),p(x+10,y+10,z+10)),
  box('B',p(x+5,y+5,z+5),p(x+15,y+15,z+15))
 ];
 const region=silhouette({geometry,revision:310});
 const proof=topology({geometry,revision:310,
  projectedUnionSilhouetteEvidence:region});
 assert.equal(proof.allProjectedBoundaryCyclesSimpleAndClosedVerified,true);
 assert.equal(proof.totalSimpleClosedBoundaryLoopCount,3);
 for(const view of proof.projectedViews){
  assert.equal(view.sourceProjectedUnionAreaMm2,175);
  assert.equal(view.signedLoopAreasTotalMm2,175,
   'translation cannot change physical union area');
  assert.equal(view.projectedLoopAreaAndUnionOccupancyNumericallyConsistent,true);
  assert.equal(view.certifiedSimpleClosedBoundaryCycles.length,1);
  assert.equal(view.certifiedSimpleClosedBoundaryCycles[0].
   signedOrientedProjectedAreaMm2,175);
 }
 assert.equal(proof.signedV5LineActions,0);
 assert.equal(proof.v5Ready,false);
}
test('C2 M5: seeded fast-check rigid mm translations never change union silhouette topology/area',()=>{
 let n=0;
 const shifts=fc.tuple(fc.constantFrom(-99_000_000,-60_000_000,0,60_000_000,99_000_000),
  fc.integer({min:-100,max:100}));
 fc.assert(fc.property(shifts,shifts,shifts,
  ([x,dx],[y,dy],[z,dz])=>{
   check(x+dx,y+dy,z+dz);n++;
  }),{seed:20261025,numRuns:90});
 assert.equal(n,90);
});
