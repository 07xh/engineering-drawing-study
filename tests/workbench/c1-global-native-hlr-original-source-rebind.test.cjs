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
 const x=fixture();x.cad.views.W.push(segment());
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
