'use strict';
/**
 * Consume REAL source-scoped HLR extraction (original TopoDS input edge
 * filtered through OCCT) alongside the whole-solid V/H/W HLR result.
 * No guessed paper alias may be promoted to original TopoDS history:
 * native scoped IsSame is tracked separately, and original 3D source
 * parameter intervals and continuous M5 rays remain independent gates.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
function auditC1NativeScopedHLRSourceConsumer({geometry,cad}={}){
 if(typeof geometry?.id!=='string'||!geometry.id||
    !Array.isArray(geometry?.data?.edges)||!geometry.data.edges.length||
    !geometry.data.points||cad?.sourceGeometryId!==geometry.id||
    !Number.isSafeInteger(cad?.revision)||cad.revision<1)
  throw new TypeError('current C1 M0 geometry and real HLR revision required');
 const ids=geometry.data.edges.map(e=>{
  if(!Array.isArray(e)||e.length!==2||e[0]===e[1]||e.some(id=>
      typeof id!=='string'||!Object.hasOwn(geometry.data.points,id)))
   throw new RangeError('invalid original C1 physical source');
  const [a,b]=e.map(id=>geometry.data.points[id]);
  if(![a,b].every(p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k])))||
     ['x','y','z'].every(k=>a[k]===b[k]))
   throw new RangeError('nonfinite or degenerate original C1 3D source edge');
  return geometry.id+'::'+[...e].sort().join('|');
 });
 const expected=new Set(ids);
 if(expected.size!==ids.length)
  throw new RangeError('duplicate original M0 physical source edge');
 const valid=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
 const same=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v)<=1e-6;
 const views={},counts={originalSourceEdgesPerView:ids.length,
  nativeSourceScopedOutputEdges:0,nativeGeneratedIsSameMatches:0,
  paperOnlySourceScopedEdges:0,wholeSolidVisibleEdgesWithoutScopedSource:0,
  wholeSolidHiddenEdgesWithoutScopedSource:0,
  paperAliasedWholeSolidEdgesWithMultipleOriginalSources:0};
 for(const view of VIEWS){
  const scoped=cad.nativeSourceScopedSharpOutputByView?.[view],
   ds=cad.nativeHLRSourceHistoryAPISurfaceByView?.[view]?.originalDataStructureIndex;
  if(scoped?.schema!=='draftai-c1-ocjs-real-original-topods-scoped-hlr/1'||
     scoped.sourceEdgeCount!==ids.length||
     scoped.originalTopoDSEdgeIndexCheckedAgainstActualHLREdgeMap!==true||
     scoped.allScopedOutputsReboundToWholeSolidPaper!==true||
     scoped.fullGlobalGeneratedEdgeToOriginalSourceHistoryProven!==false||
     scoped.fullContinuousVisibilityProven!==false||
     scoped.signedV5ActionCount!==0||
     ds?.availability!=='real-native-edge-map-inspected'||
     ds.everyOriginalBRepSourcePresentInHLRDataStructure!==true||
     !Array.isArray(ds.indexedOriginalSources)||
     ds.indexedOriginalSources.length!==ids.length||
     !Array.isArray(scoped.rows)||scoped.rows.length!==ids.length)
   throw new RangeError('missing complete real OCCT source-scoped HLR/EdgeMap evidence');
  // A real OCCT EdgeMap is a bijection: two distinct original TopoDS
  // source edges cannot own the same one-based native index.
  const indexed=new Map(),nativeSourceIndices=new Set();
  for(const x of ds.indexedOriginalSources){
   if(!expected.has(x.originalPhysicalSourceEdgeId)||
      !Number.isSafeInteger(x.hlrDataStructureOneBasedEdgeIndex)||
      x.hlrDataStructureOneBasedEdgeIndex<1||
      x.directlySameOriginalTopoDSInputEdge!==true||
      indexed.has(x.originalPhysicalSourceEdgeId)||
      nativeSourceIndices.has(x.hlrDataStructureOneBasedEdgeIndex))
    throw new RangeError('stale or duplicated real native HLR source index');
   indexed.set(x.originalPhysicalSourceEdgeId,x.hlrDataStructureOneBasedEdgeIndex);
   nativeSourceIndices.add(x.hlrDataStructureOneBasedEdgeIndex);
  }
  const classes={
   visible:{global:cad.views?.[view],field:'visible'},
   hidden:{global:cad.hiddenSharpViews?.[view],field:'hidden'}
  };
  for(const item of Object.values(classes)){
   if(!Array.isArray(item.global)||item.global.length>128)
    throw new RangeError('invalid whole-solid HLR stroke inventory');
   item.sources=Array.from({length:item.global.length},()=>new Set());
   // Direct native IsSame is an identity, not a paper-only alias. A single
   // generated TopoDS edge may not certify two original sources or appear
   // twice in one visibility class.
   item.nativeOwners=new Map();
  }
  let total=0,direct=0,seen=new Set();
  for(const row of scoped.rows){
   const source=row?.originalPhysicalSourceEdgeId;
   if(!expected.has(source)||seen.has(source)||
      row.hlrDataStructureOneBasedEdgeIndex!==indexed.get(source))
    throw new RangeError('source-scoped HLR row is not the current original TopoDS');
   seen.add(source);
   for(const [klass,item] of Object.entries(classes)){
    const witnesses=row[item.field];
    if(!Array.isArray(witnesses)||witnesses.length>128)
     throw new RangeError('invalid original-source-filtered HLR class');
    for(const w of witnesses){
     const paper=w?.globalPaperCandidateOrdinals,
      native=w?.globalDirectSameGeneratedTopoDSOrdinals;
     if(w.view!==view||
        w.hlrClass!==(klass==='visible'?'visible-sharp':'hidden-sharp')||
        w.originalPhysicalSourceEdgeId!==source||
        !valid(w.from)||!valid(w.to)||
        !Array.isArray(paper)||paper.length===0||
        !Array.isArray(native)||native.length>1||
        w.actualNativeScopedToGlobalGeneratedEdgeIsSameProven!==
         (native.length===1)||
        w.fullOriginalSourceParameterCoverageProven!==false||
        w.globalContinuousOcclusionProven!==false||
        w.engineeringLineStyle!=='undetermined'||w.signedV5Action!==false)
      throw new RangeError('invalid unsigned OCCT source-scoped HLR witness');
     const ordinalSet=new Set();
     for(const ordinal of paper){
      if(!Number.isSafeInteger(ordinal)||ordinal<0||
         ordinal>=item.global.length||ordinalSet.has(ordinal))
       throw new RangeError('invalid or duplicate whole-solid HLR ordinal');
      ordinalSet.add(ordinal);
      const seg=item.global[ordinal];
      if(!valid(seg?.from)||!valid(seg?.to)||
         !Array.isArray(seg.projectedOriginalEdgeCandidates)||
         !seg.projectedOriginalEdgeCandidates.includes(source)||
         !(same(seg.from,w.from)&&same(seg.to,w.to)||
           same(seg.from,w.to)&&same(seg.to,w.from)))
       throw new RangeError('native original source filter contradicts whole-solid HLR physical source');
      item.sources[ordinal].add(source);
     }
     for(const ordinal of native){
      if(!ordinalSet.has(ordinal))
       throw new RangeError('native generated IsSame is not a matching whole-solid HLR ordinal');
      if(item.nativeOwners.has(ordinal))
       throw new RangeError('duplicate native generated HLR ordinal identity claim');
      item.nativeOwners.set(ordinal,source);
     }
     total++;direct+=native.length;
    }
   }
  }
  if(seen.size!==expected.size||
     total!==scoped.nativeSourceScopedOutputEdgeCount||
     direct!==scoped.nativeScopedToWholeSolidGeneratedIsSameCount||
     total-direct!==scoped.paperOnlyScopedOutputEdgeCount)
   throw new RangeError('native source-scoped HLR output accounting mismatch');
  counts.nativeSourceScopedOutputEdges+=total;
  counts.nativeGeneratedIsSameMatches+=direct;
  counts.paperOnlySourceScopedEdges+=total-direct;
  views[view]={};
  for(const [klass,item] of Object.entries(classes)){
   const rows=item.sources.map((sources,ordinal)=>({
    wholeSolidHLREdgeOrdinal:ordinal,
    original3DSourceCandidatesFromNativeFilter:[...sources].sort(),
    originalTopoDSHistoryProven:false,
    originalSourceParameterCoverageProven:false,
    continuousFrontRayProven:false,
    engineeringLineStyle:'undetermined',signedV5Action:false
   }));
   const missing=rows.filter(x=>
    !x.original3DSourceCandidatesFromNativeFilter.length).length;
   counts[klass==='visible'?'wholeSolidVisibleEdgesWithoutScopedSource':
    'wholeSolidHiddenEdgesWithoutScopedSource']+=missing;
   counts.paperAliasedWholeSolidEdgesWithMultipleOriginalSources+=
    rows.filter(x=>x.original3DSourceCandidatesFromNativeFilter.length>1).length;
   views[view][klass]=rows;
  }
 }
 return frozen({schema:'draftai-c1-real-source-scoped-hlr-m5-consumer/1',
  sourceGeometryId:geometry.id,revision:cad.revision,unit:'mm',
  views,counts,
  actualOriginalTopoDSSourceFilteredHLRConsumed:true,
  generatedToOriginalTopoDSFullHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,signedV5ActionCount:0});
}
module.exports={auditC1NativeScopedHLRSourceConsumer};
