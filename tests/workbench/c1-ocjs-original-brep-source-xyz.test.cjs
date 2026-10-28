'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {matchOriginalBRepEdgeByXYZ:match,
 probeRealOcctHLREdgeDirectOriginalSourceIdentity:probe,
 probeRealOcctHLRVertexDirectOriginalSourceIdentity:probeVertex,
 probeRealOcctHLRDataStructureSourceEdgeMap:probeIndex,
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
 IsSame(other){return this.tshape===other.tshape&&this.loc===other.loc;},
 // OCCT TopoDS_Shape::IsPartner compares TShape only, ignoring Location.
 IsPartner(other){return this.tshape===other.tshape;}
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

test('native OCCT IsPartner discovers shared source TShape across Location but remains only a candidate',()=>{
 const proof=probe({generatedEdge:native('a',5),originalSourceEdges:originals()});
 assert.equal(proof.directlySameUniqueOriginalOCCTBRepSourceEdgeId,null);
 assert.equal(proof.actualOCCTGeneratedEdgePartnerOriginalBRepIsPartnerCompared,true);
 assert.deepEqual(proof.originalPhysicalOCCTPartnerSourceEdgeIds,['RealSourceBRep3D::A|B']);
 assert.equal(proof.partnerUniqueOriginalOCCTBRepSourceEdgeId,'RealSourceBRep3D::A|B');
 assert.equal(proof.actualOCCTGeneratedEdgeTShapePartnerOriginalBRepCandidateOnly,true);
 assert.equal(proof.partnerOriginalBRepTShapeRelationDoesNotProveLocationParameterOrHistory,true);
 assert.equal(proof.completeOCCTGeneratedEdgeToOriginalTopoDSHistoryCertified,false);
 assert.equal(proof.signedV5Action,false);
});
test('shared TShape instantiated at multiple original locations remains ambiguous under IsPartner',()=>{
 const proof=probe({generatedEdge:native('shared',5),originalSourceEdges:[
  {sourceEdgeId:'G::A|B',edge:native('shared',0)},
  {sourceEdgeId:'G::C|D',edge:native('shared',1)}
 ]});
 assert.equal(proof.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven,false);
 assert.deepEqual(proof.originalPhysicalOCCTPartnerSourceEdgeIds,['G::A|B','G::C|D']);
 assert.equal(proof.partnerUniqueOriginalOCCTBRepSourceEdgeId,null);
 assert.equal(proof.actualOCCTGeneratedEdgeTShapePartnerOriginalBRepCandidateAmbiguous,true);
 assert.equal(proof.completeOCCTGeneratedEdgeToOriginalTopoDSHistoryCertified,false);
});
test('asymmetric native OCCT IsPartner is rejected rather than accepted as source history',()=>{
 const generated={IsSame:()=>false,IsPartner:()=>true};
 const original={IsSame:()=>false,IsPartner:()=>false};
 assert.throws(()=>probe({generatedEdge:generated,
  originalSourceEdges:[{sourceEdgeId:'G::A|B',edge:original}]}),/IsPartner/);
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
  curveSamples:[a,m,b],curveKind:'line',
  requireUnitSpeedOCCTLineParameterization:true
 });
 assert.deepEqual(actual.occtSourceCurveParameterRange,[5,15]);
 assert.equal(actual.occtSourceCurve3DEndpointsAndMidpointVerified,true);
 assert.equal(actual.generatedHLREdgeTopoDSIdentityMatched,false);
 assert.equal(actual.v5Authorized,false);
 for(const forged of [[5,6],[5,16],[5,Infinity],[-1e308,1e308]]){
  assert.throws(()=>verifyLine({
   sourceEndpoints:[a,b],parameterRange:forged,
   curveSamples:[a,m,b],curveKind:'line',
  requireUnitSpeedOCCTLineParameterization:true
  }),/parameter|finite/);
 }
});
test('reversed original OCCT 3D endpoints keep physical parameter span and never authorize line style',()=>{
 const a=xyz(0,0,0),b=xyz(6,8,0),m=xyz(3,4,0);
 const result=verifyLine({
  sourceEndpoints:[b,a],parameterRange:[0,10],
  curveSamples:[a,m,b],curveKind:'line',
  requireUnitSpeedOCCTLineParameterization:true
 });
 assert.equal(result.occtSourceCurve3DEndpointsAndMidpointVerified,true);
 assert.equal(result.engineeringLineStyle,'undetermined');
 assert.equal(result.v5Authorized,false);
});

const {project}=require('../../core/projection/conventions.js');
const vertexLedger=(g,items)=>items.map(([id,tshape,loc=0])=>({
 sourceVertexId:id,originalModelXYZ:id===null?null:{...g.data.points[id]},
 vertex:native(tshape,loc)
}));
const probeVertexIn=(g,view,shape,items,paper)=>probeVertex({
 geometry:g,view,generatedVertex:shape,
 originalSourceVertices:items,
 nativePaperPoint:paper
});
test('real original TopoDS vertex IsSame is a scoped direct 3D identity in V/H/W, never generated edge history',()=>{
 const g=shape();
 for(const view of ['V','H','W']){
  const original=vertexLedger(g,[['A','original-a'],['B','original-b'],
   ['A','original-a']]);
  const proof=probeVertexIn(g,view,native('original-a'),original,
   project(g.data.points.A)[view]);
  assert.equal(proof.directlySameOriginalM0VertexId,'A');
  assert.equal(proof.directOriginal3DVertexTopoDSIdentityProven,true);
  assert.equal(proof.directOriginalTopoDSVertexIsSameOccurrenceCount,2);
  assert.equal(proof.originalNativeTopoDSVertexOccurrencesCompared,3);
  assert.equal(proof.fullGeneratedHLREdgeToOriginalTopoDSHistoryProven,false);
  assert.equal(proof.officialEngineeringLineStyle,'undetermined');
  assert.equal(proof.signedV5Action,false);
 }
});
test('paper coincidence and nearby but different native TopoDS TShape or Location cannot become original 3D identity',()=>{
 const g=shape(),original=vertexLedger(g,[['A','source-a']]);
 for(const view of ['V','H','W']){
  const paper=project(g.data.points.A)[view];
  for(const generated of [native('new-hlr-shape'),native('source-a',1)]){
   const proof=probeVertexIn(g,view,generated,original,paper);
   assert.equal(proof.directlySameOriginalM0VertexId,null);
   assert.equal(proof.directOriginal3DVertexTopoDSIdentityProven,false);
   assert.equal(proof.directOriginalTopoDSVertexIsSameOccurrenceCount,0);
  }
 }
});
test('native OCCT vertex IsPartner finds same TShape across Location but never upgrades to direct 3D identity',()=>{
 const g=shape(),original=vertexLedger(g,[['A','source-a']]),
  proof=probeVertexIn(g,'V',native('source-a',5),original,project(g.data.points.A).V);
 assert.equal(proof.directOriginal3DVertexTopoDSIdentityProven,false);
 assert.equal(proof.directlySameOriginalM0VertexId,null);
 assert.equal(proof.actualOCCTGeneratedVertexPartnerOriginalBRepIsPartnerCompared,true);
 assert.deepEqual(proof.partnerOriginalM0VertexCandidateIds,['A']);
 assert.equal(proof.partnerUniqueOriginalM0VertexCandidateId,'A');
 assert.equal(proof.partnerSourceCandidateDoesNotProveOriginal3DLocationOrTopoDSHistory,true);
 assert.equal(proof.signedV5Action,false);
});
test('partner vertex candidate requires exact projected coordinates and refuses paper drift',()=>{
 const g=shape(),original=vertexLedger(g,[['A','source-a']]),
  paper={...project(g.data.points.A).V,u:Number.MIN_VALUE};
 const proof=probeVertexIn(g,'V',native('source-a',5),original,paper);
 assert.equal(proof.directOriginal3DVertexTopoDSIdentityProven,false);
 assert.deepEqual(proof.partnerOriginalM0VertexCandidateIds,[]);
 assert.equal(proof.partnerOriginalTopoDSVertexPaperMismatchCount,1);
 assert.equal(proof.partnerUniqueOriginalM0VertexCandidateId,null);
});
test('same partner TShape at two co-projected original vertices remains ambiguous',()=>{
 const g=shape(),original=vertexLedger(g,[['A','shared',0],['C','shared',1]]);
 assert.deepEqual(project(g.data.points.A).V,project(g.data.points.C).V);
 const proof=probeVertexIn(g,'V',native('shared',5),original,project(g.data.points.A).V);
 assert.equal(proof.directOriginal3DVertexTopoDSIdentityProven,false);
 assert.deepEqual(proof.partnerOriginalM0VertexCandidateIds,['A','C']);
 assert.equal(proof.partnerUniqueOriginalM0VertexCandidateId,null);
 assert.equal(proof.partnerOriginalM0VertexCandidateAmbiguous,true);
});
test('one ULP of projected paper drift holds direct native vertex certification instead of snapping source interval',()=>{
 const g=shape(),original=vertexLedger(g,[['A','source-a']]);
 for(const view of ['V','H','W']){
  const paper={...project(g.data.points.A)[view]};
  paper.u=Number.MIN_VALUE;
  const proof=probeVertexIn(g,view,native('source-a'),original,paper);
  assert.equal(proof.directOriginalTopoDSVertexIsSameOccurrenceCount,1);
  assert.equal(proof.directOriginalTopoDSVertexPaperMismatchCount,1);
  assert.equal(proof.directOriginal3DVertexTopoDSIdentityProven,false);
  assert.equal(proof.directlySameOriginalM0VertexId,null);
 }
});
test('direct native IsSame cannot bind two conflicting original M0 vertex IDs or a forged model coordinate',()=>{
 const g=shape(),paper=project(g.data.points.A).V;
 assert.throws(()=>probeVertexIn(g,'V',native('same'),
  vertexLedger(g,[['A','same'],['B','same']]),paper),
  /conflicting original M0 vertices/);
 const forged=vertexLedger(g,[['A','same']]);
 forged[0].originalModelXYZ.x=Number.MIN_VALUE;
 assert.throws(()=>probeVertexIn(g,'V',native('same'),forged,paper),
  /unbound original M0 vertex identity/);
});
test('native original BRep source without exact M0 XYZ binding stays unproved even when IsSame',()=>{
 const g=shape(),paper=project(g.data.points.A).V;
 const proof=probeVertexIn(g,'V',native('a'),
  vertexLedger(g,[[null,'a']]),paper);
 assert.equal(proof.directOriginalTopoDSVertexWithoutExactM0Binding,1);
 assert.equal(proof.directOriginal3DVertexTopoDSIdentityProven,false);
 assert.equal(proof.directlySameOriginalM0VertexId,null);
});
test('asymmetric, invalid, or nonreflexive generated/original TopoDS vertex witnesses fail closed',()=>{
 const g=shape(),paper=project(g.data.points.A).V,
  originals=vertexLedger(g,[['A','a']]);
 assert.throws(()=>probeVertexIn(g,'V',{IsSame:()=>true},
  originals,paper),/asymmetric/);
 assert.throws(()=>probeVertexIn(g,'V',{IsSame:()=>false},
  originals,paper),/actual OCCT HLR vertex/);
 assert.throws(()=>probeVertexIn(g,'V',native('a'),[
  {...originals[0],vertex:{IsSame:()=>false}}
 ],paper),/invalid original native/);
 assert.throws(()=>probeVertexIn(g,'V',native('a'),[],
  paper),/bounded original TopoDS vertex ledger/);
});

test('native HLR DataStructure 1-based EdgeMap authenticates all original TopoDS source indices without inventing generated-edge history',()=>{
 const source=originals(),items=[native('c'),native('a'),native('b')];
 const edgeMap={Extent:()=>items.length,FindKey:i=>items[i-1]};
 const result=probeIndex({edgeMap,originalSourceEdges:source});
 assert.equal(result.internalEdgeMapExtent,3);
 assert.equal(result.originalSourceIdsInInputBRep,3);
 assert.equal(result.internalEdgeMapOriginalSourceIdsMatched,3);
 assert.equal(result.everyOriginalBRepSourcePresentInHLRDataStructure,true);
 assert.deepEqual(result.indexedOriginalSources.map(x=>x.originalPhysicalSourceEdgeId),[
  'RealSourceBRep3D::A|E','RealSourceBRep3D::A|B','RealSourceBRep3D::C|D']);
 assert.ok(result.indexedOriginalSources.every(x=>
  x.directlySameOriginalTopoDSInputEdge===true&&
  x.generatedHLREdgeToOriginalTopoDSHistoryProven===false&&
  x.signedV5Action===false));
 assert.equal(result.generatedHLREdgeToOriginalTopoDSHistoryProven,false);
 assert.equal(result.continuousM5VisibilityProven,false);
 assert.equal(result.signedV5Action,false);
});
test('native HLR original EdgeMap can be incomplete without ever authorizing generated HLR history',()=>{
 const items=[native('a'),native('c')];
 const r=probeIndex({edgeMap:{Extent:()=>2,FindKey:i=>items[i-1]},
  originalSourceEdges:originals()});
 assert.equal(r.everyOriginalBRepSourcePresentInHLRDataStructure,false);
 assert.equal(r.internalEdgeMapOriginalSourceIdsMatched,2);
 assert.equal(r.generatedHLREdgeToOriginalTopoDSHistoryProven,false);
});
test('native HLR EdgeMap duplicate original M0 source identity and asymmetric IsSame are rejected',()=>{
 const dup=[native('a'),native('a'),native('b')];
 assert.throws(()=>probeIndex({edgeMap:{Extent:()=>3,FindKey:i=>dup[i-1]},
  originalSourceEdges:originals()}),/duplicates one original M0 physical source/);
 const asym={IsSame:()=>true};
 assert.throws(()=>probeIndex({edgeMap:{Extent:()=>1,FindKey:()=>asym},
  originalSourceEdges:originals()}),/asymmetric/);
});
test('native HLR EdgeMap requires finite bounded one-based index and actual source handles',()=>{
 for(const extent of [0,-1,513,NaN,Infinity,1.5]){
  assert.throws(()=>probeIndex({edgeMap:{Extent:()=>extent,FindKey:()=>native('a')},
   originalSourceEdges:originals()}),/bounded native HLR/);
 }
 assert.throws(()=>probeIndex({edgeMap:{Extent:()=>1},
  originalSourceEdges:originals()}),/real indexed OCCT/);
 assert.throws(()=>probeIndex({edgeMap:{Extent:()=>1,FindKey:()=>native('a')},
  originalSourceEdges:[]}),/real indexed OCCT/);
});
