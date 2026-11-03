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

test('native source-scoped identities reject different original edges claiming one generated edge',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const a=match(setup('H'));
 const b=match({...setup('H'),sourceEdgeId:'g::C|D'});
 assert.throws(()=>audit({matches:[a,b]}),/conflicting original TopoDS/);
 const result=audit({matches:[a,match(setup('W'))]});
 assert.equal(result.uniqueNativeClaims,2);
 assert.equal(result.fullOriginalSourceHistoryCertified,false);
 assert.equal(result.signedV5ActionCount,0);
 assert.ok(Object.isFrozen(result.rows[0]));
});
test('paper and IsPartner candidates never become native source identity claims',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const a=setup('V');a.scopedNativeEdge=native('scoped','shared');
 a.globalNativeEdges[0]=native('global','shared');
 const candidate=match(a);
 assert.equal(candidate.nativePartnerOnlyCandidate,true);
 const result=audit({matches:[candidate]});
 assert.equal(result.uniqueNativeClaims,0);
 assert.equal(result.engineeringLineStyle,'undetermined');
 assert.throws(()=>audit({matches:[match(setup()),match(setup())]}),
  /duplicate native scoped source claim/);
});

test('a legitimate empty source-scoped view cannot invent generated source history',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const r=audit({matches:[]});
 assert.equal(r.uniqueNativeClaims,0);
 assert.equal(r.fullOriginalSourceHistoryCertified,false);
 assert.equal(r.globalContinuousOcclusionCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});

test('real whole-solid generated HLR inventory exposes unclaimed edges without signing history',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const claim=match(setup('V'));
 const r=audit({matches:[claim],wholeSolidCounts:{
  'visible-sharp':3,'hidden-sharp':1}});
 assert.equal(r.wholeSolidNativeGeneratedEdgeCount,4);
 assert.equal(r.uniqueNativeClaims,1);
 assert.deepEqual(r.unclaimedWholeSolidGeneratedEdgeOrdinals,[
  {hlrClass:'visible-sharp',ordinal:1},
  {hlrClass:'visible-sharp',ordinal:2},
  {hlrClass:'hidden-sharp',ordinal:0}]);
 assert.equal(r.everyWholeSolidGeneratedEdgeHasNativeScopedIdentityClaim,false);
 assert.equal(r.fullOriginalSourceHistoryCertified,false);
 assert.throws(()=>audit({matches:[claim],wholeSolidCounts:{
  'visible-sharp':0,'hidden-sharp':0}}),/nonexistent whole-solid/);
 const empty=audit({matches:[],wholeSolidCounts:{
  'visible-sharp':0,'hidden-sharp':0}});
 assert.equal(empty.everyWholeSolidGeneratedEdgeHasNativeScopedIdentityClaim,true);
 assert.equal(empty.fullOriginalSourceHistoryCertified,false);
});

test('native HLR source identity requires scoped-to-global AND global-to-scoped closure',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const a=setup('V');
 a.globalSegments=[edge(0,10),edge(0,10)];
 a.globalNativeEdges=[native('front'),native('back')];
 const front=match(a);
 const back=match({...a,sourceEdgeId:'g::C|D',scopedNativeEdge:native('back')});
 const paperOnly=match({...a,sourceEdgeId:'g::E|F',
  scopedNativeEdge:native('fresh-2d-edge')});
 const counts={'visible-sharp':2,'hidden-sharp':0};
 const r=audit({matches:[front,back,paperOnly],wholeSolidCounts:counts});
 assert.equal(r.everyWholeSolidGeneratedEdgeHasNativeScopedIdentityClaim,true);
 assert.equal(r.everySourceScopedGeneratedEdgeHasNativeWholeSolidIdentity,false);
 assert.equal(r.bidirectionalNativeGeneratedEdgeIdentityComplete,false);
 assert.equal(r.sourceScopedGeneratedEdgeCount,3);
 assert.equal(r.sourceScopedGeneratedEdgesWithoutNativeWholeSolidIdentity,1);
 assert.deepEqual(r.unmatchedSourceScopedGeneratedEdges[0].globalPaperCandidateOrdinals,[0,1]);
 assert.ok(Object.isFrozen(r.unmatchedSourceScopedGeneratedEdges[0]));
 assert.equal(r.fullOriginalSourceHistoryCertified,false);
 assert.equal(r.signedV5ActionCount,0);
 const closed=audit({matches:[front,back],wholeSolidCounts:counts});
 assert.equal(closed.bidirectionalNativeGeneratedEdgeIdentityComplete,true);
 assert.equal(closed.fullOriginalSourceHistoryCertified,false);
 assert.equal(closed.engineeringLineStyle,'undetermined');
});
test('mixed or incomplete native whole-solid HLR classes cannot hide unclaimed edges',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const a=match(setup());
 for(const counts of [
  {'visible-sharp':3},
  {'visible-sharp':3,'hidden-sharp':0,'visible-outline':0},
  {'visible-outline':3,'hidden-outline':0,'visible-sharp':3}
 ])assert.throws(()=>audit({matches:[a],wholeSolidCounts:counts}),
  /mixed or incomplete native whole-solid HLR class inventory/);
});

test('one native whole-solid inventory cannot mix V and W generated edge ordinals',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 assert.throws(()=>audit({matches:[match(setup('V')),match(setup('W'))],
  wholeSolidCounts:{'visible-sharp':3,'hidden-sharp':0}}),
  /one HLR view/);
});

test('genuine generated 2D OutLine source filter preserves native IsSame without M5 promotion',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:auditClaims}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 for(const view of ['V','H','W']){
  const x=setup(view);x.hlrClass='visible-outline';
  const r=match(x);
  assert.deepEqual(r.globalDirectSameGeneratedTopoDSOrdinals,[0]);
  assert.equal(r.fullOriginalSourceParameterCoverageProven,false);
  assert.equal(r.signedV5Action,false);
  const c=auditClaims({matches:[r],wholeSolidCounts:{
   'visible-outline':3,'hidden-outline':0
  }});
  assert.equal(c.uniqueNativeClaims,1);
  assert.equal(c.unclaimedWholeSolidGeneratedEdgeOrdinals.length,2);
  assert.equal(c.fullOriginalSourceHistoryCertified,false);
  const forged=setup(view);forged.hlrClass='hidden-outline';
  forged.scopedSegment=edge(40,50);
  forged.scopedNativeEdge=native('unrelated-outline');
  assert.throws(()=>match(forged),/absent from whole-solid/);
 }
});
test('empty native 2D OutLine inventory remains empty, not silently converted to Sharp',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:auditClaims}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const r=auditClaims({matches:[],wholeSolidCounts:{
  'visible-outline':0,'hidden-outline':0
 }});
 assert.equal(r.wholeSolidNativeGeneratedEdgeCount,0);
 assert.deepEqual(r.unclaimedWholeSolidGeneratedEdgeOrdinals,[]);
 assert.equal(r.signedV5ActionCount,0);
});

test('same native generated TopoDS cannot borrow the other projected axis ULP',()=>{
 const x=setup('W');
 const big=2**30,ulp=2**-22;
 // A genuine one-ULP v drift remains inside the existing 1e-6 mm
 // discovery radius; it still may not excuse any unrelated u drift.
 x.globalSegments=[{from:{u:0,v:big},to:{u:100,v:big+1000}}];
 x.globalNativeEdges=[native('front')];
 x.scopedNativeEdge=native('front');
 x.scopedSegment={from:{u:1e-10,v:big},to:{u:100,v:big+1000}};
 // Wide discovery tolerance still produces a candidate, but true IsSame
 // demands the independently constrained original u-axis binary64 ULP.
 assert.throws(()=>match(x),/inconsistent paper endpoints/);
 x.scopedSegment={from:{u:0,v:big+ulp},to:{u:100,v:big+1000}};
 const result=match(x);
 assert.deepEqual(result.globalDirectSameGeneratedTopoDSOrdinals,[0]);
 assert.equal(result.fullOriginalSourceParameterCoverageProven,false);
 assert.equal(result.engineeringLineStyle,'undetermined');
 assert.equal(result.signedV5Action,false);
});

test('consumer refuses invented or swapped whole-solid native source ordinals',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const original=match(setup('V'));
 for(const change of [
  {globalPaperCandidateOrdinals:[]},
  {globalPaperCandidateOrdinals:[1]},
  {globalPaperCandidateOrdinals:[0,0]},
  {globalPaperCandidateOrdinals:[0,9]},
  {paperCoincidenceAloneIsNotOriginalTopoDSHistory:false},
  {partnerCandidateDoesNotProveOriginalSourceHistory:false},
  {engineeringLineStyle:'visible-solid'},
  {nativePartnerOnlyCandidate:true}
 ])assert.throws(()=>audit({matches:[{...original,...change}],wholeSolidCounts:{
  'visible-sharp':3,'hidden-sharp':0
 }}),/unsigned actual native scoped match|nonexistent whole-solid/);
 const valid=audit({matches:[original],wholeSolidCounts:{
  'visible-sharp':3,'hidden-sharp':0
 }});
 assert.equal(valid.uniqueNativeClaims,1);
 assert.equal(valid.fullOriginalSourceHistoryCertified,false);
 assert.equal(valid.signedV5ActionCount,0);
});

test('native IsSame retains exact endpoints when finite source coordinates overflow binary64 hypot',()=>{
 const max=Number.MAX_VALUE;
 // Both received paper endpoints are finite. Their real geometric span
 // exceeds MAX_VALUE, so binary64 hypot is Infinity, not a collapsed edge.
 const x=setup('H');
 x.globalSegments=[{from:{u:-max,v:0},to:{u:max,v:0}}];
 x.globalNativeEdges=[native('front')];
 x.scopedSegment={from:{u:-max,v:0},to:{u:max,v:0}};
 assert.equal(Math.hypot(x.globalSegments[0].to.u-x.globalSegments[0].from.u,0),Infinity);
 const result=match(x);
 assert.deepEqual(result.globalDirectSameGeneratedTopoDSOrdinals,[0]);
 assert.equal(result.actualNativeScopedToGlobalGeneratedEdgeIsSameProven,true);
 assert.equal(result.fullOriginalSourceParameterCoverageProven,false);
 assert.equal(result.globalContinuousOcclusionProven,false);
 assert.equal(result.signedV5Action,false);
 // Native identity does not permit a paper endpoint to drift, even when
 // a giant source span would make a relative tolerance dangerously wide.
 const bad=setup('H');
 bad.globalSegments=x.globalSegments;
 bad.globalNativeEdges=x.globalNativeEdges;
 bad.scopedSegment={from:{u:-max,v:1e-6},to:{u:max,v:0}};
 assert.throws(()=>match(bad),/inconsistent paper endpoints/);
});
