'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {affine,transformPoint,transformDirection,composeAffine}=
 require('../../core/numeric/affine-transform.cjs');
const I2=()=>[[1,0,0],[0,1,0],[0,0,1]];
const I3=()=>[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
test('M0 affine coefficient getter is read exactly once on a 2D point transform',()=>{
 const m=I2();let reads=0;
 Object.defineProperty(m[0],2,{get(){return ++reads===1?12:Infinity;}});
 assert.deepEqual(transformPoint(m,[3,5]),[15,5]);
 assert.equal(reads,1);
});
test('M0 row getter is read exactly once, not re-read after valid matrix checks',()=>{
 const m=I2();let reads=0;
 Object.defineProperty(m,1,{get(){return ++reads===1?[0,1,-4]:[0,Infinity,-4];}});
 assert.deepEqual(transformPoint(m,[3,5]),[3,1]);
 assert.equal(reads,1);
});
test('M0 bottom projective row is checked from the SAME snapshot used by affine',()=>{
 const m=I2();let reads=0;
 Object.defineProperty(m[2],0,{
  get(){return ++reads===1?0:1;}
 });
 assert.deepEqual(affine(m,2),I2());
 assert.equal(reads,1);
 const invalid=I2(),v=[0,0,1];
 Object.defineProperty(invalid,2,{get(){return v;},configurable:true});
 v[0]=.001;
 assert.throws(()=>affine(invalid,2),/projective/);
});
test('M0 3D translation, rotation, direction and composition remain geometrically identical',()=>{
 const T=[[1,0,0,17],[0,1,0,-9],[0,0,1,23],[0,0,0,1]];
 const R=[[0,-1,0,0],[1,0,0,0],[0,0,1,0],[0,0,0,1]];
 const c=composeAffine(T,R,3);
 for(const v of [[1,2,3],[-7,8,-9],[0,0,0]]){
  assert.deepEqual(transformPoint(c,v),transformPoint(T,transformPoint(R,v)));
  assert.deepEqual(transformDirection(c,v),transformDirection(R,v));
 }
 const z=I3();assert.deepEqual(affine(z,3),z);
});
test('M0 sparse own row/coefficient indices and inherited numeric values cannot pass',()=>{
 const cases=[];
 const holeRow=I2();delete holeRow[0][1];cases.push(holeRow);
 const holeMatrix=I2();delete holeMatrix[1];cases.push(holeMatrix);
 const inheritedRow=I2();delete inheritedRow[0][0];
 Object.setPrototypeOf(inheritedRow[0],{0:1});cases.push(inheritedRow);
 const inheritedMatrix=I2();delete inheritedMatrix[2];
 Object.setPrototypeOf(inheritedMatrix,{2:[0,0,1]});cases.push(inheritedMatrix);
 for(const matrix of cases)assert.throws(()=>affine(matrix,2),TypeError);
});
test('M0 matrix source is detached from later caller mutation',()=>{
 const m=I2();
 const a=affine(m,2);
 m[0][0]=31;
 m[0][2]=30;
 assert.deepEqual(a,I2());
});
test('M0 projective and nonfinite getter are fail-closed without second read',()=>{
 const m=I2();let reads=0;
 Object.defineProperty(m[2],0,{get(){reads++;return .01;}});
 assert.throws(()=>transformPoint(m,[1,2]),/projective/);
 assert.equal(reads,1);
 const n=I2();let count=0;
 Object.defineProperty(n[1],1,{get(){count++;return Infinity;}});
 assert.throws(()=>transformDirection(n,[3,4]),TypeError);
 assert.equal(count,1);
});
