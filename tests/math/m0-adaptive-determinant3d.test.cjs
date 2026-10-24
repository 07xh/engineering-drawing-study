'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {determinant3DAdaptive:D}=
 require('../../core/numeric/determinant3d-adaptive.cjs');
const {certifyTrivialRecessionCone:recession}=
 require('../../core/numeric/trivial-recession-cone.cjs');
const S=(x,y,z)=>[x,y,z];
const sg=n=>n>0n?1:n<0n?-1:0;
test('ordinary 3x3 determinants stay on Float64 with exact binary64 sign',()=>{
 for(const [a,b,c,expected] of [
  [S(1,0,0),S(0,1,0),S(0,0,1),1],
  [S(1,0,0),S(0,0,1),S(0,1,0),-1],
  [S(2,0,0),S(0,-3,0),S(0,0,4),-1]
 ]){
  const r=D(a,b,c);
  assert.equal(r.sign,expected);
  assert.equal(r.method,'float64-filtered');
  assert.equal(r.exactForBinary64Inputs,true);
 }
});
test('3D cancellation at 2^52 is nonzero even when naive Float64 determinant is zero',()=>{
 const n=2**52,a=S(n,n-1,0),b=S(n-1,n-2,0),c=S(0,0,1);
 assert.equal(a[0]*b[1]-a[1]*b[0],0);
 const v=D(a,b,c);
 assert.equal(v.sign,-1);
 assert.equal(v.method,'exact-dyadic-fallback');
 assert.equal(D(b,a,c).sign,1);
});
test('M0 exact fallback distinguishes real subnormal 3D volume from false zero',()=>{
 const m=Number.MIN_VALUE;
 const r=D(S(m,0,0),S(0,m,0),S(0,0,m));
 assert.equal(r.sign,1);
 assert.equal(r.method,'exact-dyadic-fallback');
 const zero=D(S(1,1,1),S(2,2,2),S(3,3,3));
 assert.equal(zero.sign,0);
 assert.equal(zero.method,'exact-dyadic-fallback');
});
test('2048 integer matrices independently match exact BigInt six-term determinant',()=>{
 let s=0x51c0ffee;
 const rand=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s%20001-10000;};
 let fast=0,slow=0;
 for(let i=0;i<2048;i++){
  const a=S(rand(),rand(),rand()),b=S(rand(),rand(),rand()),
   c=S(rand(),rand(),rand());
  const [ax,ay,az]=a.map(BigInt),[bx,by,bz]=b.map(BigInt),
   [cx,cy,cz]=c.map(BigInt);
  const oracle=ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+
   az*(bx*cy-by*cx);
  const r=D(a,b,c);
  assert.equal(r.sign,sg(oracle),'matrix '+i);
  if(r.method==='float64-filtered')fast++;else slow++;
 }
 assert.ok(fast>1000,'most ordinary integer matrices must avoid BigInt');
 assert.equal(fast+slow,2048);
});
test('missing, inherited, sparse, unbounded, accessor-mutating 3D coordinates reject',()=>{
 const good=S(1,0,0),second=S(0,1,0),third=S(0,0,1);
 for(const a of [null,[],[1,2],[1,,3],S(1,0,Infinity),S(1,NaN,0),
   new Float64Array([1,2,3]),[1,2,3,4]])
  assert.throws(()=>D(a,second,third));
 let count=0;const tricky=S(1,0,0);
 Object.defineProperty(tricky,0,{get(){return ++count===1?1:Infinity;}});
 assert.equal(D(tricky,second,third).sign,1);
 assert.equal(count,1);
 const inherited=[,0,0];Object.setPrototypeOf(inherited,{0:1});
 assert.throws(()=>D(inherited,second,third));
});
test('the genuine six-face cube has bounded recession without local geometry provenance claims',()=>{
 const P=(x,y,z)=>({x,y,z});
 const n=[P(-1,0,0),P(1,0,0),P(0,-1,0),P(0,1,0),
  P(0,0,-1),P(0,0,1)];
 const f=n.map((normal,i)=>({id:'face-'+i,normal,offsetMm:1}));
 const r=recession({halfspaces:f});
 assert.equal(r.recessionConeTrivialVerified,true);
 assert.equal(r.sourceVertexCompletenessVerified,false);
 for(const omit of [0,1,2,3,4,5]){
  const u=recession({halfspaces:f.filter((_,i)=>i!==omit)});
  assert.equal(u.recessionConeTrivialVerified,false);
 }
});
