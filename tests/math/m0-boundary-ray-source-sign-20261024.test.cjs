'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {classifyConvexPolytopeBoundaryRay:ray}=
 require('../../core/numeric/convex-polytope-boundary-ray.cjs');
const {certifyDotSign}=require('../../core/numeric/euclidean-kernel.cjs');
const P=(x,y,z)=>({x,y,z}),H=(id,normal,offsetMm)=>({id,normal,offsetMm});
const box=()=>[
 H('xmin',P(-1,0,0),0),H('xmax',P(1,0,0),10),
 H('ymin',P(0,-1,0),0),H('ymax',P(0,1,0),10),
 H('zmin',P(0,0,-1),0),H('zmax',P(0,0,1),10)
];
const input=(point=P(5,5,10),observerDirection=P(0,0,1),halfspaces=box())=>
 ({point,observerDirection,halfspaces});
test('M0 boundary source point and observer cannot change on repeated getters',()=>{
 const q=input(),point=q.point,observer=q.observerDirection;
 let px=0,dz=0;
 Object.defineProperty(point,'x',{enumerable:true,get(){return ++px===1?5:Infinity;}});
 Object.defineProperty(observer,'z',{enumerable:true,get(){return ++dz===1?1:-1;}});
 const r=ray(q);
 assert.equal(r.status,'ready');assert.equal(r.visibility,'visible');
 assert.equal(r.pointRayCertified,true);
 assert.equal(px,1);assert.equal(dz,1);
 assert.equal(r.endpointJoinCertified,false);assert.equal(r.fullContourCertified,false);
});
test('M0 supporting face normal ID and offset are read once before point-ray proof',()=>{
 const q=input();let nx=0,offsetReads=0,idReads=0;
 const face=q.halfspaces[5];
 Object.defineProperty(face.normal,'z',{enumerable:true,
  get(){return ++nx===1?1:-1;}});
 Object.defineProperty(face,'offsetMm',{enumerable:true,
  get(){return ++offsetReads===1?10:0;}});
 Object.defineProperty(face,'id',{enumerable:true,
  get(){return ++idReads===1?'zmax':'Forged';}});
 const r=ray(q);
 assert.equal(r.visibility,'visible');assert.deepEqual(r.activeFaceIds,['zmax']);
 assert.equal(nx,1);assert.equal(offsetReads,1);assert.equal(idReads,1);
 assert.equal(r.pointRayCertified,true);
});
test('M0 first bad read and a sparse face never pass source verification',()=>{
 const q=input();let reads=0;
 Object.defineProperty(q.point,'z',{enumerable:true,
  get(){return ++reads===1?Infinity:10;}});
 assert.throws(()=>ray(q),TypeError);assert.equal(reads,1);
 const hole=input();delete hole.halfspaces[4];
 assert.throws(()=>ray(hole),TypeError);
 const duplicate=input();duplicate.halfspaces[5].id='xmin';
 assert.throws(()=>ray(duplicate),TypeError);
});
test('M0 exact binary64 sign guards near-parallel rounded zero: no artificial point-ray signoff',()=>{
 const eps=2**-54,d=P(-1,-eps,1),n=P(1,1,1);
 const nd=Math.hypot(1,1,1),dd=Math.hypot(d.x,d.y,d.z);
 const a=[n.x/nd,n.y/nd,n.z/nd],b=[d.x/dd,d.y/dd,d.z/dd];
 assert.equal(a.reduce((v,x,i)=>v+x*b[i],0),0);
 assert.equal(certifyDotSign(a,b).sign,-1);
 const f=box();f.push(H('diagonal',n,0));
 const r=ray(input(P(0,0,0),d,f));
 assert.equal(r.status,'ready');
 assert.equal(r.visibility,'undetermined');
 assert.equal(r.pointRayCertified,false);
 assert.equal(r.endpointJoinCertified,false);
 assert.equal(r.fullContourCertified,false);
});
test('M0 true +Z outward, -Z inward and tangent keep local-only semantics',()=>{
 for(const [direction,expected] of [[P(0,0,1),'visible'],[P(0,0,-1),'hidden'],[P(1,0,0),'undetermined']]){
  const r=ray(input(P(5,5,10),direction));
  assert.equal(r.visibility,expected);
  assert.equal(r.pointRayCertified,expected!=='undetermined');
  assert.equal(r.fullContourCertified,false);
 }
});
