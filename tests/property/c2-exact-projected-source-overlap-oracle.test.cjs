'use strict';
/**
 * C2/M5 exact paper topology property oracle.
 * Uses the existing OSS fast-check@4.10.2 (dev only) to falsify accidental
 * tolerance-based coplanarity on REAL represented binary64 paper points.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fc=require('fast-check');
const {analyzeSegmentTopology}=require('../../core/geometry/segment-topology2d.cjs');
const {exactPositivePaperSourceOverlap:overlap}=
 require('../../workbench/m5-union-projected-overlap-depth.cjs');
const xy=(u,v)=>({u,v});
const row=(a,b)=>({frame:'model-mm-2d',unit:'mm',
 from:{x:a.u,y:a.v},to:{x:b.u,y:b.v}});
const positive=(a,b,c,d)=>overlap(a,b,c,d);
const M1=(a,b,c,d)=>analyzeSegmentTopology({first:row(a,b),second:row(c,d)});
const n=fc.integer({min:-120,max:120});
const ends=fc.tuple(n,n).filter(([a,b])=>a!==b);
const settings={seed:20261025,numRuns:380};

test('OSS C2: all exact horizontal/vertical source overlaps obey an independent integer interval oracle',()=>{
 let both=0,none=0;
 fc.assert(fc.property(ends,ends,n,
  fc.constantFrom(0,2**-35,-2**-35,2**-42),
  fc.constantFrom('horizontal','vertical'),([a,b],[c,d],shift,offset,axis)=>{
   const A=axis==='horizontal'?[xy(a,shift),xy(b,shift)]:
    [xy(shift,a),xy(shift,b)];
   const B=axis==='horizontal'?
    [xy(c,shift+offset),xy(d,shift+offset)]:
    [xy(shift+offset,c),xy(shift+offset,d)];
   const strict=offset===0&&
    Math.max(Math.min(a,b),Math.min(c,d))<
    Math.min(Math.max(a,b),Math.max(c,d));
   assert.equal(positive(...A,...B),strict);
   assert.equal(positive(...B,...A),strict);
   assert.equal(positive(A[1],A[0],...B),strict);
   assert.equal(positive(...A,B[1],B[0]),strict);
   const relation=M1(...A,...B).relation;
   assert.equal(['coincident','collinear-overlap'].includes(relation),strict);
   if(strict)both++;else none++;
  }),settings);
 assert.ok(both>25&&none>150,
  'the seed must exercise true overlap and near-but-not-equal counterexamples');
});

test('C2 no false collinear overlap under micro-offset and micro-rotation',()=>{
 const eps=2**-35,a=xy(0,0),b=xy(100,0);
 for(const [c,d] of [
  [xy(12,eps),xy(60,eps)],
  [xy(12,-eps),xy(60,-eps)],
  [xy(12,0),xy(60,eps)],
  [xy(12,eps),xy(60,0)],
  [xy(100,0),xy(140,0)],
  [xy(90,eps),xy(110,-eps)]
 ]){
  assert.equal(positive(a,b,c,d),false);
 }
 assert.equal(positive(a,b,xy(12,0),xy(60,0)),true);
 assert.equal(positive(a,b,xy(20,0),xy(100,0)),true);
 assert.equal(positive(a,b,xy(0,0),xy(100,0)),true);
});

test('C2 near-parallel proper crossing is not a collinear depth-overlap certificate',()=>{
 const A=xy(0,0),B=xy(1e8,1e8),
  C=xy(0,1e-5),D=xy(1e8,1e8-1e-5);
 assert.equal(M1(A,B,C,D).relation,'proper-crossing');
 assert.equal(positive(A,B,C,D),false);
 assert.equal(positive(A,B,xy(0,0),xy(1e8,1e8)),true);
});

test('C2 malformed/zero-length source cannot acquire authoritative overlap',()=>{
 const a=xy(0,0),b=xy(10,0);
 for(const bad of [xy(NaN,0),xy(Infinity,0),xy('1',0)]){
  assert.throws(()=>positive(a,b,bad,xy(1,0)),TypeError);
 }
 assert.throws(()=>positive(a,b,xy(2,0),xy(2,0)),
  /degenerate/);
});
