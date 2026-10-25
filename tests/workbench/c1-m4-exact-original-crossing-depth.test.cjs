'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {exactOriginalM4TransverseCrossingDepth:depth}=
 require('../../workbench/c1-m4-exact-original-crossing-depth.cjs');
const geometry={id:'X',data:{points:{
 A:{x:0,y:0,z:0},B:{x:10,y:0,z:0},
 C:{x:5,y:-5,z:10},D:{x:5,y:5,z:10},
 E:{x:5,y:-5,z:-10},F:{x:5,y:5,z:-10},
 G:{x:5,y:-5,z:0},H:{x:5,y:5,z:0},
 I:{x:20,y:-5,z:5},J:{x:20,y:5,z:5},
 K:{x:0,y:1,z:3},L:{x:10,y:1,z:3}
}}};
const audit=(second=['C','D'],first=['A','B'])=>
 depth({geometry,view:'H',firstEdge:first,secondEdge:second});
test('existing original M4 transverse projected crossing proves exact *second-in-front* local observer depth, not V5 style',()=>{
 const r=audit();
 assert.equal(r.exactM4TransverseProjectedLineIntersectionProven,true);
 assert.equal(r.bothOriginalSourceOpenParameterRangesContainCrossing,true);
 assert.equal(r.strictOriginal3DObserverDepthOrderAtPaperCrossingProven,true);
 assert.equal(r.exactOriginalSourceAtCrossingFront,'second');
 assert.equal(r.crossingCreatesOriginal3DPhysicalVertex,false);
 assert.equal(r.officialEngineeringStyle,'undetermined');
 assert.equal(r.signedV5Action,false);
});
test('actual first-angle H observer depth switches when a genuinely different 3D original edge is in front',()=>{
 const r=audit(['E','F']);
 assert.equal(r.exactOriginalSourceAtCrossingFront,'first');
 assert.equal(r.strictOriginal3DObserverDepthOrderAtPaperCrossingProven,true);
});
test('exact equal observer depth at transverse paper intersection is held, never made a new source 3D vertex',()=>{
 const r=audit(['G','H']);
 assert.equal(r.exactDepthTieAtCrossing,true);
 assert.equal(r.strictOriginal3DObserverDepthOrderAtPaperCrossingProven,false);
 assert.equal(r.exactOriginalSourceAtCrossingFront,null);
});
test('nonintersecting original finite source segments cannot be upgraded by crossing of their *infinite* paper lines',()=>{
 const r=audit(['I','J']);
 assert.equal(r.exactM4TransverseProjectedLineIntersectionProven,true);
 assert.equal(r.bothOriginalSourceOpenParameterRangesContainCrossing,false);
 assert.equal(r.strictOriginal3DObserverDepthOrderAtPaperCrossingProven,false);
});
test('exactly parallel projected sources do not give finite 2D transverse depth proof even when separated by one ULP',()=>{
 const r=audit(['K','L']);
 assert.equal(r.exactM4TransverseProjectedLineIntersectionProven,false);
 assert.equal(r.strictOriginal3DObserverDepthOrderAtPaperCrossingProven,false);
});
test('forged, missing, nonfinite original source geometry and unsupported view are rejected without tolerance',()=>{
 assert.throws(()=>depth({geometry,view:'Z',firstEdge:['A','B'],
  secondEdge:['C','D']}),/first-angle/);
 assert.throws(()=>audit(['C','Unknown']),/missing finite/);
 const bad=structuredClone(geometry);bad.data.points.C.z=Infinity;
 assert.throws(()=>depth({geometry:bad,view:'H',firstEdge:['A','B'],
  secondEdge:['C','D']}),/missing finite/);
});
