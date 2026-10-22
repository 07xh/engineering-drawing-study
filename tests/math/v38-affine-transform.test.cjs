'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {affine,transformPoint,transformDirection,composeAffine}=
 require('../../core/numeric/affine-transform.cjs');
const identity=[[1,0,0],[0,1,0],[0,0,1]];
const translate=[[1,0,12],[0,1,-4],[0,0,1]];
const rotate=[[0,-1,0],[1,0,0],[0,0,1]];
test('translation moves points but not directions',()=>{
 assert.deepEqual(transformPoint(translate,[3,5]),[15,1]);
 assert.deepEqual(transformDirection(translate,[3,5]),[3,5]);
 assert.deepEqual(transformPoint(identity,[3,5]),[3,5]);
});
test('composition applies right matrix first',()=>{
 const composed=composeAffine(translate,rotate,2);
 assert.deepEqual(transformPoint(composed,[2,3]),[9,-2]);
});
test('3D affine transform preserves expected coordinates',()=>{
 const m=[[1,0,0,2],[0,0,-1,3],[0,1,0,4],[0,0,0,1]];
 assert.deepEqual(transformPoint(m,[5,6,7]),[7,-4,10]);
});
test('rejects projective, nonfinite and overflowing transforms',()=>{
 assert.throws(()=>affine([[1,0,0],[0,1,0],[1,0,1]],2),RangeError);
 assert.throws(()=>transformPoint([[1,0,0],[0,Infinity,0],[0,0,1]],[1,2]),TypeError);
 assert.throws(()=>transformPoint([[1e308,0,0],[0,1,0],[0,0,1]],[1e308,0]),RangeError);
});
