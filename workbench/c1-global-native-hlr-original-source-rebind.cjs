'use strict';
/**
 * Rebind EVERY genuine WHOLE-SOLID generated OCJS HLR 2D sharp edge to the
 * independently filtered original TopoDS input-edge output (V/HCompound(S)).
 *
 * The earlier native original M0 3D source-class witness is joined by the
 * EXACT received binary64 whole-solid/scoped 2D segment endpoints, not by
 * tolerant paper overlap, a unique paper drawing, or made-up IsSame.
 * Distinguish unique original-filtered candidates from true native TopoDS
 * IsSame, ambiguous co-projected source aliases and missing global ordinals.
 * This is an unsigned necessary M4->M5 source-inventory gate only.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {nativeScopedPaperSegmentsSame}=
 require('../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))freeze(x);
 Object.freeze(o);
}return o;};
const valid=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
const eq=(a,b)=>a.u===b.u&&a.v===b.v;
const samePaper=(a,b)=>eq(a.from,b.from)&&eq(a.to,b.to)||
 eq(a.from,b.to)&&eq(a.to,b.from);
function auditC1WholeSolidNativeHLRSourceScopeRebinding({cad,views}={}){
 if(!cad||typeof cad.sourceGeometryId!=='string'||!cad.sourceGeometryId||
    !Number.isSafeInteger(cad.revision)||cad.revision<1||
    !views||typeof views!=='object')
  throw new TypeError('actual original TopoDS HLR and current M4 source binding required');
 const counts={wholeSolidNativeHLREdges:0,
  nativeOriginalSourceScopedCandidateClaims:0,
  wholeSolidEdgesWithNoOriginalNativeSourceClaim:0,
  wholeSolidEdgesWithMultipleOriginalSourceClaims:0,
  wholeSolidEdgesWithExactlyOneSourceScopedPaperClaim:0,
  wholeSolidEdgesWithNativeScopedIsSameIdentity:0,
  wholeSolidEdgesWithUniqueExactScopedPaperAndStrict3DClassBacking:0,
  wholeSolidEdgesWithUniqueExactScopedPaperAndBounded3DClassRounding:0,
  wholeSolidEdgesWithTolerantButNotExactScopedPaperRebinding:0,
  wholeSolidEdgesHeldForAmbiguityOrMissing3DClass:0};
 const byView={};
 for(const view of VIEWS){
  const scoped=cad.nativeSourceScopedSharpOutputByView?.[view],
   consumer=views[view];
  if(!scoped||!Array.isArray(scoped.rows)||
     !Array.isArray(consumer?.nativeScoped2D3DClassBindings)||
     !Array.isArray(cad.views?.[view])||
     !Array.isArray(cad.hiddenSharpViews?.[view]))
   throw new RangeError('missing genuine whole-solid and original filtered HLR source inventory');
  const sourceBind=new Map();
  for(const binding of consumer.nativeScoped2D3DClassBindings){
   if(binding?.view!==view||!binding.sourceEdgeId||
      sourceBind.has(binding.sourceEdgeId)||
      !Array.isArray(binding.rows)||binding.officialV5Authorized!==false||
      binding.globalGenerated2DEdgeToOriginalTopoDSIdentityCertified!==false)
    throw new RangeError('forged or duplicated native original 3D class source binding');
   sourceBind.set(binding.sourceEdgeId,binding);
  }
  const claims=new Map();
  for(const [visibility,global] of [
   ['visible-sharp',cad.views[view]],
   ['hidden-sharp',cad.hiddenSharpViews[view]]
  ]){
   if(global.length>256)throw new RangeError('unbounded native global HLR edge inventory');
   for(let ordinal=0;ordinal<global.length;ordinal++){
    const segment=global[ordinal];
    if(!valid(segment?.from)||!valid(segment?.to)||
       eq(segment.from,segment.to))
     throw new RangeError('invalid actual whole-solid native HLR edge');
    claims.set(visibility+'|'+ordinal,[]);
   }
  }
  for(const source of scoped.rows){
   const sourceEdgeId=source?.originalPhysicalSourceEdgeId;
   const bound=sourceBind.get(sourceEdgeId);
   if(typeof sourceEdgeId!=='string'||!sourceEdgeId||
      !Array.isArray(source.visible)||!Array.isArray(source.hidden))
    throw new RangeError('unbound genuine original TopoDS source row');
   // In full OCJS mode every source that emits 2D HLR must have an
   // uncollapsed original 3D->M4 projection and class/parameter audit.
   if((source.visible.length||source.hidden.length)&&!bound)
    throw new RangeError('original native 2D source emitted without verified 3D class');
   if(!bound)continue;
   const emitted=[...source.visible,...source.hidden];
   if(bound.rows.length!==emitted.length)
    throw new RangeError('genuine original source 2D/3D HLR class witness count changed');
   for(let i=0;i<emitted.length;i++){
    const witness=emitted[i],classRow=bound.rows[i],
     klass=witness.hlrClass,
     global=klass==='visible-sharp'?cad.views[view]:
      klass==='hidden-sharp'?cad.hiddenSharpViews[view]:null;
    if(!global||witness.view!==view||
       witness.originalPhysicalSourceEdgeId!==sourceEdgeId||
       classRow.view!==view||classRow.sourceEdgeId!==sourceEdgeId||
       classRow.hlrClass!==klass||classRow.signedV5Action!==false||
       classRow.actualGlobalHLRGenerated2DTopoDSHistoryCertified!==false||
       witness.signedV5Action!==false||
       !valid(witness.from)||!valid(witness.to)||
       !Array.isArray(witness.globalPaperCandidateOrdinals)||
       !Array.isArray(witness.globalDirectSameGeneratedTopoDSOrdinals)||
       witness.actualNativeScopedToGlobalGeneratedEdgeIsSameProven!==
        (witness.globalDirectSameGeneratedTopoDSOrdinals.length===1)||
       witness.globalDirectSameGeneratedTopoDSOrdinals.length>1)
     throw new RangeError('forged original filtered 2D HLR or native 3D class witness');
    const tested=new Set();
    for(const ordinal of witness.globalPaperCandidateOrdinals){
     if(!Number.isSafeInteger(ordinal)||ordinal<0||
        ordinal>=global.length||tested.has(ordinal))
      throw new RangeError('scoped native 2D claimed invalid or repeated global ordinal');
     tested.add(ordinal);
     const whole=global[ordinal];
     if(!nativeScopedPaperSegmentsSame(whole,witness))
      throw new RangeError('original native 2D filter not consistent with actual global paper');
     const direct=witness.globalDirectSameGeneratedTopoDSOrdinals.includes(ordinal);
     if(direct&&!classRow.nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment&&
        !classRow.generated2DRepresentationWithinOneULPOfFullOriginalM0Source)
      throw new RangeError('actual native direct IsSame edge lacks bounded original 3D support');
     claims.get(klass+'|'+ordinal).push({
      sourceEdgeId,view,hlrClass:klass,ordinal,
      actualNativeScopedToWholeSolidTopoDSIsSame:direct,
      globallyReceivedBinary64PaperExactlySameAsNativeScoped:
       samePaper(whole,witness),
      nativeOriginal3DStrictSameClassIntervalCoversReceivedPaper:
       classRow.nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment===true,
      nativeOriginal3DWholeSourceClassAndOneULPCompatible:
       classRow.generated2DRepresentationWithinOneULPOfFullOriginalM0Source===true,
      sourceScopedGenerated2DAlreadyHasProvenOriginalTopoDSHistory:false,
      actualWholeSolidGenerated2DOriginalTopoDSHistoryProven:false,
      fullOpaqueSceneFrontRayProven:false,
      engineeringLineStyle:'undetermined',signedV5Action:false
     });
     counts.nativeOriginalSourceScopedCandidateClaims++;
    }
    for(const ordinal of witness.globalDirectSameGeneratedTopoDSOrdinals)
     if(!tested.has(ordinal))
      throw new RangeError('native generated IsSame not included in whole-solid paper inventory');
   }
  }
  const rows=[];
  for(const [klass,global] of [
   ['visible-sharp',cad.views[view]],
   ['hidden-sharp',cad.hiddenSharpViews[view]]
  ])for(let ordinal=0;ordinal<global.length;ordinal++){
   const list=claims.get(klass+'|'+ordinal);
   const owners=[...new Set(list.map(x=>x.sourceEdgeId))];
   const direct=list.filter(x=>x.actualNativeScopedToWholeSolidTopoDSIsSame);
   if(direct.length>1||direct.length===1&&
      list.some(x=>x.actualNativeScopedToWholeSolidTopoDSIsSame&&
       x.sourceEdgeId!==direct[0].sourceEdgeId))
    throw new RangeError('one native generated edge cannot have conflicting direct TopoDS identities');
   const unique=owners.length===1&&list.length===1,
    candidate=unique?list[0]:null,
    exact3D=!!candidate?.nativeOriginal3DStrictSameClassIntervalCoversReceivedPaper,
    round3D=!!candidate?.nativeOriginal3DWholeSourceClassAndOneULPCompatible,
    paperExact=!!candidate?.globallyReceivedBinary64PaperExactlySameAsNativeScoped;
   counts.wholeSolidNativeHLREdges++;
   if(!owners.length)counts.wholeSolidEdgesWithNoOriginalNativeSourceClaim++;
   if(owners.length>1)counts.wholeSolidEdgesWithMultipleOriginalSourceClaims++;
   if(unique)counts.wholeSolidEdgesWithExactlyOneSourceScopedPaperClaim++;
   if(direct.length===1)counts.wholeSolidEdgesWithNativeScopedIsSameIdentity++;
   if(unique&&paperExact&&exact3D)
    counts.wholeSolidEdgesWithUniqueExactScopedPaperAndStrict3DClassBacking++;
   if(unique&&paperExact&&!exact3D&&round3D)
    counts.wholeSolidEdgesWithUniqueExactScopedPaperAndBounded3DClassRounding++;
   if(list.length&&!list.every(x=>
    x.globallyReceivedBinary64PaperExactlySameAsNativeScoped))
    counts.wholeSolidEdgesWithTolerantButNotExactScopedPaperRebinding++;
   if(!unique||!paperExact||!exact3D&&!round3D)
    counts.wholeSolidEdgesHeldForAmbiguityOrMissing3DClass++;
   rows.push({view,hlrClass:klass,wholeSolidGeneratedHLREdgeOrdinal:ordinal,
    originalSourceScopedCandidates:list,
    uniqueOriginalSourceFilteredPaperCandidate:unique?candidate.sourceEdgeId:null,
    exactlyOneNativeSourceScopedWitnessForWholeSolidEdge:unique,
    uniqueNativeScopedAndWholeSolidBinary64PaperEndpointsAgree:unique&&paperExact,
    exactSameClassNativeOriginal3DBackingForUniqueGlobalEdge:
     unique&&paperExact&&exact3D,
    boundedWholeOriginal3DRoundingBackingForUniqueGlobalEdge:
     unique&&paperExact&&!exact3D&&round3D,
    directNativeScopedGeneratedEdgeIsSameSource:
     direct.length===1?direct[0].sourceEdgeId:null,
    nativeIsSameIsNotGeneratedToOriginal3DTopoDSIdentity:true,
    wholeSolidHLRGeneratedToOriginalTopoDSHistoryCertified:false,
    globalSceneOpaqueFaceVisibilityCertified:false,
    true3DAllEndpointJunctionsCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false});
  }
  byView[view]=rows;
 }
 if(counts.wholeSolidNativeHLREdges!==
    counts.wholeSolidEdgesWithNoOriginalNativeSourceClaim+
    counts.wholeSolidEdgesWithExactlyOneSourceScopedPaperClaim+
    rowsAmbiguousTotal(byView))
  throw new RangeError('genuine whole-solid generated HLR source claim partition incomplete');
 return freeze({
  schema:'draftai-c1-global-native-generated-2d-to-original-filtered-source-evidence/1',
  sourceGeometryId:cad.sourceGeometryId,revision:cad.revision,
  counts,views:byView,
  nativeGenerated2DOutputVsOriginal3DSourceClassesJointlyAccounted:true,
  paperUniqueSourceFilterDoesNotImplyOriginalTopoDSHistory:true,
  actualGlobalGeneratedEdgeToOriginalTopoDSHistoryCertified:false,
  globalSceneM5OpaqueVisibilityCertified:false,
  officialV5Authorized:false,signedV5ActionCount:0
 });
}
function rowsAmbiguousTotal(views){
 return Object.values(views).flat().filter(row=>
  row.originalSourceScopedCandidates.length>1).length;
}
module.exports={auditC1WholeSolidNativeHLRSourceScopeRebinding};
