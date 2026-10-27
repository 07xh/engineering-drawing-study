'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyConvexVertices}=require('../../core/numeric/m0-convex-vertex-completeness.cjs');
const h=(id,n,o)=>({id,normal:n,offsetMm:o});
const cube=()=>({id:'box',halfspaces:[
 h('xmin',{x:-1,y:0,z:0},1),h('xmax',{x:1,y:0,z:0},1),
 h('ymin',{x:0,y:-1,z:0},1),h('ymax',{x:0,y:1,z:0},1),
 h('zmin',{x:0,y:0,z:-1},1),h('zmax',{x:0,y:0,z:1},1)],
 vertices:[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>({x,y,z}))))});
test('complete cube vertex set checked but no premature boundedness proof',()=>{
 const r=certifyConvexVertices({solid:cube()});
 assert.equal(r.derivedVertexCount,8);
 assert.equal(r.vertexHullVerified,false);
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
