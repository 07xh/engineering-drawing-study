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
test('native IsSame rejects tolerant paper alias even when the native identity method says true',()=>{
 const {nativeScopedPaperSegmentsSame:paperCandidate}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 for(const view of ['V','H','W']){
  const x=setup(view);
  // 1e-7 mm was previously accepted as a scoped/global match because
  // the paper discovery tolerance is 1e-6 mm at this source span.
  x.scopedSegment={from:{u:0,v:1e-7},to:{u:10,v:1e-7}};
  assert.equal(paperCandidate(x.globalSegments[0],x.scopedSegment),true);
  assert.throws(()=>match(x),/native IsSame.*inconsistent paper/);
  // Reversing the paper stroke must not bypass the independent veto.
  x.scopedSegment={from:{u:10,v:1e-7},to:{u:0,v:1e-7}};
  assert.throws(()=>match(x),/native IsSame.*inconsistent paper/);
 }
});
test('scoped/global native IsSame accepts exact and one binary64 ULP paper agreement only as unsigned identity',()=>{
 for(const view of ['V','H','W']){
  const x=setup(view);
  x.scopedSegment={from:{u:0,v:0},
   to:{u:10+Number.EPSILON*8,v:0}};
  const r=match(x);
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
test('native global ordinal claim must belong to the same-run paper inventory and stay unsigned',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const genuine=match(setup('V'));
 assert.equal(audit({matches:[genuine],wholeSolidCounts:{
  'visible-sharp':3,'hidden-sharp':0}}).uniqueNativeClaims,1);
 for(const mutate of [
  x=>{x.globalPaperCandidateOrdinals=[1,2];},
  x=>{x.globalPaperCandidateOrdinals=[];},
  x=>{x.globalPaperCandidateOrdinals=[0,0];},
  x=>{x.globalPaperCandidateOrdinals=[-1,0];},
  x=>{x.paperCoincidenceAloneIsNotOriginalTopoDSHistory=false;},
  x=>{x.partnerCandidateDoesNotProveOriginalSourceHistory=false;},
  x=>{x.engineeringLineStyle='solid';},
  x=>{x.nativePartnerOnlyCandidate=true;}
 ]){
  const forged={...genuine,
   globalPaperCandidateOrdinals:[...genuine.globalPaperCandidateOrdinals],
   globalDirectSameGeneratedTopoDSOrdinals:
    [...genuine.globalDirectSameGeneratedTopoDSOrdinals]};
  mutate(forged);
  assert.throws(()=>audit({matches:[forged],wholeSolidCounts:{
   'visible-sharp':3,'hidden-sharp':0}}),/unsigned actual native scoped match/);
 }
 // Paper-only and native partner-only candidates remain diagnostic.
 const paperOnly=setup('W');paperOnly.scopedNativeEdge=native('unrelated');
 const held=match(paperOnly);
 assert.equal(audit({matches:[held]}).uniqueNativeClaims,0);
 assert.equal(audit({matches:[held]}).signedV5ActionCount,0);
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

test('same-run native HLR inventory bounds every unsigned paper-only candidate, not only IsSame',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const genuine=match(setup('V'));
 const counts={'visible-sharp':3,'hidden-sharp':0};
 assert.equal(audit({matches:[genuine],wholeSolidCounts:counts}).uniqueNativeClaims,1);
 // The real direct native identity 0 cannot excuse a forged extra paper
 // candidate 9: no such generated HLR edge exists in the measured output.
 const forged={...genuine,globalPaperCandidateOrdinals:[0,1,9]};
 assert.throws(()=>audit({matches:[forged],wholeSolidCounts:counts}),
  /paper candidate claims nonexistent whole-solid/);
 // A paper-only witness (without any native IsSame) must be bounded too.
 const x=setup('H');x.scopedNativeEdge=native('not-generated');
 const paperOnly=match(x);
 assert.deepEqual(paperOnly.globalDirectSameGeneratedTopoDSOrdinals,[]);
 assert.throws(()=>audit({matches:[paperOnly],wholeSolidCounts:{
  'visible-sharp':0,'hidden-sharp':0}}),
  /paper candidate claims nonexistent whole-solid/);
 // A class-specific inventory cannot borrow a valid ordinal from the
 // other visibility class; neither diagnostic can authorize V5.
 const wrongClass={...paperOnly,hlrClass:'hidden-sharp'};
 assert.throws(()=>audit({matches:[wrongClass],wholeSolidCounts:counts}),
  /paper candidate claims nonexistent whole-solid/);
 assert.equal(audit({matches:[paperOnly],wholeSolidCounts:counts}).signedV5ActionCount,0);
});

test('one native whole-solid inventory cannot mix V and W generated edge ordinals',()=>{
 const {auditC1ScopedHLRSourceIdentityConflicts:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 assert.throws(()=>audit({matches:[match(setup('V')),match(setup('W'))],
  wholeSolidCounts:{'visible-sharp':3,'hidden-sharp':0}}),
  /one HLR view/);
});

test('same-run global native 3D to generated 2D paper witness distinguishes exact, reversed and source-scale ULP rounding without TopoDS history',()=>{
 const {auditC1Global3D2DPaperPairEnvelope:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const source={from:{u:0,v:0},to:{u:3,v:2}};
 const exact=audit(source,structuredClone(source));
 assert.equal(exact.compatible,true);
 assert.equal(exact.exactBinary64Endpoints,true);
 assert.equal(exact.sourceScaleOneULPBoundedRoundingOnly,false);
 const reversed=audit(source,{from:source.to,to:source.from});
 assert.equal(reversed.exactBinary64Endpoints,true);
 const rounded=audit(source,{from:source.from,
  to:{u:3,v:2+Number.EPSILON*2}});
 assert.equal(rounded.compatible,true);
 assert.equal(rounded.exactBinary64Endpoints,false);
 assert.equal(rounded.sourceScaleOneULPBoundedRoundingOnly,true);
 assert.equal(rounded.originalGeneratedTopoDSHistoryCertified,false);
 assert.equal(rounded.engineeringLineStyle,'undetermined');
 assert.equal(rounded.signedV5Action,false);
 assert.ok(Object.isFrozen(rounded));
});
test('a unique but merely tolerance-close generated 2D HLR edge cannot borrow native 3D source history',()=>{
 const {auditC1Global3D2DPaperPairEnvelope:audit,
  nativeScopedPaperSegmentsSame:oldPaperCandidate}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const source={from:{u:0,v:0},to:{u:10,v:0}};
 const forged={from:{u:0,v:1e-7},to:{u:10,v:1e-7}};
 // Old discovery tolerance accepts the forged source, but the new
 // mandatory native 3D/2D binding must refuse its original owner.
 assert.equal(oldPaperCandidate(source,forged),true);
 const held=audit(source,forged);
 assert.equal(held.compatible,false);
 assert.equal(held.exactBinary64Endpoints,false);
 assert.equal(held.originalGeneratedTopoDSHistoryCertified,false);
 assert.equal(held.signedV5Action,false);
 const reversed={from:forged.to,to:forged.from};
 assert.equal(audit(source,reversed).compatible,false);
});
test('tiny positive HLR tails, distant paper aliases and invalid native 3D/2D endpoints remain fail closed',()=>{
 const {auditC1Global3D2DPaperPairEnvelope:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const tiny={from:{u:0,v:0},to:{u:Number.MIN_VALUE,v:0}};
 assert.equal(audit(tiny,structuredClone(tiny)).exactBinary64Endpoints,true);
 assert.equal(audit(tiny,{from:{u:0,v:0},to:{u:Number.MIN_VALUE,v:Number.MIN_VALUE}}).compatible,false);
 const far={from:{u:1e5,v:1e5},to:{u:1e5+1e-4,v:1e5}};
 assert.equal(audit(far,{from:{u:1e5,v:1e5+1e-8},
  to:{u:1e5+1e-4,v:1e5+1e-8}}).compatible,false);
 for(const pair of [
  {from:{u:0,v:0},to:{u:0,v:0}},
  {from:{u:NaN,v:0},to:{u:3,v:2}},
  {from:{u:0,v:0},to:{u:Infinity,v:0}},
  null
 ])assert.throws(()=>audit(far,pair),/noncollapsed finite/);
});

test('an unrelated huge paper axis cannot mask transverse drift on the small axis',()=>{
 const {auditC1Global3D2DPaperPairEnvelope:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 for(const axis of ['u','v']){
  const other=axis==='u'?'v':'u';
  const source={from:{u:0,v:0},to:{u:0,v:0}};
  source.from[axis]=0;source.to[axis]=1e6;
  source.from[other]=1e15;source.to[other]=1e15;
  const forged=structuredClone(source);
  forged.from[axis]+=0.0625;forged.to[axis]+=0.0625;
  const result=audit(source,forged);
  assert.equal(result.compatible,false,axis+' transverse drift');
  assert.equal(result.originalGeneratedTopoDSHistoryCertified,false);
  assert.equal(result.engineeringLineStyle,'undetermined');
  assert.equal(result.signedV5Action,false);
  const reversed={from:forged.to,to:forged.from};
  assert.equal(audit(source,reversed).compatible,false);
 }
});
test('coordinate-local ULP accepts genuine one-ULP endpoint rounding without signing HLR history',()=>{
 const {auditC1Global3D2DPaperPairEnvelope:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const source={from:{u:0,v:1e15},to:{u:1e6,v:1e15}};
 const rounded={from:{...source.from},to:{u:1e6+2**-33,v:1e15}};
 const result=audit(source,rounded);
 assert.equal(result.compatible,true);
 assert.equal(result.exactBinary64Endpoints,false);
 assert.equal(result.originalGeneratedTopoDSHistoryCertified,false);
 assert.equal(result.engineeringLineStyle,'undetermined');
 assert.equal(result.signedV5Action,false);
});

test('real pinned OCCT pcurve may round zero by one same-axis source-span ULP only',()=>{
 const {auditC1Global3D2DPaperPairEnvelope:audit}=
  require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
 const original={from:{u:5,v:23},to:{u:0,v:0}};
 const generated={from:{u:5,v:23},to:{u:0,v:-(2**-48)}};
 const result=audit(original,generated);
 assert.equal(result.compatible,true);
 assert.equal(result.exactBinary64Endpoints,false);
 assert.equal(result.originalGeneratedTopoDSHistoryCertified,false);
 assert.equal(result.engineeringLineStyle,'undetermined');
 assert.equal(result.signedV5Action,false);
 // This same V-scale must NOT justify an unrelated U-axis drift.
 assert.equal(audit(original,{from:original.from,
  to:{u:-1e-9,v:0}}).compatible,false);
});
