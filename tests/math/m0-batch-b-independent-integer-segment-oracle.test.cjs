'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {orientation2DAdaptive:orient}=
 require('../../core/numeric/orientation2d-adaptive.cjs');
const {analyzeSegmentTopology:topology}=
 require('../../core/geometry/segment-topology2d.cjs');
const P=(x,y)=>({x,y});
const edge=(a,b)=>({unit:'mm',frame:'model-mm-2d',from:P(...a),to:P(...b)});
function determinant(a,b,c){
 const x=BigInt(b[0]-a[0]),y=BigInt(b[1]-a[1]);
 const u=BigInt(c[0]-a[0]),v=BigInt(c[1]-a[1]);
 const d=x*v-y*u;
 return d>0n?1:d<0n?-1:0;
}
test('M0 adaptive orientation + real M1 proper intersections match independent BigInt geometry oracle',()=>{
 let seed=0x327ed4fb,count=0;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed%81)-40;};
 for(let i=0;i<1200;i++){
  const a=[next(),next()],b=[next(),next()],
   c=[next(),next()],d=[next(),next()];
  if((a[0]===b[0]&&a[1]===b[1])||
     (c[0]===d[0]&&c[1]===d[1]))continue;
  const abC=determinant(a,b,c),abD=determinant(a,b,d);
  const cdA=determinant(c,d,a),cdB=determinant(c,d,b);
  if([abC,abD,cdA,cdB].some(x=>x===0))continue;
  const expected=abC*abD<0&&cdA*cdB<0?'proper-crossing':'disjoint';
  for(const power of [-4,0,4]){
   const unit=2**power;
   const shift=[2048,-1024];
   const map=p=>[p[0]*unit+shift[0],p[1]*unit+shift[1]];
   const r=topology({first:edge(map(a),map(b)),second:edge(map(c),map(d))});
   assert.equal(r.relation,expected,'sample '+i+' power '+power);
   assert.equal(r.sourceGeometryVerified,false);
   assert.equal(orient(map(a),map(b),map(c)).sign,abC);
  }
  count++;
 }
 assert.ok(count>600,'must independently exercise hundreds of valid nondegenerate cases');
});
test('M1 endpoint tests preserve BigInt exact sign near the 2^52 cancellation boundary',()=>{
 const n=2**52,a=[0,0],b=[n,n-1],c=[n-1,n-2];
 const oracle=BigInt(n)*BigInt(n-2)-BigInt(n-1)**2n;
 assert.equal(oracle,-1n);
 assert.equal(b[0]*c[1]-b[1]*c[0],0);
 assert.equal(orient(a,b,c).sign,-1);
 assert.equal(topology({first:edge(a,b),second:edge(c,[0,1])}).sourceGeometryVerified,false);
});
test('reversing endpoint ordering and swapping source IDs cannot change exact intersection relation',()=>{
 const configs=[
  [[[0,0],[8,8]],[[0,8],[8,0]],'proper-crossing'],
  [[[0,0],[8,0]],[[3,0],[12,0]],'collinear-overlap'],
  [[[0,0],[8,0]],[[8,0],[8,4]],'endpoint-touch'],
  [[[0,0],[8,0]],[[0,4],[8,4]],'disjoint']
 ];
 for(const [[a,b],[c,d],relation] of configs){
  for(const [first,second] of [
   [edge(a,b),edge(c,d)],[edge(b,a),edge(c,d)],
   [edge(a,b),edge(d,c)],[edge(c,d),edge(a,b)]
  ])assert.equal(topology({first,second}).relation,relation);
 }
});
