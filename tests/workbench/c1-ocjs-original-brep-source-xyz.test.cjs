'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {matchOriginalBRepEdgeByXYZ:match,
 probeRealOcctHLREdgeDirectOriginalSourceIdentity:probe,
 verifyOriginalOcctLinearCurveWitness:verifyLine}=
 require('../../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const xyz=(x,y,z)=>({x,y,z});
const shape=()=>({id:'RealSourceBRep3D',data:{
 points:{A:xyz(0,0,0),B:xyz(10,0,0),C:xyz(0,3,0),
  D:xyz(10,3,0),E:xyz(0,0,8)},
 edges:[['A','B'],['C','D'],['A','E']]
}});
test('real original BRep edge XYZ maps uniquely to reviewed M0 source, never flattened HLR paper alias',()=>{
 const result=match(shape(),xyz(0,0,0),xyz(10,0,0));
 assert.equal(result.sourceEdgeId,'RealSourceBRep3D::A|B');
 assert.equal(result.occtEdgeOrientation,'forward');
 assert.deepEqual(result.fromOCCT3D,xyz(0,0,0));
 assert.deepEqual(result.toOCCT3D,xyz(10,0,0));
 assert.equal(result.originalOCCTBRepVertexXYZMatched,true);
 assert.equal(result.generatedHLREdgeTopoDSIdentityMatched,false);
 assert.equal(result.occtCurveTypeIndependentlyVerified,false);
 assert.equal(result.engineeringLineStyle,'undetermined');
 assert.equal(result.v5Authorized,false);
});
test('reverse TopoDS edge orientation remains the same physical original M0 source edge',()=>{
 const result=match(shape(),xyz(10,0,0),xyz(0,0,0));
 assert.equal(result.sourceEdgeId,'RealSourceBRep3D::A|B');
 assert.equal(result.occtEdgeOrientation,'reverse');
 assert.deepEqual(result.originalVertexIds,['A','B']);
});
test('two edges with identical V projection but different 3D depths stay physically separate',()=>{
 const g=shape();
 const front=match(g,xyz(0,0,0),xyz(10,0,0));
 const back=match(g,xyz(0,3,0),xyz(10,3,0));
 assert.notEqual(front.sourceEdgeId,back.sourceEdgeId);
 assert.deepEqual(front.fromOCCT3D,xyz(0,0,0));
 assert.deepEqual(back.fromOCCT3D,xyz(0,3,0));
 assert.equal(front.generatedHLREdgeTopoDSIdentityMatched,false);
 assert.equal(back.generatedHLREdgeTopoDSIdentityMatched,false);
});
test('BRep edge with no exact original physical 3D counterpart cannot invent a source',()=>{
 const g=shape();
 assert.throws(()=>match(g,xyz(0,1,0),xyz(10,1,0)),/missing or ambiguous/);
 assert.throws(()=>match(g,xyz(0,0,0),xyz(8,0,0)),/missing or ambiguous/);
 assert.throws(()=>match(g,xyz(0,0,0),xyz(0,0,0)),/collapsed/);
});
test('nonfinite or ambiguous original source cannot gain unique TopoDS identity',()=>{
 const g=shape();
 assert.throws(()=>match(g,xyz(NaN,0,0),xyz(10,0,0)),/finite/);
 assert.throws(()=>match(g,xyz(0,0,0),xyz(Infinity,0,0)),/finite/);
 const cloned={...g,data:{...g.data,
  edges:[...g.data.edges,['B','A']]}};
 assert.throws(()=>match(cloned,xyz(0,0,0),xyz(10,0,0)),/missing or ambiguous/);
});

const native=(tshape,loc=0)=>({
 tshape,loc,
 IsSame(other){return this.tshape===other.tshape&&this.loc===other.loc;}
});
const originals=()=>[
 {sourceEdgeId:'RealSourceBRep3D::A|B',edge:native('a')},
 {sourceEdgeId:'RealSourceBRep3D::C|D',edge:native('b')},
 {sourceEdgeId:'RealSourceBRep3D::A|E',edge:native('c')}
];
test('native OCCT IsSame identifies a directly shared original source TShape irrespective of edge orientation and duplicate occurrences, but cannot certify HLR history',()=>{
 const sources=originals();sources.push({
  sourceEdgeId:'RealSourceBRep3D::A|B',edge:native('a')
 });
 const result=probe({generatedEdge:native('a'),originalSourceEdges:sources});
 assert.equal(result.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared,true);
 assert.deepEqual(result.directlySameOriginalOCCTBRepSourceEdgeIds,
  ['RealSourceBRep3D::A|B']);
 assert.equal(result.directlySameUniqueOriginalOCCTBRepSourceEdgeId,
  'RealSourceBRep3D::A|B');
 assert.equal(result.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven,true);
 assert.equal(result.completeOCCTGeneratedEdgeToOriginalTopoDSHistoryCertified,false);
 assert.equal(result.signedV5Action,false);
});
test('projected HLR output edge with matching paper line but distinct native TShape never gains original TopoDS identity',()=>{
 const proof=probe({generatedEdge:native('hlr-generated'),
  originalSourceEdges:originals()});
 assert.deepEqual(proof.directlySameOriginalOCCTBRepSourceEdgeIds,[]);
 assert.equal(proof.directlySameUniqueOriginalOCCTBRepSourceEdgeId,null);
 assert.equal(proof.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven,false);
 assert.equal(proof.completeOCCTGeneratedEdgeToOriginalTopoDSHistoryCertified,false);
});
test('native OCCT IsSame checks location; matching TShape at another location is not the same original 3D edge',()=>{
 const proof=probe({generatedEdge:native('a',5),
  originalSourceEdges:originals()});
 assert.equal(proof.directlySameUniqueOriginalOCCTBRepSourceEdgeId,null);
});
test('native generated OCCT edge matching two DISTINCT original M0 source identities is rejected as contradictory',()=>{
 const sources=[{sourceEdgeId:'G::A|B',edge:native('same')},
  {sourceEdgeId:'G::C|D',edge:native('same')}];
 assert.throws(()=>probe({generatedEdge:native('same'),
  originalSourceEdges:sources}),/multiple different original physical edges/);
});
test('fabricated OCCT IsSame asymmetry or invalid source native TopoDS handle fails closed',()=>{
 const yes={IsSame:()=>true},no={IsSame:()=>false};
 assert.throws(()=>probe({generatedEdge:yes,originalSourceEdges:[
  {sourceEdgeId:'G::A|B',edge:no}
 ]}),/asymmetric/);
 assert.throws(()=>probe({generatedEdge:{},originalSourceEdges:[]}),
  /actual OCCT generated and original native/);
 assert.throws(()=>probe({generatedEdge:native('a'),originalSourceEdges:[
  {sourceEdgeId:'G::A|B',edge:{}}
 ]}),/untrusted original/);
 assert.throws(()=>probe({generatedEdge:{IsSame:()=>1},originalSourceEdges:[
  {sourceEdgeId:'G::A|B',edge:native('a')}
 ]}),/asymmetric or nonboolean/);
});

test('native OCCT occurrence ledger counts repeated BRep edge occurrences without confusing them with distinct original physical sources',()=>{
 const source=originals();
 source.push({sourceEdgeId:'RealSourceBRep3D::A|B',edge:native('a')});
 const result=probe({generatedEdge:native('a'),originalSourceEdges:source});
 assert.equal(result.actualOriginalOCCTBRepEdgeOccurrencesCompared,4);
 assert.equal(result.actualDistinctOriginalOCCTBRepSourceCount,3);
 assert.equal(result.originalPhysicalOCCTSourceIdsCompared.length,3);
 assert.equal(result.completeOCCTGeneratedEdgeToOriginalTopoDSHistoryCertified,false);
});

test('genuine trimmed OCCT 3D line parameter span matches physical M0 length, not arbitrary HLR paper units',()=>{
 const a=xyz(0,0,0),b=xyz(6,8,0),m=xyz(3,4,0);
 const actual=verifyLine({
  sourceEndpoints:[a,b],parameterRange:[5,15],
  curveSamples:[a,m,b],curveKind:'line'
 });
 assert.deepEqual(actual.occtSourceCurveParameterRange,[5,15]);
 assert.equal(actual.occtSourceCurve3DEndpointsAndMidpointVerified,true);
 assert.equal(actual.generatedHLREdgeTopoDSIdentityMatched,false);
 assert.equal(actual.v5Authorized,false);
 for(const forged of [[5,6],[5,16],[5,Infinity],[-1e308,1e308]]){
  assert.throws(()=>verifyLine({
   sourceEndpoints:[a,b],parameterRange:forged,
   curveSamples:[a,m,b],curveKind:'line'
  }),/parameter|finite/);
 }
});
test('reversed original OCCT 3D endpoints keep physical parameter span and never authorize line style',()=>{
 const a=xyz(0,0,0),b=xyz(6,8,0),m=xyz(3,4,0);
 const result=verifyLine({
  sourceEndpoints:[b,a],parameterRange:[0,10],
  curveSamples:[a,m,b],curveKind:'line'
 });
 assert.equal(result.occtSourceCurve3DEndpointsAndMidpointVerified,true);
 assert.equal(result.engineeringLineStyle,'undetermined');
 assert.equal(result.v5Authorized,false);
});
