'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditC1ScopedHLRGeneratedEdgeMatch:match}=
 require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
const native=(key,partnerKey=key)=>({
 key,partnerKey,IsNull:()=>false,
 IsSame(other){return other.key===key;},
 IsPartner(other){return other.partnerKey===partnerKey;}
});
const edge=(a,b)=>({from:{u:a,v:0},to:{u:b,v:0}});
function setup(view='V'){
 const globalSegments=[edge(0,10),edge(0,10),edge(20,30)];
 const globalNativeEdges=[native('front'),native('back'),native('other')];
 return {view,hlrClass:'visible-sharp',sourceEdgeId:'g::A|B',
  globalSegments,globalNativeEdges,scopedSegment:edge(0,10),
  scopedNativeEdge:native('front')};
}
test('V/H/W real scoped native IsSame distinguishes front and rear coincident projected edges',()=>{
 for(const view of ['V','H','W']){
  const r=match(setup(view));
  assert.deepEqual(r.globalPaperCandidateOrdinals,[0,1]);
  assert.deepEqual(r.globalDirectSameGeneratedTopoDSOrdinals,[0]);
  assert.equal(r.actualNativeScopedToGlobalGeneratedEdgeIsSameProven,true);
  assert.equal(r.fullOriginalSourceParameterCoverageProven,false);
  assert.equal(r.globalContinuousOcclusionProven,false);
  assert.equal(r.engineeringLineStyle,'undetermined');
  assert.equal(r.signedV5Action,false);
 }
});
test('coincident paper without native identity remains unsigned candidate only',()=>{
 const x=setup('W');x.scopedNativeEdge=native('generated-again');
 const r=match(x);
 assert.deepEqual(r.globalPaperCandidateOrdinals,[0,1]);
 assert.deepEqual(r.globalDirectSameGeneratedTopoDSOrdinals,[]);
 assert.equal(r.actualNativeScopedToGlobalGeneratedEdgeIsSameProven,false);
});
test('native source-specific reverse edge orientation is accepted only with matching native identity',()=>{
 const x=setup('H');x.scopedSegment=edge(10,0);
 assert.deepEqual(match(x).globalDirectSameGeneratedTopoDSOrdinals,[0]);
});
test('paper-coincident but different native edge cannot be promoted by source label',()=>{
 const x=setup('V');x.sourceEdgeId='g::C|D';
 x.scopedNativeEdge=native('unrelated');
 assert.equal(match(x).actualNativeScopedToGlobalGeneratedEdgeIsSameProven,false);
});
test('a source-scoped output absent from whole-solid output is rejected, not silently omitted',()=>{
 const x=setup('V');x.scopedSegment=edge(40,50);
 x.scopedNativeEdge=native('generated-unrelated');
 assert.throws(()=>match(x),/absent from whole-solid/);
});
test('real IsSame to a different paper stroke is a native contradiction',()=>{
 const x=setup('V');x.scopedSegment=edge(20,30);
 assert.throws(()=>match(x),/inconsistent paper endpoints/);
});
test('asymmetric or duplicate native identity is rejected rather than selecting a paper alias',()=>{
 const x=setup('H');x.scopedNativeEdge.IsSame=()=>true;
 assert.throws(()=>match(x),/asymmetric/);
 const y=setup('W');y.globalNativeEdges[1]=native('front');
 assert.throws(()=>match(y),/multiple whole-solid/);
});
test('invalid views, native handles, finite coordinates and inventories fail closed',()=>{
 const cases=[
  x=>{x.view='X';},
  x=>{x.scopedSegment.to.u=NaN;},
  x=>{x.globalNativeEdges.pop();},
  x=>{x.scopedNativeEdge.IsSame=()=>false;},
  x=>{x.globalNativeEdges[0].IsSame=()=>false;},
  x=>{x.hlrClass='fake-visible';}
 ];
 for(const mutate of cases){
  const x=setup();mutate(x);
  assert.throws(()=>match(x),/genuine|complete native/);
 }
});

test('native IsPartner reveals a same-TShape source-scoped/global candidate across Location without asserting history',()=>{
 const x=setup();x.scopedNativeEdge=native('scoped','shared-TShape');
 x.globalNativeEdges[0]=native('global','shared-TShape');
 const r=match(x);
 assert.deepEqual(r.globalDirectSameGeneratedTopoDSOrdinals,[]);
 assert.deepEqual(r.globalPaperCandidateOrdinals,[0,1]);
 assert.equal(r.nativeIsPartnerRelationSupported,true);
 assert.deepEqual(r.globalPartnerGeneratedTopoDSOrdinals,[0]);
 assert.deepEqual(r.globalPartnerAndPaperCandidateOrdinals,[0]);
 assert.equal(r.uniqueGlobalPartnerAndPaperCandidateOrdinal,0);
 assert.equal(r.nativePartnerOnlyCandidate,true);
 assert.equal(r.partnerCandidateDoesNotProveOriginalSourceHistory,true);
 assert.equal(r.signedV5Action,false);
});
test('native IsPartner candidate with a different paper interval is never matched by TShape alone',()=>{
 const x=setup();x.scopedNativeEdge=native('scoped','shared-TShape');
 x.globalNativeEdges[0]=native('global','shared-TShape');x.globalSegments[0]=edge(20,30);
 const r=match(x);
 assert.deepEqual(r.globalPartnerGeneratedTopoDSOrdinals,[0]);
 assert.deepEqual(r.globalPartnerAndPaperCandidateOrdinals,[]);
 assert.equal(r.uniqueGlobalPartnerAndPaperCandidateOrdinal,null);
 assert.equal(r.nativePartnerOnlyCandidate,false);
 assert.equal(r.signedV5Action,false);
});
test('asymmetric native IsPartner is rejected',()=>{
 const x=setup();x.scopedNativeEdge.IsPartner=()=>true;x.globalNativeEdges[0].IsPartner=()=>false;
 assert.throws(()=>match(x),/IsPartner/);
});
test('missing IsPartner binding is explicitly reported as unsupported without changing IsSame behavior',()=>{
 const x=setup();delete x.scopedNativeEdge.IsPartner;
 const r=match(x);
 assert.deepEqual(r.globalDirectSameGeneratedTopoDSOrdinals,[0]);
 assert.equal(r.nativeIsPartnerRelationSupported,false);
 assert.deepEqual(r.globalPartnerGeneratedTopoDSOrdinals,[]);
 assert.equal(r.partnerCandidateDoesNotProveOriginalSourceHistory,true);
});

test('V/H/W tiny disjoint source-scoped HLR fragments cannot borrow whole-solid paper aliases',()=>{
 for(const view of ['V','H','W']){
  const x=setup(view);
  x.globalSegments=[edge(2e-10,3e-10)];
  x.globalNativeEdges=[native('other')];
  x.scopedSegment=edge(0,1e-10);
  x.scopedNativeEdge=native('scoped');
  assert.throws(()=>match(x),/absent from whole-solid/);
  x.scopedNativeEdge=native('other');
  assert.throws(()=>match(x),/inconsistent paper endpoints/);
 }
});
test('tiny exact and reversed generated HLR segments remain native-identifiable, paper-only stays unsigned',()=>{
 for(const view of ['V','H','W']){
  const x=setup(view);
  x.globalSegments=[edge(0,1e-10)];
  x.globalNativeEdges=[native('tiny')];
  x.scopedSegment=edge(1e-10,0);
  x.scopedNativeEdge=native('tiny');
  assert.deepEqual(match(x).globalDirectSameGeneratedTopoDSOrdinals,[0]);
  x.scopedNativeEdge=native('other');
  const held=match(x);
  assert.deepEqual(held.globalPaperCandidateOrdinals,[0]);
  assert.equal(held.actualNativeScopedToGlobalGeneratedEdgeIsSameProven,false);
  assert.equal(held.engineeringLineStyle,'undetermined');
  assert.equal(held.signedV5Action,false);
 }
});
test('native source-scoped inventory rejects zero-length generated edges rather than matching a paper point',()=>{
 const x=setup('H');x.scopedSegment=edge(0,0);
 assert.throws(()=>match(x),/genuine source-scoped/);
 const y=setup('W');y.globalSegments[0]=edge(0,0);
 assert.throws(()=>match(y),/complete native whole-solid/);
});
test('a tiny transverse shift exceeding relative span tolerance cannot forge TopoDS paper agreement',()=>{
 const x=setup('V');
 x.globalSegments=[edge(0,1e-10)];
 x.globalNativeEdges=[native('tiny')];
 x.scopedSegment={from:{u:0,v:1e-12},to:{u:1e-10,v:1e-12}};
 x.scopedNativeEdge=native('tiny');
 assert.throws(()=>match(x),/inconsistent paper endpoints/);
});
