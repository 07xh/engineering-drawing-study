'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {verifiedConvexMeshHalfspaces:halfspaces}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {classifyConvexPolytopeBoundaryRay:ray}=
 require('../../core/numeric/convex-polytope-boundary-ray.cjs');
const {verifyConvexProjectedOutline:outline}=
 require('../../core/verification/convex-projected-outline.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,min,max){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?max.x:min.x,y?max.y:min.y,z?max.z:min.z);
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
const mesh=box('VerifiedBox',P(0,0,0),P(10,12,8));
test('closed manifold convex mesh shares M0 dot/cross/norm and preserves original topology',()=>{
 const r=halfspaces(mesh);
 assert.equal(r.status,'validated-closed-convex-mesh');
 assert.equal(r.sourceVertexCount,8);
 assert.equal(r.sourceEdgeCount,12);
 assert.equal(r.sourceFaceCount,6);
 assert.equal(r.v5Ready,false);
 for(const f of r.halfspaces){
  const n=f.normal;
  assert.ok(Math.abs(Math.hypot(n.x,n.y,n.z)-1)<1e-12);
  // Independent halfspace inequality at every original source vertex.
  for(const p of Object.values(mesh.data.points)){
   assert.ok(n.x*p.x+n.y*p.y+n.z*p.z<=f.offsetMm+r.toleranceMm);
  }
 }
});
test('source topology and point observer ray classify H-view front face independent of render scene',()=>{
 const verified=halfspaces(mesh);
 const top=P(5,6,8);
 const visible=ray({point:top,observerDirection:P(0,0,1),halfspaces:verified.halfspaces});
 const hidden=ray({point:top,observerDirection:P(0,0,-1),halfspaces:verified.halfspaces});
 assert.equal(visible.status,'ready');
 assert.equal(visible.visibility,'visible');
 assert.equal(hidden.status,'ready');
 assert.equal(hidden.visibility,'hidden');
 for(const result of [visible,hidden]){
  assert.equal(result.endpointJoinCertified,false);
  assert.equal(result.fullContourCertified,false);
 }
 const views=outline({mesh,revision:77});
 for(const v of ['V','H','W']){
  assert.equal(views[v].convexProjectedBoundaryVerified,true);
  assert.equal(views[v].sourceEdgeDepthOrderVerified,false);
 }
 assert.equal(views.multiBodySilhouetteVerified,false);
 assert.equal(views.v5Ready,false);
});
test('coordinate translation and independent normal scaling preserve real convex halfspaces',()=>{
 const shift=P(21,-15,44);
 const moved=structuredClone(mesh);
 for(const p of Object.values(moved.data.points)){
  p.x+=shift.x;p.y+=shift.y;p.z+=shift.z;
 }
 const a=halfspaces(mesh),b=halfspaces(moved);
 assert.equal(b.sourceEdgeCount,a.sourceEdgeCount);
 for(let i=0;i<6;i++){
  const x=a.halfspaces[i],y=b.halfspaces[i],n=x.normal;
  assert.deepEqual(y.normal,n);
  assert.ok(Math.abs(y.offsetMm-(x.offsetMm+n.x*shift.x+n.y*shift.y+n.z*shift.z))<1e-8);
 }
 const p=P(5+shift.x,6+shift.y,8+shift.z);
 const all=ray({point:p,observerDirection:P(0,0,17),
  halfspaces:b.halfspaces.map(f=>({
   id:f.id,normal:P(4*f.normal.x,4*f.normal.y,4*f.normal.z),
   offsetMm:4*f.offsetMm
  }))});
 assert.equal(all.visibility,'visible');
});
test('open / malformed / nonconvex source mesh remains invalid, not an occluding solid',()=>{
 for(const change of [
  g=>g.data.faces.pop(),
  g=>g.data.edges.pop(),
  g=>{g.data.points.V111=P(0,0,0);},
  g=>{g.unit='unitless';},
  g=>{g.data.points.V111.x=100;}
 ]){
  const g=structuredClone(mesh);change(g);
  assert.throws(()=>halfspaces(g),/closed convex mesh/);
 }
});
test('M0 reused kernel throws on subnormal nonzero products rather than yielding trusted topology',()=>{
 const xs=P(1e-200,1,1);
 const ys=P(2,3,4);
 const m=require('../../core/numeric/object-vector3.cjs');
 assert.throws(()=>m.dotObject3(xs,P(1e-200,0,0)),/underflow/);
 assert.deepEqual(m.crossObject3(P(1,0,0),P(0,1,0)),P(0,0,1));
 assert.equal(m.normObject3(ys),Math.hypot(2,3,4));
});
