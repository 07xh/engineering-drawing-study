'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyConvexVertices}=require('../../core/numeric/m0-convex-vertex-completeness.cjs');
const h=(id,n,o)=>({id,normal:n,offsetMm:o});
const cube=()=>({id:'box',halfspaces:[
 h('xmin',{x:-1,y:0,z:0},1),h('xmax',{x:1,y:0,z:0},1),
 h('ymin',{x:0,y:-1,z:0},1),h('ymax',{x:0,y:1,z:0},1),
 h('zmin',{x:0,y:0,z:-1},1),h('zmax',{x:0,y:0,z:1},1)],
 vertices:[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>({x,y,z}))))});
test('complete cube extreme vertices and all six normals certify boundedness',()=>{
 const r=certifyConvexVertices({solid:cube()});
 assert.equal(r.derivedVertexCount,8);
 assert.equal(r.vertexHullVerified,true);
 assert.equal(r.status,'certified');
});
test('omitted extreme vertex is rejected',()=>{
 const s=cube();s.vertices.pop();
 assert.equal(certifyConvexVertices({solid:s}).reason,'vertex-set-mismatch');
});
test('invented interior vertex is rejected',()=>{
 const s=cube();s.vertices.push({x:0,y:0,z:0});
 assert.equal(certifyConvexVertices({solid:s}).reason,'vertex-set-mismatch');
});
test('duplicate vertices are rejected',()=>{
 const s=cube();s.vertices[1]={...s.vertices[0]};
 assert.equal(certifyConvexVertices({solid:s}).reason,'duplicate-supplied-vertex');
});

test('translated anisotropic cuboid has complete bounded extreme-vertex proof',()=>{
 const s=cube();
 s.id='shifted';
 s.vertices=s.vertices.map(p=>({x:3*p.x+40,y:2*p.y-13,z:7*p.z+9}));
 s.halfspaces=[
  h('xmin',{x:-1,y:0,z:0},-37),h('xmax',{x:1,y:0,z:0},43),
  h('ymin',{x:0,y:-1,z:0},15),h('ymax',{x:0,y:1,z:0},-11),
  h('zmin',{x:0,y:0,z:-1},-2),h('zmax',{x:0,y:0,z:1},16)
 ];
 assert.equal(certifyConvexVertices({solid:s}).vertexHullVerified,true);
});
test('simple tetrahedron positive boundedness uses four independent planes',()=>{
 const s={id:'tetra',vertices:[
  {x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:0,z:1}],
  halfspaces:[
   h('x-min',{x:-1,y:0,z:0},0),h('y-min',{x:0,y:-1,z:0},0),
   h('z-min',{x:0,y:0,z:-1},0),
   h('slant',{x:1,y:1,z:1},1)
  ]};
 assert.equal(certifyConvexVertices({solid:s}).vertexHullVerified,true);
});
test('missing bounding face cannot certify a bounded vertex set',()=>{
 const s=cube();
 s.halfspaces=s.halfspaces.filter(f=>f.id!=='zmax');
 assert.equal(certifyConvexVertices({solid:s}).vertexHullVerified,false);
});
test('recession cone with a feasible nonzero ray remains undetermined',()=>{
 const s=cube();
 s.halfspaces=s.halfspaces.filter(f=>f.id!=='xmax');
 s.vertices=s.vertices.filter(p=>p.x===-1);
 assert.equal(certifyConvexVertices({solid:s}).vertexHullVerified,false);
});
