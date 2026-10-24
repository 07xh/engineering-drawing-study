'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditConvexGeometryVertexSet:run}=
 require('../../core/verification/convex-geometry-vertex-audit.cjs');
const {verifiedConvexMeshHalfspaces:meshProof}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const P=(x,y,z)=>({x,y,z});
function cube(id='Cube',lo=P(0,0,0),hi=P(10,12,8)){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?hi.x:lo.x,y?hi.y:lo.y,z?hi.z:lo.z);
 const keys=Object.keys(points),edges=[];
 for(const [i,a] of keys.entries())for(const b of keys.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
test('a current valid closed cube proves real source mesh and its exact vertex-set relation',()=>{
 const m=cube(),before=JSON.stringify(m),r=run({mesh:m,revision:31});
 assert.equal(r.status,'certified-exact-vertex-set');
 assert.equal(r.exactVertexSetVerified,true);
 assert.equal(r.recessionConeTrivialVerified,true);
 assert.equal(r.fullDimensionalVerified,true);
 assert.equal(r.vertexCount,8);
 assert.equal(r.sourceClosedConvexTopologyVerified,true);
 assert.equal(r.sourceRevision,31);
 assert.equal(r.sourceRevisionIndependentlyVerified,false);
 assert.equal(r.originalImageCalibrationVerified,false);
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.officialLineStyleVerified,false);
 assert.equal(r.v5VerifiedExportReady,false);
 assert.equal(JSON.stringify(m),before);
 assert.ok(Object.isFrozen(r));
});
test('all 3D translations preserve the real M0 source mesh audit',()=>{
 for(const shift of [P(0,0,0),P(-21,6,7),P(1000,-2000,500)]){
  const lo=shift,hi=P(shift.x+10,shift.y+12,shift.z+8);
  const r=run({mesh:cube('translated',lo,hi),revision:5});
  assert.equal(r.exactVertexSetVerified,true);
 }
});
test('independent closed manifold proof rejects incomplete/malformed/forged mesh before M0 trust',()=>{
 const actions=[
  s=>s.data.faces.pop(),
  s=>s.data.edges.pop(),
  s=>{s.data.points.V111=P(0,0,0);},
  s=>{s.unit='px';}
 ];
 for(const mutate of actions){
  const g=cube();mutate(g);
  assert.throws(()=>run({mesh:g,revision:1}),/closed convex mesh/);
 }
});
test('corrupt revision cannot be silently promoted to source-verified truth',()=>{
 assert.throws(()=>run({mesh:cube(),revision:-1}));
 assert.throws(()=>run({mesh:cube(),revision:1.5}));
 const first=run({mesh:cube(),revision:2});
 const later=run({mesh:cube(),revision:3});
 assert.equal(first.sourceRevision,2);
 assert.equal(later.sourceRevision,3);
 assert.equal(first.sourceRevisionIndependentlyVerified,false);
 assert.equal(later.sourceRevisionIndependentlyVerified,false);
});
test('single detached source snapshot prevents getter mutation between topology and exact audit',()=>{
 const m=cube();let reads=0;
 Object.defineProperty(m.data.points.V000,'x',{
  enumerable:true,configurable:true,
  get(){reads++;return reads===1?0:Infinity;}
 });
 const r=run({mesh:m,revision:1});
 assert.equal(r.exactVertexSetVerified,true);
 assert.equal(reads,1);
});
test('open / unsupported source geometry cannot become a V5 style proof',()=>{
 const s=cube();s.space='original-image-px';
 assert.throws(()=>run({mesh:s,revision:1}));
 const verified=meshProof(cube());
 assert.equal(verified.officialLineStylesVerified,false);
 const exact=run({mesh:cube(),revision:1});
 assert.equal(exact.v5VerifiedExportReady,false);
});
