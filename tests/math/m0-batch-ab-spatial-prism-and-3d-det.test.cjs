'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {determinant3DAdaptive:det3}=
 require('../../core/numeric/determinant3d-adaptive.cjs');
const vec=require('../../core/numeric/object-vector3.cjs');
const {prismPlaneSection}=require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const projection=require('../../core/projection/conventions.js');
const P=(x,y,z)=>({x,y,z});
const sign=v=>v>0n?1:v<0n?-1:0;
function oracle(a,b,c){
 const [ax,ay,az]=a.map(BigInt),[bx,by,bz]=b.map(BigInt),
  [cx,cy,cz]=c.map(BigInt);
 return sign(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx));
}
test('M0 exact-for-binary64 3D determinant matches independently expanded BigInt on 512 triples',()=>{
 let seed=0x87241c3d,checked=0;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%2049-1024;};
 for(let i=0;i<512;i++){
  const a=[next(),next(),next()],b=[next(),next(),next()],
   c=[next(),next(),next()];
  const result=det3(a,b,c);
  assert.equal(result.sign,oracle(a,b,c),'triple '+i);
  assert.equal(result.exactForBinary64Inputs,true);
  assert.ok(['float64-filtered','exact-dyadic-fallback'].includes(result.method));
  checked++;
 }
 assert.equal(checked,512);
});
test('REAL M3 prism section consumes shared M0 and canonical first-angle V/H/W with analytic area oracle',()=>{
 for(const scale of [1/4,1,4]){
  for(const origin of [P(0,0,0),P(120,-80,40)]){
   const min=origin,max=P(origin.x+12*scale,origin.y+8*scale,origin.z+10*scale);
   const z=origin.z+5*scale;
   const base={min,max},plane={point:P(0,0,z),normal:P(0,0,1)};
   const section=prismPlaneSection(base,plane);
   assert.equal(section.status,'ready');
   assert.equal(section.verified,true);
   assert.equal(section.vertices.length,4);
   assert.ok(Math.abs(section.areaMm2-96*scale*scale)<1e-7);
   assert.ok(Math.abs(section.perimeterMm-40*scale)<1e-7);
   for(const vertex of section.vertices){
    assert.equal(vertex.point.z,z);
    assert.deepEqual(vertex.projection,projection.project(vertex.point));
    assert.equal(vertex.planeResidualMm,0);
    assert.equal(vertex.boxOutsideMm,0);
   }
   assert.equal(section.visibilityVerified,false);
   assert.equal(section.v5StepsReady,false);
   assert.equal(section.globallyUnique,null);
  }
 }
});
test('M0 shared 3D vector parity with independent basic integer identities before M3 use',()=>{
 for(const [a,b] of [
  [P(2,3,5),P(7,11,13)],
  [P(-17,4,-8),P(12,-5,6)],
  [P(0,0,1),P(1,0,0)]
 ]){
  const c=vec.crossObject3(a,b);
  assert.equal(vec.dotObject3(c,a),0);
  assert.equal(vec.dotObject3(c,b),0);
  assert.deepEqual(vec.addObject3(vec.subtractObject3(a,b),b),a);
 }
 assert.throws(()=>vec.modelVector3({x:1,y:2,z:Infinity}),TypeError);
});
test('M3 degeneracy still refuses unsupported planes and never manufactures V5 proof',()=>{
 const box={min:P(0,0,0),max:P(12,8,10)};
 assert.throws(()=>prismPlaneSection(box,{point:P(0,0,5),normal:P(0,0,0)}),/degenerate/);
 const no=prismPlaneSection(box,{point:P(0,0,20),normal:P(0,0,1)});
 assert.equal(no.status,'none');
 assert.equal(no.verified,false);
 assert.equal(no.visibilityVerified,false);
});
