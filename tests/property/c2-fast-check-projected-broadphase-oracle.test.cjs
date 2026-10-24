'use strict';
/**
 * Seeded, shrinkable fast-check M5 independent property oracle.
 * Development-only acceleration. No new solver, style certificate or V5.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fc=require('fast-check');
const {analyzeSegmentTopology}=require('../../core/geometry/segment-topology2d.cjs');
const {project}=require('../../core/projection/conventions.js');
const {sourcePaperBounds,definitelySeparatePaperBounds}=
 require('../../workbench/m5-unified-projected-feature-events.cjs');
const seg=(a,b)=>({from2D:{u:a[0],v:a[1]},to2D:{u:b[0],v:b[1]}});
const reject=(a,b)=>definitelySeparatePaperBounds(sourcePaperBounds(a),sourcePaperBounds(b));
const asM1=s=>({frame:'model-mm-2d',unit:'mm',
 from:{x:s.from2D.u,y:s.from2D.v},
 to:{x:s.to2D.u,y:s.to2D.v}});
const relation=(a,b)=>analyzeSegmentTopology({first:asM1(a),second:asM1(b)}).relation;
const n=fc.integer({min:-90,max:90});
const pt=fc.tuple(n,n);
const edge=fc.tuple(pt,pt).filter(([a,b])=>a[0]!==b[0]||a[1]!==b[1]);
const settings={seed:20261025,numRuns:320};
const signed=(a,b,c)=>BigInt(b[0]-a[0])*BigInt(c[1]-a[1])-
 BigInt(b[1]-a[1])*BigInt(c[0]-a[0]);

test('fast-check M5: strict paper AABB rejects only true disjoint source pairs',()=>{
 let skipped=0,retained=0;
 fc.assert(fc.property(fc.tuple(edge,edge),
  fc.integer({min:1,max:8}),fc.integer({min:-256,max:256}),
  ([e1,e2],scale,shift)=>{
   const move=p=>[p[0]*scale+shift,p[1]*scale-shift];
   const A=seg(move(e1[0]),move(e1[1]));
   const B=seg(move(e2[0]),move(e2[1]));
   const flag=reject(A,B);
   assert.equal(flag,reject(B,A),'source order cannot alter broad phase');
   assert.equal(flag,reject(seg(move(e1[1]),move(e1[0])),B),
    'reversing endpoint order cannot alter broad phase');
   if(flag){
    skipped++;
    assert.equal(relation(A,B),'disjoint');
    // Independent exact integer determinant: cannot skip proper crossing.
    const [a,b]=e1.map(move),[c,d]=e2.map(move);
    const x=signed(a,b,c)*signed(a,b,d),y=signed(c,d,a)*signed(c,d,b);
    assert.equal(x<0n&&y<0n,false);
   }else retained++;
  }),settings);
 assert.ok(skipped>40,'seeded oracle must exercise strictly separated pairs');
 assert.ok(retained>20,'seeded oracle must retain narrow-phase work');
});

test('M5 preserves endpoint, T-junction, positive overlap, same line and crossings',()=>{
 const pairs=[
  [seg([0,0],[10,0]),seg([10,0],[10,10]),'endpoint-touch'],
  [seg([0,0],[10,0]),seg([5,0],[20,0]),'collinear-overlap'],
  [seg([0,0],[10,10]),seg([0,10],[10,0]),'proper-crossing'],
  [seg([0,0],[10,10]),seg([5,5],[5,20]),'endpoint-touch'],
  [seg([0,0],[10,10]),seg([0,0],[10,10]),'coincident']
 ];
 for(const [a,b,expected] of pairs){
  assert.equal(relation(a,b),expected);
  assert.equal(reject(a,b),false);
 }
 const a=seg([0,0],[10,10]),b=seg([10,10],[20,20]);
 assert.equal(reject(a,b),false);
 assert.equal(relation(a,b),'endpoint-touch');
});

test('near-parallel true crossing remains, strict tiny gap is safely disjoint',()=>{
 const A=seg([0,0],[1e8,1e8]),B=seg([0,1e-5],[1e8,1e8-1e-5]);
 assert.equal(relation(A,B),'proper-crossing');
 assert.equal(reject(A,B),false);
 const gap=16*Number.EPSILON;
 const C=seg([0,0],[10,0]),D=seg([10+gap,0],[20,0]);
 assert.equal(reject(C,D),true);
 assert.equal(relation(C,D),'disjoint');
 assert.equal(reject(C,seg([10,0],[20,0])),false);
});

test('all three first-angle views retain physical contacts and paper-only depth aliases',()=>{
 const p={x:1,y:2,z:3},q={x:5,y:6,z:7};
 for(const view of ['V','H','W']){
  const a=project(p)[view],b=project(q)[view];
  const A=seg([a.u,a.v],[b.u,b.v]);
  const B=seg([b.u,b.v],[b.u+1,b.v+1]);
  assert.equal(reject(A,B),false);
 }
 assert.deepEqual(project({x:0,y:2,z:3}).W,
  project({x:40,y:2,z:3}).W);
 assert.equal(reject(seg([2,3],[8,3]),seg([2,3],[8,3])),false);
});

test('malformed endpoints cannot enter paper broad phase',()=>{
 for(const value of [NaN,Infinity,-Infinity,undefined,'9']){
  assert.throws(()=>sourcePaperBounds({
   from2D:{u:0,v:0},to2D:{u:value,v:1}
  }),TypeError);
 }
});
