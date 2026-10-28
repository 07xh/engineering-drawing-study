'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {liftOriginalProjectedSourceCandidates:lift}=
 require('../../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const p=(x,y,z)=>({x,y,z});
const fixture=()=>({id:'LiftedOriginalSource',data:{
 points:{A:p(0,0,0),B:p(10,0,0),C:p(0,3,0),D:p(10,3,0),
  E:p(0,0,8),F:p(10,0,8)},
 edges:[['A','B'],['C','D'],['A','E'],['E','F']]
}});
const same=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v)<=1e-6;

test('real projected HLR subsegment has original parameter interval and independent 3D reprojection, never 3D TopoDS authority',()=>{
 const g=fixture(),from={u:2,v:0},to={u:8,v:0};
 const r=lift(g,'V',from,to);
 assert.equal(r.unmappedReason,null);
 assert.equal(r.sourceCandidate3DLifts.length,2);
 assert.deepEqual(r.projectedOriginalEdgeCandidates,
  ['LiftedOriginalSource::A|B','LiftedOriginalSource::C|D']);
 for(const witness of r.sourceCandidate3DLifts){
  assert.deepEqual(witness.originalSourceParameterRange,[0.2,0.8]);
  assert.ok(same(project(witness.fromCandidate3D).V,from));
  assert.ok(same(project(witness.toCandidate3D).V,to));
  assert.equal(witness.actualOCCTTopoDSEdgeIdentityRecovered,false);
  assert.equal(witness.actualOCCT3DCurveExtracted,false);
  assert.equal(witness.officialEngineeringLineStyle,'undetermined');
  assert.equal(witness.v5Authorized,false);
 }
 assert.notDeepEqual(r.sourceCandidate3DLifts[0].fromCandidate3D,
  r.sourceCandidate3DLifts[1].fromCandidate3D);
 assert.equal(r.actualOCCTTopoDSIdentityRecovered,false);
 assert.equal(r.v5Authorized,false);
});
test('reverse projected HLR orientation preserves source direction and sorted original parameter range',()=>{
 const r=lift(fixture(),'V',{u:8,v:0},{u:2,v:0});
 assert.equal(r.sourceCandidate3DLifts.length,2);
 for(const witness of r.sourceCandidate3DLifts){
  assert.ok(Math.abs(witness.sourceParameterAtProjectedFrom-0.8)<1e-12);
  assert.ok(Math.abs(witness.sourceParameterAtProjectedTo-0.2)<1e-12);
  assert.deepEqual(witness.originalSourceParameterRange,[0.2,0.8]);
 }
});
test('each V/H/W observer only lifts geometrically reprojecting original 3D edges, not screen-near impostors',()=>{
 const g=fixture();
 const h=lift(g,'H',{u:1,v:0},{u:9,v:0});
 assert.deepEqual(h.projectedOriginalEdgeCandidates,
  ['LiftedOriginalSource::A|B','LiftedOriginalSource::E|F']);
 const w=lift(g,'W',{u:0,v:2},{u:0,v:7});
 assert.deepEqual(w.projectedOriginalEdgeCandidates,['LiftedOriginalSource::A|E']);
 for(const item of w.sourceCandidate3DLifts){
  assert.ok(same(project(item.fromCandidate3D).W,{u:0,v:2}));
  assert.ok(same(project(item.toCandidate3D).W,{u:0,v:7}));
 }
});
test('no matching original edge yields a concrete unmapped reason instead of an invented 3D source',()=>{
 const g=fixture();
 for(const [a,b] of [
  [{u:2,v:2},{u:8,v:2}],
  [{u:11,v:0},{u:14,v:0}],
  [{u:10,v:0},{u:10,v:0}]
 ]){
  const r=lift(g,'V',a,b);
  assert.equal(r.sourceCandidate3DLifts.length,0);
  assert.match(r.unmappedReason,
   /no-original-m0-edge|degenerate-projected-hlr/);
  assert.equal(r.officialEngineeringLineStyle,'undetermined');
 }
});
test('invalid HLR coordinates or non-first-angle view do not enter source lifting',()=>{
 const g=fixture();
 assert.throws(()=>lift(g,'X',{u:2,v:0},{u:8,v:0}),/V\/H\/W/);
 assert.throws(()=>lift(g,'V',{u:NaN,v:0},{u:8,v:0}),/finite/);
 assert.throws(()=>lift(g,'V',{u:2,v:0},{u:Infinity,v:0}),/finite/);
});

const nextUpPositive=n=>{
 const buf=new ArrayBuffer(8),bits=new DataView(buf);
 bits.setFloat64(0,n);
 bits.setBigUint64(0,bits.getBigUint64(0)+1n);
 return bits.getFloat64(0);
};
test('V/H/W native one-ULP overruns remain explicitly rounded paper candidates, never exact source proof',()=>{
 const g=fixture();
 for(const [view,max,point] of [
  ['V',10,t=>({u:t,v:0})],
  ['H',10,t=>({u:t,v:0})],
  ['W',8,t=>({u:0,v:t})]
 ]){
  const outside=nextUpPositive(max);
  assert.ok(outside>max&&outside-max>0);
  for(const [from,to] of [[point(0),point(outside)],
   [point(outside),point(0)],[point(max/2),point(outside)]]){
   const r=lift(g,view,from,to);
   assert.ok(r.sourceCandidate3DLifts.length>=1,
    'genuine OCCT rounded HLR source remains available for display');
   assert.ok(r.paperCollinearSourcesRoundedOutsideOriginalBounds.length>=1);
   assert.ok(r.sourceCandidate3DLifts.every(x=>
    x.sourceParameterWasClampedForPaperOnly===true&&
    x.originalSourceExactParameterCoverageFromRoundingProven===false&&
    x.v5Authorized===false));
   assert.ok(r.sourceCandidate3DLifts.some(x=>
    x.paperOnlyUnclampedOriginalSourceParameters.some(t=>t>1)));
   assert.equal(r.actualOCCTTopoDSIdentityRecovered,false);
  }
  const inside=lift(g,view,point(0),point(max));
  assert.ok(inside.sourceCandidate3DLifts.length>0);
  assert.ok(inside.sourceCandidate3DLifts.every(x=>
   x.originalSourceParameterRange[0]===0&&
   x.originalSourceParameterRange[1]===1&&
   x.sourceParameterWasClampedForPaperOnly===false));
 }
});
test('negative subnormal paper overrun is reported even if binary64 t underflows to zero',()=>{
 const g=fixture();
 for(const [view,point] of [
  ['V',t=>({u:t,v:0})],
  ['H',t=>({u:t,v:0})],
  ['W',t=>({u:0,v:t})]
 ]){
  const r=lift(g,view,point(-Number.MIN_VALUE),point(1));
  assert.ok(r.sourceCandidate3DLifts.length>=1);
  assert.ok(r.sourceCandidate3DLifts.every(x=>
   x.sourceParameterWasClampedForPaperOnly===true&&
   x.originalSourceExactParameterCoverageFromRoundingProven===false));
  assert.equal(r.v5Authorized,false);
 }
});
test('2D aliases at different 3D depths remain separate rounded candidates, not a unique source',()=>{
 const g=fixture(),over=nextUpPositive(10);
 for(const view of ['V','H']){
  const r=lift(g,view,{u:2,v:0},{u:over,v:0});
  assert.ok(r.sourceCandidate3DLifts.length>=2);
  assert.equal(new Set(r.projectedOriginalEdgeCandidates).size,
   r.projectedOriginalEdgeCandidates.length);
  assert.ok(r.sourceCandidate3DLifts.every(x=>
   x.sourceParameterWasClampedForPaperOnly===true));
 }
 const good=lift(g,'V',{u:2,v:0},{u:8,v:0});
 assert.equal(good.sourceCandidate3DLifts.length,2);
 assert.deepEqual(good.paperCollinearSourcesRoundedOutsideOriginalBounds,[]);
 assert.ok(good.sourceCandidate3DLifts.every(x=>
  x.sourceParameterWasClampedForPaperOnly===false&&x.v5Authorized===false));
});
