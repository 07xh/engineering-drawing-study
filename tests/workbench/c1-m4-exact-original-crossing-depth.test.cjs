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
 K:{x:0,y:1,z:3},L:{x:10,y:1,z:3},
 M:{x:5,y:-5,z:10},N:{x:5,y:0,z:10}
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

test('exact projected crossing at t=1/2 cannot certify native HLR stroke ending at t=.4, regardless of rounded M4 event coordinates',()=>{
 const r=depth({geometry,view:'H',firstEdge:['A','B'],
  secondEdge:['C','D'],nativeFirstOriginalParameterRange:[0,.4]});
 assert.equal(r.firstOriginalOpenSourceContainsExactCrossing,true);
 assert.equal(r.currentNativeOriginalOpenIntervalContainsExactCrossing,false);
 assert.equal(r.strictOriginal3DObserverDepthOrderAtPaperCrossingProven,false);
 assert.equal(r.exactOriginalSourceAtCrossingFront,null);
});
test('crossing exactly on native interval endpoint remains a junction boundary, not a strictly certified interior',()=>{
 const r=depth({geometry,view:'H',firstEdge:['A','B'],
  secondEdge:['C','D'],nativeFirstOriginalParameterRange:[.5,1]});
 assert.equal(r.currentNativeOriginalOpenIntervalContainsExactCrossing,false);
 assert.equal(r.strictOriginal3DObserverDepthOrderAtPaperCrossingProven,false);
});

test('native hidden interior meeting another ORIGINAL edge at its exact 2D endpoint has precise 3D depth ordering, but no invented 3D vertex join',()=>{
 const r=audit(['M','N']);
 assert.equal(r.firstOriginalOpenSourceContainsExactCrossing,true);
 assert.equal(r.secondOriginalOpenSourceContainsExactCrossing,false);
 assert.equal(r.secondOriginalClosedSourceContainsExactCrossing,true);
 assert.equal(r.otherOriginal3DEdgeEndpointAtPaperCrossing,true);
 assert.equal(r.strictOriginal3DObserverDepthOrderAtPaperCrossingProven,true);
 assert.equal(r.exactOriginalSourceAtCrossingFront,'second');
 assert.equal(r.original3DPhysicalVertexJunctionCertified,false);
 assert.equal(r.signedV5Action,false);
});

test('exact canonical M4 t=1/2 anchors original crossing depth without native line-style promotion',()=>{
 const r=depth({geometry,view:'H',firstEdge:['A','B'],
  secondEdge:['C','D'],originalM4SourceParameter:.5});
 assert.equal(r.originalM4SourceParameterExactlyMatchesRationalCrossing,true);
 assert.equal(r.originalM4ParameterDriftHeld,false);
 assert.equal(r.strictOriginal3DObserverDepthOrderAtPaperCrossingProven,true);
 assert.equal(r.officialEngineeringStyle,'undetermined');
});
test('one-ULP-off canonical M4 event parameter cannot borrow true rational crossing M0 depth',()=>{
 const r=depth({geometry,view:'H',firstEdge:['A','B'],
  secondEdge:['C','D'],originalM4SourceParameter:.5+Number.EPSILON});
 assert.equal(r.strictOriginal3DObserverDepthOrderAtPaperCrossingProven,true);
 assert.equal(r.originalM4SourceParameterExactlyMatchesRationalCrossing,false);
 assert.equal(r.originalM4ParameterDriftHeld,true);
});
test('non-dyadic exact crossing does not pretend approximate canonical M4 t to be an exact source cut',()=>{
 const g=structuredClone(geometry);
 g.data.points.B.x=3;
 const result=depth({geometry:g,view:'H',firstEdge:['A','B'],
  secondEdge:['C','D'],originalM4SourceParameter:5/3});
 assert.equal(result.exactM4TransverseProjectedLineIntersectionProven,true);
 assert.equal(result.originalM4SourceParameterExactlyMatchesRationalCrossing,false);
});
test('invalid/nonfinite claimed canonical M4 parameter is rejected, never used as proof',()=>{
 for(const t of [NaN,Infinity,-.1,1.1]){
  assert.throws(()=>depth({geometry,view:'H',firstEdge:['A','B'],
   secondEdge:['C','D'],originalM4SourceParameter:t}),/first-angle/);
 }
});
