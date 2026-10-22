'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../../core/numeric/euclidean-kernel.cjs');
test('M0 vector arithmetic and orthogonal cross product',()=>{
 assert.deepEqual(m.subtract([4,5,6],[1,2,3]),[3,3,3]);
 assert.equal(m.dot([3,4],[4,-3]),0);
 assert.deepEqual(m.cross3([1,0,0],[0,1,0]),[0,0,1]);
 assert.equal(m.norm([3,4]),5);
 assert.deepEqual(m.normalize([0,0,5]),[0,0,1]);
});
test('signed point-plane distance invariant under normal rescaling',()=>{
 const a=m.pointPlaneSignedDistance([1,2,7],[1,2,3],[0,0,1]);
 const b=m.pointPlaneSignedDistance([1,2,7],[1,2,3],[0,0,100]);
 assert.equal(a,4);assert.equal(b,4);
});
test('fail closed on nonfinite, zero normals and intermediate overflow',()=>{
 assert.throws(()=>m.vector([1,Infinity],2),TypeError);
 assert.throws(()=>m.normalize([0,0,0]),RangeError);
 assert.throws(()=>m.dot([1e308,1],[1e308,1]),RangeError);
 assert.throws(()=>m.subtract([1e308,0],[-1e308,0]),RangeError);
});
