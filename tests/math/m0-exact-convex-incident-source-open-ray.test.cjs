'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {outwardProof:certify,inwardProof:certifyHidden}=
 require('../../core/numeric/convex-incident-source-open-ray.cjs');
const {verifiedConvexMeshHalfspaces:verify}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const p=(x,y,z)=>({x,y,z});
const tetra={
 id:'ReviewedTetra',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{A:p(0,0,0),B:p(17,1,3),C:p(3,16,2),D:p(5,6,23)},
 edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
 faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]}
};
test('exact outward V rays from all original visible triangular support edges',()=>{
 const proof=verify(tetra);
 for(const pair of [['A','B'],['B','D'],['A','D']]){
  const cert=certify({geometry:tetra,sourceVertexIds:pair,view:'V',convexProof:proof});
  assert.equal(cert.status,'certified-clear');
  assert.equal(cert.exactBinary64PlaneAndSourceIncidence,true);
  assert.equal(cert.officialLineStyleVerified,false);
  assert.equal(cert.v5Ready,false);
  assert.ok(Number.isInteger(cert.supportingOriginalFaceIndex));
  assert.deepEqual(cert.sourceVertexIds,pair);
 }
});
test('same reusable proof supports H rays on oblique tetrahedron without float plane-residual tolerance',()=>{
 const proof=verify(tetra);
 for(const pair of [['A','B'],['B','C'],['A','C']]){
  const cert=certify({geometry:tetra,sourceVertexIds:pair,view:'H',convexProof:proof});
  assert.equal(cert.status,'certified-clear');
  assert.equal(cert.reason,'exact-original-support-face-outward-ray');
 }
});
test('backside original box source cannot be promoted by paper-only front alias',()=>{
 const box=prismMesh({solid:{min:p(-4,5,-9),max:p(24,18,31)}}),
  proof=verify(box);
 const hidden=certify({geometry:box,sourceVertexIds:['V010','V110'],
  view:'V',convexProof:proof});
 assert.equal(hidden.status,'undetermined');
 assert.equal(hidden.v5Ready,false);
 const front=certify({geometry:box,sourceVertexIds:['V000','V100'],
  view:'V',convexProof:proof});
 assert.equal(front.status,'certified-clear');
});
test('zero-observer slope and nonincident source cannot form false support',()=>{
 const proof=verify(tetra);
 assert.throws(()=>certify({geometry:tetra,sourceVertexIds:['A','MISSING'],
  view:'V',convexProof:proof}),/source edge absent/);
 assert.throws(()=>certify({geometry:tetra,sourceVertexIds:['A','B'],
  view:'X',convexProof:proof}),/convex original source/);
 assert.throws(()=>certify({geometry:tetra,sourceVertexIds:['A','B'],
  view:'V',convexProof:Object.freeze({...proof,sourceGeometryId:'Forged'})}),
 /convex original source/);
});
test('non-finite and open source topology never obtains an exact-outward physical theorem',()=>{
 const broken={...tetra,data:{...tetra.data,faces:tetra.data.faces.slice(1)}};
 assert.throws(()=>verify(broken),/closed|Euler|convex/);
 const bad={...tetra,data:{...tetra.data,points:{...tetra.data.points,
  D:{...tetra.data.points.D,z:NaN}}}};
 assert.throws(()=>verify(bad),/finite|geometry|convex/);
});

test('approximately planar but NOT exactly supporting quad cannot mint an exact H ray',()=>{
 const box=prismMesh({solid:{min:p(0,0,0),max:p(10,10,10)}});
 // Below the historical M0 approximate planarity tolerance. This is
 // intentionally not an exact support plane in represented binary64.
 box.data.points.V111={...box.data.points.V111,z:10+2e-9};
 const proof=verify(box);
 const upper=certify({geometry:box,
  sourceVertexIds:['V011','V111'],view:'H',convexProof:proof});
 assert.equal(upper.status,'undetermined');
 assert.equal(upper.continuousOpenSourceIntervalRayClear,false);
});

test('exact original skew tetra backside physical edges AC and BC are strictly interior on V open ray',()=>{
 const proof=verify(tetra);
 for(const ids of [['A','C'],['B','C']]){
  const h=certifyHidden({geometry:tetra,sourceVertexIds:ids,
   view:'V',convexProof:proof});
  assert.equal(h.status,'certified-strictly-hidden-open-original-edge');
  assert.equal(h.fullOriginalSourceOpenIntervalStrictlyHidden,true);
  assert.equal(h.exactSupportingFaceCount,2);
  assert.equal(h.endpointOcclusionCertified,false);
  assert.equal(h.officialLineStyleVerified,false);
  assert.equal(h.v5Ready,false);
 }
});
test('one front-facing or tangent original support blocks exact inward claim',()=>{
 const proof=verify(tetra);
 for(const edge of [['A','B'],['A','D'],['B','D']]){
  const h=certifyHidden({geometry:tetra,sourceVertexIds:edge,
   view:'V',convexProof:proof});
  assert.equal(h.status,'undetermined');
  assert.equal(h.fullOriginalSourceOpenIntervalStrictlyHidden,false);
 }
});
test('an axis-aligned box side-tangent observer must not be certified strictly hidden',()=>{
 const geometry=prismMesh({solid:{min:p(0,0,0),max:p(10,10,10)}});
 const proof=verify(geometry);
 const h=certifyHidden({geometry,sourceVertexIds:['V010','V110'],
  view:'V',convexProof:proof});
 assert.equal(h.status,'undetermined');
 assert.equal(h.endpointOcclusionCertified,false);
});
test('approximate original quadrilateral plane cannot sign strict hidden source ray',()=>{
 const geometry=prismMesh({solid:{min:p(0,0,0),max:p(10,10,10)}});
 geometry.data.points.V111={...geometry.data.points.V111,z:10+2e-9};
 const proof=verify(geometry);
 const h=certifyHidden({geometry,sourceVertexIds:['V011','V111'],
  view:'V',convexProof:proof});
 assert.equal(h.status,'undetermined');
 assert.equal(h.fullOriginalSourceOpenIntervalStrictlyHidden,false);
});
