'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {verifiedConvexMeshHalfspaces:meshProof}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {auditConvexGeometryVertexSet:exactAudit}=
 require('../../core/verification/convex-geometry-vertex-audit.cjs');
const {intersectConvexRayHalfspaces:ray,traceConvexRayDepth:trace}=
 require('../../core/numeric/convex-ray-depth.cjs');
const {certifyConvexPointRayClearance:clear}=
 require('../../core/numeric/convex-point-ray-clearance.cjs');
const P=(x,y,z)=>({x,y,z});
function cuboid(id,lo,scale){
 const hi=P(lo.x+10*scale,lo.y+12*scale,lo.z+8*scale),points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?hi.x:lo.x,y?hi.y:lo.y,z?hi.z:lo.z);
 const names=Object.keys(points),edges=[];
 for(const [i,a] of names.entries())for(const b of names.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{
  points,edges,faces:[
   ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
   ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
   ['V000','V010','V011','V001'],['V100','V110','V111','V101']
  ]}};
}
test('REAL verified closed Geometry → exact extreme vertices → ray agrees with analytic box slab oracle',()=>{
 for(const scale of [1/4,1,4]){
  for(const shift of [P(0,0,0),P(-32,16,8)]){
   const mesh=cuboid('NearBox',shift,scale);
   const topology=meshProof(mesh),exact=exactAudit({mesh,revision:21});
   assert.equal(topology.status,'validated-closed-convex-mesh');
   assert.equal(exact.status,'certified-exact-vertex-set');
   assert.equal(exact.vertexCount,8);
   assert.equal(exact.sourceClosedConvexTopologyVerified,true);
   assert.equal(exact.recessionConeTrivialVerified,true);
   assert.equal(exact.sourceRevisionIndependentlyVerified,false);
   const point=P(shift.x-5*scale,shift.y+6*scale,shift.z+4*scale);
   const hit=ray({point,observerDirection:P(1,0,0),halfspaces:topology.halfspaces});
   assert.equal(hit.status,'hit');
   assert.ok(Math.abs(hit.entryMm-5*scale)<1e-9);
   assert.ok(Math.abs(hit.exitMm-15*scale)<1e-9);
   const local=clear({
    point:P(shift.x+10*scale,shift.y+6*scale,shift.z+4*scale),
    observerDirection:P(1,0,0),
    solid:{id:'NearBox',halfspaces:topology.halfspaces}
   });
   assert.equal(local.status,'certified-clear');
   assert.equal(local.completeSceneVerified,false);
   assert.equal(local.officialLineStyleVerified,false);
   assert.equal(local.v5Ready,false);
   assert.equal(exact.completeSceneVerified,false);
   assert.equal(exact.v5VerifiedExportReady,false);
  }
 }
});
test('two REAL independently verified box meshes have analytic first-hit order regardless of input ordering',()=>{
 const near=meshProof(cuboid('Near',P(0,0,0),1));
 const far=meshProof(cuboid('Far',P(20,0,0),1));
 const solids=[
  {id:'Near',halfspaces:near.halfspaces},
  {id:'Far',halfspaces:far.halfspaces}
 ];
 for(const current of [solids,solids.slice().reverse()]){
  const r=trace({point:P(-5,6,4),observerDirection:P(1,0,0),solids:current});
  assert.equal(r.status,'occluded');
  assert.equal(r.nearestSolidId,'Near');
  assert.equal(r.nearestDepthMm,5);
  assert.equal(r.orderedHits.length,2);
  assert.equal(r.orderedHits[1].entryMm,25);
  assert.equal(r.depthOrderVerified,true);
  assert.equal(r.completeSceneVerified,false);
  assert.equal(r.fullContourVerified,false);
  assert.equal(r.officialLineStyleVerified,false);
 }
});
test('source topology or geometry corruption must refuse before any M0 claimed ray proof',()=>{
 const invalid=cuboid('Broken',P(0,0,0),1);
 invalid.data.faces.pop();
 assert.throws(()=>meshProof(invalid),/closed convex mesh/);
 assert.throws(()=>exactAudit({mesh:invalid,revision:1}),/closed convex mesh/);
 const wrong=cuboid('Other',P(0,0,0),1);wrong.unit='px';
 assert.throws(()=>meshProof(wrong),/closed convex mesh/);
 assert.throws(()=>exactAudit({mesh:wrong,revision:1}),/closed convex mesh/);
});
