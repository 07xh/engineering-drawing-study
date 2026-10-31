'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1WholeSolidNativeHLRSourceScopeRebinding:audit}=
 require('../../workbench/c1-global-native-hlr-original-source-rebind.cjs');
const source='g::A|B',other='g::C|D';
const segment=(shift=0)=>({
 from:{u:0,v:0},to:{u:12+shift,v:0},
 projectedOriginalEdgeCandidates:[source,other]
});
function fixture(){
 const cad={sourceGeometryId:'g',revision:4,views:{},
  hiddenSharpViews:{},nativeSourceScopedSharpOutputByView:{}};
 const views={};
 for(const view of ['V','H','W']){
  const full=segment();
  cad.views[view]=[full];
  cad.hiddenSharpViews[view]=[];
  const w={view,hlrClass:'visible-sharp',
   originalPhysicalSourceEdgeId:source,from:{...full.from},to:{...full.to},
   globalPaperCandidateOrdinals:[0],
   globalDirectSameGeneratedTopoDSOrdinals:[],
   actualNativeScopedToGlobalGeneratedEdgeIsSameProven:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  };
  cad.nativeSourceScopedSharpOutputByView[view]={
   rows:[{originalPhysicalSourceEdgeId:source,visible:[w],hidden:[]}]
  };
  views[view]={nativeScoped2D3DClassBindings:[{
   view,sourceEdgeId:source,officialV5Authorized:false,
   globalGenerated2DEdgeToOriginalTopoDSIdentityCertified:false,
   rows:[{view,sourceEdgeId:source,hlrClass:'visible-sharp',
    nativeScopedReceivedPaperFrom:{...w.from},
    nativeScopedReceivedPaperTo:{...w.to},
    nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment:true,
    generated2DRepresentationWithinOneULPOfFullOriginalM0Source:false,
    actualGlobalHLRGenerated2DTopoDSHistoryCertified:false,
    signedV5Action:false
   }]
  }]};
 }
 return {cad,views};
}
test('all whole-solid V/H/W generated 2D ordinals have unique exact native original-filtered source class witnesses',()=>{
 const x=fixture(),r=audit(x);
 assert.equal(r.counts.wholeSolidNativeHLREdges,3);
 assert.equal(r.counts.wholeSolidEdgesWithExactlyOneSourceScopedPaperClaim,3);
 assert.equal(r.counts.wholeSolidEdgesWithUniqueExactScopedPaperAndStrict3DClassBacking,3);
 assert.equal(r.counts.wholeSolidEdgesWithNativeScopedIsSameIdentity,0);
 for(const view of ['V','H','W']){
  const row=r.views[view][0];
  assert.equal(row.uniqueOriginalSourceFilteredPaperCandidate,source);
  assert.equal(row.exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge,true);
  assert.equal(row.wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified,false);
  assert.equal(row.signedV5Action,false);
 }
 assert.equal(r.officialV5Authorized,false);
 assert.ok(Object.isFrozen(r.views.V[0]));
});
test('two distinct original TopoDS source filters producing same global 2D paper stay ambiguous',()=>{
 const x=fixture(),v='V',
  first=x.cad.nativeSourceScopedSharpOutputByView[v].rows[0].visible[0];
 x.cad.nativeSourceScopedSharpOutputByView[v].rows.push({
  originalPhysicalSourceEdgeId:other,
  visible:[{...first,originalPhysicalSourceEdgeId:other}],hidden:[]
 });
 const base=x.views[v].nativeScoped2D3DClassBindings[0];
 x.views[v].nativeScoped2D3DClassBindings.push({
  ...base,sourceEdgeId:other,rows:base.rows.map(row=>({...row,sourceEdgeId:other}))
 });
 const r=audit(x);
 assert.equal(r.counts.wholeSolidEdgesWithMultipleOriginalSourceClaims,1);
 assert.equal(r.views.V[0].uniqueOriginalSourceFilteredPaperCandidate,null);
 assert.equal(r.views.V[0].exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge,false);
 assert.equal(r.views.V[0].originalSourceScopedCandidates.length,2);
 assert.equal(r.signedV5ActionCount,0);
});
test('same source but duplicate filtered HLR claims cannot fake a unique original generated edge',()=>{
 const x=fixture(),v='V',row=x.cad.nativeSourceScopedSharpOutputByView[v].rows[0];
 row.visible.push({...row.visible[0]});
 const binding=x.views[v].nativeScoped2D3DClassBindings[0];
 binding.rows.push({...binding.rows[0]});
 const r=audit(x);
 assert.equal(r.counts.wholeSolidEdgesWithMultipleOriginalSourceClaims,0);
 assert.equal(r.views.V[0].exactlyOneNativeSourceScopedWitnessForWholeSolidEdge,false);
 assert.equal(r.views.V[0].originalSourceScopedCandidates.length,2);
});
test('exact paper identity is stronger than tolerant native candidate and neither yields TopoDS history',()=>{
 const x=fixture(),v='V',w=x.cad.nativeSourceScopedSharpOutputByView[v].rows[0].visible[0];
 w.to={u:12-1e-7,v:0};
 x.views[v].nativeScoped2D3DClassBindings[0].rows[0].
  nativeScopedReceivedPaperTo={...w.to};
 const r=audit(x);
 assert.equal(r.counts.wholeSolidEdgesWithTolerantButNotExactScopedPaperRebinding,1);
 assert.equal(r.views.V[0].uniqueNativeScopedAndWholeSolidBinary64PaperEndpointsAgree,false);
 assert.equal(r.views.V[0].exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge,false);
 assert.equal(r.views.V[0].wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified,false);
});
test('one-ULP original source class compatibility is reported separately from exact 3D parametric proof',()=>{
 const x=fixture(),v='V',b=x.views[v].nativeScoped2D3DClassBindings[0].rows[0];
 b.nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment=false;
 b.generated2DRepresentationWithinOneULPOfFullOriginalM0Source=true;
 const r=audit(x);
 assert.equal(r.counts.wholeSolidEdgesWithUniqueExactScopedPaperAndStrict3DClassBacking,2);
 assert.equal(r.counts.wholeSolidEdgesWithUniqueExactScopedPaperAndBounded3DClassRounding,1);
 assert.equal(r.views.V[0].boundedWholeOriginal3DRoundingBackingForUniqueGlobalEdge,true);
 assert.equal(r.views.V[0].exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge,false);
 assert.equal(r.officialV5Authorized,false);
});
test('unclaimed whole-solid generated 2D edge never borrows another source-paper candidate',()=>{
 const x=fixture();x.cad.views.W.push(segment(1));
 const r=audit(x);
 assert.equal(r.counts.wholeSolidEdgesWithNoOriginalNativeSourceClaim,1);
 assert.equal(r.views.W[1].uniqueOriginalSourceFilteredPaperCandidate,null);
 assert.equal(r.views.W[1].engineeringLineStyle,'undetermined');
});
test('native IsSame from genuine scoped to whole-solid edge is distinct from ORIGINAL 3D source TShape history',()=>{
 const x=fixture(),w=x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0];
 w.globalDirectSameGeneratedTopoDSOrdinals=[0];
 w.actualNativeScopedToGlobalGeneratedEdgeIsSameProven=true;
 const r=audit(x);
 assert.equal(r.counts.wholeSolidEdgesWithNativeScopedIsSameIdentity,1);
 assert.equal(r.views.V[0].directNativeScopedGeneratedEdgeIsSameSource,source);
 assert.equal(r.views.V[0].nativeIsSameIsNotGeneratedToOriginal3DTopoDSIdentity,true);
 assert.equal(r.views.V[0].wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified,false);
});
test('M4/M5 independently rejects forged native direct IsSame paper alias despite tolerant candidate match',()=>{
 for(const view of ['V','H','W']){
  const x=fixture(),w=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
  w.globalDirectSameGeneratedTopoDSOrdinals=[0];
  w.actualNativeScopedToGlobalGeneratedEdgeIsSameProven=true;
  w.from={u:0,v:1e-7};w.to={u:12,v:1e-7};
  const cls=x.views[view].nativeScoped2D3DClassBindings[0].rows[0];
  cls.nativeScopedReceivedPaperFrom={...w.from};
  cls.nativeScopedReceivedPaperTo={...w.to};
  // The candidate is within the old 1e-6 discovery envelope; the
  // independent source consumer must reject the forged native claim.
  assert.throws(()=>audit(x),/forged native direct IsSame paper envelope/);
  // Reverse orientation does not change the physical requirement.
  w.from={u:12,v:1e-7};w.to={u:0,v:1e-7};
  cls.nativeScopedReceivedPaperFrom={...w.from};
  cls.nativeScopedReceivedPaperTo={...w.to};
  assert.throws(()=>audit(x),/forged native direct IsSame paper envelope/);
 }
});
test('M4/M5 accepts a one-ULP native direct IsSame endpoint only as unsigned provenance',()=>{
 const x=fixture(),w=x.cad.nativeSourceScopedSharpOutputByView.W.rows[0].visible[0];
 w.globalDirectSameGeneratedTopoDSOrdinals=[0];
 w.actualNativeScopedToGlobalGeneratedEdgeIsSameProven=true;
 w.to={u:12+Number.EPSILON*8,v:0};
 const cls=x.views.W.nativeScoped2D3DClassBindings[0].rows[0];
 cls.nativeScopedReceivedPaperTo={...w.to};
 const r=audit(x);
 assert.equal(r.counts.wholeSolidEdgesWithNativeScopedIsSameIdentity,1);
 assert.equal(r.views.W[0].nativeIsSameIsNotGeneratedToOriginal3DTopoDSIdentity,true);
 assert.equal(r.views.W[0].wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified,false);
 assert.equal(r.officialV5Authorized,false);
});
test('forged original source, mismatched 2D class and unsound ordinals are rejected',()=>{
 const mutate=[
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0].originalPhysicalSourceEdgeId=other;},
  x=>{x.views.V.nativeScoped2D3DClassBindings[0].rows[0].hlrClass='hidden-sharp';},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0].globalPaperCandidateOrdinals=[15];},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0].globalPaperCandidateOrdinals=[0,0];},
  x=>{x.views.V.nativeScoped2D3DClassBindings[0].rows[0].signedV5Action=true;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0].to={u:3,v:0};},
  x=>{x.views.V.nativeScoped2D3DClassBindings[0].rows=[];},
  x=>{x.views.V.nativeScoped2D3DClassBindings.push(x.views.V.nativeScoped2D3DClassBindings[0]);}
 ];
 for(const fn of mutate){
  const x=fixture();fn(x);
  assert.throws(()=>audit(x),/source|class|ordinal|paper|witness|duplicate|forged/i);
 }
});

test('native indexed original EdgeStatus plus scoped-to-global generated IsSame yields a positive causal filter witness',()=>{
 const x=fixture();
 for(const view of ['V','H','W']){
  x.cad.nativeHLRSourceHistoryAPISurfaceByView??={};
  const status={view,originalPhysicalSourceEdgeId:source,
   nativeHLROriginalEdgeMapIndex:1,originalSourceClass:'all-visible',
   originalEdgeStatusAllVisible:true,originalEdgeStatusAllHidden:false,
   nativeOriginalVisiblePartCount:1,
   sourceOriginalNativeParameterBoundsStillRequireSeparateCurveAudit:true,
   engineeringLineStyle:'undetermined',
   generated2DHLREdgeToOriginalSourceHistoryCertified:false,
   globalContinuousM5OcclusionCertified:false,signedV5Action:false};
  x.cad.nativeHLRSourceHistoryAPISurfaceByView[view]={
   originalDataStructureIndex:{edgeMapSourceBijectionVerified:true,
    indexedOriginalSources:[{originalPhysicalSourceEdgeId:source,
     hlrDataStructureOneBasedEdgeIndex:1}]},
   originalEdgeStatusAPI:{
    originalHLROpenSourceClassBoundToOriginalEdgeMap:true,
    nativeOriginalSourceEdgeStatusRows:[status]
   }
  };
 }
 const witness=x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0];
 witness.globalDirectSameGeneratedTopoDSOrdinals=[0];
 witness.actualNativeScopedToGlobalGeneratedEdgeIsSameProven=true;
 const out=audit(x);
 assert.equal(out.counts.wholeSolidGeneratedEdgesWithExactNativeSourceFilteredCausalWitness,1);
 assert.equal(out.views.V[0].exactNativeOriginalSourceFilterToGlobalGenerated2DCausalityCertified,true);
 assert.equal(out.views.V[0].nativeOriginalHLREdgeMapSourceStatusClass,'all-visible');
 assert.equal(out.views.V[0].nativeOriginalHLREdgeMapSourceIndex,1);
 assert.equal(out.views.V[0].wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified,false);
 assert.equal(out.views.V[0].generatedOriginalTopoDSParameterHistoryStillNotCertified,true);
 assert.equal(out.views.H[0].exactNativeOriginalSourceFilterToGlobalGenerated2DCausalityCertified,false);
 assert.equal(out.officialV5Authorized,false);
 // Original EdgeStatus is a stronger independent class check than
 // mere paper coincidence; contradictory original class must HOLD.
 const contrary=structuredClone(x);
 const wrong=contrary.cad.nativeHLRSourceHistoryAPISurfaceByView.V.
  originalEdgeStatusAPI.nativeOriginalSourceEdgeStatusRows[0];
 wrong.originalSourceClass='all-hidden';
 wrong.originalEdgeStatusAllVisible=false;
 wrong.originalEdgeStatusAllHidden=true;
 wrong.nativeOriginalVisiblePartCount=0;
 const held=audit(contrary);
 assert.equal(held.views.V[0].exactNativeOriginalSourceFilterToGlobalGenerated2DCausalityCertified,false);
 assert.equal(held.counts.wholeSolidDirectNativeSourceMatchesHeldForOriginalEdgeStatusMismatch,1);
 assert.equal(held.signedV5ActionCount,0);
 // A unique paper alias without native IsSame never earns a causal
 // generated-2D edge identity, even when the ORIGINAL source is visible.
 const paperOnly=structuredClone(x);
 paperOnly.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0].
  globalDirectSameGeneratedTopoDSOrdinals=[];
 paperOnly.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0].
  actualNativeScopedToGlobalGeneratedEdgeIsSameProven=false;
 assert.equal(audit(paperOnly).counts.
  wholeSolidGeneratedEdgesWithExactNativeSourceFilteredCausalWitness,0);
 for(const mutate of [
  y=>{y.cad.nativeHLRSourceHistoryAPISurfaceByView.V.originalEdgeStatusAPI.
   nativeOriginalSourceEdgeStatusRows[0].nativeHLROriginalEdgeMapIndex=2;},
  y=>{y.cad.nativeHLRSourceHistoryAPISurfaceByView.V.originalDataStructureIndex.
   indexedOriginalSources[0].originalPhysicalSourceEdgeId=other;},
  y=>{y.cad.nativeHLRSourceHistoryAPISurfaceByView.V.originalEdgeStatusAPI.
   originalHLROpenSourceClassBoundToOriginalEdgeMap=false;},
  y=>{y.cad.nativeHLRSourceHistoryAPISurfaceByView.V.originalEdgeStatusAPI.
   nativeOriginalSourceEdgeStatusRows[0].generated2DHLREdgeToOriginalSourceHistoryCertified=true;}
 ]){
  const forged=structuredClone(x);mutate(forged);
  assert.throws(()=>audit(forged),/native original HLR EdgeStatus|unverified original HLR EdgeStatus|forged native original HLR/);
 }
});

function withRealIndexedStatus(fixtureCase){
 for(const view of ['V','H','W']){
  fixtureCase.cad.nativeHLRSourceHistoryAPISurfaceByView??={};
  fixtureCase.cad.nativeHLRSourceHistoryAPISurfaceByView[view]={
   originalDataStructureIndex:{edgeMapSourceBijectionVerified:true,
    indexedOriginalSources:[{originalPhysicalSourceEdgeId:source,
     hlrDataStructureOneBasedEdgeIndex:1}]},
   originalEdgeStatusAPI:{
    originalHLROpenSourceClassBoundToOriginalEdgeMap:true,
    nativeOriginalSourceEdgeStatusRows:[{
     view,originalPhysicalSourceEdgeId:source,
     nativeHLROriginalEdgeMapIndex:1,
     originalSourceClass:'all-visible',
     originalEdgeStatusAllVisible:true,originalEdgeStatusAllHidden:false,
     nativeOriginalVisiblePartCount:1,
     sourceOriginalNativeParameterBoundsStillRequireSeparateCurveAudit:true,
     engineeringLineStyle:'undetermined',
     generated2DHLREdgeToOriginalSourceHistoryCertified:false,
     globalContinuousM5OcclusionCertified:false,signedV5Action:false
    }]
   }
  };
 }
 return fixtureCase;
}
test('exact original EdgeMap, native 3D class and source-filter output form one-to-one V/H/W global attribution without IsSame',()=>{
 const x=withRealIndexedStatus(fixture()),r=audit(x);
 assert.equal(r.counts.wholeSolidNativeHLREdges,3);
 assert.equal(r.counts.wholeSolidEdgesWithExactIndexedSourceFilterClassAttribution,3);
 assert.equal(r.allThreeViewsHaveExactOriginal3DBoundSourceFilterBijection,true);
 assert.equal(r.allThreeViewsHaveNativeSourceFilterAttributionWithExplicitHeldPaperDrift,true);
 assert.equal(r.counts.wholeSolidEdgesWithBoundedNative3DPaperDriftIndexedSourceFilterAttribution,0);
 for(const view of ['V','H','W']){
  const b=r.exactSourceFilterBijectionByView[view];
  assert.equal(b.completeExactSourceScopedToWholeSolidOutputBijectionProven,true);
  assert.equal(b.originalSourceFilteredGeneratedEdgeCount,1);
  assert.equal(b.uniqueScopedOutputEmissionCount,1);
  assert.equal(b.original3DParameterHistoryOnGenerated2DNotCertified,true);
  assert.equal(b.signedV5ActionCount,0);
  assert.equal(r.views[view][0].
   exactIndexedOriginal3DClassSourceFilterAttributionWithoutIsSame,true);
  assert.equal(r.views[view][0].exactIndexedSourceScopedEmissionIndex,0);
  assert.equal(r.views[view][0].exactNativeOriginalSourceFilterToGlobalGenerated2DCausalityCertified,false);
  assert.equal(r.views[view][0].wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified,false);
 }
 assert.equal(r.officialV5Authorized,false);
});
test('same-run native source filter keeps the bounded W paper drift as an attributed but UNPROVEN geometry',()=>{
 const x=withRealIndexedStatus(fixture());
 const w=x.views.W.nativeScoped2D3DClassBindings[0].rows[0];
 w.nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment=false;
 w.generated2DRepresentationWithinOneULPOfFullOriginalM0Source=true;
 const r=audit(x);
 assert.equal(r.counts.wholeSolidEdgesWithExactIndexedSourceFilterClassAttribution,2);
 assert.equal(r.counts.wholeSolidEdgesWithBoundedNative3DPaperDriftIndexedSourceFilterAttribution,1);
 assert.equal(r.allThreeViewsHaveExactOriginal3DBoundSourceFilterBijection,false);
 assert.equal(r.allThreeViewsHaveNativeSourceFilterAttributionWithExplicitHeldPaperDrift,true);
 assert.equal(r.exactSourceFilterBijectionByView.W.
  completeNativeIndexedSourceFilterAttributionIncludingHeldPaperDrift,true);
 assert.equal(r.exactSourceFilterBijectionByView.W.
  native3DBoundedPaperDriftHeldButSourceFilterAttributedCount,1);
 assert.equal(r.views.W[0].
  indexedOriginal3DSourceFilterAttributionWithExplicitBoundedPaperDriftHeld,true);
 assert.equal(r.views.W[0].exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge,false);
 assert.equal(r.views.W[0].wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified,false);
 assert.equal(r.views.W[0].engineeringLineStyle,'undetermined');
 assert.equal(r.officialV5Authorized,false);
});

test('source-filter/global bijection fails closed for duplicate source, partial global, bounded only and false native EdgeStatus',()=>{
 const cases=[
  x=>{
   const v=x.cad.nativeSourceScopedSharpOutputByView.V.rows[0];
   v.visible.push({...v.visible[0]});
   x.views.V.nativeScoped2D3DClassBindings[0].rows.push({
    ...x.views.V.nativeScoped2D3DClassBindings[0].rows[0]
   });
  },
  x=>{x.cad.views.H.push(segment(1));},
  x=>{const z=x.views.W.nativeScoped2D3DClassBindings[0].rows[0];
   z.nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment=false;
   z.generated2DRepresentationWithinOneULPOfFullOriginalM0Source=true;},
  x=>{const z=x.cad.nativeHLRSourceHistoryAPISurfaceByView.V.
    originalEdgeStatusAPI.nativeOriginalSourceEdgeStatusRows[0];
   z.originalSourceClass='all-hidden';
   z.originalEdgeStatusAllVisible=false;z.originalEdgeStatusAllHidden=true;
   z.nativeOriginalVisiblePartCount=0;}
 ];
 for(const mutate of cases){
  const x=withRealIndexedStatus(fixture());mutate(x);
  const r=audit(x);
  assert.equal(r.allThreeViewsHaveExactOriginal3DBoundSourceFilterBijection,false);
  assert.ok(['V','H','W'].some(view=>
   !r.exactSourceFilterBijectionByView[view].
    completeExactSourceScopedToWholeSolidOutputBijectionProven));
  assert.equal(r.officialV5Authorized,false);
  assert.equal(r.signedV5ActionCount,0);
 }
});

test('a legacy EdgeMap-only source audit may not inherit native EdgeStatus causality',()=>{
 const x=fixture();
 x.cad.nativeHLRSourceHistoryAPISurfaceByView={V:{
  originalDataStructureIndex:{edgeMapSourceBijectionVerified:true,
   indexedOriginalSources:[{originalPhysicalSourceEdgeId:source,
    hlrDataStructureOneBasedEdgeIndex:1}]}
 }};
 const witness=x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0];
 witness.globalDirectSameGeneratedTopoDSOrdinals=[0];
 witness.actualNativeScopedToGlobalGeneratedEdgeIsSameProven=true;
 const result=audit(x);
 assert.equal(result.counts.wholeSolidEdgesWithNativeScopedIsSameIdentity,1);
 assert.equal(result.counts.wholeSolidGeneratedEdgesWithExactNativeSourceFilteredCausalWitness,0);
 assert.equal(result.views.V[0].nativeOriginalHLREdgeMapSourceStatusClass,null);
 assert.equal(result.views.V[0].exactNativeOriginalSourceFilterToGlobalGenerated2DCausalityCertified,false);
 assert.equal(result.views.V[0].wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified,false);
 assert.equal(result.signedV5ActionCount,0);
});

function withSecondDistinctIndexedOriginalSource(x){
 const view='V',newSegment=segment(1);
 x.cad.views[view].push(newSegment);
 const original=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
 x.cad.nativeSourceScopedSharpOutputByView[view].rows.push({
  originalPhysicalSourceEdgeId:other,
  visible:[{...original,originalPhysicalSourceEdgeId:other,
   from:{...newSegment.from},to:{...newSegment.to},
   globalPaperCandidateOrdinals:[1]}],hidden:[]
 });
 const originalBinding=x.views[view].nativeScoped2D3DClassBindings[0];
 x.views[view].nativeScoped2D3DClassBindings.push({
  ...originalBinding,sourceEdgeId:other,
  rows:originalBinding.rows.map(row=>({...row,sourceEdgeId:other,
   nativeScopedReceivedPaperFrom:{...newSegment.from},
   nativeScopedReceivedPaperTo:{...newSegment.to}}))
 });
 const ledger=x.cad.nativeHLRSourceHistoryAPISurfaceByView[view];
 ledger.originalDataStructureIndex.indexedOriginalSources.push({
  originalPhysicalSourceEdgeId:other,hlrDataStructureOneBasedEdgeIndex:2
 });
 ledger.originalEdgeStatusAPI.nativeOriginalSourceEdgeStatusRows.push({
  ...ledger.originalEdgeStatusAPI.nativeOriginalSourceEdgeStatusRows[0],
  originalPhysicalSourceEdgeId:other,nativeHLROriginalEdgeMapIndex:2
 });
 return x;
}
test('V/H/W source inventories must be the same reviewed original solid before any all-view attribution',()=>{
 const genuine=audit(withRealIndexedStatus(fixture()));
 assert.equal(genuine.allThreeViewsShareExactOriginalPhysicalSourceInventory,true);
 assert.equal(genuine.allThreeViewsHaveExactOriginal3DBoundSourceFilterBijection,true);
 assert.equal(genuine.allThreeViewsHaveNativeSourceFilterAttributionWithExplicitHeldPaperDrift,true);
 // Every individual view has a locally valid exact source/filter bijection,
 // but the V view has a second original input edge absent from H and W.
 // A conjunction of three independent per-view booleans is not a
 // whole-solid source-identity proof.
 const mixed=audit(withSecondDistinctIndexedOriginalSource(withRealIndexedStatus(fixture())));
 for(const view of ['V','H','W'])
  assert.equal(mixed.exactSourceFilterBijectionByView[view].
   completeExactSourceScopedToWholeSolidOutputBijectionProven,true);
 assert.equal(mixed.allThreeViewsShareExactOriginalPhysicalSourceInventory,false);
 assert.equal(mixed.allThreeViewsHaveExactOriginal3DBoundSourceFilterBijection,false);
 assert.equal(mixed.allThreeViewsHaveNativeSourceFilterAttributionWithExplicitHeldPaperDrift,false);
 assert.equal(mixed.officialV5Authorized,false);
 // Even matching source sets cannot be borrowed by another geometry ID.
 const foreign=withRealIndexedStatus(fixture());
 foreign.cad.sourceGeometryId='foreign-geometry';
 const foreignResult=audit(foreign);
 assert.equal(foreignResult.allThreeViewsShareExactOriginalPhysicalSourceInventory,false);
 assert.equal(foreignResult.allThreeViewsHaveExactOriginal3DBoundSourceFilterBijection,false);
 assert.equal(foreignResult.signedV5ActionCount,0);
 // A three-view empty HLR ledger is not an authenticated physical solid:
 // otherwise all three per-view completeness booleans pass vacuously.
 const empty=withRealIndexedStatus(fixture());
 for(const view of ['V','H','W']){
  empty.cad.views[view]=[];
  empty.cad.nativeSourceScopedSharpOutputByView[view].rows=[];
  empty.views[view].nativeScoped2D3DClassBindings=[];
  const ledger=empty.cad.nativeHLRSourceHistoryAPISurfaceByView[view];
  ledger.originalDataStructureIndex.indexedOriginalSources=[];
  ledger.originalEdgeStatusAPI.nativeOriginalSourceEdgeStatusRows=[];
 }
 const noSolid=audit(empty);
 assert.equal(noSolid.allThreeViewsShareExactOriginalPhysicalSourceInventory,false);
 assert.equal(noSolid.allThreeViewsHaveExactOriginal3DBoundSourceFilterBijection,false);
 assert.equal(noSolid.allThreeViewsHaveNativeSourceFilterAttributionWithExplicitHeldPaperDrift,false);
 assert.equal(noSolid.officialV5Authorized,false);
});
test('two real source filters require distinct positive integer native EdgeMap indices before causal attribution',()=>{
 const valid=withSecondDistinctIndexedOriginalSource(withRealIndexedStatus(fixture()));
 const accepted=audit(valid);
 assert.equal(accepted.exactSourceFilterBijectionByView.V.
  completeExactSourceScopedToWholeSolidOutputBijectionProven,true);
 assert.equal(accepted.views.V.length,2);
 assert.equal(accepted.views.V[1].nativeOriginalHLREdgeMapSourceIndex,2);
 for(const badIndex of [1,0,-1,1.5,3,'2',null,undefined,Number.MAX_SAFE_INTEGER+1]){
  const forged=structuredClone(valid);
  forged.cad.nativeHLRSourceHistoryAPISurfaceByView.V.
   originalDataStructureIndex.indexedOriginalSources[1].
   hlrDataStructureOneBasedEdgeIndex=badIndex;
  forged.cad.nativeHLRSourceHistoryAPISurfaceByView.V.
   originalEdgeStatusAPI.nativeOriginalSourceEdgeStatusRows[1].
   nativeHLROriginalEdgeMapIndex=badIndex;
  assert.throws(()=>audit(forged),/non-bijective original HLR EdgeStatus source index/);
 }
 const duplicateId=structuredClone(valid);
 duplicateId.cad.nativeHLRSourceHistoryAPISurfaceByView.V.
  originalDataStructureIndex.indexedOriginalSources[1].
  originalPhysicalSourceEdgeId=source;
 assert.throws(()=>audit(duplicateId),/non-bijective original HLR EdgeStatus source index/);
});
test('global ordinal cannot borrow same-class 3D evidence from a different scoped paper emission',()=>{
 const x=withRealIndexedStatus(fixture());
 const witness=x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0];
 // A forged generated segment still matches the whole-solid paper,
 // but the independent native 2D/3D class proof belongs to another edge.
 const binding=x.views.V.nativeScoped2D3DClassBindings[0].rows[0];
 binding.nativeScopedReceivedPaperTo={u:11,v:0};
 assert.throws(()=>audit(x),/forged original filtered 2D HLR or native 3D class witness/);
 const moved=fixture();
 moved.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0].to={u:12-1e-7,v:0};
 assert.throws(()=>audit(moved),/forged original filtered 2D HLR or native 3D class witness/);
 const valid=fixture();
 const r=audit(valid);
 assert.equal(r.views.V[0].exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge,true);
 assert.equal(r.officialV5Authorized,false);
});
test('original native EdgeStatus must carry non-contradictory boolean visibility classes',()=>{
 const valid=withRealIndexedStatus(fixture());
 for(const [visible,hidden] of [[true,true],[1,false],[false,0],[null,false]]){
  const forged=structuredClone(valid);
  const status=forged.cad.nativeHLRSourceHistoryAPISurfaceByView.V.
   originalEdgeStatusAPI.nativeOriginalSourceEdgeStatusRows[0];
  status.originalEdgeStatusAllVisible=visible;
  status.originalEdgeStatusAllHidden=hidden;
  assert.throws(()=>audit(forged),/forged native original HLR EdgeStatus/);
 }
 const mixed=structuredClone(valid);
 const status=mixed.cad.nativeHLRSourceHistoryAPISurfaceByView.V.
  originalEdgeStatusAPI.nativeOriginalSourceEdgeStatusRows[0];
 status.originalSourceClass='mixed';
 status.originalEdgeStatusAllVisible=false;
 status.originalEdgeStatusAllHidden=false;
 assert.equal(audit(mixed).views.V[0].
  exactNativeOriginalSourceFilterToGlobalGenerated2DCausalityCertified,false);
 assert.equal(audit(mixed).officialV5Authorized,false);
});

test('native original EdgeStatus part-count and unsigned-source obligations cannot be forged',()=>{
 const valid=withRealIndexedStatus(fixture());
 assert.equal(audit(valid).views.V[0].exactIndexedOriginal3DClassSourceFilterAttributionWithoutIsSame,true);
 const forged=[
  row=>{row.nativeOriginalVisiblePartCount=0;},
  row=>{row.nativeOriginalVisiblePartCount=2;},
  row=>{row.nativeOriginalVisiblePartCount=-1;},
  row=>{row.nativeOriginalVisiblePartCount=1.5;},
  row=>{delete row.nativeOriginalVisiblePartCount;},
  row=>{row.sourceOriginalNativeParameterBoundsStillRequireSeparateCurveAudit=false;},
  row=>{row.engineeringLineStyle='solid';},
  row=>{row.originalSourceClass='all-hidden';row.originalEdgeStatusAllVisible=false;
   row.originalEdgeStatusAllHidden=true;row.nativeOriginalVisiblePartCount=1;},
  row=>{row.originalSourceClass='mixed';row.originalEdgeStatusAllVisible=false;
   row.originalEdgeStatusAllHidden=false;row.nativeOriginalVisiblePartCount=0;}
 ];
 for(const mutate of forged){
  const x=structuredClone(valid);
  const row=x.cad.nativeHLRSourceHistoryAPISurfaceByView.V.originalEdgeStatusAPI.
   nativeOriginalSourceEdgeStatusRows[0];
  mutate(row);
  assert.throws(()=>audit(x),/forged native original HLR EdgeStatus/);
 }
 const held=structuredClone(valid);
 const row=held.cad.nativeHLRSourceHistoryAPISurfaceByView.V.originalEdgeStatusAPI.
  nativeOriginalSourceEdgeStatusRows[0];
 row.originalSourceClass='all-hidden';row.originalEdgeStatusAllVisible=false;
 row.originalEdgeStatusAllHidden=true;row.nativeOriginalVisiblePartCount=0;
 const out=audit(held);
 assert.equal(out.views.V[0].exactIndexedOriginal3DClassSourceFilterAttributionWithoutIsSame,false);
 assert.equal(out.officialV5Authorized,false);
});

test('duplicated original TopoDS source-filter rows and orphan 3D bindings fail closed',()=>{
 const duplicate=fixture();
 duplicate.cad.nativeSourceScopedSharpOutputByView.V.rows.push({
  originalPhysicalSourceEdgeId:source,visible:[],hidden:[]
 });
 assert.throws(()=>audit(duplicate),/duplicate or invalid original TopoDS source-filter inventory/);
 const orphan=fixture();
 orphan.views.V.nativeScoped2D3DClassBindings.push({
  view:'V',sourceEdgeId:other,rows:[],officialV5Authorized:false,
  globalGenerated2DEdgeToOriginalTopoDSIdentityCertified:false
 });
 assert.throws(()=>audit(orphan),/forged or duplicated native original 3D class source binding/);
});
test('indexed native EdgeMap cannot launder a duplicated scoped source into complete V/H/W attribution',()=>{
 const x=withSecondDistinctIndexedOriginalSource(withRealIndexedStatus(fixture()));
 const v=x.cad.nativeSourceScopedSharpOutputByView.V;
 v.rows[1].originalPhysicalSourceEdgeId=source;
 assert.throws(()=>audit(x),/duplicate or invalid original TopoDS source-filter inventory/);
 assert.equal(audit(withSecondDistinctIndexedOriginalSource(withRealIndexedStatus(fixture()))).
  exactSourceFilterBijectionByView.V.completeExactSourceScopedToWholeSolidOutputBijectionProven,true);
});

test('all same-paper global ordinals must be enumerated: truncated candidate sets cannot fabricate source bijection',()=>{
 const x=fixture();
 // Two distinct native generated edges may have identical paper endpoints.
 // The real native matcher would return both ordinals for this scoped edge.
 x.cad.views.V.push(segment());
 assert.throws(()=>audit(x),/incomplete or reordered native scoped\/global paper candidate inventory/);
 const full=structuredClone(x);
 full.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0].
  globalPaperCandidateOrdinals=[0,1];
 const out=audit(full);
 assert.equal(out.views.V[0].exactlyOneNativeSourceScopedWitnessForWholeSolidEdge,true);
 assert.equal(out.views.V[1].exactlyOneNativeSourceScopedWitnessForWholeSolidEdge,true);
 assert.equal(out.exactSourceFilterBijectionByView.V.
  completeExactSourceScopedToWholeSolidOutputBijectionProven,false);
 assert.equal(out.officialV5Authorized,false);
 const swapped=structuredClone(full);
 swapped.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0].
  globalPaperCandidateOrdinals=[1,0];
 assert.throws(()=>audit(swapped),/incomplete or reordered native scoped\/global paper candidate inventory/);
});

test('two original sources cannot fabricate complete bijection by partitioning coincident global paper edges',()=>{
 const x=withSecondDistinctIndexedOriginalSource(withRealIndexedStatus(fixture()));
 const global=x.cad.views.V;
 // Two distinct whole-solid TopoDS generated edges have identical paper.
 global[1]={...global[0],from:{...global[0].from},to:{...global[0].to}};
 const scoped=x.cad.nativeSourceScopedSharpOutputByView.V.rows[1].visible[0];
 scoped.from={...global[1].from};
 scoped.to={...global[1].to};
 const proof=x.views.V.nativeScoped2D3DClassBindings[1].rows[0];
 proof.nativeScopedReceivedPaperFrom={...scoped.from};
 proof.nativeScopedReceivedPaperTo={...scoped.to};
 // Both lists are truncated to a disjoint singleton. Before the fix,
 // this fabricated exact 2/2 source-output bijection from 2D aliases.
 assert.throws(()=>audit(x),/incomplete or reordered native scoped\/global paper candidate inventory/);
 const complete=structuredClone(x);
 for(const row of complete.cad.nativeSourceScopedSharpOutputByView.V.rows)
  row.visible[0].globalPaperCandidateOrdinals=[0,1];
 const out=audit(complete);
 assert.equal(out.counts.wholeSolidEdgesWithMultipleOriginalSourceClaims,2);
 assert.equal(out.exactSourceFilterBijectionByView.V.
  completeExactSourceScopedToWholeSolidOutputBijectionProven,false);
 assert.equal(out.allThreeViewsHaveExactOriginal3DBoundSourceFilterBijection,false);
 assert.equal(out.signedV5ActionCount,0);
});
